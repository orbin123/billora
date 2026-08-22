## 1. Stack (optimized for speed + "good architecture" look)

| Piece | Choice | Why |
|---|---|---|
| Framework | **Next.js 15, App Router, TypeScript** | Required, and App Router = modern, impresses a dev friend |
| Styling | **Tailwind CSS + shadcn/ui** | Fast to build responsive UI, looks professional out of the box |
| Database | **SQLite + Prisma** (not Postgres) | Zero setup — no server to configure tonight. Prisma schema maps 1:1 to your ERD image, and you can swap to Postgres later with one line change |
| Auth | Simple **JWT in httpOnly cookie** (skip NextAuth) | NextAuth is overkill and eats setup time for one demo login |
| State (client) | **Zustand** for cart/bill state | Simpler than Redux, looks intentional |
| Server data | **Next.js Server Actions** (no separate API layer needed) | Fewer files, still "proper" architecture |

### Mac setup (run these first)
```bash
# Node via nvm (avoids version conflicts)
brew install nvm
mkdir ~/.nvm && echo 'export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install --lts
nvm use --lts

# Package manager
npm install -g pnpm

# Create project
pnpx create-next-app@latest billora --typescript --tailwind --app --src-dir --import-alias "@/*"
cd billora
pnpm dlx shadcn@latest init
pnpm add prisma @prisma/client zustand
pnpm dlx prisma init --datasource-provider sqlite
```

## 2. Folder architecture (feature-based, not type-based)

This is the thing that makes it look like "good architecture" instead of a tutorial project:

```
src/
  app/
    (auth)/login/page.tsx
    (dashboard)/
      dashboard/page.tsx
      categories/page.tsx
      foods/page.tsx
      billing/page.tsx          # cashier POS screen
      bills/page.tsx            # today's bills
      bills/[id]/page.tsx       # bill details
      reports/page.tsx
      users/page.tsx
      settings/page.tsx
      profile/page.tsx
      layout.tsx                # shared sidebar/nav shell
    api/... (only if you need webhooks; otherwise skip, use server actions)
    layout.tsx
    page.tsx                    # splash → redirect to login

  features/                     # <- the "modules" your friend will notice
    auth/
      actions.ts                # login server action
      schema.ts                 # zod validation
    categories/
      actions.ts
      components/CategoryTable.tsx
      components/CategoryForm.tsx
    foods/
      actions.ts
      components/FoodGrid.tsx
      components/FoodForm.tsx
    billing/
      actions.ts
      components/POSGrid.tsx
      components/CartPanel.tsx
      store.ts                  # zustand cart store
    bills/
      actions.ts
      components/BillsTable.tsx
      components/BillDetail.tsx
      components/PaymentModal.tsx
    reports/
      actions.ts
      components/SalesChart.tsx
    users/
      actions.ts

  components/
    ui/                         # shadcn generated components
    shared/
      Sidebar.tsx
      TopNav.tsx
      MobileNav.tsx             # bottom tab bar for mobile

  lib/
    prisma.ts                   # prisma client singleton
    auth.ts                     # session helpers
    utils.ts

  prisma/
    schema.prisma
    seed.ts                     # demo data — important for tomorrow
```

**Why this matters**: each `features/x` folder owns its own actions + components. A dev looking at this immediately sees the boundaries. This is the single highest-leverage thing you can do for "impress my friend" with limited time.

## 3. Database schema (from your ERD)

Straight translation of your image into Prisma:

```prisma
// prisma/schema.prisma
model User {
  id        BigInt   @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      Role
  createdAt DateTime @default(now())
}

enum Role {
  admin
  cashier
}

model Category {
  id          BigInt   @id @default(autoincrement())
  name        String
  description String?
  status      Boolean  @default(true)
  foods       Food[]
}

model Food {
  id         BigInt     @id @default(autoincrement())
  categoryId BigInt
  category   Category   @relation(fields: [categoryId], references: [id])
  name       String
  price      Decimal
  image      String?
  status     Boolean    @default(true)
  billItems  BillItem[]
}

model Bill {
  id            BigInt     @id @default(autoincrement())
  billNumber    String     @unique
  subtotal      Decimal
  grandTotal    Decimal
  paymentMethod String
  paymentStatus String
  createdAt     DateTime   @default(now())
  items         BillItem[]
}

model BillItem {
  id       BigInt  @id @default(autoincrement())
  billId   BigInt
  bill     Bill    @relation(fields: [billId], references: [id])
  foodId   BigInt
  food     Food    @relation(fields: [foodId], references: [id])
  foodName String
  price    Decimal
  quantity Int
  total    Decimal
}
```

One deliberate change from your ERD: `status` and `role`/nullable fields as native Prisma types instead of raw `TINYINT`/`ENUM` — this is what a real Next.js codebase looks like, and it's a natural thing to point out to your friend as an intentional decision, not a mistake.

## 4. Screen → route mapping (all 15 screens from your mockup)

| Screen | Route | Priority |
|---|---|---|
| Splash | `/` (redirect logic) | Low — 1 min work |
| Login | `/login` | **Must have** |
| Dashboard | `/dashboard` | **Must have** |
| Cashier POS | `/billing` | **Must have** (core demo flow) |
| Category mgmt | `/categories` | **Must have** |
| Food mgmt | `/foods` | **Must have** |
| Create/edit food | modal or `/foods/new` | Medium |
| Today's bills | `/bills` | **Must have** |
| Bill details | `/bills/[id]` | **Must have** |
| Payment screen | modal inside `/billing` | **Must have** |
| Reports | `/reports` | Nice-to-have |
| Settings | `/settings` | Skip or stub |
| User management | `/users` | Nice-to-have |
| Profile | `/profile` | Skip or stub |
| Receipt | print view in `/bills/[id]` | Medium |

## 5. What to actually build tonight (realistic scope)

You cannot polish all 15 screens by tomorrow and have them work well. Cut like this:

**Core demo path (build first, make this flawless):**
Login → Dashboard → Categories → Foods → POS billing (add items, see cart) → Checkout → Payment → Receipt → Today's Bills → Bill Detail

**Stub or simplify (structurally present, minimal logic):**
Reports (static chart with seeded numbers), Settings, User management, Profile — these can be "coming soon" or barely-functional pages. A dev friend respects a working core over a shallow full clone.

This is the single most important decision — say it out loud tomorrow: *"I prioritized the billing flow end-to-end over covering every screen shallowly."* That's a legitimate engineering call, not an excuse.

## 6. Responsive strategy

- Build **mobile-first** with Tailwind (`sm:`, `md:`, `lg:` breakpoints)
- Sidebar (image 3) → becomes a **bottom tab bar on mobile**, full sidebar on `lg:` and up. One `Sidebar.tsx` component, conditionally rendered by breakpoint, not two separate builds.
- POS grid (image, screen 4) → `grid-cols-2` on mobile, `grid-cols-4` on desktop
- Use `useMediaQuery` hook or just Tailwind classes — don't build a JS-detection layer, that's wasted time tonight

## 7. Working with an AI coding agent effectively

Since you're using Codex/Claude Code to actually generate the code, the way you prompt it matters more than the tool:

1. **Scaffold first, features second.** Have it generate the folder structure and Prisma schema in one pass before touching UI.
2. **One feature folder per prompt.** Don't ask for "the whole app" — ask for `features/billing/` completely (store + actions + components), review, then move to the next. This keeps output coherent and debuggable.
3. **Give it the schema and the screen mapping table above as context** in every prompt for a feature — it'll stay consistent instead of drifting.
4. **Seed data first.** Ask it to write `prisma/seed.ts` with realistic data matching your screenshots (same food names, prices) — this makes your demo look real instead of empty.
5. **Commit after every working feature** (`git commit`) so if an AI-generated change breaks something, you can roll back fast — critical with a tomorrow deadline.

