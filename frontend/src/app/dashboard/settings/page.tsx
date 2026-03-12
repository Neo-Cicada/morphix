'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Camera } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { api } from '@/lib/api';

/* Shared card wrapper — matches landing page card style */
function SectionCard({
  icon: Icon,
  label,
  title,
  accent = '#C17B4F',
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-2xl p-6 mb-6 overflow-hidden"
      style={{ background: '#1a1a18', border: '1px solid #2e2e2c' }}
    >
      {/* Top 1px accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-3 mb-6">
        <div
          className="size-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#555555' }}>
            {label}
          </p>
          <p className="text-sm font-bold tracking-tight text-white">{title}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* Input that highlights with blue ring on focus — matches landing form inputs */
function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#555555' }}>
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#555555] transition-all duration-200 focus:outline-none"
        style={{
          background: '#1a1a18',
          border: focused ? '1px solid rgba(193,123,79,0.4)' : '1px solid #2e2e2c',
          boxShadow: focused ? '0 0 0 3px rgba(193,123,79,0.08)' : 'none',
          ...(props.disabled ? { color: '#444444', cursor: 'not-allowed' } : {}),
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { user, refresh } = useUser();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
  }, [user]);

  async function handleSaveProfile() {
    setSaving(true);
    setSaveMsg('');
    try {
      await api.patch('/users/me', { full_name: fullName });
      await refresh();
      setSaveMsg('Saved!');
    } catch {
      setSaveMsg('Failed to save.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 2500);
    }
  }

  return (
    <div className="px-6 py-10 lg:px-8 max-w-2xl">

      {/* Header */}
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C17B4F] block mb-2">
          Account
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">Settings</h1>
        <p className="text-sm text-[#888888] mt-1.5">Manage your account preferences.</p>
      </div>

      {/* Profile Section */}
      <SectionCard icon={User} label="Identity" title="Profile">
        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              {/* Gradient ring */}
              <div
                className="absolute -inset-[2px] rounded-full"
                style={{ background: '#C17B4F', opacity: 0.6 }}
              />
              <div
                className="relative size-16 rounded-full flex items-center justify-center"
                style={{ background: '#1a1a18' }}
              >
                <User className="h-6 w-6 text-zinc-600" />
              </div>
              <button
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                style={{ background: 'rgba(0,0,0,0.7)' }}
              >
                <Camera className="h-4 w-4 text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Profile photo</p>
              <p className="text-xs mt-0.5 text-[#555555]">Click to upload a new photo</p>
            </div>
          </div>

          <Field
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div>
            <Field label="Email" type="email" defaultValue={user?.email ?? ''} disabled />
            <p className="text-xs mt-1.5 text-[#444444]">Contact support to change your email.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saveMsg && <span className="text-xs text-[#888888]">{saveMsg}</span>}
          </div>
        </div>
      </SectionCard>

      {/* Security Section */}
      <SectionCard icon={Lock} label="Access" title="Security" accent="#D4A574">
        <div className="space-y-5">
          <Field label="Current Password" type="password" placeholder="Enter current password" />
          <Field label="New Password" type="password" placeholder="Enter new password" />
          <Field label="Confirm New Password" type="password" placeholder="Repeat new password" />

          <button
            className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 cursor-pointer"
          >
            Update Password
          </button>
        </div>
      </SectionCard>

    </div>
  );
}
