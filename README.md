# City Fragrance

A high-performance, full-stack E-commerce Storefront and Point-of-Sale (POS) Admin Dashboard built for modern luxury retail operations. Engineered for sub-millisecond edge delivery, multi-channel sales coordination, and secure transactional shift management.

---

## Architecture & Tech Stack

City Fragrance is architected as a unified, edge-ready application deployed globally on Cloudflare Workers using OpenNext.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | Server Components, Route Handlers, Streaming SSR |
| **Runtime & UI** | React 19 | High-efficiency concurrent UI rendering |
| **Database** | PostgreSQL (Neon Serverless) | Auto-scaling serverless database with connection pooling |
| **ORM** | Prisma 7 + `@prisma/adapter-neon` | Type-safe schema definition and query generation |
| **Edge Hosting** | Cloudflare Workers / Pages | Worldwide low-latency edge deployment via OpenNext |
| **Styling** | Tailwind CSS | Mobile-first responsive design system |
| **Media Delivery** | Cloudinary | Image optimization, responsive transforms, and video storage |
| **Authentication** | Web Crypto PBKDF2 + JWT (`jose`) | Stateless, edge-compatible authentication sessions |

---

## Core Capabilities

### 1. Public E-Commerce Storefront
- **Dynamic Catalog & Filtering**: Real-time fragrance categorization, gift sets, and responsive inventory displays.
- **Fast First-Paint**: Optimized hydration guarantees immediate product rendering without blank-state flashes.
- **Multi-Payment Checkout**: Supports Cash on Delivery (COD), InstaPay, and Vodafone Cash with instant WhatsApp order confirmation routing.
- **Order Tracking**: Dynamic receipt generation and order status lookup with automated customer communication.

### 2. Cashier POS & Shift Management
- **Dedicated POS Interface**: Tailored cashier screen (`/cashier`) for fast in-store checkout, order entry, and receipt printing.
- **Global Unified Shift PIN**: Centralized, secure PIN validation for cash drawer opening, mid-day drawer checks, and end-of-shift reconciliation.
- **Automated Cash Balancing**: Instant variance computation (`expectedCash` vs. `actualCash`), payment method breakdowns (Cash, Visa, InstaPay, Vodafone Cash), and persistent historical `ShiftLog` auditing.

### 3. Admin Management Dashboard
- **Role-Based Access Control (RBAC)**: Strict separation between `ADMIN` (full control) and `CASHIER` (POS-only) access tiers.
- **Product & Inventory Control**: Comprehensive catalog management including variants, volume tiers, pricing, stock levels, and media uploads.
- **Order Fulfillment Pipeline**: Search, filter, and track order lifecycles (Pending, Processing, Completed, Cancelled).
- **Staff Administration**: User account provisioning, individual login password resets, and shift history oversight.
- **Store Customization**: Live announcement bars, hero banners, and promotional content management.

---

## Security & Performance Hardening

The codebase has undergone comprehensive security reviews and production hardening:

- **XSS Vector Elimination**: Centralized `sanitizeHtml()` utility guarding dynamic user-facing HTML content (`AnnouncementBar`, `Hero`).
- **Credential & Session Isolation**:
  - Main account login passwords are encrypted via Web Crypto PBKDF2 (`hashPassword()`).
  - Cashier drawer shift operations are strictly governed by a unified global Shift PIN (`prisma.user.updateMany`), eliminating fallback defaults.
- **Upload Validation & Sanitization**: Strict MIME-type whitelisting (`image/*`, `video/*`) coupled with a strict 15MB file size limit enforced before reaching external storage.
- **Admin Lockout Guards**: Dynamic deletion guards prevent administrators from accidentally deleting their own accounts or removing the final system administrator.
- **Database Optimization**: Strategic composite indexing on high-frequency query paths (`Order.shiftId`, `Shift.cashierId`, `Shift.status`) to prevent full-table scans.
- **Edge Zero-Leak Architecture**: Stripped all sensitive financial fields (`costPrice`), shift credentials, and customer PII from public client-facing API responses and production logs.

---

## Project Structure

```text
├── prisma/
│   ├── schema.prisma        # Database schema, relations, and indexes
│   └── seed.mjs             # Seed scripts for initial setup
├── src/
│   ├── app/
│   │   ├── (storefront)/    # Public customer pages (Catalog, Product, Checkout)
│   │   ├── admin/           # Dashboard (Orders, Products, Staff, Settings, Shifts)
│   │   ├── cashier/         # Point-of-Sale (POS) terminal & shift operations
│   │   ├── api/             # Secure RESTful API route handlers
│   │   └── order-payment/   # Payment processing & order success flows
│   ├── components/          # Reusable UI components & modals
│   ├── hooks/               # Client-side hooks (Products, Cart, Media)
│   └── lib/                 # Auth guards, password hashing, Prisma client, utilities
├── open-next.config.ts      # Cloudflare OpenNext edge deployment configuration
└── wrangler.jsonc           # Cloudflare Workers bindings & environment mappings
```

---

## Getting Started

### Prerequisites
- **Node.js**: v20 or later
- **npm** or **pnpm**
- Neon PostgreSQL database instance
- Cloudinary cloud storage credentials

### 1. Installation & Environment Setup
Clone the repository and install dependencies:

```bash
git clone https://github.com/medhat-oss/CITY-FRAGRANCE.git
cd CITY-FRAGRANCE
npm install
```

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require"
JWT_SECRET="your-secure-jwt-secret-min-32-chars"

# Media Management (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Business & Payment Configuration
NEXT_PUBLIC_WHATSAPP_NUMBER="2010XXXXXXXX"
NEXT_PUBLIC_PAYMENT_MODE="live"
```

### 2. Database Migration & Generation
Generate the Prisma Client:

```bash
npx prisma generate
```

### 3. Local Development
Start the Next.js development server:

```bash
npm run dev
```

The application will be accessible at:
- **Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Cashier POS**: [http://localhost:3000/cashier](http://localhost:3000/cashier)

---

## Production Build & Deployment

The application is deployed to **Cloudflare Workers** using the automated OpenNext compilation pipeline:

```bash
# Type-check without emitting
npx tsc --noEmit

# Clean build artifacts, bundle with OpenNext, and deploy to Cloudflare Workers
npm run build:cloudflare
```

---

## License

Private & Proprietary. All rights reserved by **City Fragrance**.
