# PrimeWear

Admin-controlled multi-vendor e-commerce platform for the Sri Lanka market with escrow payment system.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Cache**: Redis (Upstash)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: JWT + Email OTP (Resend)
- **Payments**: PayHere (Sri Lanka)
- **Real-time**: Pusher (Serverless compatible)
- **Storage**: Cloudinary
- **State Management**: Zustand
- **Charts**: Recharts

## Development Credentials

### Admin Login
- **Email**: `admin@primewear.lk`
- **Password**: `admin123`
- **Access**: Full system control

⚠️ **Important**: Change the admin password in production!

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env  # then fill in your values

# Push database schema
npm run db:push

# Seed database with initial data
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

**Note**: Real-time features use Pusher. Ensure you have your Pusher credentials in the `.env` file.

## Available Commands

### Development
```bash
npm run dev          # Start Next.js (port 3000)
```

### Production
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio (GUI)
```

## Environment Setup

The project requires these environment variables in `.env`:

### Required
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `REDIS_URL` - Upstash Redis connection string
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

### Pusher (Real-time Features)
- `PUSHER_APP_ID` - Pusher Application ID
- `NEXT_PUBLIC_PUSHER_KEY` - Pusher Public Key
- `PUSHER_SECRET` - Pusher Secret Key
- `NEXT_PUBLIC_PUSHER_CLUSTER` - Pusher Cluster (e.g., `ap2`)

### Payment Gateway
- `PAYHERE_MERCHANT_ID` - PayHere merchant ID
- `PAYHERE_MERCHANT_SECRET` - PayHere merchant secret
- `PAYHERE_MODE` - `sandbox` or `live`

### Email Service
- `RESEND_API_KEY` - Resend API key for transactional emails
- `EMAIL_FROM` - Sender email address

### File Storage
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Application
- `NEXT_PUBLIC_APP_URL` - App URL (default: `http://localhost:3000`)

### Auto-Tracking (Optional)
- `AFTERSHIP_API_KEY` - AfterShip API key (free tier: 100 trackings/month). Polling is disabled if not set.
- `TRACKING_POLL_INTERVAL_MS` - Poll interval in ms (default: `21600000` = 6 hours)

## Architecture

### Pusher (Real-time Features)
The project uses Pusher for all real-time features:
- **Why?** Serverless platforms like Vercel don't support persistent WebSocket connections. Pusher handles this as a managed service.
- **Features**: Real-time notifications, chat, typing indicators, cross-tab sync.
- **Setup**: Create an account at [pusher.com](https://pusher.com/) and add the credentials to `.env`.

### Database Schema
The database includes:
- **Users**: Admin, Vendor, Customer roles
- **Products**: With variants and images
- **Orders**: Full lifecycle tracking with multi-vendor support
- **Payments**: PayHere integration with escrow system
- **Wallet**: Vendor balance management (pending / available / paid)
- **Chat**: Order-based messaging with contact filtering
- **Disputes**: Customer dispute resolution with evidence upload
- **Coupons**: Platform and vendor-specific discounts with Deals page opt-in
- **Notifications**: In-app + email notifications (18 types)
- **Reviews**: Customer product reviews (post-delivery)

## Project Structure

```
src/
├── app/
│   ├── (auth)/                # Login pages
│   ├── (storefront)/          # Customer-facing pages
│   ├── (admin-dashboard)/     # Admin dashboard with layout
│   ├── (vendor-dashboard)/    # Vendor dashboard with layout
│   └── api/                   # API routes
├── components/                # React components
├── lib/                       # Utilities (auth, database, etc.)
├── services/                  # Business logic
├── hooks/                     # Custom React hooks
├── stores/                    # Zustand state management
└── types/                     # TypeScript type definitions
```

## User Roles

1. **Admin** - Platform owner, full control
2. **Vendor** - Sellers (created by Admin)
3. **Customer** - Buyers (passwordless OTP login)

## Key Features

### Payment Flow (Escrow System)
1. Customer pays via PayHere → Platform receives payment
2. Platform deducts commission (default 10%, configurable per vendor)
3. Remaining amount goes to vendor's **pending balance**
4. Customer confirms delivery → Funds move to **available balance**
5. Weekly payouts → Admin approves withdrawals

### Order Lifecycle
```
Order Placed → Payment Confirmed → Processing → Shipped → Delivered (funds released)
```
- **PROCESSING / SHIPPED**: Set by the vendor
- **DELIVERED**: Set by customer ("Confirm Delivery"), admin (override), or auto-tracking poller
- Vendor **cannot** mark an order as delivered

### Cancel / Return Policy
- **Cancel**: Within 24 hours of order placement
- **Return**: Within 24 hours of delivery confirmation

### Auto-Tracking
- Delivery auto-tracking is enabled via **AfterShip**.
- **Implementation**: Handled by a **Vercel Cron Job** (`/api/cron/track-orders`) that runs every 6 hours.
- **Workflow**: If the carrier reports delivery → order status is set to `DELIVERED` → vendor funds are released.
- **Requirement**: `AFTERSHIP_API_KEY` must be set in the environment variables.
- **Manual Trigger**: Admins can manually trigger a check by hitting the cron endpoint (requires `CRON_SECRET` if configured).

### Chat System
- Available only after order placement
- Contact details (phone, email, social media) are automatically filtered
- Admin can view all chat histories

### Deals Page (`/deals`)
- Vendors and admins can opt-in coupons to be featured on the public Deals page
- Toggle "Featured on Deals Page" when creating/editing a coupon

### Product Reviews
- Customers can review a product after delivery is confirmed
- One review per order item; visible on the product detail page

## Storefront Navigation

`Home | Shop | Categories | Vendors | Deals`

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Development guidelines, coding standards, troubleshooting
- **[PLAN.md](PLAN.md)** - Detailed implementation phases and progress
- **[prisma/schema.prisma](prisma/schema.prisma)** - Complete database schema

## Development Status

### ✅ Completed Phases

| Phase | Feature |
|-------|---------|
| 1–2 | Authentication (JWT, OTP, role-based access, httpOnly cookies) |
| 3 | Dashboard layouts (Admin, Vendor, Storefront) |
| 4 | Vendor management |
| 5 | Categories & Products (variants, images, admin disable) |
| 6 | Storefront & product browsing |
| 7 | Cart system (guest + logged-in, auto-merge) |
| 8 | Checkout & address management |
| 9 | PayHere payment integration |
| 10 | Order management (customer, vendor, admin) |
| 11 | Wallet & payout system |
| 12 | Coupon system |
| 13 | Real-time chat (Pusher) |
| 14 | Dispute resolution system |
| 15 | Notification system (18 types, in-app + email) |
| 16–17 | Admin & vendor reports (Recharts, CSV export) |
| 18 | Storefront navigation — Shop & Deals pages |
| 19 | Policy pages, social media footer, bug fixes |
| 20 | Etsy-style variant manager & product form fixes |
| 21 | DELIVERED status & AfterShip auto-tracking poller |

### 🚧 Next Steps

- **Testing & QA**: Unit tests (Jest), Integration tests, E2E tests (Playwright), PayHere sandbox testing
- **Deployment**: Vercel (Next.js), Pusher (Real-time), production PayHere credentials

See [PLAN.md](PLAN.md) for detailed phase breakdown.

## Troubleshooting

**Error**: Real-time features not working
- **Solution**: Check if Pusher credentials in `.env` are correct and that the cluster matches.

**Error**: `JWT secrets are not configured`
- **Solution**: Ensure `.env` has `JWT_SECRET` and `JWT_REFRESH_SECRET`

**Error**: `Can't reach database server at db.*.supabase.co:5432`
- **Cause**: Indian ISPs block Supabase direct connection hostnames
- **Solution**: Use Supabase Transaction Pooler URL (`*.pooler.supabase.com:6543`) with `?pgbouncer=true&connection_limit=1` appended

For more troubleshooting, see [CLAUDE.md — Troubleshooting](CLAUDE.md#troubleshooting)

## Deployment

### Next.js (Frontend + API)
- **Platform**: Vercel (recommended)
- **Environment**: Set all environment variables in Vercel dashboard
- **Build Command**: `npm run build`

### Pusher (Real-time Features)
- **Platform**: Managed service at [pusher.com](https://pusher.com/)
- **Setup**: Simply provide the keys in your deployment environment (Vercel). No separate server deployment needed.

### Database & Redis
- **PostgreSQL**: Supabase
- **Redis**: Upstash
- No additional setup needed for existing accounts

## License

Proprietary — All rights reserved
