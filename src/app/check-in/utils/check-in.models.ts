// src/app/check-in/utils/check-in.models.ts

import { Timestamp } from "firebase/firestore";

export type CheckIn = {
  id: string;
  userId: string;
  pubId: string;
  timestamp: Timestamp;
  dateKey: string;
  missionUpdated?: boolean;

  pointsEarned?: number;
  pointsBreakdown?: string;

  carpetImageKey?: string;
};

// =====================================
// 🎯 CHECK-IN RESULT TYPES
// =====================================

/**
 * Complete check-in result data from the store/service
 * ✅ SINGLE SOURCE OF TRUTH for all check-in result types
 */
export type CheckInResultData = {
  // Core result
  success: boolean;
  error?: string;

  // Check-in data
  checkin?: CheckIn;
  pub?: CheckInPubData;



  // Carpet detection
  carpetCaptured?: boolean;
  points?: any;

  // User context
  userWhoCheckedIn?: string;

  // Navigation behavior (UI concern)
  autoNavigate?: boolean;

  // Debug info (development only)
  debugInfo?: CheckInDebugInfo;
};

/**
 * Pub data needed for check-in results
 */
export type CheckInPubData = {
  id: string;
  name: string;
};


/**
 * Debug information for development
 */
export type CheckInDebugInfo = {
  checkinTime: string;
};

// =====================================
// 🎨 UI-SPECIFIC DERIVED TYPES
// =====================================

/**
 * Data for check-in status modal (derived from CheckInResultData)
 */
export type CheckInStatusModalData = {
  success: boolean;
  pub?: CheckInPubData;
  error?: string;
  checkinTime?: Timestamp;
};

