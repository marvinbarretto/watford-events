import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from '@auth/data-access/auth.service';
import { where } from '@angular/fire/firestore';

export type ContentType = 'event' | 'venue';

export type Like = {
  userId: string;
  contentId: string;
  contentType: ContentType;
  likedAt: Date;
};

@Injectable({ providedIn: 'root' })
export class LikeService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  /**
   * Toggle like status for a piece of content
   * Returns the new like state (true if liked, false if unliked)
   */
  async toggleLike(contentId: string, contentType: ContentType): Promise<boolean> {
    const userId = this.authService.getUid();
    if (!userId) {
      throw new Error('User must be authenticated to like content');
    }

    const likeId = this.generateLikeId(userId, contentType, contentId);
    const likePath = `likes/${likeId}`;

    // Check if like already exists (Firebase automatically uses cache for performance)
    const existingLike = await this.firestoreService.getDocByPath<Like>(likePath);

    if (existingLike) {
      // Unlike: remove the like document
      await this.firestoreService.deleteDoc(likePath);
      
      // Decrement the like count on the content
      await this.updateContentLikeCount(contentId, contentType, -1);
      
      return false;
    } else {
      // Like: create the like document
      const like: Like = {
        userId,
        contentId,
        contentType,
        likedAt: new Date()
      };
      
      await this.firestoreService.setDoc(likePath, like);
      
      // Increment the like count on the content
      await this.updateContentLikeCount(contentId, contentType, 1);
      
      return true;
    }
  }

  /**
   * Check if the current user has liked a piece of content
   */
  async isLiked(contentId: string, contentType: ContentType): Promise<boolean> {
    const userId = this.authService.getUid();
    if (!userId) return false;

    const likeId = this.generateLikeId(userId, contentType, contentId);
    return await this.firestoreService.exists(`likes/${likeId}`);
  }

  /**
   * Get all likes for a user
   */
  async getUserLikes(userId: string, contentType?: ContentType): Promise<Like[]> {
    const constraints = [where('userId', '==', userId)];
    
    if (contentType) {
      constraints.push(where('contentType', '==', contentType));
    }

    return await this.firestoreService.getDocsWhere<Like>('likes', ...constraints);
  }

  /**
   * Get like count for a piece of content
   * This queries the cached count on the content document for performance
   */
  async getLikeCount(contentId: string, contentType: ContentType): Promise<number> {
    const collectionPath = contentType === 'event' ? 'events' : 'venues';
    const content = await this.firestoreService.getDocByPath<{ likeCount?: number }>(`${collectionPath}/${contentId}`);
    return content?.likeCount || 0;
  }

  /**
   * Get multiple like states for the current user
   * Useful for checking multiple items in a list
   */
  async getMultipleLikeStates(
    contentItems: Array<{ id: string; type: ContentType }>
  ): Promise<Record<string, boolean>> {
    const userId = this.authService.getUid();
    if (!userId) return {};

    const likeStates: Record<string, boolean> = {};
    
    // Batch check all like states
    const checks = contentItems.map(async (item) => {
      const likeId = this.generateLikeId(userId, item.type, item.id);
      const exists = await this.firestoreService.exists(`likes/${likeId}`);
      likeStates[`${item.type}_${item.id}`] = exists;
    });

    await Promise.all(checks);
    return likeStates;
  }

  /**
   * Update the cached like count on the content document
   */
  private async updateContentLikeCount(
    contentId: string, 
    contentType: ContentType, 
    increment: number
  ): Promise<void> {
    const collectionPath = contentType === 'event' ? 'events' : 'venues';
    const contentPath = `${collectionPath}/${contentId}`;
    
    // Get current count
    const content = await this.firestoreService.getDocByPath<{ likeCount?: number }>(contentPath);
    const currentCount = content?.likeCount || 0;
    const newCount = Math.max(0, currentCount + increment); // Ensure count doesn't go below 0
    
    // Update the count
    await this.firestoreService.updateDoc(contentPath, { likeCount: newCount });
  }

  /**
   * Generate a consistent like document ID
   */
  private generateLikeId(userId: string, contentType: ContentType, contentId: string): string {
    return `${userId}_${contentType}_${contentId}`;
  }

  /**
   * Utility method to parse like ID back into components
   */
  private parseLikeId(likeId: string): { userId: string; contentType: ContentType; contentId: string } | null {
    const parts = likeId.split('_');
    if (parts.length !== 3) return null;
    
    const [userId, contentType, contentId] = parts;
    if (contentType !== 'event' && contentType !== 'venue') return null;
    
    return { userId, contentType: contentType as ContentType, contentId };
  }
}