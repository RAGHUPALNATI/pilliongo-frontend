'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notificationAPI } from '@/lib/api';
import { usePolling, POLL_MS } from '@/hooks/usePolling';
import {
  Bell,
  Check,
  Navigation,
  CheckCircle2,
  XCircle,
  MessageSquare,
  MapPin,
  ShieldAlert,
  IndianRupee,
  Clock,
} from 'lucide-react';

// Bell icon + dropdown for the in-app notification center. Deliberately
// polls the lightweight /unread-count endpoint on a slow interval and only
// fetches the full list when the dropdown is actually opened — this reuses
// the app's existing polling pattern without adding much extra traffic.
const TYPE_ICON = {
  RIDE_ACCEPTED: Check,
  RIDE_STARTED: Navigation,
  RIDE_COMPLETED: CheckCircle2,
  RIDE_CANCELLED: XCircle,
  RIDE_PAID: IndianRupee,
  SUPPORT_REPLY: MessageSquare,
  LOCATION_APPROVED: MapPin,
  LOCATION_REJECTED: MapPin,
  SOS_ALERT: ShieldAlert,
};

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const refreshUnreadCount = async () => {
    try {
      const count = await notificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      // Silent — this polls constantly in the background, a transient
      // failure shouldn't spam toasts.
    }
  };

  useEffect(() => {
    refreshUnreadCount();
  }, []);

  usePolling(refreshUnreadCount, POLL_MS.notifications);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const openDropdown = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setLoading(true);
      try {
        const list = await notificationAPI.getAll();
        setNotifications(list);
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
  };

  const handleItemClick = async (n) => {
    if (!n.read) {
      try {
        await notificationAPI.markRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        // ignore
      }
    }
    setIsOpen(false);
    if (n.relatedRideId) {
      router.push(`/ride/${n.relatedRideId}`);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  };

  const timeAgo = (value) => {
    if (!value) return '';
    const diffMs = Date.now() - new Date(value).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={openDropdown}
        className="relative p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-orange text-white text-[9px] font-extrabold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto bg-white/95 backdrop-blur-2xl border border-black/10 rounded-2xl shadow-glass-lg z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 sticky top-0 bg-white/95 backdrop-blur-2xl rounded-t-2xl">
            <h4 className="font-bold text-sm text-brand-navy">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-brand-orange hover:text-brand-orange-hover"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-ink-900/40">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-xs text-ink-900/40 flex flex-col items-center gap-2">
              <Clock className="w-5 h-5 text-ink-900/20" />
              Nothing yet — ride updates and replies will show up here.
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-black/[0.02] transition-colors ${
                      !n.read ? 'bg-brand-orange/[0.04]' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        !n.read ? 'bg-brand-orange text-white' : 'bg-black/5 text-ink-900/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-snug ${!n.read ? 'font-bold text-brand-navy' : 'text-ink-900/60'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-ink-900/35 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand-orange shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
