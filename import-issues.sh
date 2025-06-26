#!/bin/bash

# GitHub Issues Import Script
# Prerequisites: 
# 1. Install GitHub CLI: https://cli.github.com/
# 2. Authenticate: gh auth login
# 3. Navigate to your repo directory

# Create labels first
echo "Creating labels..."

# Type labels
gh label create "epic" --color "8B5CF6" --description "Major project milestone" || true
gh label create "feature" --color "3B82F6" --description "Product feature" || true  
gh label create "task" --color "10B981" --description "Development task" || true
gh label create "bug" --color "EF4444" --description "Bug fix" || true

# Priority labels  
gh label create "priority:high" --color "DC2626" --description "High priority" || true
gh label create "priority:medium" --color "F59E0B" --description "Medium priority" || true
gh label create "priority:low" --color "6B7280" --description "Low priority" || true

# Phase labels
gh label create "phase:foundation" --color "F97316" --description "Foundation phase" || true
gh label create "phase:core" --color "2563EB" --description "Core platform phase" || true
gh label create "phase:sanity" --color "059669" --description "Sanity integration phase" || true
gh label create "phase:monetization" --color "7C3AED" --description "Monetization phase" || true
gh label create "phase:ai" --color "DB2777" --description "AI enhancement phase" || true
gh label create "phase:advanced" --color "0891B2" --description "Advanced features phase" || true

# Story point labels
gh label create "sp:1" --color "E5E7EB" --description "1 story point" || true
gh label create "sp:2" --color "D1D5DB" --description "2 story points" || true
gh label create "sp:3" --color "9CA3AF" --description "3 story points" || true
gh label create "sp:5" --color "6B7280" --description "5 story points" || true
gh label create "sp:8" --color "374151" --description "8 story points" || true

echo "Labels created. Now creating issues..."

# Phase 1: Foundation Setup
echo "Creating Phase 1 issues..."

gh issue create \
  --title "[EPIC] Phase 1: Foundation Setup" \
  --body "Foundation setup for Watford Events platform, adapting Spoons codebase.

**Goals:**
- Fork and setup repository
- Transform domain models (Pub → Event)  
- Basic UI transformation
- Working MVP shell

**Success Criteria:**
- [ ] Repository forked and configured
- [ ] Domain models updated  
- [ ] Basic event listing page working
- [ ] Authentication flow adapted" \
  --label "epic,phase:foundation,priority:high"

gh issue create \
  --title "Fork Spoons repository and rename" \
  --body "Fork the existing Spoons repo, rename to watford-events, update package.json and descriptions, remove Spoons-specific branding and assets.

**Acceptance Criteria:**
- [ ] Repository forked successfully
- [ ] Package.json updated with new project details
- [ ] README updated with Watford Events information
- [ ] Spoons branding removed" \
  --label "task,phase:foundation,sp:2,priority:high"

gh issue create \
  --title "Set up development environment" \
  --body "Clone forked repository locally, install dependencies, verify build works, configure Firebase project for events hub.

**Tasks:**
- [ ] Clone repository locally
- [ ] Install dependencies and verify build
- [ ] Set up Firebase project for events hub
- [ ] Configure environment variables
- [ ] Test local development server" \
  --label "task,phase:foundation,sp:3,priority:medium"

gh issue create \
  --title "Update core data models" \
  --body "Replace Pub with Event model, CheckIn with EventInterest, create new models for EventCategory, EventCreator, and Venue.

**Models to create/update:**
- [ ] Event model (replace Pub)
- [ ] EventInterest model (replace CheckIn)
- [ ] EventCategory model
- [ ] EventCreator model
- [ ] Venue model
- [ ] Update all related interfaces and types" \
  --label "task,phase:foundation,sp:5,priority:high"

gh issue create \
  --title "Transform store architecture" \
  --body "Rename PubStore to EventStore, CheckinStore to EventInterestStore, update all store contracts and interfaces.

**Tasks:**
- [ ] Rename PubStore to EventStore
- [ ] Rename CheckinStore to EventInterestStore  
- [ ] Update NearbyPubStore to NearbyEventStore
- [ ] Keep AuthStore and UserStore patterns
- [ ] Update all store contracts and interfaces
- [ ] Update store method signatures" \
  --label "task,phase:foundation,sp:8,priority:high"

gh issue create \
  --title "Create basic event listing page" \
  --body "Build the main event listing page with event cards, search functionality, and filtering options.

**Features:**
- [ ] Event card component design
- [ ] Event list view with grid/list toggle
- [ ] Basic search functionality
- [ ] Category filtering dropdown
- [ ] Date filtering (upcoming events)
- [ ] Responsive design for mobile/desktop" \
  --label "task,phase:foundation,sp:8,priority:high"

gh issue create \
  --title "Create event detail page" \
  --body "Build individual event detail pages with full event information and interest registration.

**Features:**
- [ ] Event detail component
- [ ] Event information display
- [ ] Interest registration button
- [ ] Social sharing buttons
- [ ] Back navigation
- [ ] Related events section" \
  --label "task,phase:foundation,sp:5,priority:medium"

# Phase 2: Core Platform  
echo "Creating Phase 2 issues..."

gh issue create \
  --title "[EPIC] Phase 2: Core Event Platform" \
  --body "Core event management and user engagement features.

**Goals:**
- Event management system
- User interest tracking
- Advanced search and discovery

**Success Criteria:**
- [ ] Admin can create and manage events
- [ ] Users can register interest in events
- [ ] Advanced search and filtering works
- [ ] Notification system operational" \
  --label "epic,phase:core,priority:high"

gh issue create \
  --title "Build admin event creation interface" \
  --body "Create comprehensive admin interface for event creation and management.

**Features:**
- [ ] Event creation form with validation
- [ ] Image upload functionality
- [ ] Venue selection/creation
- [ ] Category assignment
- [ ] Date/time picker integration
- [ ] Draft and publish states
- [ ] Bulk event operations" \
  --label "task,phase:core,sp:8,priority:high"

gh issue create \
  --title "Implement event interest tracking" \
  --body "Build system for users to register interest in events and track their preferences.

**Features:**
- [ ] Register/unregister interest functionality
- [ ] User interest dashboard
- [ ] Interest history tracking
- [ ] Interest analytics for users
- [ ] Export interests to calendar" \
  --label "task,phase:core,sp:5,priority:high"

gh issue create \
  --title "Build user dashboard" \
  --body "Create personalized dashboard for users to manage their event interests and preferences.

**Features:**
- [ ] Upcoming events user is interested in
- [ ] Past events attended
- [ ] Recommended events based on interests
- [ ] User preference settings
- [ ] Notification settings
- [ ] Profile management" \
  --label "task,phase:core,sp:8,priority:high"

gh issue create \
  --title "Advanced search functionality" \
  --body "Implement comprehensive search and filtering capabilities.

**Features:**
- [ ] Full-text search across event titles and descriptions
- [ ] Search filters (date, category, price, location)
- [ ] Search result sorting options
- [ ] Search autocomplete/suggestions
- [ ] Save search functionality
- [ ] Search analytics tracking" \
  --label "task,phase:core,sp:8,priority:medium"

echo "Created initial issues! Run 'gh issue list' to see them."
echo ""
echo "Next steps:"
echo "1. Go to your GitHub repo and create a Project board"
echo "2. Add these issues to your project"
echo "3. Start working on the first task!"