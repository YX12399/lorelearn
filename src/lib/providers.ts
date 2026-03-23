// Provider types for image and video generation
export type Provider = 'fal' | 'google';

export const PROVIDER_LABELS: Record<Provider, string> = {
  fal: 'fal.ai (Kling 3.0 + Nano Banana Pro)',
  google: 'Google AI (Veo 3 + Gemini Image)',
};
