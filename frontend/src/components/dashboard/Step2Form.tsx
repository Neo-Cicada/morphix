'use client';

import { useState, useRef } from 'react';
import { VideoFormData } from '@/types/video';
import { Globe, Image, Layers, UploadCloud, X, GripVertical, Check } from 'lucide-react';

interface Step2FormProps {
  formData: VideoFormData;
  onChange: (field: keyof VideoFormData, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

type SourceType = 'url' | 'screenshots' | 'both' | '';

const sourceCards = [
  {
    value: 'url' as SourceType,
    icon: Globe,
    title: 'Website URL',
    subtitle: "We'll analyze your live site automatically",
    badge: 'Recommended',
    badgeColor: 'bg-[#C17B4F]',
    glowColor: 'rgba(193, 123, 79, 0.15)',
    borderColor: '#C17B4F',
  },
  {
    value: 'screenshots' as SourceType,
    icon: Image,
    title: 'Screenshots',
    subtitle: 'Upload 3–8 images of your product',
    badge: null,
    badgeColor: '',
    glowColor: 'rgba(193, 123, 79, 0.15)',
    borderColor: '#C17B4F',
  },
  {
    value: 'both' as SourceType,
    icon: Layers,
    title: 'URL + Screenshots',
    subtitle: 'Best results — maximum context for AI',
    badge: 'Best Quality',
    badgeColor: '',
    glowColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: '#B8652A',
  },
];

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function Step2Form({ formData, onChange, onNext, onBack }: Step2FormProps) {
  const [attempted, setAttempted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const sourceType = formData.sourceType;
  const currentCount = formData.screenshots.length;
  const urlValid = isValidUrl(formData.websiteUrl);
  const urlTouched = formData.websiteUrl.length > 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // --- Validation ---
  const isValid = (): boolean => {
    if (!sourceType) return false;
    if (sourceType === 'url') return urlValid;
    if (sourceType === 'screenshots') return currentCount >= 3;
    if (sourceType === 'both') return urlValid && currentCount >= 3;
    return false;
  };

  const handleContinue = () => {
    setAttempted(true);
    if (isValid()) onNext();
  };

  // --- File handling (same logic as before) ---
  const handleFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter(
      (f) => ['image/png', 'image/jpeg', 'image/webp'].includes(f.type) && f.size <= 10 * 1024 * 1024,
    );
    if (newFiles.length === 0) return;
    if (currentCount + newFiles.length > 8) {
      showToast('Maximum 8 screenshots allowed');
      return;
    }
    onChange('screenshots', [...formData.screenshots, ...newFiles]);
    onChange('screenshotLabels', [...formData.screenshotLabels, ...newFiles.map(() => '')]);
  };

  const removeImage = (index: number) => {
    const newFiles = [...formData.screenshots];
    const newLabels = [...formData.screenshotLabels];
    newFiles.splice(index, 1);
    newLabels.splice(index, 1);
    onChange('screenshots', newFiles);
    onChange('screenshotLabels', newLabels);
  };

  const updateLabel = (index: number, label: string) => {
    const newLabels = [...formData.screenshotLabels];
    newLabels[index] = label;
    onChange('screenshotLabels', newLabels);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOverItem = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDropItem = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const newFiles = [...formData.screenshots];
    const newLabels = [...formData.screenshotLabels];
    const [movedFile] = newFiles.splice(draggedIndex, 1);
    const [movedLabel] = newLabels.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, movedFile);
    newLabels.splice(dropIndex, 0, movedLabel);
    onChange('screenshots', newFiles);
    onChange('screenshotLabels', newLabels);
    setDraggedIndex(null);
  };

  // --- Shared UI Sections ---
  const renderUrlInput = () => (
    <div className="space-y-3">
      <label className="block gradient-text font-medium text-base">Your website URL</label>
      <div className="relative">
        <input
          type="url"
          placeholder="https://yourapp.com"
          value={formData.websiteUrl}
          onChange={(e) => onChange('websiteUrl', e.target.value)}
          className={`w-full bg-[#0a0a0a] rounded-xl px-4 py-3 text-white placeholder:text-[#555555] focus:outline-none transition-colors pr-10 border ${
            !urlTouched
              ? 'border-[#333333] focus:border-[#C17B4F]'
              : urlValid
                ? 'border-green-500/60 focus:border-green-500'
                : 'border-red-500/60 focus:border-red-500'
          }`}
        />
        {urlTouched && urlValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      {attempted && !urlValid && urlTouched && (
        <p className="text-red-500 text-sm">Please enter a valid URL starting with https://</p>
      )}
      {attempted && !urlTouched && (
        <p className="text-red-500 text-sm">Website URL is required</p>
      )}
      <p className="text-[#888888] text-xs leading-relaxed">
        Claude will visit and analyze your website.<br />
        Make sure it&apos;s publicly accessible.
      </p>
    </div>
  );

  const renderUploadZone = () => (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          isDragging ? 'border-[#C17B4F] bg-[#C17B4F]/5' : 'border-[#333333] hover:border-[#555555] bg-transparent'
        }`}
      >
        <UploadCloud className={`h-10 w-10 mb-4 ${isDragging ? 'text-[#C17B4F]' : 'text-gray-500'}`} />
        <h3 className="text-white font-medium mb-1">Drop your screenshots here</h3>
        <p className="text-[#888888] text-sm">or click to browse</p>
        <p className="text-[#555555] text-xs mt-4">PNG, JPG, WEBP (Max 10MB each)</p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept=".png,.jpeg,.jpg,.webp"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
        />
      </div>

      {/* Counter & Validation */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-white">
          {currentCount} of 8 screenshots uploaded
        </span>
        {attempted && currentCount < 3 && (
          <span className="text-sm text-red-500">Add at least 3 screenshots to continue</span>
        )}
      </div>

      {/* Grid Area */}
      {currentCount > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {formData.screenshots.map((file, index) => {
            const url = URL.createObjectURL(file);
            return (
              <div
                key={`${file.name}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOverItem}
                onDrop={(e) => handleDropItem(e, index)}
                className="group relative bg-[#0a0a0a] border border-[#333333] rounded-xl p-3 flex flex-col transition-all cursor-grab active:cursor-grabbing hover:border-[#555555]"
              >
                <div className="absolute top-4 left-4 size-6 bg-black/60 shadow-lg backdrop-blur-md rounded-md flex items-center justify-center text-xs font-bold text-white z-10 border border-white/10">
                  {index + 1}
                </div>
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                    className="size-6 bg-red-500/80 hover:bg-red-500 shadow-lg rounded-md flex items-center justify-center text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-md rounded-md p-1 border border-white/10">
                    <GripVertical className="h-4 w-4 text-white/70" />
                  </div>
                </div>
                <div className="aspect-square rounded-lg overflow-hidden bg-[#161616] mb-3 relative pointer-events-none">
                  <img src={url} alt={file.name} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <p className="text-xs text-[#888888] truncate">{file.name}</p>
                  <input
                    type="text"
                    placeholder="e.g. Dashboard, Onboarding..."
                    value={formData.screenshotLabels[index]}
                    onChange={(e) => updateLabel(index, e.target.value)}
                    className="w-full bg-[#161616] border border-[#222222] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#555555] focus:outline-none focus:border-[#C17B4F] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="morphix-card rounded-2xl border border-[#222222] bg-[#161616] flex flex-col w-full relative">
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm z-50">
          {toastMessage}
        </div>
      )}

      <div className="relative z-10 p-6 sm:p-10 space-y-10">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold gradient-text mb-1">How would you like to add your product?</h2>
          <p className="text-sm text-[#888888]">Choose one or use both for best results</p>
        </div>

        {/* Source Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sourceCards.map((card) => {
            const isSelected = sourceType === card.value;
            const Icon = card.icon;
            const isBoth = card.value === 'both';

            return (
              <div
                key={card.value}
                onClick={() => onChange('sourceType', card.value)}
                className={`relative p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? isBoth
                      ? 'border-[#B8652A] bg-[#160a29]'
                      : 'border-[#C17B4F] bg-[#0d1829]'
                    : 'border-[#222222] bg-[#161616] hover:border-[#444444]'
                }`}
                style={isSelected ? { boxShadow: `0 0 20px ${card.glowColor}, inset 0 0 15px ${card.glowColor}` } : undefined}
              >
                {card.badge && (
                  <span
                    className="absolute -top-3 right-4 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: isBoth
                        ? '#B8652A'
                        : '#C17B4F',
                    }}
                  >
                    {card.badge}
                  </span>
                )}
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 h-5 w-5 rounded-full flex flex-col items-center justify-center"
                    style={{ background: isBoth ? '#B8652A' : '#C17B4F' }}
                  >
                    <div className="w-1.5 h-2.5 border-b-2 border-r-2 border-white transform rotate-45 -translate-y-[2px]" />
                  </div>
                )}
                <Icon className={`h-8 w-8 mb-4 ${
                  isSelected
                    ? isBoth ? 'text-[#B8652A]' : 'text-[#C17B4F]'
                    : 'text-gray-400'
                }`} />
                <h4 className="text-white font-medium mb-1">{card.title}</h4>
                <p className="text-sm text-[#666666] leading-snug">{card.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Conditional Content */}
        {sourceType && (
          <div className="space-y-8">
            {/* URL Input (shown for 'url' and 'both') */}
            {(sourceType === 'url' || sourceType === 'both') && renderUrlInput()}

            {/* Divider for "both" */}
            {sourceType === 'both' && (
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#222222]" />
                <span className="text-sm text-[#555555] font-medium">and</span>
                <div className="flex-1 h-px bg-[#222222]" />
              </div>
            )}

            {/* Screenshot Upload (shown for 'screenshots' and 'both') */}
            {(sourceType === 'screenshots' || sourceType === 'both') && renderUploadZone()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 p-6 sm:px-10 sm:py-6 border-t border-[#222222] flex items-center justify-between bg-white/[0.01] rounded-b-2xl">
        <button
          onClick={onBack}
          className="text-[#888888] hover:text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          Back
        </button>
        <span className="text-[#666666] font-medium text-sm">Step 2 of 3</span>
        <button
          onClick={handleContinue}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
            isValid()
              ? 'btn-gradient text-white'
              : 'bg-white/[0.04] border border-[#222222] cursor-not-allowed text-[#555555]'
          }`}
          disabled={!isValid() && attempted}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
