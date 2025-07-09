import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-web-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="web-form">
      <div class="form-header">
        <h1>Web Form Example</h1>
        <p>Traditional HTML form with standard web styling</p>
      </div>
      
      <form class="form-container" (ngSubmit)="onSubmit()">
        <div class="form-section">
          <h3>Event Details</h3>
          
          <div class="form-group">
            <label for="eventName">Event Name</label>
            <input 
              type="text" 
              id="eventName" 
              name="eventName" 
              [(ngModel)]="formData.eventName"
              placeholder="Enter event name"
              required>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="eventDate">Date</label>
              <input 
                type="date" 
                id="eventDate" 
                name="eventDate" 
                [(ngModel)]="formData.eventDate"
                required>
            </div>
            
            <div class="form-group">
              <label for="eventTime">Time</label>
              <input 
                type="time" 
                id="eventTime" 
                name="eventTime" 
                [(ngModel)]="formData.eventTime"
                required>
            </div>
          </div>
          
          <div class="form-group">
            <label for="category">Category</label>
            <select id="category" name="category" [(ngModel)]="formData.category" required>
              <option value="">Select a category</option>
              <option value="music">Music</option>
              <option value="tech">Technology</option>
              <option value="art">Art & Culture</option>
              <option value="sports">Sports</option>
              <option value="food">Food & Drink</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="description">Description</label>
            <textarea 
              id="description" 
              name="description" 
              [(ngModel)]="formData.description"
              rows="4"
              placeholder="Describe your event..."></textarea>
          </div>
        </div>
        
        <div class="form-section">
          <h3>Event Settings</h3>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                name="isPublic" 
                [(ngModel)]="formData.isPublic">
              <span class="checkmark"></span>
              Public Event
            </label>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                name="allowRegistration" 
                [(ngModel)]="formData.allowRegistration">
              <span class="checkmark"></span>
              Allow Online Registration
            </label>
          </div>
          
          <div class="form-group">
            <label>Event Type</label>
            <div class="radio-group">
              <label class="radio-label">
                <input 
                  type="radio" 
                  name="eventType" 
                  value="free" 
                  [(ngModel)]="formData.eventType">
                <span class="radio-button"></span>
                Free Event
              </label>
              <label class="radio-label">
                <input 
                  type="radio" 
                  name="eventType" 
                  value="paid" 
                  [(ngModel)]="formData.eventType">
                <span class="radio-button"></span>
                Paid Event
              </label>
            </div>
          </div>
          
          <div class="form-group" *ngIf="formData.eventType === 'paid'">
            <label for="price">Price (£)</label>
            <input 
              type="number" 
              id="price" 
              name="price" 
              [(ngModel)]="formData.price"
              min="0"
              step="0.01"
              placeholder="0.00">
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Event</button>
        </div>
      </form>
      
      <div class="form-preview" *ngIf="showPreview">
        <h3>Form Data Preview</h3>
        <pre>{{ formData | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .web-form {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .form-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .form-header h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .form-header p {
      color: #666;
      font-size: 1.1rem;
    }
    
    .form-container {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
    }
    
    .form-section {
      margin-bottom: 2rem;
    }
    
    .form-section h3 {
      margin: 0 0 1rem;
      color: #333;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }
    
    input[type="text"],
    input[type="date"],
    input[type="time"],
    input[type="number"],
    select,
    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    
    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }
    
    .checkbox-label,
    .radio-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      margin-bottom: 0.5rem;
    }
    
    .checkbox-label input[type="checkbox"],
    .radio-label input[type="radio"] {
      width: auto;
      margin-right: 0.5rem;
    }
    
    .radio-group {
      display: flex;
      gap: 1rem;
    }
    
    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 120px;
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
    
    .form-preview {
      margin-top: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }
    
    .form-preview h3 {
      margin-top: 0;
      color: #333;
    }
    
    .form-preview pre {
      background: white;
      padding: 1rem;
      border-radius: 4px;
      border: 1px solid #ddd;
      overflow-x: auto;
    }
    
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .radio-group {
        flex-direction: column;
      }
    }
  `]
})
export class WebFormComponent {
  formData = {
    eventName: '',
    eventDate: '',
    eventTime: '',
    category: '',
    description: '',
    isPublic: true,
    allowRegistration: false,
    eventType: 'free',
    price: null
  };
  
  showPreview = false;
  
  onSubmit() {
    console.log('Form submitted:', this.formData);
    this.showPreview = true;
  }
}