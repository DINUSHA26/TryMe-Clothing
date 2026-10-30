export type WebsiteTier = "ONE_PAGE" | "SIX_PAGES" | "TWELVE_PAGES";

export type WebSubscriptionStatus = 
  | "PENDING_PAYMENT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED";

export type DomainDnsStatus = "PENDING_VERIFICATION" | "ACTIVE" | "FAILED";

export interface HeroSectionConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bgImage?: string;
  badgeText?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export interface AboutSectionConfig {
  enabled: boolean;
  title: string;
  badge?: string;
  content: string;
  images: string[];
  features?: string[];
}

export interface ServiceItem {
  id: string;
  name: string;
  price: string;
  description?: string;
  imageUrl?: string;
  bookingUrl?: string;
}

export interface ServicesSectionConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  items: ServiceItem[];
}

export interface GallerySectionConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  images: string[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  comment: string;
  rating: number;
  avatarUrl?: string;
  role?: string;
}

export interface ReviewsSectionConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  items: TestimonialItem[];
}

export interface ContactSectionConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  mapEmbedUrl?: string;
}

export interface FooterSectionConfig {
  enabled: boolean;
  copyrightText?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  whatsappUrl?: string;
}

export interface VendorWebsiteConfigData {
  id?: string;
  vendorId?: string;
  adsSellerId?: string;
  themeTemplate: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  navItemsJson?: any;
  headerStyle: string;
  heroSection: HeroSectionConfig;
  aboutSection: AboutSectionConfig;
  servicesSection: ServicesSectionConfig;
  gallerySection: GallerySectionConfig;
  reviewsSection: ReviewsSectionConfig;
  contactSection: ContactSectionConfig;
  footerSection: FooterSectionConfig;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  isPublished: boolean;
  publishedAt?: string | null;
  pages?: VendorWebsitePageData[];
}

export interface VendorWebsitePageData {
  id?: string;
  websiteConfigId?: string;
  title: string;
  slug: string;
  contentHtml?: string;
  sectionsJson?: any;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder: number;
  isPublished: boolean;
  isSystemPage?: boolean;
}

export interface VendorCustomDomainData {
  id?: string;
  domain: string;
  dnsStatus: DomainDnsStatus;
  verificationKey: string;
  sslActive: boolean;
  verifiedAt?: string | null;
}

export interface VendorWebsiteSubscriptionData {
  id: string;
  vendorId?: string;
  tier: WebsiteTier;
  status: WebSubscriptionStatus;
  price: number;
  billingPeriod: string;
  paymentMethod: string;
  paymentId?: string | null;
  bankSlipUrl?: string | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export const TIER_LIMITS: Record<WebsiteTier, { name: string; price: number; maxPages: number; description: string }> = {
  ONE_PAGE: {
    name: "1-Page Website",
    price: 1990,
    maxPages: 1,
    description: "Single page smooth-scrolling website with all sections on one page.",
  },
  SIX_PAGES: {
    name: "6-Page Website",
    price: 4990,
    maxPages: 6,
    description: "Multi-page website with up to 6 custom pages (Home, About, Services, Products, Contact, Gallery).",
  },
  TWELVE_PAGES: {
    name: "12-Page Website",
    price: 9990,
    maxPages: 12,
    description: "Complete business website with up to 12 pages including policy pages, blog/gallery, and custom pages.",
  },
};
