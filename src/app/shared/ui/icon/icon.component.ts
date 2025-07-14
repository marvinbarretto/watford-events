import { Component, input, computed } from '@angular/core';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconAnimation = 'none' | 'hover-fill' | 'pulse' | 'interactive' | 'hover-weight';

@Component({
  selector: 'app-icon',

  template: `
    <span
      class="material-symbols-outlined"
      [class]="animationClass()"
      [style.font-size.px]="sizeValue()"
      [style.color]="color()"
      [style.font-variation-settings]="fontVariationSettings()"
      [class]="customClass()"
      [attr.aria-label]="ariaLabel() || name()"
      [attr.role]="role()"
    >
      {{ name() }}
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .material-symbols-outlined {
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      user-select: none;
    }

    /* Animation variants */
    .icon-hover-fill {
      transition: font-variation-settings 0.3s ease;
    }

    .icon-hover-fill:hover {
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24 !important;
    }

    .icon-hover-weight {
      transition: font-variation-settings 0.2s ease;
    }

    .icon-hover-weight:hover {
      font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24 !important;
    }

    .icon-interactive {
      transition: font-variation-settings 0.2s ease-out;
    }

    .icon-interactive:hover {
      font-variation-settings: 'FILL' 0.3, 'wght' 500, 'GRAD' 25, 'opsz' 24 !important;
    }

    .icon-interactive:active {
      font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 50, 'opsz' 24 !important;
    }

    .icon-pulse {
      animation: icon-pulse 2s ease-in-out infinite;
    }

    @keyframes icon-pulse {
      0%, 100% {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      50% {
        font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 25, 'opsz' 24;
      }
    }

    /* Legacy clickable class */
    .icon-clickable {
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .icon-clickable:hover {
      opacity: 0.7;
    }
  `]
})
export class IconComponent {
  // Required icon name - Material Symbols name
  readonly name = input.required<string>();

  // Size variants
  readonly size = input<IconSize>('md');

  // Color (defaults to currentColor)
  readonly color = input<string>('currentColor');

  // Material Symbols variable font axes
  readonly fill = input<number>(0); // 0 = outlined, 1 = filled
  readonly weight = input<number>(400); // 100-700
  readonly grade = input<number>(0); // -50 to 200
  readonly opticalSize = input<number>(24); // 20-48

  // Animation variant
  readonly animation = input<IconAnimation>('none');

  // Custom CSS classes
  readonly customClass = input<string>('');

  // Accessibility
  readonly ariaLabel = input<string | null>(null);
  readonly role = input<string>('img');

  // Computed size value
  readonly sizeValue = computed(() => {
    const sizeMap: Record<IconSize, number> = {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32
    };
    return sizeMap[this.size()];
  });

  // Computed font variation settings
  readonly fontVariationSettings = computed(() =>
    `'FILL' ${this.fill()}, 'wght' ${this.weight()}, 'GRAD' ${this.grade()}, 'opsz' ${this.opticalSize()}`
  );

  // Computed animation class
  readonly animationClass = computed(() => {
    const animationType = this.animation();
    return animationType !== 'none' ? `icon-${animationType}` : '';
  });
}
