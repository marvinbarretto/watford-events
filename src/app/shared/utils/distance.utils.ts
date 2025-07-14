/**
 * @fileoverview Distance calculation utilities
 * 
 * Simple utility functions for calculating distances between geographic points.
 * No service needed - just pure functions.
 */

import { DistanceUnit } from '../../user-preferences/utils/user-preferences.types';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

// Walking speed constants
const AVERAGE_WALKING_SPEED_KMH = 5; // Average walking speed in km/h
const MINUTES_PER_HOUR = 60;

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point  
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Calculate distance between two coordinate objects
 * @param from Starting coordinates
 * @param to Destination coordinates
 * @returns Distance in kilometers
 */
export function calculateDistanceBetweenPoints(from: GeoCoordinates, to: GeoCoordinates): number {
  return calculateDistance(from.lat, from.lng, to.lat, to.lng);
}

/**
 * Convert kilometers to user's preferred unit
 * @param km Distance in kilometers
 * @param unit Target unit
 * @returns Distance in target unit
 */
export function convertDistance(km: number, unit: DistanceUnit): number {
  switch (unit) {
    case 'miles':
      return km * 0.621371;
    case 'walking-minutes':
      return convertKmToWalkingMinutes(km);
    case 'kilometers':
    default:
      return km;
  }
}

/**
 * Convert kilometers to walking time in minutes
 * @param km Distance in kilometers
 * @returns Walking time in minutes
 */
export function convertKmToWalkingMinutes(km: number): number {
  return (km / AVERAGE_WALKING_SPEED_KMH) * MINUTES_PER_HOUR;
}

/**
 * Format distance for display
 * @param distance Distance value
 * @param unit Distance unit
 * @param precision Decimal places (default: 1)
 * @returns Formatted distance string
 */
export function formatDistance(distance: number, unit: DistanceUnit, precision: number = 1): string {
  if (distance === Infinity) {
    return 'Unknown distance';
  }

  switch (unit) {
    case 'walking-minutes':
      const minutes = Math.round(distance);
      return `${minutes} min walk`;
    
    case 'miles':
      const milesRounded = Number(distance.toFixed(precision));
      const milesUnit = milesRounded === 1 ? 'mile' : 'miles';
      return `${milesRounded} ${milesUnit} away`;
    
    case 'kilometers':
    default:
      const kmRounded = Number(distance.toFixed(precision));
      return `${kmRounded} km away`;
  }
}

/**
 * Check if distance is within radius
 * @param distanceKm Distance in kilometers
 * @param radiusKm Radius in kilometers
 * @returns True if within radius
 */
export function isWithinRadius(distanceKm: number, radiusKm: number): boolean {
  return distanceKm <= radiusKm;
}

// Helper function
function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}