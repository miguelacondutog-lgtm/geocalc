import React, { useState } from 'react';
import { generateProImage } from '../services/geminiService';
import { Image as ImageIcon, Loader2, Sparkles, AlertCircle, Download } from 'lucide-react';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const images = await generateProImage(prompt, size);
      if (images.length === 0) throw new Error("No images were returned.");
      setGeneratedImages(images);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Imagine with Nano Banana Pro</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Generate high-fidelity images (up to 4K) using the powerful Gemini 3 Pro Image model.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2 max-w-3xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row gap-2 p-2">
          <input 
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city on Mars, golden hour, highly detailed..."
            className="flex-1 px-4 py-3 text-base focus:outline-none text-slate-800 placeholder:text-slate-400 rounded-xl"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          
          <div className="flex items-center gap-2 px-2 md:border-l md:border-slate-200 md:pl-4">
            <select 
              value={size}
              onChange={(e) => setSize(e.target.value as any)}
              className="bg-slate-100 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="1K">1K</option>
              <option value="2K">2K (Pro)</option>
              <option value="4K">4K (Pro)</option>
            </select>
            
            <button
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2 whitespace-nowrap"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 text-red-700 rounded-xl flex gap-3 items-start">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-medium">Generation Error</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {generatedImages.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {generatedImages.map((img, idx) => (
            <div key={idx} className="group relative bg-slate-100 rounded-2xl overflow-hidden shadow-lg">
              <img src={img} alt={`Generated ${idx}`} className="w-full h-auto object-contain max-h-[70vh]" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-end p-6 opacity-0 group-hover:opacity-100">
                <a 
                  href={img} 
                  download={`gemini-generated-${Date.now()}.png`}
                  className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isGenerating && (
          <div className="text-center text-slate-400 py-12">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Enter a prompt above to start creating.</p>
          </div>
        )
      )}
      
      {isGenerating && (
        <div className="text-center py-20">
          <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-6 animate-pulse"></div>
          <p className="text-slate-500 font-medium">Dreaming up pixels...</p>
        </div>
      )}
    </div>
  );
};
