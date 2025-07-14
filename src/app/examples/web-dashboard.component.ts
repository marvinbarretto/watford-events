import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-web-dashboard',
  imports: [CommonModule],
  template: `
    <div class="web-dashboard">
      <div class="dashboard-header">
        <h1>Web Dashboard Example</h1>
        <p>Traditional web layout with standard HTML components</p>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <h3>Statistics</h3>
          <div class="stats">
            <div class="stat">
              <span class="number">1,234</span>
              <span class="label">Total Events</span>
            </div>
            <div class="stat">
              <span class="number">456</span>
              <span class="label">Active Users</span>
            </div>
            <div class="stat">
              <span class="number">89%</span>
              <span class="label">Success Rate</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Recent Activity</h3>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon">📅</div>
              <div class="activity-content">
                <div class="activity-title">New event created</div>
                <div class="activity-time">2 hours ago</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">👤</div>
              <div class="activity-content">
                <div class="activity-title">User registered</div>
                <div class="activity-time">4 hours ago</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">🎫</div>
              <div class="activity-content">
                <div class="activity-title">Ticket purchased</div>
                <div class="activity-time">6 hours ago</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Quick Actions</h3>
          <div class="action-buttons">
            <button class="btn btn-primary">Create Event</button>
            <button class="btn btn-secondary">View Reports</button>
            <button class="btn btn-outline">Settings</button>
          </div>
        </div>

        <div class="card wide">
          <h3>Data Table</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Attendees</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Summer Music Festival</td>
                <td>2024-08-15</td>
                <td>500</td>
                <td><span class="status active">Active</span></td>
              </tr>
              <tr>
                <td>Tech Conference</td>
                <td>2024-09-02</td>
                <td>250</td>
                <td><span class="status pending">Pending</span></td>
              </tr>
              <tr>
                <td>Art Exhibition</td>
                <td>2024-07-20</td>
                <td>150</td>
                <td><span class="status completed">Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .web-dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .dashboard-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .dashboard-header h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .dashboard-header p {
      color: #666;
      font-size: 1.1rem;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
    }

    .card.wide {
      grid-column: 1 / -1;
    }

    .card h3 {
      margin: 0 0 1rem;
      color: #333;
    }

    .stats {
      display: flex;
      gap: 1rem;
      justify-content: space-around;
    }

    .stat {
      text-align: center;
    }

    .stat .number {
      display: block;
      font-size: 1.8rem;
      font-weight: bold;
      color: #667eea;
    }

    .stat .label {
      font-size: 0.9rem;
      color: #666;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .activity-icon {
      font-size: 1.5rem;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      border-radius: 50%;
    }

    .activity-title {
      font-weight: 500;
      color: #333;
    }

    .activity-time {
      font-size: 0.9rem;
      color: #666;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a6fd8;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-outline {
      background: transparent;
      color: #667eea;
      border: 1px solid #667eea;
    }

    .btn-outline:hover {
      background: #667eea;
      color: white;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    .data-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }

    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .status.active {
      background: #d4edda;
      color: #155724;
    }

    .status.pending {
      background: #fff3cd;
      color: #856404;
    }

    .status.completed {
      background: #d1ecf1;
      color: #0c5460;
    }
  `]
})
export class WebDashboardComponent {}
