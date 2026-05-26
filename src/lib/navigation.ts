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
    label: "Social",
    href: "/social",
    icon: MessageSquare, // Assuming MessageSquare is imported at the top
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
