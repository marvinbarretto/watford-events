# Watford Events Platform

> The definitive events discovery platform for Watford - aggregating all local events into one searchable, user-friendly destination.

## 🎯 Project Overview

**Vision**: Create a comprehensive events discovery platform that solves the fragmentation problem where residents miss out on local events due to scattered information sources.

**Tech Stack**: Angular 19 + Signals, Sanity CMS, Firebase, Stripe, OpenAI API

**Repository**: Private development repository for Watford Events platform

---

## 🚀 Daily Workflows

### Your Standard Development Flow
```bash
# 1. Make changes to code
# 2. Commit with clear message
gcm "update package json name. #2"

# 3. Create release (bumps version, generates changelog)  
release

# 4. Push code and tags
gpt

# 5. Deploy to production
deploy
```

### Quick Issue Management
```bash
# Capture ideas instantly
idea "LLM cost monitoring service"
idea "Sanity CMS integration" 
idea "API usage tracking"

# Create actionable tasks
task "Update package.json name"
task "Add search functionality"
task "Fix date formatting bug"

# View your work
issues          # All open issues
myissues        # Issues assigned to you
project         # Open project board in browser
labels          # List available labels
```

### Simple Git Operations
```bash
# Check status
gs              # git status
gst             # git status --short

# Stage and commit
gaa             # git add .
gcm "message"   # git commit -m "message"

# Push/pull
gp              # git pull  
gpt             # git push && git push --follow-tags
gpush           # git push origin main

# Quick operations
gci "fix bug. #15"      # git add . && git commit -m "fix bug. #15" 
quickfix                # git add . && git commit "quick fix" && git push
```

### Angular Development
```bash
# Start development
serve           # ng serve

# Testing and building
test            # ng test
build           # ng build
```

### Common Workflows

#### Working on an Issue
```bash
# 1. Pick issue from project board or create one
task "Update event model for new fields"

# 2. Work on the code
serve           # Start dev server in another terminal

# 3. Commit your work
gcm "add venue field to event model. #15"
gcm "update event form with venue field. closes #15"

# 4. Ship it
gpt             # Push your changes
```

#### Quick Idea Capture
```bash
# Brain dump ideas as they come
idea "Voice search for events"
idea "Weather integration for outdoor events"  
idea "Social proof - show friends attending"

# Convert to actionable task when ready
viewissue 25    # Review the idea
# Edit issue, remove "idea" label, add story points, move to project board
```

#### Bug Fix Flow
```bash
# Create bug report
bug "Event dates showing incorrect timezone"

# Fix and commit
gcm "fix timezone display in event cards. closes #18"
gpt
```

#### Release Flow
```bash
# When ready for new version
release         # Bumps version, updates CHANGELOG.md
gpt             # Push release commit and tags
deploy          # Deploy to production
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI 19+
- Git
- GitHub CLI (recommended)

### Setup
```bash
# Clone the repository
git clone https://github.com/marvinbarretto/watford-events.git
cd watford-events

# Install dependencies
npm install

# Set up development environment
npm run setup

# Start development server
ng serve
```

---

## 📋 Development Workflow

### Issue-Driven Development

This project uses **issue-driven development** - every piece of work should be linked to a GitHub issue.

#### 1. Pick Up an Issue
```bash
# View current issues
gh issue list

# Or check the project board:
# https://github.com/marvinbarretto/watford-events/projects/1
```

#### 2. Move Issue to "In Progress"
- Go to the GitHub project board
- Drag your chosen issue from "Todo" to "In Progress"
- Or update via CLI: `gh issue edit [number] --add-label "status:in-progress"`

#### 3. Work on the Issue
- Work directly on `main` branch for small changes (sp:1-3)
- Create feature branch for large changes (sp:5-8): `git checkout -b [issue-number]-feature-name`

#### 4. Commit Your Work
Use conventional commits with issue references (see below)

#### 5. Complete the Issue
- Ensure all acceptance criteria are met
- Final commit should include `closes #[issue-number]`
- Push your changes
- Issue will automatically move to "Done"

---

## 📝 Commit Guidelines

Simple, flexible commit format focused on getting work done quickly.

### Basic Format
```bash
# Simple commits:
git commit -m "update package json name"
git commit -m "add event listing page"
git commit -m "fix date formatting bug"

# With issue reference (optional):
git commit -m "update package json name. #2"
git commit -m "add search functionality. #12"
git commit -m "fix login error. closes #8"
```

### Issue References (Optional)
- **`#123`**: Links commit to issue
- **`closes #123`**: Links commit and closes issue
- **`fixes #123`**: Links commit and closes issue

### Example Commits

#### Working on Issue #4: Update core data models
```bash
git commit -m "add Event model to replace Pub. #4"
git commit -m "add supporting event models. #4"  
git commit -m "update imports for new Event models. closes #4"
```

#### Quick fixes
```bash
git commit -m "fix event date formatting. closes #15"
git commit -m "update dependencies"
git commit -m "fix typos in readme"
```

### Conventional Format (Optional)
If you want to use conventional commits, go ahead:
```bash
git commit -m "feat: add search functionality. closes #12"
git commit -m "fix: correct date formatting. #8"
git commit -m "chore: update dependencies"
```

**Bottom line**: Write whatever commit message makes sense to you. The important thing is linking to issues when relevant and getting work done quickly.

---

## 🏗️ Project Structure

```
watford-events/
├── src/app/
│   ├── auth/                 # Authentication (reused from Spoons)
│   ├── events/               # Core events functionality
│   │   ├── data-access/      # EventStore, EventService
│   │   ├── feature/          # Smart components
│   │   └── ui/               # Dumb components
│   ├── users/                # User management (reused)
│   ├── shared/               # Shared utilities
│   └── core/                 # App shell and core services
├── docs/                     # Project documentation
├── .husky/                   # Git hooks
└── README.md                 # This file
```

---


## 🔄 Development Workflow - Point-Based Planning

This project uses a **simple, point-based workflow** designed for solo development with velocity tracking.

### Quick Overview
```bash
# 1. Brain dump ideas into markdown
code planning/current.md

# 2. Convert to GitHub issues  
./workflow.sh preview
./workflow.sh plan

# 3. Work normally with commits
git commit -m "feat: add search component. closes #23"
git commit -m "fix: fix mobile layout. closes #24"

# 4. Track progress automatically
./workflow.sh progress    # Updates PROGRESS.md weekly
```

### Workflow Files

#### `workflow.sh` - Main workflow script
- **Setup**: `./workflow.sh setup` (one-time: creates labels + templates)
- **Plan**: `./workflow.sh plan` (convert markdown → GitHub issues)  
- **Preview**: `./workflow.sh preview` (see what would be created)
- **Progress**: `./workflow.sh progress` (generate weekly PROGRESS.md)
- **Status**: `./workflow.sh status` (quick project overview)

#### `planning/current.md` - Your main planning file
Brain dump ideas using this format:
```markdown
## [EPIC] Feature Area [epic,now] [SP: 15]

### Implementation [feature,frontend,now] [SP: 10]
- Create component [sp2]
- Add validation [sp1] 
- Add responsive design [sp2]
- Add unit tests [sp3]
- Fix mobile issues [sp2]
```

#### `PROGRESS.md` - Automatic progress tracking
Auto-generated weekly with:
- ✅ Points completed this week
- 🎯 Current priorities and points remaining  
- 📈 Recent commits and velocity trends
- 📊 Project statistics and burndown

### Point System

**Story Points = Time Estimates**
- **sp1** - Quickies (1-2 hours): Bug fixes, small styling updates
- **sp2** - Half day (3-4 hours): Simple components, basic features
- **sp3** - Full day (6-8 hours): Complex components, medium features  
- **sp5** - 2 days (12-16 hours): Major features, API integrations
- **sp8** - 3-4 days (24-32 hours): Large epics, architecture changes

**Priority Labels**
- **now** - This week (~15 points target)
- **soon** - This month (backlog)
- **later** - Someday maybe

### Velocity Tracking

After a few weeks you'll learn your capacity:
- **Weekly target**: ~12-15 points  
- **Task accuracy**: "sp2 tasks actually take me 4 hours"
- **Energy patterns**: "Friday afternoons = sp1 cleanup time"

The system automatically tracks:
- Points completed per week
- Velocity trends (getting faster/slower)
- Remaining points in current priorities

### Daily Development Flow

#### Monday: Planning Session
```bash
# Brain dump week's ideas
code planning/current.md

# Preview what you'll create
./workflow.sh preview

# Create the issues
./workflow.sh plan
```

#### Daily: Development
```bash
# Pick issue from project board based on energy:
# High energy: sp3-sp5 main features
# Low energy: sp1-sp2 cleanup tasks
# Friday afternoon: always sp1 quickies

# Work with issue references
git commit -m "add search validation. #34"
git commit -m "fix mobile layout. closes #34"
```

#### Friday: Progress Review
```bash
# Generate automatic progress report
./workflow.sh progress

# Review velocity and plan next week
# Celebrate completed points! 🎉
```

### Example Planning Session

**Brain dump in `planning/current.md`:**
```markdown
# Week of Jan 29 - Search Implementation

## [EPIC] Event Search & Discovery [epic,now] [SP: 15]

### Search Core [feature,frontend,now] [SP: 10]
- Create search input component [sp2]
- Add search results display [sp3] 
- Implement category filtering [sp2]
- Add search loading states [sp1]
- Fix mobile search layout [sp2]

### Performance [feature,tech,now] [SP: 5]
- Optimize event list rendering [sp3]
- Add image lazy loading [sp2]

## [EPIC] Mobile Polish [epic,soon] [SP: 8]
- Fix navigation menu overflow [sp1]
- Improve touch interactions [sp2]
- Add mobile breakpoints [sp2]
- Update accessibility [sp3]
```

**Convert to issues:**
```bash
./workflow.sh plan
# Creates 9 GitHub issues with proper labels and point estimates
# Issues automatically appear in project board
```

**Work and track:**
```bash
# Work on issues, commit with references
git commit -m "create search component with validation. closes #34"

# Weekly progress update
./workflow.sh progress
# Updates PROGRESS.md with completed points, velocity, trends
```

This workflow gives you **structure without overhead** - plan in markdown, track automatically, focus on building.

---


## 🚀 Deployment

### Development
- Automatic deployment on push to `main`
- Firebase hosting: https://watford-events-dev.web.app

### Production
- Manual deployment from tagged releases
- Firebase hosting: https://watfordevents.com

---

## 📈 Project Phases

### Phase 1: Foundation (Weeks 1-4)
- ✅ Repository setup and rebranding
- ✅ Domain model transformation (Pub → Event)
- ✅ Basic UI transformation
- ✅ Core event listing functionality

### Phase 2: Core Platform (Weeks 5-8)
- 🔄 Event management system
- 🔄 User interest tracking
- 🔄 Advanced search and discovery
- 🔄 Notification system

### Phase 3: Sanity Integration (Weeks 9-11)
- ⏳ Headless CMS setup
- ⏳ Content management workflow
- ⏳ SEO optimization

### Phase 4: Monetization (Weeks 12-15)
- ⏳ Stripe payment integration
- ⏳ Featured listing system
- ⏳ Creator subscription tiers

### Phase 5: AI Enhancement (Weeks 16-18)
- ⏳ Flyer scanning with OCR + AI
- ⏳ Content enhancement
- ⏳ Smart recommendations

### Phase 6: Advanced Features (Weeks 19+)
- ⏳ PWA to native mobile app
- ⏳ Social features
- ⏳ Business intelligence

---

## 💡 Best Practices

### YAGNI Approach
- **Keep tooling simple** - Add complexity only when needed
- **Focus on shipping** - Perfect is the enemy of done
- **Optimize for speed** - Fast iteration over perfect process
- **Add tools later** - When team grows or requirements change

### Code Quality
- Use TypeScript strictly (no `any` types)
- Follow Angular style guide
- Write tests for critical functionality
- Use signals for reactive state management

### Commit Hygiene
- One logical change per commit
- Link commits to issues when relevant (#123, closes #123)
- Write clear, descriptive commit messages
- Keep it simple - focus on the work, not the format

### Issue Management
- Break large features into smaller issues
- Estimate effort with story points
- Update project board regularly
- Comment on issues with progress updates

### Performance
- Lazy load routes and modules
- Optimize images and assets
- Use OnPush change detection
- Monitor bundle size

---

## 🔍 Troubleshooting

### Common Issues

#### TypeScript Compilation Errors
```bash
# Check for missing imports after domain model changes
npm run build
# Fix imports and type definitions
```

#### Firebase Connection Issues
```bash
# Ensure Firebase CLI is logged in
firebase login
# Verify project configuration
firebase projects:list
```

#### GitHub Issues Not Linking
```bash
# Ensure commit messages reference issues:
git commit -m "fix date formatting. closes #15"
# Issues link automatically via #number references
```

---

## 📞 Getting Help

### Resources
- **Project Board**: [GitHub Projects](https://github.com/marvinbarretto/watford-events/projects/1)
- **Issues**: [GitHub Issues](https://github.com/marvinbarretto/watford-events/issues)
- **Documentation**: `/docs` folder
- **Architecture**: See `/docs/architecture.md`

### Quick Commands Reference
```bash
# View this help
cat README.md

# Interactive commit
npm run commit

# List current issues  
gh issue list

# View project board
gh project view --web

# Start development
ng serve
```


---
