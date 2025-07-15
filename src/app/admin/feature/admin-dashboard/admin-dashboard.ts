import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminStore } from '../../data-access/admin.store';
import { DataQualityStore } from '../../data-access/data-quality.store';
import { EntityMetricsService, EntityMetrics } from '../../data-access/entity-metrics.service';
import { EventService } from '@app/events/data-access/event.service';
import { VenueService } from '@app/venues/data-access/venue.service';

/**
 * Admin dashboard configuration interface
 */
interface AdminDashboardConfig {
  stats: DashboardStat[];
  primaryActions: AdminAction[];
  secondaryActions: AdminAction[];
  recentActivities: AdminActivity[];
}

interface DashboardStat {
  id: string;
  title: string;
  icon: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  color?: string;
  link?: string;
}

interface AdminAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  badge?: {
    value: number | string;
    color: string;
  };
}

interface AdminActivity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'event' | 'venue' | 'user' | 'system';
  link?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  private readonly adminStore = inject(AdminStore);
  private readonly dataQualityStore = inject(DataQualityStore);
  private readonly entityMetricsService = inject(EntityMetricsService);
  private readonly eventService = inject(EventService);
  private readonly venueService = inject(VenueService);

  // Loading state
  protected readonly isLoading = signal(false);
  protected readonly lastUpdated = signal<Date | null>(null);
  
  // Entity metrics
  protected readonly entityMetrics = signal<EntityMetrics | null>(null);

  // Dashboard configuration
  protected readonly dashboardConfig = computed((): AdminDashboardConfig => {
    const stats = this.adminStore.dashboardStats();
    const dataQuality = this.dataQualityStore.quickStats();
    const criticalIssues = this.dataQualityStore.criticalIssues().length;
    const entityMetrics = this.entityMetrics();

    return {
      stats: [
        {
          id: 'total-events',
          title: 'Total Events',
          icon: '📅',
          value: stats.totalEvents,
          color: '#3b82f6',
          link: '/admin/events'
        },
        {
          id: 'pending-events',
          title: 'Pending Events',
          icon: '⏳',
          value: stats.pendingEvents,
          color: '#f59e0b',
          link: '/admin/events'
        },
        {
          id: 'approved-events',
          title: 'Approved Events',
          icon: '✅',
          value: stats.approvedEvents,
          color: '#10b981',
          link: '/admin/events'
        },
        {
          id: 'total-venues',
          title: 'Total Venues',
          icon: '🏢',
          value: stats.totalVenues,
          color: '#8b5cf6',
          link: '/admin/venues'
        },
        {
          id: 'data-health',
          title: 'Data Health',
          icon: '📊',
          value: `${dataQuality.healthScore}%`,
          color: this.getHealthScoreColor(dataQuality.healthScore),
          link: '/admin/data-quality'
        },
        {
          id: 'critical-issues',
          title: 'Critical Issues',
          icon: '⚠️',
          value: criticalIssues,
          color: criticalIssues > 0 ? '#ef4444' : '#10b981',
          link: '/admin/data-quality'
        },
        {
          id: 'unresolved-artists',
          title: 'Unresolved Artists',
          icon: '🎭',
          value: entityMetrics?.unresolvedArtists || 0,
          color: (entityMetrics?.unresolvedArtists || 0) > 0 ? '#f59e0b' : '#10b981',
          link: '/admin/reconciliation'
        },
        {
          id: 'unresolved-venues',
          title: 'Unresolved Venues',
          icon: '🏗️',
          value: entityMetrics?.unresolvedVenues || 0,
          color: (entityMetrics?.unresolvedVenues || 0) > 0 ? '#f59e0b' : '#10b981',
          link: '/admin/reconciliation'
        },
        {
          id: 'entity-health',
          title: 'Entity Health',
          icon: '🔗',
          value: `${entityMetrics?.dataHealthScore || 0}%`,
          color: this.getHealthScoreColor(entityMetrics?.dataHealthScore || 0),
          link: '/admin/reconciliation'
        }
      ],
      primaryActions: [
        {
          id: 'manage-events',
          title: 'Manage Events',
          description: 'View, edit, and approve events',
          icon: '📅',
          link: '/admin/events',
          color: 'primary',
          badge: stats.pendingEvents > 0 ? {
            value: stats.pendingEvents,
            color: '#f59e0b'
          } : undefined
        },
        {
          id: 'data-quality',
          title: 'Data Quality',
          description: 'Monitor and improve data health',
          icon: '📊',
          link: '/admin/data-quality',
          color: criticalIssues > 0 ? 'warning' : 'secondary',
          badge: criticalIssues > 0 ? {
            value: criticalIssues,
            color: '#ef4444'
          } : undefined
        },
        {
          id: 'venue-reconciliation',
          title: 'Venue Reconciliation',
          description: 'Assign venues to events',
          icon: '🔗',
          link: '/admin/venue-reconciliation',
          color: 'secondary'
        },
        {
          id: 'entity-reconciliation',
          title: 'Entity Reconciliation',
          description: 'Resolve artists and venues',
          icon: '🎭',
          link: '/admin/reconciliation',
          color: (entityMetrics?.unresolvedArtists || 0) + (entityMetrics?.unresolvedVenues || 0) > 10 ? 'warning' : 'secondary',
          badge: (entityMetrics?.unresolvedArtists || 0) + (entityMetrics?.unresolvedVenues || 0) > 0 ? {
            value: (entityMetrics?.unresolvedArtists || 0) + (entityMetrics?.unresolvedVenues || 0),
            color: '#f59e0b'
          } : undefined
        }
      ],
      secondaryActions: [
        {
          id: 'manage-venues',
          title: 'Manage Venues',
          description: 'Add, edit, and organize venues',
          icon: '🏢',
          link: '/admin/venues',
          color: 'secondary'
        },
        {
          id: 'web-scraping',
          title: 'Web Scraping',
          description: 'Configure automated content collection',
          icon: '🕷️',
          link: '/admin/scraping',
          color: 'secondary'
        },
        {
          id: 'create-event',
          title: 'Create Event',
          description: 'Add a new event to the platform',
          icon: '➕',
          link: '/events/create',
          color: 'success'
        },
        {
          id: 'create-venue',
          title: 'Create Venue',
          description: 'Add a new venue to the platform',
          icon: '🏢➕',
          link: '/admin/venues/new',
          color: 'success'
        },
        {
          id: 'manage-artists',
          title: 'Manage Artists',
          description: 'View and edit artist entities',
          icon: '🎭',
          link: '/admin/reconciliation?tab=artists',
          color: 'secondary'
        },
        {
          id: 'manage-venue-entities',
          title: 'Manage Venue Entities',
          description: 'View and edit venue entities',
          icon: '🏗️',
          link: '/admin/reconciliation?tab=venues',
          color: 'secondary'
        }
      ],
      recentActivities: [
        // TODO: Implement recent activities tracking
        {
          id: 'activity-1',
          title: 'Data Quality Analysis',
          description: 'Last analysis completed successfully',
          timestamp: this.dataQualityStore.lastAnalysis()?.analyzedAt || new Date(),
          type: 'system',
          link: '/admin/data-quality'
        }
      ]
    };
  });

  async ngOnInit() {
    await this.loadDashboardData();
    
    // Load data quality analysis if stale
    if (this.dataQualityStore.isAnalysisStale()) {
      try {
        await this.dataQualityStore.analyzeDataQuality();
      } catch (error) {
        console.warn('Failed to load data quality analysis:', error);
      }
    }

    // Load entity metrics
    await this.loadEntityMetrics();
  }

  private async loadDashboardData() {
    this.isLoading.set(true);

    try {
      // Load events and venues to calculate dashboard stats
      const [events, venues] = await Promise.all([
        this.eventService.getAll(),
        this.venueService.getAll()
      ]);

      this.adminStore.setEvents(events);
      this.adminStore.setVenues(venues);
      this.adminStore.refreshDashboardStats();
      this.lastUpdated.set(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async refreshDashboard() {
    await this.loadDashboardData();
    
    // Also refresh data quality analysis
    try {
      await this.dataQualityStore.analyzeDataQuality();
    } catch (error) {
      console.warn('Failed to refresh data quality analysis:', error);
    }

    // Refresh entity metrics
    await this.loadEntityMetrics();
  }

  private async loadEntityMetrics() {
    try {
      const metrics = await this.entityMetricsService.getEntityMetrics();
      this.entityMetrics.set(metrics);
    } catch (error) {
      console.warn('Failed to load entity metrics:', error);
    }
  }

  protected formatLastUpdated(): string {
    const lastUpdated = this.lastUpdated();
    if (!lastUpdated) return '';
    
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    }).format(lastUpdated);
  }

  protected getActionButtonClass(action: AdminAction): string {
    const baseClass = 'action-button';
    return `${baseClass} ${action.color}`;
  }

  private getHealthScoreColor(score: number): string {
    if (score >= 90) return '#10b981'; // green
    if (score >= 75) return '#3b82f6'; // blue
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  }

  protected getActivityIcon(type: AdminActivity['type']): string {
    const icons = {
      event: '📅',
      venue: '🏢',
      user: '👤',
      system: '⚙️'
    };
    return icons[type];
  }

  protected formatActivityTime(timestamp: Date): string {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.floor((timestamp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 'day');
  }
}
