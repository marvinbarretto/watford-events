
import { Roles } from '@auth/utils/roles.enum';

export type User = {
  uid: string;
  email: string | null;
  displayName: string;
  emailVerified: boolean;
  photoURL: string | null;
  joinedAt: string;
  role: Roles;

  // Pub-related data
  checkedInPubIds: string[];
  streaks: Record<string, number>;
  joinedMissionIds: string[];

  totalPoints?: number;
};





/**
 * ✅ Type guard for null safety
 */
export function isUser(user: User | null): user is User {
  return user !== null && typeof user === 'object' && 'uid' in user;
}
