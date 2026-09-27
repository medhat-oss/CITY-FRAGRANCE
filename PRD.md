# City Fragrance — Product Requirements Document (PRD)

**Version:** 1.0
**Status:** Ready for automated test-plan generation
**App URL (production):** `https://city-fragrance.malk35t-754.workers.dev`
**Document purpose:** This document is a machine-parseable specification of the City Fragrance web application. It enumerates all routes, endpoints, authentication rules, user flows, validation rules, and expected behaviors so that automated testing tools (e.g., TestSprite) can generate complete, accurate test plans.

---

## 1. Project Overview

City Fragrance is an e-commerce platform for a luxury fragrance brand based in Egypt. It consists of three integrated surfaces:

| Surface | Route(s) | Purpose |
|---|---|---|
| **Public Storefront** | `/`, `/collections/*`, `/product/*`, `/order-payment/*`, `/about`, `/privacy-policy`, `/stores` | Browse products, manage cart, place orders, pay or confirm via WhatsApp. |
| **Cashier POS System** | `/cashier/login`, `/cashier` | In-store point-of-sale: process sales, manage cart/discounts, track stock, open/close shifts. |
| **Admin Panel** | `/admin`, `/admin/login`, `/admin/*` | Product/site/order/gift-set/analytics/staff management. |

**Brand:** Dark Navy `#09142E`, Gold `#C5A880`, white. Dark theme only. Language baseline English (`en`), left-to-right; Arabic/RTL layout infrastructure exists.

---

## 2. Technology Stack

- **Frontend:** Next.js 15.5 (App Router), TypeScript, Tailwind CSS, React 19
- **Backend:** Next.js API Route Handlers (App Router)
- **Database:** PostgreSQL via Prisma ORM 7.8 (Neon serverless adapter)
- **Deployment:** Cloudflare Workers (via OpenNext), wrangler
- **Auth:** JWT (HS256, `jose`), httpOnly cookies, PBKDF2-SHA256 password hashing (100,000 iterations)
- **Images/Media:** Cloudinary uploads (unsigned preset `city_fragrance`)
- **Payments:** Paymob (test-mode mock active; production keys not configured → feature blocked)
- **Email:** Cloudflare Email Sending (`send_email` Workers binding `EMAIL`), non-blocking
- **State:** React Context (Cart, Locale, Theme, Products), `localStorage` for cart persistence

---

## 3. Roles & Permissions

| Role | Description | Access |
|---|---|---|
| `ADMIN` | Full control: products, settings, orders, gift sets, analytics, staff | `/admin/*`, `/cashier/*` |
| `CASHIER` | POS-only operations; can end shifts with shift password | `/cashier/*`; can also open `/admin/*` pages (see 4.2) |

### 3.1 Role-level API enforcement (current state)

| Endpoint | Enforcement |
|---|---|
| `/api/admin/staff` (all methods) | Requires session **and** `role === 'ADMIN'` (403 `Access denied` otherwise) |
| `/api/admin/orders/items` (PUT) | Requires session **and** `role === 'ADMIN'` |
| `/api/auth/login` | Rejects non-`ADMIN` (403 `Access denied`) |
| `/api/auth/cashier-login` | Accepts `CASHIER` or `ADMIN` (403 otherwise) |
| `/api/admin/products`, `/api/admin/settings`, `/api/admin/orders`, `/api/admin/gift-sets`, `/api/admin/analytics`, `/api/admin/shifts` | Cookie-gated only (any valid session) |

---

## 4. Authentication & Session Management

### 4.1 Cookies

| Cookie | Name | Flags | Expiry |
|---|---|---|---|
| Admin session | `admin_session` | httpOnly, secure (prod), sameSite=lax, path=/ | 8 hours (matches JWT) |
| Cashier session | `cashier_session` | same as above | 8 hours |

### 4.2 Access control (middleware — `src/middleware.ts`)

- **Public paths (always allowed):** `/admin/login`, `/cashier/login`, `/robots.txt`
- `/admin/*`: requires cookie `admin_session` **OR** `cashier_session` → else redirect to `/admin/login`
- `/cashier/*`: requires cookie `admin_session` **OR** `cashier_session` → else redirect to `/cashier/login`
- **Session verification fallback order** (`verifySession()`): try `admin_session` first; if invalid/expired, try `cashier_session`; if neither → 401.
- **POS verification order** (`verifySessionForPOS()`): `cashier_session` first (never overridden by admin cookie from another tab), then fallback to `verifySession()`.

**Edge cases to test:**
1. No cookies → `/admin` and `/cashier` both redirect to their respective login pages.
2. Expired `admin_session` cookie + valid `cashier_session` cookie → allowed through (fallback).
3. Tampered `admin_session` cookie alone → rejected.
4. `/admin/login` and `/cashier/login` are reachable while authenticated (no redirect).

### 4.3 Login endpoints

#### `POST /api/auth/login` (Admin login page `/admin/login`)
- Body: `{ email, password }`
- Rate limit: 5 requests/min/IP → 429 with `Retry-After` header + message
- 400 if either field missing (`Email and password are required`)
- 401 `Invalid credentials` if user not found (by email OR username, case-insensitive) or password mismatch
- 403 `Access denied` if role is not `ADMIN`
- Success: clears `cashier_session`, sets `admin_session`, returns `{ success, user: { id, email, username, role } }`
- Frontend redirects to `?redirect=` param or `/admin`

#### `POST /api/auth/cashier-login` (Cashier login page `/cashier/login`)
- Body: `{ email, password }` (username also accepted)
- Rate limit: 5 requests/min/IP → 429
- 400 if missing fields (`Email/Username and password are required`)
- 401 `Invalid credentials` for unknown user/bad password
- 403 `Access denied. Authorized staff only.` if role is neither CASHIER nor ADMIN
- **Side effect:** on success, auto-creates an OPEN `Shift` for the user if none exists
- Success: sets `cashier_session`, returns `{ success, user: { id, email, username, role } }`
- Frontend redirects to `?redirect=` param or `/cashier`

#### Logout endpoints
- `POST /api/auth/logout` — clears `admin_session`; admin UI redirects to `/admin/login`
- `POST /api/auth/cashier-logout` — clears `cashier_session`; POS redirects to `/cashier/login`

#### `GET /api/auth/me?role=CASHIER`
- No session → 401 `{ error: 'Not authenticated' }`
- `?role=CASHIER` → uses `verifySessionForPOS()`; otherwise `verifySession()`
- Success → `{ user: { id, email, username, role } }`
- POS frontend polls this up to 3 attempts (500 ms apart) on boot; failure → redirect `/cashier/login?redirect=/cashier`

### 4.4 Password handling
- `hashPassword`: PBKDF2-SHA256, 100,000 iterations, random 16-byte salt; stored `salt:hash` (base64)
- `verifyPassword`: PBKDF2 verify; legacy `$2`-prefixed hashes verified via bcryptjs
- **Shift password** (default `123456`): stored and compared in **plaintext** — see 6.4

---

## 5. Public Storefront

### 5.1 Homepage (`/`)
Sections in order: Header → Hero → Collection Categories → Best Sellers → Mood section → Services → Footer.

- **Header:** brand, nav links (All Fragrances `/collections/all-fragrances`, Collections `/collections`, Gift Sets `/collections/gift-sets`, Our Story `/about`, Privacy Policy `/privacy-policy`), cart icon with count badge, search overlay, announcement bar (from site settings).
- **Hero:** `heroTitle`, `heroSubtitle`, `heroDescription` from site settings (DB-backed with Cloudinary/JSON fallbacks); `'HIDDEN'` literal hides a field; supports background image (mobile/desktop variants) and video.
- **Collection Categories:** 6 cards — New Arrivals, All Fragrances, Oud Collection, Men's Collection, Women's Collection, Gift Sets — each with image/description from `/api/collections`.
- **Best Sellers:** up to 4 products whose `badge` contains `BEST SELLER` or `SALE` (case-insensitive), newest first; 20 most recent non-draft products considered.
- **Mood section:** video (mobile/desktop) or image; overlay title/subtitle.
- **Footer:** newsletter subscribe form + social links.

### 5.2 Newsletter subscribe (Footer)
- `POST /api/subscribe`, body `{ email }`
- Rate limit: 5/min/IP → 429
- 400 if missing/invalid email
- Duplicate email → `{ success: false, message: 'Already subscribed' }`
- Success → 201 `{ success: true, message: 'Subscribed successfully' }`
- Data persisted to `subscribers.json` and `Subscriber` table

### 5.3 Collections

| Slug | Title |
|---|---|
| `new-arrivals` | New Arrivals |
| `all-fragrances` | All Fragrances |
| `oud-collection` | Oud Collection |
| `mens-collection` | Men's Collection |
| `womens-collection` | Women's Collection |
| `gift-sets` | Gift Sets |

- **`/collections`** — grid of the 6 collections with images/descriptions from `collection-images.json` + `/api/collections`.
- **`/collections/[slug]`**:
  - `gift-sets` → fetches `GET /api/gift-sets`, renders gift-set cards (image, name, description, included-product chips, price) linking to `/collections/gift-sets/[id]`.
  - Other slugs → products from `useProducts` (drafts filtered out), filtered by collection membership; `all-fragrances` shows all products.
  - Empty state message per slug when no products.
  - Product card shows: image, badge, category, name, notes (`top • middle • base`), price (strikethrough sale price when present).
- **`/collections/gift-sets/[id]`** — gift-set detail page.

### 5.4 Product detail (`/product/[id]`)
- Route: `GET /product/[id]` — dynamic (ƒ), loading/error boundaries present.
- Product detail client component: image gallery, name, notes, description, price + sale price, add-to-cart, buy-now.

### 5.5 Cart behavior (client-side, persisted)
- **localStorage key:** `city_fragrance_cart`
- `addToCart(product, qty=1)`: stock cap enforced (`stock ?? 999`); exceeding → toast error `The requested quantity exceeds available luxury stock / Only {limit} items available`, auto-dismiss ~4.5 s.
- `addGiftSetToCart(giftSet)`: cart id `'gs_' + giftSet.id`, treated as product `type: 'Gift Sets'`.
- `updateQuantity(id, qty)`: qty < 1 removes item; capped at stock.
- `removeFromCart(id)`, `clearCart()`, `cartTotal` = Σ `(salePrice ?? price) * qty`, `cartCount` = Σ qty.
- `buyNow(product, qty)`: stock-validated, **replaces** entire cart with the single item.
- Cart drawer: slide-in, items with qty +/- controls, remove, subtotal, "Proceed to Checkout" → `/order-payment`.

### 5.6 Locale / direction
- `LocaleContext` provides `{ locale, dir, setLocale, toggleDirection }` (default `en` / `ltr`).
- Components (Header, Footer, Hero, CollectionCategories, BestSellers, ServicesSection) consume `dir` for RTL-aware layout.
- **Note for testers:** no visible language-toggle button currently exists in the UI; locale infrastructure is present but the toggle is not surfaced. Direction changes are not user-triggerable from the page UI today.

### 5.7 Theme
- Theme context hardcodes dark mode on; no light-mode toggle.

---

## 6. Cashier POS System

### 6.1 Login flow (`/cashier/login`)
- Fields: Username or Email (required), Password (required)
- Submits `POST /api/auth/cashier-login`
- Errors shown inline (401/403/429 messages); success → redirect `/cashier` (or `?redirect=`)
- Link "← Back to Store" → `/`

### 6.2 POS main screen (`/cashier`)
- **Boot sequence:** `GET /api/auth/me?role=CASHIER` (3 retries); unauthorized → redirect to `/cashier/login`; then auto-ensure OPEN shift (`POST /api/admin/shifts` action `open`); then fetch catalog (`GET /api/products` + `GET /api/gift-sets`, no-cache).
- **Header:** brand "CITY FRAGRANCE POS", current user (`username (ROLE)`), **End Shift** button, **Logout** button. Mobile: hamburger drawer with same actions + cart "Sale" badge.

#### Catalog panel
- Filter tabs: All / Perfumes / Gift Sets (client-side).
- Search box (case-insensitive substring on name).
- Product cards: image, GIFT badge for gift sets, **stock badge** (numeric count, or red **OUT** when `stock === 0`), name, price (`formatEGP`).
- Out-of-stock items: disabled (opacity 0.45, `not-allowed`), click does nothing.
- Click item → add to cart; qty capped at stock (alert `Sorry, only {limit} items left in stock`).

#### Cart panel (desktop sidebar / mobile bottom drawer)
- Lines: item, qty with +/- (min 1, max stock), remove (trash).
- Discount field: flat EGP amount (`Math.min(parseFloat(discount)||0, subtotal)`).
- Subtotal, discount amount, grand total (subtotal − discount).
- **Checkout button** → modal.

#### Checkout modal
- Shows Grand Total.
- Customer Name (optional; defaults `POS Walk-in`), Phone (optional; defaults `—`).
- Payment method radio: Cash / Vodafone Cash / InstaPay / Visa (Card).
- Submit → `POST /api/admin/orders` with `source: 'POS'`, `email: ''`, `address: 'In-Store'`, `city: 'In-Store'`, `items` (name/qty/price), `totalPrice` (grand total), `paymentMethod`.
- **401 response → redirect to `/cashier/login`** (lost session); 403 → logged, stays.
- Success → success screen: green check, Order ID, **Print Invoice** (`window.print()`), **New Order** (reset).
- Cart and discount cleared after successful order.

### 6.3 Logout
- `handleLogout`: checks `GET /api/admin/shifts?status=OPEN&cashierId={id}`; if OPEN shift has orders → `confirm()` warning `You have an active shift with orders. Please use "End Shift" to close it properly.`; cancels logout if declined.
- Clears `localStorage` + `sessionStorage`, `POST /api/auth/cashier-logout`, hard redirect to `/cashier/login`.

### 6.4 Shift management

#### Shift password modal (gateway to End Shift)
- Opened via **End Shift** button.
- Field: Shift Password; Verify → `POST /api/admin/shifts` `{ action: 'verify-password', shiftPassword, userId }`.
- Wrong password → 401, inline error `Incorrect shift password`.
- Success → opens End Shift summary modal.

#### End Shift summary modal
- Loads `GET /api/admin/shifts?status=OPEN&cashierId={id}` (401 → login redirect; 403 → alert).
- If no OPEN shift, tries to auto-open one and retries once.
- Displays: Shift started timestamp, Orders Count, Cash, InstaPay, Vodafone Cash, Visa, **Expected Total**.
- Input: **Actual Cash in Drawer** (number ≥ 0); live **Discrepancy** (`actual − expected`, red if ≠ 0, green if 0) shown when actual > 0.
- Confirm → `POST /api/admin/shifts` `{ action: 'close', actualCash, shiftPassword, userId }` (15 s timeout/abort).
- 401 → redirect login; 403 → alert `Access denied...`; failure → alert with server message.
- Success: clears storage, cashier logout, redirect to `/cashier/login`.

#### Shift API rules (`/api/admin/shifts`)
- **GET**: `?status=OPEN` → POS session required; returns the session-user's OPEN shift with aggregated totals, excluding cancelled orders (`notIn: ['Cancelled','CANCELLED','cancelled']`), bucketed by keyword in payment method (`cash`, `instapay`, `vodafone`, `visa`). Non-OPEN: ADMIN sees all CLOSED shifts; CASHIER sees only own.
- **POST actions:**
  - `open`: 400 `{ code: 'SHIFT_ALREADY_OPEN' }` if an OPEN/ACTIVE shift exists; else creates shift (cashier = session user; never trusts client `cashierId`).
  - `verify-password`: compares against `user.shiftPassword || '123456'`; 401 `Incorrect shift password` / 404 unknown user.
  - `close`: same password check; 400 `No active shift found`; computes totals excluding cancelled; `discrepancy = actualCash − expectedTotal`; marks shift CLOSED with `endTime`, writes a `ShiftLog` (non-blocking); returns summary incl. `shiftId`, `cashierName`, `shiftStartedAt`.
  - Unknown action → 400 `Invalid action. Must be one of: open, verify-password, close`.

---

## 7. Admin Panel

### 7.1 Admin login (`/admin/login`)
- Fields: email/username, password → `POST /api/auth/login` (ADMIN role only).
- Success → redirect `/admin` (or `?redirect=`).

### 7.2 Shell & navigation (`/admin` layout)
- Sidebar (desktop) / drawer (mobile): **Products Management** (`/admin`), **Site Customization** (`/admin/settings`), **Orders** (`/admin/orders`), **Gift Sets** (`/admin/gift-sets`), **Analytics & Inventory** (`/admin/analytics`), **Manage Staff** (`/admin/staff`), **Back to Store** (`/`).
- User chip: fetches `/api/auth/me` (3 retries); shows email; **Logout** → `POST /api/auth/logout` → `/admin/login`. No session → "Session unavailable" + Log in link.

### 7.3 Products Management (`/admin`)
- **List:** card grid (image, name, category or "Unisex", collection chips, price + strikethrough salePrice, stock — red bold when 0, Draft/Live badge, Edit/Delete buttons).
- **Add New Product / Edit modal fields:**
  - name (required), category (Men / Women / Oud / Unisex, required)
  - badge, collections multi-select (5 checkboxes: `new-arrivals`, `all-fragrances`, `oud-collection`, `mens-collection`, `womens-collection`)
  - price (required), costPrice (optional), salePrice (optional), stock (required, min 0)
  - top/middle/base notes, description
  - images: multi-upload to Cloudinary (30 s timeout) — direct to `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` with unsigned preset
  - product video: Cloudinary upload (60 s timeout), URL rewritten `f_auto,q_auto`
  - draft/publish toggle
- **Submit normalization:** `type` forced `'Perfume'`; `id` = provided or `'p' + Date.now()`; empty images → `['/images/product-placeholder.png']`; price parseFloat; stock parseInt (0 if empty); `collection` synced to first selected slug.
- **Delete:** `confirm()` dialog; `deletingId` disables row; error → alert.
- **API:** `GET/POST/PUT/DELETE /api/admin/products` with `?t={Date.now()}` cache-busting; `router.refresh()` after mutations.
- GET returns products with parsed `topNotes/middleNotes/baseNotes` (split `' • '`) and `collections: string[]`.
- POST/PUT: upsert by id; replaces `_CollectionToProduct` relations filtered to known slugs; returns `{ success: true, product }`.
- DELETE: 404 if missing; revalidates `/`, `/products`, `/collections/all-fragrances`, `/admin`, `/api/products`.

### 7.4 Site Customization (`/admin/settings`)
- **20 settings keys:** heroTitle, heroSubtitle, heroDescription, announcementText, heroBgImage, heroBgImageDesktop, heroVideoUrl, heroVideoMobile, moodTitle, moodSubtitle, moodImage, moodImageDesktop, moodVideoUrl, moodVideoMobile, womenCollectionVideoUrl, menCollectionVideoUrl, giftSetsVideoUrl, newArrivalsVideoUrl, allFragrancesVideoUrl, oudCollectionVideoUrl.
- Text fields have "Remove" (sets literal `'HIDDEN'`); image/video Remove sets `''`.
- **Uploads:** `POST /api/upload` (FormData `file`) for hero/mood images (30 s) and videos (60 s).
- **Save:** `POST /api/admin/settings` → writes JSON + Prisma `siteSetting` (id `'default'`), revalidates homepage + collection pages + admin/settings; success toast `Settings saved successfully!` (3 s).
- **Manage Collections section:** 6 slugs with per-collection description + banner image (`PUT /api/admin/collections` FormData `file`+`slug`) + video (`/api/upload`) + Save Collection Images (JSON `{ slug, imageUrl, description }`).
- **API GET:** merges DB (unstable_cache, 5 s revalidate, tag `settings`) > Cloudinary raw JSON > local JSON over defaults.
- **API POST:** merges only keys present in body (`''` and `'HIDDEN'` preserved).

### 7.5 Orders (`/admin/orders`)
- **Data:** `GET /api/admin/orders` → `{ orders }` (non-POS `source: { not: 'POS' }`, newest first; items enriched with product images).
- **Polling:** initial load + every **15,000 ms**. When a new top order appears: slide-in alert `🔔 New Order Received!` (customer, orderId, total) + chime (remote audio w/ Web Audio fallback), Dismiss button.
- **Table columns:** Order ID (clickable; red pulsing dot when `ACCEPTED`), Customer, Phone, Governorate, Items (qty × name, per-item cancel ✕), Total (EGP), Payment, Status (dropdown), Date, Time, View.
- **Status workflow (dropdown options per current status):**

  | Current status | Allowed transitions |
  |---|---|
  | `ACCEPTED` | `CONFIRMED`, `CANCELLED` |
  | `CONFIRMED` | `SHIPPED`, `CANCELLED` |
  | `SHIPPED` | `DELIVERED`, `CANCELLED` |
  | `DELIVERED` | *(locked — no options)* |
  | `CANCELLED` | *(locked — no options)* |

- Status change → `PUT /api/admin/orders` `{ orderId, status }`; server re-validates transitions (400 with allowed list on violation), restores stock when cancelling, recalculates shift totals when `shiftId` present, sends status email (non-blocking) on CONFIRMED/SHIPPED/DELIVERED.
- **Item cancellation** (✕ per item): shown only when order status is not CANCELLED/DELIVERED and `items.length > 1`. → `PUT /api/admin/orders/items` `{ orderItemId, orderId }`; server requires ADMIN role; restores product stock; recomputes `totalPrice`; recalculates shift totals; 400 if order CANCELLED/DELIVERED.
- **Order Details modal:** orderId, date/time, status, source, customer (name/email/phone), city/governorate/address/apartment, payment method, **discount rows (code + `- EGP x` when `discountAmount > 0`)**, total, item table (image, name, qty, unit price, subtotal, cancel).
- **Total Revenue badge:** sum of `totalPrice` for orders with status ≠ `'Cancelled'` (exact-case comparison).

### 7.6 Gift Sets (`/admin/gift-sets`)
- **List:** image, name, price, product count, status (Draft yellow / Live green), Edit/Delete.
- **Modal fields:** name (required), description, price (required), costPrice, stock, image (upload via `/api/upload`), multi-select products (checkboxes from `useProducts`), draft/publish toggle.
- **Save:** POST (create) / PUT (edit) `/api/admin/gift-sets` `{ name, description, price, costPrice, stock, isDraft, image, productIds, id? }`; optimistic close, refresh from response.
- **Delete:** `confirm()` → DELETE `{ id }`.
- **GET:** `/api/admin/gift-sets` → `{ giftSets }`.

### 7.7 Analytics & Inventory (`/admin/analytics`)
- **Data:** `GET /api/admin/analytics` → `{ metrics, recentOrders, topSelling, collectionPerformance, lowStockItems, paymentBreakdown, monthlyRevenue }`.
- **Metric cards:** Total Revenue, Net Profit, Total Orders, POS Revenue (+count), Online Revenue (+count), Avg Order Value, Catalog Size (products + gift sets).
- **Charts/lists:** Monthly Revenue bar chart; Top Selling Products (top 3 gold badges, qty + revenue); Payment Methods breakdown (share + count); Collection Performance; **Low Stock Alert** (stock ≤ 3 → red CRITICAL, else amber LOW STOCK; empty state text); Recent Transactions (Order ID, Date, Customer, Channel POS/ONLINE, Payment, Total, Status).
- **Reset Data:** modal requires typing exactly `RESET` to enable Confirm → `POST /api/admin/reset-sales`; success refreshes; failure `alert(data.error)`.

### 7.8 Staff Management (`/admin/staff`)
- **List:** `GET /api/admin/staff` → `{ staff }` (id, email, username, role, shiftPassword, createdAt); role badges ADMIN purple / CASHIER blue.
- **Create Staff modal** (`POST`): username (required), email (required), password (required), role select (CASHIER default / ADMIN). 400 `All fields are required`; 400 `Staff account already exists with this email or username` (case-insensitive duplicate check); password hashed; `shiftPassword` defaults `'123456'`; lowercase email/username persisted; `name = username`.
- **Change Shift Password** (`PATCH`): CASHIER only; new password min length 3 (400 if shorter); stored plaintext; success message, modal closes after 1.2 s.
- **Delete** (`DELETE { id }`): primary admin `admin@cityfragrance.com` protected (client blocked with alert + server 400); others `confirm()`.
- **View Shifts:** link per user → `/admin/staff/[userId]/shifts` and `/admin/staff/[userId]/shifts/[shiftId]/orders`.

---

## 8. Order Lifecycle (server-side)

### 8.1 Status state machine
```
ACCEPTED → CONFIRMED → SHIPPED → DELIVERED
   └──────── any status ───────→ CANCELLED
```
- Terminal states: `DELIVERED`, `CANCELLED` — no transitions allowed (400 server-side, locked UI).
- Status matching in API comparisons is case-insensitive (uppercased), but display preserves stored case.

### 8.2 `POST /api/admin/orders` (create — used by web checkout AND POS)
Request body: `{ customerName, phoneNumber, email, address, apartment, city, governorate, items: [{id?, name, quantity, price}], totalPrice, paymentMethod?, source?, discountCode?, discountAmount? }`

Processing order:
1. **Source resolution:** `POS` only honored with valid cashier session (CASHIER/ADMIN); else `WEB`. POS requires an OPEN shift (error `No active shift found. Please open a shift first.`).
2. Generates `orderId` (`CF-` for web, `POS-` prefix for POS) + per-item ids if missing.
3. Creates Order (status `ACCEPTED`, source, cashierId/shiftId from **session** — never client-supplied).
4. **Stock check + deduction:** per unique product name; insufficient stock → 400 `Insufficient stock for "{name}": requested X, available Y` (order NOT rolled back if products missing by name — only matched products decremented).
5. **Coupon increment:** if `discountCode` → `usedCount + 1` (non-blocking, logged).
6. **JSON file sync:** products.json / gift-sets.json stock decrement (non-blocking).
7. **Notification email** (non-blocking): order confirmation sent when `email` present.
8. Response: `{ success: true, order }`.

### 8.3 `PUT /api/admin/orders` (status update)
Request: `{ orderId, status }`
1. 404 `Order not found`.
2. Validates transition against state machine → 400 with allowed list.
3. **Cancellation** → restores stock per item (by product name match).
4. Updates status.
5. Cancellation → JSON file stock restore (non-blocking).
6. **Shift totals recalc** when `shiftId` present (excludes cancelled; buckets cash/instapay/vodafone/visa).
7. **Status email** (non-blocking) for CONFIRMED/SHIPPED/DELIVERED when `email` present.
8. Response: `{ success: true, order }`.

### 8.4 `PUT /api/admin/orders/items` (cancel single item)
Request: `{ orderId, orderItemId }` — ADMIN role required.
1. 400 if ids missing; 404 `Order not found`; 400 `Cannot modify an order with status "{status}"` when CANCELLED/DELIVERED; 400 `Item not found in order`.
2. Removes item, restores its stock, recomputes `totalPrice` from remaining items.
3. Recalculates shift totals when `shiftId` present.
4. Returns updated order + `removedItem`.

---

## 9. Coupons & Discounts

### 9.1 Seeded coupons

| Code | Discount | Max uses | Status |
|---|---|---|---|
| `WELCOME10` | 10% | 100 | Active |
| `SAVE20` | 20% | 50 | Active |

### 9.2 `POST /api/validate-coupon`
- Rate limit: 10/min/IP → 429.
- 400 if code missing.
- Lookup: case-insensitive (uppercased trim).
- Responses (200 unless noted): not found → `{ valid: false, error: 'Invalid coupon code.' }`; inactive → `{ valid: false, error: 'This coupon code is no longer active.' }`; exhausted → `{ valid: false, error: 'This coupon code has reached its usage limit.' }`; valid → `{ valid: true, discountPct }`.
- Client checkout: applies `round(cartTotal × pct/100)` discount; disabled input + "Applied" button after success; error message on failure; rate-limit message surfaced on 429.

### 9.3 POS discount
- Flat EGP amount, capped at subtotal (`Math.min`), applied before grand total. **Not** a coupon — no persistence of discount code in POS orders.

---

## 10. Checkout & Payment Flows

### 10.1 `/order-payment` (web checkout)
- **Guard:** empty cart → "Your cart is empty" + Return to Store.
- **Contact:** email (required), "Email me with news and offers" checkbox (no backend effect).
- **Delivery:** country (Egypt only), first/last name (required), address (required), apartment (optional), city (required), governorate (required dropdown, dynamic from `/api/settings`), phone (required).
- **Shipping:** single "Standard Shipping" option; cost from governorate rate map (`/api/settings` shippingRates, fallback defaults: Cairo/Giza 85, ... New Valley 200 EGP). Shipping cost shown; `—` when 0/unset.
- **Payment:** three choices — Vodafone Cash, InstaPay, Cash on Delivery (COD note: WhatsApp deposit <15% mentioned). Must select one, else inline error `Please select a payment method`.
- **Order summary panel:** items (image, name, notes, qty badge, price), discount code input + Apply, price breakdown (Subtotal, Shipping, Discount, Total = cartTotal + shipping − discount).
- **Place Order:** POST `/api/admin/orders` (source WEB, email captured) → success → `clearCart()` → redirect:
  - `instapay` → `/order-payment/instapay?orderId={id}`
  - `vodafone` → `/order-payment/vodafone-cash?orderId={id}`
  - `cod` → `/order-payment/success?orderId={id}`
- Failure: `paymentError` shown; `isProcessing` false.

### 10.2 Payment method pages (`/order-payment/instapay`, `/order-payment/vodafone-cash`)
- Reads `orderId` from query.
- Fetches `GET /api/settings` → `paymentDetails[method]` (title, number, note) — dynamic DB values with static fallbacks (InstaPay `01092748940`, Vodafone Cash `01044415982`).
- **Confirm Payment via WhatsApp** → `wa.me/{NEXT_PUBLIC_WHATSAPP_NUMBER||201044415982}?text=Hello, I have completed the payment for order #{orderId} ({method})`.
- **"I'll do this later"** → `/order-payment/success?orderId={orderId}`; Back to Store.

### 10.3 Success page (`/order-payment/success`)
- Green check, "Order Received", "Your order has been received successfully", `Order #{orderId}`, WhatsApp confirm CTA (`Hello, I would like to confirm my order #{orderId}`), Back to Store.

### 10.4 `POST /api/checkout` (Paymob gateway)
- Rate limit: 5/min/IP → 429 + `Retry-After`.
- 400 `Missing required order fields.` without `amount`, `firstName`, `email`, `phone`.
- **Test mode** (active when `NEXT_PUBLIC_PAYMENT_MODE === 'test'` or keys absent): ~650 ms delay; mock token `TEST_{CARD|WALLET}_{ts}_{rand}`; mock Paymob iframe redirect URL; returns `{ success: true, mode: 'test', paymentKey, redirectUrl, order: {...} }`.
- **Production mode:** returns 503 `Production keys not configured.` (blocked until Paymob credentials provided).

---

## 11. Email Notifications

| Trigger | Event | Recipient | Template |
|---|---|---|---|
| Order created (POST orders, web checkout) | `sendOrderConfirmation` | `order.email` | Confirmation — Order ID, items table, totals, delivery details, status badge `ACCEPTED`, WhatsApp CTA |
| Status → `CONFIRMED`/`SHIPPED`/`DELIVERED` (PUT orders) | `sendOrderStatusUpdate` | `order.email` | Status update — same structure, status-specific copy |

- **Sender:** `orders@cityfragrance.com` ("City Fragrance") via Cloudflare `send_email` binding `EMAIL` (placeholders until custom domain onboarded).
- **Non-blocking:** failures are caught and logged; never affect the order API response.
- **Not sent** for: orders without email, POS orders (email `''`), CANCELLED transitions.

---

## 12. API Endpoint Reference

### 12.1 Public endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/products` | none | Product list (incl. sale price, images, notes) |
| GET | `/api/gift-sets` | none | Gift-set list |
| GET | `/api/collections` | none | Collection images/descriptions/videos |
| GET | `/api/settings` | none | `{ shippingRates, paymentDetails, whatsappNumber }` (DB w/ fallbacks) |
| POST | `/api/subscribe` | none | Newsletter subscribe (5/min/IP) |
| POST | `/api/validate-coupon` | none | Coupon validation (10/min/IP) |
| POST | `/api/checkout` | none | Paymob gateway (test-mode mock) |

### 12.2 Auth endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Admin login (5/min/IP, ADMIN only) |
| POST | `/api/auth/cashier-login` | POS login (5/min/IP, CASHIER/ADMIN, auto-open shift) |
| POST | `/api/auth/logout` | Clear admin session |
| POST | `/api/auth/cashier-logout` | Clear cashier session |
| GET | `/api/auth/me` | Current session (`?role=CASHIER` variant) |

### 12.3 Admin endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET/POST/PUT/DELETE | `/api/admin/products` | cookie | Product CRUD |
| GET/POST | `/api/admin/settings` | cookie | Site settings read/write |
| GET/PUT | `/api/admin/collections` | cookie | Collection images/descriptions |
| GET | `/api/admin/orders` | cookie | Order list (+images) |
| POST/PUT | `/api/admin/orders` | cookie | Create order / update status |
| PUT | `/api/admin/orders/items` | **ADMIN role** | Cancel single item |
| GET/POST | `/api/admin/gift-sets` | cookie | Gift-set list/create (PUT/DELETE also present) |
| GET | `/api/admin/analytics` | cookie | Analytics payload |
| POST | `/api/admin/reset-sales` | cookie | Reset sales data |
| GET/POST | `/api/admin/shifts` | POS session | Shift open/verify/close/list |
| GET | `/api/admin/shift-logs` | cookie | Shift log list |
| GET/POST/DELETE/PATCH | `/api/admin/staff` | **ADMIN role** | Staff CRUD + shift password |
| GET | `/api/admin/staff/shifts` | cookie | Staff shifts |
| GET | `/api/admin/staff/shifts/[shiftId]/orders` | cookie | Shift's orders |
| POST | `/api/upload` | cookie | Media upload (images/videos) |

---

## 13. Data Model Summary

- **Order:** orderId (unique), customerName, phoneNumber, email, address, apartment, city, governorate, items (JSON), totalPrice, discountCode, discountAmount, status, date, paymentMethod, source (WEB/POS), cashierId, shiftId, timestamps.
- **Shift:** cashierId, cashierName, startTime, endTime, status (OPEN/CLOSED), totalCash, totalInstaPay, totalVodafoneCash, totalVisa, actualCash, expectedTotal, discrepancy, orderCount.
- **Product:** id, name, type, category, collection(s) via many-to-many, isDraft, badge, notes, description, orientation, concentration, volume, price, costPrice, salePrice, images (JSON), videoUrl, stock.
- **Collection:** slug (unique), name; **CollectionImage:** slug, image, description.
- **GiftSet:** id, name, description, price, costPrice, isDraft, image, productIds (JSON), stock.
- **Subscriber:** email (unique).
- **User:** email (unique), username (unique), password (PBKDF2), name, role (ADMIN/CASHIER), shiftPassword (plaintext, default `123456`).
- **ShiftLog:** userId, userName, shiftId, shiftStartedAt, shiftEndedAt, ordersCount, cashExpected, instapayExpected, vodafoneCashExpected, visaExpected, totalExpected, actualCashInDrawer.
- **Coupon:** code (unique), discountPct, maxUses, usedCount, active.
- **SiteSetting:** single row `id='default'` with ~40 content/size keys + paymentDetails, shippingRates, whatsappNumber (JSON/string).

---

## 14. Cross-cutting Behaviors

### 14.1 Rate limiting (per-process in-memory, keyed by IP)
| Endpoint | Limit |
|---|---|
| `/api/auth/login`, `/api/auth/cashier-login` | 5/min |
| `/api/checkout` | 5/min |
| `/api/validate-coupon` | 10/min |
| `/api/subscribe` | 5/min |
| Response: 429 + `Retry-After` header + message with retry-after seconds | |

### 14.2 SEO & metadata
- `/sitemap.xml` (built-in convention; dynamic product/gift-set URLs at runtime), `/robots.txt`.
- Bilingual metadata (en/ar), OpenGraph, Twitter cards, JSON-LD Organization + WebSite.
- Middleware does not block these paths.

### 14.3 Error/loading boundaries
- Root `error.tsx` + per-route `error.tsx` (collections/[slug], product/[id], order-payment, cashier, all admin sub-routes) → branded dark-navy fallback with retry.
- `loading.tsx` on stores, collections, order-payment, admin dashboard.
- All fetch failures in client pages are non-fatal (logged; fallback values/empty states shown).

### 14.4 Currency formatting
- `formatEGP(n)` → EGP-formatted; POS and storefront use it; totals displayed with 2 decimals in checkout.

---

## 15. Key User Journeys (for test scenario generation)

### J1. Public browse + cart
1. Visit `/` → hero, collections, best sellers render (empty-state tolerant).
2. Open a collection (`/collections/mens-collection`) → products listed.
3. Open product `/product/[id]` → details.
4. Add to cart (stock limit respected) → cart drawer badge updates.
5. Add quantity beyond stock → toast error, no change.
6. Buy Now replaces cart with single item.
7. Cart persists across reloads (localStorage).

### J2. Web checkout — COD
1. Add item → `/order-payment`.
2. Fill contact + delivery (governorate drives shipping cost).
3. Apply coupon `WELCOME10` → 10% discount line; re-apply invalid code → error.
4. Select COD → Place Order → success page with order ID + WhatsApp CTA.
5. Order appears in `/admin/orders` as `ACCEPTED` (online channel).

### J3. Web checkout — wallet payment
1. Same as J2 but Vodafone Cash / InstaPay.
2. Redirect to `/order-payment/vodafone-cash?orderId=...` shows dynamic account number; WhatsApp confirm link contains order ID.
3. "I'll do this later" → success page.

### J4. Web checkout — cart emptied mid-session
1. Clear cart → `/order-payment` shows empty-cart state; cannot submit.

### J5. POS sale
1. `/cashier/login` as CASHIER → auto-shift created.
2. Search/filter catalog; out-of-stock disabled (OUT badge).
3. Add items; apply flat discount; checkout with Cash → success + print invoice.
4. Order stored with source POS + cashier identity; stock decremented; shift totals updated.

### J6. POS end shift
1. End Shift → shift password prompt (wrong → error; right → summary).
2. Enter actual cash → discrepancy shown.
3. Confirm → shift CLOSED, logout to login page; ShiftLog created.

### J7. Admin product lifecycle
1. `/admin/login` as ADMIN → `/admin`.
2. Create product (draft) → appears with Draft badge.
3. Edit price/stock → publish → visible on storefront.
4. Delete → confirm → removed.

### J8. Admin order management
1. New web order → notification alert + chime within 15 s poll.
2. Advance status ACCEPTED → CONFIRMED → SHIPPED → DELIVERED (each step email sent if customer email present).
3. Cancel mid-flow → stock restored; status CANCELLED locked.
4. Cancel single item → total recomputed, stock restored (ADMIN only).

### J9. Staff management
1. Create CASHIER (duplicate email → 400 error surfaced).
2. Change shift password (min 3).
3. Delete cashier (primary admin protected).

### J10. Access control matrix
| State | `/admin` | `/admin/login` | `/cashier` | `/cashier/login` |
|---|---|---|---|---|
| No cookies | → redirect `/admin/login` | 200 | → redirect `/cashier/login` | 200 |
| `admin_session` only (ADMIN) | 200 | 200 | 200 | 200 |
| `cashier_session` only (CASHIER) | 200 (pages; role-gated APIs 403) | 200 | 200 | 200 |
| Expired `admin_session` + valid `cashier_session` | 200 (fallback) | 200 | 200 | 200 |

---

## 16. Known Limitations / Test Notes

1. **Custom domain not yet attached** — emails use placeholder sender `orders@cityfragrance.com`; Google shows "Cloudflare" as site name.
2. **Paymob production checkout is unavailable** (503) until merchant keys configured; test mode returns mocked tokens.
3. **Language toggle exists in infrastructure only** — no visible AR/EN switch in UI.
4. **Shift passwords are plaintext** (default `123456` for new staff).
5. **Rate limiting is per-instance in-memory** — resets on redeploy; not shared across instances.
6. **Admin APIs `/api/admin/products` and `/api/admin/settings` have no role-level check** — any valid session can mutate them.
7. **Case-sensitivity inconsistencies** in status comparisons (`'Cancelled'` vs `'CANCELLED'`) affect the Total Revenue badge and shift totals exclusions.
8. **Coupon usage increments on every order POST** even if order later cancelled (no decrement on cancellation).
9. **Stock deductions are by product name match**; unmatched items are skipped silently.
10. **Primary admin** (`admin@cityfragrance.com`) cannot be deleted (client + server enforced).
