## Wrapping and setup

No root Provider is required to render `@hamirilo/ui` components — there is no `ThemeProvider`/context wrapper in this bundle. Components read color/spacing from CSS custom properties on `:root`, which `styles.css` already defines, so you can drop any `Hamirilo*` component directly into your JSX.

One exception: if your design uses toast notifications, mount `<HamiriloToaster />` **once**, near the root of the page (not per-component) — individual `Toast.success(...)`/`Toast.error(...)` calls render into it. Without it, toast calls are silent no-ops.

Dark mode is **class-based opt-in**, not automatic: nothing renders dark until an ancestor has `class="dark"`. Default every design to light mode unless the user asks for dark.

## Styling idiom — semantic Tailwind tokens, never raw hex

This DS ships Tailwind v4 utility classes bound to semantic CSS custom properties — always style with the semantic class, never a raw color (`bg-blue-600`, `#3b82f6`) or an inline style. The real families:

| Purpose | Classes |
|---|---|
| Primary action | `bg-primary` / `text-primary-foreground` / `hover:bg-primary` (blue) |
| Secondary / neutral | `bg-secondary` / `text-secondary-foreground` / `border-secondary-border` |
| Success | `bg-success` / `text-success-foreground` (green) |
| Danger / destructive | `bg-danger` / `text-danger-foreground` (red) |
| Warning | `bg-warning` / `text-warning-foreground` (orange) |
| Info | `bg-info` / `text-info-foreground` (light blue) |
| Page surface | `bg-background` / `text-foreground` |
| Card / popover surface | `bg-card` / `text-card-foreground`, `bg-popover` / `text-popover-foreground` |
| Muted / subdued | `bg-muted` / `text-muted-foreground` |
| Accent (hover surfaces) | `bg-accent` / `text-accent-foreground` |
| Borders / inputs / focus ring | `border-border`, `border-input`, `ring-ring` |

Radius is a single token: `rounded-[var(--radius)]` (0.5rem) — components already apply it internally; only reach for it when composing custom layout chrome around them.

**Never use `.btn-primary`, `.btn-secondary`, `.input-field`, `.card`, etc.** Those class names exist in this DS's CSS but are a *separate, parallel* system meant for raw server-rendered HTML (Django templates) — `.btn-primary` is the non-React equivalent of `<HamiriloButton variant="primary">`. When building React UI, always use the real `Hamirilo*` component; the CSS-class system is irrelevant here and mixing the two produces double-styled or broken markup.

## Where the truth lives

- `styles.css` (and its `@import` of the compiled component CSS) is the full, real stylesheet — every class and token above is defined there. Read it before inventing a new class name.
- Each component's own `<Name>.prompt.md` documents its exact props and variants — prefer it over guessing an API from the name.

## Idiomatic example

```tsx
import { HamiriloCard, HamiriloFormField, HamiriloInput, HamiriloButton } from "@hamirilo/ui";

function ExampleForm() {
  return (
    <HamiriloCard className="max-w-md">
      <div className="flex flex-col gap-4">
        <HamiriloFormField label="件名" required>
          <HamiriloInput placeholder="例: 備品購入の申請" />
        </HamiriloFormField>
        <div className="flex justify-end gap-2">
          <HamiriloButton variant="secondary">キャンセル</HamiriloButton>
          <HamiriloButton variant="primary">保存</HamiriloButton>
        </div>
      </div>
    </HamiriloCard>
  );
}
```

Layout glue (`flex`, `gap-4`, `max-w-md`, `justify-end`) uses plain Tailwind utilities; only *color and surface* styling should route through the semantic tokens above.

# HamiriloUI (@hamirilo/ui@1.0.4)

This design system is the published @hamirilo/ui React library, bundled as a single
browser global. All 26 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.HamiriloUI`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.HamiriloUI.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { HamiriloActiveIndicator } = window.HamiriloUI;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<HamiriloActiveIndicator />);
```

## Tokens

258 CSS custom properties from @hamirilo/ui. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **color** (156): `--tw-border-style`, `--tw-shadow-color`, `--tw-inset-shadow-color`, …
- **spacing** (6): `--tw-space-y-reverse`, `--tw-space-x-reverse`, `--tw-inset-shadow`, …
- **typography** (16): `--tw-font-weight`, `--tw-tracking`, `--font-sans`, …
- **radius** (7): `--radius-sm`, `--radius-md`, `--radius-lg`, …
- **shadow** (7): `--tw-shadow`, `--tw-shadow-alpha`, `--tw-ring-shadow`, …
- **other** (66): `--tw-translate-x`, `--tw-translate-y`, `--tw-translate-z`, …

## Components

### components
- `HamiriloActiveIndicator`
- `HamiriloBadge` — HamiriloBadge 
- `HamiriloButton` — HamiriloButton 
- `HamiriloButtonGroup` — HamiriloButtonGroup 
- `HamiriloCard` — HamiriloCard 
- `HamiriloCheckbox` — HamiriloCheckbox 
- `HamiriloConfirmDialog` — HamiriloConfirmDialog 
- `HamiriloDatePicker` — HamiriloDatePicker 
- `HamiriloDialog` — HamiriloDialog 
- `HamiriloDropdown` — HamiriloDropdown 
- `HamiriloFormDialog` — HamiriloFormDialog 
- `HamiriloFormField` — HamiriloFormField 
- `HamiriloInput` — HamiriloInput 
- `HamiriloNavItem`
- `HamiriloPagination` — HamiriloPagination 
- `HamiriloProgress` — HamiriloProgress 
- `HamiriloRadioGroup` — HamiriloRadioGroup 
- `HamiriloSearchInput` — HamiriloSearchInput 
- `HamiriloSelect` — HamiriloSelect 
- `HamiriloSidebarItem`
- `HamiriloSpinner` — HamiriloSpinner 
- `HamiriloTable` — HamiriloTable 
- `HamiriloTabs` — HamiriloTabs 
- `HamiriloTextarea` — HamiriloTextarea 
- `HamiriloThemeToggle`
- `HamiriloToast` — HamiriloToast -  API
