export interface Point {
  x: number;
  y: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Size {
  width: number;
  height: number;
}

export enum AppMode {
  MEASURE = 'measure',
}

export type AreaUnit = 'auto' | 'm2' | 'km2' | 'ha' | 'ft2' | 'ac';

export interface SavedMeasurement {
  id: string;
  name: string;
  timestamp: number;
  type: 'photo' | 'satellite';
  area: number;
  perimeter: number;
  unit: AreaUnit;
  thumbnail?: string;
  // Satellite specific restoration data
  geoPoints?: GeoPoint[];
  shapeMode?: 'polygon' | 'circle';
}

// Augment Window for AI Studio specific API
declare global {
  interface Window {
    AIStudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}