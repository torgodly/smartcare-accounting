# Smart Care Accounting: Engineering Handover «دفتر هادئ» (Quiet Ledger)

Status: **final, approved for build.** This is the only document engineers build from. It merges the visual design system spec and the screens and flows spec, resolves every conflict between them, and drops every idea that needs backend changes or alters an existing behavior.

Read first: `docs/redesign/BRIEF.md`. Where this document and the brief disagree, the brief wins.

---

## 0. How to use this document

### 0.1 Ground rules (all workstreams)

1. **The backend is frozen.** Do not edit anything under `app/`, `routes/`, `database/`, `tests/`, `config/`, `resources/views/` or any `.php` file. Do not regenerate or hand-edit `resources/js/actions/**`, `resources/js/routes/**` or `resources/js/wayfinder/**`.
2. **Same props, same endpoints.** Pages receive the same Inertia props and call the same Wayfinder helpers (`@/actions/...`, `@/routes/...`) and the same `lib/http.ts` client.
3. **Same behavior.** Every rule, flow, toast text and validation message stays. Section 12 is the checklist.
4. **Arabic, RTL, light only.** Every visible string is Arabic, except serials, emails and "Smart Care". Logical CSS only.
5. **Strings.** «…» marks an exact existing string: copy it character for character. New strings are allowed **only** from the approved list in §11. Do not invent other copy.
6. **Shell gotcha:** in this shell plain `sed` is aliased to an artisan command. Use `/usr/bin/sed` or python for in-place edits.
7. **Before you finish:** `npx vp check --fix`, `npx tsc --noEmit`, `npm run build` and `php artisan test --compact` all pass. PHP tests are untouched and stay green.

### 0.2 Priorities

| Tag    | Meaning                                                                                    |
| ------ | ------------------------------------------------------------------------------------------ |
| **P0** | Required. The new look plus full behavior parity. Nothing ships without it.                |
| **P1** | Approved enhancement. Ship it in this rebuild. It must reuse existing props and endpoints. |
| **P2** | Optional. Only after all P0 and P1 items in your workstream pass acceptance.               |

### 0.3 Ownership

| Workstream                                  | Owns (only these paths)                                                                                                                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FOUNDATION** (one senior dev, runs first) | `package.json`, `package-lock.json`, `resources/css/app.css`, `resources/js/app.tsx`, `resources/js/components/**`, `resources/js/layouts/**`, `resources/js/lib/**`, `resources/js/hooks/**`, `resources/js/types/**` |
| **SALARIES**                                | `resources/js/pages/Salaries/**`                                                                                                                                                                                       |
| **ATTENDANCE**                              | `resources/js/pages/Attendance/**`                                                                                                                                                                                     |
| **PURCHASES + UPLOAD**                      | `resources/js/pages/Purchases/**`, `resources/js/pages/Upload.tsx`                                                                                                                                                     |
| **HOME + LOGIN**                            | `resources/js/pages/Home.tsx`, `resources/js/pages/Login.tsx`                                                                                                                                                          |

Page developers edit only their own paths. A page-only helper component goes in the page's own folder (for example `pages/Attendance/DayStrip.tsx`). Home and Login are single files, so any helper for them lives inside that file. If a page needs a change to a shared component, file a request to FOUNDATION; do not edit it.

Sequencing: FOUNDATION lands first (§13 lists its exit criteria). The four page workstreams then run in parallel.

---

## 1. Design principles

**Mood:** a private-bank ledger on good paper. Quiet, warm-neutral and precise. The chrome steps back and the money steps forward. The brand shows up like a watermark: you notice it, but it never competes with a figure.

1. **Numbers first.** Every screen answers "how much, and is it settled?" within one second. Money is the largest, boldest thing in its container, uses tabular figures, and its status sits beside it.
2. **Calm by default, color for meaning.** Neutrals carry about 90% of the pixels. Color says only paid / partial / unpaid / leave, or "you are here". No decorative fills.
3. **One context, always visible.** The selected month is global. It lives in the shell, it is one tap away, and every link carries `?month=`.
4. **Fast hands.** Large hit areas, keyboard paths (⌘K, arrows, Enter, Ctrl/⌘ + Enter), select-all on focus in money fields, and no animation that blocks input.
5. **Feedback where the eye is.** Numbers roll to their new values, pills cross-fade, rows show a save state. The toast is a second signal, never the only one.
6. **RTL native, not mirrored.** Logical properties only. Digits stay LTR and isolated. Directional icons point the Arabic way.
7. **Phone is first-class.** Below 640px dialogs become bottom sheets, wide tables become stacked cards, and the primary action stays in thumb reach.

### 1.1 What changes from today

| Today                                                     | Quiet Ledger                                                                                                                                                         |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cool blue-grey page `#f5f7f9`, flat white panels          | Warm mineral canvas `#F3F2EC`. On desktop the content sits in one raised white **sheet** framed by the canvas.                                                       |
| Sticky top bar with nav pills and a 3px cyan/amber stripe | **Desktop:** a quiet sidebar with a prominent **Period card** (the month control). **Phone:** a compact glass top bar plus a bottom tab bar. The stripe is removed.  |
| Accent `#0779a6` does everything                          | Deeper petrol primary `#08678A`. Brand cyan appears only as a glow (focus halo, active indicator). Brand amber appears only as a time marker (today, current month). |
| Solid filled status segments                              | Soft status surfaces with a dot. Table rows get a 3px status rail. Solid color is for actions only.                                                                  |
| Static numbers                                            | Numbers roll (NumberFlow) and use one numeric voice: IBM Plex tabular figures.                                                                                       |
| Plain dialogs everywhere                                  | Desktop dialogs and a side sheet. Phone drag-to-dismiss bottom sheets. A command palette (⌘K / Ctrl K).                                                              |

---

## 2. Color tokens (light only)

Contrast ratios are WCAG 2.x. Text ≥ 4.5:1. UI boundaries and focus ≥ 3:1. The brand fills `#48DFFF` and `#FFB63C` never carry text and never sit behind white text.

### 2.1 Surfaces

| Token             | Hex                     | Use                                                                |
| ----------------- | ----------------------- | ------------------------------------------------------------------ |
| `--canvas`        | `#F3F2EC`               | Page, sidebar and phone page background                            |
| `--surface`       | `#FFFFFF`               | Content sheet, panels, cards, dialogs, inputs                      |
| `--surface-2`     | `#F7F6F2`               | Wells: table footer, panel footer, breakdown inset, disabled input |
| `--surface-hover` | `#FAF9F6`               | Row and list item hover                                            |
| `--sunken`        | `#ECEBE4`               | Segmented track, skeleton, progress track                          |
| `--selected`      | `#EEFAFD`               | Selected row, command item, history "current month" row            |
| `--inverse`       | `#18232A`               | Tooltip, toast                                                     |
| `--scrim`         | `rgba(16,24,29,.44)`    | Dialog and sheet overlay, with `backdrop-filter: blur(2px)`        |
| `--canvas-glass`  | `rgba(243,242,236,.86)` | Phone top bar, with `backdrop-filter: blur(12px) saturate(140%)`   |

### 2.2 Ink

| Token     | Hex       | On white              | Use                                                            |
| --------- | --------- | --------------------- | -------------------------------------------------------------- |
| `--ink-1` | `#18232A` | 16.00                 | Primary text, money                                            |
| `--ink-2` | `#45515A` | 8.15                  | Secondary text, ghost buttons, unselected segments             |
| `--ink-3` | `#5D6870` | 5.71 (4.78 on sunken) | Muted text, labels, «د.ل», placeholders, table head            |
| `--ink-4` | `#959DA3` | 2.75                  | **Never text.** Decorative icons, drag handle, disabled glyphs |

### 2.3 Lines

| Token                | Hex       | Use                                                                          |
| -------------------- | --------- | ---------------------------------------------------------------------------- |
| `--line-1`           | `#E7E5DD` | Hairlines: row separators, panel borders, dividers                           |
| `--line-2`           | `#D8D5CB` | Table header bottom, footer top, secondary button border, sticky column edge |
| `--line-field`       | `#878F96` | Input, select, checkbox borders (3.28:1)                                     |
| `--line-field-hover` | `#6F797F` | Input hover border                                                           |

### 2.4 Brand

| Token                 | Hex       | Use                                                             |
| --------------------- | --------- | --------------------------------------------------------------- |
| `--cyan-50`           | `#EEFAFD` | Soft button, selected backgrounds                               |
| `--cyan-100`          | `#D3F5FE` | Soft button hover, phone tab-bar active pill                    |
| `--cyan-200`          | `#A6ECFF` | Soft pressed, chart highlight                                   |
| `--cyan-300` (brand)  | `#48DFFF` | Logo, sidebar active bar, empty-state dot. Never text.          |
| `--cyan-600`          | `#0B7DA6` | Focus ring, Inertia progress bar                                |
| `--cyan-700` (accent) | `#08678A` | Primary button bg, accent text, active icons (white on it 6.33) |
| `--cyan-800`          | `#075674` | Primary hover                                                   |
| `--cyan-900`          | `#0A4459` | Primary pressed                                                 |
| `--amber-50`          | `#FFF7E8` | Current-month tile background                                   |
| `--amber-100`         | `#FFEBC7` | Progress "remaining" track on the Home hero                     |
| `--amber-300` (brand) | `#FFB63C` | Logo, "today" / "current month" dot and ring. Never text.       |
| `--amber-700`         | `#8A5300` | Amber text («نظام المحاسبة»)                                    |

The brief's "current" accent `#0779a6` and amber text `#a8660a` are replaced by `#08678A` and `#8A5300`. They are deeper and pass contrast on every surface we use.

### 2.5 Status

Text uses the 700 tone, soft backgrounds the 50 tone, dots / rails / bars the 500 tone (never text).

| Tone      | Meaning                            | 700 text  | 50 bg     | 500 dot/rail |
| --------- | ---------------------------------- | --------- | --------- | ------------ |
| `ok`      | paid, present                      | `#1B6E41` | `#EAF6EE` | `#2E9E5B`    |
| `warn`    | partial, excuse, no receipt, carry | `#8F5208` | `#FDF2DE` | `#E39A2D`    |
| `bad`     | unpaid, absent, deduction          | `#B3261E` | `#FDECEA` | `#E5484D`    |
| `info`    | leave                              | `#2D58B0` | `#EBF0FC` | `#4C7BE0`    |
| `neutral` | not started, once                  | `#45515A` | `#EFEEE8` | `#959DA3`    |
| `accent`  | recurring                          | `#08678A` | `#EEFAFD` | `#0B7DA6`    |

Destructive solid: `--bad-700` bg with white text; hover `--bad-800` `#8F1D17`; pressed `#7A1813`. Soft danger border `#F2C9C5`. Avatar violet tint: text `#5B3E8F` on `#F1ECF8`.

### 2.6 Token block (FOUNDATION puts this in `resources/css/app.css`)

```css
:root {
    color-scheme: light;
    --canvas: #f3f2ec;
    --surface: #ffffff;
    --surface-2: #f7f6f2;
    --surface-hover: #faf9f6;
    --sunken: #ecebe4;
    --selected: #eefafd;
    --inverse: #18232a;
    --scrim: rgba(16, 24, 29, 0.44);
    --canvas-glass: rgba(243, 242, 236, 0.86);
    --ink-1: #18232a;
    --ink-2: #45515a;
    --ink-3: #5d6870;
    --ink-4: #959da3;
    --line-1: #e7e5dd;
    --line-2: #d8d5cb;
    --line-field: #878f96;
    --line-field-hover: #6f797f;
    --cyan-50: #eefafd;
    --cyan-100: #d3f5fe;
    --cyan-200: #a6ecff;
    --cyan-300: #48dfff;
    --cyan-600: #0b7da6;
    --cyan-700: #08678a;
    --cyan-800: #075674;
    --cyan-900: #0a4459;
    --amber-50: #fff7e8;
    --amber-100: #ffebc7;
    --amber-300: #ffb63c;
    --amber-700: #8a5300;
    --ok-50: #eaf6ee;
    --ok-500: #2e9e5b;
    --ok-700: #1b6e41;
    --warn-50: #fdf2de;
    --warn-500: #e39a2d;
    --warn-700: #8f5208;
    --bad-50: #fdecea;
    --bad-500: #e5484d;
    --bad-700: #b3261e;
    --bad-800: #8f1d17;
    --bad-border: #f2c9c5;
    --info-50: #ebf0fc;
    --info-500: #4c7be0;
    --info-700: #2d58b0;
    --neutral-50: #efeee8;
    --violet-50: #f1ecf8;
    --violet-700: #5b3e8f;
    --halo-cyan: rgba(72, 223, 255, 0.32);
    --halo-bad: rgba(229, 72, 77, 0.18);
}
```

Expose every token in `@theme inline` as `--color-<name>` (utilities such as `bg-canvas`, `text-ink-3`, `border-line-1`, `bg-ok-50`, `text-bad-700`).

**shadcn aliases** (keep so `components/ui/*` works): `background → canvas`, `foreground → ink-1`, `card / popover → surface`, `primary → cyan-700`, `primary-foreground → #fff`, `secondary → surface-2`, `muted-foreground → ink-3`, `border → line-1`, `input → line-field`, `ring → cyan-600`, `destructive → bad-700`.

**Legacy aliases (temporary).** Today's pages use `bg-bg`, `bg-sunk`, `border-line`, `text-ink`, `text-muted`, `text-accent`, `bg-accent-soft`, `text-gold-ink`, `text-ok`, `bg-ok-soft`, etc. FOUNDATION keeps these names working, re-pointed to the new palette, so the old pages still build while page work is in progress:

| Legacy                                            | New                              |
| ------------------------------------------------- | -------------------------------- |
| `bg`                                              | canvas                           |
| `sunk`                                            | sunken                           |
| `line`                                            | line-1                           |
| `ink`                                             | ink-1                            |
| `muted`                                           | ink-3                            |
| `accent` / `accent-hover` / `accent-soft`         | cyan-700 / cyan-800 / cyan-50    |
| `brand` / `gold` / `gold-ink`                     | cyan-300 / amber-300 / amber-700 |
| `ok` / `ok-soft` (same for `warn`, `bad`, `info`) | ok-700 / ok-50                   |

Page developers use **only new names**. After all pages merge, FOUNDATION deletes the legacy aliases and the legacy classes `.field-input`, `.money-input`, `.dashed-divider` (acceptance §14 includes a grep for them).

---

## 3. Typography

Fonts are already loaded in `app.blade.php` (do not edit it): **Readex Pro** 500/600/700 for display words and titles only; **IBM Plex Sans Arabic** 400/500/600/700 for body, UI and **all numbers**.

Rules:

- Never letter-space Arabic. Numbers ≥ 28px inside `.num` may use `letter-spacing: -0.015em`.
- Titles `text-wrap: balance`; body `text-wrap: pretty`.
- The minus sign is U+2212 `−`, never a hyphen.
- Every number sits in `.num`:

```css
.num {
    font-family: var(--font-sans);
    font-variant-numeric: tabular-nums lining-nums;
    font-feature-settings:
        'tnum' 1,
        'lnum' 1;
    direction: ltr;
    unicode-bidi: isolate;
}
```

QA: render `1111.11` above `8888.88` in a table cell. Widths must match.

### 3.1 Text scale

FOUNDATION exposes each as a utility class `text-<token>` (for example `text-title-1`) that sets family, size, line-height and weight, with the phone override below 640px.

| Token         | Font                                       | Size/lh px | Weight | Phone (<640)    | Use                                                        |
| ------------- | ------------------------------------------ | ---------- | ------ | --------------- | ---------------------------------------------------------- |
| `display`     | Readex                                     | 34/44      | 600    | 26/36           | Home month heading                                         |
| `title-1`     | Readex                                     | 26/36      | 600    | 22/32           | Page title                                                 |
| `title-2`     | Readex                                     | 19/28      | 600    | 18/26           | Dialog / sheet title, section heading                      |
| `title-3`     | Readex                                     | 16/24      | 600    | same            | Panel header, card title, brand name                       |
| `body-lg`     | Plex                                       | 16/28      | 400    | same            | Login, empty-state copy                                    |
| `body`        | Plex                                       | 15/24      | 400    | same            | Default `body`                                             |
| `body-strong` | Plex                                       | 15/24      | 600    | same            | Employee name, invoice title                               |
| `body-sm`     | Plex                                       | 14/22      | 400    | same            | Descriptions, table text                                   |
| `label`       | Plex                                       | 14/20      | 600    | same            | Form labels                                                |
| `label-sm`    | Plex                                       | 13/18      | 500    | same            | Stat labels, panel meta, breadcrumb                        |
| `caption`     | Plex                                       | 12.5/18    | 400    | same            | Hints, sub-lines (job title, shift)                        |
| `th`          | Plex                                       | 12.5/16    | 600    | same            | Table header, group headings (ink-3)                       |
| `pill`        | Plex                                       | 12/16      | 600    | same            | Badges                                                     |
| `tab-label`   | Plex                                       | 11.5/14    | 500    | phone only      | Bottom tab bar                                             |
| `serial`      | `ui-monospace, "SF Mono", Menlo, Consolas` | 12.5/16    | 500    | same            | `CODE-YYMM-NNN`, ltr, isolate, ink-3, letter-spacing .02em |
| `kbd`         | Plex                                       | 11.5/16    | 600    | hidden on touch | Shortcut keys                                              |

Buttons: sm 13/18, md 14/20, lg 15/22, all 600. Sidebar nav items 15/22 500.

### 3.2 Money scale

The «د.ل» suffix is always Plex 500 in `--ink-3`, 4px gap, baseline-aligned.

| `size`        | Number px | Weight | Phone | Suffix | Use                                                            |
| ------------- | --------- | ------ | ----- | ------ | -------------------------------------------------------------- |
| `hero`        | 44/48     | 700    | 34/40 | 16     | Home salaries hero                                             |
| `dialog`      | 30/36     | 700    | 26/32 | 14     | Payment dialog result line                                     |
| `kpi`         | 28/34     | 700    | 22/28 | 13     | StatCard value                                                 |
| `card`        | 22/28     | 700    | 20/26 | 12     | Invoice card price, breakdown total, group total, history card |
| `footer`      | 18/24     | 700    | same  | 12     | Table footer totals                                            |
| `cell-strong` | 17/24     | 700    | same  | 11     | Key columns: المستحق, المتبقي, invoice price                   |
| `cell`        | 15/22     | 600    | same  | 11     | Other money columns                                            |
| `inline`      | 14/22     | 600    | same  | 11     | Money in sentences, breakdown lines                            |
| `tile`        | 15/20     | 700    | same  | none   | MonthPicker tiles                                              |
| `input`       | 22/28     | 600    | same  | 13     | MoneyInput                                                     |

Signs: `+` for bonus (ok-700), `−` for deductions (bad-700), inside the LTR span: `+250`, `−120`.

---

## 4. Space, shape, depth, focus, layers

### 4.1 Spacing

Base 4px. Scale `0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

| Context                      | Value                                                |
| ---------------------------- | ---------------------------------------------------- |
| Content sheet padding        | 40 desktop (32 at 1024–1279) / 24 tablet / 16 phone  |
| Page header → first block    | 24                                                   |
| Between sections             | 32 (phone 24)                                        |
| Card grid gap                | 16 (phone 10)                                        |
| Panel body                   | 20 (phone 16)                                        |
| Panel header                 | h56, padding-inline 20                               |
| Label → control → hint/error | 6 / 6                                                |
| Between fields / groups      | 16 / 24                                              |
| Dialog                       | header 20/24, body 24, footer 16/24 (phone sheet 16) |
| Icon gap                     | 8 (sm 6)                                             |

Max content width inside the sheet: 1240px, centered.

Breakpoints: **phone** < 640 (design at 400, verify 360) · **tablet** 640–1023 (phone shell, desktop dialogs, desktop tables) · **desktop** ≥ 1024 (sidebar shell) · **wide** ≥ 1440.

### 4.2 Radius

| Token    | px   | Use                                                               |
| -------- | ---- | ----------------------------------------------------------------- |
| `r-xs`   | 5    | Kbd, checkbox                                                     |
| `r-sm`   | 8    | sm buttons, segments, select / command items, tooltip             |
| `r-md`   | 10   | md/lg buttons, inputs, selects, segmented track, nav items, tiles |
| `r-lg`   | 14   | Panels, cards, StatCards, MonthPicker popover, dropzone           |
| `r-xl`   | 18   | Dialogs, desktop content sheet, command palette, side sheet       |
| `r-2xl`  | 22   | Bottom sheet top corners                                          |
| `r-full` | 9999 | Pills, avatars, dots, progress, tab-bar pill                      |

### 4.3 Borders

1px everywhere. Panels `line-1`. Inputs `line-field`. Table header bottom and footer top `line-2`. Dashed lines only on the receipt dropzone (1.5px `line-field`), the "not started" pill outline, and the payment breakdown divider (1px `line-2`).

### 4.4 Elevation (ink-tinted, never pure black)

| Token        | Value                                                                                                  | Use                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `e1`         | `0 1px 0 rgb(24 35 42/.03), 0 1px 3px rgb(24 35 42/.06)`                                               | Panels, cards, sheet, active nav item, selected segment |
| `e2`         | `0 2px 4px -2px rgb(24 35 42/.06), 0 8px 16px -4px rgb(24 35 42/.08)`                                  | Card hover, scrolled sticky header                      |
| `e3`         | `0 0 0 1px rgb(24 35 42/.06), 0 4px 8px -4px rgb(24 35 42/.08), 0 16px 32px -8px rgb(24 35 42/.16)`    | Popover, select, dropdown, toast                        |
| `e4`         | `0 0 0 1px rgb(24 35 42/.06), 0 12px 24px -8px rgb(24 35 42/.12), 0 32px 64px -16px rgb(24 35 42/.26)` | Dialog, sheet, palette                                  |
| `edge-start` | `inset -8px 0 8px -8px rgb(24 35 42/.10)`                                                              | Sticky first column while scrolled sideways             |

Expose as `shadow-e1` … `shadow-e4`.

### 4.5 Focus

- Global: `:focus-visible { outline: 2px solid var(--cyan-600); outline-offset: 2px; }`.
- Fields (input, select trigger, MoneyInput, TimeInput, textarea): no outline; `border-color: var(--cyan-700); box-shadow: 0 0 0 4px var(--halo-cyan);` over 140ms.
- Invalid field: border `bad-700`, halo `--halo-bad`.
- On `--inverse` (toast actions): outline `#FFFFFF`.

### 4.6 Layers (z-index)

| Layer                                                      | z         |
| ---------------------------------------------------------- | --------- |
| Sticky first column / sticky header + footer / corner cell | 1 / 2 / 3 |
| Sidebar, phone top bar, bottom tab bar                     | 30        |
| Popover, dropdown, select                                  | 50        |
| Scrim / dialog, sheet                                      | 60 / 61   |
| Nested dialog (QR over invoice, Confirm over a dialog)     | 62        |
| Command palette                                            | 70        |
| Toast                                                      | 80        |
| Tooltip                                                    | 90        |

---

## 5. Motion

### 5.1 Tokens (FOUNDATION exports them from `lib/motion.ts` and as CSS vars)

| Token          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| `dur-press`    | 80ms                                                         |
| `dur-fast`     | 140ms (hover color, pill color)                              |
| `dur-base`     | 200ms (popover, fades)                                       |
| `dur-enter`    | 260ms (dialog, palette)                                      |
| `dur-exit`     | 160ms                                                        |
| `dur-number`   | 650ms (NumberFlow)                                           |
| `dur-bar`      | 600ms (progress, year bars)                                  |
| `ease-out`     | `cubic-bezier(0.22, 1, 0.36, 1)`                             |
| `ease-in`      | `cubic-bezier(0.55, 0, 1, 0.45)`                             |
| `ease-in-out`  | `cubic-bezier(0.65, 0, 0.35, 1)`                             |
| `springSnappy` | `{ type: "spring", stiffness: 520, damping: 40, mass: 0.8 }` |
| `springSheet`  | `{ type: "spring", stiffness: 380, damping: 38 }`            |

### 5.2 What animates

| Element                                   | Behavior                                                                                                                                                | Technique                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog overlay                            | opacity 0→1 `dur-base`; exit `dur-exit`                                                                                                                 | CSS keyframes on Radix `[data-state]`                                                                                                   |
| Dialog content                            | opacity, `scale(.97)→1`, `translateY(8px)→0`, `dur-enter ease-out`; exit to `scale(.98)`, `dur-exit ease-in`                                            | CSS keyframes                                                                                                                           |
| Popover / Select / Dropdown               | opacity, `scale(.96)→1` from `var(--radix-*-content-transform-origin)`, 180ms; exit 120ms fade                                                          | CSS                                                                                                                                     |
| Tooltip                                   | fade + 2px slide, 120ms; exit 80ms                                                                                                                      | CSS                                                                                                                                     |
| Phone bottom sheet                        | vaul native, drag to dismiss                                                                                                                            | vaul                                                                                                                                    |
| Desktop side sheet (History)              | `x: "-100%" → 0` (enters from the **left**, inline-end in RTL), `springSheet`; exit 200ms ease-in                                                       | motion + Radix Dialog `forceMount` + `AnimatePresence`                                                                                  |
| Command palette                           | as dialog plus `translateY(-8px)→0`                                                                                                                     | CSS                                                                                                                                     |
| List stagger (table rows, card grids)     | opacity 0→1, `y: 4→0`, 220ms, 18ms stagger, first 12 items only. **Only on first mount and when `month` changes**, never after a save or partial reload | motion `m.tr` / `m.div`                                                                                                                 |
| Money                                     | digit roll `dur-number`                                                                                                                                 | `@number-flow/react` on StatCard, hero, table footers, payment breakdown, Home cards, attendance counters. **Not** on table body cells. |
| Segmented thumb, tabs indicator           | `springSnappy`                                                                                                                                          | motion `layoutId` scoped with `useId()`                                                                                                 |
| Nav indicator (sidebar bar, tab-bar pill) | `springSnappy`                                                                                                                                          | `layoutId="nav-indicator"`                                                                                                              |
| Progress bars / year bars                 | 0→value `dur-bar ease-out`, 30ms stagger                                                                                                                | CSS transition on `inline-size` / `scaleY`                                                                                              |
| Status pill change                        | bg/color crossfade `dur-fast`                                                                                                                           | CSS                                                                                                                                     |
| Button press                              | `scale(.98)` `dur-press`                                                                                                                                | CSS `:active`                                                                                                                           |
| Interactive card hover                    | `translateY(-1px)`, `e1→e2`, `dur-fast`                                                                                                                 | CSS                                                                                                                                     |
| Skeleton shimmer                          | highlight sweeps right→left, 1.4s linear infinite                                                                                                       | CSS                                                                                                                                     |
| Month change in flight                    | content dims to 60% opacity after 150ms; numbers roll when props land; 160ms fade in                                                                    | Shell (§8.1)                                                                                                                            |
| Field invalid                             | one 6px horizontal shake, 300ms                                                                                                                         | CSS keyframe `shake`                                                                                                                    |
| Inertia navigation                        | 2px bar, `color: '#0B7DA6', delay: 150`                                                                                                                 | `createInertiaApp({ progress })` in `app.tsx`                                                                                           |

### 5.3 Reduced motion

- App root: `<MotionConfig reducedMotion="user">` (transforms dropped, opacity kept).
- CSS keyframes have an opacity-only 120ms variant. No scale, translate or shake.
- NumberFlow keeps `respectMotionPreference` (final value appears instantly).
- Stagger off. Shimmer off (static `--sunken`). Springs jump.
- Keep the existing global guard (animation/transition `0.01ms`) as a safety net.

---

## 6. Packages

All versions were checked on npm on 2026-11-05 (`npm view <pkg>@<ver> version peerDependencies`; typings inspected from the tarballs). Each is at least 14 days old. React here is 19.3.1.

FOUNDATION installs them in one command (the brief pre-approves dependency changes for this redesign):

```
npm install --save-exact motion@14.6.0 @number-flow/react@0.6.2 @tanstack/react-table@9.3.1 cmdk@1.1.1 vaul@1.1.2
```

### 6.1 Approved

| Package                 | Version                 | Peer deps                        | Use                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `motion`                | **14.6.0** (2026-10-22) | react / react-dom `^18 \|\| ^19` | Springs, shared-layout indicators, presence exits, stagger. Import from `motion/react`. Wrap the app in `<LazyMotion features={domMax} strict>` and `<MotionConfig reducedMotion="user">`, and use `m.*` components only. 14.9.1 is newest but too fresh.                                                                                                                                                                                                     |
| `@number-flow/react`    | **0.6.2** (2026-07-18)  | react / react-dom `^18 \|\| ^19` | Rolling money and counts, only through `<Money animated>` and `<Count animated>`. `locales="en-US"`, `format={{ maximumFractionDigits: 2 }}` (identical to `formatNumber`). Use `NumberFlowGroup` for footer rows.                                                                                                                                                                                                                                            |
| `@tanstack/react-table` | **9.3.1** (2026-10-12)  | react `>=18`                     | Headless table for `DataTable`. **v9 API**: `const features = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel(), sortFns: { alphanumeric: sortFn_alphanumeric } }); const table = useTable({ features, columns, data });` and render cells with `<table.FlexRender cell={cell} />`. Do not use `useLegacyTable` or v8 tutorials. If the React Compiler shows stale rows in one component, add `'use no memo'` to that component only. |
| `cmdk`                  | **1.1.1**               | react / react-dom `^18 \|\| ^19` | Command palette, unstyled, custom `filter` for Arabic normalization.                                                                                                                                                                                                                                                                                                                                                                                          |
| `vaul`                  | **1.1.2**               | react / react-dom up to `^19`    | Phone bottom sheets (drag to dismiss, `repositionInputs` keeps money fields above the iOS keyboard). Isolated behind `ResponsiveDialog` / `BottomSheet`, so it can be swapped for Radix Dialog + motion `drag="y"` without touching pages.                                                                                                                                                                                                                    |

### 6.2 Kept (installed)

`radix-ui` 1.8.1 (Dialog, Popover, Select, DropdownMenu, Tooltip, Tabs, RadioGroup, Direction; wrap the app in `<Direction.Provider dir="rtl">`), `sonner` 2.0.8, `lucide-react` 1.68.0, `qrcode.react` 4.2.0, `date-fns` 4.4.0, `class-variance-authority`, `clsx`, `tailwind-merge`, Tailwind CSS 4.3.4, `@inertiajs/react` 3.11.0.

### 6.3 Rejected

| Package                      | Reason                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `recharts`                   | The only chart is a 12-bar year strip. Plain SVG is a few hundred bytes; recharts is ~100 KB and needs manual RTL axis reversal. |
| `react-day-picker`           | No free date fields in the app. Attendance has its own Saturday-first calendar.                                                  |
| `react-number-format`        | No Arabic-Indic digit support in v5. The in-house MoneyInput / TimeInput do normalization with less code.                        |
| `@tanstack/react-virtual`    | Tens of rows; not needed.                                                                                                        |
| `tw-animate-css`             | We define about 10 keyframes ourselves.                                                                                          |
| `yet-another-react-lightbox` | Not proven in RTL. The receipt viewer is a small in-house dialog (§7.20).                                                        |

---

## 7. Shared components (FOUNDATION)

Conventions:

- Icons: lucide, 16 (sm), 18 (md), 20 (lg). Stroke 1.75 globally via CSS: `.lucide { stroke-width: 1.75 }`.
- Directional icons: "next / forward" is `ChevronLeft`, "previous / back" is `ChevronRight` / `ArrowRight`. Never mirror non-directional icons.
- Every interactive element has hover, active, focus-visible, disabled and (where relevant) loading states.
- Files are PascalCase in `components/` (shadcn primitives stay in `components/ui/`, restyled). Each export has a PHPDoc-style JSDoc block.
- **Backward compatibility:** until the page workstreams merge, the old pages must still type-check and build. Old props are accepted where listed as "legacy"; they may be removed in FOUNDATION's cleanup pass after all pages merge.

### 7.1 Button (`components/ui/button.tsx`)

```ts
type ButtonProps = ComponentProps<'button'> & {
    variant?:
        | 'primary'
        | 'secondary'
        | 'soft'
        | 'ghost'
        | 'danger'
        | 'danger-solid'
        | 'link';
    size?: 'sm' | 'md' | 'lg';
    icon?: LucideIcon; // leading icon, inline-start
    loading?: boolean; // spinner replaces icon, aria-busy, disabled, width kept
    asChild?: boolean; // e.g. Inertia <Link> or <a download>
};
```

Legacy: `variant` `default→primary`, `outline→secondary`, `destructive→danger-solid`, `secondary→secondary`; `size` `default→md`, `icon→` IconButton md.

| Size | Height               | Padding-inline    | Icon | Radius | Gap |
| ---- | -------------------- | ----------------- | ---- | ------ | --- |
| sm   | 32                   | 12 (10 with icon) | 16   | 8      | 6   |
| md   | 40 (**44 on phone**) | 16 (14 with icon) | 18   | 10     | 8   |
| lg   | 48                   | 20                | 20   | 10     | 8   |

| Variant      | Rest                                                    | Hover                       | Pressed             |
| ------------ | ------------------------------------------------------- | --------------------------- | ------------------- |
| primary      | bg cyan-700, white, e1                                  | cyan-800                    | cyan-900, scale .98 |
| secondary    | white, 1px line-2, ink-1, `0 1px 2px rgb(24 35 42/.05)` | surface-2, border `#CBC8BD` | sunken              |
| soft         | cyan-50, cyan-700                                       | cyan-100                    | cyan-200            |
| ghost        | transparent, ink-2                                      | `rgb(24 35 42/.05)`, ink-1  | `rgb(24 35 42/.08)` |
| danger       | white, bad-700, 1px bad-border                          | bad-50                      | `#FAD9D5`           |
| danger-solid | bad-700, white                                          | bad-800                     | `#7A1813`           |
| link         | cyan-700, underline on hover (offset 4)                 |                             |                     |

Disabled: opacity .45, `pointer-events: none`, no shadow. One primary per view.

**Footer order (kept from today):** primary first at inline-start (right), then cancel; destructive pushed to the end with `ms-auto`.

### 7.2 IconButton

```ts
type IconButtonProps = ComponentProps<'button'> & {
    label: string; // aria-label and tooltip text (Arabic)
    icon: LucideIcon;
    size?: 'sm' | 'md' | 'lg'; // 32 / 36 / 40 square, icon 16 / 18 / 20
    variant?: 'ghost' | 'secondary' | 'soft';
    tooltip?: boolean; // default true; pointer devices only
    asChild?: boolean;
};
```

Touch: hit area grows to 44 with `::before { inset: -4px }`.

### 7.3 Field

```ts
type FieldProps = {
    label: ReactNode;
    htmlFor?: string;
    hint?: ReactNode;
    error?: string;
    children: ReactNode;
    className?: string;
};
```

Label `label` ink-1 → 6px → control → 6px → hint (`caption` ink-3) **or** error (13/18 500 bad-700 with `AlertCircle` 14 at inline-start, `id` for `aria-describedby`). Field clones nothing; the control sets `aria-invalid` and `aria-describedby` via `useFieldIds(htmlFor)` (exported). When `error` changes from empty to a value, the control plays `shake` once.

### 7.4 Input, Textarea, NativeSelect (`components/ui/input.tsx`, `textarea.tsx`, `components/NativeSelect.tsx`)

- Input: h40 (phone 44), radius 10, white, 1px line-field, padding-inline 12, 15/24 ink-1, placeholder ink-3. Hover line-field-hover. Focus halo. `aria-invalid` → invalid style. Disabled surface-2 / line-2 / ink-3. Read-only surface-2, transparent border.
- Textarea: same box, min-h 88, padding 10/12, resize vertical. `autoGrow?: { minRows: number; maxRows: number }` (P1, used by InvoiceDialog «سبب الشراء»).
- NativeSelect: `appearance: none`, Input box, chevron background SVG at inline-end (`background-position: left 12px center`).

### 7.5 MoneyInput

In-house. Anatomy: `[number | 1px line-1 divider | «د.ل»]` in one field box; h52, radius 10, `money size="input"`. The number is `dir="ltr"`, `text-align: right` (reads first in RTL). «د.ل» adornment at inline-end, 13/500 ink-3, padding-inline 12.

```ts
type MoneyInputProps = Omit<
    ComponentProps<'input'>,
    'type' | 'size' | 'value' | 'onChange'
> & {
    value: string; // raw, no commas: '' | '12500.5'
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void; // legacy, target.value is normalized
    onValueChange?: (value: string) => void; // preferred
    size?: 'md' | 'sm'; // sm: h44, 18/24 (Settings grid)
    invalid?: boolean;
};
```

Behavior (display only; submitted values still go through `parseMoney` and are exactly what `form.data.*` holds today, a plain numeric string):

- `type="text"`, `inputMode="decimal"`, `autoComplete="off"`, `enterKeyHint="done"`.
- Normalize while typing (`lib/arabic.ts#normalizeMoneyInput`): `٠–٩` and `۰–۹` → `0–9`; `٫` → `.`; strip `٬`, `,` and spaces; one `.` max; 2 decimals max; no `-`.
- Focused: raw value. Blurred: grouped display (`12,500.5`) via `formatNumber`. No caret jumps.
- Select-all on focus.
- P1: `ArrowUp` / `ArrowDown` ±1, with Shift ±10, floor 0.
- Empty means 0 where the server already treats it so (unchanged).

### 7.6 TimeInput (replaces native `type="time"`)

Native time inputs show AM/PM or Arabic meridiem in some locales. In-house masked 24h field.

```ts
type TimeInputProps = Omit<
    ComponentProps<'input'>,
    'type' | 'value' | 'onChange'
> & {
    value: string; // '' or 'HH:MM' (server format H:i, e.g. '08:00')
    onValueChange: (value: string) => void;
    invalid?: boolean;
};
export function isCompleteTime(value: string): boolean; // /^([01]\d|2[0-3]):[0-5]\d$/
```

- Input box (h40), `dir="ltr"`, `.num`, `text-align: right`, `Clock` 16 ink-3 adornment at inline-end. `inputMode="numeric"`, placeholder `--:--`.
- Accepts Arabic-Indic digits; auto-inserts `:` after 2 digits; clamps hours 0–23 and minutes 0–59 on blur; pads (`8:5` → `08:05`).
- P1: `ArrowUp` / `ArrowDown` step 5 minutes on the segment under the caret.
- Consumers keep today's rule: save on blur only when the value is complete, non-empty and changed.

### 7.7 MonthField (replaces native `type="month"` for «بداية الاحتساب»)

```ts
type MonthFieldProps = {
    id?: string;
    value: string /* 'YYYY-MM' */;
    onChange: (month: string) => void;
    invalid?: boolean;
    disabled?: boolean;
};
```

Trigger looks like Input and shows `monthLabel(value)` with `CalendarDays` 16 at inline-end. Opens a Popover (phone: BottomSheet) with a year stepper (`ChevronRight` = «السنة السابقة», `ChevronLeft` = «السنة التالية») and a 3×4 month-name grid (tiles h44, radius 8; selected cyan-700/white; current month amber dot). No salary totals and no fetch.

### 7.8 Select (`components/ui/select.tsx`, Radix)

- Trigger: Input box; `ChevronDown` 16 ink-3 at inline-end, rotates 180° when open.
- Content: `dir="rtl"`, white, radius 12, `e3`, padding 4, min-width = trigger, max-h 320, `position="popper"`, sideOffset 6.
- Item: h36, radius 8, padding-inline 10, 14/20 500. Highlighted surface-hover. Selected cyan-700 600 with `Check` 16 at inline-end. Disabled ink-4.
- Item sub-line slot: `<SelectItemText>` plus a `caption` ink-3 line (used for the employee shift).

### 7.9 Combobox (P1)

```ts
type ComboboxProps<T> = {
    items: T[];
    value: T | null;
    onChange: (item: T) => void;
    getKey: (item: T) => string | number;
    getLabel: (item: T) => string;
    getSubLabel?: (item: T) => string;
    placeholder?: string;
    searchPlaceholder?: string;
    ariaLabel: string;
};
```

Built from Popover + cmdk (desktop) and BottomSheet + cmdk (phone), with the Arabic `filter` from §7.22. Used by the attendance month view employee picker.

### 7.10 SegmentedControl

```ts
type SegmentOption<T extends string> = {
    value: T;
    label: string;
    icon?: LucideIcon;
    iconOnly?: boolean;
    tone?: 'ok' | 'warn' | 'bad' | 'info'; // status variant thumb tone
    shortcut?: string; // shows a tiny keycap when the parent row is focused
    activeClassName?: string; // legacy, ignored by new pages
};
type SegmentedControlProps<T extends string> = {
    options: SegmentOption<T>[];
    value: T | null;
    onChange: (value: T) => void;
    ariaLabel: string;
    variant?: 'neutral' | 'status';
    size?: 'sm' | 'md' | 'lg'; // lg = 48 tall (phone cards, DayDialog); legacy 'default' → md
    fullWidth?: boolean;
    className?: string;
};
```

- Track sunken, radius 10, padding 3, gap 2. Segment sm h28 (pad 10, 13/18, r7), md h34 (pad 14, 14/20, r8), lg h48 (15/22, r10). Unselected ink-2, hover ink-1.
- `neutral`: white thumb, `0 1px 2px rgb(24 35 42/.10), 0 0 0 1px rgb(24 35 42/.04)`, ink-1.
- `status`: thumb bg `-50`, text `-700`, inset ring `-500` at 35% alpha, 6px `-500` dot before the label. With no value there is no thumb.
- **Behavior kept:** `onChange` fires even when the clicked value is already selected (the page decides that re-clicking clears). On pointer devices, hovering the selected status segment shows a 12px `×` (ink-3) at its inline-end.
- A11y: `role="radiogroup"`, segments `role="radio"` + `aria-checked`, roving tabindex. RTL: `ArrowLeft` = next option, `ArrowRight` = previous. Space / Enter = `onChange`.
- Motion: thumb `layoutId` per instance (`useId()`), `springSnappy`; status colors crossfade `dur-fast`.

### 7.11 Tabs (`components/ui/tabs.tsx`)

Radix Tabs, `dir="rtl"`. List h44 with bottom hairline. Tab 15/22 600, gap 24; inactive ink-3, hover ink-2, active ink-1. Indicator 2px cyan-700 bar on the hairline, `layoutId`, `springSnappy`.

### 7.12 StatusPill and CounterBadge

```ts
type PillKind =
    | 'paid'
    | 'partial'
    | 'unpaid'
    | 'not_started'
    | 'recurring'
    | 'once'
    | 'no_receipt'
    | 'present'
    | 'absent'
    | 'excuse'
    | 'leave'
    | 'neutral'
    | 'accent'
    | 'ok'
    | 'warn'
    | 'bad'
    | 'info';
function StatusPill(props: {
    kind: PillKind;
    size?: 'sm' | 'lg';
    children?: ReactNode;
    className?: string;
}): JSX.Element;
function CounterBadge(props: {
    value: number;
    tone?: 'neutral' | 'bad';
}): JSX.Element;
```

Pill: sm h22 / pad 8 / 12/16 600; lg h26 / pad 10 / 13/18 600; radius full; bg `-50`, text `-700`, `-500` dot; no border. Color crossfade `dur-fast`.

| Kind                                      | Tone                   | Leading                                                   | Label (unchanged)                 |
| ----------------------------------------- | ---------------------- | --------------------------------------------------------- | --------------------------------- |
| paid                                      | ok                     | dot                                                       | «مدفوع»                           |
| partial                                   | warn                   | dot                                                       | «مدفوع جزئياً»                     |
| unpaid                                    | bad                    | dot                                                       | «غير مدفوع»                       |
| not_started                               | neutral                | hollow dot (1.5px ring ink-4) + 1px dashed line-2 outline | «لم يبدأ»                         |
| recurring                                 | accent                 | `Repeat` 12                                               | «متكرر»                           |
| once                                      | neutral                | none                                                      | «مرة واحدة»                       |
| no_receipt                                | warn                   | `ImageOff` 12                                             | «بلا إيصال»                        |
| present / absent / excuse / leave         | ok / bad / warn / info | dot                                                       | «حاضر» / «غائب» / «عذر» / «إجازة» |
| neutral / accent / ok / warn / bad / info |                        | none                                                      | children                          |

CounterBadge: h18, min-w 18, pad 5, radius full, 11/14 700 `.num`; neutral sunken/ink-2, bad bad-700/white.

### 7.13 Panel, Inset, InteractiveCard

```ts
function Panel(props: {
    title?: ReactNode;
    meta?: ReactNode;
    actions?: ReactNode;
    footer?: ReactNode;
    padded?: boolean /* default true */;
    className?: string;
    children: ReactNode;
}): JSX.Element;
function Inset(props: { className?: string; children: ReactNode }): JSX.Element;
function InteractiveCard(
    props: {
        href?: string;
        onClick?: () => void;
        chevron?: boolean;
        className?: string;
        children: ReactNode;
    } & { 'aria-label'?: string },
): JSX.Element; // href → Inertia <Link>
```

- Panel: white, 1px line-1, radius 14, `e1`, `overflow: clip` (not hidden, so sticky children work). Header h56, pad 20, `title-3`, meta `label-sm` ink-3, actions at inline-end, hairline below. Body pad 20 (phone 16). Footer surface-2, hairline above, pad 12/20.
- Inset: surface-2, no border/shadow, radius 12, pad 16.
- InteractiveCard: Panel look; hover border line-2 + `e2` + `translateY(-1px)`; active back to e1; focus ring radius 14; optional trailing `ChevronLeft` 18 ink-4 → ink-2.
- The legacy `.panel` class stays (restyled) until cleanup.

### 7.14 StatCard and ProgressBar

```ts
type Tone = 'default' | 'ok' | 'warn' | 'bad';
function StatCard(props: {
    label: string;
    value: number;
    format?: 'money' | 'count' /* default money */;
    icon?: LucideIcon;
    pill?: ReactNode;
    sub?: ReactNode;
    tone?: Tone;
    progress?: {
        value: number;
        max: number;
        tone: 'ok' | 'warn' | 'bad' | 'accent';
        label?: string;
    };
    variant?: 'default' | 'hero';
    animated?: boolean /* default true */;
    className?: string;
    children?: ReactNode;
}): JSX.Element;
function StatGrid(props: {
    children: ReactNode;
    className?: string;
}): JSX.Element; // auto-fit minmax(200px,1fr) gap 16; phone 2 cols gap 10
function ProgressBar(props: {
    value: number;
    max: number;
    tone: 'ok' | 'warn' | 'bad' | 'accent';
    track?: 'sunken' | 'amber';
    label?: string /* aria-label */;
}): JSX.Element;
```

- StatCard: Panel radius 14, pad 16/18 (phone 14), min-h 112 (phone 100). Top row: label `label-sm` ink-3, optional icon 16 ink-3 at inline-start, optional pill at inline-end. Value `money size="kpi"` (or `Count` at the same scale). Sub-line `caption` ink-3. Optional progress (h6, radius full, starts at inline-start).
- `tone` colors the value with the `-700`. Pages apply it only when the value is non-zero (remaining > 0 → warn, deduction > 0 → bad), mirroring today.
- `hero`: spans full row on phone and 2 columns on desktop, pad 24, label `label` ink-2, value `money size="hero"`, `children` slot below the value (progress + supporting figures), watermark `logo-mark.svg` 160px at 6% opacity, `inset-inline-end: -24px; bottom: -32px`, `aria-hidden`.
- ProgressBar: `role="progressbar"` with `aria-valuenow/min/max`. Animates `inline-size` 0→value over `dur-bar`.
- `StatTile` (legacy) is kept until cleanup.

### 7.15 DataTable

```ts
type ColumnMeta = {
    align?: 'start' | 'end';
    sticky?: boolean;
    width?: number | string;
    headerClassName?: string;
    cellClassName?: string;
};
type DataTableProps<T> = {
    data: T[];
    columns: ColumnDef<typeof features, T>[]; // tanstack v9 defs; header/cell/footer renderers
    getRowId: (row: T) => string;
    minWidth: number; // salaries 1080, attendance daily 880, invoices 760
    density?: 'comfortable' | 'compact'; // row min-h 60 / 52
    rowTone?: (row: T) => 'ok' | 'warn' | 'bad' | 'info' | null; // 3px status rail
    onRowActivate?: (row: T) => void; // click (outside buttons/inputs) + Enter / Space
    rowLabel?: (row: T) => string; // aria-label for activatable rows
    sortStorageKey?: string; // per-viewer sort in localStorage (try/catch)
    animateKey?: string; // stagger replays only when this changes (pass `month`)
    loading?: boolean; // 6 skeleton rows
    empty?: ReactNode; // replaces the table
    rowNavigation?: boolean; // P1 roving row focus (↑ ↓ Home End)
    onRowKeyDown?: (row: T, event: KeyboardEvent) => void; // P1 page row shortcuts
    className?: string;
};
```

FOUNDATION also exports `createColumnHelper` bound to the shared `features` object, so pages write typed columns.

Scroll container:

- `overflow: auto; overscroll-behavior-inline: contain;` inside a Panel. On ≥ 1024 also `max-block-size: calc(100dvh - var(--table-top, 240px))` so header and footer stick inside the panel. Below 1024 it scrolls inline only and header stickiness is off.
- Edge fades: `data-overflow-start` / `data-overflow-end` and a 24px `surface → transparent` gradient on the hidden side. **RTL:** `scrollLeft` is 0 at the start and negative toward the end: `atStart = Math.abs(scrollLeft) < 2`, `atEnd = Math.abs(scrollLeft) + clientWidth >= scrollWidth - 2`. Comment this.

Header: h40, white, sticky `top: 0; z-index: 2`, bottom 1px line-2, gains `e2` when `data-scrolled-y`. `th` style, `nowrap`. Numeric headers align end. Sortable headers are buttons: `ArrowUpDown` 14 ink-4 at rest, `ArrowUp` / `ArrowDown` 14 cyan-700 when active, active label ink-1, `aria-sort` on `th`. Default order is the server order.

Body: cell pad-inline 12; first cell pad-inline-start 20; last cell pad-inline-end 20. 1px line-1 separators. No zebra. Hover and `:focus-within` surface-hover. Status rail: 3px at the row's inline-start edge on the first cell (`box-shadow: inset -3px 0 0 var(--tone-500)` in RTL; comment the physical sign). Empty numeric value: `—` ink-3, end-aligned.

Sticky first column: `position: sticky; inset-inline-start: 0; z-index: 1; background: inherit`. When scrolled sideways add `edge-start` and a 1px line-2 at its inline-end. Corner cell z 3.

Footer: rendered when any column defines `footer`. `tfoot` sticky `bottom: 0; z-index: 2`, surface-2, top 1px line-2, h56. Label cell «الإجمالي» Readex 15/600.

Motion: §5.2 stagger, keyed by `animateKey`.

### 7.16 ResponsiveDialog, BottomSheet, SideSheet, ConfirmDialog

```ts
type ResponsiveDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl'; // 440 / 560 / 760 / 920
    desktop?: 'dialog' | 'side-sheet'; // side-sheet only applies ≥ 1024 (else dialog)
    headerIcon?: ReactNode; // e.g. Confirm warning circle
    footer?: ReactNode;
    onSubmitShortcut?: () => void; // Ctrl/⌘ + Enter from anywhere in the dialog
    onSecondarySubmitShortcut?: () => void; // Ctrl/⌘ + Shift + Enter (save-and-next variants)
    initialFocus?: RefObject<HTMLElement | null>;
    layer?: 'base' | 'nested'; // nested = z 62
    bodyClassName?: string;
    children: ReactNode;
};
```

- **≥ 640 Dialog:** scrim + blur; content centered, white, radius 18, `e4`, `max-block-size: calc(100dvh - 48px)`, flex column, `overflow: clip`. Header pad 20/24, `title-2`, description 13.5/20 ink-3, close IconButton md ghost at inline-end (`label="إغلاق"`, offset −6). Body pad 24, scrolls. Footer pad 16/24, hairline above, flex gap 8, primary at inline-start. `dir="rtl"`. Radix focus trap, Esc, focus restore. When no description is given, set `aria-describedby={undefined}` as today.
- **< 640 BottomSheet (vaul):** `Drawer.Root direction="bottom"` with `repositionInputs`; content `dir="rtl"`, radius 22 top corners, white, `e4`, `max-block-size: 92dvh`. Handle 36×4 ink-4 at 50%, margin-top 8. Header pad 12/16/8, title `title-2` at inline-start, close at inline-end. Body pad 16, scrolls. Footer sticky, hairline above, padding `12px 16px calc(12px + env(safe-area-inset-bottom))`; buttons full width, stacked, primary first (h48), destructive last with 8px gap. Drag, scrim tap and Esc close it.
- **Side sheet (≥ 1024, `desktop="side-sheet"`):** Radix Dialog + motion; anchored at inline-end (the **left** edge), inline-size 560, full height minus 12px margin, radius 18, `e4`; enters `x: "-100%" → 0` with `springSheet`.
- `AppDialog` (legacy) stays as a thin wrapper: `wide` → `size="lg"`, otherwise `md`.
- **Hidden-while-nested:** a dialog passes `open={open && !qrOpen}` exactly as today; ResponsiveDialog must not reset its children's state when hidden this way (keep the parent component mounted; only the Radix/vaul root toggles).

```ts
function ConfirmDialog(props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string; // default «تأكيد الحذف»
    message: string;
    confirmLabel?: string /* default «حذف» */;
    processing?: boolean; // confirm shows «جارٍ الحذف…»
    onConfirm: () => void;
}): JSX.Element;
```

Size sm, layer nested. Header icon: 44px circle bad-50 with `AlertTriangle` 22 bad-700. Footer: `danger-solid` confirm at inline-start, secondary «إلغاء». **Initial focus on «إلغاء»** so Enter never deletes by accident. Phone: short bottom sheet.

### 7.17 Popover, Tooltip, DropdownMenu

- Popover: white, radius 12 (14 for MonthPicker), `e3`, pad 16, sideOffset 8, collisionPadding 12, no arrow, `dir="rtl"`.
- Tooltip: inverse bg, white 12.5/18 500, pad 6/10, radius 8, max-w 240, no arrow, delay 400ms, skip 150ms, side top, offset 6. Pointer devices only. One `Tooltip.Provider` at the root.
- DropdownMenu: Popover surface, items styled like Select items with a leading 16 icon; destructive items bad-700. `dir="rtl"`. Items can be `asChild` anchors (for the PDF download).

### 7.18 Toaster (`components/ui/sonner.tsx`)

- Desktop: `<Toaster dir="rtl" position="bottom-left" offset={24} />` (bottom-left is away from the sidebar on the right). Phone (< 640): `position="top-center"` with offset 64 so it clears the top bar and never covers sheet footers or the tab bar.
- Style: inverse bg, white 14/20 500, radius 12, pad 12/16, `e3`, max-w 380. Icon 18 at inline-start: success `CheckCircle2` ok-500; error `AlertCircle` bad-500; plain toasts no icon.
- Duration 4000ms; errors 6000ms. Polite announcements (sonner default).
- **Texts are byte-for-byte unchanged.** Page code uses `toast.success(text)` for confirmations and `toast.error(text)` for every «لم يتم الحفظ: …» / «فشل رفع الصورة…» toast, with the exact same strings as today.

### 7.19 EmptyState and Skeleton

```ts
function EmptyState(props: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    compact?: boolean;
    bare?: boolean /* no panel wrapper */;
}): JSX.Element;
function Skeleton(props: {
    className?: string;
    shape?: 'text' | 'control' | 'card';
}): JSX.Element;
```

- EmptyState inside a Panel, pad 56/24, centered: icon tile 56×56 radius 16 surface-2 + line-1 with icon 24 ink-3 and an 8px cyan-300 dot at the top inline-end corner; 16 gap; `title-2`; 6 gap; `body-sm` ink-3 max 44ch; 20 gap; action. `compact`: pad 32, no icon tile, `title-3`. Icons: salaries `Users`, purchases `ReceiptText`, invoices `FileText`, attendance `CalendarDays`.
- Skeleton: sunken, radius 6 / 10 / 14, shimmer right→left 1.4s; `aria-hidden`; containers set `aria-busy="true"`. Heights: caption 12, body 14, title 22, kpi 28, button 40.

### 7.20 Money, Count, SerialChip, Avatar, Kbd, SaveIndicator, ReceiptViewer

```ts
type MoneySize = 'hero' | 'dialog' | 'kpi' | 'card' | 'footer' | 'cell-strong' | 'cell' | 'inline' | 'tile' | 'input';
function Money(props: {
  value: number; size?: MoneySize /* default 'cell' */;
  tone?: 'default' | 'ok' | 'warn' | 'bad' | 'muted' | 'inherit';
  sign?: '+' | '−'; hideCurrency?: boolean; animated?: boolean; className?: string;
}): JSX.Element;
function Count(props: { value: number; size?: MoneySize; tone?: ...; animated?: boolean; className?: string }): JSX.Element; // number only, no currency
function SerialChip(props: { children: string }): JSX.Element;   // `serial` style on sunken, radius 6, pad 2/6
function Avatar(props: { id: number; name: string; size?: 24 | 32 | 40 }): JSX.Element;
function Kbd(props: { children: ReactNode }): JSX.Element;
function ModKey(): JSX.Element;                                  // ⌘ on Apple, Ctrl elsewhere
function SaveIndicator(props: { state: 'idle' | 'pending' | 'saved' | 'error' }): JSX.Element;
function ReceiptViewer(props: { open: boolean; onOpenChange: (o: boolean) => void; items: { url: string; caption: string }[]; index: number; onIndexChange: (i: number) => void; onOpenInvoice?: (i: number) => void }): JSX.Element;
```

- **Money** structure: `<span class="money">` (inline-flex, baseline, gap 4, wrap allowed) → `<span class="num">` (or NumberFlow inside `<span dir="ltr" class="num">`) → `<span class="cur">د.ل</span>`. Number `nowrap`. Legacy sizes map: `tile→kpi`, `summary→kpi`, `counter→kpi`, `card→card`, `breakdown→card`, `total→dialog`, `cell→cell-strong`, `footer→footer`, `month→cell-strong`, `base→cell`. NumberFlow: `locales="en-US"`, `format={{ maximumFractionDigits: 2 }}`, `willChange`, `transformTiming` and `spinTiming` `{ duration: 650, easing: 'cubic-bezier(0.22,1,0.36,1)' }`, sign as `prefix`.
- **Avatar**: one Arabic letter only (the first letter of the first word; two letters would join), Readex 600 at `size × 0.44`, radius full. Tint by `id % 6`: cyan-50/cyan-700, amber-50/amber-700, ok-50/ok-700, info-50/info-700, violet-50/violet-700, neutral-50/ink-2.
- **Kbd**: h20, min-w 20, pad 5, radius 5, white, 1px line-2, `inset 0 -1px 0 var(--line-2)`, 11.5/16 600 ink-2, `dir="ltr"`, hidden under `@media (hover: none)`.
- **SaveIndicator**: `pending` 6px cyan-600 dot pulsing (opacity only); `saved` `Check` 14 ok-700 that fades out after 1.2s; `error` nothing (the value reverts and the toast fires). `aria-hidden`; the toast carries the message.
- **ReceiptViewer** (P1, view only): full-viewport dialog on `#0E1418` at 92% opacity. Image `object-fit: contain`. Caption bar: SerialChip · title · Money inline (white text). Buttons: «فتح الصورة» (anchor `target="_blank"` to the URL, as today), «فتح الفاتورة» (when `onOpenInvoice`), close «إغلاق». Prev / next IconButtons (`ChevronRight` = previous, `ChevronLeft` = next) and keyboard `ArrowRight` = previous, `ArrowLeft` = next. Pinch / wheel zoom is P2 (CSS `transform: scale` with a 1–3 clamp).

### 7.21 PageHeader (`layouts/PageHeader.tsx`, also re-exported from `layouts/AppShell`)

```ts
type HeaderAction = {
    key: string;
    label: string;
    icon?: LucideIcon;
    onSelect?: () => void;
    href?: string;
    download?: boolean; // PDF export is an <a href> download
    disabled?: boolean;
    variant?: 'secondary' | 'ghost';
};
function PageHeader(props: {
    title: ReactNode;
    description?: ReactNode;
    breadcrumb?: { label: string; href: string };
    secondaryActions?: HeaderAction[];
    primaryAction?: ReactNode; // a <Button variant="primary">
    actions?: ReactNode; // legacy free-form slot
    toolbar?: ReactNode; // row under the header (view switch, filters)
}): JSX.Element;
```

- Breadcrumb: `ArrowRight` 14 + label, `label-sm` ink-3, hover cyan-700, margin-bottom 6, Inertia `<Link>`.
- Title `title-1`. Description `body-sm` ink-3, max 64ch, margin-top 6.
- Actions aligned to inline-end and the bottom of the title block, gap 8: secondary first, **primary last** (far inline-end).
- Phone: actions wrap under the description; the primary takes `flex: 1`; all `secondaryActions` collapse into a `⋯` IconButton («المزيد») opening a DropdownMenu. Disabled items stay disabled in the menu.
- Toolbar row below, then the page content.

### 7.22 Command palette

Files: `components/command/CommandPalette.tsx`, `components/command/CommandProvider.tsx`, `hooks/use-commands.ts`.

```ts
type Command = {
    id: string;
    label: string;
    group: 'actions' | 'records';
    recordsLabel?: string; // group heading for records, e.g. «الموظفون», «الفواتير», «المجموعات»
    keywords?: string[]; // extra match text (serial, code, price)
    icon?: LucideIcon;
    meta?: ReactNode;
    shortcut?: string;
    disabled?: boolean;
    onSelect: () => void;
};
function useCommands(commands: Command[]): void; // registers while the page is mounted
function useCommandPalette(): {
    open: () => void;
    close: () => void;
    isOpen: boolean;
};
```

- Opens with ⌘K / Ctrl K anywhere; `/` when focus is not in a field; the sidebar «بحث سريع» button; the phone account sheet «بحث سريع» row. Phone renders as a full-height BottomSheet with the input on top.
- Shell: Dialog 600 wide, top 14vh, radius 18, `e4`, layer 70. Input row h56: `Search` 20 ink-3 at inline-start, input 16/24, placeholder «ابحث عن صفحة أو موظف أو فاتورة أو إجراء…», Esc Kbd at inline-end; hairline below.
- List max-h 400, pad 6. Group heading `th` ink-3, pad 8/10. Item h44, radius 10, pad 10, gap 10: icon 18 ink-3, label 14/20 500, trailing meta (serial, Money inline or Kbd) ink-3. `[data-selected=true]`: bg selected, icon cyan-700.
- Footer h36 surface-2, 12/16 ink-3: «↑↓ للتنقل · ↵ للفتح · Esc للإغلاق». Empty: «لا توجد نتائج».
- Groups, in order:
    1. «التنقل»: «الرئيسية», «الرواتب», «الحضور», «المشتريات» (nav labels; each keeps `?month`).
    2. «الشهر»: «الشهر السابق», «الشهر التالي», «الشهر الحالي». Typing a month name (for example «مارس»), a name plus year («مارس 2026») or `2026-03` lists «الانتقال إلى {monthLabel}» for that month (name alone: this year and the previous year). Selecting calls `setMonth`.
    3. «إجراءات»: page-registered `actions` commands.
    4. Page-registered `records`, under their `recordsLabel`.
    5. «الحساب»: «تسجيل الخروج» (the same Inertia POST to `logout()`).
- Filter: normalize both sides with `normalizeArabic` (`أ إ آ → ا`, `ة → ه`, `ى → ي`, strip tashkeel `ً-ْ` and tatweel `ـ`, Arabic-Indic digits → Western), then case-insensitive substring; keywords included.
- Cross-page search is out of scope (§12.6).

### 7.23 Global keyboard (`hooks/use-shortcut.ts`)

```ts
function useShortcut(
    combo: string, // e.g. 'Mod+KeyK', 'Slash', 'Shift+ArrowRight', 'KeyN', 'Digit1'
    handler: (event: KeyboardEvent) => void,
    options?: {
        enabled?: boolean;
        allowInFields?: boolean;
        allowInDialogs?: boolean;
    },
): void;
```

- Match `KeyboardEvent.code` (physical keys) so shortcuts work with an Arabic OS layout.
- Ignored while focus is in `input`, `textarea`, `select`, `[contenteditable]`, while `event.isComposing`, or while a dialog / sheet / palette is open, unless the option allows it. Esc and Ctrl/⌘ + Enter are handled by dialogs themselves.

| Keys                                   | Action                                                             | Owner      | Priority |
| -------------------------------------- | ------------------------------------------------------------------ | ---------- | -------- |
| `Mod+K`, `/`                           | Command palette                                                    | FOUNDATION | P0       |
| `Shift+ArrowRight` / `Shift+ArrowLeft` | Previous / next month (RTL: right is earlier)                      | FOUNDATION | P1       |
| `KeyM`                                 | Open MonthPicker                                                   | FOUNDATION | P1       |
| `KeyN`                                 | New item in context (موظف / مجموعة / فاتورة)                       | Pages      | P1       |
| `?`                                    | Shortcut sheet «اختصارات لوحة المفاتيح» listing global + page keys | FOUNDATION | P2       |
| `g` then `h` / `s` / `a` / `p`         | Go to Home / Salaries / Attendance / Purchases                     | FOUNDATION | P2       |

### 7.24 MonthPicker (`components/MonthPicker.tsx`)

```ts
function MonthPicker(props: {
    month: string;
    currentMonth: string;
    onSelect: (month: string) => void;
    trigger?: ReactElement; // custom trigger (Period card, phone month pill); default today's look
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: 'left' | 'bottom';
    align?: 'start' | 'center';
}): JSX.Element;
function useYearTiles(year: number): {
    tiles: MonthTile[] | null;
    error: boolean;
    loading: boolean;
}; // hooks/use-year-tiles.ts, GET months.year(year)
```

- Desktop popover 400 wide (max `100vw - 24px`), radius 14. Header: year `title-2` `.num`, «السنة السابقة» (`ChevronRight`) and «السنة التالية» (`ChevronLeft`) IconButtons.
- 3×4 grid, gap 8. Tile min-h 80, radius 10, 1px line-1, pad 10/12, start-aligned: month name 14/600; `money size="tile"` total (or «—» when `employees === 0`); state line 12/600 in the state's 700 tone: «مدفوع» (ok), «قادم» (ink-3), «متبقي {remaining}» (warn), «غير مدفوع» (bad), «—».
- Hover border line-2, bg surface-hover. **Selected:** bg cyan-700, white text, state line at 90% white. **Current month** (when not selected): amber-50 bg and a 6px amber-300 dot at the top inline-end corner.
- Loading: skeleton bar 56×16 in each tile. Footer hint `caption` ink-3: «المبلغ = إجمالي الرواتب المستحقة للشهر», or «تعذر تحميل المبالغ» on error.
- Keyboard (P1): arrows move across tiles (RTL-aware), Enter selects and closes, PageUp / PageDown change year, Esc closes.
- Phone (< 640): BottomSheet with the same content, tiles min-h 72, 3 columns.
- **Behavior kept:** on open the year resets to the selected month's year and the cache is cleared (refetch every open); one GET per year shown; choosing a tile closes the picker and calls `onSelect`; trigger `aria-label` «اختيار الشهر».

### 7.25 ReceiptPicker (`components/ReceiptPicker.tsx`)

```ts
function ReceiptPicker(props: {
    receipt: ReceiptRef | null;
    onChange: (receipt: ReceiptRef | null) => void;
    onQr: () => void;
    emphasis?: boolean; // amber dashed border (auto invoices missing a receipt)
    layout?: 'column' | 'strip'; // strip = phone compact (72px preview + buttons)
    onPreview?: () => void; // opens ReceiptViewer; default: anchor to URL «فتح الصورة»
}): JSX.Element;
```

- Dropzone: radius 14, 1.5px dashed line-field, surface-2, pad 24, centered.
- **With receipt:** 4:3 preview radius 12; clicking it calls `onPreview` (or opens the URL, title «فتح الصورة», alt «صورة الإيصال»).
- **Without:** `ImageOff` 24 ink-3, «لا توجد صورة», hint (P1) «اسحب الصورة هنا أو الصقها».
- Actions: «رفع من الجهاز» (`Upload`, file input `accept="image/*"`), «التقاط بالهاتف (QR)» (`QrCode`, calls `onQr`), «إزالة» (danger sm, only with a receipt, sets `null`; takes effect on save).
- P1 inputs: drag-and-drop an image file onto the zone; paste an image (`paste` listener on the closest dialog content). Both use the same upload path. Drag-over: solid cyan-600 border, cyan-50 bg, text «أفلت الصورة هنا».
- **Upload path kept:** `compressImage` → POST `receipts.store` as FormData `file` → `{id, url}` → `onChange`.
- Uploading: buttons replaced by «جارٍ الرفع…» plus an indeterminate 3px bar in the preview frame (blurred local preview behind it for file/paste uploads).
- Error: `toast.error` with the exact existing text (`فشل رفع الصورة` or `فشل رفع الصورة: {message}`); the zone shakes once.
- Preview scales 0.96→1 with a single cyan halo pulse when a new receipt arrives.

### 7.26 QrUploadDialog (`components/QrUploadDialog.tsx`)

Props unchanged: `{ open; onClose; onReceived(receipt) }`. Size sm (phone: BottomSheet), layer nested, title «التقاط الإيصال بالهاتف».

- QR at 208px in a white tile, 1px line-1, radius 14, pad 12. Loading: skeleton square.
- Countdown beside the QR (below it on phone): a 64px SVG ring (4px stroke cyan-700 on sunken) depleting over 10:00 with `mm:ss` 22/700 `.num` centered. Text turns warn-700 under 1:00 and bad-700 at 0.
- Instructions (unchanged): «امسح الرمز بكاميرا الهاتف، صوّر الإيصال واضغط «إرسال». ستظهر الصورة هنا تلقائياً. لا يحتاج الهاتف إلى تسجيل دخول.»
- Waiting: pulsing 8px ok-500 dot (opacity only) + «بانتظار الصورة من الهاتف…». Expired: QR at 20% opacity + 3px blur, `StatusPill kind="bad"` «انتهت صلاحية الرمز» and primary «إنشاء رمز جديد». Error: message in bad-700.
- Received: toast «وصلت صورة الإيصال من الهاتف» (success). The QR tile may morph to a green check in ≤ 300ms; `onReceived` is never delayed more than 400ms.
- **Behavior kept exactly:** open creates a token (POST `upload-tokens.store`); countdown ticks every 1s from `expires_in`; poll GET `upload-tokens.show` every 2s while valid, ignoring temporary errors; accept once (`receivedRef`); closing deletes the token (DELETE `upload-tokens.destroy`) unless received; «إنشاء رمز جديد» creates a fresh token.

### 7.27 lib and hooks (FOUNDATION)

| File                              | Exports                                                                                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/money.ts`                    | keep `formatNumber`, `parseMoney`, `sumMoney`, `moneyInputValue`; add `MINUS = '−'`                                                                                                |
| `lib/arabic.ts`                   | `toWesternDigits(s)`, `normalizeArabic(s)`, `normalizeMoneyInput(s)`, `normalizeTimeInput(s)`                                                                                      |
| `lib/months.ts`                   | keep all; add `WEEKDAY_INITIALS` (Saturday-first: «س» «ح» «ن» «ث» «ر» «خ» «ج»), `parseMonthQuery(text, year): string[]` for the palette, `shortMonthName(month)` (first 3 letters) |
| `lib/storage.ts`                  | `readStored<T>(key, fallback, isValid)`, `writeStored(key, value)`; all wrapped in try/catch                                                                                       |
| `lib/motion.ts`                   | durations, easings, `springSnappy`, `springSheet`, `staggerDelay(i)` = `min(i, 12) * 0.018`                                                                                        |
| `lib/platform.ts`                 | `isApple()`                                                                                                                                                                        |
| `hooks/use-month.ts`              | keep `month`, `currentMonth`, `today`, `setMonth` (still drops `day`, `preserveScroll`); add `stepMonth(delta)`, `goToCurrentMonth()`                                              |
| `hooks/use-media.ts`              | `useIsPhone()` (< 640), `useIsDesktop()` (≥ 1024), `useCanHover()`                                                                                                                 |
| `hooks/use-stored-state.ts`       | `useStoredState<T>(key, initial, isValid)`                                                                                                                                         |
| `hooks/use-shortcut.ts`           | §7.23                                                                                                                                                                              |
| `hooks/use-commands.ts`           | §7.22                                                                                                                                                                              |
| `hooks/use-year-tiles.ts`         | §7.24                                                                                                                                                                              |
| `hooks/use-navigation-pending.ts` | `true` 150ms after a non-partial visit starts, until it finishes                                                                                                                   |
| `hooks/use-roving-rows.ts`        | P1 roving focus helper for lists and card grids: `{ getRowProps(index), focusedIndex }`                                                                                            |

`types/**`: add nothing to server prop types. Add UI-only types (`Tone`, `PillKind`) next to the components that use them.

---

## 8. App shell (`layouts/AppShell.tsx`)

Pages keep wrapping themselves in `<AppShell>` as today (no persistent layout change). `app.tsx` adds the root providers: `Direction.Provider dir="rtl"`, `Tooltip.Provider`, `LazyMotion` + `MotionConfig`, `CommandProvider`. Since `createInertiaApp` resolves pages itself, providers that must wrap every page live inside `AppShell` (and inside the Login / Upload page roots through a small `StandaloneShell` wrapper exported from `layouts/StandaloneShell.tsx`). Inertia `progress: { color: '#0B7DA6', delay: 150 }`.

### 8.1 Shared shell behavior

- **Flash toasts (kept):** `router.on('flash')` → `flash.success` shown as is (`toast.success`), `flash.error` as «لم يتم الحفظ: {error}» (`toast.error`).
- **Network failure (P1):** on Inertia `networkError`, `toast.error('تعذر الاتصال بالخادم')` (the string already used by `lib/http.ts`).
- **Month change in flight:** while `useNavigationPending()` is true, `main` drops to 60% opacity (`dur-base`) and gets `aria-busy="true"`. No skeleton swap. When props land, NumberFlow rolls the numbers and content fades back in 160ms.
- `<Head>` titles unchanged. `html, body { overflow-x: clip }`.

### 8.2 Desktop (≥ 1024): sidebar + framed content sheet

```
┌──────────────────────────────────────────────────────────────┬─────────────────┐
│  (canvas)  ┌───────────── content sheet (white) ───────────┐  │ [logo] الرعاية │
│            │ breadcrumb                                    │  │  نظام المحاسبة │
│            │ Title                    [secondary][primary] │  │ ┌ Period card ┐│
│            │ description                                   │  │ │ نوفمبر 2026 ‹ ›││
│            │ ── toolbar ─────────────────────────────────  │  │ └─────────────┘│
│            │ ── KPI strip ───────────────────────────────  │  │ ▍الرئيسية       │
│            │ ── Panel / DataTable ───────────────────────  │  │  الرواتب        │
│            └───────────────────────────────────────────────┘  │  الحضور         │
│                                                               │  المشتريات      │
│                                                               │ [بحث سريع ⌘K]   │
│                                                               │ (م) user  ⎋     │
└──────────────────────────────────────────────────────────────┴─────────────────┘
```

**Sidebar** (inline-start = right): inline-size 260, `position: sticky; top: 0; block-size: 100dvh`, canvas bg, no border, pad 20/16, vertical flex gap 20, z 30.

- **Brand** (Inertia link to Home with `?month`): `logo-mark.svg` 32px tall, «الرعاية الذكية» `title-3`, «نظام المحاسبة» 12/16 500 amber-700.
- **Period card**: Panel radius 14, pad 14/16, `e1`. Eyebrow «الشهر» `label-sm` ink-3. Month name `title-2` + year 15/600 `.num` ink-3 as one button that opens MonthPicker (side `left`, align `start`; `aria-label` «اختيار الشهر»). Prev / next IconButtons sm at inline-end: «الشهر السابق» (`ChevronRight`) and «الشهر التالي» (`ChevronLeft`). When `month !== currentMonth`: ghost sm «العودة للشهر الحالي» with a 6px amber-300 dot.
- **Nav** (`<nav aria-label="التنقل الرئيسي">`, gap 2): items h40, radius 10, pad 12, gap 10, icon 18 (`LayoutGrid`, `Wallet`, `CalendarCheck2`, `ReceiptText`) + label 15/22 500 ink-2: «الرئيسية», «الرواتب», «الحضور», «المشتريات». Each keeps `?month`. Hover `rgb(24 35 42/.04)`, ink-1. **Active:** white bg, `e1`, ink-1 600, icon cyan-700, a 3×18 cyan-300 bar at the item's inline-start edge (offset −16px into the gutter) moving with `layoutId="nav-indicator"`; `aria-current="page"`. Matching rules stay: `/` exact, `/salaries*`, `/attendance*`, `/purchases*`.
- **Bottom block** (`margin-block-start: auto`): secondary sm full-width «بحث سريع» with `Search` 16 and a Kbd (`ModKey` + K) at inline-end; user row: Avatar 32, name 14/600 one-line ellipsis, logout IconButton sm ghost (`LogOut`, label «تسجيل الخروج») as the existing `<Link href={logout()} as="button">`.

**Content sheet:** `margin: 12px; margin-inline-start: 0`, white, 1px line-1, radius 18, `e1`, `min-block-size: calc(100dvh - 24px)`, inner pad 40 (32 at 1024–1279), inner max-width 1240 centered. **The document scrolls, not the sheet**, so sticky table headers and the sticky sidebar both work.

### 8.3 Phone and tablet (< 1024)

```
┌──────────────────────────────────────┐
│ [logo]   ‹  نوفمبر 2026 ▾  ›      (م) │  top bar 56, glass
├──────────────────────────────────────┤
│ Title / description                   │
│ [primary ───────────] [⋯]             │
│ KPI 2×2                               │
│ cards / panel                         │
├──────────────────────────────────────┤
│  الرئيسية  الرواتب  الحضور  المشتريات   │  tab bar 64 + safe area
└──────────────────────────────────────┘
```

- **Top bar:** h56, sticky top, z 30, `--canvas-glass` + blur; hairline line-1 appears only after 4px of scroll (`data-scrolled`). Pad 12. Inline-start: logo mark 26px linking Home. Center: prev IconButton 36 («الشهر السابق»), month pill (h36, radius full, white, 1px line-1, pad 14, 15/600, «▾» ink-3; opens MonthPicker as a BottomSheet below 640, popover at 640–1023), next IconButton 36 («الشهر التالي»). Inline-end: Avatar 32 button (`aria-label` = user name) opening the **account sheet** (BottomSheet): user name `title-3`, a row «بحث سريع» (opens the palette), a row «العودة للشهر الحالي» when not on the current month, and «تسجيل الخروج» (danger ghost, the same logout link).
- **Bottom tab bar:** fixed bottom, z 30, white, hairline above, block-size `64px + env(safe-area-inset-bottom)`; nav `aria-label` «التنقل الرئيسي». Four equal tabs, icon 22 over `tab-label`, hit area ≥ 64×56. Inactive icon ink-3, label ink-2. **Active:** 56×30 cyan-100 pill behind the icon (`layoutId="nav-indicator"`), icon cyan-700, label ink-1 600, `aria-current="page"`.
- **Content:** pad 16, `padding-block-end: calc(80px + env(safe-area-inset-bottom))`. No sheet frame; panels sit on the canvas.
- No horizontal page scroll at 400 and 360.

### 8.4 Standalone shells (Login, Upload)

`StandaloneShell`: canvas bg, providers, Toaster, no nav. Login and Upload layouts are in §9.1 and §9.6.

---

## 9. Screens

Each screen lists layout, states, interactions and phone behavior. "Kept" lists behaviors that must not change.

### 9.1 Login (`pages/Login.tsx`) — HOME + LOGIN

- Canvas page, centered column 400 wide (phone: full width, 16 gutters). Faint `logo-mark.svg` watermark, 360px, 5% opacity, bottom inline-end corner of the viewport, `aria-hidden`.
- Above the card: `logo-full.png` 220px (alt «الرعاية الذكية»), then the existing heading «نظام المحاسبة» (`title-1`) and the existing amber line under it (amber-700). Keep today's text nodes exactly.
- Card: Panel pad 28.
    1. Error banner (`role="alert"`), bad-50 bg, bad-700 text, `AlertCircle` 16, radius 10: `errors.email ?? errors.password` (server strings unchanged). Slides down 120ms (fade only when reduced).
    2. «البريد الإلكتروني»: Input, `dir="ltr"`, `autoFocus`, `autoComplete="username"`.
    3. «كلمة المرور»: Input `dir="ltr"`, `autoComplete="current-password"`. P1: a show / hide IconButton inside the field at inline-end with labels «إظهار» / «إخفاء». P1: caps-lock hint under the field (`getModifierState('CapsLock')`): «مفتاح الأحرف الكبيرة مفعّل» in warn-700 `caption`.
    4. Primary lg full-width «تسجيل الدخول»; while processing «جارٍ الدخول…» with `loading`.
    5. P1 muted `caption` under the button: «ستبقى مسجلاً على هذا الجهاز» (the server always remembers the session).
- **Kept:** `<Form {...store.form()} resetOnError={['password']}>`, page title «تسجيل الدخول», no registration. On error the password clears and receives focus. The rate-limit message is shown as the server sends it; the button is **not** disabled by a client countdown.
- Motion: card fades and rises 8px on load.

### 9.2 Home (`pages/Home.tsx`) — HOME + LOGIN

Props unchanged: `salaries {employees,total,paid,remaining,unpaid,partial}`, `purchases {groups,total,count,recurring,once,missing_receipts,with_receipts}`, `attendance {absent_days,excused_days,deduction}`.

**Header:** title `monthLabel(month)` in `display`; description «ملخص الرواتب والمشتريات لهذا الشهر». No actions.

**First run (P1):** when `salaries.employees === 0 && purchases.groups === 0`, an Inset banner above the grid: «ابدأ بإضافة الموظفين من صفحة الرواتب، ثم أنشئ مجموعة مشتريات.» with secondary buttons «الرواتب» and «المشتريات» (links keep `?month`). The cards still render with zeros.

**Desktop grid (12 columns, gap 16):**

- **Salaries hero** (8 cols): `StatCard variant="hero"` as an InteractiveCard linking to Salaries. Label «الرواتب» with a pill «{employees} موظف». Hero value = المستحق (`salaries.total`) with the existing label «المستحق». Children: ProgressBar `paid/total` (ok, amber track) with P1 label `caption` «نسبة المدفوع {x}%» (integer percent; hidden when total is 0); a row of three `money inline` figures with existing labels «المستحق», «المدفوع», «المتبقي» (المتبقي warn when > 0). Footer `caption` ink-3 with the existing text «{unpaid} غير مدفوع · {partial} جزئي · المتبقي يُرحّل للشهر القادم». P1: when `employees > 0 && remaining === 0`, an ok pill «تم دفع جميع رواتب الشهر» with a `Check` that draws its stroke over 400ms the first time (static when reduced).
- **Year strip** (4 cols, P1): Panel titled «رواتب {year}» (year of the selected month). 12 bars from `useYearTiles(year)`, plain SVG height 120. Bar width = 1/12 minus 6px gap, top corners radius 6. Paid portion cyan-700, remaining portion amber-100, stacked bottom-up, height scaled to the year's max `total`; `state: 'none' | 'upcoming'` shows a 2px line-2 outline stub. Selected month outlined 2px cyan-600; current month an amber-300 dot under its label. Labels `shortMonthName` 11.5 ink-3. Each bar is a button: tooltip «{monthLabel} · {total} د.ل · {state text}» using the MonthPicker wording; click / Enter calls `setMonth`. Loading: 12 skeleton bars. Error: muted «تعذر تحميل المبالغ». A11y: the SVG group has `role="list"`; each bar is a labelled button.
- **Purchases card** (6 cols): InteractiveCard linking to Purchases. Title «المشتريات», pill «{groups} مجموعة». Three tiles (existing labels): «الإجمالي» (Money kpi), «الفواتير» (Count), «بلا إيصال» (Count, warn when > 0). ProgressBar `with_receipts / count` (accent) — hidden when count is 0. Footer «{recurring} متكررة · {once} لمرة واحدة».
- **Attendance card** (6 cols): InteractiveCard linking to Attendance. Title «الحضور والانصراف», pill «{monthName}». Tiles «أيام غياب» (bad when > 0), «عذر / إجازة», «خصم الغياب» (Money, bad when > 0). Footer «الغياب بدون عذر يُخصم تلقائياً من الراتب · العذر والإجازة بدون خصم». P1: when `month === currentMonth`, a link button «تسجيل حضور اليوم» (`ChevronLeft` trailing) to the attendance day view for today (`attendance.index` with `{ month }`; the server already defaults to the day view and to today's day for the current month). Because the card is itself a link, render this as a sibling below the card's link area, not nested inside it.

All values use `animated` Money / Count so a month change rolls them. Copy all existing strings from today's `Home.tsx`.

**Tablet:** hero full width, year strip full width, then purchases and attendance side by side.
**Phone:** one column: hero (value 34), year strip (bars scroll inline inside the panel if narrower than 12 × 24px), purchases, attendance. Tiles stay three across with `kpi` phone size.

### 9.3 Salaries — SALARIES

#### 9.3.1 Index (`pages/Salaries/Index.tsx`)

Props unchanged: `rows: { employee: Employee; payroll: PayrollRow }[]`, `totals: PayrollTotals`.

**Header:** title «الرواتب»; description (unchanged) «المستحق = الأساسي + المكافأة − الخصم + المرحّل من الأشهر السابقة. أي مبلغ غير مدفوع يُرحّل تلقائياً.»; `secondaryActions`: «تصدير PDF» (`FileDown`, `href` = `reports.salaries` with month, `download`, disabled when `rows.length === 0`); `primaryAction`: «موظف» (`Plus`), opens EmployeeDialog (new). Shortcut `KeyN` (P1).

**KPI strip** (hidden when `rows.length === 0`): StatGrid with «المستحق» (`totals.total`), «المدفوع» (`totals.paid`, ProgressBar `paid/total` ok), «المتبقي» (`totals.remaining`, warn when > 0). Below: a `caption` ink-3 line built from existing labels: «الأساسي {base} · مكافأة +{bonus} · خصم −{deduction} · مرحّل {carry}» (numbers in `.num`; P1). P1: the «تم دفع جميع رواتب الشهر» ok pill next to «المتبقي» when everything is paid and rows exist.

**Toolbar (P1, client-side over `rows`):** search Input with `Search` icon, placeholder «بحث عن موظف» (matches name and job title via `normalizeArabic`); status chips as a SegmentedControl sm with counts: «الكل», «غير مدفوع», «مدفوع جزئياً», «مدفوع», «لم يبدأ» (labels from StatusPill), each followed by a CounterBadge. The choice is stored with `useStoredState('salaries.filter', 'all', …)`. Filtered-empty: compact EmptyState «لا توجد نتائج» with a ghost «مسح البحث».

**Desktop / tablet table (≥ 640)** — DataTable, `minWidth={1080}`, comfortable, `animateKey={month}`, `sortStorageKey="salaries.sort"`, `rowTone` paid→ok, partial→warn, unpaid→bad, not_started→null. Columns in today's order:

| Column            | Cell                                                                                                                                                                                                                                                   | Sortable   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| «الموظف» (sticky) | Avatar 32 + name (`body-strong` button: ink-1, hover cyan-700 underline, opens HistoryDialog) over job title `caption`                                                                                                                                 | yes (name) |
| «الأساسي»          | Money cell                                                                                                                                                                                                                                             | yes        |
| «مكافأة»          | `started && bonus > 0` ? Money cell ok `+` : «—»                                                                                                                                                                                                       |            |
| «خصم»             | `started && deduction > 0` ? Money cell bad `−` : «—»; when `absent_days > 0` a `caption` «{n} يوم غياب»                                                                                                                                               |            |
| «مرحّل»            | `started && carry !== 0` ? Money cell warn : «—»                                                                                                                                                                                                       |            |
| «المستحق»         | started ? Money cell-strong : «—»                                                                                                                                                                                                                      | yes        |
| «المدفوع»         | started ? Money cell : «—»                                                                                                                                                                                                                             |            |
| «المتبقي»         | started ? Money cell-strong (ink-1 when 0, warn when > 0) : «—»                                                                                                                                                                                        | yes        |
| «الحالة»          | StatusPill (`paid` / `partial` / `unpaid` / `not_started`)                                                                                                                                                                                             | yes        |
| actions           | end-aligned, gap 6, sm: soft «تسجيل» (only when `started`; opens PaymentDialog) · primary «دفع كامل» (only when started and status is unpaid or partial; `loading` while `paying === id`, disabled for that row only) · ghost «تعديل» (EmployeeDialog) |            |

Footer row: «الإجمالي» then `totals` with NumberFlowGroup; bonus ok when > 0, deduction bad when > 0, carry warn when ≠ 0 (same tones as today).

**Row keyboard (P1, desktop):** `rowNavigation`; `Enter` = «تسجيل» (PaymentDialog), `KeyH` = history, `KeyE` = edit. No keystroke triggers «دفع كامل».

**Phone (< 640) — stacked cards instead of the table.** One Panel card per employee (stagger on first mount / month change):

- Line 1: Avatar 24 + name (button → history) and the StatusPill at inline-end. Line 2: job title `caption`.
- Money row: «المتبقي» label + Money `card` (warn when > 0) at inline-start; «المستحق» label + Money `cell-strong` at inline-end.
- Collapsible «التفاصيل» (P1; `ChevronDown`, height animation 160ms, opacity only when reduced) revealing a 2-column definition list: «الأساسي», «مكافأة», «خصم» (with «{n} يوم غياب»), «مرحّل», «المدفوع», same tone and «—» rules.
- Actions row: soft «تسجيل» and primary «دفع كامل» (same visibility rules) at flex 1, then a `⋯` IconButton («المزيد») with «تعديل» and «السجل».
- Not-started: pill «لم يبدأ», money row shows «—», only the `⋯` button.
- After the list, a «الإجمالي» Panel with all seven totals as a definition list.

**Empty (`rows.length === 0`):** EmptyState icon `Users`, «لا يوجد موظفون بعد», «أضف أول موظف وراتبه الأساسي، ثم سجّل المكافآت والخصومات كل شهر.», primary «إضافة موظف». KPI strip and toolbar hidden; «تصدير PDF» visible but disabled.

**Pay full (kept):** `router.post(payFull.url([id, month]), {}, { preserveScroll: true, onError: errors => toast.error(\`لم يتم الحفظ: ${Object.values(errors)[0] ?? ''}\`), onFinish: () => setPaying(null) })`. The server flash «تم تسجيل دفع {X} د.ل لـ {name}» shows. The new look: the row's pill crossfades and the totals roll. No undo.

**Commands (P1):** actions «موظف» and «تصدير PDF» (only when rows exist); records group «الموظفون» with each employee (keywords: job title) → opens PaymentDialog when started, otherwise HistoryDialog; meta shows المتبقي.

#### 9.3.2 EmployeeDialog (`pages/Salaries/EmployeeDialog.tsx`)

ResponsiveDialog md. Title «موظف جديد» / «تعديل الموظف».

Fields:

1. «الاسم» — Input, autoFocus. Error «اكتب اسم الموظف».
2. «الوظيفة (اختياري)» — Input.
3. Two columns ≥ 640, stacked on phone: «الراتب الأساسي (د.ل)» — MoneyInput (error «اكتب الراتب الأساسي»); «بداية الاحتساب» — MonthField (default the selected month for a new employee; error «اختر شهر بداية الاحتساب»).
4. «خصم يوم الغياب (د.ل)» with the existing muted suffix «(فارغ = الراتب ÷ 30)» — MoneyInput; placeholder = live `base ÷ 30` rounded to 2 decimals (kept). P1 hint under it: «سيُخصم {rate} د.ل عن كل يوم غياب» using the typed value, or the computed value when empty (hidden when both are 0).
5. Inset note (unchanged): «تُرحّل المبالغ غير المدفوعة ابتداءً من شهر بداية الاحتساب.»

Footer: primary «حفظ» (`loading`, label «جارٍ الحفظ…»), secondary «إلغاء», and for an existing employee danger «حذف الموظف» with `ms-auto`. P1, new employee only: secondary «حفظ وإضافة آخر» (`onSecondarySubmitShortcut`): on success keep the dialog open, reset fields (start month stays the selected month), focus «الاسم»; the server flash toast shows. `onSubmitShortcut` = save.

Delete: ConfirmDialog «سيُحذف {name} وكل سجلات رواتبه.», confirm label «حذف الموظف». On success both dialogs close and «تم حذف الموظف» flashes.

**Kept:** POST `store` / PUT `update` with `preserveScroll`; close on success with flash «تمت إضافة الموظف» / «تم الحفظ»; any error → `toast.error('لم يتم الحفظ: راجع الحقول المطلوبة')`; errors cleared and data re-seeded on every open.

#### 9.3.3 PaymentDialog (`pages/Salaries/PaymentDialog.tsx`)

Title «{name} · {monthLabel}». Keyed by `${employee.id}-${month}` (kept).

**≥ 640:** ResponsiveDialog lg (760), two columns (gap 24):

- **Inline-start column (inputs):** «مكافأة», «خصم إضافي», «المبلغ المدفوع» (MoneyInputs; «المبلغ المدفوع» autoFocused as today). Directly under «المبلغ المدفوع», a soft sm button «دفع المستحق كاملاً» that sets `paid_amount` to `String(total)` (moved from the footer to sit by the field it fills; same behavior). Then «ملاحظة (اختياري)», placeholder «مثال: خصم غياب يومين», maxLength 255; P1 counter `caption` «{n}/255» after 200 characters.
- **Inline-end column:** Inset breakdown, existing labels, `money inline` animated: «الأساسي»; «+ مكافأة» (ok); «− خصم إضافي» (bad); «− خصم الغياب ({n} يوم × {rate})» (bad); «+ مرحّل من الأشهر السابقة» (warn); dashed divider; «المستحق» (Money `card`); «المدفوع»; dashed divider; result «يُرحّل للشهر القادم» with Money `dialog`, warn when > 0, ok otherwise. Math unchanged (cents via `sumMoney` / `parseMoney`). P1: when paid > المستحق, a muted `caption` «المدفوع أكبر من المستحق» (not blocking; allowed today).

**Phone:** BottomSheet. The Inset first, collapsed to «المستحق» and «يُرحّل للشهر القادم» with a link button «عرض التفاصيل» (P1) to expand the full list; then the three MoneyInputs, «دفع المستحق كاملاً» as a full-width soft button under «المبلغ المدفوع», then the note.

Footer: «حفظ» (`loading`, «جارٍ الحفظ…»), «إلغاء». `onSubmitShortcut` = save. P1 `Alt+KeyF` = «دفع المستحق كاملاً».

P1 «حفظ والتالي» (secondary button + `onSecondarySubmitShortcut`): after a successful save, open PaymentDialog for the next row (in the current filtered order) whose refreshed status is `unpaid` or `partial`, read from the new props in `onSuccess`. If none, close and `toast('لا يوجد موظفون متبقون')`. Content fades 120ms between employees.

**Kept:** PUT `payroll.update [employee.id, month]` with `{ bonus, manual_deduction, paid_amount, note }`, `preserveScroll`; close on success with flash «تم الحفظ»; error toast «لم يتم الحفظ: {first error}»; initial values via `moneyInputValue` (zero shows empty).

#### 9.3.4 HistoryDialog (`pages/Salaries/HistoryDialog.tsx`)

Title «سجل {name}», header shows Avatar 40. Desktop (≥ 1024): `desktop="side-sheet"` (560 wide, the table stays visible). 640–1023: Dialog lg. Phone: full-height BottomSheet.

Data (kept): GET `employees.history` with `until=month`; up to 36 rows, newest first.

Layout: a list of compact month rows (one per item, hairline separated, pad 12/16):

- Line 1: month label `body-strong` + StatusPill at inline-end. When `row.month === month`: bg selected and a pill accent «الشهر المحدد» (P1).
- Line 2: «المستحق» Money `cell-strong` and «المدفوع» Money `cell` with their labels.
- Line 3 (`caption` ink-3): «مكافأة +x · خصم −y · مرحّل z» using «—» rules for zeros, then the note on its own line.
- P1: each row is a button (tooltip «فتح هذا الشهر») that calls `setMonth(row.month)` and closes the sheet.
- P2: above the list, a 36-bar SVG sparkline (المستحق bars, المدفوع line) from the returned rows.

States (kept text): loading = 3 skeleton rows; error = bad-700 message plus P1 ghost «إعادة المحاولة» that refetches; empty = «لم يبدأ احتساب راتب هذا الموظف بعد.». Rows fade in with a 15ms stagger.

### 9.4 Attendance — ATTENDANCE

Owns `pages/Attendance/**` including `shared.tsx` (`STATUS_LABELS`, `REASON_PLACEHOLDERS`, `MODE_LABELS`, `nextRecord`, `ShiftLabel` stay; `STATUS_FILL` / `STATUS_OPTIONS` are replaced by SegmentedControl `variant="status"` options with `tone`: present ok, absent bad, excuse warn, leave info).

#### 9.4.1 Index (`pages/Attendance/Index.tsx`)

Props unchanged: `view`, `day`, `selectedEmployee`, `employees`, `allEmployees`, `noneCount`, `records` (whole month), `counters`; shared `settings`, `today`.

**Header:** title «الحضور والانصراف»; description (unchanged) «الدوام الافتراضي {start – end} · الغياب بدون عذر يُخصم من الراتب، والعذر والإجازة بدون خصم.»; `secondaryActions`: «الإعدادات» (`Settings`, disabled when `allEmployees.length === 0`); `primaryAction` (day view only, when employees exist): «تحضير الجميع» (`loading`, label «جارٍ التحضير…»). `toolbar`: SegmentedControl neutral `ariaLabel="طريقة العرض"` «يومي» / «شهري»; navigating with `view` using `preserveState`, `preserveScroll`, `replace` (kept).

P1 shortcuts: `KeyD` daily, `KeyW` monthly, `Comma` settings, `Shift+KeyP` mark all.

**Empty states (kept conditions and texts):** `allEmployees.length === 0` → EmptyState `CalendarDays` «أضف الموظفين من صفحة الرواتب أولاً» + button «فتح صفحة الرواتب»; `employees.length === 0` → «لا يوجد موظفون يُسجَّل لهم حضور» + «فتح الإعدادات».

**Footnote:** when `noneCount > 0`, `caption` ink-3 «{n} موظف بدون حضور وغياب (لا يظهرون هنا).» plus P1 link button «تعديل» that opens Settings.

**Save model (kept exactly):** `saveDay` updates the local record map optimistically with `nextRecord`; `PUT attendance.update [employee, date]` with `{status, check_in, check_out, note}`; then `router.reload({ only: ['records','counters'] })`; on failure revert and `toast.error(\`لم يتم الحفظ: ${message}\`)`. Mark all: POST `markAll {date}`→ toast «تم تحضير {count} موظف» or «جميع الموظفين لديهم حالة لهذا اليوم» → partial reload. P1: a`SaveIndicator` next to the edited control (`pending`until the request resolves, then`saved`).

**Commands (P1):** actions «يومي», «شهري», «الإعدادات», «تحضير الجميع» (day view); records «الموظفون» → switch to the month view for that employee (`navigate({ view: 'month', employee: id })`).

#### 9.4.2 Daily view (`DailyTable.tsx` + page-local `DayStrip.tsx`, `DaySummary.tsx`)

**Day navigator** (Panel, sticky under the header on desktop; under the top bar on phone): `IconButton` «اليوم السابق» (`ChevronRight`) at inline-start, center the day name (`title-3`) over the date `formatDate` (`.num` ink-3), «اليوم التالي» (`ChevronLeft`) at inline-end. Month-boundary crossing is kept exactly (day 1 → last day of the previous month; last day → day 1 of the next month). Friday: `StatusPill kind="neutral"` «عطلة الجمعة». P1: a ghost sm «اليوم» when the shown date is not `today` (navigates to today's month and day). Shortcuts (P1, ignored in fields): `ArrowRight` previous day, `ArrowLeft` next day, `KeyT` today.

**Day strip** (P1, page-local, from `records` already loaded): horizontally scrollable row inside the navigator panel; selected chip scrolled into view (`scrollIntoView({ inline: 'center', block: 'nearest' })`). Chip 44×58, radius 10: weekday initial (`WEEKDAY_INITIALS`) 11.5 ink-3 over the day number 16/700 `.num`; a 3px bottom bar showing `recorded / employees.length` (ok-500 fill when complete, else cyan-600 proportion on sunken); a 5px bad-500 dot at the top inline-end when anyone is غائب. Friday: hatched sunken bg (`.bg-hatch`), ink-3. Today: amber-300 dot under the number. Selected: cyan-700 bg, white text. Chips are buttons (`aria-label` = `longDayLabel(date)`), `aria-current="date"` on the selected one; clicking calls `onDayChange`.

**Day summary** (P1, client-side): «مسجّل {x} من {y}», then filter chips «حاضر n», «غائب n», «عذر n», «إجازة n», «بدون حالة n» (StatusPill lg as toggle buttons, `aria-pressed`). Clicking filters the rows; clicking again clears. Not persisted.

**Desktop / tablet table (≥ 640):** DataTable `minWidth={880}`, compact, `rowTone` = the day's status tone, `animateKey={month}`; Friday: table body tinted surface-2. Columns:

| Column               | Cell                                                                                                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| «الموظف» (sticky)    | name `body-strong` + `ShiftLabel` («دوام 08:00–16:00» / «بدون وقت»)                                                                                                                                                                                            |
| «الحالة»             | SegmentedControl `variant="status"` size sm, `ariaLabel` «حالة {name}», options حاضر/غائب/عذر/إجازة. Clicking the selected status sends `null` (clears the day) — kept. SaveIndicator after it.                                                                |
| «الدخول» / «الانصراف» | only when status is حاضر and mode is `time`: TimeInput (aria-labels «الدخول» / «الانصراف»), saves on blur only when complete, non-empty and changed; otherwise «—». When status becomes حاضر the auto-filled times (from `nextRecord`) flash cyan-50 for 600ms. |
| «السبب»              | only for غائب, عذر, إجازة: Input with `REASON_PLACEHOLDERS`, maxLength 255, saves on blur or Enter only if changed; otherwise «—».                                                                                                                             |
| «خصم اليوم»          | غائب: Money cell bad `−{day_rate}`; otherwise the rate as Money cell `tone="muted"` at 60% opacity. On flip to غائب, a 1.06 scale bump (none when reduced).                                                                                                    |

Row keyboard (P1, `rowNavigation`): `Digit1`–`Digit4` set حاضر / غائب / عذر / إجازة on the focused row (pressing the current status clears it, same rule), `Delete` / `Backspace` clears, `Tab` enters the row's fields. Segment keycaps 1–4 show only on the focused row.

**Phone (< 640) — cards:** one Panel per employee with a 3px status rail at inline-start when set: name + ShiftLabel at inline-start, the deduction («−{rate} د.ل», bad) at inline-end only when غائب; a full-width SegmentedControl status size lg (48 tall); when حاضر + timed, two TimeInputs side by side («الدخول», «الانصراف»); when غائب / عذر / إجازة, the reason Input. Same save rules.

States: day change uses the existing `preserveState` visit; rows crossfade 120ms (no skeleton). Mark all: after the reload, rows that changed to حاضر crossfade their pills with a 25ms stagger.

#### 9.4.3 Monthly view (`MonthCalendar.tsx`)

**Top panel:** «الموظف» picker navigating with `employee` (kept). P1: Combobox (desktop popover with search, phone sheet) showing name with the shift sub-line; P0 fallback: Select. P1: prev / next employee IconButtons («الموظف السابق» `ChevronRight`, «الموظف التالي» `ChevronLeft`) and `Alt+ArrowUp` / `Alt+ArrowDown`. Counters (existing labels): «حضور» ok, «غياب» bad, «عذر» warn, «إجازة» info (Count `kpi`, animated), «خصم الغياب» Money kpi bad when > 0.

**Calendar panel:** header `monthLabel`; sub-line (unchanged) `MODE_LABEL`, plus « · {start} – {end}» for timed mode, plus « · خصم اليوم {rate} د.ل». Grid 7 columns Saturday → Friday with `WEEK_DAYS` headers in `th` style (phone abbreviated as today).

- Cell (desktop min-h 96, phone 52 square-ish), radius 10, pad 6, 1px line-1: day number 13/600 `.num` at top inline-start. With a record: `-50` bg, 6px `-500` dot and the status label 11.5/600 `-700` (label hidden on phone); حاضر shows «08:00 – 16:00» in `caption` (desktop only); other statuses show the note, truncated (desktop only). Friday: `.bg-hatch` and «عطلة» when there is no record. Today: 2px amber-300 ring. Blank leading / trailing cells: transparent. Hover border line-2. Focus: global ring.
- Click / Enter / Space opens DayDialog (kept).
- P1 grid keyboard (roving focus): `ArrowRight` previous day, `ArrowLeft` next day, `ArrowUp` / `ArrowDown` ±7, `Home` / `End` first / last day, `Digit1`–`Digit4` quick-set through the same `saveDay` (re-press clears; حاضر fills shift times via `nextRecord`), `Delete` clears. Quick-set: the status chip scales 0.85→1 + fades in 140ms.
- Employee change: grid crossfades 150ms.
- P2: a desktop-only toggle «موظف واحد» / «الجميع» (stored as `attendance.calendar`) showing a matrix (rows = employees, columns = days, 24px status dots, Fridays shaded, end columns «غياب» and «خصم الغياب» from `counters`); clicking a dot opens DayDialog for that employee and date. Uses only loaded props.

#### 9.4.4 DayDialog (`DayDialog.tsx`)

ResponsiveDialog sm (phone sheet). Title «{name} · {longDayLabel}».

1. «الحالة»: SegmentedControl status lg, `fullWidth`. Selecting the current status clears it; selecting «حاضر» clears the note and fills times (existing times when already present, else the shift) — kept. P1 keys `Digit1`–`Digit4` while the dialog is open and focus is not in a text field.
2. Timed: «الدخول» and «الانصراف» TimeInputs side by side.
3. Not حاضر: «السبب» Input with the status placeholder, maxLength 255.
4. Deduction line, crossfading on status change: «يُخصم {rate} د.ل من الراتب» bold bad-700 when غائب, else «بدون خصم» ink-3.
   Fields 2–3 expand / collapse in height (160ms; opacity only when reduced).

Footer: «حفظ» («جارٍ الحفظ…»; saves the selected status, which may be `null`), «إلغاء», and danger «مسح اليوم» (`ms-auto`, only when a record exists; calls `save(null)`). Closes only when the save resolves ok (kept). `onSubmitShortcut` = save. P1 «حفظ واليوم التالي» (`onSecondarySubmitShortcut`): save, then reopen for the next date in the same month for the same employee; disabled on the last day.

#### 9.4.5 SettingsDialog (`SettingsDialog.tsx`)

ResponsiveDialog xl (920; phone full-height sheet). Title «إعدادات الحضور والانصراف».

Section 1 «الدوام الافتراضي لكل الموظفين»: «بداية الدوام», «نهاية الدوام» TimeInputs. Errors «اكتب بداية الدوام», «اكتب نهاية الدوام».

Section 2 «طريقة الحضور وخصم الغياب لكل موظف», helper (unchanged) «اترك وقت الدوام فارغاً ليُستخدم الافتراضي، واترك الخصم فارغاً ليُحسب الراتب ÷ 30.»

- **≥ 640 table** (plain semantic table inside an Inset-free Panel, sticky header inside the dialog body): «الموظف», «طريقة الحضور» (NativeSelect: «بوقت دوام محدد», «حضور بدون وقت», «بدون حضور وغياب»), «بداية», «نهاية» (TimeInputs, enabled only for `time`; placeholders = the live Section 1 values), «خصم يوم الغياب» (MoneyInput sm; disabled for `none`; placeholder `base ÷ 30`). Rows set to `none` are at 60% opacity with a P1 neutral pill «لا يظهر في الحضور».
- P1: search Input «بحث عن موظف» above the table when there are more than 8 employees (filters display only; all rows still submit).
- P2: «تطبيق على الجميع» in a header DropdownMenu on «طريقة الحضور» (sets every row's mode in form state).
- **Phone:** one card per employee: name header; SegmentedControl neutral sm for the mode with short labels «بوقت», «بدون وقت», «بدون» (P1 approved short labels, `aria-label` uses the full `MODE_LABELS`); time pair only for timed; the deduction MoneyInput.

Footer: «حفظ الإعدادات» («جارٍ الحفظ…»), «إلغاء».

**Kept:** one PUT to `attendance.settings`; empty times and rate become `null`; success closes and flashes «تم حفظ الإعدادات»; props refresh; error toast «لم يتم الحفظ: {first error}»; form re-seeds on open.

### 9.5 Purchases — PURCHASES + UPLOAD

#### 9.5.1 Index (`pages/Purchases/Index.tsx`)

Props unchanged: `groups: (PurchaseGroup & PurchaseSummary)[]`.

Header: title «المشتريات», description «مجموعات المشتريات وإجمالي كل مجموعة في {monthLabel}», primary «مجموعة» (`Plus`, P1 `KeyN`) opening GroupDialog (new).

**Month total strip** (P1, client-side sum, shown when groups exist): StatCard «إجمالي المشتريات» (Money kpi) with sub-line «{n} فاتورة · {m} بلا إيصال» (warn-700 when m > 0).

**Grid** (`repeat(auto-fill, minmax(260px, 1fr))`, gap 16; phone one column, gap 10). **Group card** = InteractiveCard linking to the group with `?month`:

- Name `title-3` at inline-start, `SerialChip` with the code at inline-end.
- Meta: «{count} فاتورة» `label-sm` ink-3, plus `StatusPill kind="no_receipt"` «{missing} بلا إيصال» when missing > 0; P1 when count > 0 and none missing, ok pill «كل الإيصالات مرفقة».
- ProgressBar `with_receipts / count` (accent; hidden when count is 0).
- Dashed divider, then «إجمالي الشهر» `label-sm` over Money `card` (animated).
- After the cards, a dashed tile button «إنشاء مجموعة جديدة» (min-h equal to a card; `Plus` 20) opening GroupDialog.
- Phone: compact card (name + code on one line, total Money `card` at inline-end, meta and bar below).
- P1 keyboard: arrow keys move focus across cards (`use-roving-rows`), Enter opens.

**Empty (P1):** when there are 0 groups, EmptyState `ReceiptText` «لا توجد مجموعات بعد», «أنشئ مجموعة لكل نوع من المشتريات، وستحصل فواتيرها على أرقام تلقائية.», primary «إنشاء مجموعة جديدة».

**Kept:** creating a group redirects to its page (server) and flashes «تمت إضافة المجموعة».

**Commands (P1):** action «مجموعة»; records «المجموعات» (keywords: code) → open the group.

#### 9.5.2 GroupDialog (`pages/Purchases/GroupDialog.tsx`)

ResponsiveDialog sm. Title «مجموعة جديدة» / «إعدادات المجموعة».

1. «اسم المجموعة» — placeholder «مثال: مشتريات داخلية», autoFocus. Error «اكتب اسم المجموعة».
2. «رمز الترقيم» — hint «أحرف إنجليزية، يظهر في رقم الفاتورة»; Input `dir="ltr"`, mono, uppercase, placeholder «IN». Input filter kept: uppercase, `[A-Z0-9]` only, max 4. P1 live preview `caption` under the hint: «مثال على رقم الفاتورة: {CODE}-{YYMM}-001» using the typed code (or `G` when empty, the server default), the selected month as `YYMM`; the serial is in a SerialChip. P1 for an existing group: `caption` «الأرقام القديمة لا تتغير» (the controller keeps old serials).

Footer: «حفظ» («جارٍ الحفظ…»), «إلغاء», danger «حذف المجموعة» (`ms-auto`, existing group only).

Delete (kept, no extra guard): ConfirmDialog «ستُحذف مجموعة «{name}» وجميع فواتيرها في كل الأشهر.» confirm label «حذف المجموعة». The server redirects to the index with the month and flashes «تم حذف المجموعة».

**Kept:** POST `store?month=` / PUT `update`, `preserveScroll`, close on success, any error → `toast.error('لم يتم الحفظ: راجع الحقول المطلوبة')`.

#### 9.5.3 Show (`pages/Purchases/Show.tsx`)

Props unchanged: `group`, `invoices` (oldest first), `summary`.

Header: breadcrumb «المشتريات» → index with `?month`; title «{group.name}» followed by `SerialChip` code; description «فواتير {monthLabel}»; `secondaryActions`: «تصدير PDF» (download anchor, disabled when there are no invoices), «إعدادات» (`Settings`, opens GroupDialog for this group); `primaryAction` «فاتورة» (`Plus`, P1 `KeyN`). `toolbar`: SegmentedControl neutral «جدول» / «بطاقات» (`LayoutList` / `LayoutGrid` icons), persisted in `localStorage` under `purchases.layout` with the existing try/catch (use `useStoredState` with the same key and validator). P1 `KeyV` toggles.

**Summary:** StatGrid (2×2 on phone): «الإجمالي» Money, «عدد الفواتير» Count, «متكررة» Count, «بلا إيصال» Count warn when > 0. P1: when `missing_receipts === 0 && count > 0`, that tile shows an ok sub-line with `Check` «كل الفواتير بإيصالات».

**Toolbar filters (P1, client-side):** chips «الكل», «بلا إيصال», «متكرر», «مرة واحدة» with counts; search Input «بحث في الفواتير» (title, serial, reason, price). Not persisted. Filtered-empty: compact «لا توجد نتائج» + «مسح البحث».

**Empty** (no invoices this month): EmptyState `FileText` «لا توجد فواتير في {monthLabel}», «أضف فاتورة بصورة الإيصال من جهازك أو التقطها بالهاتف عبر رمز QR.», primary «فاتورة جديدة».

**Table layout (`InvoiceTable.tsx`, ≥ 640):** DataTable `minWidth={760}`, comfortable, `sortStorageKey="purchases.sort"`, `animateKey={month}`, `onRowActivate` opens InvoiceDialog (click / Enter / Space as today), `rowTone` warn when there is no receipt. Columns: «الإيصال» (40px thumbnail radius 8, `loading="lazy"`; clicking it opens ReceiptViewer instead of the dialog, P1; no receipt: «—» ink-3), «الرقم» (SerialChip), «العنوان» (`body-strong` + `no_receipt` pill when missing), «السبب» (`body-sm` ink-3, one-line truncate with Tooltip), «النوع» (`recurring` / `once` pill; P1 when `is_auto`, a neutral pill «تلقائي» with tooltip «نُسخت تلقائياً من الشهر السابق»), «التاريخ» (`formatDate(created_at)`, `.num`), «السعر» (Money cell-strong). Footer «الإجمالي» with `summary.total`.

**Phone list (< 640):** rows in one Panel, hairline separated, min-h 72: 48px thumbnail (radius 10; no receipt: warn-50 tile with `ImageOff` 18 warn-700) at inline-start; title `body-strong` with the serial chip below; type pill + date `caption`; price Money `cell-strong` at inline-end. Tapping the row opens InvoiceDialog. A «الإجمالي» Panel footer row at the end.

**Cards layout (`InvoiceCards.tsx`):** grid `minmax(240px, 1fr)` gap 16; phone 2 columns, gap 10. Card = InteractiveCard (button): receipt image 4:3 `object-cover` top radius 14, sunken bg, lazy; missing: centered `ImageOff` 24 warn-700 and «بانتظار صورة الإيصال» (13/500 warn-700) on warn-50 with the diagonal hatch `repeating-linear-gradient(135deg, transparent 0 10px, rgb(227 154 45/.08) 10px 11px)`. Body pad 14: title `body-strong` 2-line clamp + type pill; bottom row SerialChip at inline-start, Money `card` at inline-end (phone 20). Clicking the card opens InvoiceDialog; P1 clicking the image opens ReceiptViewer.

**ReceiptViewer (P1):** items = invoices with a receipt, in list order; caption «{serial} · {title} · {price} د.ل»; «فتح الفاتورة» opens InvoiceDialog for that invoice.

**P2 quick attach:** rows / cards without a receipt get an «إرفاق» IconButton (and accept dropped image files, with the overlay text «أفلت لإرفاق الإيصال»). Flow: `compressImage` → POST `receipts.store` → `PUT invoices.update(invoice.id)` with **all** fields `{ title, price, reason, type, receipt_id: newId }` and `preserveScroll`. Failure toasts use the existing texts. **Warning:** `invoices.update` stores `receipt_id ?? null` and deletes the previous file. Any invoice update must send every field and the intended `receipt_id`.

**Commands (P1):** actions «فاتورة», «إعدادات», «تصدير PDF» (when invoices exist), «جدول», «بطاقات»; records «الفواتير» (keywords: serial, price) → InvoiceDialog.

#### 9.5.4 InvoiceDialog (`pages/Purchases/InvoiceDialog.tsx`)

Title «فاتورة {serial}» (serial in a SerialChip) or «فاتورة جديدة · {group.name}».

**≥ 640:** ResponsiveDialog xl (920), two columns (form 1fr, receipt 340px):

- Inline-start (form): «العنوان» (placeholder «مثال: أحبار طابعة», maxLength 160; P1 autoFocus for a new invoice; error «اكتب عنوان الفاتورة»); «السعر (د.ل)» (MoneyInput; error «اكتب السعر»); «سبب الشراء (اختياري)» (Textarea, P1 `autoGrow` 2–6 rows); «النوع» as two radio cards (Radix RadioGroup, `dir="rtl"`, arrow keys switch): «مرة واحدة» and «متكرر شهرياً», each a 1px line-field card radius 10 pad 12 with a radio dot; selected border cyan-700 + cyan-50 bg. Helper under them (unchanged): «الفاتورة المتكررة تُنشأ تلقائياً في الشهر التالي، وتحتاج فقط لصورة الإيصال الجديد.»
- Inline-end: Field «صورة الإيصال» containing ReceiptPicker `layout="column"`, full column height; `emphasis` when `is_auto && !receipt`.
- P1, for `is_auto` invoices: an info Inset above the form: «أُنشئت تلقائياً من الشهر السابق. أضف صورة الإيصال الجديد.»

**Phone:** full-height sheet, single column; ReceiptPicker `layout="strip"` first, then title, price, reason, type.

Footer: primary «إضافة الفاتورة» (new) or «حفظ» (edit), «جارٍ الحفظ…» while busy; «إلغاء»; danger «حذف» (`ms-auto`, edit only). `onSubmitShortcut` = save. P1 new invoice only: secondary «إضافة وفاتورة أخرى» (`onSecondarySubmitShortcut`): on success keep the dialog open, reset fields (type keeps the last choice), clear the receipt, focus «العنوان»; the flash «تمت إضافة الفاتورة» shows.

Delete (kept): ConfirmDialog «ستُحذف الفاتورة {serial} «{title}».», confirm «حذف»; flash «تم حذف الفاتورة».

**Kept:** POST `store(group.id)` with `month` transformed into the payload; PUT `update(invoice.id)`; `receipt_id` always sent; close on success; error toast «لم يتم الحفظ: {first error}»; **the dialog hides while QR is open** (`open && !qrOpen`) and reappears with the received image; `qrOpen` resets on reopen. QrUploadDialog renders as a nested layer.

### 9.6 Phone upload page (`pages/Upload.tsx`, `/upload/{token}`, no login) — PURCHASES + UPLOAD

`StandaloneShell`, single column max-w 440, pad 16, canvas, no nav. Page title «إرسال صورة الإيصال».

Header: `logo-full.png` at 200px (as today), then the existing heading «إرسال صورة الإيصال» in `title-2`.

States (`aria-live="polite"` region announces changes):

1. **checking:** «جارٍ التحقق من الرمز…» over a Skeleton capture card (h260, radius 16).
2. **invalid / used / expired:** EmptyState compact with a bad-50 icon tile (`XCircle` bad-700) and the existing title («الرمز غير صالح» / «تم استخدام هذا الرمز» / «انتهت صلاحية الرمز») and existing sub-text.
3. **ok, no photo:** one big capture button (min-h 260, radius 16, 1.5px dashed cyan-600, cyan-50 bg): `Camera` 48 cyan-700, «اضغط لتصوير الإيصال», «أو اختر صورة من المعرض» (existing strings). It triggers the existing file input (`accept="image/*"`, `capture="environment"`). Under it: the existing «الرمز صالح لمدة {minutes} دقيقة تقريباً». P1: minutes count down locally from the loaded `expires_in`, recomputed every 30s; at 0 re-check with GET `upload.show` (existing endpoint) and switch to the returned state.
4. **ok / sending with photo:** preview card (radius 16, `max-h 60vh`, `object-fit: contain`, white bg). Sticky bottom action area (pad `12px 16px calc(12px + env(safe-area-inset-bottom))`, canvas-glass): primary lg h56 full width «إرسال إلى النظام» (`loading`, «جارٍ الإرسال…»; indeterminate 3px bar on the preview while sending), secondary lg «إعادة التصوير». Both disabled while sending.
5. **Error after send:** back to ok with «فشل رفع الصورة» in bad-700 above the buttons; sending again retries. A 410 switches to the server state from step 2 (kept).
6. **done:** ok-50 Panel, `CheckCircle2` 28 ok-700 (stroke draws over 400ms; static when reduced), existing «تم الإرسال ✓» and «ظهرت الصورة في الفاتورة على الحاسوب. يمكنك إغلاق هذه الصفحة.». P1: `navigator.vibrate?.(20)`.

**Kept:** compression falls back to the original file on failure; the preview object URL is revoked; no login.

---

## 10. Global interaction rules (all pages)

- **Dialog submit:** Enter in a single-line field submits (native). Ctrl/⌘ + Enter submits from any field via `onSubmitShortcut`. Ctrl/⌘ + Shift + Enter triggers the "and next / and another" variant where one exists.
- **Validation:** server errors under the field via `Field error`; the field gets the invalid style and shakes once; **the first invalid field receives focus** (P1); the existing toast still fires.
- **Busy:** the primary shows its existing «جارٍ …» label with `loading` and keeps its width. Other footer buttons stay enabled, except the destructive one.
- **Disabled with a reason:** tooltip on pointer devices (for example the disabled «تصدير PDF»); no new copy unless listed in §11.
- **Stagger rule:** lists animate only on first mount and when `month` changes, never on partial reloads after a save.
- **Commands:** each page registers its actions and records with `useCommands` (P1).
- **Logical properties only.** `grep -rnE '\b(ml|mr|pl|pr|left|right)-' resources/js` must return nothing for layout. Physical direction appears only for motion `x` signs, `scrollLeft` math, inset box-shadows and `background-position` of the NativeSelect chevron; comment each.
- **Every number** goes through `formatNumber`, `Money`, `Count` or NumberFlow (`en-US`) inside `.num`. No Arabic-Indic digits are rendered.

---

## 11. Approved new strings

Only these new strings may be added. Everything else is copied from the current code.

| Area           | Strings                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell          | «بحث سريع» · «العودة للشهر الحالي» · «الشهر» · «المزيد» · «إغلاق» (aria)                                                                                                                                                                                                                                                                                                                                                                                                   |
| Palette        | «ابحث عن صفحة أو موظف أو فاتورة أو إجراء…» · «التنقل» · «الشهر» · «إجراءات» · «الموظفون» · «الفواتير» · «المجموعات» · «الحساب» · «الشهر الحالي» · «الانتقال إلى {monthLabel}» · «لا توجد نتائج» · «↑↓ للتنقل · ↵ للفتح · Esc للإغلاق» · «اختصارات لوحة المفاتيح» (P2)                                                                                                                                                                                                         |
| Login          | «إظهار» · «إخفاء» · «مفتاح الأحرف الكبيرة مفعّل» · «ستبقى مسجلاً على هذا الجهاز»                                                                                                                                                                                                                                                                                                                                                                                              |
| Home           | «نسبة المدفوع {x}%» · «رواتب {year}» · «تم دفع جميع رواتب الشهر» · «تسجيل حضور اليوم» · «ابدأ بإضافة الموظفين من صفحة الرواتب، ثم أنشئ مجموعة مشتريات.»                                                                                                                                                                                                                                                                                                                   |
| Salaries       | «بحث عن موظف» · «الكل» · «مسح البحث» · «التفاصيل» · «السجل» · «حفظ وإضافة آخر» · «سيُخصم {rate} د.ل عن كل يوم غياب» · «حفظ والتالي» · «لا يوجد موظفون متبقون» · «عرض التفاصيل» · «المدفوع أكبر من المستحق» · «الشهر المحدد» · «فتح هذا الشهر» · «إعادة المحاولة»                                                                                                                                                                                                            |
| Attendance     | «اليوم» · «مسجّل {x} من {y}» · «بدون حالة» · «تعديل» · «الموظف السابق» · «الموظف التالي» · «حفظ واليوم التالي» · «لا يظهر في الحضور» · «بوقت» · «بدون وقت» · «بدون» · «موظف واحد» / «الجميع» (P2) · «تطبيق على الجميع» (P2)                                                                                                                                                                                                                                                 |
| Purchases      | «إجمالي المشتريات» · «{n} فاتورة · {m} بلا إيصال» · «كل الإيصالات مرفقة» · «لا توجد مجموعات بعد» · «أنشئ مجموعة لكل نوع من المشتريات، وستحصل فواتيرها على أرقام تلقائية.» · «مثال على رقم الفاتورة: {serial}» · «الأرقام القديمة لا تتغير» · «كل الفواتير بإيصالات» · «بحث في الفواتير» · «تلقائي» · «نُسخت تلقائياً من الشهر السابق» · «أُنشئت تلقائياً من الشهر السابق. أضف صورة الإيصال الجديد.» · «إضافة وفاتورة أخرى» · «فتح الفاتورة» · «إرفاق» (P2) · «أفلت لإرفاق الإيصال» (P2) |
| Receipt picker | «اسحب الصورة هنا أو الصقها» · «أفلت الصورة هنا»                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

## 12. Behavior preservation checklist (QA)

### 12.1 Auth

- Arabic login errors shown as sent; password reset on error (AuthTest).
- Logout is a POST (`<Link as="button">`). No registration UI.

### 12.2 Month

- `?month=YYYY-MM` on every internal link (nav, brand, breadcrumbs, cards, palette).
- Changing the month drops `day` and uses `preserveScroll`.
- The server falls back to the current month for an invalid month (HomeAndReportsTest).

### 12.3 Salaries

- Pay-full flash text, row-scoped `paying`, error toast format.
- Payment breakdown math in cents; «دفع المستحق كاملاً» fills the total; empty money fields mean 0; initial values via `moneyInputValue`.
- History: up to 36 rows newest first; loading, empty and error states.
- Employee confirm-delete message and label; `÷ 30` placeholder.
- PDF export disabled when empty and a direct download.

### 12.4 Attendance

- Re-selecting a status clears the day.
- حاضر auto-fills times (shift or previous) and has no reason field (AttendanceTest). Switching away from حاضر clears times and keeps the reason.
- Times save on blur only when changed; reason saves on blur or Enter only when changed.
- Optimistic update with rollback + toast, then partial reload of `records` and `counters`.
- Mark-all toasts; mark-all skips employees who already have a status (AttendanceTest).
- Day navigation crosses months. Friday «عطلة الجمعة» / «عطلة». `today` highlighted. Week starts Saturday.
- Settings save in one request with `null` for empty fields; flash «تم حفظ الإعدادات». `noneCount` note.

### 12.5 Purchases and upload

- Code normalization (uppercase, A–Z 0–9, max 4). Creating a group redirects to it. Group delete redirects to the index with the month.
- Layout persists under `purchases.layout`. Invoices listed oldest first.
- `receipt_id` always sent on update. The invoice dialog hides while QR is open.
- QR: 2s polling, 10:00 countdown, token deleted on close, accepted once.
- Upload error texts («فشل رفع الصورة…», the 15 MB message) (PurchasesTest, PhoneUploadTest).
- Phone upload: no login; states invalid, used, expired, ok, done; 410 maps to the server state (PhoneUploadTest).

### 12.6 Out of scope (needs backend; do not build)

Global cross-page search; per-payment ledger within a month; server undo / soft delete (and therefore pay-full undo); receipt thumbnails; purchases trends across months; attendance heat-maps on Home; bulk attendance for a date range; a "phone opened the link" QR state; audit metadata; employee archiving / ordering; duplicate-invoice warnings; PDF download progress.

### 12.7 Dropped from the source specs (behavior changes)

Unsaved-changes guard on dialogs; type-the-code guard on group delete; client countdown that disables login; pay-full undo; `f` key pay-full; inline table editing of bonus / paid / price; swipe-to-change-day; long-press radial status menu; floating action buttons; split-screen login brand panel; desktop top-bar shell; filled status segments; lightbox package.

---

## 13. Build plan and workstreams

### 13.1 FOUNDATION (first, one senior dev)

Deliverables:

1. Install the five packages (§6) with `--save-exact`.
2. `resources/css/app.css`: tokens (§2.6), `@theme inline` mappings, shadcn and legacy aliases, text-scale and money-scale utilities, elevation, radius, `.num`, `.serial`, `.bg-hatch`, `.lucide` stroke rule, field focus / invalid styles, keyframes (`overlay-in/out`, `dialog-in/out`, `pop-in/out`, `tooltip-in`, `sheet-side`, `shimmer`, `shake`, `pulse-dot`, `draw-check`) with reduced-motion variants, `html, body { overflow-x: clip }`, the global reduced-motion guard.
3. `app.tsx`: progress `{ color: '#0B7DA6', delay: 150 }`.
4. All of §7 (components, `components/ui/*` restyle, command palette), §7.27 lib and hooks, §8 AppShell, PageHeader and StandaloneShell, MonthPicker, Money, dialogs, ReceiptPicker, ReceiptViewer, QrUploadDialog.
5. Keep legacy exports and props working so the untouched pages still type-check and build.
6. A hidden dev-only gallery is **not** required; verify components inside the shell on the existing pages.

Exit criteria (before page work starts): `npx tsc --noEmit`, `npx vp check --fix` and `npm run build` pass; the existing pages render in the new shell at 1440 / 1024 / 400 / 360 with no horizontal scroll; ⌘K opens the palette with navigation and month groups working; `php artisan test --compact` green.

Final cleanup (after all page workstreams merge): remove legacy aliases, legacy classes, `StatTile`, `AppDialog`, legacy variant / size mappings that no page uses; re-run all checks.

### 13.2 Page workstreams (parallel, after FOUNDATION)

| Key        | Owns                                                               | Builds     |
| ---------- | ------------------------------------------------------------------ | ---------- |
| SALARIES   | `resources/js/pages/Salaries/**`                                   | §9.3       |
| ATTENDANCE | `resources/js/pages/Attendance/**`                                 | §9.4       |
| PURCHASES  | `resources/js/pages/Purchases/**`, `resources/js/pages/Upload.tsx` | §9.5, §9.6 |
| HOME_LOGIN | `resources/js/pages/Home.tsx`, `resources/js/pages/Login.tsx`      | §9.1, §9.2 |

Every page workstream: P0 first, then P1, then P2; use only shared components and new token names; no edits outside owned paths; finish with the full check suite.

---

## 14. Acceptance checklist

**Visual and layout**

- [ ] Desktop ≥ 1024: sidebar with brand, Period card, nav with moving indicator, «بحث سريع», user row; content in the framed white sheet; document scroll.
- [ ] Phone < 1024: glass top bar with month control, bottom tab bar, account sheet; content clears the tab bar and safe area.
- [ ] No horizontal page scroll at 1440, 1024, 768, 400, 360. Wide tables scroll inside their panel with edge fades that work in RTL.
- [ ] Phone (< 640) uses cards for salaries, daily attendance and invoices; dialogs become bottom sheets.
- [ ] Only §2 token pairs are used; `ink-4`, `-500` tones and brand fills never carry text.
- [ ] Tabular-figures check: `1111.11` and `8888.88` render at the same width.
- [ ] Every money value shows «د.ل» in ink-3; signs use `+` and `−` (U+2212).
- [ ] No legacy token names or legacy classes remain after cleanup (`grep -rnE 'bg-bg|bg-sunk|text-muted|text-accent|gold-ink|field-input|money-input|dashed-divider|\b(text|bg)-(ok|warn|bad|info)(-soft)?\b' resources/js` is empty).

**Behavior**

- [ ] Every item in §12.1–12.5 passes manually.
- [ ] Every toast and validation string is byte-identical to before (diff the Arabic string literals in the old and new pages; only §11 additions are new).
- [ ] Flash toasts and «لم يتم الحفظ: …» still fire; `networkError` shows «تعذر الاتصال بالخادم».

**Accessibility and input**

- [ ] Keyboard-only pass: Tab order, visible focus everywhere, Esc closes dialogs / sheets / palette and restores focus, arrows in SegmentedControl (RTL-correct), ⌘K / Ctrl K, Ctrl/⌘ + Enter submits dialogs, ConfirmDialog focuses «إلغاء».
- [ ] Every IconButton has an Arabic `aria-label`; nav uses `aria-current="page"`; sortable headers set `aria-sort`; status controls are radiogroups.
- [ ] MoneyInput accepts `١٢٥٠٫٥` and submits `1250.5`; TimeInput accepts `٠٨٣٠` and submits `08:30`.
- [ ] `prefers-reduced-motion: reduce`: no transforms, no stagger, no shimmer, NumberFlow jumps, shakes off.
- [ ] Shortcuts work with an Arabic OS keyboard layout (matched by `code`) and never fire while typing.

**Engineering**

- [ ] Exact package versions in `package.json` (no `^`) for motion 14.6.0, @number-flow/react 0.6.2, @tanstack/react-table 9.3.1, cmdk 1.1.1, vaul 1.1.2.
- [ ] No changes under `app/`, `routes/`, `database/`, `tests/`, `config/`, `resources/views/`, `resources/js/actions/`, `resources/js/routes/`, `resources/js/wayfinder/`.
- [ ] `npx vp check --fix`, `npx tsc --noEmit`, `npm run build`, `php artisan test --compact` all pass.

---

## 15. Decision log (conflicts resolved)

| Topic                     | Design system spec                                   | Screens spec                                                            | Decision                                                                              |
| ------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Desktop shell             | Sidebar + Period card + framed sheet, no stripe      | Top bar with nav pills and stripe                                       | **Sidebar.** Keeps the month prominent and frees the top of every page.               |
| Phone shell               | Top bar with month in center, avatar → account sheet | Month at end, search icon, logout at bottom of Home                     | **Design system.** Logout and search live in the account sheet.                       |
| Accent / amber text       | `#08678A` / `#8A5300`                                | `#0779a6` / `#a8660a`                                                   | **Deeper tokens**; they pass on every surface.                                        |
| Status control            | Soft status thumb                                    | Filled status segments                                                  | **Soft.** Solid color reserved for actions.                                           |
| Toast position            | Bottom-left; phone bottom-center above tab bar       | Bottom-start; phone top-center                                          | Desktop bottom-left; **phone top-center** so toasts never cover sheet footers.        |
| Dialog sizes              | 440 / 560 / 760                                      | 480 / 720 / 860 / 880 / 960                                             | **440 / 560 / 760 / 920.** Payment lg, Invoice and Settings xl.                       |
| History                   | Desktop side sheet                                   | Wide 860 dialog with a 7-column table                                   | **Side sheet 560** with compact month rows; month-jump kept as P1.                    |
| Phone tables              | Horizontal scroll inside panel                       | Stacked cards                                                           | **Cards** for salaries, daily attendance and invoices.                                |
| Time input                | Native `type="time"` styled                          | Masked 24h field                                                        | **Masked in-house TimeInput** (locale-proof, Arabic digits).                          |
| Money grouping            | On blur                                              | While typing                                                            | **On blur** (no caret jumps).                                                         |
| QR countdown              | 64px ring beside the QR                              | Ring around the QR frame                                                | **64px ring** with `mm:ss`.                                                           |
| MonthPicker current month | amber-50 bg + dot                                    | amber border + header button + progress underline                       | **amber-50 + dot**; «العودة للشهر الحالي» lives in the Period card and account sheet. |
| Login                     | Centered column + watermark                          | Split with brand panel                                                  | **Centered column**, plus password toggle and caps-lock hint.                         |
| Lightbox                  | (none)                                               | `yet-another-react-lightbox`                                            | **In-house ReceiptViewer**; package not proven in RTL.                                |
| Phone primary actions     | Primary stays in header, `flex: 1`                   | Floating action buttons                                                 | **Header primary.**                                                                   |
| Year strip colors         | Paid cyan-700 / remaining amber-100                  | Colored by state                                                        | **Paid / remaining stack**; state text in the tooltip.                                |
| Speed features            | —                                                    | Save-and-next, save-and-add, keyboard rows                              | **Kept as P1** (additive, existing endpoints).                                        |
| Behavior-changing ideas   | —                                                    | Unsaved guard, delete-code guard, undo, inline edits, swipe, long-press | **Dropped** (§12.7).                                                                  |
