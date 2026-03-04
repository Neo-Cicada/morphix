'use client';

import { useState } from 'react';
import { User, Lock, AlertTriangle, Camera } from 'lucide-react';

export default function SettingsPage() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-[#222222] bg-[#161616] p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-white">Profile</h2>
        </div>
        
        <div className="space-y-5 max-w-lg">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="size-16 rounded-full bg-white/[0.05] border border-[#222222] flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <button className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-4 w-4 text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Profile photo</p>
              <p className="text-xs text-gray-500 mt-0.5">Click to upload a new photo</p>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
            <input
              type="text"
              defaultValue="Neo Barnachea"
              className="w-full rounded-lg border border-[#222222] bg-[#111111] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              defaultValue="neo@morphix.ai"
              disabled
              className="w-full rounded-lg border border-[#222222] bg-[#111111] px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-600 mt-1">Contact support to change your email.</p>
          </div>

          <button className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium transition-all hover:bg-gray-200">
            Save Changes
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-xl border border-[#222222] bg-[#161616] p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-white">Security</h2>
        </div>
        
        <div className="space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              className="w-full rounded-lg border border-[#222222] bg-[#111111] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full rounded-lg border border-[#222222] bg-[#111111] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              className="w-full rounded-lg border border-[#222222] bg-[#111111] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <button className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium transition-all hover:bg-gray-200">
            Update Password
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/40"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDeleteDialog(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-[#222222] bg-[#161616] p-6 shadow-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Delete Account</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete your account? All of your data, videos, and credits will be permanently removed. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-lg border border-[#222222] bg-white/[0.03] px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-600"
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
