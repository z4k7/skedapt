# Skedapt

`skedapt` is a zero-config adaptive skeleton loader for Angular.

It decorates the real host element instead of asking you to manually calculate height and width, so the skeleton naturally follows the container's own layout.

## Compatibility

Angular `16` through `20`.

## Install

```bash
npm install skedapt
```

No global stylesheet import is required.

## Usage

Import the standalone directive:

```ts
import { SkeDaptDirective } from 'skedapt';
```

Then apply it on the same element that would normally receive your loading class:

```html
<div
  class="flex flex-col gap-1 border-r border-common-border-color px-4 py-4"
  [skedapt]="payeeSummaryLoading"
>
  <span class="font-700 text-[10px] uppercase tracking-widest text-common-secondary-font-color">
    This Month
  </span>
  <span class="text-lg font-extrabold leading-tight text-common-primary-font-color">
    {{ payeeSummary?.total_paid_in_month | currency }}
  </span>
</div>
```

This replaces patterns like:

```html
[ngClass]="payeeSummaryLoading ? 'skelton_loader' : ''"
```

## Behavior

- No `@use 'skedapt/styles';` setup is needed.
- The shimmer styles are injected automatically when the directive is used.
- The skeleton overlays the actual host element, so it adapts to padding, border radius, and live layout changes.
- Existing content stays in place, which keeps the parent size stable during loading.
- `skeDapt` still works as a legacy alias, but `skedapt` is the preferred API going forward.

## Theme Variables

`skedapt` exposes its own CSS variables so consumers can theme the skeleton globally without relying on app-specific tokens:

- `--skedapt-surface`
- `--skedapt-highlight`
- `--skedapt-radius`

Default fallbacks:

- `--skedapt-surface: #d9e6f4`
- `--skedapt-highlight: rgba(255, 255, 255, 0.5)`
- `--skedapt-radius: 10px`

Example global setup:

```scss
:root {
  --skedapt-surface: #d9e6f4;
  --skedapt-highlight: rgba(255, 255, 255, 0.5);
  --skedapt-radius: 10px;
}

.dark-theme {
  --skedapt-surface: #1f3a40;
  --skedapt-highlight: rgba(255, 255, 255, 0.18);
}
```

When the app switches theme classes, the skeleton colors switch automatically too.

## Optional Legacy Style Export

`skedapt/styles` is still published for compatibility, but importing it is optional.

## Build

```bash
ng build skedapt
```

## Publish

```bash
cd dist/skedapt
npm publish
```

## Test

```bash
ng test
```
