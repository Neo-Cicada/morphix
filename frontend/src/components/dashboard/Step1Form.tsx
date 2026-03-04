'use client';

import { useState } from 'react';
import { VideoFormData } from '@/types/video';

interface Step1FormProps {
  formData: VideoFormData;
  onChange: (field: keyof VideoFormData, value: any) => void;
  onNext: () => void;
}

export function Step1Form({ formData, onChange, onNext }: Step1FormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);

  const audienceOptions = [
    'Developers',
    'Startups',
    'Small Businesses',
    'Enterprise Teams',
    'Consumers',
    'Agencies',
  ];

  const ctaOptions = [
    'Visit Website',
    'Sign Up Free',
    'Book a Demo',
    'Join Waitlist',
    'Follow on X',
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.appName.trim()) newErrors.appName = 'App name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.audience.length === 0) newErrors.audience = 'Select at least one audience';
    if (!formData.ctaGoal) newErrors.ctaGoal = 'Select a call to action';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    setAttempted(true);
    if (validate()) {
      onNext();
    }
  };

  const handleChange = (field: keyof VideoFormData, value: any) => {
    onChange(field, value);
    if (attempted) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const toggleAudience = (option: string) => {
    const newAudience = formData.audience.includes(option)
      ? formData.audience.filter((a) => a !== option)
      : [...formData.audience, option];
    
    onChange('audience', newAudience);
    if (attempted && newAudience.length > 0) {
      setErrors((errs) => ({ ...errs, audience: '' }));
    }
  };

  const selectCta = (option: string) => {
    onChange('ctaGoal', option);
    if (attempted) {
      setErrors((prev) => ({ ...prev, ctaGoal: '' }));
    }
  };

  return (
    <div className="morphix-card rounded-2xl border border-[#222222] bg-[#161616] flex flex-col w-full">
      <div className="relative z-10 p-6 sm:p-10 space-y-10">
        
        {/* Field 1: App Name */}
        <div className="space-y-3">
          <label className="block gradient-text font-medium text-base">What is your app called?</label>
          <input
            type="text"
            placeholder="e.g. Linear, Notion, Stripe"
            value={formData.appName}
            onChange={(e) => handleChange('appName', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder:text-[#555555] focus:outline-none focus:border-[#3b82f6] transition-colors"
          />
          {errors.appName && <p className="text-red-500 text-sm">{errors.appName}</p>}
        </div>

        {/* Field 2: One-line Description */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <label className="block gradient-text font-medium text-base">What does it do?</label>
            <span className={`text-sm ${formData.description.length > 140 ? 'text-red-500' : 'text-[#888888]'}`}>
              {formData.description.length}/140
            </span>
          </div>
          <textarea
            rows={2}
            placeholder="A project management tool for remote engineering teams"
            value={formData.description}
            onChange={(e) => {
              if (e.target.value.length <= 140) {
                handleChange('description', e.target.value);
              }
            }}
            className="w-full bg-[#0a0a0a] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder:text-[#555555] focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
        </div>

        {/* Field 3: Who is it for? */}
        <div className="space-y-3">
          <label className="block gradient-text font-medium text-base">Who is your target audience?</label>
          <div className="flex flex-wrap gap-2.5">
            {audienceOptions.map((option) => {
              const isSelected = formData.audience.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleAudience(option)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'pill-selected text-white'
                      : 'bg-transparent border border-[#333333] text-[#888888] hover:border-[#555555] hover:text-gray-200'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {errors.audience && <p className="text-red-500 text-sm">{errors.audience}</p>}
        </div>

        {/* Field 4: CTA */}
        <div className="space-y-3">
          <label className="block gradient-text font-medium text-base">What&apos;s your call to action?</label>
          <div className="flex flex-wrap gap-2.5">
            {ctaOptions.map((option) => {
              const isSelected = formData.ctaGoal === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectCta(option)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'pill-selected text-white'
                      : 'bg-transparent border border-[#333333] text-[#888888] hover:border-[#555555] hover:text-gray-200'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {errors.ctaGoal && <p className="text-red-500 text-sm">{errors.ctaGoal}</p>}
        </div>

        {/* Field 5: Features (Optional) */}
        <div className="space-y-3">
          <div>
            <label className="block gradient-text font-medium text-base">Any specific features to highlight?</label>
            <p className="text-[#888888] text-sm mt-1">Optional — we&apos;ll figure it out from your screenshots if you leave this blank</p>
          </div>
          <textarea
            rows={3}
            placeholder="e.g. drag-drop builder, real-time collaboration, analytics dashboard"
            value={formData.features}
            onChange={(e) => handleChange('features', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder:text-[#555555] focus:outline-none focus:border-[#3b82f6] transition-colors resize-none mt-3"
          />
        </div>

      </div>

      {/* Footer */}
      <div className="relative z-10 p-6 sm:px-10 sm:py-6 border-t border-[#222222] flex items-center justify-between bg-white/[0.01] rounded-b-2xl">
        <span className="text-[#666666] font-medium text-sm">Step 1 of 3</span>
        <button
          onClick={handleContinue}
          className="btn-gradient text-white px-6 py-2.5 rounded-xl font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
