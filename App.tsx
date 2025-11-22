import React, { useState, useEffect } from 'react';
import { AreaMeasurer } from './components/AreaMeasurer';
import { MapMeasurer } from './components/MapMeasurer';
import { Layout, Camera, Map as MapIcon, Clock } from 'lucide-react';
import { SavedMeasurement } from './types';
import { MeasurementHistory } from './components/MeasurementHistory';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'satellite' | 'photo'>('satellite');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Load history from local storage
  const [savedMeasurements, setSavedMeasurements] = useState<SavedMeasurement[]>(() => {
    try {
      const stored = localStorage.getItem('geocalc_history');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // Item passed to MapMeasurer to trigger a load
  const [measurementToLoad, setMeasurementToLoad] = useState<SavedMeasurement | null>(null);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('geocalc_history', JSON.stringify(savedMeasurements));
  }, [savedMeasurements]);

  const handleSaveMeasurement = (data: Omit<SavedMeasurement, 'id' | 'timestamp'>) => {
    if (savedMeasurements.length >= 10) {
      alert("You have reached the limit of 10 saved measurements. Please delete an old measurement to save a new one.");
      setIsHistoryOpen(true);
      return;
    }

    const newMeasurement: SavedMeasurement = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setSavedMeasurements(prev => [newMeasurement, ...prev]);
    // Optionally notify user
    // alert("Measurement saved!");
  };

  const handleDeleteMeasurement = (id: string) => {
    if (window.confirm("Are you sure you want to delete this measurement?")) {
      setSavedMeasurements(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleLoadMeasurement = (m: SavedMeasurement) => {
    if (m.type === 'satellite') {
      setActiveTab('satellite');
      setMeasurementToLoad(m);
      // Reset the trigger after a moment so re-clicking works if needed (though modal closes)
      setTimeout(() => setMeasurementToLoad(null), 500);
    } else {
      // For photo, we currently don't save the image data, so we can't restore fully.
      alert("Photo measurements store results only and cannot be fully restored to the canvas.");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 font-sans text-slate-900 relative overflow-hidden">
      {/* History Modal */}
      <MeasurementHistory 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        measurements={savedMeasurements}
        onDelete={handleDeleteMeasurement}
        onLoad={handleLoadMeasurement}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Layout className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Geocalc
              </h1>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('satellite')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'satellite' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                Satellite
              </button>
              <button
                onClick={() => setActiveTab('photo')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'photo' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Camera className="w-4 h-4" />
                Photo
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Measurement History"
              >
                <Clock className="w-5 h-5" />
                {savedMeasurements.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="sr-only">User</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'photo' ? (
          <AreaMeasurer onSave={handleSaveMeasurement} />
        ) : (
          <MapMeasurer onSave={handleSaveMeasurement} loadedRecord={measurementToLoad} />
        )}
      </main>
    </div>
  );
};

export default App;