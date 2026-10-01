'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supportAPI, locationRequestAPI, locationAPI, LOCATIONS } from '@/lib/api';
import Button from '@/components/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Select, Input, Textarea } from '@/components/Input';
import Alert from '@/components/Alert';
import EmptyState from '@/components/EmptyState';
import {
  Mail,
  MessageSquare,
  Clock,
  Send,
  MapPin,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  Inbox,
} from 'lucide-react';

const SUPPORT_EMAIL = 'pilliongo.app@gmail.com';

function MiniBadge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-black/5 text-ink-900/60',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    rose: 'bg-rose-100 text-rose-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

export default function HelpPage() {
  const { user, isAuthenticated, showToast } = useAuth();
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';
  const [topTab, setTopTab] = useState('SUPPORT'); // 'SUPPORT' | 'ROUTE'

  const [allLocations, setAllLocations] = useState(LOCATIONS);
  useEffect(() => {
    locationAPI.getAll().then(setAllLocations).catch(() => {});
  }, []);

  /* ----- Contact Support ----- */
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submittingMsg, setSubmittingMsg] = useState(false);
  const [myMessages, setMyMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const loadMyMessages = async () => {
    if (!isAuthenticated) return;
    setLoadingMsgs(true);
    try {
      const msgs = await supportAPI.getMyMessages();
      setMyMessages(msgs);
    } catch (err) {
      console.error('Error loading support messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    loadMyMessages();
  }, [isAuthenticated]);

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please login to send an in-app message', 'error');
      return;
    }
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill in both subject and message', 'error');
      return;
    }

    setSubmittingMsg(true);
    try {
      await supportAPI.submitMessage(subject.trim(), message.trim());
      showToast("Message sent! We'll reply within 1-2 hours.", 'success');
      setSubject('');
      setMessage('');
      loadMyMessages();
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSubmittingMsg(false);
    }
  };

  /* ----- Request a New Route ----- */
  const [reqFrom, setReqFrom] = useState('LPU University Main Gate');
  const [reqTo, setReqTo] = useState('');
  const [reqFare, setReqFare] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  const loadMyRequests = async () => {
    if (!isAuthenticated) return;
    setLoadingReqs(true);
    try {
      const reqs = await locationRequestAPI.getMyRequests();
      setMyRequests(reqs);
    } catch (err) {
      console.error('Error loading location requests:', err);
    } finally {
      setLoadingReqs(false);
    }
  };

  useEffect(() => {
    loadMyRequests();
  }, [isAuthenticated]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please login to request a new route', 'error');
      return;
    }
    if (!reqFrom.trim() || !reqTo.trim()) {
      showToast('Please fill in both locations', 'error');
      return;
    }
    if (reqFrom.trim().toLowerCase() === reqTo.trim().toLowerCase()) {
      showToast('From and to locations cannot be the same', 'error');
      return;
    }
    const fareNum = Number(reqFare);
    if (!reqFare || isNaN(fareNum) || fareNum <= 0) {
      showToast('Please enter a valid suggested fare', 'error');
      return;
    }

    setSubmittingReq(true);
    try {
      await locationRequestAPI.submitRequest(reqFrom.trim(), reqTo.trim(), fareNum, reqNotes.trim());
      showToast('Route request sent to the developer for review!', 'success');
      setReqTo('');
      setReqFare('');
      setReqNotes('');
      loadMyRequests();
    } catch (err) {
      showToast(err.message || 'Failed to submit route request', 'error');
    } finally {
      setSubmittingReq(false);
    }
  };

  const statusBadge = (status) => {
    const s = String(status).toUpperCase();
    if (s === 'OPEN' || s === 'PENDING') return <MiniBadge tone="amber">{s === 'OPEN' ? 'Awaiting Reply' : 'Pending Review'}</MiniBadge>;
    if (s === 'REPLIED') return <MiniBadge tone="emerald">Replied</MiniBadge>;
    if (s === 'APPROVED') return <MiniBadge tone="emerald">Approved</MiniBadge>;
    if (s === 'REJECTED') return <MiniBadge tone="rose">Rejected</MiniBadge>;
    return <MiniBadge>{s}</MiniBadge>;
  };

  return (
    <div className="space-y-12 pb-16">
      <datalist id="help-known-locations">
        {allLocations.map((loc) => (
          <option key={loc} value={loc} />
        ))}
      </datalist>

      {/* HERO */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-ink-900 via-ink-950 to-ink-950 text-white">
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-brand-orange/15 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-brand-orange" /> Help & Support
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {isAdmin ? "You're the admin here." : "We're here to help."}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            {isAdmin
              ? 'Support messages and route requests from users all come to you — manage and reply to them from the Admin Portal.'
              : 'Email us anytime, or send an in-app message and track the reply right here. Either way, we typically respond within 1-2 hours.'}
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-colors w-fit"
          >
            <Mail className="w-4.5 h-4.5 text-brand-orange" />
            <span className="text-sm font-bold">{SUPPORT_EMAIL}</span>
          </a>

          {!isAdmin && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-fit">
              <button
                onClick={() => setTopTab('SUPPORT')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  topTab === 'SUPPORT' ? 'bg-brand-orange text-white shadow-glow-brand' : 'text-slate-300 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Contact Support
              </button>
              <button
                onClick={() => setTopTab('ROUTE')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  topTab === 'ROUTE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <MapPin className="w-4 h-4" /> Request a New Route
              </button>
            </div>
          )}
        </div>
      </section>

      {isAdmin ? (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-navy text-brand-orange flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-navy">Manage from the Admin Portal</h3>
                <p className="text-xs text-ink-900/50">This page is for users asking you for help — as admin, you resolve those, not send them.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/admin?tab=support"
                className="flex items-center gap-3 p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/20 hover:bg-brand-orange/10 transition-colors"
              >
                <Inbox className="w-5 h-5 text-brand-orange shrink-0" />
                <div>
                  <p className="text-sm font-bold text-brand-navy">Support Inbox</p>
                  <p className="text-[11px] text-ink-900/50">View, reply to, and delete user messages</p>
                </div>
              </Link>
              <Link
                href="/admin?tab=locationRequests"
                className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-brand-navy">Route Requests</p>
                  <p className="text-[11px] text-ink-900/50">Approve or reject new route suggestions</p>
                </div>
              </Link>
            </div>
          </Card>
        </section>
      ) : (
        <>
      {!isAuthenticated && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="info" title="Login to send a message or track replies">
            You can always email us directly at {SUPPORT_EMAIL} — no login needed. To send an in-app message or request a new
            route (and see our reply here), please{' '}
            <Link href="/login" className="font-bold underline">
              login
            </Link>{' '}
            first.
          </Alert>
        </div>
      )}

      {topTab === 'SUPPORT' ? (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className={!isAuthenticated ? 'opacity-60 pointer-events-none' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-orange" /> Send an In-App Message
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> We usually reply within 1-2 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitMessage} className="space-y-4">
                <Input
                  label="Subject"
                  placeholder="e.g. Payment issue, Account help, Bug report..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <Textarea
                  label="Message"
                  rows={5}
                  placeholder="Tell us what's going on..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={submittingMsg} icon={Send}>
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-navy px-1">Your Messages</h3>
            {!isAuthenticated ? (
              <Card>
                <EmptyState icon={MessageSquare} title="Login to see your messages" description="Your sent messages and our replies will show up here." />
              </Card>
            ) : loadingMsgs ? (
              <Card className="p-8 text-center text-sm text-ink-900/40">Loading...</Card>
            ) : myMessages.length === 0 ? (
              <Card>
                <EmptyState icon={MessageSquare} title="No messages yet" description="Send your first message using the form." />
              </Card>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {myMessages.map((msg) => (
                  <div key={msg.id} className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-black/10 shadow-glass-sm space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-brand-navy truncate">{msg.subject}</h4>
                      {statusBadge(msg.status)}
                    </div>
                    <p className="text-xs text-ink-900/60">{msg.message}</p>
                    {msg.adminReply && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
                        <p className="font-bold mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PillionGo Support replied:
                        </p>
                        <p>{msg.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className={!isAuthenticated ? 'opacity-60 pointer-events-none' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-orange" /> Request a New Route
              </CardTitle>
              <CardDescription>Don't see your place-to-place route? Suggest it — we'll review and add it as a fixed fare.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="From (new or existing place)"
                    icon={MapPin}
                    list="help-known-locations"
                    placeholder="e.g. Green Avenue Society"
                    value={reqFrom}
                    onChange={(e) => setReqFrom(e.target.value)}
                  />
                  <Input
                    label="To (new or existing place)"
                    icon={MapPin}
                    list="help-known-locations"
                    placeholder="e.g. Model Town, Phagwara"
                    value={reqTo}
                    onChange={(e) => setReqTo(e.target.value)}
                  />
                </div>
                <Input
                  label="Suggested Fare (₹)"
                  type="number"
                  min={1}
                  placeholder="e.g. 40"
                  value={reqFare}
                  onChange={(e) => setReqFare(e.target.value)}
                />
                <Textarea
                  label="Notes (optional)"
                  rows={3}
                  placeholder="Anything that helps us review this route..."
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                />
                <Button type="submit" variant="emerald" size="lg" className="w-full" isLoading={submittingReq} icon={Send}>
                  Submit Route Request
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-navy px-1">Your Route Requests</h3>
            {!isAuthenticated ? (
              <Card>
                <EmptyState icon={MapPin} title="Login to see your requests" description="Your submitted route requests and their status will show up here." />
              </Card>
            ) : loadingReqs ? (
              <Card className="p-8 text-center text-sm text-ink-900/40">Loading...</Card>
            ) : myRequests.length === 0 ? (
              <Card>
                <EmptyState icon={MapPin} title="No route requests yet" description="Suggest a new route using the form." />
              </Card>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {myRequests.map((req) => (
                  <div key={req.id} className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-black/10 shadow-glass-sm space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy min-w-0">
                        <span className="truncate">{req.fromLocation}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                        <span className="truncate">{req.toLocation}</span>
                      </div>
                      {statusBadge(req.status)}
                    </div>
                    <p className="text-xs text-ink-900/60">Suggested fare: <strong className="text-brand-orange">₹{req.suggestedFare}</strong></p>
                    {req.notes && <p className="text-xs text-ink-900/50 italic">"{req.notes}"</p>}
                    {req.status === 'REJECTED' && req.rejectionReason && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900 flex items-start gap-1.5">
                        <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{req.rejectionReason}</span>
                      </div>
                    )}
                    {req.status === 'APPROVED' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Approved! This route is now live and selectable in the app.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
        </>
      )}
    </div>
  );
}
