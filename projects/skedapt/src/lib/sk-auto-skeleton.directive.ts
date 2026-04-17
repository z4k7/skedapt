import { Directive, Input, TemplateRef, ViewContainerRef, Renderer2, ElementRef, OnDestroy, effect, signal } from '@angular/core';

@Directive({
  selector: '[skeDapt]',
  standalone: true
})
export class SkeDaptDirective implements OnDestroy {

  private skeletonElement: HTMLElement | null = null;
  private isLoadingSignal = signal<boolean>(false);

  // Public getter so we can use it safely
  get isLoading(): boolean {
    return this.isLoadingSignal();
  }

  @Input() set skeDapt(loading: boolean) {
    this.isLoadingSignal.set(loading);
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private renderer: Renderer2,
    private hostRef: ElementRef
  ) {
    effect(() => {
      this.updateView(this.isLoadingSignal());
    });
  }

  private updateView(isLoading: boolean): void {
    this.viewContainer.clear();

    if (isLoading) {
      this.skeletonElement = this.renderer.createElement('div');
      this.renderer.addClass(this.skeletonElement, 'sk-skeleton');

      const computed = getComputedStyle(this.hostRef.nativeElement);

      this.renderer.setStyle(this.skeletonElement, 'width', computed.width);
      this.renderer.setStyle(this.skeletonElement, 'height', computed.height || '20px');
      this.renderer.setStyle(this.skeletonElement, 'border-radius', computed.borderRadius);
      this.renderer.setStyle(this.skeletonElement, 'padding', computed.padding);
      this.renderer.setStyle(this.skeletonElement, 'margin', computed.margin);
      this.renderer.setStyle(this.skeletonElement, 'display', computed.display);

      // Append to parent to maintain layout position
      const parent = this.hostRef.nativeElement.parentNode;
      if (parent) {
        this.renderer.appendChild(parent, this.skeletonElement);
      }
    } else {
      // Show real content
      this.viewContainer.createEmbeddedView(this.templateRef);

      // Remove skeleton
      if (this.skeletonElement) {
        this.skeletonElement.remove();
        this.skeletonElement = null;
      }
    }
  }

  ngOnDestroy(): void {
    if (this.skeletonElement) {
      this.skeletonElement.remove();
    }
  }
}
