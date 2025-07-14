// src/app/auth/data-access/auth.store.ts
/**
 * AuthStore - Authentication State Management
 *
 * SINGLE RESPONSIBILITY: Manages authentication state ONLY
 * - Login/logout operations
 * - Auth tokens and session state
 * - Basic user identity from Firebase Auth
 *
 * DOES NOT:
 * - Save to Firestore (UserStore handles that)
 * - Manage user profile data (displayName, avatar, etc.)
 * - Update user documents in Firestore
 * - Handle user preferences or settings
 *
 * LINKS TO:
 * - UserStore listens to AuthStore.user() changes
 * - When user logs in/out, UserStore loads/clears profile data
 * - AuthStore provides uid → UserStore loads user/{uid} document
 */
import { signal, computed, inject, Injectable } from '@angular/core';
import { getAuth, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { AuthService } from './auth.service';
import { SsrPlatformService } from '@shared/utils/ssr/ssr-platform.service';
import type { User } from '@users/utils/user.model';
import { OverlayService } from '@shared/data-access/overlay.service';
import { Roles } from '../utils/roles.enum';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly overlayService = inject(OverlayService);
  private readonly platform = inject(SsrPlatformService);

  // ✅ ONLY authentication state
  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _ready = signal(false);
  private readonly _userChangeCounter = signal(0);

  // ✅ Public auth signals
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly userChangeSignal = this._userChangeCounter.asReadonly();

  // ✅ ONLY auth-derived computeds
  readonly isAuthenticated = computed(() => !!this.token());
  readonly uid = computed(() => this.user()?.uid ?? null);

  constructor() {
    this.platform.onlyOnBrowser(() => {
      this.authService.onAuthChange(async (firebaseUser) => {
        if (firebaseUser) {
          await this.handleUserSignIn(firebaseUser);
        } else {
          this.handleUserSignOut();
        }
        this._ready.set(true);
      });
    });

    if (this.platform.isServer) {
      this._ready.set(true);
    }
  }

  private async handleUserSignIn(firebaseUser: FirebaseUser): Promise<void> {
    try {
      const token = await firebaseUser.getIdToken();
      let displayName = firebaseUser.displayName;


      // ✅ Create basic user object with Firebase Auth data only
      const appUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? null,
        photoURL: firebaseUser.photoURL ?? null,
        displayName: displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
        emailVerified: firebaseUser.emailVerified,
        role: this.getDefaultRole(firebaseUser),
        joinedAt: new Date().toISOString(),
      };

      // ✅ Update auth state only
      this._user.set(appUser);
      this._token.set(token);
      this._userChangeCounter.update(c => c + 1);

      // ✅ Save to localStorage only
      this.platform.onlyOnBrowser(() => {
        localStorage.setItem('user', JSON.stringify(appUser));
        localStorage.setItem('token', token);
      });

      // ✅ REMOVED: No Firestore operations here
      // UserStore will handle loading/creating user documents

    } catch (error) {
      console.error('[AuthStore] ❌ Sign-in failed:', error);
      this.handleUserSignOut();
    }
  }

  private handleUserSignOut(): void {
    this._user.set(null);
    this._token.set(null);
    this._userChangeCounter.update(c => c + 1);

    this.platform.onlyOnBrowser(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    });
  }

  // ✅ ONLY auth operations
  logout(): void {
    this.authService.logout();
  }

  async loginWithGoogle(): Promise<void> {
    await this.authService.loginWithGoogle();
  }

  loginWithEmail(email: string, password: string): void {
    this.authService.loginWithEmail(email, password);
  }

  registerWithEmail(email: string, password: string): void {
    this.authService.registerWithEmail(email, password);
  }

  resetPassword(email: string): void {
    this.authService.resetPassword(email);
  }

  /**
   * Determines the default role for a user based on their Firebase Auth data
   * @param firebaseUser - Firebase User object
   * @returns Default role for the user
   */
  private getDefaultRole(firebaseUser: FirebaseUser): Roles {
    // Check for admin emails
    const adminEmails = [
      'admin@watford-events.com',
      'marvin@watford-events.com',
      'marvin.barretto@gmail.com', // Add your actual email
      // Add more admin emails as needed
    ];

    console.log('[AuthStore] Role assignment check:', {
      userEmail: firebaseUser.email,
      adminEmails,
      isAdminEmail: firebaseUser.email && adminEmails.includes(firebaseUser.email.toLowerCase())
    });

    if (firebaseUser.email && adminEmails.includes(firebaseUser.email.toLowerCase())) {
      return Roles.Admin;
    }

    // For development, you can also check email patterns
    if (firebaseUser.email?.endsWith('@watford-events.com')) {
      return Roles.Admin;
    }

    return Roles.Authenticated;
  }
}
