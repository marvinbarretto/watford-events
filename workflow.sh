#!/bin/bash

# Watford Events - Solo Developer Workflow
# Point-based planning with automatic progress tracking

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PLANNING_DIR="./planning"
PROGRESS_FILE="PROGRESS.md"

show_help() {
    echo "Watford Events - Development Workflow"
    echo ""
    echo "USAGE:"
    echo "  ./workflow.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "COMMANDS:"
    echo "  setup           One-time setup (labels + templates)"
    echo "  plan [FILE]     Convert markdown planning to GitHub issues"
    echo "  preview [FILE]  Preview what issues would be created"
    echo "  progress        Generate weekly progress report"
    echo "  status          Show current work status"
    echo ""
    echo "EXAMPLES:"
    echo "  ./workflow.sh setup                      # First time setup"
    echo "  ./workflow.sh plan                       # Import from planning/current.md"
    echo "  ./workflow.sh plan planning/new-ideas.md # Import specific file"
    echo "  ./workflow.sh preview                    # See what would be created"
    echo "  ./workflow.sh progress                   # Update PROGRESS.md"
    echo "  ./workflow.sh status                     # Quick status check"
    echo ""
    echo "DAILY FLOW:"
    echo "  1. Edit planning/current.md (brain dump ideas)"
    echo "  2. ./workflow.sh preview (check what you're creating)"
    echo "  3. ./workflow.sh plan (create the issues)"
    echo "  4. Work normally with git commits"
    echo "  5. ./workflow.sh progress (weekly progress update)"
    echo ""
}

check_dependencies() {
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI required: brew install gh${NC}"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI not authenticated: gh auth login${NC}"
        exit 1
    fi
}

setup_workspace() {
    echo -e "${BLUE}🚀 Setting up Watford Events workflow...${NC}"

    # Create labels
    echo -e "${BLUE}Creating labels...${NC}"

    # Type labels
    gh label create "epic" --color "8B5CF6" --description "Major feature area" 2>/dev/null || true
    gh label create "feature" --color "3B82F6" --description "Product feature" 2>/dev/null || true
    gh label create "task" --color "10B981" --description "Development task" 2>/dev/null || true
    gh label create "bug" --color "EF4444" --description "Bug fix" 2>/dev/null || true
    gh label create "idea" --color "F59E0B" --description "Future consideration" 2>/dev/null || true

    # Story points (time estimates)
    gh label create "sp1" --color "E5E7EB" --description "1 point - quickies (1-2 hours)" 2>/dev/null || true
    gh label create "sp2" --color "D1D5DB" --description "2 points - half day (3-4 hours)" 2>/dev/null || true
    gh label create "sp3" --color "9CA3AF" --description "3 points - full day (6-8 hours)" 2>/dev/null || true
    gh label create "sp5" --color "6B7280" --description "5 points - 2 days (12-16 hours)" 2>/dev/null || true
    gh label create "sp8" --color "374151" --description "8 points - 3-4 days (24-32 hours)" 2>/dev/null || true

    # Priority
    gh label create "now" --color "DC2626" --description "Do this week" 2>/dev/null || true
    gh label create "soon" --color "F59E0B" --description "Do this month" 2>/dev/null || true
    gh label create "later" --color "6B7280" --description "Someday maybe" 2>/dev/null || true

    # Domain labels
    gh label create "frontend" --color "06B6D4" --description "UI/Component work" 2>/dev/null || true
    gh label create "backend" --color "84CC16" --description "Services/API work" 2>/dev/null || true
    gh label create "tech" --color "A855F7" --description "Technical/infrastructure" 2>/dev/null || true
    gh label create "a11y" --color "F97316" --description "Accessibility improvements" 2>/dev/null || true

    # Create planning directory and templates
    mkdir -p "$PLANNING_DIR"

    # Main planning file
    cat > "$PLANNING_DIR/current.md" << 'EOF'
# Current Planning - Watford Events

## [EPIC] Event Search & Discovery [epic,now] [SP: 21]

### Core Search Features [feature,frontend,now] [SP: 13]
- Add search input component with validation [sp2]
- Implement search API service [sp3]
- Add basic filtering dropdown (category) [sp2]
- Create search results layout [sp3]
- Add search result sorting options [sp3]

### Advanced Search [feature,frontend,soon] [SP: 18]
- Add location-based search with maps [sp5]
- Implement autocomplete suggestions [sp3]
- Add saved searches functionality [sp5]
- Create advanced filter sidebar [sp5]

## [EPIC] Mobile Experience [epic,now] [SP: 13]

### Navigation & Layout [feature,frontend,now] [SP: 8]
- Fix mobile menu overflow bug [sp1]
- Improve event card touch interactions [sp2]
- Add swipe gestures for browsing [sp5]

### Performance [feature,tech,now] [SP: 5]
- Optimize image loading on mobile [sp2]
- Add loading states to all components [sp1]
- Implement lazy loading for event lists [sp2]

## [EPIC] Content Management [epic,soon] [SP: 26]

### Event Creation [feature,backend,soon] [SP: 13]
- Build admin event creation form [sp5]
- Add image upload with compression [sp3]
- Create event validation system [sp3]
- Add bulk event import [sp2]

### Data Management [feature,backend,later] [SP: 13]
- Set up automated data sync [sp8]
- Create content moderation tools [sp3]
- Add analytics tracking [sp2]

## Ideas Backlog [idea,later]
- Voice search functionality [sp8]
- Calendar integration [sp5]
- Push notifications [sp3]
- Dark mode support [sp2]
- Offline support with PWA [sp8]

EOF

    # Quick capture template
    cat > "$PLANNING_DIR/quick-ideas.md" << 'EOF'
# Quick Ideas Capture
# Jot down thoughts as they come

## This Week [now] - Target: ~15 points
-

## This Month [soon] - Backlog: ~50 points
-

## Someday [later] - Ideas: unlimited points
-

## Bugs Found [bug,now] - Fix ASAP
-

## Quick Wins [sp1] - Fill spare time
-

EOF

    # Sprint template
    cat > "$PLANNING_DIR/week-template.md" << 'EOF'
# Week Template
# Copy and modify for weekly planning

## [EPIC] Weekly Focus [epic,now] [SP: 15]

### Main Feature [feature,frontend,now] [SP: 10]
- Primary task [sp3]
- Supporting task [sp2]
- Polish task [sp2]
- Testing [sp2]
- Documentation [sp1]

### Quick Wins [feature,tech,now] [SP: 5]
- Bug fix [sp1]
- Performance improvement [sp2]
- Code cleanup [sp1]
- Dependency update [sp1]

EOF

    echo -e "${GREEN}✅ Workspace setup complete!${NC}"
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo "  1. Edit $PLANNING_DIR/current.md with your ideas"
    echo "  2. Run: ./workflow.sh preview (to see what would be created)"
    echo "  3. Run: ./workflow.sh plan (to create the issues)"
    echo "  4. Check your GitHub project board and start working!"
}

import_issues() {
    local issues_file="${1:-$PLANNING_DIR/current.md}"
    local dry_run=$2

    if [[ ! -f "$issues_file" ]]; then
        echo -e "${RED}❌ Planning file not found: $issues_file${NC}"
        echo "Run: ./workflow.sh setup"
        exit 1
    fi

    echo -e "${BLUE}📖 Processing: $issues_file${NC}"

    if [[ "$dry_run" == "true" ]]; then
        echo -e "${YELLOW}🔍 PREVIEW MODE${NC}"
    fi

    local current_epic=""
    local current_feature=""
    local issue_count=0

    while IFS= read -r line; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

        # Epic (##)
        if [[ "$line" =~ ^##[[:space:]]*(.+) ]]; then
            current_epic="${BASH_REMATCH[1]}"
            create_issue "$current_epic" "" "$dry_run"
            ((issue_count++))

        # Feature (###)
        elif [[ "$line" =~ ^###[[:space:]]*(.+) ]]; then
            current_feature="${BASH_REMATCH[1]}"
            create_issue "$current_feature" "$current_epic" "$dry_run"
            ((issue_count++))

        # Task (-)
        elif [[ "$line" =~ ^[[:space:]]*-[[:space:]]*(.+) ]]; then
            local task="${BASH_REMATCH[1]}"
            create_issue "$task" "$current_feature" "$dry_run"
            ((issue_count++))
        fi

    done < "$issues_file"

    if [[ "$dry_run" == "true" ]]; then
        echo -e "${GREEN}✅ Would create $issue_count issues${NC}"
        echo -e "${BLUE}💡 Run without 'preview' to create them${NC}"
    else
        echo -e "${GREEN}✅ Created $issue_count issues${NC}"
        echo -e "${BLUE}🎯 Check your project board and start working!${NC}"
        echo -e "${BLUE}📊 Run './workflow.sh status' to see your current priorities${NC}"
    fi
}

create_issue() {
    local title=$1
    local parent=$2
    local dry_run=$3

    # Extract story points [SP: X] from title
    local epic_points=""
    if [[ "$title" =~ (.+)[[:space:]]*\[SP:[[:space:]]*([0-9]+)\][[:space:]]*(.*)$ ]]; then
        title="${BASH_REMATCH[1]}${BASH_REMATCH[3]}"
        epic_points="${BASH_REMATCH[2]}"
    fi

    # Extract labels from title [label1,label2]
    local labels=""
    if [[ "$title" =~ (.+)[[:space:]]*\[([^\]]+)\][[:space:]]*(.*)$ ]]; then
        title="${BASH_REMATCH[1]}${BASH_REMATCH[3]}"
        labels="${BASH_REMATCH[2]}"
    fi

    # Extract individual story points [sp1], [sp2], etc.
    local story_points=""
    if [[ "$title" =~ (.+)[[:space:]]*\[(sp[0-9]+)\][[:space:]]*(.*)$ ]]; then
        title="${BASH_REMATCH[1]}${BASH_REMATCH[3]}"
        story_points="${BASH_REMATCH[2]}"
        labels="${labels:+$labels,}$story_points"
    fi

    # Clean up title
    title=$(echo "$title" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

    # Build body
    local body=""
    if [[ -n "$parent" ]]; then
        body="**Parent:** $parent\n\n"
    fi
    if [[ -n "$story_points" ]]; then
        local points="${story_points#sp}"
        body="${body}**Story Points:** $points\n\n"
    elif [[ -n "$epic_points" ]]; then
        body="${body}**Total Epic Points:** $epic_points\n\n"
    fi
    body="${body}**Created:** $(date +%Y-%m-%d)\n"
    body="${body}**Imported via:** workflow.sh"

    if [[ "$dry_run" == "true" ]]; then
        echo -e "${YELLOW}[PREVIEW]${NC} $title"
        [[ -n "$labels" ]] && echo -e "  ${BLUE}Labels:${NC} $labels"
        [[ -n "$story_points" ]] && echo -e "  ${BLUE}Points:${NC} ${story_points#sp}"
        [[ -n "$epic_points" ]] && echo -e "  ${BLUE}Epic Points:${NC} $epic_points"
        [[ -n "$parent" ]] && echo -e "  ${BLUE}Parent:${NC} $parent"
        echo ""
    else
        echo -e "${GREEN}Creating:${NC} $title"

        # Build gh command
        local gh_cmd="gh issue create --title \"$title\" --body \"$body\""
        [[ -n "$labels" ]] && gh_cmd="$gh_cmd --label \"$labels\""

        # Execute command
        eval "$gh_cmd" > /dev/null 2>&1 || {
            echo -e "${RED}❌ Failed to create: $title${NC}"
        }
    fi
}

generate_progress() {
    echo -e "${BLUE}📊 Generating progress report...${NC}"

    # Get last week's date
    local last_week=$(date -d '7 days ago' +%Y-%m-%d)
    local this_week=$(date +%Y-%m-%d)
    local week_number=$(date +%V)

    # Create/update PROGRESS.md
    cat > "$PROGRESS_FILE" << EOF
# Watford Events - Development Progress

*Last updated: $(date +"%B %d, %Y")*

## Week $week_number Summary

### 🎯 This Week's Focus
$(gh issue list --state open --label "now" --limit 5 --json title,number,labels --template '{{range .}}• [#{{.number}}] {{.title}}{{range .labels}}{{if eq .name "sp1"}} [1pt]{{end}}{{if eq .name "sp2"}} [2pts]{{end}}{{if eq .name "sp3"}} [3pts]{{end}}{{if eq .name "sp5"}} [5pts]{{end}}{{if eq .name "sp8"}} [8pts]{{end}}{{end}}{{"\n"}}{{end}}' 2>/dev/null || echo "• Check project board for current priorities")

### ✅ Completed This Week
$(gh issue list --state closed --search "closed:>$last_week" --limit 10 --json title,number,closedAt,labels --template '{{range .}}• [#{{.number}}] {{.title}}{{range .labels}}{{if eq .name "sp1"}} [1pt]{{end}}{{if eq .name "sp2"}} [2pts]{{end}}{{if eq .name "sp3"}} [3pts]{{end}}{{if eq .name "sp5"}} [5pts]{{end}}{{if eq .name "sp8"}} [8pts]{{end}}{{end}} ({{timeago .closedAt}}){{"\n"}}{{end}}' 2>/dev/null || echo "• No issues closed this week")

### 🚧 In Progress
$(gh issue list --state open --search "assignee:@me" --limit 5 --json title,number,labels --template '{{range .}}• [#{{.number}}] {{.title}}{{range .labels}}{{if eq .name "sp1"}} [1pt]{{end}}{{if eq .name "sp2"}} [2pts]{{end}}{{if eq .name "sp3"}} [3pts]{{end}}{{if eq .name "sp5"}} [5pts]{{end}}{{if eq .name "sp8"}} [8pts]{{end}}{{end}}{{"\n"}}{{end}}' 2>/dev/null || echo "• Check project board for work in progress")

### 📈 Recent Commits
$(git log --since="$last_week" --pretty=format:"• %s (%cr)" --max-count=10 2>/dev/null || echo "• No recent commits found")

### 🎉 Achievements This Week
<!-- Add your wins, learnings, and milestones here -->

### 🔄 Next Week's Plan
<!-- Update this manually with your priorities -->

---

## 📊 Project Stats

**Total Issues:** $(gh issue list --limit 1000 --json number | jq length 2>/dev/null || echo "N/A")
**Open Issues:** $(gh issue list --state open --limit 1000 --json number | jq length 2>/dev/null || echo "N/A")
**Closed Issues:** $(gh issue list --state closed --limit 1000 --json number | jq length 2>/dev/null || echo "N/A")

**Recent Activity:** $(git log --oneline --since="$last_week" | wc -l 2>/dev/null || echo "0") commits this week

### 🏷️ Issues by Priority
**Now (this week):** $(gh issue list --state open --label "now" --limit 1000 --json number | jq length 2>/dev/null || echo "0") issues
**Soon (this month):** $(gh issue list --state open --label "soon" --limit 1000 --json number | jq length 2>/dev/null || echo "0") issues
**Later (someday):** $(gh issue list --state open --label "later" --limit 1000 --json number | jq length 2>/dev/null || echo "0") issues

### 🔧 Issues by Size
**1 point (quickies):** $(gh issue list --state open --label "sp1" --limit 1000 --json number | jq length 2>/dev/null || echo "0") issues
**2 points (half day):** $(gh issue list --state open --label "sp2" --limit 1000 --json number | jq length 2>/dev/null || echo "0") issues
**3 points (full day):** $(gh issue list --state open --label "sp3" --limit 1000 --json number | jq length 2>/dev/null || echo "0") issues
**5 points (2 days):** $(gh issue list --state open --label "sp5" --limit 1000 --json number | jq length 2>/dev/null || echo "0") issues
**8 points (3-4 days):** $(gh issue list --state open --label "sp8" --limit 1000 --json number | jq length 2>/dev/null || echo "0") issues

### 🎯 Point Tracking
**This Week Target:** ~15 points
**Points Completed:** $(gh issue list --state closed --search "closed:>$last_week" --json labels --template '{{range .}}{{range .labels}}{{if eq .name "sp1"}}1{{end}}{{if eq .name "sp2"}}2{{end}}{{if eq .name "sp3"}}3{{end}}{{if eq .name "sp5"}}5{{end}}{{if eq .name "sp8"}}8{{end}}{{end}} {{end}}' 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+$' | paste -sd+ | bc 2>/dev/null || echo "0") points this week
**Remaining "Now" Points:** $(gh issue list --state open --label "now" --json labels --template '{{range .}}{{range .labels}}{{if eq .name "sp1"}}1{{end}}{{if eq .name "sp2"}}2{{end}}{{if eq .name "sp3"}}3{{end}}{{if eq .name "sp5"}}5{{end}}{{if eq .name "sp8"}}8{{end}}{{end}} {{end}}' 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+$' | paste -sd+ | bc 2>/dev/null || echo "0") points

---

## 🗓️ Historical Progress

<!-- Previous weeks will be preserved below -->

EOF

    # Preserve existing historical data if it exists
    if [[ -f "$PROGRESS_FILE.backup" ]]; then
        echo "" >> "$PROGRESS_FILE"
        grep -A 1000 "## 🗓️ Historical Progress" "$PROGRESS_FILE.backup" | tail -n +2 >> "$PROGRESS_FILE" 2>/dev/null || true
    fi

    # Create backup
    cp "$PROGRESS_FILE" "$PROGRESS_FILE.backup" 2>/dev/null || true

    echo -e "${GREEN}✅ Progress report updated: $PROGRESS_FILE${NC}"
    echo -e "${BLUE}📝 Add your achievements and next week's plan manually${NC}"
}

show_status() {
    echo -e "${BLUE}📊 Watford Events - Current Status${NC}"
    echo ""

    echo -e "${GREEN}🎯 Priority Work (now):${NC}"
    gh issue list --state open --label "now" --limit 5 --json title,number,labels --template '{{range .}}• [#{{.number}}] {{.title}}{{range .labels}}{{if eq .name "sp1"}} [1pt]{{end}}{{if eq .name "sp2"}} [2pts]{{end}}{{if eq .name "sp3"}} [3pts]{{end}}{{if eq .name "sp5"}} [5pts]{{end}}{{if eq .name "sp8"}} [8pts]{{end}}{{end}}{{"\n"}}{{end}}' 2>/dev/null || echo "  No priority issues"
    echo ""

    echo -e "${YELLOW}📋 Point Summary:${NC}"
    local now_points=$(gh issue list --state open --label "now" --json labels --template '{{range .}}{{range .labels}}{{if eq .name "sp1"}}1{{end}}{{if eq .name "sp2"}}2{{end}}{{if eq .name "sp3"}}3{{end}}{{if eq .name "sp5"}}5{{end}}{{if eq .name "sp8"}}8{{end}}{{end}} {{end}}' 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+$' | paste -sd+ | bc 2>/dev/null || echo "0")
    local total_open=$(gh issue list --state open --limit 1000 --json number | jq length 2>/dev/null || echo "0")
    echo "  This week (now): $now_points points"
    echo "  Total open issues: $total_open"
    echo ""

    echo -e "${GREEN}✅ Recent Progress:${NC}"
    local last_week=$(date -d '7 days ago' +%Y-%m-%d)
    gh issue list --state closed --search "closed:>$last_week" --limit 3 --json title,number,labels --template '{{range .}}• [#{{.number}}] {{.title}}{{range .labels}}{{if eq .name "sp1"}} [1pt]{{end}}{{if eq .name "sp2"}} [2pts]{{end}}{{if eq .name "sp3"}} [3pts]{{end}}{{if eq .name "sp5"}} [5pts]{{end}}{{if eq .name "sp8"}} [8pts]{{end}}{{end}}{{"\n"}}{{end}}' 2>/dev/null || echo "  No recent completions"
    echo ""

    echo -e "${BLUE}💻 Recent Commits:${NC}"
    git log --oneline --max-count=3 2>/dev/null || echo "  No recent commits"
    echo ""

    echo -e "${BLUE}🔗 Quick Links:${NC}"
    local repo=$(gh repo view --json nameWithOwner --template '{{.nameWithOwner}}' 2>/dev/null || echo "unknown")
    echo "  Project Board: https://github.com/$repo/projects"
    echo "  Issues: https://github.com/$repo/issues"
}

main() {
    local command="${1:-help}"
    local file_arg="$2"

    case $command in
        setup)
            check_dependencies
            setup_workspace
            ;;
        plan)
            check_dependencies
            import_issues "$file_arg" "false"
            ;;
        preview)
            check_dependencies
            import_issues "$file_arg" "true"
            ;;
        progress)
            check_dependencies
            generate_progress
            ;;
        status)
            check_dependencies
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $command${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
