import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { LikeService, ContentType } from '../../data-access/like.service';

type Particle = {
  id: number;
  x: string;
  y: string;
  delay: string;
  color: string;
};

@Component({
  selector: 'app-heart-button',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      class="heart-button"
      [class.liked]="isLiked()"
      [class.loading]="loading()"
      [class.animating]="isAnimating()"
      (click)="onHeartClick()"
      [disabled]="loading()"
      [attr.aria-label]="ariaLabel()"
      type="button"
    >
      <div class="heart-wrapper">
        <app-icon
          name="favorite"
          [fill]="isLiked() ? 1 : 0"
          [color]="heartColor()"
          size="md"
          [weight]="isLiked() ? 600 : 400"
          animation="none"
          [customClass]="iconClass()"
        />

        @if (showParticles()) {
          <div class="particles-container">
            @for (particle of particles(); track particle.id) {
              <div
                class="particle"
                [style.--x]="particle.x"
                [style.--y]="particle.y"
                [style.--delay]="particle.delay"
                [style.--color]="particle.color"
              ></div>
            }
          </div>
        }
      </div>

      @if (showCount() && likeCount() > 0) {
        <span class="like-count" [class.count-animating]="countAnimating()">
          {{ formattedCount() }}
        </span>
      }
    </button>
  `,
  styles: [`
    .heart-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      border-radius: 20px;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      min-width: 44px;
      min-height: 44px;
      justify-content: center;
    }

    .heart-button:hover {
      background: var(--background-darker);
      transform: translateY(-1px);
    }

    .heart-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .heart-button.liked {
      background: var(--error)10;
    }

    .heart-button.liked:hover {
      background: var(--error)20;
    }

    .heart-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .heart-button.animating .heart-wrapper {
      animation: heart-burst 0.6s ease-out;
    }

    .heart-button.loading .heart-wrapper {
      animation: heart-pulse 1s ease-in-out infinite;
    }

    .like-count {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .heart-button.liked .like-count {
      color: var(--error);
    }

    .count-animating {
      animation: count-pop 0.4s ease-out;
    }

    /* Particles container */
    .particles-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      width: 0;
      height: 0;
    }

    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--color);
      animation: particle-burst 0.8s ease-out forwards;
      animation-delay: var(--delay);
      opacity: 0;
    }

    /* Heart animations */
    @keyframes heart-burst {
      0% {
        transform: scale(1);
      }
      25% {
        transform: scale(1.4);
      }
      50% {
        transform: scale(0.9);
      }
      75% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes heart-pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
    }

    /* Count animation */
    @keyframes count-pop {
      0% {
        transform: translateY(0) scale(1);
      }
      30% {
        transform: translateY(-3px) scale(1.1);
      }
      100% {
        transform: translateY(0) scale(1);
      }
    }

    /* Particle burst animation */
    @keyframes particle-burst {
      0% {
        transform: translate(0, 0) scale(0);
        opacity: 1;
      }
      20% {
        opacity: 1;
      }
      100% {
        transform: translate(var(--x), var(--y)) scale(1.2);
        opacity: 0;
      }
    }

    /* Icon color transitions */
    :host ::ng-deep .material-symbols-outlined {
      transition: color 0.3s ease, font-variation-settings 0.3s ease;
    }

    /* Accessibility improvements */
    @media (prefers-reduced-motion: reduce) {
      .heart-button,
      .heart-wrapper,
      .like-count,
      .particle,
      :host ::ng-deep .material-symbols-outlined {
        animation: none !important;
        transition: none !important;
      }
    }

    /* Focus styles */
    .heart-button:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .heart-button {
        border: 1px solid var(--border-strong);
      }

      .heart-button.liked {
        background: var(--error);
        color: var(--on-primary);
      }
    }
  `]
})
export class HeartButtonComponent {
  // Required inputs
  readonly contentId = input.required<string>();
  readonly contentType = input.required<ContentType>();

  // Optional inputs
  readonly showCount = input<boolean>(true);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  // Outputs
  readonly liked = output<boolean>();
  readonly error = output<string>();

  // Services
  private likeService = inject(LikeService);

  // Internal state
  readonly isLiked = signal<boolean>(false);
  readonly likeCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly isAnimating = signal<boolean>(false);
  readonly countAnimating = signal<boolean>(false);
  readonly showParticles = signal<boolean>(false);
  readonly particles = signal<Particle[]>([]);

  // Computed properties
  readonly heartColor = computed(() => {
    if (this.isLiked()) {
      return 'var(--error)';
    }
    return 'var(--text-secondary)';
  });

  readonly iconClass = computed(() => {
    return this.isAnimating() ? 'heart-animating' : '';
  });

  readonly formattedCount = computed(() => {
    const count = this.likeCount();
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  });

  readonly ariaLabel = computed(() => {
    const action = this.isLiked() ? 'Unlike' : 'Like';
    const count = this.likeCount();
    const countText = count > 0 ? `, ${count} ${count === 1 ? 'like' : 'likes'}` : '';
    return `${action} this ${this.contentType()}${countText}`;
  });

  constructor() {
    // Load initial state when inputs change
    effect(async () => {
      const contentId = this.contentId();
      const contentType = this.contentType();

      if (contentId && contentType) {
        await this.loadLikeState();
      }
    });
  }

  async onHeartClick(): Promise<void> {
    if (this.loading()) return;

    try {
      this.loading.set(true);

      // Optimistic update
      const wasLiked = this.isLiked();
      const oldCount = this.likeCount();

      this.isLiked.set(!wasLiked);
      this.likeCount.set(oldCount + (wasLiked ? -1 : 1));

      // Trigger animations
      if (!wasLiked) {
        this.triggerLikeAnimation();
      }

      // Perform the actual like/unlike operation
      const newLikeState = await this.likeService.toggleLike(
        this.contentId(),
        this.contentType()
      );

      // Get the updated count from the service
      const updatedCount = await this.likeService.getLikeCount(
        this.contentId(),
        this.contentType()
      );

      // Update state with actual values
      this.isLiked.set(newLikeState);
      this.likeCount.set(updatedCount);

      // Emit the new state
      this.liked.emit(newLikeState);

    } catch (error) {
      // Rollback optimistic update
      await this.loadLikeState();

      const errorMessage = error instanceof Error ? error.message : 'Failed to update like status';
      this.error.emit(errorMessage);
      console.error('Heart button error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadLikeState(): Promise<void> {
    try {
      this.loading.set(true);

      // Load like state and count in parallel
      const [liked, count] = await Promise.all([
        this.likeService.isLiked(this.contentId(), this.contentType()),
        this.likeService.getLikeCount(this.contentId(), this.contentType())
      ]);

      this.isLiked.set(liked);
      this.likeCount.set(count);

    } catch (error) {
      console.error('Failed to load like state:', error);
      // Set defaults on error
      this.isLiked.set(false);
      this.likeCount.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  private triggerLikeAnimation(): void {
    // Trigger heart burst animation
    this.isAnimating.set(true);
    setTimeout(() => this.isAnimating.set(false), 600);

    // Trigger count animation if count is visible
    if (this.showCount()) {
      this.countAnimating.set(true);
      setTimeout(() => this.countAnimating.set(false), 400);
    }

    // Generate particles
    this.generateParticles();

    // Show particles briefly
    this.showParticles.set(true);
    setTimeout(() => {
      this.showParticles.set(false);
      this.particles.set([]);
    }, 800);
  }

  private generateParticles(): void {
    const particleCount = 6;
    const colors = [
      'var(--error)',
      'var(--accent)',
      'var(--warning)',
      'var(--success)',
      'var(--info)',
      'var(--primary)'
    ];

    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 2 * Math.PI;
      const distance = 20 + Math.random() * 15; // Random distance 20-35px
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      newParticles.push({
        id: Date.now() + i,
        x: `${x}px`,
        y: `${y}px`,
        delay: `${i * 0.1}s`,
        color: colors[i % colors.length]
      });
    }

    this.particles.set(newParticles);
  }
}
