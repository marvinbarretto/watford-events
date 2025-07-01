// src/app/shared/data-access/overlay.service.ts
import {
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  Type,
  EventEmitter,
} from '@angular/core';
import {
  Overlay,
  OverlayRef,
  OverlayConfig,
  GlobalPositionStrategy,
} from '@angular/cdk/overlay';
import {
  ComponentPortal,
} from '@angular/cdk/portal';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { Subscription } from 'rxjs';

export interface OverlayResult<T, R = any> {
  componentRef: ComponentRef<T>;
  overlayRef: OverlayRef;
  result: Promise<R | undefined>;
  close: (value?: R) => void;
}

@Injectable({ providedIn: 'root' })
export class OverlayService {
  private overlayRef?: OverlayRef;
  private focusTrap?: FocusTrap;
  private backdropSubscription?: Subscription;
  private keydownSubscription?: Subscription;
  private resultResolver?: (value: any) => void;

// TODO: Implement this
}
