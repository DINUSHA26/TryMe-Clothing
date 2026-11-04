export type WebsiteTier = "ONE_PAGE" | "SIX_PAGES" | "TWELVE_PAGES";

export type WebSubscriptionStatus = 
  | "PENDING_PAYMENT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED";

export type DomainDnsStatus = "PENDING_VERIFICATION" | "ACTIVE" | "FAILED";

export type HeroDesignStyle =
  | "split_classic"
  | "corporate_overlay"
  | "tech_modern"
  | "organic_minimal"
  | "fashion_editorial"
  | "centered_impact"
  | "glassmorphism"
  | "promo_sale"
  | "video_motion"
  | "store_catalog";

export interface HeroTrustBadge {
  id: string;
  text: string;
  icon?: "shield" | "truck" | "star" | "check" | "zap" | "heart";
  enabled?: boolean;
}

export interface HeroSectionConfig {
  enabled: boolean;
  style?: HeroDesignStyle;
  title: string;
  highlightText?: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bgImage?: string;
  secondaryImage?: string;
  videoUrl?: string;
  badgeText?: string;
  discountTag?: string;
  tickerItems?: string[];
  faviconUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  // Trust Badges & Floating Guarantee Card
  showTrustBadges?: boolean;
  trustBadges?: HeroTrustBadge[];
  showFloatingCard?: boolean;
  floatingCardTitle?: string;
  floatingCardSubtitle?: string;
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

export type ProductCardLayout = "standard" | "modern" | "compact" | "bordered";

export interface ProductsSectionConfig {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  cardLayout?: ProductCardLayout;
  showPrice?: boolean;
  showBadge?: boolean;
  showDescription?: boolean;
  imageFit?: "contain" | "cover";
  // 1-Page options
  whatsappButtonText?: string;
  inquiryButtonText?: string;
  showWhatsApp?: boolean;
  showInquiry?: boolean;
  // Multi-Page options
  cartButtonText?: string;
  buyNowButtonText?: string;
  detailsButtonText?: string;
  showAddToCart?: boolean;
  showBuyNow?: boolean;
  showViewDetails?: boolean;
  showMultiPageWhatsApp?: boolean;
}

export interface ServicesSectionConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  items: ServiceItem[];
  cardLayout?: ProductCardLayout;
  showPrice?: boolean;
  showDescription?: boolean;
  imageFit?: "contain" | "cover";
  // 1-Page options
  whatsappButtonText?: string;
  inquiryButtonText?: string;
  showWhatsApp?: boolean;
  showInquiry?: boolean;
  // Multi-Page options
  bookButtonText?: string;
  detailsButtonText?: string;
  showBookNow?: boolean;
  showViewDetails?: boolean;
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
  showContactCards?: boolean;
  // Opening Hours
  showOpeningHours?: boolean;
  openingHours?: string;
  // Location Map
  showMap?: boolean;
  mapEmbedUrl?: string;
  mapDirectionsUrl?: string;
  // Contact & Inquiry Form
  showContactForm?: boolean;
  formTitle?: string;
  formSubtitle?: string;
}

export interface FooterSectionConfig {
  enabled: boolean;
  copyrightText?: string;
  storeBio?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    whatsapp?: string;
    twitter?: string;
    linkedin?: string;
  };
  showQuickLinks?: boolean;
  showPagesLinks?: boolean;
  showContactInfo?: boolean;
  showNewsletter?: boolean;
  newsletterTitle?: string;
  newsletterSubtitle?: string;
  customLinks?: Array<{ label: string; url: string }>;
}


export type CustomSectionType =
  | "slider"
  | "video"
  | "carousel"
  | "image_banner"
  | "contact_form"
  | "location_map"
  | "contact_cards"
  | "opening_hours"
  | "full_contact"
  | "products_catalog"
  | "services_list"
  | "about_story"
  | "photo_gallery"
  | "reviews_list";

export interface CustomSlideItem {
  id: string;
  imageUrl: string;
  headline?: string;
  subheadline?: string;
  badgeText?: string;
  buttonText?: string;
  buttonLink?: string;
}

export interface CustomCarouselItem {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  badge?: string;
  price?: string;
  linkUrl?: string;
}

export interface CustomWebsiteSection {
  id: string;
  type: CustomSectionType;
  title?: string;
  subtitle?: string;
  enabled: boolean;
  // Slider fields
  slides?: CustomSlideItem[];
  autoplay?: boolean;
  // Video fields
  videoUrl?: string;
  videoTitle?: string;
  videoSubtitle?: string;
  aspectRatio?: "16:9" | "4:3" | "1:1";
  videoButtonText?: string;
  videoButtonLink?: string;
  // Carousel fields
  carouselItems?: CustomCarouselItem[];
  // Image Banner fields
  bannerImageUrl?: string;
  bannerLinkUrl?: string;
  bannerAltText?: string;
  bannerHeight?: "compact" | "medium" | "tall" | "auto";
  bannerOverlayHeadline?: string;
  bannerOverlaySubheadline?: string;
  bannerOverlayBtnText?: string;
  bannerOverlayBtnLink?: string;
  // Feature Specific overrides
  buttonText?: string;
  buttonLink?: string;
  mapEmbedUrl?: string;
  aboutImageUrl?: string;
  itemsLimit?: number;
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
  productsSection?: ProductsSectionConfig;
  heroSection: HeroSectionConfig;
  aboutSection: AboutSectionConfig;
  servicesSection: ServicesSectionConfig;
  gallerySection: GallerySectionConfig;
  reviewsSection: ReviewsSectionConfig;
  contactSection: ContactSectionConfig;
  footerSection: FooterSectionConfig;
  customSections?: CustomWebsiteSection[];
  sectionsOrder?: string[];
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
