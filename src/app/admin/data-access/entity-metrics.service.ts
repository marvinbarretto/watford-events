import { Injectable, inject } from '@angular/core';
import { EntityResolutionService } from './entity-resolution.service';
import { ArtistService } from './artist.service';
import { VenueEntityService } from './venue-entity.service';

export interface EntityMetrics {
  unresolvedArtists: number;
  unresolvedVenues: number;
  totalArtists: number;
  totalVenues: number;
  duplicateArtistCandidates: number;
  duplicateVenueCandidates: number;
  dataHealthScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class EntityMetricsService {
  private readonly entityResolutionService = inject(EntityResolutionService);
  private readonly artistService = inject(ArtistService);
  private readonly venueEntityService = inject(VenueEntityService);

  /**
   * Get comprehensive entity metrics for dashboard
   */
  async getEntityMetrics(): Promise<EntityMetrics> {
    try {
      const [
        unresolvedArtists,
        unresolvedVenues,
        artists,
        venues,
        duplicateArtists,
        duplicateVenues
      ] = await Promise.all([
        this.entityResolutionService.findUnresolvedArtists(),
        this.entityResolutionService.findUnresolvedVenues(),
        this.artistService.getArtists(),
        this.venueEntityService.getVenues(),
        this.entityResolutionService.findDuplicateArtists(0.8),
        this.entityResolutionService.findDuplicateVenues(0.8)
      ]);

      const totalUnresolved = unresolvedArtists.length + unresolvedVenues.length;
      const totalDuplicates = duplicateArtists.length + duplicateVenues.length;
      const totalEntities = artists.length + venues.length;

      // Calculate data health score (0-100)
      // Formula: 100 - (unresolved_weight * unresolved_ratio) - (duplicate_weight * duplicate_ratio)
      const unresolvedRatio = totalEntities > 0 ? totalUnresolved / (totalEntities + totalUnresolved) : 0;
      const duplicateRatio = totalEntities > 0 ? totalDuplicates / totalEntities : 0;
      
      const dataHealthScore = Math.max(0, Math.round(
        100 - (60 * unresolvedRatio) - (40 * duplicateRatio)
      ));

      return {
        unresolvedArtists: unresolvedArtists.length,
        unresolvedVenues: unresolvedVenues.length,
        totalArtists: artists.length,
        totalVenues: venues.length,
        duplicateArtistCandidates: duplicateArtists.length,
        duplicateVenueCandidates: duplicateVenues.length,
        dataHealthScore
      };
    } catch (error) {
      console.error('Error calculating entity metrics:', error);
      return {
        unresolvedArtists: 0,
        unresolvedVenues: 0,
        totalArtists: 0,
        totalVenues: 0,
        duplicateArtistCandidates: 0,
        duplicateVenueCandidates: 0,
        dataHealthScore: 0
      };
    }
  }

  /**
   * Get entity health issues summary
   */
  async getEntityHealthSummary(): Promise<{
    issues: Array<{
      type: 'unresolved-artist' | 'unresolved-venue' | 'duplicate-artist' | 'duplicate-venue';
      count: number;
      severity: 'high' | 'medium' | 'low';
      description: string;
    }>;
    totalIssues: number;
  }> {
    const metrics = await this.getEntityMetrics();
    const issues = [];

    if (metrics.unresolvedArtists > 0) {
      issues.push({
        type: 'unresolved-artist' as const,
        count: metrics.unresolvedArtists,
        severity: (metrics.unresolvedArtists > 10 ? 'high' : metrics.unresolvedArtists > 5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        description: `${metrics.unresolvedArtists} artist name${metrics.unresolvedArtists === 1 ? '' : 's'} need entity resolution`
      });
    }

    if (metrics.unresolvedVenues > 0) {
      issues.push({
        type: 'unresolved-venue' as const,
        count: metrics.unresolvedVenues,
        severity: (metrics.unresolvedVenues > 10 ? 'high' : metrics.unresolvedVenues > 5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        description: `${metrics.unresolvedVenues} venue name${metrics.unresolvedVenues === 1 ? '' : 's'} need entity resolution`
      });
    }

    if (metrics.duplicateArtistCandidates > 0) {
      issues.push({
        type: 'duplicate-artist' as const,
        count: metrics.duplicateArtistCandidates,
        severity: (metrics.duplicateArtistCandidates > 5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        description: `${metrics.duplicateArtistCandidates} potential duplicate artist${metrics.duplicateArtistCandidates === 1 ? '' : 's'} found`
      });
    }

    if (metrics.duplicateVenueCandidates > 0) {
      issues.push({
        type: 'duplicate-venue' as const,
        count: metrics.duplicateVenueCandidates,
        severity: (metrics.duplicateVenueCandidates > 5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        description: `${metrics.duplicateVenueCandidates} potential duplicate venue${metrics.duplicateVenueCandidates === 1 ? '' : 's'} found`
      });
    }

    return {
      issues,
      totalIssues: issues.reduce((sum, issue) => sum + issue.count, 0)
    };
  }
}