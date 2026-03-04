'use client';

import { useState } from 'react';
import { Stepper } from '@/components/dashboard/Stepper';
import { Step1Form } from '@/components/dashboard/Step1Form';
import { Step2Form } from '@/components/dashboard/Step2Form';
import { Step3Form } from '@/components/dashboard/Step3Form';
import { VideoFormData, initialVideoFormData } from '@/types/video';

const steps = ['App Info', 'Add Your Product', 'Style'];

export default function NewVideoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<VideoFormData>(initialVideoFormData);

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 2));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleChange = (field: keyof VideoFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title text-white">Create New Video</h1>
        <p className="text-sm text-[#666666] mt-1">Follow the steps below to generate your video.</p>
      </div>

      {/* Stepper */}
      <div className="morphix-card rounded-xl border border-[#222222] bg-[#161616] p-6 sm:p-8 mb-6">
        <div className="relative z-10">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>

      {/* Content Area */}
      {currentStep === 0 && (
        <Step1Form formData={formData} onChange={handleChange} onNext={handleNext} />
      )}
      {currentStep === 1 && (
        <Step2Form formData={formData} onChange={handleChange} onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 2 && (
        <Step3Form formData={formData} onChange={handleChange} onBack={handleBack} />
      )}
    </div>
  );
}
