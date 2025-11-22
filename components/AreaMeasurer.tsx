import React, { useState, useRef, useEffect } from 'react';
import { Point, AreaUnit, SavedMeasurement } from '../types';
import * as Geometry from '../utils/geometry';
import { Trash2, Calculator, Ruler, Upload, Camera, X, Save, Loader2 } from 'lucide-react';

interface Props {
  onSave: (data: Omit<SavedMeasurement, 'id' | 'timestamp'>) => void;
}

export const AreaMeasurer: React.FC<Props> = ({ onSave }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<'scale' | 'polygon' | 'idle'>('idle');
  const [unit, setUnit] = useState<AreaUnit>('ha');
  const [isSaving, setIsSaving] = useState(false);
  
  // Scale state
  const [scalePoints, setScalePoints] = useState<Point[]>([]);
  const [scaleDistance, setScaleDistance] = useState<string>('1'); // Real world meters
  
  // Polygon state
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setImageSrc(evt.target?.result as string);
        setScalePoints([]);
        setPolygonPoints([]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera functionality
  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera not supported in this browser environment.");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        setImageSrc(dataUrl);
        // Reset workspace state
        setScalePoints([]);
        setPolygonPoints([]);
        
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getRelativePoint = (e: React.MouseEvent): Point | null => {
    if (!imageRef.current || !containerRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Clamp to image bounds
    return {
      x: Math.max(0, Math.min(x, rect.width)),
      y: Math.max(0, Math.min(y, rect.height))
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    const point = getRelativePoint(e);
    if (!point) return;

    if (mode === 'scale') {
      if (scalePoints.length >= 2) {
        setScalePoints([point]);
      } else {
        setScalePoints([...scalePoints, point]);
      }
    } else if (mode === 'polygon') {
      setPolygonPoints([...polygonPoints, point]);
    }
  };

  // Calculation
  const pixelDistance = scalePoints.length === 2 ? Geometry.distance(scalePoints[0], scalePoints[1]) : 0;
  const pixelsPerMeter = pixelDistance && parseFloat(scaleDistance) > 0 
    ? pixelDistance / parseFloat(scaleDistance) 
    : 0;
    
  const pixelArea = Geometry.calculatePolygonArea(polygonPoints);
  const realArea = pixelsPerMeter > 0 ? pixelArea / (pixelsPerMeter * pixelsPerMeter) : 0;

  const handleSaveClick = async () => {
    if (polygonPoints.length < 3) {
      alert("Define a polygon area first.");
      return;
    }
    
    const name = prompt("Enter a name for this measurement:", `Photo ${new Date().toLocaleDateString()}`);
    if (!name) return;
    
    setIsSaving(true);
    
    let thumbnail: string | undefined = undefined;
    
    // Generate thumbnail using html2canvas
    if (containerRef.current && window.html2canvas) {
      try {
        const canvas = await window.html2canvas(containerRef.current, {
          useCORS: true,
          logging: false,
          scale: 0.5 // Reduce resolution for thumbnail
        });
        thumbnail = canvas.toDataURL('image/jpeg', 0.6);
      } catch (e) {
        console.warn("Failed to generate thumbnail", e);
      }
    }

    onSave({
      name,
      type: 'photo',
      area: pixelsPerMeter > 0 ? realArea : pixelArea,
      perimeter: 0, // Not calculated for pixels yet in this basic version
      unit: pixelsPerMeter > 0 ? unit : 'auto',
      thumbnail
    });
    
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={stopCamera}
              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center overflow-hidden relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="p-8 bg-slate-900 flex justify-center items-center border-t border-slate-800">
            <button 
              onClick={capturePhoto}
              className="group relative w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center hover:border-white/60 transition-colors"
              aria-label="Capture Photo"
            >
              <div className="w-14 h-14 bg-white rounded-full border-2 border-transparent group-hover:scale-90 transition-transform"></div>
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 flex flex-wrap gap-4 items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="btn-secondary flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-medium text-sm">
            <Upload className="w-4 h-4" />
            Upload
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>

          <button 
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-medium text-sm"
          >
            <Camera className="w-4 h-4" />
            Photo
          </button>
          
          {imageSrc && (
            <>
              <div className="h-6 w-px bg-slate-300 mx-2"></div>
              
              <button 
                onClick={() => setMode('scale')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'scale' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Ruler className="w-4 h-4" />
                Set Scale
              </button>
              
              <button 
                onClick={() => setMode('polygon')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'polygon' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Calculator className="w-4 h-4" />
                Measure Area
              </button>

              <button 
                onClick={() => { setScalePoints([]); setPolygonPoints([]); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </>
          )}
        </div>
        
        {imageSrc && scalePoints.length === 2 && (
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Reference Length:</span>
            <input 
              type="number" 
              value={scaleDistance}
              onChange={(e) => setScaleDistance(e.target.value)}
              className="w-16 border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-sm text-slate-600">m</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Workspace */}
        <div className="flex-1 bg-slate-100 relative overflow-auto flex items-center justify-center p-8">
          {!imageSrc ? (
            <div className="text-center text-slate-400">
              <div className="flex justify-center gap-4 mb-4">
                <Upload className="w-12 h-12 opacity-50" />
                <Camera className="w-12 h-12 opacity-50" />
              </div>
              <p className="text-lg">Upload an image or take a photo to start</p>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="relative shadow-2xl inline-block" 
              style={{ cursor: mode === 'idle' ? 'default' : 'crosshair' }}
            >
              <img 
                ref={imageRef}
                src={imageSrc} 
                alt="Workspace" 
                className="max-w-none block"
                style={{ maxHeight: '70vh' }}
                onMouseDown={handleClick}
                draggable={false}
              />
              
              <svg className="absolute inset-0 pointer-events-none w-full h-full">
                {/* Scale Line */}
                {scalePoints.length > 0 && (
                  <>
                    <polyline 
                      points={scalePoints.map(p => `${p.x},${p.y}`).join(' ')} 
                      fill="none" 
                      stroke="#3B82F6" 
                      strokeWidth="3" 
                    />
                    {scalePoints.map((p, i) => (
                      <circle key={`s-${i}`} cx={p.x} cy={p.y} r="5" fill="#3B82F6" stroke="white" strokeWidth="2" />
                    ))}
                  </>
                )}

                {/* Polygon */}
                {polygonPoints.length > 0 && (
                  <>
                    <polygon 
                      points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')} 
                      fill="rgba(16, 185, 129, 0.3)" 
                      stroke="#10B981" 
                      strokeWidth="2" 
                    />
                    {polygonPoints.map((p, i) => (
                      <circle key={`p-${i}`} cx={p.x} cy={p.y} r="4" fill="#10B981" stroke="white" strokeWidth="2" />
                    ))}
                  </>
                )}
              </svg>
            </div>
          )}
        </div>

        {/* Right Sidebar - Results Only */}
        {imageSrc && (
          <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Measurements
              </h3>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-slate-500">Measured Area</div>
                    <div className="relative">
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as AreaUnit)}
                        className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="auto">Auto</option>
                        <option value="m2">Meters (m²)</option>
                        <option value="ha">Hectares (ha)</option>
                        <option value="km2">km²</option>
                        <option value="ft2">Feet (ft²)</option>
                        <option value="ac">Acres</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 break-words">
                    {pixelsPerMeter > 0 ? Geometry.formatArea(realArea, unit) : `${pixelArea.toFixed(0)} px²`}
                  </div>
                  {pixelsPerMeter === 0 && (
                    <div className="text-xs text-amber-600 mt-2 flex items-start gap-1">
                      <span>⚠️</span> Set scale to see real units.
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveClick}
                  disabled={polygonPoints.length < 3 || isSaving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   {isSaving ? 'Saving...' : 'Save Measurement'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
