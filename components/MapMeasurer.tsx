import React, { useEffect, useRef, useState } from 'react';
import { GeoPoint, AreaUnit, SavedMeasurement } from '../types';
import * as Geometry from '../utils/geometry';
import { Trash2, Calculator, Crosshair, Locate, Ruler, Circle as CircleIcon, Hexagon, Save, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import L from 'leaflet';
import html2canvas from 'html2canvas';

interface Props {
  onSave: (data: Omit<SavedMeasurement, 'id' | 'timestamp'>) => void;
  loadedRecord: SavedMeasurement | null;
}

export const MapMeasurer: React.FC<Props> = ({ onSave, loadedRecord }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const labelsRef = useRef<L.Layer[]>([]);
  const midpointsRef = useRef<L.Marker[]>([]);
  const shapeRef = useRef<L.Polygon | L.Polyline | L.Circle | null>(null);
  
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [unit, setUnit] = useState<AreaUnit>('ha');
  const [shapeMode, setShapeMode] = useState<'polygon' | 'circle'>('polygon');
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true // Important for screenshot consistency
    }).setView([20, 0], 2);

    // Add Esri World Imagery (Satellite)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    }).addTo(map);

    L.control.attribution({ position: 'bottomright' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Try to locate immediately on load if not loading a record
    if (!loadedRecord) {
      handleLocate();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Loading Saved Measurement
  useEffect(() => {
    if (loadedRecord && loadedRecord.type === 'satellite' && loadedRecord.geoPoints) {
      // Restore state
      setPoints(loadedRecord.geoPoints);
      setUnit(loadedRecord.unit);
      if (loadedRecord.shapeMode) {
        setShapeMode(loadedRecord.shapeMode);
      }

      // Fit bounds
      if (mapInstanceRef.current && loadedRecord.geoPoints.length > 0) {
        const bounds = L.latLngBounds(loadedRecord.geoPoints.map(p => [p.lat, p.lng]));
        // Add some padding
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      }
    }
  }, [loadedRecord]);

  // Handle Map Clicks via Event Listener attached to state
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (shapeMode === 'circle' && points.length >= 2) {
        // Circle only allows 2 points (Center + Radius)
        return;
      }
      const newPoint: GeoPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPoints(prev => [...prev, newPoint]);
    };

    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [points.length, shapeMode]);

  // Update map layer rendering when points or mode change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear existing layers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    midpointsRef.current.forEach(marker => marker.remove());
    midpointsRef.current = [];
    
    labelsRef.current.forEach(label => label.remove());
    labelsRef.current = [];

    if (shapeRef.current) {
      shapeRef.current.remove();
      shapeRef.current = null;
    }

    // --- RENDER MARKERS ---
    points.forEach((p, index) => {
      const isCenter = shapeMode === 'circle' && index === 0;
      
      // Standardize marker size and anchor for perfect centering
      const icon = L.divIcon({
        className: 'bg-transparent',
        html: `<div class="w-full h-full bg-white border-2 ${isCenter ? 'border-blue-600 bg-blue-50' : 'border-emerald-500'} rounded-full shadow-sm cursor-pointer hover:scale-125 transition-transform"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      
      const marker = L.marker([p.lat, p.lng], { 
        icon, 
        draggable: true 
      }).addTo(map);

      // Handle drag
      marker.on('dragend', (e: L.DragEndEvent) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        updatePoint(index, { lat, lng });
      });

      // Handle delete via popup
      const container = document.createElement('div');
      container.className = "text-center p-1";
      const btn = document.createElement('button');
      btn.className = "text-red-600 font-bold text-xs uppercase hover:text-red-800";
      btn.innerText = "Delete Point";
      btn.onclick = () => removePoint(index);
      container.appendChild(btn);
      
      marker.bindPopup(container, { closeButton: false });

      markersRef.current.push(marker);
    });

    // --- RENDER SHAPES ---
    
    if (shapeMode === 'polygon') {
      // 1. Polygon / Polyline Rendering
      if (points.length > 1) {
        const latlngs = points.map(p => [p.lat, p.lng]);
        
        if (points.length > 2) {
          shapeRef.current = L.polygon(latlngs, {
            color: '#10B981',
            fillColor: '#10B981',
            fillOpacity: 0.3,
            weight: 2
          }).addTo(map);
        } else {
          shapeRef.current = L.polyline(latlngs, {
            color: '#10B981',
            weight: 2,
            dashArray: '5, 10'
          }).addTo(map);
        }

        // 2. Distance Labels & Midpoint Markers
        const segments = points.length > 2 ? points.length : points.length - 1;
        
        for (let i = 0; i < segments; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          
          // Midpoint Calculation
          const midLat = (p1.lat + p2.lat) / 2;
          const midLng = (p1.lng + p2.lng) / 2;
          const dist = Geometry.calculateGeoDistance(p1, p2);

          // Distance Label
          const labelIcon = L.divIcon({
            className: 'bg-transparent',
            html: `<div class="bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 shadow-sm whitespace-nowrap border border-slate-200 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">${Geometry.formatLength(dist)}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });

          const labelMarker = L.marker([midLat, midLng], { 
            icon: labelIcon, 
            interactive: false,
            zIndexOffset: 1000 
          }).addTo(map);
          labelsRef.current.push(labelMarker);

          // Interactive Midpoint Marker (Drag to add point)
          const midMarkerIcon = L.divIcon({
            className: 'bg-transparent',
            html: `<div class="w-full h-full bg-white/50 border border-slate-500 rounded-full shadow-sm hover:bg-white hover:scale-125 transition-all opacity-60 hover:opacity-100"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });

          const midMarker = L.marker([midLat, midLng], {
            icon: midMarkerIcon,
            draggable: true,
            zIndexOffset: 900
          }).addTo(map);

          midMarker.on('dragend', (e: L.DragEndEvent) => {
            const { lat, lng } = (e.target as L.Marker).getLatLng();
            // Insert new point at index i + 1
            setPoints(prev => {
              const newPoints = [...prev];
              newPoints.splice(i + 1, 0, { lat, lng });
              return newPoints;
            });
          });

          midpointsRef.current.push(midMarker);
        }
      }
    } else if (shapeMode === 'circle') {
      // Circle Rendering
      if (points.length > 0) {
        const center = points[0];
        let radius = 0;
        
        if (points.length > 1) {
          radius = Geometry.calculateGeoDistance(center, points[1]);
          
          // Draw Radius Line
          const line = L.polyline([[center.lat, center.lng], [points[1].lat, points[1].lng]], {
             color: '#3B82F6',
             dashArray: '4, 6',
             weight: 2,
             opacity: 0.6
          }).addTo(map);
          labelsRef.current.push(line);

          // Radius Label
          const midLat = (center.lat + points[1].lat) / 2;
          const midLng = (center.lng + points[1].lng) / 2;
          const labelIcon = L.divIcon({
            className: 'bg-transparent',
            html: `<div class="bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700 shadow-sm whitespace-nowrap border border-blue-200 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">r = ${Geometry.formatLength(radius)}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });
          const labelMarker = L.marker([midLat, midLng], { icon: labelIcon, interactive: false }).addTo(map);
          labelsRef.current.push(labelMarker);
        }

        shapeRef.current = L.circle([center.lat, center.lng], {
          radius: radius,
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.2,
          weight: 2
        }).addTo(map);
      }
    }

  }, [points, shapeMode]);

  const handleLocate = () => {
    if (!mapInstanceRef.current) return;
    setIsLocating(true);
    
    mapInstanceRef.current.locate({ setView: true, maxZoom: 18 });
    
    mapInstanceRef.current.once('locationfound', (e: L.LocationEvent) => {
      setIsLocating(false);
    });
    
    mapInstanceRef.current.once('locationerror', () => {
      setIsLocating(false);
    });
  };

  const updatePoint = (index: number, newPoint: GeoPoint) => {
    setPoints(prev => {
      const next = [...prev];
      next[index] = newPoint;
      return next;
    });
  };

  const removePoint = (index: number) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
  };

  const undoLastPoint = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  const clearAll = () => {
    setPoints([]);
  };

  const toggleShapeMode = (mode: 'polygon' | 'circle') => {
    setShapeMode(mode);
    if (mode === 'circle' && points.length > 2) {
      setPoints(points.slice(0, 2));
    }
  };

  // Calculations
  let areaSqM = 0;
  let perimeter = 0;

  if (shapeMode === 'polygon') {
    areaSqM = Geometry.calculateGeoPolygonArea(points);
    perimeter = Geometry.calculateGeoPerimeter(points);
  } else if (shapeMode === 'circle' && points.length > 1) {
    const radius = Geometry.calculateGeoDistance(points[0], points[1]);
    areaSqM = Math.PI * radius * radius;
    perimeter = 2 * Math.PI * radius;
  }

  const handleSaveClick = async () => {
    if (points.length < 2) {
      alert("Create a shape with at least 2 points before saving.");
      return;
    }
    
    const name = prompt("Enter a name for this measurement:", `Satellite ${new Date().toLocaleDateString()}`);
    if (!name) return;

    setIsSaving(true);
    let thumbnail: string | undefined = undefined;

    if (mapRef.current) {
      try {
        const canvas = await html2canvas(mapRef.current, {
          useCORS: true, // Critical for map tiles
          allowTaint: false,
          logging: false,
          scale: 0.5,
          ignoreElements: (element: Element) => {
            // Optionally ignore controls to get a cleaner map image
            return element.classList.contains('leaflet-control-container');
          }
        });
        thumbnail = canvas.toDataURL('image/jpeg', 0.6);
      } catch (e) {
        console.warn("Map screenshot failed", e);
      }
    }

    onSave({
      name,
      type: 'satellite',
      area: areaSqM,
      perimeter: perimeter,
      unit,
      geoPoints: points,
      shapeMode,
      thumbnail
    });
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Map Container */}
      <div ref={mapRef} className="flex-1 z-0 bg-slate-200" />

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={handleLocate}
          className="bg-white p-3 rounded-lg shadow-md hover:bg-slate-50 text-slate-700 transition-colors"
          title="Locate Me"
        >
          <Locate className={`w-6 h-6 ${isLocating ? 'animate-pulse text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Bottom Control Panel */}
      <div className="relative bg-white border-t border-slate-200 p-4 flex flex-col gap-4 z-[1000] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all ease-in-out duration-300">
        
        {/* Expand/Collapse Toggle */}
        <button 
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-500 hover:text-indigo-600 z-10 hover:scale-110 transition-all"
          aria-label={isPanelExpanded ? "Collapse panel" : "Expand panel"}
        >
          {isPanelExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {/* Shape Toggle */}
        {isPanelExpanded && (
          <div className="flex justify-center mb-2 animate-in fade-in duration-200">
            <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
               <button
                 onClick={() => toggleShapeMode('polygon')}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                   shapeMode === 'polygon' 
                     ? 'bg-white text-emerald-600 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 <Hexagon className="w-4 h-4" />
                 Polygon
               </button>
               <button
                 onClick={() => toggleShapeMode('circle')}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                   shapeMode === 'circle' 
                     ? 'bg-white text-blue-600 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 <CircleIcon className="w-4 h-4" />
                 Circle
               </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Metrics */}
          {isPanelExpanded && (
            <div className="flex items-center gap-6 w-full md:w-auto animate-in fade-in duration-200">
              <div className={`px-4 py-2 rounded-lg flex items-center gap-2 border flex-1 md:flex-none justify-center ${shapeMode === 'circle' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                <Calculator className="w-5 h-5" />
                <div className="flex flex-col items-start leading-none relative">
                  <div className="flex items-center gap-1">
                    <span className="text-xs uppercase font-semibold opacity-70">Area</span>
                    <select 
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as AreaUnit)}
                      className={`bg-transparent border-none p-0 text-xs font-bold focus:ring-0 cursor-pointer ${shapeMode === 'circle' ? 'text-blue-600/70 hover:text-blue-800' : 'text-indigo-600/70 hover:text-indigo-800'}`}
                    >
                      <option value="auto">Auto</option>
                      <option value="m2">Meters (m²)</option>
                      <option value="ha">Hectares (ha)</option>
                      <option value="km2">km²</option>
                      <option value="ft2">Feet (ft²)</option>
                      <option value="ac">Acres</option>
                    </select>
                  </div>
                  <span className="font-bold text-lg">
                    {Geometry.formatArea(areaSqM, unit)}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2 border border-emerald-100 flex-1 md:flex-none justify-center">
                <Ruler className="w-5 h-5" />
                 <div className="flex flex-col items-start leading-none">
                  <span className="text-xs uppercase font-semibold opacity-70">{shapeMode === 'circle' ? 'Circumference' : 'Perimeter'}</span>
                  <span className="font-bold text-lg">
                    {Geometry.formatLength(perimeter)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions - Always Visible */}
          <div className={`flex items-center gap-3 w-full md:w-auto justify-center ${!isPanelExpanded ? 'flex-1' : ''}`}>
             {/* Hide point count when collapsed for cleaner look */}
             {isPanelExpanded && (
               <div className="text-xs text-slate-500 mr-2 hidden md:block">
                 {points.length} points
               </div>
             )}
             
             <button 
               onClick={undoLastPoint}
               disabled={points.length === 0}
               className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Undo
             </button>

             <button 
               onClick={clearAll}
               disabled={points.length === 0}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Trash2 className="w-4 h-4" />
             </button>

             <div className="w-px h-8 bg-slate-200 mx-1"></div>

             <button 
               onClick={handleSaveClick}
               disabled={points.length < 2 || isSaving}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
               title="Save Measurement"
             >
               {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Save
             </button>
          </div>
        </div>
      </div>
      
      {/* Instruction Overlay */}
      {points.length === 0 && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-full pointer-events-none z-[1000] flex items-center gap-2 text-center w-max max-w-[90%]">
          <Crosshair className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            {shapeMode === 'polygon' 
              ? "Tap map to add points. Drag lines to add vertices." 
              : "Tap center, then tap edge to set radius."}
          </span>
        </div>
      )}
    </div>
  );
};