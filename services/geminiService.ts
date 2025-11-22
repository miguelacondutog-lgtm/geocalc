import { GoogleGenAI } from "@google/genai";

export const analyzeArea = async (
  imageBase64: string, 
  prompt: string, 
  areaInfo: string
): Promise<string> => {
  // Uses standard Flash model
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: imageBase64 } },
        { text: `Context: User has measured an area of ${areaInfo}. ${prompt}` }
      ]
    }
  });
  
  return response.text || "No response generated.";
};

export const generateVeoVideo = async (
  imageBase64: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16'
): Promise<string> => {
  // Ensure a paid API key is selected for Veo
  if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
    await window.aistudio.openSelectKey();
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt || undefined, // Optional prompt
    image: {
      imageBytes: imageBase64,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation failed. No download link received.");
  }

  // Fetch the video bytes securely
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) {
    throw new Error("Failed to download generated video.");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const generateProImage = async (
  prompt: string,
  size: '1K' | '2K' | '4K'
): Promise<string[]> => {
  // Ensure a paid API key is selected for High-Quality Image Generation
  if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
    await window.aistudio.openSelectKey();
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: '1:1',
        imageSize: size
      }
    }
  });

  const images: string[] = [];
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64 = part.inlineData.data;
        images.push(`data:image/png;base64,${base64}`);
      }
    }
  }

  return images;
};