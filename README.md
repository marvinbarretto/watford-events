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

## 🎯 Story Points and Estimation

Tasks are estimated using story points for velocity tracking:

- **1 point**: 2-4 hours (small bug fix, simple component update)
- **2 points**: Half day (simple feature, basic component)  
- **3 points**: Full day (medium feature, component with logic)
- **5 points**: 2-3 days (complex feature, multiple components)
- **8 points**: 1 week (major feature, multiple services)

### Velocity Tracking
- Target: 20-25 story points per week
- Track actual vs estimated time to improve future estimates
- Use issue comments to note time spent vs estimate

---

## 🔧 Development Commands

### Daily Development
```bash
# Start development server
ng serve

# Run tests
npm test

# Run linting (if configured)
npm run lint

# Commit changes
git add .
git commit -m "update event listing page. #6"
git push

# Build for production
npm run build
```

### Issue Management
```bash
# List issues
gh issue list

# Create new issue
gh issue create --title "Feature name" --body "Description" --label "task,phase:foundation,sp:3"

# View issue details
gh issue view [number]

# Close issue
gh issue close [number]
```

### Project Board
```bash
# View project in browser
gh project view --web

# Or visit: https://github.com/marvinbarretto/watford-events/projects/1
```

---

## 📊 Git Workflow

### For Most Changes (Recommended)
```bash
# Work directly on main for speed
git add .
git commit -m "update package json for watford-events. #2"
git push origin main
```

### For Large/Risky Changes (Optional)
```bash
# Create feature branch for major changes
git checkout -b transform-store-architecture

# Work and commit
git commit -m "rename PubStore to EventStore. #5"
git commit -m "update store contracts. closes #5"

# Push and create PR for review
git push -u origin transform-store-architecture
gh pr create --title "Transform store architecture" --body "Closes #5"

# Merge when ready
gh pr merge --squash
```

### Simple Daily Workflow
```bash
# 1. Pick issue from project board
# 2. Work on main branch
# 3. Commit frequently with issue references
# 4. Push when ready
# 5. Move issue to "Done" on project board
```

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

## 📄 License

Private repository - All rights reserved.

---

*Last updated: December 2024*