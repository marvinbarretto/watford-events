# Icon Component

A reusable icon component using Google Material Symbols with variable font animations.

## Usage

```typescript
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({  imports: [IconComponent],
  template: `
    <app-icon name="location_on" size="sm" />
    <app-icon name="schedule" size="md" color="blue" />
    <app-icon name="keyboard_arrow_up" size="lg" animation="hover-weight" />
  `
})
```

## Props

- `name` (required): Material Symbols icon name (e.g., 'location_on', 'schedule', 'keyboard_arrow_up')
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `color`: CSS color value (default: 'currentColor')
- `animation`: Animation variant (default: 'none')
- `fill`: Fill level 0-1 (default: 0 = outlined)
- `weight`: Font weight 100-700 (default: 400)
- `grade`: Fine-tune thickness -50 to 200 (default: 0)
- `opticalSize`: Size optimization 20-48 (default: 24)
- `customClass`: Additional CSS classes
- `ariaLabel`: Accessibility label
- `role`: ARIA role (default: 'img')

## Size Chart

- xs: 12px
- sm: 16px  
- md: 20px (default)
- lg: 24px
- xl: 32px

## Animation Variants

- `none`: No animation (default)
- `hover-fill`: Fill icon on hover (outlined → filled)
- `hover-weight`: Increase weight on hover (subtle boldness)
- `interactive`: Multi-axis hover + active states
- `pulse`: Continuous pulsing animation

## Common Icons

- `location_on`: Location/address
- `schedule`: Time/schedule  
- `keyboard_arrow_up`/`keyboard_arrow_down`: Expand/collapse
- `person`: User profile
- `calendar_month`: Date/events
- `settings`: Configuration
- `search`: Search functionality
- `add`: Add/create
- `edit`: Edit/modify
- `delete`: Delete/remove
- `favorite`: Like/bookmark
- `share`: Share content
- `home`: Home/dashboard

## Variable Font Features

Material Symbols supports 4 variable axes for smooth animations:

```html
<!-- Custom variable font settings -->
<app-icon 
  name="favorite" 
  [fill]="0.5" 
  [weight]="600" 
  [grade]="25" 
  [opticalSize]="32"
/>
```

## Examples

```html
<!-- Basic usage -->
<app-icon name="location_on" />

<!-- With animation -->
<app-icon name="favorite" animation="hover-fill" />

<!-- Interactive button -->
<button>
  <app-icon name="add" animation="interactive" size="sm" />
  Add Event
</button>

<!-- Loading indicator -->
<app-icon name="sync" animation="pulse" />

<!-- Custom styling -->
<app-icon 
  name="schedule" 
  size="lg" 
  color="var(--primary)"
  [weight]="500"
  ariaLabel="Event time"
/>
```

## Performance Notes

- Variable font animations are hardware-accelerated
- No additional assets loaded (single font file)
- Smooth 60fps animations
- Minimal CPU usage compared to SVG morphing
