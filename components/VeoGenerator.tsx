import React, { useState } from 'react';
import { generateVeoVideo } from '../services/geminiService';
import { Video, Loader2, Upload, PlayCircle, AlertCircle } from 'lucide-react';

export const VeoGenerator: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => setImageSrc(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageSrc) return;
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);

    try {
      const base64 = imageSrc.split(',')[1];
      const url = await generateVeoVideo(base64, prompt, aspectRatio);
      setVideoUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate video. Ensure you have selected a paid API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Animate with Veo</h2>
        <p className="text-slate-600">Turn your static images into cinematic videos using the Veo 3.1 model.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-700 mb-2 block">Source Image</span>
              <div className={`border-2 border-dashed rounded-lg h-64 flex flex-col items-center justify-center text-center p-4 transition-colors ${imageSrc ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                {imageSrc ? (
                  <div className="relative w-full h-full">
                    <img src={imageSrc} alt="Source" className="w-full h-full object-contain" />
                    <button 
                      onClick={(e) => { e.preventDefault(); setImageSrc(null); }}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 p-1.5 rounded-full shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="cursor-pointer w-full h-full flex flex-col items-center justify-center relative">
                     <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                     <Upload className="w-10 h-10 text-slate-400 mb-3" />
                     <p className="text-sm text-slate-500 font-medium">Click to upload image</p>
                  </div>
                )}
              </div>
            </label>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Prompt (Optional)</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the motion, e.g., 'The water flows gently', 'Camera pans right'"
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Aspect Ratio</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="aspect" 
                    checked={aspectRatio === '16:9'} 
                    onChange={() => setAspectRatio('16:9')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Landscape (16:9)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="aspect" 
                    checked={aspectRatio === '9:16'} 
                    onChange={() => setAspectRatio('9:16')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Portrait (9:16)</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!imageSrc || isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating (this takes a moment)...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Generate Video
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex gap-2 items-start">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl flex items-center justify-center min-h-[400px] relative">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop 
              className="max-w-full max-h-[600px]"
            />
          ) : (
            <div className="text-center text-slate-500 p-8">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-slate-300 animate-pulse">Creating magic with Veo...</p>
                  <p className="text-xs text-slate-500 max-w-xs">Video generation can take 1-2 minutes. Please do not close this tab.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <PlayCircle className="w-20 h-20 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Your video will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
