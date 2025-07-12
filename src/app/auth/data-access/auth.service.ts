// src/app/auth/data-access/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser, // Firebase Auth user (contains auth tokens, email verification, etc.)
  onAuthStateChanged,
  Unsubscribe,
} from '@angular/fire/auth';
import type { User } from '../../users/utils/user.model'; // Our application user model (stored in Firestore)
import { Roles } from '../utils/roles.enum';
import { FirestoreService } from '../../shared/data-access/firestore.service';

@Injectable({ providedIn: 'root' })
export class AuthService extends FirestoreService {
  private readonly auth = inject(Auth);

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

  async loginWithGoogle(): Promise<FirebaseUser> {
    try {
      this.loading.set(true);
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(this.auth, provider);
      console.log('[AuthService] ✅ Google login successful:', cred.user.uid);

      // Ensure user document exists for registered users
      await this.ensureRegisteredUserDocument(cred.user);

      return cred.user;
    } catch (error) {
      this.loading.set(false);
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
          checkedInPubIds: [],
          streaks: {},
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          joinedAt: new Date().toISOString(),
          joinedMissionIds: [],
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
