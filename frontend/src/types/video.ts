export interface VideoFormData {
    appName: string;
    description: string;
    audience: string[];
    ctaGoal: string;
    features: string;
    sourceType: 'url' | 'screenshots' | 'both' | '';
    websiteUrl: string;
    screenshots: File[];
    screenshotLabels: string[];
    videoLength: 30 | 60 | 90;
    tone: string;
    musicVibe: string;
    // Music panel
    musicEnabled: boolean;
    musicPresetId: string;
    musicCustomPrompt: string;
    // Voice panel
    voiceEnabled: boolean;
    voiceScript: string;
    // Creative context
    industry: string;
    platform: string;
    primaryBenefit: string;
    colorStyle: string;
}

export const initialVideoFormData: VideoFormData = {
    appName: '',
    description: '',
    audience: [],
    ctaGoal: '',
    features: '',
    sourceType: '',
    websiteUrl: '',
    screenshots: [],
    screenshotLabels: [],
    videoLength: 60,
    tone: 'Clean & Premium',
    musicVibe: 'Upbeat Tech',
    musicEnabled: false,
    musicPresetId: 'saas',
    musicCustomPrompt: '',
    voiceEnabled: false,
    voiceScript: '',
    industry: '',
    platform: '',
    primaryBenefit: '',
    colorStyle: '',
};
