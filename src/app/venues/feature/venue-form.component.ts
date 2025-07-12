import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { VenueService } from '../data-access/venue.service';
import { VenueStore } from '../data-access/venue.store';
import { AdminStore } from '../../admin/data-access/admin.store';
import { AuthStore } from '../../auth/data-access/auth.store';
import { Venue, VenueFormData } from '../utils/venue.model';

@Component({
  selector: 'app-venue-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="venue-form-container">
      <div class="header">
        <h2>{{ isEditing() ? 'Edit' : 'Add New' }} Venue</h2>
        <a routerLink="/admin/venues" class="back-link">← Back to Venues</a>
      </div>

      <form [formGroup]="venueForm" (ngSubmit)="saveVenue()" class="venue-form">
        <!-- Basic Information -->
        <fieldset class="form-section">
          <legend>Basic Information</legend>
          
          <div class="form-group">
            <label for="name">Venue Name *</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Enter venue name"
              class="form-control"
              [class.error]="venueForm.get('name')?.invalid && venueForm.get('name')?.touched"
            />
            @if (venueForm.get('name')?.invalid && venueForm.get('name')?.touched) {
              <div class="error-message">Venue name is required</div>
            }
          </div>

          <div class="form-group">
            <label for="address">Address *</label>
            <textarea
              id="address"
              formControlName="address"
              placeholder="Enter full address"
              class="form-control"
              rows="2"
              [class.error]="venueForm.get('address')?.invalid && venueForm.get('address')?.touched"
            ></textarea>
            @if (venueForm.get('address')?.invalid && venueForm.get('address')?.touched) {
              <div class="error-message">Address is required</div>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="category">Category</label>
              <select id="category" formControlName="category" class="form-control">
                <option value="">Select category</option>
                @for (category of categories; track category.value) {
                  <option [value]="category.value">{{ category.label }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label for="status">Status *</label>
              <select id="status" formControlName="status" class="form-control">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </fieldset>

        <!-- Geographic Information -->
        <fieldset class="form-section">
          <legend>Location</legend>
          
          <div class="form-row">
            <div class="form-group">
              <label for="latitude">Latitude *</label>
              <input
                id="latitude"
                type="number"
                step="any"
                formControlName="latitude"
                placeholder="51.6556"
                class="form-control"
                [class.error]="venueForm.get('latitude')?.invalid && venueForm.get('latitude')?.touched"
              />
              @if (venueForm.get('latitude')?.invalid && venueForm.get('latitude')?.touched) {
                <div class="error-message">Valid latitude is required</div>
              }
            </div>

            <div class="form-group">
              <label for="longitude">Longitude *</label>
              <input
                id="longitude"
                type="number"
                step="any"
                formControlName="longitude"
                placeholder="-0.3967"
                class="form-control"
                [class.error]="venueForm.get('longitude')?.invalid && venueForm.get('longitude')?.touched"
              />
              @if (venueForm.get('longitude')?.invalid && venueForm.get('longitude')?.touched) {
                <div class="error-message">Valid longitude is required</div>
              }
            </div>
          </div>
        </fieldset>

        <!-- Accessibility Features -->
        <fieldset class="form-section">
          <legend>Accessibility Features</legend>
          
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="accessibleEntrance" />
              <span>Accessible Entrance</span>
            </label>
            
            <label class="checkbox-label">
              <input type="checkbox" formControlName="stepFreeAccess" />
              <span>Step-free Access</span>
            </label>
            
            <label class="checkbox-label">
              <input type="checkbox" formControlName="elevatorAvailable" />
              <span>Elevator Available</span>
            </label>
          </div>
        </fieldset>

        <!-- Toilet Facilities -->
        <fieldset class="form-section">
          <legend>Toilet Facilities</legend>
          
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="accessibleToilet" />
              <span>Accessible Toilet</span>
            </label>
            
            <label class="checkbox-label">
              <input type="checkbox" formControlName="genderNeutral" />
              <span>Gender Neutral Toilets</span>
            </label>
            
            <label class="checkbox-label">
              <input type="checkbox" formControlName="babyChanging" />
              <span>Baby Changing Facilities</span>
            </label>
          </div>
        </fieldset>

        <!-- Capacity Information -->
        <fieldset class="form-section">
          <legend>Capacity Information</legend>
          
          <div class="form-row">
            <div class="form-group">
              <label for="maxCapacity">Maximum Capacity</label>
              <input
                id="maxCapacity"
                type="number"
                formControlName="maxCapacity"
                placeholder="500"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="recommendedCapacity">Recommended Capacity</label>
              <input
                id="recommendedCapacity"
                type="number"
                formControlName="recommendedCapacity"
                placeholder="400"
                class="form-control"
              />
            </div>
          </div>
        </fieldset>

        <!-- Contact Information -->
        <fieldset class="form-section">
          <legend>Contact Information</legend>
          
          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                placeholder="+44 1923 123456"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="info@venue.com"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="website">Website</label>
            <input
              id="website"
              type="url"
              formControlName="website"
              placeholder="https://venue.com"
              class="form-control"
            />
          </div>
        </fieldset>

        <!-- Transport Information -->
        <fieldset class="form-section">
          <legend>Transport Information</legend>
          
          <div class="form-group">
            <label for="buses">Bus Information</label>
            <textarea
              id="buses"
              formControlName="buses"
              placeholder="e.g. 142, 258 from High Street (5 min walk)"
              class="form-control"
              rows="2"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="trains">Train Information</label>
            <textarea
              id="trains"
              formControlName="trains"
              placeholder="e.g. Watford Junction 15 min walk, High Street 8 min"
              class="form-control"
              rows="2"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="parking">Parking Information</label>
            <textarea
              id="parking"
              formControlName="parking"
              placeholder="e.g. Free evening parking on Church Road, paid car park opposite"
              class="form-control"
              rows="2"
            ></textarea>
          </div>
        </fieldset>

        <!-- Additional Information -->
        <fieldset class="form-section">
          <legend>Additional Information</legend>
          
          <div class="form-group">
            <label for="notesForVisitors">Notes for Visitors</label>
            <textarea
              id="notesForVisitors"
              formControlName="notesForVisitors"
              placeholder="Any important information for visitors..."
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="amenities">Amenities (comma-separated)</label>
            <input
              id="amenities"
              type="text"
              formControlName="amenities"
              placeholder="WiFi, Air Conditioning, Stage, Bar, Kitchen"
              class="form-control"
            />
          </div>
        </fieldset>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            [disabled]="venueForm.invalid || saving()"
          >
            {{ saving() ? 'Saving...' : (isEditing() ? 'Update' : 'Create') }} Venue
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrl: './venue-form.component.scss'
})
export class VenueFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly venueService = inject(VenueService);
  private readonly venueStore = inject(VenueStore);
  private readonly adminStore = inject(AdminStore);
  private readonly authStore = inject(AuthStore);

  private venue: Venue | null = null;

  readonly saving = signal(false);
  readonly isEditing = signal(false);

  readonly categories = [
    { value: 'theatre', label: 'Theatre' },
    { value: 'pub', label: 'Pub/Bar' },
    { value: 'stadium', label: 'Stadium' },
    { value: 'park', label: 'Park' },
    { value: 'hall', label: 'Hall' },
    { value: 'museum', label: 'Museum' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'club', label: 'Club' },
    { value: 'community', label: 'Community Center' },
    { value: 'other', label: 'Other' }
  ];

  venueForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    address: ['', [Validators.required]],
    category: [''],
    status: ['draft', [Validators.required]],
    latitude: [null, [Validators.required]],
    longitude: [null, [Validators.required]],
    accessibleEntrance: [false],
    stepFreeAccess: [false],
    elevatorAvailable: [false],
    accessibleToilet: [false],
    genderNeutral: [false],
    babyChanging: [false],
    maxCapacity: [null],
    recommendedCapacity: [null],
    phone: [''],
    email: [''],
    website: [''],
    buses: [''],
    trains: [''],
    parking: [''],
    notesForVisitors: [''],
    amenities: ['']
  });

  async ngOnInit() {
    const venueId = this.route.snapshot.paramMap.get('id');
    
    if (venueId) {
      // Edit mode - fetch venue data
      this.isEditing.set(true);
      try {
        const venueData = await firstValueFrom(this.venueService.getVenue(venueId));
        this.venue = venueData || null;
        if (this.venue) {
          this.populateForm(this.venue);
        } else {
          // Venue not found, redirect back to admin venues
          await this.router.navigate(['/admin/venues']);
        }
      } catch (error) {
        console.error('Failed to load venue:', error);
        await this.router.navigate(['/admin/venues']);
      }
    } else {
      // Create mode
      this.isEditing.set(false);
    }
  }

  private populateForm(venue: Venue) {
    this.venueForm.patchValue({
      name: venue.name,
      address: venue.address,
      category: venue.category,
      status: venue.status,
      latitude: venue.geo.lat,
      longitude: venue.geo.lng,
      accessibleEntrance: venue.accessibleEntrance || false,
      stepFreeAccess: venue.stepFreeAccess || false,
      elevatorAvailable: venue.elevatorAvailable || false,
      accessibleToilet: venue.toilets?.accessibleToilet || false,
      genderNeutral: venue.toilets?.genderNeutral || false,
      babyChanging: venue.toilets?.babyChanging || false,
      maxCapacity: venue.capacity?.maxCapacity,
      recommendedCapacity: venue.capacity?.recommendedCapacity,
      phone: venue.contactInfo?.phone,
      email: venue.contactInfo?.email,
      website: venue.contactInfo?.website,
      buses: venue.transportInfo?.buses || '',
      trains: venue.transportInfo?.trains || '',
      parking: venue.transportInfo?.parking || '',
      notesForVisitors: venue.notesForVisitors,
      amenities: venue.amenities?.join(', ')
    });
  }

  async saveVenue() {
    if (this.venueForm.invalid) {
      this.venueForm.markAllAsTouched();
      return;
    }

    const authUser = this.authStore.user();
    if (!authUser) {
      console.error('User not authenticated');
      return;
    }

    this.saving.set(true);

    try {
      const formValue = this.venueForm.value;
      const venueData: VenueFormData = {
        name: formValue.name,
        address: formValue.address,
        geo: {
          lat: formValue.latitude,
          lng: formValue.longitude
        },
        category: formValue.category || undefined,
        status: formValue.status,
        accessibleEntrance: formValue.accessibleEntrance,
        stepFreeAccess: formValue.stepFreeAccess,
        elevatorAvailable: formValue.elevatorAvailable,
        toilets: {
          accessibleToilet: formValue.accessibleToilet,
          genderNeutral: formValue.genderNeutral,
          babyChanging: formValue.babyChanging
        },
        capacity: formValue.maxCapacity ? {
          maxCapacity: formValue.maxCapacity,
          recommendedCapacity: formValue.recommendedCapacity || formValue.maxCapacity
        } : undefined,
        contactInfo: (formValue.phone || formValue.email || formValue.website) ? {
          phone: formValue.phone || undefined,
          email: formValue.email || undefined,
          website: formValue.website || undefined
        } : undefined,
        transportInfo: (formValue.buses || formValue.trains || formValue.parking) ? {
          buses: formValue.buses || undefined,
          trains: formValue.trains || undefined,
          parking: formValue.parking || undefined
        } : undefined,
        notesForVisitors: formValue.notesForVisitors || undefined,
        amenities: formValue.amenities ? 
          formValue.amenities.split(',').map((s: string) => s.trim()).filter((s: string) => s) : 
          undefined
      };

      if (this.isEditing() && this.venue) {
        // Update existing venue
        await this.venueService.updateVenue(this.venue.id, venueData);
        
        // Update stores
        this.adminStore.updateVenue(this.venue.id, { ...venueData, updatedAt: new Date() });
        this.venueStore.updateVenue(this.venue.id, { ...venueData, updatedAt: new Date() });
        
        const updatedVenue = { ...this.venue, ...venueData, updatedAt: new Date() };
      } else {
        // Create new venue
        const newVenue = await this.venueService.createVenue({
          ...venueData,
          createdBy: authUser.uid,
          ownerId: authUser.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Update stores
        this.adminStore.setVenues([...this.adminStore.venues(), newVenue]);
        this.venueStore.addVenue(newVenue);
      }

      // Navigate back to admin venues list
      await this.router.navigate(['/admin/venues']);

    } catch (error) {
      console.error('Failed to save venue:', error);
    } finally {
      this.saving.set(false);
    }
  }

  async cancel() {
    await this.router.navigate(['/admin/venues']);
  }
}