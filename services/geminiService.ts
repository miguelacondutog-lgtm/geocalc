// services/geminiService.ts
// Previously this file used the @google/genai library which was removed from the project.
// Provide minimal stubs so importing modules do not cause build/runtime failures.

export const analyzeArea = async (
  imageBase64: string,
  prompt: string,
  areaInfo: string
): Promise<string> => {
  throw new Error('AI features have been removed from this build. analyzeArea is unavailable.');
};

export const generateVeoVideo = async (
  imageBase64: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16'
): Promise<string> => {
  throw new Error('AI features have been removed from this build. generateVeoVideo is unavailable.');
};

export const generateProImage = async (
  prompt: string,
  size: '1K' | '2K' | '4K'
): Promise<string[]> => {
  throw new Error('AI features have been removed from this build. generateProImage is unavailable.');
};