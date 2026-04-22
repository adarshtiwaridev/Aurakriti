# Aurakriti

Aurakriti is a premium jewellery ecommerce platform built with Next.js 16 App Router, MongoDB, Redux, Tailwind CSS, and a set of server APIs for authentication, cart, checkout, payments, invoices, notifications, recommendations, image upload, and seller order management.

This repository contains the full customer storefront, seller dashboard, AI recommendation chatbot, cart and checkout flow, invoice generation, email notifications, and production-ready API routes.

## Tech Stack

- Next.js 16.2.2 (App Router)
- React 19
- Tailwind CSS 4
- Redux Toolkit
- MongoDB + Mongoose
- Nodemailer
- Cloudinary
- PDFKit
- Razorpay
- Framer Motion
- Recharts
- Zod

## Core Features

- Premium jewellery storefront with category browsing
- Product detail pages with AI-assisted suggestions
- User authentication and profile flows
- Cart management and checkout flow
- COD and online payment handling
- Order history with tracking timeline
- Seller dashboard for inventory and order management
- Invoice generation and downloadable PDFs
- Email notifications for verification, password reset, order confirmation, and order status updates
- AI product recommendation chatbot
- Notification system for buyers and sellers

## Project Structure

```text
Aurakriti/
├─ public/
├─ scripts/
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ auth/
│  │  ├─ products/
│  │  ├─ seller/
│  │  ├─ user/
│  │  └─ ...
│  ├─ components/
│  ├─ hooks/
│  ├─ lib/
│  ├─ models/
│  ├─ redux/
│  ├─ services/
│  └─ utils/
├─ next.config.mjs
├─ package.json
└─ README.md
```

## Main Modules

### Frontend

- Home, shop, product detail, about, contact, login, signup
- User dashboard, cart, checkout, orders, recommendations
- Seller dashboard for products and order status management
- Floating chatbot for AI recommendations

### APIs

- `auth/` for signup, verification, login, reset-password flows
- `cart/` for cart CRUD
- `orders/` and `order/` for order retrieval and confirmation
- `payment/` for payment session, verification, and failure handling
- `invoice/` for invoice generation
- `email/` for server-side email send utility endpoint
- `notifications/` for user/seller notifications
- `products/` and `product/` for product listing and lookup
- `recommendations/` for chatbot and recommendation sections
- `search/` for search and image-based lookup
- `upload/` for media upload support
- `user/` for profile APIs
- `admin/` for admin-only management APIs (users, products, orders, sellers, analytics, carousel)

---

## Admin Dashboard

### Tech Used

- **Backend:** Next.js API Routes, MongoDB/Mongoose, `requireRole(['admin'])` middleware
- **Frontend:** React 19, Tailwind CSS 4, Recharts (charts)
- **Auth:** JWT cookie-based sessions, role-based access control

### Admin Pages

| Route | Description |
|---|---|
| `/admin/dashboard` | Overview with live stats and navigation cards |
| `/admin/users` | User table — edit roles, toggle verification, delete |
| `/admin/sellers` | Seller list with revenue, product and order counts |
| `/admin/products` | Product moderation — approve, deactivate, delete |
| `/admin/orders` | All-platform orders — filter by status, update inline |
| `/admin/analytics` | Revenue charts, user growth, top products/sellers |
| `/admin/carousel` | Homepage carousel — create, edit, reorder, delete slides |

### Admin API Routes

All routes require `Authorization: Bearer <token>` with `role: admin`.

#### Users — `/api/admin/users`

| Method | Description | Key Params |
|---|---|---|
| `GET` | List all users | `page`, `limit`, `search`, `role`, `verified` |
| `PATCH` | Update role or verification | `userId`, `role`, `isVerified` |
| `DELETE` | Delete a user | `?userId=` |

#### Products — `/api/admin/products`

| Method | Description | Key Params |
|---|---|---|
| `GET` | List all products | `page`, `limit`, `search`, `category`, `isActive` |
| `PATCH` | Approve / deactivate | `productId`, `isActive` |
| `DELETE` | Remove a product | `?productId=` |

#### Orders — `/api/admin/orders`

| Method | Description | Key Params |
|---|---|---|
| `GET` | All platform orders | `page`, `limit`, `status`, `paymentStatus`, `search` |
| `PATCH` | Update order status | `orderId`, `status` |

#### Sellers — `/api/admin/sellers`

| Method | Description | Key Params |
|---|---|---|
| `GET` | Seller list with stats | `page`, `limit`, `search`, `verified` |

#### Analytics — `/api/admin/analytics`

| Method | Description |
|---|---|
| `GET` | Revenue totals, order counts, top products, top sellers, daily revenue (30d), user growth (30d), order status breakdown |

#### Carousel — `/api/admin/carousel`

| Method | Description | Key Params |
|---|---|---|
| `GET` | All carousel items (admin) | — |
| `POST` | Create slide | `title`, `image` (file or URL), `subtitle`, `offerLabel`, `offerPrice`, `originalPrice`, `productLink`, `ctaText`, `isActive`, `order` |
| `PATCH` | Update slide | `id` + any fields above |
| `DELETE` | Delete slide | `?id=` |

#### Public Carousel — `/api/carousel`

| Method | Description |
|---|---|
| `GET` | Active slides sorted by `order` (used by homepage) |

### API Response Format

All admin APIs return a consistent envelope:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": { "page": 1, "pages": 5, "total": 100, "limit": 20 }
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

## Environment Variables

Create a `.env.local` file in the project root.

### Required

```env
MONGODB_URI=
JWT_SECRET=
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_APP_URL=
```

### Auth / App URLs

```env
NEXTAUTH_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_GOOGLE_OAUTH_URL=
```

### Email

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=
EMAIL_PASS=
FROM_EMAIL=
FROM_NAME=Aurakriti
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY_MS=1000
```

### Cloudinary

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=aurakriti
```

### Razorpay

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### AI / Search

```env
HUGGINGFACE_API_KEY=
```

### MongoDB Connection Tuning

```env
MONGODB_CONNECT_RETRIES=3
MONGODB_RETRY_DELAY_MS=2000
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

App runs locally at:

```text
http://localhost:3000
```

## Production Build

```bash
npm run build
npm run start
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run seed:products
npm run migrate:categories
```

## Product Data Strategy

The app supports a DB-first product flow and may fall back to local JSON product data in some routes when database records are unavailable. For full ecommerce functionality in production, seed MongoDB products and use database-backed product IDs throughout the storefront.

## Cart and Checkout Flow

1. User browses products
2. Product is added to cart via `/api/cart`
3. Cart is stored server-side in MongoDB
4. Checkout creates or finalizes order
5. Payment verification confirms order
6. Invoice can be generated and downloaded
7. Order status updates sync to buyer views

## Seller Workflow

Seller dashboard supports:

- Product creation and editing
- Inventory management
- Viewing seller-specific order items
- Updating order status from pending to delivered/cancelled
- Triggering buyer-facing sync and email notifications

## Invoice System

- Invoices are generated server-side
- PDF invoices are attached to confirmation and status emails when available
- Users can download invoices from their orders page
- File naming follows `invoice_orderId.pdf`

## AI Recommendation System

Aurakriti includes two recommendation layers:

- Floating chatbot for natural-language jewellery queries
- Recommendation sections based on user context, orders, cart, and category affinity

Recommendations are scoped to jewellery categories supported by the app.

## Email System

Email features include:

- Verification email
- Password reset email
- OTP email
- Order confirmation email
- Order status update email

If SMTP variables are missing, email sending is skipped safely instead of crashing the application.

## Deployment (Vercel)

### Recommended Steps

1. Import the repository into Vercel
2. Add all environment variables in the Vercel project settings
3. Ensure MongoDB and Cloudinary credentials are valid
4. Run a production build in Vercel
5. Test authentication, cart, checkout, orders, and email flows

### Deployment Checklist

- `MONGODB_URI` is configured
- `JWT_SECRET` is configured
- `NEXT_PUBLIC_BASE_URL` matches deployed domain
- SMTP credentials are valid
- Razorpay keys are valid
- Cloudinary keys are valid
- OAuth callback URL is added in the provider console (if OAuth is enabled)

## Known Operational Notes

- Some flows may gracefully fall back when optional services are not configured
- Image optimization depends on configured remote domains in `next.config.mjs`
- Local JSON fallback should not be treated as the primary source of truth in production

## Recommended Production Setup

- Seed the product catalog into MongoDB before public launch
- Use Cloudinary for uploaded assets
- Use a production SMTP provider
- Use secure cookies and HTTPS-only deployment
- Keep all secrets in Vercel environment variables

## Important Files

- `src/lib/db.js` — MongoDB connection and retry logic
- `src/lib/email.js` — mail transport and templates
- `src/lib/invoice.js` — invoice generation
- `src/lib/razorpay.js` — payment provider config
- `src/lib/jwt.js` — token utilities
- `src/models/` — MongoDB schemas
- `src/services/` — frontend API service wrappers

## Testing Checklist

- User registration and login
- Password reset and OTP flows
- Product browsing and detail page
- Add to cart / remove / quantity update
- Checkout and order placement
- Invoice download
- Seller order status update
- Buyer order timeline sync
- Chatbot recommendation response
- Notification polling and read states

## Branding

Aurakriti is designed as a premium jewellery shopping experience with a luxury visual language, gold/ivory palette, and boutique-style product presentation.

## License

Private project. Internal or owner-managed usage only unless explicitly relicensed.
