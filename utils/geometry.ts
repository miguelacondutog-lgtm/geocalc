import { Point, GeoPoint, AreaUnit } from '../types';

export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const calculatePolygonArea = (points: Point[]): number => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};

/**
 * Calculates the distance between two geo points in meters using Haversine formula.
 */
export const calculateGeoDistance = (p1: GeoPoint, p2: GeoPoint): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = p1.lat * Math.PI / 180;
  const φ2 = p2.lat * Math.PI / 180;
  const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
  const Δλ = (p2.lng - p1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculates the total perimeter of the polygon or length of polyline.
 */
export const calculateGeoPerimeter = (points: GeoPoint[]): number => {
  if (points.length < 2) return 0;
  let dist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    dist += calculateGeoDistance(points[i], points[i + 1]);
  }
  // Close the loop if it's a polygon (3+ points)
  if (points.length > 2) {
    dist += calculateGeoDistance(points[points.length - 1], points[0]);
  }
  return dist;
};

/**
 * Calculates the area of a polygon on the earth's surface in square meters.
 * Uses a spherical approximation.
 */
export const calculateGeoPolygonArea = (points: GeoPoint[]): number => {
  if (points.length < 3) return 0;
  
  const R = 6378137; // Earth radius in meters
  const d2r = Math.PI / 180;
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    
    // This formula calculates the spherical area based on longitude differences and latitude
    area += (p2.lng - p1.lng) * d2r * (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
  }
  
  area = area * R * R / 2.0;
  return Math.abs(area);
};

export const formatArea = (areaSqMeters: number, unit: AreaUnit = 'auto'): string => {
  if (unit === 'auto') {
    if (areaSqMeters < 1) {
      return `${(areaSqMeters * 10000).toFixed(2)} cm²`;
    }
    if (areaSqMeters > 1000000) {
      return `${(areaSqMeters / 1000000).toFixed(2)} km²`;
    }
    return `${areaSqMeters.toFixed(2)} m²`;
  }

  switch (unit) {
    case 'ha':
      return `${(areaSqMeters / 10000).toFixed(4)} ha`;
    case 'km2':
      return `${(areaSqMeters / 1000000).toFixed(4)} km²`;
    case 'ft2':
      return `${(areaSqMeters * 10.7639).toFixed(2)} ft²`;
    case 'ac':
      return `${(areaSqMeters / 4046.86).toFixed(4)} ac`;
    case 'm2':
    default:
      return `${areaSqMeters.toFixed(2)} m²`;
  }
};

export const formatLength = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(1)} m`;
};