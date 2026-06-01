import {
  AdStatus,
  AdsPlanType,
  AdsPlanBillingCycle,
  AdsSubscriptionStatus,
  AdsPaymentStatus,
  AdFieldType,
  VendorStatus
} from "@prisma/client";

export interface AdsSeller {
  id: string;
  userId: string;
  businessName: string | null;
  phone: string;
  primaryCategory: string;
  status: VendorStatus;
  slug: string;
  aboutContent: string | null;
  contactInfo: AdsSellerContactInfo | null;
  createdAt: Date;
  updatedAt: Date;
  servicePages?: AdsSellerPage[];
  ads?: ClassifiedAd[];
  subscriptions?: AdsSubscription[];
}

export interface AdsSellerContactInfo {
  phone?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  mapEmbedUrl?: string;
}

export interface AdsSellerPage {
  id: string;
  sellerId: string;
  title: string;
  content: string;
  slug: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdsPlan {
  id: string;
  name: string;
  type: AdsPlanType;
  maxAds: number;
  price: number;
  billingCycle: AdsPlanBillingCycle;
  isActive: boolean;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AdsSubscription {
  id: string;
  sellerId: string;
  planId: string;
  plan?: AdsPlan;
  status: AdsSubscriptionStatus;
  startsAt: Date;
  expiresAt: Date | null;
  adsUsed: number;
  createdAt: Date;
  updatedAt: Date;
  payment?: AdsPayment | null;
}

export interface AdsPayment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: AdsPaymentStatus;
  payherePaymentId: string | null;
  paymentMethod: string | null;
  paymentHash: string | null;
  notificationData: any;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdsCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  subCategories?: AdsSubCategory[];
}

export interface AdsSubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  fieldDefinitions?: AdFieldDefinition[];
}

export interface AdFieldDefinition {
  id: string;
  subCategoryId: string;
  fieldKey: string;
  label: string;
  fieldType: AdFieldType;
  options: any;
  isRequired: boolean;
  isOptional: boolean;
  sortOrder: number;
  placeholder: string | null;
  helpText: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassifiedAd {
  id: string;
  sellerId: string;
  seller?: AdsSeller;
  categoryId: string;
  category?: AdsCategory;
  subCategoryId: string;
  subCategory?: AdsSubCategory;
  district: string;
  localArea: string | null;
  title: string;
  description: string;
  price: number | null;
  priceNegotiable: boolean;
  images: string[];
  specifications: Record<string, any> | null;
  status: AdStatus;
  isTopAd: boolean;
  views: number;
  rejectionReason: string | null;
  adminNote: string | null;
  expiresAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
