'use client';

import { Stepper } from '@/components/dashboard/Stepper';
import { Upload, Wand2, Info } from 'lucide-react';

const steps = ['App Info', 'Upload Screenshots', 'Style'];

import { Step1Form } from '@/components/dashboard/Step1Form';

export default function NewVideoPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Create New Video</h1>
        <p className="text-sm text-gray-500 mt-1">Follow the steps below to generate your video.</p>
      </div>

      {/* Stepper */}
      <div className="rounded-xl border border-[#222222] bg-[#161616] p-6 sm:p-8 mb-6">
        <Stepper steps={steps} currentStep={0} />
      </div>

      {/* Content Area - Step 1 Form */}
      <Step1Form />
    </div>
  );
}
