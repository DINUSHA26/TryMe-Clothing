import { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Package,
  ShoppingCart,
  Tag,
  Wallet,
  AlertTriangle,
  BarChart3,
  Settings,
  Star,
  Home,
  Store,
  Bell,
  ShoppingBag,
  Percent,
  MessageSquare,
  Megaphone,
  CreditCard,
  LayoutGrid,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
}

export const adminNavItems: NavItem[] = [
  {
    label: "Storefront",
    href: "/",
    icon: Home,
  },
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Vendors",
    href: "/admin/vendors",
    icon: Users,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    label: "Coupons",
    href: "/admin/coupons",
    icon: Tag,
  },
  {
    label: "Payouts",
    href: "/admin/payouts",
    icon: Wallet,
  },
  {
    label: "Disputes",
    href: "/admin/disputes",
    icon: AlertTriangle,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    label: "Chat Oversight",
    href: "/admin/chat",
    icon: MessageSquare,
  },
  {
    label: "Social Moderation",
    href: "/admin/social",
    icon: MessageSquare,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    label: "Ads Dashboard",
    href: "/admin/ads-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Ads Sellers",
    href: "/admin/ads-sellers",
    icon: Megaphone,
  },
  {
    label: "Ads Plans",
    href: "/admin/ads-plans",
    icon: CreditCard,
  },
  {
    label: "Marketplace Ads",
    href: "/admin/marketplace",
    icon: LayoutGrid,
  },
  {
    label: "Plan Payments",
    href: "/admin/ads-plan-payments",
    icon: CreditCard,
  },
];

export const vendorNavItems: NavItem[] = [
  {
    label: "Storefront",
    href: "/",
    icon: Home,
  },
  {
    label: "Dashboard",
    href: "/vendor",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/vendor/products",
    icon: Package,
  },
  {
    label: "Orders",
    href: "/vendor/orders",
    icon: ShoppingCart,
  },
  {
    label: "Coupons",
    href: "/vendor/coupons",
    icon: Tag,
  },
  {
    label: "Wallet",
    href: "/vendor/wallet",
    icon: Wallet,
  },
  {
    label: "Reviews",
    href: "/vendor/reviews",
    icon: Star,
  },
  {
    label: "Settings",
    href: "/vendor/settings",
    icon: Settings,
  },
];

export const adsSellerNavItems: NavItem[] = [
  {
    label: "Storefront",
    href: "/",
    icon: Home,
  },
  {
    label: "Dashboard",
    href: "/ads-seller",
    icon: LayoutDashboard,
  },
  {
    label: "My Ads",
    href: "/ads-seller/my-ads",
    icon: LayoutGrid,
  },
  {
    label: "Post an Ad",
    href: "/ads-seller/post-ad",
    icon: Megaphone,
  },
  {
    label: "Pricing Plans",
    href: "/ads-seller/plans",
    icon: CreditCard,
  },
  {
    label: "My Storefront",
    href: "/ads-seller/storefront",
    icon: Store,
  },
  {
    label: "Settings",
    href: "/ads-seller/settings",
    icon: Settings,
  },
];

export const storefrontNavItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Shop",
    href: "/products",
    icon: ShoppingBag,
  },
  {
    label: "Categories",
    href: "/categories",
    icon: FolderTree,
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    icon: LayoutGrid,
  },
  {
    label: "Social",
    href: "/social",
    icon: MessageSquare,
  },
  {
    label: "Vendors",
    href: "/vendors",
    icon: Store,
  },
  {
    label: "Deals",
    href: "/deals",
    icon: Percent,
  },
];

// Authenticated customer nav items (shown when logged in)
export const customerNavItems: NavItem[] = [
  {
    label: "My Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    label: "My Disputes",
    href: "/my-disputes",
    icon: AlertTriangle,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
];
