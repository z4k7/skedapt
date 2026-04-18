import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SkeDaptDirective } from './sk-auto-skeleton.directive';

@Component({
  standalone: true,
  imports: [SkeDaptDirective],
  template: `
    <div class="summary-card" [skedapt]="loading">
      <span>This Month</span>
      <span>{{ amount }}</span>
    </div>
  `,
})
class HostDirectiveComponent {
  loading = true;
  amount = '$1200';
}

@Component({
  standalone: true,
  imports: [SkeDaptDirective],
  template: `
    <section *skedapt="loading" class="summary-card">
      <span>Structural content</span>
    </section>
  `,
})
class StructuralDirectiveComponent {
  loading = true;
}

@Component({
  standalone: true,
  imports: [SkeDaptDirective],
  template: `
    <div class="summary-card" [skeDapt]="loading">
      <span>Legacy alias</span>
    </div>
  `,
})
class LegacyAliasComponent {
  loading = true;
}

describe('SkeDaptDirective', () => {
  beforeEach(() => {
    document.getElementById('skedapt-runtime-styles')?.remove();
  });

  it('injects runtime styles and marks the host element while loading', async () => {
    const fixture = TestBed.createComponent(HostDirectiveComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('.summary-card');

    expect(document.getElementById('skedapt-runtime-styles')).not.toBeNull();
    expect(host.classList.contains('skedapt-loading')).toBeTrue();
    expect(host.getAttribute('data-skedapt-host')).toBe('');
    expect(host.getAttribute('aria-busy')).toBe('true');
  });

  it('restores the host element when loading ends', async () => {
    const fixture = TestBed.createComponent(HostDirectiveComponent);
    fixture.detectChanges();

    fixture.componentInstance.loading = false;
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('.summary-card');

    expect(host.classList.contains('skedapt-loading')).toBeFalse();
    expect(host.hasAttribute('data-skedapt-host')).toBeFalse();
    expect(host.hasAttribute('aria-busy')).toBeFalse();
  });

  it('supports structural usage without creating a detached placeholder', async () => {
    const fixture = TestBed.createComponent(StructuralDirectiveComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('.summary-card');

    expect(host).not.toBeNull();
    expect(host.classList.contains('skedapt-loading')).toBeTrue();
  });

  it('keeps the legacy skeDapt alias working', async () => {
    const fixture = TestBed.createComponent(LegacyAliasComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('.summary-card');

    expect(host.classList.contains('skedapt-loading')).toBeTrue();
  });
});
