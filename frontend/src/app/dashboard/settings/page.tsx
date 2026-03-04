'use client';

import { useState } from 'react';
import { User, Lock, AlertTriangle, Camera } from 'lucide-react';

/* Shared card wrapper — matches landing page card style */
function SectionCard({
  icon: Icon,
  label,
  title,
  accent = '#3b82f6',
  children,
}: {
  icon: React.ElementType;
  label: string;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-2xl p-6 mb-6 overflow-hidden"
      style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}
    >
      {/* Top 1px accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
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
        className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#333333] transition-all duration-200 focus:outline-none"
        style={{
          background: '#111111',
          border: focused ? '1px solid rgba(59,130,246,0.4)' : '1px solid #1e1e1e',
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
          ...(props.disabled ? { color: '#444444', cursor: 'not-allowed' } : {}),
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function SettingsPage() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <div className="px-6 py-10 lg:px-8 max-w-2xl">

      {/* Header */}
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6] block mb-2">
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
                style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)', opacity: 0.6 }}
              />
              <div
                className="relative size-16 rounded-full flex items-center justify-center"
                style={{ background: '#111111' }}
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

          <Field label="Full Name" type="text" defaultValue="Neo Barnachea" />
          <div>
            <Field label="Email" type="email" defaultValue="neo@morphix.ai" disabled />
            <p className="text-xs mt-1.5 text-[#444444]">Contact support to change your email.</p>
          </div>

          <button
            className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </SectionCard>

      {/* Security Section */}
      <SectionCard icon={Lock} label="Access" title="Security" accent="#a855f7">
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

      {/* Danger Zone */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)' }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.5), transparent)' }}
        />
        <div className="flex items-center gap-3 mb-3">
          <div
            className="size-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400/60">Danger</p>
            <p className="text-sm font-bold tracking-tight text-red-400">Danger Zone</p>
          </div>
        </div>
        <p className="text-sm text-[#666666] mb-5">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-red-400 transition-all duration-200 cursor-pointer hover:bg-red-500/10"
          style={{ border: '1px solid rgba(239,68,68,0.25)' }}
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={() => setShowDeleteDialog(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl mx-4 animate-in fade-in zoom-in-95 duration-200"
            style={{
              background: '#111111',
              border: '1px solid rgba(239,68,68,0.2)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-base font-bold tracking-tight text-white">Delete Account</h3>
            </div>
            <p className="text-sm text-[#888888] mb-6 leading-relaxed">
              Are you sure you want to delete your account? All your data, videos, and credits will be permanently removed. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #1e1e1e',
                  color: '#888888',
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 cursor-pointer hover:brightness-110"
                style={{ background: '#dc2626' }}
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
