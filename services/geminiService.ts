// This file is currently unused as AI features have been disabled.
// It is kept as a placeholder to prevent import errors in legacy code paths.

export const analyzeArea = async (
  imageBase64: string, 
  prompt: string, 
  areaInfo: string
): Promise<string> => {
  return "AI Analysis is disabled.";
};

export const generateVeoVideo = async (
  imageBase64: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16'
): Promise<string> => {
  throw new Error("Veo video generation is disabled.");
};

export const generateProImage = async (
  prompt: string,
  size: '1K' | '2K' | '4K'
): Promise<string[]> => {
  throw new Error("Image generation is disabled.");
};
