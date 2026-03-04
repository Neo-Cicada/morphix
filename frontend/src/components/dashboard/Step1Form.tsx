'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Step1Form() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    appName: '',
    description: '',
    audience: [] as string[],
    cta: '',
    features: '',
  });

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
    if (!formData.cta) newErrors.cta = 'Select a call to action';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    setAttempted(true);
    if (validate()) {
      // Proceed to Step 2
      console.log('Step 1 complete', formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (attempted) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const toggleAudience = (option: string) => {
    setFormData((prev) => {
      const newAudience = prev.audience.includes(option)
        ? prev.audience.filter((a) => a !== option)
        : [...prev.audience, option];
      
      if (attempted && newAudience.length > 0) {
        setErrors((errs) => ({ ...errs, audience: '' }));
      }
      return { ...prev, audience: newAudience };
    });
  };

  const selectCta = (option: string) => {
    setFormData((prev) => ({ ...prev, cta: option }));
    if (attempted) {
      setErrors((prev) => ({ ...prev, cta: '' }));
    }
  };

  return (
    <div className="rounded-2xl border border-[#222222] bg-[#161616] flex flex-col w-full">
      <div className="p-6 sm:p-10 space-y-10">
        
        {/* Field 1: App Name */}
        <div className="space-y-3">
          <label className="block text-white font-medium">What is your app called?</label>
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
            <label className="block text-white font-medium">What does it do?</label>
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
          <label className="block text-white font-medium">Who is your target audience?</label>
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
                      ? 'bg-[#3b82f6] text-white border-transparent'
                      : 'bg-transparent border border-[#333333] text-[#888888] hover:border-[#555555] hover:text-gray-200'
                  }`}
                  style={isSelected ? {} : { borderWidth: '1px' }}
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
          <label className="block text-white font-medium">What&apos;s your call to action?</label>
          <div className="flex flex-wrap gap-2.5">
            {ctaOptions.map((option) => {
              const isSelected = formData.cta === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectCta(option)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#3b82f6] text-white'
                      : 'bg-transparent border border-[#333333] text-[#888888] hover:border-[#555555] hover:text-gray-200'
                  }`}
                  style={isSelected ? {} : { borderWidth: '1px' }}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {errors.cta && <p className="text-red-500 text-sm">{errors.cta}</p>}
        </div>

        {/* Field 5: Features (Optional) */}
        <div className="space-y-3">
          <div>
            <label className="block text-white font-medium">Any specific features to highlight?</label>
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
      <div className="p-6 sm:px-10 sm:py-6 border-t border-[#222222] flex items-center justify-between bg-white/[0.01] rounded-b-2xl">
        <span className="text-[#888888] font-medium text-sm">Step 1 of 3</span>
        <button
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
