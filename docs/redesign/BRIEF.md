# Smart Care Accounting — Redesign Brief

## What the product is

An internal web app for the accountants of **الرعاية الذكية (Smart Care)**. Three modules share one global month selector (`?month=YYYY-MM` in the URL):

- **الرواتب (Salaries):** monthly payroll per employee (base, bonus, extra deduction, absence deduction, paid). Unpaid amounts carry over (يُرحّل) to the next month automatically. Pay in full, partial payments, per-employee history.
- **الحضور والانصراف (Attendance):** daily status per employee: حاضر / غائب / عذر / إجازة. Only غائب deducts from salary. A daily table view and a monthly calendar view (week starts Saturday, Friday is the weekend). Settings dialog with default work hours plus a per-employee mode, shift and day rate.
- **المشتريات (Purchases):** purchase groups → monthly invoices with a receipt photo (uploaded from the computer or from a phone via a 10-minute one-time QR code), CODE-YYMM-NNN serials, recurring invoices auto-copied to the next month, monthly PDF per group.

Users are accountants only, all with the same access. Their job is to enter and check money quickly and correctly.

## The task

Totally redesign the **frontend** so that it looks premium and is a pleasure to use, then rebuild it. The **backend is frozen**: no PHP, route, migration or test changes. The pages receive the same Inertia props and call the same endpoints (Wayfinder helpers in `@/actions/...` and `@/routes/...`).

## Non-negotiables

1. **Arabic UI, right-to-left**: `<html dir="rtl" lang="ar">`. Every visible string is Arabic, except serials, emails and "Smart Care". Use logical CSS (`ms-/me-/ps-/pe-/start-/end-`), never `ml-/mr-/left-/right-` for layout.
2. **Light mode only.**
3. **Brand** (from the logo, `public/img/logo-mark.svg`): cyan `#48dfff` and amber `#ffb63c` are fill colors. They are too light for text, so readable text and white-on-color buttons use deeper shades (currently `#0779a6` for the accent and `#a8660a` for amber text). Ink `#2d3134`. Status colors: paid/present = green, partial/excuse = amber, unpaid/absent/deductions = red, leave = blue.
4. **Money:** Libyan Dinar, shown as a number followed by a small muted «د.ل». Western digits, thousands separators, up to 2 decimals (`1,250.5`), tabular figures, isolated LTR inside RTL text. Money numbers are big and bold so they read at a glance.
5. **Behavior stays exactly the same**: every rule, flow, toast text and validation message already implemented (see the current pages and `tests/Feature/*`). Examples: clicking the selected attendance status clears the day; حاضر auto-fills shift times and has no reason field; the payment dialog shows a live breakdown; the QR dialog polls every 2 s and counts down from 10:00; the invoice dialog hides while the QR dialog is open.
6. **Phone width 400px** must work: no horizontal page scroll (wide tables scroll inside their panel). The phone upload page (`/upload/{token}`) is phone-first and needs no login.
7. Accessible: keyboard focus visible, dialogs trap focus, respect `prefers-reduced-motion`, contrast ≥ 4.5:1 for text.
8. Fonts: Readex Pro (display) + IBM Plex Sans Arabic (body), loaded in `resources/views/app.blade.php`.

## Current frontend (what exists)

- `resources/js/pages/`: `Home`, `Login`, `Upload`, `Salaries/*`, `Attendance/*`, `Purchases/*`
- `resources/js/layouts/AppShell.tsx` (top bar, nav, month selector, toasts via Inertia flash)
- `resources/js/components/`: `Money`, `StatusPill`, `AppDialog`, `ConfirmDialog`, `MonthPicker`, `ReceiptPicker`, `QrUploadDialog`, `SegmentedControl`, `StatTile`, `EmptyState`, `Field`, `MoneyInput`, plus shadcn/radix primitives in `components/ui/`
- `resources/js/lib/`: `http.ts` (fetch JSON client with CSRF; Inertia v3 has no axios), `months.ts`, `money.ts`, `image.ts` (browser compression)
- `resources/js/types/models.ts`: the prop types
- Stack: Laravel 13, Inertia v3 (`@inertiajs/react`), React 19 with React Compiler, TypeScript, Tailwind CSS v4, radix-ui, lucide-react, sonner, qrcode.react, date-fns. Lint and format: `npx vp check --fix`. Types: `npx tsc --noEmit`. Build: `npm run build`. PHP tests: `php artisan test --compact`.

## Packages

New, high-quality npm packages are approved when they clearly improve the experience: animation, tables, number animation, command palette, drawers, date pickers, charts and similar. Requirements: React 19 compatible, actively maintained, work in RTL, reasonable bundle size. Pin exact versions that already exist on npm.
