# Contributing to Aurakriti 💎

Thank you for your interest in contributing to **Aurakriti** — a premium jewellery ecommerce platform! We welcome contributions from the community, including GSSoC 2026 participants.

Please read this guide fully before making your first contribution.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Setting Up Locally](#setting-up-locally)
- [Environment Variables](#environment-variables)
- [Branching Strategy](#branching-strategy)
- [Making a Contribution](#making-a-contribution)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Good First Issues](#good-first-issues)
- [Tech Stack Reference](#tech-stack-reference)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and collaborative in all interactions.

---

## Getting Started

1. **Fork** this repository to your GitHub account.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Aurakriti.git
   cd Aurakriti
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/Aurakriti.git
   ```

---

## Project Structure

```
Aurakriti/
├─ public/
├─ scripts/
├─ src/
│  ├─ app/
│  │  ├─ api/          # All API routes (auth, cart, orders, payment, etc.)
│  │  ├─ auth/         # Auth pages
│  │  ├─ products/     # Product pages
│  │  ├─ seller/       # Seller dashboard
│  │  └─ user/         # User dashboard
│  ├─ components/      # Reusable UI components
│  ├─ hooks/           # Custom React hooks
│  ├─ lib/             # Core utilities (db, email, invoice, jwt, razorpay)
│  ├─ models/          # MongoDB/Mongoose schemas
│  ├─ redux/           # Redux Toolkit store and slices
│  ├─ services/        # Frontend API service wrappers
│  └─ utils/           # Helper functions
├─ next.config.mjs
└─ package.json
```

---

## Setting Up Locally

### Prerequisites

- Node.js >= 18
- npm >= 9
- A MongoDB instance (local or Atlas)
- A Cloudinary account
- A Razorpay account (for payment flows)
- An SMTP provider (e.g., Gmail) for email features

### Installation

```bash
npm install
```

### Running the Dev Server

```bash
npm run dev
```

App will be available at `http://localhost:3000`.

> **Note:** If you encounter a React hydration error, open the app in an **incognito window**. Browser extensions can interfere with hydration.

### Seeding Product Data

```bash
npm run seed:products
npm run migrate:categories
```

---

## Environment Variables

Create a `.env.local` file in the project root. Copy the template below and fill in your own credentials — **never commit this file**.

```env
# Core
MONGODB_URI=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=

# Auth / App URLs
NEXTAUTH_URL=
NEXT_PUBLIC_API_URL=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=
EMAIL_PASS=
FROM_EMAIL=
FROM_NAME=Aurakriti
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY_MS=1000

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=aurakriti

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# AI / Search
HUGGINGFACE_API_KEY=

# MongoDB Tuning
MONGODB_CONNECT_RETRIES=3
MONGODB_RETRY_DELAY_MS=2000
```

> Optional services (SMTP, Razorpay, HuggingFace) will be skipped gracefully if not configured, so you can still contribute to unrelated parts of the codebase.

---

## Branching Strategy

Always create a new branch from `main` for your work. Never push directly to `main`.

```bash
git checkout main
git pull upstream main
git checkout -b <type>/your-branch-name
```

Branch naming convention:

| Type | Example |
|---|---|
| Bug fix | `fix/cart-quantity-update` |
| New feature | `feat/seller-analytics-page` |
| UI improvement | `ui/product-card-redesign` |
| Documentation | `docs/api-readme-update` |
| Refactor | `refactor/auth-middleware` |

---

## Making a Contribution

1. Make your changes on your feature branch.
2. Test your changes thoroughly (see the checklist below).
3. Lint your code:
   ```bash
   npm run lint
   ```
4. Commit your changes (see commit guidelines below).
5. Push to your fork:
   ```bash
   git push origin your-branch-name
   ```
6. Open a Pull Request against the `main` branch of this repo.

### Local Testing Checklist

Before submitting a PR, verify the flows you've touched:

- [ ] User registration, login, and OTP/password reset
- [ ] Product browsing and product detail page
- [ ] Add to cart, remove, quantity update
- [ ] Checkout and order placement
- [ ] Invoice download
- [ ] Seller order status update
- [ ] Buyer order timeline sync
- [ ] Chatbot recommendation response
- [ ] Notification polling and read states

---

## Commit Message Guidelines

Use the **Conventional Commits** format:

```
<type>(scope): short description
```

Examples:

```
feat(cart): add quantity increment button
fix(auth): resolve JWT expiry edge case
ui(seller): update dashboard layout for mobile
docs(contributing): add env variable section
refactor(invoice): extract PDF generation to helper
```

Types: `feat`, `fix`, `ui`, `docs`, `refactor`, `test`, `chore`

Keep the subject line under 72 characters. Add a body if context is needed.

---

## Pull Request Guidelines

- Fill out the PR template completely.
- Link the related issue using `Closes #issue_number`.
- Keep PRs focused — one feature or fix per PR.
- Add screenshots or screen recordings for any UI changes.
- Ensure no `.env` files, secrets, or `node_modules` are committed.
- Resolve all lint errors before requesting review.
- Be responsive to reviewer comments.

---

## Reporting Bugs

Open a [GitHub Issue](../../issues/new) and include:

- A clear title and description of the bug
- Steps to reproduce
- Expected vs. actual behaviour
- Screenshots or error logs if available
- Your OS, browser, and Node.js version

---

## Suggesting Features

Open a [GitHub Issue](../../issues/new) with the label `enhancement` and describe:

- The problem your feature solves
- A proposed approach or design idea
- Any relevant references or mockups

---

## Good First Issues

New contributors can look for issues tagged:

- `good first issue` — small, self-contained tasks
- `documentation` — README, inline comments, guides
- `ui` — visual improvements and responsive fixes
- `gssoc-2026` — issues reserved for GSSoC participants

---

## Tech Stack Reference

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| State | Redux Toolkit |
| Database | MongoDB + Mongoose |
| Payments | Razorpay |
| Media | Cloudinary |
| Email | Nodemailer |
| PDF | PDFKit |
| Validation | Zod |
| AI | HuggingFace API |

---

Happy contributing! If you have any questions, feel free to open a discussion or reach out on the project's Discord. 🚀
