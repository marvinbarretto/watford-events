import { Component, inject, OnInit } from '@angular/core';
import { AdminStore } from '../../data-access/admin.store';
import { EventService } from '@app/events/data-access/event.service';
import { VenueService } from '@app/venues/data-access/venue.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  private readonly adminStore = inject(AdminStore);
  private readonly eventService = inject(EventService);
  private readonly venueService = inject(VenueService);

  // Expose store signals to template
  readonly dashboardStats = this.adminStore.dashboardStats;
  readonly eventsLoading = this.adminStore.eventsLoading;

  async ngOnInit() {
    await this.loadDashboardData();
  }

  private async loadDashboardData() {
    this.adminStore.setEventsLoading(true);

    try {
      // Load events and venues to calculate dashboard stats
      const [events, venues] = await Promise.all([
        this.eventService.getAll(),
        this.venueService.getAll()
      ]);

      this.adminStore.setEvents(events);
      this.adminStore.setVenues(venues);
      this.adminStore.refreshDashboardStats();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      this.adminStore.setEventsLoading(false);
    }
  }
}
