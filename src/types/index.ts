export interface ProductVariantColor {
  name: string;
  hex?: string;
}

export interface ProductVariants {
  sizes?: string[];
  colors?: ProductVariantColor[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discountPrice?: number | null;
  isDiscountActive?: boolean;
  discountPercentage?: number;
  description: string;
  images: string[];
  specifications: Record<string, string>;
  stock: number;
  variants?: ProductVariants;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  isVisible: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userCity: string;
  rating: number;
  comment: string;
  date: string;
  isVerified: boolean;
  isSample?: boolean;
  status: 'approved' | 'pending' | 'rejected';
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  image: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  zone: 'kathmandu_valley' | 'outside_valley';
  landmarks?: string;
  deliveryNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  total: number;
  paymentMethod: 'qr_pay' | 'esewa_pay' | 'khalti_pay' | 'banking_pay';
  transactionId?: string;
  paymentScreenshotUrl?: string;
  paymentStatus: 'pending_verification' | 'verified' | 'rejected' | 'pending' | 'paid';
  paymentRemark?: string;
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  zone: 'kathmandu_valley' | 'outside_valley';
  isDefault: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  addresses: CustomerAddress[];
  wishlist: string[];
  createdAt: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AiSettings {
  enabled: boolean;
  assistantName: string;
  welcomeMessage: string;
  tone: string;
  storeBio: string;
  faqList: FaqItem[];
  suggestedQuestions?: string[];
  customInstructions: string;
}

export interface FounderInfo {
  name: string;
  role: string;
  photoUrl: string;
  bio: string;
  website?: string;
}

export interface PromotionalOffer {
  enabled: boolean;
  title: string;
  subtitle: string;
  discountPercentage: number;
  bannerUrl?: string;
  popupImageUrl?: string;
  buttonText: string;
  startDate?: string;
  endDate?: string;
}

export interface QrPaymentSettings {
  enabled: boolean;
  qrImageUrl: string;
  providerName: string;
  accountName: string;
  accountNumber?: string;
  instructions: string;
}

export interface AboutBrandInfo {
  aboutKhojau: string;
  brandDescription: string;
  mission: string;
}

export interface WebsiteTexts {
  // 1. Top Header & Navigation
  topNepaliBrandText: string;
  topLocationText: string;
  topRightBadgeText: string;
  searchPlaceholder: string;
  askAiButtonText: string;

  // 2. Hero Banner & Trust Highlights
  heroPrimaryButtonText: string;
  heroSecondaryButtonText: string;
  heroTrust1Title: string;
  heroTrust1Sub: string;
  heroTrust2Title: string;
  heroTrust2Sub: string;
  heroTrust3Title: string;
  heroTrust3Sub: string;
  heroCardBadge: string;
  heroCardBox1Title: string;
  heroCardBox1Desc: string;
  heroCardBox2Title: string;
  heroCardBox2Desc: string;
  heroCardButtonText: string;

  // 3. Catalog & Empty State
  catalogEmptyTitle: string;
  catalogEmptySubtitle: string;

  // 4. Promotional Mid-Page Banner
  promoSectionBadge: string;
  promoSectionTitle: string;
  promoSectionSubtitle: string;
  promoPrimaryButton: string;
  promoSecondaryButton: string;

  // 5. Customer Reviews Section
  testimonialsHeading: string;
  testimonialsSubheading: string;
  testimonialsRatingBadge: string;
  testimonial1Name: string;
  testimonial1Location: string;
  testimonial1Quote: string;
  testimonial2Name: string;
  testimonial2Location: string;
  testimonial2Quote: string;
  testimonial3Name: string;
  testimonial3Location: string;
  testimonial3Quote: string;

  // 6. Footer Texts
  footerValue1Title: string;
  footerValue1Sub: string;
  footerValue2Title: string;
  footerValue2Sub: string;
  footerValue3Title: string;
  footerValue3Sub: string;
  footerBrandSummary: string;
  footerDispatchNote: string;
  footerCopyrightText: string;

  // 7. Checkout & Payment Confirmation Texts
  checkoutQrInstruction1: string;
  checkoutQrInstruction2: string;
  checkoutPaidButtonText: string;
  checkoutProofHeading: string;
  checkoutProofSubheading: string;
  checkoutVerificationNote: string;
  namasteSuccessTitle: string;
  namasteSuccessSubtitle: string;
  namasteSuccessMessage: string;
  orderConfirmHeading: string;
  orderConfirmNote: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCategories?: string[];
  heroBannerUrl?: string;
  promoBannerUrl?: string;
  nepalFlagUrl?: string;
  heroBadgeText?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  contactPhone: string;
  contactEmail: string;
  storeAddress: string;
  announcementText: string;
  announcementActive: boolean;
  deliveryKathmanduFee: number;
  deliveryOutsideFee: number;
  freeDeliveryThreshold: number;
  returnPolicyText: string;
  deliveryInfoText: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  aiSettings: AiSettings;
  founder: FounderInfo;
  aboutBrand: AboutBrandInfo;
  promotionalOffer?: PromotionalOffer;
  qrPaymentSettings: QrPaymentSettings;
  websiteTexts?: WebsiteTexts;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalProducts: number;
  outOfStockCount: number;
  totalCustomers: number;
  recentOrders: Order[];
}
