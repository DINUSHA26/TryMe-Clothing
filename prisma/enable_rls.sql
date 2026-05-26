-- ============================================================
-- Enable Row Level Security (RLS) on all public tables
-- PrimeWear — fixes Supabase Security Advisor errors
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste this → Run
--
-- WHY THIS IS SAFE:
--   Prisma connects as the "postgres" / "service_role" which
--   bypasses RLS automatically. Enabling RLS here only blocks
--   unauthenticated PostgREST (anon) access — it does NOT
--   affect your Next.js app.
-- ============================================================

-- Core user/auth tables
ALTER TABLE "public"."User"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Customer"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Vendor"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OTP"                    ENABLE ROW LEVEL SECURITY;

-- Product catalogue
ALTER TABLE "public"."Category"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Product"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductImage"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductVariant"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."product_reviews"        ENABLE ROW LEVEL SECURITY;

-- Cart & checkout
ALTER TABLE "public"."Cart"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CartItem"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShippingAddress"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Coupon"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CouponUsage"            ENABLE ROW LEVEL SECURITY;

-- Orders & payments
ALTER TABLE "public"."Order"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderItem"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderStatusHistory"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment"                ENABLE ROW LEVEL SECURITY;

-- Wallet & payouts
ALTER TABLE "public"."Wallet"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WalletTransaction"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payout"                 ENABLE ROW LEVEL SECURITY;

-- Disputes
ALTER TABLE "public"."Dispute"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DisputeComment"         ENABLE ROW LEVEL SECURITY;

-- Chat
ALTER TABLE "public"."ChatRoom"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ChatMessage"            ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE "public"."notifications"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;

-- System
ALTER TABLE "public"."SystemSetting"          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Verify: run this query to confirm all tables have RLS enabled
-- ============================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
