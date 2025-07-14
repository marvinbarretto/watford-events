// src/app/auth/data-access/auth.service.ts
import { Injectable, inject, signal, computed, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User as FirebaseUser, // Firebase Auth user (contains auth tokens, email verification, etc.)
  onAuthStateChanged,
  Unsubscribe,
} from '@angular/fire/auth';
import type { User } from '../../users/utils/user.model'; // Our application user model (stored in Firestore)
import { Roles } from '../utils/roles.enum';
import { FirestoreService } from '../../shared/data-access/firestore.service';
import { PlatformDetectionService } from '../../shared/utils/platform-detection.service';

@Injectable({ providedIn: 'root' })
export class AuthService extends FirestoreService {
  private readonly auth = inject(Auth);
  private readonly platformDetection = inject(PlatformDetectionService);

  private readonly userInternal = signal<FirebaseUser | null>(null);
  private readonly loading = signal<boolean>(true);


  readonly user$$ = computed(() => this.userInternal());
  readonly loading$$ = computed(() => this.loading());

  constructor() {
    super();
    this.initAuthListener();
  }

  private initAuthListener() {
    console.log('[AuthService] Initializing auth state listener...');

    // Check for redirect result first (for mobile/Capacitor)
    this.checkRedirectResult();

    const unsubscribe: Unsubscribe = onAuthStateChanged(this.auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('[AuthService] Auth state changed:', firebaseUser.uid, '(authenticated)');

          // For registered users, ensure user document exists
          if (!firebaseUser.isAnonymous) {
            await this.ensureRegisteredUserDocument(firebaseUser);
          }

          this.userInternal.set(firebaseUser);
          this.loading.set(false);
        } else {
          console.log('[AuthService] No user session found. User is logged out.');
          this.userInternal.set(null);
          this.loading.set(false);
        }
      } catch (error) {
        console.error('[AuthService] Error in auth state handler:', error);
        this.userInternal.set(null);
        this.loading.set(false);
      }
    });
  }

  private async checkRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result?.user) {
        console.log('[AuthService] ✅ Redirect login successful:', result.user.uid);
        await this.ensureRegisteredUserDocument(result.user);
      }
    } catch (error) {
      console.error('[AuthService] Error checking redirect result:', error);
    }
  }



  async loginWithEmail(email: string, password: string): Promise<FirebaseUser> {
    try {
      this.loading.set(true);
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('[AuthService] ✅ Email login successful:', cred.user.uid);

      // Ensure user document exists for registered users
      await this.ensureRegisteredUserDocument(cred.user);

      return cred.user;
    } catch (error) {
      this.loading.set(false);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<FirebaseUser | void> {
    try {
      this.loading.set(true);
      const provider = new GoogleAuthProvider();
      
      // Use redirect for Capacitor native apps and mobile web browsers
      if (this.platformDetection.shouldUseRedirectAuth) {
        console.log('[AuthService] Using redirect auth for platform:', this.platformDetection.platform);
        await signInWithRedirect(this.auth, provider);
        // The actual sign-in will be handled by checkRedirectResult after redirect
        return;
      } else {
        console.log('[AuthService] Using popup auth for desktop web');
        const cred = await signInWithPopup(this.auth, provider);
        console.log('[AuthService] ✅ Google login successful:', cred.user.uid);

        // Ensure user document exists for registered users
        await this.ensureRegisteredUserDocument(cred.user);

        return cred.user;
      }
    } catch (error) {
      this.loading.set(false);
      throw error;
    }
  }

  async registerWithEmail(email: string, password: string): Promise<FirebaseUser> {
    try {
      this.loading.set(true);
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      console.log('[AuthService] ✅ Email registration successful:', cred.user.uid);

      // Ensure user document exists for registered users
      await this.ensureRegisteredUserDocument(cred.user);

      return cred.user;
    } catch (error) {
      this.loading.set(false);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      console.log('[AuthService] ✅ Password reset email sent to:', email);
    } catch (error) {
      console.error('[AuthService] Password reset failed:', error);
      throw error;
    }
  }

  /**
   * ✅ Ensures registered user document exists in Firestore
   */
  private async ensureRegisteredUserDocument(firebaseUser: FirebaseUser): Promise<void> {
    try {
      const existingUser = await this.getDocByPath<User>(`users/${firebaseUser.uid}`);

      if (!existingUser) {
        console.log('[AuthService] Creating registered user document...');

        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          joinedAt: new Date().toISOString(),
          role: Roles.Public,
        };

        await this.setDoc(`users/${firebaseUser.uid}`, newUser);
        console.log('[AuthService] ✅ Registered user document created');
      } else {
        console.log('[AuthService] Registered user document already exists');
      }
    } catch (error) {
      console.error('[AuthService] Failed to ensure registered user document:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('[AuthService] ✅ User signed out');
      this.userInternal.set(null);
    } catch (error) {
      console.error('[AuthService] Logout failed:', error);
      throw error;
    }
  }

  onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  getUid(): string | null {
    return this.userInternal()?.uid ?? null;
  }
}
