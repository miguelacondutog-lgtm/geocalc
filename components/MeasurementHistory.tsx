import React from 'react';
import { SavedMeasurement } from '../types';
import { formatArea, formatLength } from '../utils/geometry';
import { Trash2, Map, Camera, X, Upload, Clock, Image as ImageIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  measurements: SavedMeasurement[];
  onDelete: (id: string) => void;
  onLoad: (measurement: SavedMeasurement) => void;
}

export const MeasurementHistory: React.FC<Props> = ({ isOpen, onClose, measurements, onDelete, onLoad }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2 text-slate-800">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold">Saved Measurements</h2>
                <span className="text-xs font-medium bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                    {measurements.length}/10
                </span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {measurements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center">
                    <Clock className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">No saved measurements</p>
                    <p className="text-sm mt-1">Save your work to access it here.</p>
                </div>
            ) : (
                measurements.map((m) => (
                    <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${m.type === 'satellite' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {m.type === 'satellite' ? <Map className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 leading-tight">{m.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {new Date(m.timestamp).toLocaleDateString()} at {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onDelete(m.id)}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md p-1.5 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Thumbnail Preview */}
                        {m.thumbnail ? (
                          <div className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden mb-3 border border-slate-100">
                            <img src={m.thumbnail} alt="Measurement Thumbnail" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-16 bg-slate-50 rounded-lg mb-3 flex items-center justify-center text-slate-300 border border-dashed border-slate-200">
                             <ImageIcon className="w-6 h-6 opacity-50" />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Area</p>
                                <p className="font-semibold text-slate-800">{formatArea(m.area, m.unit)}</p>
                            </div>
                             <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Perimeter</p>
                                <p className="font-semibold text-slate-800">{formatLength(m.perimeter)}</p>
                            </div>
                        </div>

                        {m.type === 'satellite' ? (
                            <button 
                                onClick={() => { onLoad(m); onClose(); }}
                                className="w-full mt-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-emerald-100"
                            >
                                <Upload className="w-4 h-4" />
                                Load on Map
                            </button>
                        ) : (
                            <div className="w-full mt-3 py-2 bg-slate-50 text-slate-400 text-xs font-medium text-center rounded-lg border border-slate-100 select-none">
                                Snapshot (Not Loadable)
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};