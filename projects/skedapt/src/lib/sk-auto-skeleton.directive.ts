import { DOCUMENT } from '@angular/common';
import {
  Directive,
  effect,
  ElementRef,
  EmbeddedViewRef,
  inject,
  Input,
  OnDestroy,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

const SKEDAPT_STYLE_ID = 'skedapt-runtime-styles';
const SKEDAPT_HOST_ATTR = 'data-skedapt-host';
const SKEDAPT_LOADING_CLASS = 'skedapt-loading';
const SKEDAPT_DEFAULT_SURFACE = '#d9e6f4';
const SKEDAPT_DEFAULT_HIGHLIGHT = 'rgba(255, 255, 255, 0.5)';
const SKEDAPT_DEFAULT_RADIUS = '10px';
const SKEDAPT_RUNTIME_STYLES = `
[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS} {
  color: transparent !important;
  position: relative;
  border-radius: var(--skedapt-radius, ${SKEDAPT_DEFAULT_RADIUS});
}

[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS}::before,
[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--skedapt-radius, inherit);
}

[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS}::before {
  background: var(--skedapt-surface, ${SKEDAPT_DEFAULT_SURFACE});
  z-index: 1;
}

[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS}::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--skedapt-highlight, ${SKEDAPT_DEFAULT_HIGHLIGHT}) 15%, transparent) 20%,
    var(--skedapt-highlight, ${SKEDAPT_DEFAULT_HIGHLIGHT}) 50%,
    color-mix(in srgb, var(--skedapt-highlight, ${SKEDAPT_DEFAULT_HIGHLIGHT}) 15%, transparent) 80%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: skedapt-shimmer 1.2s ease-in-out infinite;
  z-index: 2;
}

[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS} > *,
[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS} > * * {
  visibility: hidden !important;
}

[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS} img,
[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS} svg,
[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS} canvas,
[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS} video,
[${SKEDAPT_HOST_ATTR}].${SKEDAPT_LOADING_CLASS} iframe {
  opacity: 0 !important;
}

@keyframes skedapt-shimmer {
  100% {
    transform: translateX(100%);
  }
}
`;

type InlineStyleSnapshot = {
  isolation: string | null;
  overflow: string | null;
  pointerEvents: string | null;
  position: string | null;
  userSelect: string | null;
};

@Directive({
  selector: '[skedapt],[skeDapt]',
  standalone: true,
})
export class SkeDaptDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef, { optional: true });
  private readonly renderer = inject(Renderer2);
  private readonly templateRef = inject<TemplateRef<unknown> | null>(TemplateRef, {
    optional: true,
  });
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly inlineStyleSnapshots = new WeakMap<HTMLElement, InlineStyleSnapshot>();
  private embeddedViewRef: EmbeddedViewRef<unknown> | null = null;
  private isLoading = false;
  private trackedElements = new Set<HTMLElement>();

  @Input()
  set skedapt(loading: boolean) {
    this.isLoading = loading;
    this.syncSkeletonState();
  }

  @Input('skeDapt')
  set skeDaptAlias(loading: boolean) {
    this.skedapt = loading;
  }

  constructor() {
    this.ensureRuntimeStyles();

    effect(() => {
      if (this.templateRef && !this.embeddedViewRef) {
        this.embeddedViewRef = this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }

  ngOnDestroy(): void {
    this.trackedElements.forEach((element) => this.disableSkeleton(element));
    this.trackedElements.clear();
  }

  private syncSkeletonState(): void {
    const nextElements = new Set(this.resolveTargetElements());

    this.trackedElements.forEach((element) => {
      if (!this.isLoading || !nextElements.has(element)) {
        this.disableSkeleton(element);
      }
    });

    if (this.isLoading) {
      nextElements.forEach((element) => this.enableSkeleton(element));
      this.trackedElements = nextElements;
      return;
    }

    this.trackedElements.clear();
  }

  private resolveTargetElements(): HTMLElement[] {
    if (this.templateRef) {
      const viewRef = this.embeddedViewRef ?? this.viewContainer.createEmbeddedView(this.templateRef);
      this.embeddedViewRef = viewRef;
      viewRef.detectChanges();

      return viewRef.rootNodes.filter((node): node is HTMLElement => node instanceof HTMLElement);
    }

    const nativeElement = this.elementRef?.nativeElement;
    return nativeElement instanceof HTMLElement ? [nativeElement] : [];
  }

  private enableSkeleton(element: HTMLElement): void {
    if (!this.inlineStyleSnapshots.has(element)) {
      this.inlineStyleSnapshots.set(element, {
        isolation: element.style.isolation || null,
        overflow: element.style.overflow || null,
        pointerEvents: element.style.pointerEvents || null,
        position: element.style.position || null,
        userSelect: element.style.userSelect || null,
      });
    }

    if (getComputedStyle(element).position === 'static') {
      this.renderer.setStyle(element, 'position', 'relative');
    }

    this.renderer.setStyle(element, 'overflow', 'hidden');
    this.renderer.setStyle(element, 'pointer-events', 'none');
    this.renderer.setStyle(element, 'user-select', 'none');
    this.renderer.setStyle(element, 'isolation', 'isolate');
    this.renderer.setAttribute(element, SKEDAPT_HOST_ATTR, '');
    this.renderer.setAttribute(element, 'aria-busy', 'true');
    this.renderer.addClass(element, SKEDAPT_LOADING_CLASS);
  }

  private disableSkeleton(element: HTMLElement): void {
    const snapshot = this.inlineStyleSnapshots.get(element);

    this.renderer.removeClass(element, SKEDAPT_LOADING_CLASS);
    this.renderer.removeAttribute(element, SKEDAPT_HOST_ATTR);
    this.renderer.removeAttribute(element, 'aria-busy');

    if (!snapshot) {
      return;
    }

    this.restoreStyle(element, 'position', snapshot.position);
    this.restoreStyle(element, 'overflow', snapshot.overflow);
    this.restoreStyle(element, 'pointer-events', snapshot.pointerEvents);
    this.restoreStyle(element, 'user-select', snapshot.userSelect);
    this.restoreStyle(element, 'isolation', snapshot.isolation);
    this.inlineStyleSnapshots.delete(element);
  }

  private restoreStyle(element: HTMLElement, property: string, value: string | null): void {
    if (value) {
      this.renderer.setStyle(element, property, value);
      return;
    }

    this.renderer.removeStyle(element, property);
  }

  private ensureRuntimeStyles(): void {
    if (this.document.getElementById(SKEDAPT_STYLE_ID)) {
      return;
    }

    const styleElement = this.renderer.createElement('style') as HTMLStyleElement;
    styleElement.id = SKEDAPT_STYLE_ID;
    styleElement.textContent = SKEDAPT_RUNTIME_STYLES;
    this.renderer.appendChild(this.document.head, styleElement);
  }
}
