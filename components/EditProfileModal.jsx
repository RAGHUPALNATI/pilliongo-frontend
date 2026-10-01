'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { vehicleAPI } from '@/lib/api';
import { User, Phone, Bike, Car, Star, Plus, Trash2, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { Input } from '@/components/Input';
import Button from '@/components/Button';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateUserProfile, patchUser, showToast } = useAuth();

  const isDriver = (user?.role || '').toUpperCase() === 'DRIVER';

  // Two fully independent tabs — editing your name/phone never touches
  // vehicles, and managing vehicles never touches name/phone. Each side
  // saves itself; there's no shared "form" the two compete over.
  const [tab, setTab] = useState('profile'); // 'profile' | 'vehicles'

  useEffect(() => {
    if (isOpen) setTab('profile');
  }, [isOpen]);

  /* ---------------- Profile (name + phone) ---------------- */
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName(user?.fullName || user?.name || '');
      setPhone(user?.phone || '');
    }
  }, [isOpen, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast('Please provide Full Name and Phone Number', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      onClose();
    } catch (err) {
      // Handled by AuthContext toast
    } finally {
      setSavingProfile(false);
    }
  };

  /* ---------------- Vehicles (up to 2: one Bike, one Car) ---------------- */
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState('Bike');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);

  const loadVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const list = await vehicleAPI.getMyVehicles();
      setVehicles(list);
    } catch (err) {
      console.error('Error loading vehicles:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    if (isOpen && isDriver) {
      loadVehicles();
    }
  }, [isOpen, isDriver]);

  // Sync the primary vehicle's details onto the local user object so
  // anything reading user.vehicleType/vehicleModel/vehicleNumber (the
  // dashboard header, etc.) reflects it immediately, without waiting for
  // a fresh login.
  const syncPrimaryLocally = (vehicle) => {
    if (!vehicle) return;
    patchUser({
      vehicleType: vehicle.vehicleType,
      vehicleModel: vehicle.vehicleModel,
      vehiclePlate: vehicle.vehiclePlate,
      vehicleNumber: vehicle.vehiclePlate,
    });
  };

  const usedTypes = vehicles.map((v) => (v.vehicleType || '').toLowerCase());
  const availableTypes = ['Bike', 'Car'].filter((t) => !usedTypes.includes(t.toLowerCase()));
  const atVehicleLimit = vehicles.length >= 2 || availableTypes.length === 0;

  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(newVehicleType)) {
      setNewVehicleType(availableTypes[0]);
    }
  }, [vehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (atVehicleLimit) {
      showToast('You can only have one Bike and one Car (max 2 vehicles)', 'error');
      return;
    }
    if (!newVehicleModel.trim() || !newVehiclePlate.trim()) {
      showToast('Please enter the vehicle model and plate number', 'error');
      return;
    }
    setAddingVehicle(true);
    try {
      const saved = await vehicleAPI.addVehicle(newVehicleType, newVehicleModel.trim(), newVehiclePlate.trim());
      showToast('Vehicle added!', 'success');
      setNewVehicleModel('');
      setNewVehiclePlate('');
      if (saved?.primaryVehicle) syncPrimaryLocally(saved);
      loadVehicles();
    } catch (err) {
      showToast(err.message || 'Failed to add vehicle', 'error');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    setDeletingVehicleId(vehicleId);
    try {
      await vehicleAPI.deleteVehicle(vehicleId);
      showToast('Vehicle removed', 'info');
      loadVehicles();
    } catch (err) {
      showToast(err.message || 'Failed to remove vehicle', 'error');
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const handleSetPrimary = async (vehicleId) => {
    setSettingPrimaryId(vehicleId);
    try {
      const updated = await vehicleAPI.setPrimary(vehicleId);
      showToast('Primary vehicle updated!', 'success');
      syncPrimaryLocally(updated);
      loadVehicles();
    } catch (err) {
      showToast(err.message || 'Failed to set primary vehicle', 'error');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Your Profile"
      icon={User}
      iconClassName="bg-brand-orange/10 text-brand-orange"
      footer={
        tab === 'profile' ? (
          <>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="edit-profile-form" variant="primary" size="md" isLoading={savingProfile}>
              Save Profile Changes
            </Button>
          </>
        ) : (
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        )
      }
    >
      {isDriver && (
        <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-xl mb-4 w-fit">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'profile' ? 'bg-brand-orange text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Profile
          </button>
          <button
            type="button"
            onClick={() => setTab('vehicles')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'vehicles' ? 'bg-brand-orange text-white shadow-sm' : 'text-ink-900/60 hover:text-brand-navy'
            }`}
          >
            <Car className="w-3.5 h-3.5" /> Vehicles
          </button>
        </div>
      )}

      {tab === 'profile' && (
        <form id="edit-profile-form" onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            icon={User}
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Phone Number"
            icon={Phone}
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </form>
      )}

      {/* YOUR VEHICLES — a driver can own at most 2 (one Bike, one Car).
          Each add/delete/set-primary action saves immediately, completely
          independent of the Profile tab above. */}
      {isDriver && tab === 'vehicles' && (
        <div className="space-y-3">
          <p className="text-[11px] text-ink-900/50">
            One Bike and one Car, max. Pick which one is your primary — it's what shows on your dashboard and what
            new rides default to.
          </p>

          {loadingVehicles ? (
            <p className="text-xs text-ink-900/40 flex items-center gap-1.5 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading vehicles...
            </p>
          ) : vehicles.length === 0 ? (
            <p className="text-xs text-ink-900/40 py-1">No vehicles yet — add one below.</p>
          ) : (
            <div className="space-y-2">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border ${
                    v.primaryVehicle ? 'bg-brand-orange/5 border-brand-orange/30' : 'bg-white/70 border-black/5'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs min-w-0">
                    {v.vehicleType === 'Car' ? (
                      <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Bike className="w-4 h-4 text-brand-orange shrink-0" />
                    )}
                    <span className="font-bold text-brand-navy truncate">{v.vehicleModel}</span>
                    <span className="font-mono text-ink-900/50 shrink-0">({v.vehiclePlate})</span>
                    {v.primaryVehicle && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange text-white text-[10px] font-bold shrink-0">
                        <Star className="w-3 h-3 fill-white" /> Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!v.primaryVehicle && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(v.id)}
                        disabled={settingPrimaryId === v.id}
                        title="Set as primary vehicle"
                        className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-brand-navy bg-black/5 hover:bg-black/10 disabled:opacity-40 transition-colors flex items-center gap-1"
                      >
                        {settingPrimaryId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(v.id)}
                      disabled={deletingVehicleId === v.id || vehicles.length <= 1}
                      title={vehicles.length <= 1 ? 'Add another vehicle before removing this one' : 'Remove vehicle'}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingVehicleId === v.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {atVehicleLimit ? (
            <p className="text-[11px] text-ink-900/40 bg-black/[0.03] rounded-xl px-3 py-2.5 text-center">
              You've got both a Bike and a Car on file — that's the max. Remove one to add a different vehicle.
            </p>
          ) : (
            <form onSubmit={handleAddVehicle} className="flex flex-wrap items-end gap-2 pt-3 border-t border-black/5">
              <div className="flex gap-1.5">
                {availableTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewVehicleType(t)}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-bold transition-colors ${
                      newVehicleType === t ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white/60 text-ink-900 border-black/10'
                    }`}
                  >
                    {t === 'Car' ? <Car className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Model, e.g. Hero Splendor+"
                value={newVehicleModel}
                onChange={(e) => setNewVehicleModel(e.target.value)}
                wrapperClassName="flex-1 min-w-[140px]"
              />
              <Input
                placeholder="Plate, e.g. PB 09 AB 1234"
                value={newVehiclePlate}
                onChange={(e) => setNewVehiclePlate(e.target.value)}
                className="font-mono"
                wrapperClassName="flex-1 min-w-[140px]"
              />
              <Button type="submit" variant="secondary" size="md" icon={Plus} isLoading={addingVehicle} className="shrink-0">
                Add
              </Button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
