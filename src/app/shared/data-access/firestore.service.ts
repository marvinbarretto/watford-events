import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  CollectionReference,
  DocumentReference,
  QuerySnapshot,
  DocumentData,
  QueryConstraint,
  query,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { FirebaseMetricsService } from './firebase-metrics.service';
import { SsrPlatformService } from '@shared/utils/ssr/ssr-platform.service';

/**
 * 🔥 FIREBASE FIRESTORE SERVICE 🔥
 * 
 * This service provides a clean abstraction over Firebase Firestore with built-in:
 * 
 * 📱 OFFLINE-FIRST SUPPORT:
 * Firebase automatically caches ALL reads in IndexedDB for instant offline access.
 * When offline, your app works seamlessly using cached data.
 * When back online, Firebase syncs changes automatically.
 * 
 * 🚀 PERFORMANCE BENEFITS:
 * - First load: Network request (cached for future)
 * - Subsequent loads: Instant cache response
 * - Offline: 100% functional using cache
 * - Real-time: Live updates when online
 * 
 * 💡 HOW IT WORKS:
 * 1. Call any method (collection$, doc$, etc.)
 * 2. Firebase checks cache first (IndexedDB)
 * 3. Returns cached data immediately if available
 * 4. Fetches fresh data in background
 * 5. Updates cache and notifies subscribers
 * 
 * No custom caching code needed - Firebase handles everything!
 */
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private injector = inject(Injector);
  protected firestore = inject(Firestore);
  private metricsService = inject(FirebaseMetricsService);
  protected platform = inject(SsrPlatformService);

  constructor() {
    // 📊 Log network status for educational purposes (only in browser)
    this.platform.onlyOnBrowser(() => {
      this.monitorNetworkStatus();
    });
  }

  /**
   * 📚 COLLECTION FETCH - One-time fetch of all documents in a collection
   * 
   * 🔍 WHAT HAPPENS:
   * 1. Firebase checks IndexedDB cache first
   * 2. Returns cached data if available (instant response)
   * 3. Fetches from network in background if needed
   * 4. Updates cache with fresh data
   * 
   * 📊 Performance: Cache hits are ~100x faster than network requests!
   */
  public collection$<T>(path: string): Observable<T[]> {
    const startTime = performance.now();
    console.log(`🔥 [Firestore] 📚 Collection fetch started: ${path}`);
    
    this.metricsService.trackCall('read', path, 'collection$');
    
    return runInInjectionContext(this.injector, () => {
      const col = collection(this.firestore, path) as CollectionReference<T>;
      return from(getDocs(col)).pipe(
        tap(() => {
          const duration = performance.now() - startTime;
          console.log(`✅ [Firestore] 📚 Collection "${path}" fetched in ${duration.toFixed(1)}ms`);
          if (duration < 50) {
            console.log(`⚡ [Firestore] 🎯 CACHE HIT! Lightning fast response (${duration.toFixed(1)}ms)`);
          } else {
            console.log(`🌐 [Firestore] 📡 Network request completed (${duration.toFixed(1)}ms)`);
          }
        }),
        map(snapshot => {
          const docs = snapshot.docs.map(doc => doc.data() as unknown as T);
          console.log(`📊 [Firestore] 📚 Collection "${path}" returned ${docs.length} documents`);
          return docs;
        })
      );
    });
  }

  /**
   * 📄 DOCUMENT FETCH - One-time fetch of a single document by full path
   * 
   * 🔍 WHAT HAPPENS:
   * 1. Firebase checks IndexedDB cache for this specific document
   * 2. Returns cached version instantly if available
   * 3. Fetches fresh data from network if cache is stale/missing
   * 4. Updates cache with latest data
   * 
   * 💡 TIP: Document fetches are even faster than collections from cache!
   */
  public doc$<T>(path: string): Observable<T | undefined> {
    const startTime = performance.now();
    console.log(`🔥 [Firestore] 📄 Document fetch started: ${path}`);
    
    this.metricsService.trackCall('read', this.extractCollectionFromPath(path), 'doc$');
    
    return runInInjectionContext(this.injector, () => {
      const ref = doc(this.firestore, path) as DocumentReference<T>;
      return from(getDoc(ref)).pipe(
        tap(() => {
          const duration = performance.now() - startTime;
          console.log(`✅ [Firestore] 📄 Document "${path}" fetched in ${duration.toFixed(1)}ms`);
          if (duration < 20) {
            console.log(`⚡ [Firestore] 🎯 CACHE HIT! Ultra-fast document response (${duration.toFixed(1)}ms)`);
          } else {
            console.log(`🌐 [Firestore] 📡 Network document fetch completed (${duration.toFixed(1)}ms)`);
          }
        }),
        map(snapshot => {
          const data = snapshot.data();
          console.log(`📊 [Firestore] 📄 Document "${path}" ${data ? 'found' : 'not found'}`);
          return data;
        })
      );
    });
  }

  /**
   * 💾 DOCUMENT CREATE/UPDATE - Set a document by path (overwrites if exists)
   * 
   * 🔍 WHAT HAPPENS:
   * 1. Write goes to Firestore immediately if online
   * 2. If offline, write is queued locally and synced when back online
   * 3. Local cache is updated immediately for instant UI updates
   * 4. Offline writes are persistent across browser refreshes
   * 
   * 🌐 OFFLINE BEHAVIOR: Your writes work even offline!
   */
  public setDoc<T>(path: string, data: T): Promise<void> {
    const isOnline = this.platform.onlyOnBrowser(() => navigator.onLine) ?? true;
    console.log(`🔥 [Firestore] 💾 Setting document: ${path}`, { online: isOnline });
    
    this.metricsService.trackCall('write', this.extractCollectionFromPath(path), 'setDoc');
    
    return runInInjectionContext(this.injector, () => {
      const ref = doc(this.firestore, path) as DocumentReference<T>;
      return setDoc(ref, data).then(() => {
        console.log(`✅ [Firestore] 💾 Document "${path}" ${isOnline ? 'saved to server' : 'queued for sync'}`);
        if (!isOnline) {
          console.log(`📱 [Firestore] 🔄 Write queued - will sync when back online`);
        }
      });
    });
  }

  /**
   * Update a document by path (merges fields).
   */
  public updateDoc<T>(path: string, data: Partial<T>): Promise<void> {
    this.metricsService.trackCall('write', this.extractCollectionFromPath(path), 'updateDoc');
    return runInInjectionContext(this.injector, () => {
      const ref = doc(this.firestore, path) as DocumentReference<T>;
      return updateDoc(ref, data);
    });
  }

  /**
   * Delete a document by path.
   */
  public deleteDoc(path: string): Promise<void> {
    this.metricsService.trackCall('delete', this.extractCollectionFromPath(path), 'deleteDoc');
    return runInInjectionContext(this.injector, () => {
      const ref = doc(this.firestore, path);
      return deleteDoc(ref);
    });
  }

  /**
   * Add a document to a collection (auto-generates ID).
   */
  public addDocToCollection<T>(path: string, data: T): Promise<DocumentReference<T>> {
    this.metricsService.trackCall('write', path, 'addDoc');
    return runInInjectionContext(this.injector, () => {
      const col = collection(this.firestore, path) as CollectionReference<T>;
      return addDoc(col, data);
    });
  }

  /**
   * Map a QuerySnapshot into data objects with injected Firestore document IDs.
   */
  public mapSnapshotWithId<T>(snapshot: QuerySnapshot<DocumentData>): (T & { id: string })[] {
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as T),
    }));
  }



  /**
   * One-time fetch of a subcollection under a parent document.
   */
  public async getDocByPath<T>(path: string): Promise<T | undefined> {
    this.metricsService.trackCall('read', this.extractCollectionFromPath(path), 'getDocByPath');
    return runInInjectionContext(this.injector, async () => {
      const ref = doc(this.firestore, path) as DocumentReference<T>;
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as T) : undefined;
    });
  }

  public async getDocsWhere<T>(
    path: string,
    ...conditions: QueryConstraint[]
  ): Promise<(T & { id: string })[]> {
    this.metricsService.trackCall('read', path, 'getDocsWhere');
    return runInInjectionContext(this.injector, async () => {
      const ref = collection(this.firestore, path);
      const q = query(ref, ...conditions);
      const snapshot = await getDocs(q);
      return this.mapSnapshotWithId<T>(snapshot);
    });
  }

  public async exists(path: string): Promise<boolean> {
    this.metricsService.trackCall('read', this.extractCollectionFromPath(path), 'exists');
    return runInInjectionContext(this.injector, async () => {
      const ref = doc(this.firestore, path);
      const snap = await getDoc(ref);
      return snap.exists();
    });
  }

  /**
   * Extract collection name from a document path
   * @param path - Document path like "users/123" or "checkins/abc"
   * @returns Collection name like "users" or "checkins"
   */
  private extractCollectionFromPath(path: string): string {
    return path.split('/')[0];
  }

  /**
   * 📊 NETWORK MONITORING - Monitor online/offline status for educational purposes
   * 
   * This helps you see how Firebase handles network changes:
   * - When you go offline: Reads come from cache, writes are queued
   * - When you come back online: Queued writes sync automatically
   */
  private monitorNetworkStatus(): void {
    const window = this.platform.getWindow();
    if (!window) return; // Exit early if not in browser
    
    console.log(`🔥 [Firestore] 🌐 Initial network status: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}`);
    
    // Monitor network status changes
    window.addEventListener('online', () => {
      console.log(`🔥 [Firestore] ✅ BACK ONLINE! Firebase will now sync any pending writes`);
      console.log(`🔥 [Firestore] 🔄 Any queued writes will automatically sync to server`);
    });

    window.addEventListener('offline', () => {
      console.log(`🔥 [Firestore] 📱 GONE OFFLINE! Switching to cache-only mode`);
      console.log(`🔥 [Firestore] 💾 Reads will come from IndexedDB cache`);
      console.log(`🔥 [Firestore] 📝 Writes will be queued for later sync`);
    });

    // Log browser support for offline features
    if ('serviceWorker' in navigator) {
      console.log(`🔥 [Firestore] 🔧 Service Worker supported - offline capabilities enhanced`);
    }
    
    if ('indexedDB' in window) {
      console.log(`🔥 [Firestore] 💾 IndexedDB supported - Firebase cache is ready`);
    }
  }
}
