<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Billora — Product and Brand Brief

Use this file as the default product context for every design, copy, and implementation decision in this repository. Do not ask the user to restate Billora's purpose, brand, palette, typography, or visual direction unless a request intentionally changes them.

## Product in one sentence

**Billora is a quick, dependable billing and inventory workspace for restaurants, messes, cafes, food counters, and other small shops.** It helps a small team manage items, create bills, accept payments, track stock, and understand daily business from one place.

The brand promise is: **All Your Billing, One Place.**

## Product character

Billora should feel:

- Fast enough for a busy checkout counter.
- Friendly enough for a first-time shop owner.
- Trustworthy enough for money, stock, taxes, and end-of-day totals.
- Modern and polished, but never corporate, luxurious, or overly technical.
- Calm under pressure: screens should reduce decisions and make the next action obvious.

Favor plain language, predictable interactions, and visible totals. The product is an operational tool, so clarity beats decoration.

## People and permissions

- **Owner / Admin:** manages the business profile, users, categories, items, inventory, taxes, reports, backups, and settings.
- **Cashier / Staff:** finds items, builds a cart, adjusts quantity, checks out, records payment, prints or shares a receipt, and reviews bills allowed by their role.

Respect role boundaries in both the interface and data access. Do not show an action that the current role cannot complete.

## Current phase: connected workspaces

Billora uses Supabase Auth and Postgres. A designated admin signs in by email and creates individual username and password logins for employees.

- Enforce workspace scope and role permissions in Postgres policies and server-side operations. Derive the current workspace from the verified account membership.
- Keep admin enrollment limited to the single trusted Supabase Auth account and keep public signup disabled. Provision employee logins only through the authenticated admin workflow.
- Use the business profile for checkout, receipts, and reporting. Preserve historical receipt and pricing information when business settings or products change.
- Use local React state for draft UI and interaction feedback. Persist shared records and held bills through the authenticated workspace API.

## Core product areas

Treat the following as the expected Billora product model:

1. **Dashboard:** today's sales, bill count, order/item count, trends, best sellers, low-stock cues, and quick actions.
2. **Billing / POS:** searchable item catalog, category filters, cart/current bill, quantities, discounts, taxes, totals, hold/resume bill, and checkout.
3. **Inventory and items:** item name, category, price, image, availability, stock quantity, unit, low-stock threshold, and active/inactive state.
4. **Categories:** lightweight grouping and status management.
5. **Bills:** bill number, date/time, cashier/customer when available, line items, subtotal, discount, tax, grand total, payment method, and payment status.
6. **Payments and receipts:** cash and digital methods, amount received/change where relevant, completion state, printable/shareable receipt, and business details.
7. **Reports:** sales over time, bills, items sold, best sellers, payment mix, taxes, and inventory signals.
8. **Users and settings:** roles, business information, tax/charges, printer, currency, backup/restore, profile, and app preferences.

The reference mockup and schema live in `docs/design-mockup.jpeg` and `docs/database-design.jpeg`. They communicate intent, not a pixel-perfect or schema-perfect contract. Improve usability and accessibility while preserving the workflows they describe.

## Naming rules

- The product and brand name is always **Billora** in prose and **BILLORA** only when an all-caps display treatment is visually appropriate.
- Never rename the product to “Mess Billing,” “Billing System,” or another generic label. Those words in older mockups are legacy reference content.
- Use the tagline **All Your Billing, One Place.** for splash, marketing, or onboarding contexts; do not repeat it throughout operational screens.
- Name features by the shop owner's task: “New bill,” “Items,” “Inventory,” “Today's sales,” and “Payment.” Avoid engineering terms such as “food entity” or “bill item record” in the UI.
- The logo reference is `docs/image.png`; the mark combines a chef/food silhouette with a spoon and fork. Keep the recognizable silhouette, generous clear space, and single-color readability.

### Shared logo rule

- **Use `src/components/brand-mark.tsx` (`BrandMark`) for every Billora logo on every page.** The sign-in logo is the canonical source; do not redraw the mark, assemble it from different icons, create page-specific logos, or replace it with another food icon.
- Resize the existing shared component rather than changing its artwork: use the default mark for sign-in and standard contexts, `size="sidebar"` for the dashboard rail, `size="header"` for compact headers, and `large` only for splash/hero contexts.
- Apply visual sizing through the component’s supported variants plus its `className`. Keep the chef-hat and utensil composition proportionally scaled together; never shrink only the surrounding container.

## Visual direction: Fresh Ledger

The visual system is called **Fresh Ledger**: deep restaurant green for trust, fresh mint for ease, and a restrained turmeric accent for warmth and food culture. Interfaces should be bright, clean, and tactile rather than dark or neon.

### Color palette

| Role | Token | Hex | Use |
| --- | --- | --- | --- |
| Primary | Billora Emerald | `#087747` | Primary actions, active navigation, key totals, focus accents, brand fields |
| Primary dark | Counter Green | `#045B39` | Sidebar, pressed states, strong brand surfaces, high-contrast headings |
| Secondary | Fresh Mint | `#DDF3E7` | Selected rows, filters, success-tinted panels, gentle highlights |
| Tertiary | Turmeric Gold | `#F2B84B` | Low-stock attention, charts, badges, and small moments of warmth |
| Canvas | Porcelain | `#F6F8F6` | App background |
| Surface | White | `#FFFFFF` | Cards, forms, dialogs, receipts |
| Ink | Charcoal Leaf | `#18211D` | Primary text |
| Muted ink | Sage Gray | `#68756E` | Secondary text and metadata |
| Border | Mist | `#DCE5E0` | Dividers, inputs, table rules |
| Destructive | Hibiscus | `#D6455D` | Delete, void, failed, destructive confirmation only |
| Information | Clear Blue | `#3478C7` | Neutral information and selected chart series |

Use emerald as a purposeful signal, not as a wash over every element. Most operational screens should be Porcelain and White with Charcoal Leaf text. Mint supports selected or successful states. Turmeric should stay below roughly 10% of a screen and must not replace a clear warning label or icon.

Never rely on color alone to communicate payment, stock, or error states. Maintain WCAG AA contrast for text and controls.

### Typography

- **Brand name, page titles, hero headings, and important totals:** **Manrope**, weights 600–800. Its rounded geometry should make Billora feel capable and welcoming.
- **Small words, body copy, labels, inputs, tables, buttons, and navigation:** **Inter**, weights 400–600. It should remain highly readable on compact POS and mobile screens.
- Use system sans-serif fallbacks when fonts are unavailable. Load fonts through the Next.js-supported font mechanism rather than ad-hoc CSS imports.
- Use sentence case for UI copy. Reserve all caps for the BILLORA wordmark, tiny status labels, or receipt conventions.
- Use tabular numerals for currency, quantities, timestamps, dashboard metrics, and aligned table columns.

Suggested type scale: 32/38 for a major page or welcome title, 24/30 for page titles, 18/24 for section titles, 14/20 for body and controls, and 12/16 for metadata. Avoid body text below 12px.

### Shape, spacing, and depth

- Use an 8px spacing rhythm, with 4px only for tight icon/text relationships.
- Use 12px radii for inputs and compact cards, 16px for primary cards and panels, and pill shapes only for statuses, filters, and segmented controls.
- Prefer thin Mist borders and subtle shadows. Avoid glassmorphism, heavy gradients, glossy effects, and floating layers without purpose.
- Keep touch targets at least 44×44px. A cashier should be able to operate the primary POS flow quickly on a touch screen.
- Use Lucide-style outline icons consistently. Pair unfamiliar icons with text.

### Layout and component behavior

- Desktop admin screens use a stable left navigation, a simple top bar, and a responsive content grid.
- The POS prioritizes item search and the current bill. Keep the total and checkout action visible; avoid forcing scrolling to learn the amount due.
- Mobile layouts collapse navigation cleanly, preserve search/filter access, and use a sticky bill summary or explicit cart entry point.
- Tables should have calm row density, aligned numeric columns, visible status, and clear empty/loading/error states. On small screens, convert rows into readable cards rather than squeezing columns.
- Forms use persistent labels above fields, concise helper/error text, and one obvious primary action. Do not use placeholder text as the only label.
- Receipts are optimized for monochrome printing even when the app UI uses color.
- Charts use direct labels and a small consistent series palette. Never create a decorative chart when a number or short list is clearer.

## Content voice

Write like a calm, capable counter assistant: brief, warm, and specific.

- Prefer “Bill saved” over “Operation completed successfully.”
- Prefer “Only 3 left” over “Inventory threshold warning.”
- Prefer “Start a new bill” over “Initialize transaction.”
- Confirm destructive actions by naming the consequence: “Void bill BILL-00123? This cannot be undone.”
- Empty states should explain what belongs here and offer one useful next action.
- Never invent sales, stock, tax, or payment facts. Clearly label demo data.

Use locale-aware formatting. The current references show Indian rupees and GST, but currency, taxes, date format, and payment methods should come from business settings rather than being hard-coded.

## Interaction principles

1. Keep the most common billing path keyboard- and touch-friendly.
2. Show immediate feedback when an item is added, a payment completes, or stock changes.
3. Prevent duplicate checkout while payment is processing.
4. Preserve entered bill data across recoverable errors.
5. Put irreversible actions behind explicit confirmation and appropriate permissions.
6. Make loading, empty, offline, validation, success, and failure states part of the initial design—not afterthoughts.
7. Accessibility is a feature: semantic structure, visible focus, useful labels, reduced-motion support, and screen-reader announcements for dynamic totals are expected.

## Decision filter for future agents

Before shipping a screen or flow, verify:

- Does it unmistakably say **Billora**, not a legacy product name?
- Does it use the Fresh Ledger palette and the Manrope/Inter hierarchy?
- Can a busy owner or cashier understand the next action within a few seconds?
- Are totals, stock, payment state, and destructive consequences unambiguous?
- Does it work at mobile and desktop sizes, with keyboard and touch?
- Are realistic empty, loading, error, success, and permission states covered?
- Does it reuse existing components and tokens instead of introducing a competing visual language?

When requirements are incomplete, choose the option that makes billing faster, financial state clearer, and the interface calmer while staying within this brief.
