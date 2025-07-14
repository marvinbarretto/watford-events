import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-events-directory',
  imports: [RouterModule],
  template: `
    <div class="events-directory">
      <!-- Header -->
      <header class="directory-header">
        <h1 class="page-title">Events Hub</h1>
        <p class="page-subtitle">Everything you need to create, manage, and discover events</p>
      </header>

      <!-- Main Content Grid -->
      <div class="directory-grid">

        <!-- Add Events Section -->
        <section class="directory-section add-events">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">➕</span>
              Add Events
            </h2>
            <p class="section-description">Multiple ways to create your event</p>
          </div>

          <div class="action-cards">
            <a routerLink="/events/create" class="action-card featured">
              <div class="card-icon">➕</div>
              <h3 class="card-title">Create Event</h3>
              <p class="card-description">Quick and simple 3-question creator</p>
              <span class="card-badge">Recommended</span>
            </a>

            <a routerLink="/events/add" class="action-card">
              <div class="card-icon">📝</div>
              <h3 class="card-title">Advanced Form</h3>
              <p class="card-description">Detailed form with all options</p>
            </a>
          </div>
        </section>

        <!-- Parse & Process Section -->
        <section class="directory-section parse-events">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">⚡</span>
              Parse & Process
            </h2>
            <p class="section-description">Advanced event processing tools</p>
          </div>

          <div class="action-cards">
            <a routerLink="/events/parser" class="action-card">
              <div class="card-icon">🔍</div>
              <h3 class="card-title">Event Parser</h3>
              <p class="card-description">Process multiple event sources</p>
            </a>

            <a routerLink="/events/enhanced-parser" class="action-card">
              <div class="card-icon">🚀</div>
              <h3 class="card-title">Enhanced Parser</h3>
              <p class="card-description">Advanced parsing with AI</p>
            </a>

            <a routerLink="/flyer-parser" class="action-card">
              <div class="card-icon">🖼️</div>
              <h3 class="card-title">Flyer Parser</h3>
              <p class="card-description">Dedicated flyer processing</p>
            </a>
          </div>
        </section>

        <!-- Browse Events Section -->
        <section class="directory-section browse-events">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">🔍</span>
              Browse & Discover
            </h2>
            <p class="section-description">Find and explore events</p>
          </div>

          <div class="action-cards">
            <a routerLink="/" class="action-card">
              <div class="card-icon">🏠</div>
              <h3 class="card-title">Home Feed</h3>
              <p class="card-description">Latest events and updates</p>
            </a>

            <a routerLink="/venues" class="action-card">
              <div class="card-icon">📍</div>
              <h3 class="card-title">Venues</h3>
              <p class="card-description">Browse events by location</p>
            </a>
          </div>
        </section>

        <!-- Admin Section (if applicable) -->
        <section class="directory-section admin-events">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">⚙️</span>
              Management
            </h2>
            <p class="section-description">Admin and management tools</p>
          </div>

          <div class="action-cards">
            <a routerLink="/admin/events" class="action-card admin">
              <div class="card-icon">👑</div>
              <h3 class="card-title">Admin Dashboard</h3>
              <p class="card-description">Manage all events and users</p>
            </a>

            <a routerLink="/admin/venues" class="action-card admin">
              <div class="card-icon">🏢</div>
              <h3 class="card-title">Venue Management</h3>
              <p class="card-description">Add and manage venues</p>
            </a>
          </div>
        </section>

      </div>

      <!-- Quick Stats Footer -->
      <footer class="directory-footer">
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-number">5</span>
            <span class="stat-label">Creation Methods</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">3</span>
            <span class="stat-label">Parsing Tools</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">∞</span>
            <span class="stat-label">Possibilities</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .events-directory {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
      min-height: 100vh;
      background: var(--background);
    }

    /* Header */
    .directory-header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--border);
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-subtitle {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
      font-weight: 400;
    }

    /* Directory Grid */
    .directory-grid {
      display: grid;
      gap: 3rem;
      margin-bottom: 3rem;
    }

    /* Section Styling */
    .directory-section {
      background: var(--background-lighter);
      border-radius: 16px;
      padding: 2rem;
      border: 1px solid var(--border);
    }

    .section-header {
      margin-bottom: 1.5rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.375rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.5rem 0;
    }

    .section-icon {
      font-size: 1.5rem;
    }

    .section-description {
      color: var(--text-secondary);
      margin: 0;
      font-size: 0.9375rem;
    }

    /* Action Cards Grid */
    .action-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    /* Action Card Styling */
    .action-card {
      position: relative;
      display: block;
      background: var(--background);
      border: 2px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      text-decoration: none;
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .action-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--border);
      transition: all 0.3s ease;
    }

    .action-card:hover {
      transform: translateY(-4px);
      border-color: var(--primary);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .action-card:hover::before {
      background: linear-gradient(90deg, var(--primary), var(--accent));
    }

    /* Featured Card */
    .action-card.featured {
      border-color: var(--primary);
      background: linear-gradient(135deg, var(--background) 0%, var(--background-lighter) 100%);
    }

    .action-card.featured::before {
      background: linear-gradient(90deg, var(--primary), var(--accent));
    }

    /* Experimental Card */
    .action-card.experimental {
      border-color: var(--warning);
      background: linear-gradient(135deg, var(--background) 0%, var(--background-lightest) 100%);
    }

    .action-card.experimental::before {
      background: linear-gradient(90deg, var(--warning), var(--warning-hover));
    }

    /* Admin Card */
    .action-card.admin {
      border-color: var(--secondary);
      opacity: 0.8;
    }

    .action-card.admin:hover {
      opacity: 1;
      border-color: var(--accent);
    }

    /* Card Content */
    .card-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      display: block;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.5rem 0;
      line-height: 1.3;
    }

    .card-description {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.4;
    }

    /* Card Badges */
    .card-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: var(--primary);
      color: var(--on-primary);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .experimental .card-badge {
      background: var(--warning);
      color: var(--background);
    }

    /* Footer Stats */
    .directory-footer {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
    }

    .stats-row {
      display: flex;
      justify-content: center;
      gap: 3rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .events-directory {
        padding: 1rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .directory-grid {
        gap: 2rem;
      }

      .directory-section {
        padding: 1.5rem;
      }

      .action-cards {
        grid-template-columns: 1fr;
      }

      .stats-row {
        gap: 1.5rem;
      }

      .section-title {
        font-size: 1.25rem;
      }
    }

    @media (max-width: 480px) {
      .events-directory {
        padding: 0.75rem;
      }

      .directory-section {
        padding: 1rem;
      }

      .page-title {
        font-size: 1.75rem;
      }
    }
  `]
})
export class EventsDirectoryComponent {
}
