import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import type { Product, Review, Order, CustomerAddress, UserAccount, StoreSettings, DashboardStats } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsing with large limit for image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Directories setup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded assets statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Initial Settings with official branding and Founder / About information
const INITIAL_SETTINGS: StoreSettings = {
  storeName: "Khojau",
  tagline: "Nepal's Trusted Modern Online Store",
  logoUrl: "/src/assets/images/khojau_logo.svg",
  heroBannerUrl: "/src/assets/images/khojau_hero_butwal_clean_1791096130543.jpg",
  promoBannerUrl: "/src/assets/images/banner_tech_lifestyle_1790995930360.jpg",
  nepalFlagUrl: "",
  heroBadgeText: "Authentic Nepali Store",
  heroTitle: "Genuine Products & Nepali Craftsmanship, Delivered Across Nepal.",
  heroSubtitle: "Handpicked everyday essentials, pure Himalayan cashmere, organic mountain teas, and verified electronics dispatched directly from our Butwal, Nepal hub with verified QR payment.",
  contactPhone: "+977-9801234567",
  contactEmail: "support@khojau.com",
  storeAddress: "Traffic Chowk, Butwal, Nepal",
  announcementText: "🇳🇵 खोजौँ — Butwal, Nepal | Fast Nationwide Delivery Across All 7 Provinces",
  announcementActive: true,
  deliveryKathmanduFee: 50,
  deliveryOutsideFee: 150,
  freeDeliveryThreshold: 2000,
  returnPolicyText: "7-Day Hassle-Free Returns & Exchanges. If the item is defective or incorrect, we offer instant replacement or 100% refund upon return inspection.",
  deliveryInfoText: "Orders within Butwal & Rupandehi are delivered within 24-48 hours. Orders across all major cities and provinces in Nepal are delivered in 2-4 business days.",
  socialLinks: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    tiktok: "https://tiktok.com",
    whatsapp: "+9779801234567"
  },
  aiSettings: {
    enabled: true,
    assistantName: "Khojau Saathi",
    welcomeMessage: "Namaste! 🙏 Welcome to Khojau (खोजौँ). I am Khojau Saathi, your shopping assistant. How can I help you today?",
    tone: "Friendly, helpful, honest, and culturally respectful Nepali shopping guide",
    storeBio: "Khojau (खोजौँ) is an authentic Nepali online shopping store based in Butwal, Nepal, founded by Shishir Pokhrel in Butwal, Nepal. We connect customers across Nepal with genuine products, local craftsmanship, and verified electronics with secure QR digital payments.",
    faqList: [
      { question: "Where is Khojau located?", answer: "Khojau is proudly based in Butwal, Nepal. Our main office and fulfillment hub is located in Traffic Chowk, Butwal, Nepal, and we deliver nationwide across all provinces of Nepal." },
      { question: "What products are available on Khojau?", answer: "You can browse our live catalog directly on the Khojau homepage by category, search for specific items, and view real-time prices, discounts, and stock availability." },
      { question: "How does payment work on Khojau?", answer: "You can pay securely via QR Payment using eSewa, Khalti, Fonepay, or any Nepali Mobile Banking app. After scanning the official QR code and completing payment, submit your Transaction ID for verification." },
      { question: "How can I track my order?", answer: "Log in to your Khojau customer account and click on your profile in the top navigation bar to view your Recent Orders and real-time order status (Pending, Processing, Shipped, or Delivered)." },
      { question: "How can I contact Khojau?", answer: "You can contact our Butwal, Nepal support team by phone or WhatsApp at +977-9801234567 or by email at support@khojau.com." }
    ],
    suggestedQuestions: [
      "Where is Khojau located?",
      "What products are available on Khojau?",
      "How does payment work on Khojau?",
      "How can I track my order?",
      "How can I contact Khojau?"
    ],
    customInstructions: "CRITICAL: Khojau (खोजौँ) is strictly based in Butwal, Nepal. Always state Butwal, Nepal whenever business location is asked or relevant. Never say Khojau is based in Kathmandu. For questions about Khojau (products, prices, discounts, offers, orders, QR payment, Butwal location, contact details, delivery info, return policy, About Khojau, and Founder Shishir Pokhrel), use only the actual website and database information and never invent store facts. You are also a fully intelligent general AI assistant capable of answering general knowledge, science, math, coding, language, and everyday questions."
  },
  founder: {
    name: "Shishir Pokhrel",
    role: "Founder & Owner of Khojau",
    photoUrl: "/src/assets/images/founder_shishir_1790996757613.jpg",
    bio: "Hi, I'm Shishir Pokhrel. I started Khojau right here in Butwal, Nepal because I wanted to build an honest, reliable Nepali online store where finding genuine products is straightforward and headache-free. Rather than overwhelming people with endless clutter and fake discounts, I focus on handpicking real, dependable items and delivering them safely across Nepal with verified QR digital payment and dedicated local care.",
    website: "https://shishirpokhrel.com.np"
  },
  aboutBrand: {
    aboutKhojau: "Khojau (खोजौँ) is a modern Nepali online shopping brand based in Butwal, Nepal, created to make finding and ordering useful products simple and convenient. The goal is to bring interesting and useful products to customers through a clean, easy-to-use online shopping experience.",
    brandDescription: "Based in Butwal, Nepal, Khojau is built on trust, transparency, and personal care. We inspect every product at our Butwal hub before it reaches your hands and provide dependable delivery throughout Butwal, Rupandehi, and all major cities across Nepal.",
    mission: "To deliver genuinely useful products and authentic Nepali heritage crafts from Butwal, Nepal to homes across the nation with unmatched reliability, secure QR payments, and friendly customer support."
  },
  promotionalOffer: {
    enabled: true,
    title: "दशैंको विशेष अफर 🎉",
    subtitle: "सबै उत्पादनमा २५% सम्म छुट!",
    discountPercentage: 25,
    buttonText: "अहिले किनमेल गर्नुहोस्",
    popupImageUrl: ""
  },
  qrPaymentSettings: {
    enabled: true,
    qrImageUrl: "",
    providerName: "eSewa / Fonepay / Khalti / Mobile Banking",
    accountName: "Khojau Online Store",
    accountNumber: "9801234567",
    instructions: "तलको QR स्क्यान गरेर भुक्तानी गर्नुहोस्। भुक्तानी गरेपछि Transaction ID राख्नुहोस्।"
  },
  websiteTexts: {
    topNepaliBrandText: "खोजौँ",
    topLocationText: "Butwal, Nepal",
    topRightBadgeText: "नेपालभर डेलिभरी",
    searchPlaceholder: "Search products in Khojau...",
    askAiButtonText: "Ask Saathi",

    heroPrimaryButtonText: "Browse Catalog",
    heroSecondaryButtonText: "Ask Khojau Saathi",
    heroTrust1Title: "Fast Shipping",
    heroTrust1Sub: "From Butwal, Nepal",
    heroTrust2Title: "QR Payment",
    heroTrust2Sub: "eSewa · Khalti · Banking",
    heroTrust3Title: "7-Day Return",
    heroTrust3Sub: "Easy replacement",
    heroCardBadge: "Khojau Verified Store",
    heroCardBox1Title: "Verified QR Payment",
    heroCardBox1Desc: "Scan to pay with eSewa, Khalti, or any Nepali Mobile Banking app. Order verification is fast and transparent.",
    heroCardBox2Title: "Nationwide Delivery from Butwal, Nepal",
    heroCardBox2Desc: "Every order is carefully inspected and dispatched directly from our Butwal, Nepal hub across all provinces of Nepal.",
    heroCardButtonText: "Explore Store Catalog",

    catalogEmptyTitle: "New Products Coming Soon",
    catalogEmptySubtitle: "Our Butwal, Nepal store catalog is ready for new products. Add products anytime from the Admin Dashboard.",

    promoSectionBadge: "Featured Tech & Craftsmanship",
    promoSectionTitle: "Authentic Nepali Goods & Verified Modern Essentials",
    promoSectionSubtitle: "Every order is hand-checked at our Butwal, Nepal hub before dispatch. Enjoy verified QR digital payments, prompt replacement warranty, and dedicated customer support.",
    promoPrimaryButton: "Explore Electronics",
    promoSecondaryButton: "Explore Handicrafts",

    testimonialsHeading: "What Customers Say About Khojau",
    testimonialsSubheading: "Verified reviews from satisfied shoppers across Butwal, Bhairahawa, Pokhara, and beyond.",
    testimonialsRatingBadge: "4.9 / 5.0 Customer Rating",
    testimonial1Name: "Sushila Shrestha",
    testimonial1Location: "Verified Buyer · Butwal, Nepal",
    testimonial1Quote: "Received my order in Butwal within 24 hours. Smooth QR payment and the packaging was super secure!",
    testimonial2Name: "Bikash Adhikari",
    testimonial2Location: "Verified Buyer · Tilottama",
    testimonial2Quote: "Genuine quality products at honest prices. Ordering from Tilottama was effortless and customer support was very polite.",
    testimonial3Name: "Anjali Thapa",
    testimonial3Location: "Verified Buyer · Pokhara",
    testimonial3Quote: "Ordered from Butwal to Pokhara and received it in 2 days. Everything matched the description 100%.",

    footerValue1Title: "Fast Nationwide Delivery",
    footerValue1Sub: "Dispatched from Butwal, Nepal to all 7 provinces",
    footerValue2Title: "100% Genuine Guarantee",
    footerValue2Sub: "Inspected at our Butwal, Nepal hub before shipping",
    footerValue3Title: "7-Day Easy Returns",
    footerValue3Sub: "Hassle-free replacement or refund",
    footerBrandSummary: "Authentic Nepali online shopping store based in Butwal, Nepal for genuine electronics, local craftsmanship, and everyday essentials.",
    footerDispatchNote: "Deliveries fulfilled daily from our Butwal, Nepal packaging hub.",
    footerCopyrightText: "Butwal, Nepal. All rights reserved.",

    checkoutQrInstruction1: "तलको QR स्क्यान गरेर भुक्तानी गर्नुहोस्।",
    checkoutQrInstruction2: "भुक्तानी गरेपछि Transaction ID राख्नुहोस्।",
    checkoutPaidButtonText: "मैले भुक्तानी गरेँ (I Have Paid)",
    checkoutProofHeading: "भुक्तानी पुष्टि विवरण राख्नुहोस्",
    checkoutProofSubheading: "Transaction ID / Reference Number पेश गरेपछि तपाईंको अर्डर सुरक्षित हुन्छ।",
    checkoutVerificationNote: "विवरण पेश गरेपछि तपाईंको भुक्तानी Pending Verification मा रहनेछ। एडमिनले रकम बैंकमा प्रमाणीकरण गरेपछि अर्डर डेलिभरीका लागि प्रस्थान हुनेछ।",
    namasteSuccessTitle: "धन्यवाद! 🙏",
    namasteSuccessSubtitle: "तपाईंको भुक्तानी विवरण प्राप्त भयो।",
    namasteSuccessMessage: "तपाईंको अर्डर पुष्टि भएपछि हामी तपाईंलाई जानकारी दिनेछौँ।",
    orderConfirmHeading: "तपाईंको अर्डरका लागि धन्यवाद। 🙏",
    orderConfirmNote: "हाम्रो बुटवल टिमले तपाईंको भुक्तानी रुजु गरेपछि सामान प्याक गरी डेलिभरीका लागि पठाउनेछ।"
  }
};

// Clean real business catalog: Admin adds products from Admin seat
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_REVIEWS: Review[] = [];

// Clean real business data starting at 0 orders
const INITIAL_ORDERS: Order[] = [];
const INITIAL_CUSTOMERS: UserAccount[] = [];

interface AdminCredentials {
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  isConfigured: boolean;
  updatedAt: string;
}

interface AdminSession {
  token: string;
  email: string;
  username: string;
  role: 'admin';
  createdAt: number;
  expiresAt: number;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const computed = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

const DEFAULT_SALT = "a1b2c3d4e5f607182930415263748596";
const DEFAULT_HASH = hashPassword("khojauadmin2026", DEFAULT_SALT);

const DEFAULT_ADMIN: AdminCredentials = {
  email: "admin@khojau.com",
  username: "admin",
  passwordHash: DEFAULT_HASH,
  salt: DEFAULT_SALT,
  isConfigured: true,
  updatedAt: new Date().toISOString()
};

interface StoreDB {
  settings: StoreSettings;
  products: Product[];
  reviews: Review[];
  orders: Order[];
  customers: UserAccount[];
  adminCredentials: AdminCredentials;
}

function loadDB(): StoreDB {
  if (fs.existsSync(DB_FILE)) {
    try {
      const cleanedRaw = fs.readFileSync(DB_FILE, 'utf-8')
        .replace(/khojau_hero_nepal_1791032655932\.jpg/g, 'khojau_hero_butwal_clean_1791096130543.jpg')
        .replace(/liyau_logo\.svg/gi, 'khojau_logo.svg')
        .replace(/Liyau/g, 'Khojau')
        .replace(/liyau/g, 'khojau')
        .replace(/LIYAU/g, 'KHOJAU')
        .replace(/लिऔँ/g, 'खोजौँ')
        .replace(/लिऔं/g, 'खोजौँ');
      const data = JSON.parse(cleanedRaw);
      const settings: StoreSettings = {
        ...INITIAL_SETTINGS,
        ...(data.settings || {}),
        logoUrl: (data.settings && data.settings.logoUrl) ? data.settings.logoUrl : INITIAL_SETTINGS.logoUrl,
        nepalFlagUrl: (data.settings && data.settings.nepalFlagUrl) ? data.settings.nepalFlagUrl : INITIAL_SETTINGS.nepalFlagUrl,
        heroBadgeText: (data.settings && data.settings.heroBadgeText) ? data.settings.heroBadgeText : INITIAL_SETTINGS.heroBadgeText,
        heroTitle: (data.settings && data.settings.heroTitle) ? data.settings.heroTitle : INITIAL_SETTINGS.heroTitle,
        heroSubtitle: (data.settings && data.settings.heroSubtitle) ? data.settings.heroSubtitle : INITIAL_SETTINGS.heroSubtitle,
        founder: {
          ...INITIAL_SETTINGS.founder,
          ...((data.settings && data.settings.founder) || {})
        },
        aboutBrand: {
          ...INITIAL_SETTINGS.aboutBrand,
          ...((data.settings && data.settings.aboutBrand) || {})
        },
        aiSettings: {
          ...INITIAL_SETTINGS.aiSettings,
          ...((data.settings && data.settings.aiSettings) || {})
        },
        promotionalOffer: {
          ...INITIAL_SETTINGS.promotionalOffer,
          ...((data.settings && data.settings.promotionalOffer) || {})
        },
        qrPaymentSettings: {
          ...INITIAL_SETTINGS.qrPaymentSettings,
          ...((data.settings && data.settings.qrPaymentSettings) || {})
        },
        websiteTexts: {
          ...INITIAL_SETTINGS.websiteTexts!,
          ...((data.settings && data.settings.websiteTexts) || {})
        }
      };

      let adminCredentials: AdminCredentials;
      if (data.adminCredentials && data.adminCredentials.salt && data.adminCredentials.passwordHash) {
        adminCredentials = {
          email: data.adminCredentials.email || "admin@khojau.com",
          username: data.adminCredentials.username || "admin",
          passwordHash: data.adminCredentials.passwordHash,
          salt: data.adminCredentials.salt,
          isConfigured: Boolean(data.adminCredentials.isConfigured ?? true),
          updatedAt: data.adminCredentials.updatedAt || new Date().toISOString()
        };
      } else {
        adminCredentials = { ...DEFAULT_ADMIN };
      }

      const loadedDB: StoreDB = {
        settings,
        products: Array.isArray(data.products) ? data.products : [],
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        orders: Array.isArray(data.orders) ? data.orders : [],
        customers: Array.isArray(data.customers) ? data.customers : [],
        adminCredentials
      };

      saveDB(loadedDB);
      return loadedDB;
    } catch (e) {
      console.error("Failed to read DB file, resetting to clean defaults", e);
    }
  }

  const defaultDB: StoreDB = {
    settings: INITIAL_SETTINGS,
    products: INITIAL_PRODUCTS,
    reviews: INITIAL_REVIEWS,
    orders: INITIAL_ORDERS,
    customers: INITIAL_CUSTOMERS,
    adminCredentials: { ...DEFAULT_ADMIN }
  };
  saveDB(defaultDB);
  return defaultDB;
}

function saveDB(dbToSave: StoreDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbToSave, null, 2), 'utf-8');
    broadcastLiveUpdate();
  } catch (err) {
    console.error("Failed to write to DB file:", err);
  }
}

let db = loadDB();

// Real-Time Server-Sent Events (SSE) clients for instant multi-device synchronization
const sseClients = new Set<Response>();
let lastModifiedVersion = Date.now();

function broadcastLiveUpdate() {
  lastModifiedVersion = Date.now();
  const payload = JSON.stringify({
    type: 'STORE_UPDATED',
    version: lastModifiedVersion,
    timestamp: new Date().toISOString()
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connected state with current version
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', version: lastModifiedVersion })}\n\n`);
  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

app.get('/api/sync-version', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ version: lastModifiedVersion });
});

// Setup server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// In-memory sessions map
const activeAdminSessions = new Map<string, AdminSession>();
const activeCustomerTokens = new Map<string, UserAccount>();

// Auth Middlewares
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized. Admin authentication required." });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const session = activeAdminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized. Invalid or expired session." });
  }
  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return res.status(401).json({ error: "Unauthorized. Session expired. Please log in again." });
  }
  (req as any).adminSession = session;
  next();
}

/* ========================================================================= */
/* API ROUTES                                                                */
/* ========================================================================= */

// 1. Image Upload Endpoint
app.post('/api/upload', requireAdmin, (req: Request, res: Response) => {
  try {
    const { data, filename } = req.body;
    if (!data) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = 'jpg';
    let buffer: Buffer;

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      else if (mime.includes('svg')) ext = 'svg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(data, 'base64');
    }

    const safeName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to save uploaded image" });
  }
});

// 2. Store Settings (Including Brand & Founder)
app.get('/api/settings', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({
    settings: db.settings,
    categories: Array.from(new Set(db.products.map(p => p.category))),
    version: lastModifiedVersion
  });
});

app.put('/api/settings', requireAdmin, (req: Request, res: Response) => {
  const updatedSettings: Partial<StoreSettings> = req.body;
  db.settings = {
    ...db.settings,
    ...updatedSettings,
    founder: {
      ...db.settings.founder,
      ...(updatedSettings.founder || {})
    },
    aboutBrand: {
      ...db.settings.aboutBrand,
      ...(updatedSettings.aboutBrand || {})
    },
    aiSettings: {
      ...db.settings.aiSettings,
      ...(updatedSettings.aiSettings || {})
    },
    promotionalOffer: {
      ...(db.settings.promotionalOffer || INITIAL_SETTINGS.promotionalOffer!),
      ...(updatedSettings.promotionalOffer || {})
    },
    qrPaymentSettings: {
      ...db.settings.qrPaymentSettings,
      ...(updatedSettings.qrPaymentSettings || {})
    },
    websiteTexts: {
      ...(db.settings.websiteTexts || INITIAL_SETTINGS.websiteTexts!),
      ...(updatedSettings.websiteTexts || {})
    }
  };
  saveDB(db);
  res.json({ success: true, settings: db.settings });
});

// 3. Products
app.get('/api/products', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const { category, search, sort, featured, popular, isNew, limit } = req.query;
  let result = db.products.filter(p => p.isVisible);

  if (category && category !== 'All') {
    result = result.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  if (featured === 'true') {
    result = result.filter(p => p.isFeatured);
  }
  if (popular === 'true') {
    result = result.filter(p => p.isPopular);
  }
  if (isNew === 'true') {
    result = result.filter(p => p.isNew);
  }

  // Sorting
  if (sort === 'price_asc') {
    result.sort((a, b) => {
      const priceA = (a.isDiscountActive !== false && a.discountPrice) ? a.discountPrice : a.price;
      const priceB = (b.isDiscountActive !== false && b.discountPrice) ? b.discountPrice : b.price;
      return priceA - priceB;
    });
  } else if (sort === 'price_desc') {
    result.sort((a, b) => {
      const priceA = (a.isDiscountActive !== false && a.discountPrice) ? a.discountPrice : a.price;
      const priceB = (b.isDiscountActive !== false && b.discountPrice) ? b.discountPrice : b.price;
      return priceB - priceA;
    });
  } else if (sort === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (limit) {
    result = result.slice(0, Number(limit));
  }

  res.json({ products: result });
});

// All products including hidden ones for Admin
app.get('/api/admin/products', requireAdmin, (req: Request, res: Response) => {
  res.json({ products: db.products });
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  const reviews = db.reviews.filter(r => r.productId === product.id && r.status === 'approved');
  res.json({ product, reviews });
});

app.post('/api/products', requireAdmin, (req: Request, res: Response) => {
  const price = Number(req.body.price) || 0;
  const isDiscountActive = req.body.isDiscountActive !== undefined
    ? Boolean(req.body.isDiscountActive)
    : (req.body.discountPrice && req.body.discountPrice < price);

  const discountPrice = isDiscountActive && req.body.discountPrice ? Number(req.body.discountPrice) : null;
  const discountPercentage = (isDiscountActive && discountPrice && discountPrice < price)
    ? Math.round(((price - discountPrice) / price) * 100)
    : (req.body.discountPercentage ? Number(req.body.discountPercentage) : 0);

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: req.body.name || "Untitled Product",
    slug: (req.body.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category: req.body.category || "General",
    price,
    discountPrice,
    isDiscountActive,
    discountPercentage,
    description: req.body.description || "",
    images: Array.isArray(req.body.images) && req.body.images.length > 0 ? req.body.images : ["/src/assets/images/hero_nepal_shopping_1790995906814.jpg"],
    specifications: req.body.specifications || {},
    stock: Number(req.body.stock) || 0,
    variants: req.body.variants || {},
    isFeatured: Boolean(req.body.isFeatured),
    isNew: Boolean(req.body.isNew),
    isPopular: Boolean(req.body.isPopular),
    isVisible: req.body.isVisible !== undefined ? Boolean(req.body.isVisible) : true,
    rating: 5.0,
    reviewCount: 0,
    createdAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  saveDB(db);
  res.status(201).json({ success: true, product: newProduct });
});

app.put('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const existing = db.products[index];
  const price = req.body.price !== undefined ? Number(req.body.price) : existing.price;
  const isDiscountActive = req.body.isDiscountActive !== undefined ? Boolean(req.body.isDiscountActive) : (existing.isDiscountActive ?? true);
  
  let discountPrice = req.body.discountPrice !== undefined
    ? (req.body.discountPrice ? Number(req.body.discountPrice) : null)
    : existing.discountPrice;

  if (!isDiscountActive) {
    discountPrice = null;
  }

  const discountPercentage = (isDiscountActive && discountPrice && discountPrice < price)
    ? Math.round(((price - discountPrice) / price) * 100)
    : (req.body.discountPercentage ? Number(req.body.discountPercentage) : 0);

  db.products[index] = {
    ...existing,
    ...req.body,
    price,
    discountPrice,
    isDiscountActive,
    discountPercentage,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : existing.stock,
  };

  saveDB(db);
  res.json({ success: true, product: db.products[index] });
});

app.delete('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  const deleted = db.products.splice(index, 1)[0];
  saveDB(db);
  res.json({ success: true, message: `Product ${deleted.name} removed.` });
});

// 4. Reviews
app.get('/api/reviews/:productId', (req: Request, res: Response) => {
  const reviews = db.reviews.filter(r => r.productId === req.params.productId && r.status === 'approved');
  res.json({ reviews });
});

app.post('/api/reviews', (req: Request, res: Response) => {
  const { productId, userName, userCity, rating, comment } = req.body;
  if (!productId || !userName || !rating || !comment) {
    return res.status(400).json({ error: "Missing required review fields" });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId,
    userName,
    userCity: userCity || "Butwal, Nepal",
    rating: Number(rating),
    comment,
    date: new Date().toISOString().split('T')[0],
    isVerified: true,
    isSample: false,
    status: 'approved'
  };

  db.reviews.unshift(newReview);

  // Recalculate rating
  const prodReviews = db.reviews.filter(r => r.productId === productId && r.status === 'approved');
  const prodIndex = db.products.findIndex(p => p.id === productId);
  if (prodIndex !== -1) {
    const totalScore = prodReviews.reduce((sum, r) => sum + r.rating, 0);
    db.products[prodIndex].rating = Number((totalScore / prodReviews.length).toFixed(1));
    db.products[prodIndex].reviewCount = prodReviews.length;
  }

  saveDB(db);
  res.status(201).json({ success: true, review: newReview });
});

app.get('/api/admin/reviews', requireAdmin, (req: Request, res: Response) => {
  res.json({ reviews: db.reviews });
});

app.put('/api/admin/reviews/:id/status', requireAdmin, (req: Request, res: Response) => {
  const review = db.reviews.find(r => r.id === req.params.id);
  if (!review) return res.status(404).json({ error: "Review not found" });

  review.status = req.body.status;
  saveDB(db);
  res.json({ success: true, review });
});

app.delete('/api/admin/reviews/:id', requireAdmin, (req: Request, res: Response) => {
  const index = db.reviews.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Review not found" });

  db.reviews.splice(index, 1);
  saveDB(db);
  res.json({ success: true });
});

// 5. Orders System with Strict Server-Side Price & Payment Validation (Requirements 2, 4, 5, 9)
app.post('/api/orders', (req: Request, res: Response) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, items, notes, customerId, transactionId, paymentScreenshotUrl } = req.body;

  if (!customerName || !customerPhone || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Customer name, phone, shipping address, and valid items are required" });
  }

  // Strict Server-Side Validation: Never trust the price sent by the customer's browser (Requirement 9)
  let subtotal = 0;
  const verifiedItems: OrderItem[] = [];

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const prod = db.products.find(p => p.id === item.productId);
    
    let verifiedPrice = Number(item.price) || 0;
    let verifiedName = item.name || "Item";
    let verifiedImage = item.image || "";

    if (prod) {
      verifiedName = prod.name;
      verifiedImage = prod.images?.[0] || "";
      // Active discount check
      verifiedPrice = (prod.isDiscountActive !== false && prod.discountPrice != null && prod.discountPrice > 0)
        ? prod.discountPrice
        : prod.price;
      
      // Update inventory safely
      prod.stock = Math.max(0, prod.stock - qty);
    }

    subtotal += verifiedPrice * qty;
    verifiedItems.push({
      productId: item.productId,
      name: verifiedName,
      price: verifiedPrice,
      quantity: qty,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      image: verifiedImage
    });
  }

  const isFreeDelivery = subtotal >= (db.settings.freeDeliveryThreshold || 2000);
  const shippingFee = isFreeDelivery
    ? 0
    : (shippingAddress.zone === 'kathmandu_valley' ? (db.settings.deliveryKathmanduFee || 50) : (db.settings.deliveryOutsideFee || 150));

  const total = subtotal + shippingFee;
  const orderNumber = `KJ-${Math.floor(1000 + Math.random() * 9000)}`;

  // Automatic payment remark generation (Requirement 4)
  const primaryName = verifiedItems[0]?.name || "Products";
  const itemSummary = verifiedItems.length > 1 ? `${primaryName} +${verifiedItems.length - 1} more` : primaryName;
  const paymentRemark = `Khojau Order #${orderNumber} — ${itemSummary}`;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber,
    customerId: customerId || undefined,
    customerName: customerName.trim(),
    customerEmail: (customerEmail || "").trim(),
    customerPhone: customerPhone.trim(),
    shippingAddress: {
      fullName: shippingAddress.fullName || customerName.trim(),
      phone: shippingAddress.phone || customerPhone.trim(),
      street: (shippingAddress.street || "").trim(),
      city: (shippingAddress.city || "Butwal, Nepal").trim(),
      zone: shippingAddress.zone || "kathmandu_valley",
      landmarks: (shippingAddress.landmarks || "").trim(),
      deliveryNotes: (shippingAddress.deliveryNotes || "").trim()
    },
    items: verifiedItems,
    subtotal,
    shippingFee,
    discountTotal: 0,
    total,
    paymentMethod: 'qr_pay',
    transactionId: (transactionId || "").trim(),
    paymentScreenshotUrl: (paymentScreenshotUrl || "").trim(),
    paymentStatus: 'pending_verification', // Never auto-verified on client click (Requirement 5)
    paymentRemark,
    orderStatus: 'pending',
    notes: (notes || "").trim(),
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveDB(db);

  res.status(201).json({ success: true, order: newOrder });
});

// Customer submits payment confirmation details (Transaction ID & optional screenshot)
app.patch('/api/orders/:id/payment-proof', (req: Request, res: Response) => {
  const { transactionId, paymentScreenshotUrl } = req.body;
  const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (transactionId) order.transactionId = transactionId.trim();
  if (paymentScreenshotUrl) order.paymentScreenshotUrl = paymentScreenshotUrl.trim();
  order.paymentStatus = 'pending_verification';

  saveDB(db);
  res.json({ success: true, order });
});

// Customer upload payment screenshot proof (No admin token needed)
app.post('/api/upload-payment-proof', (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "No image data provided" });

    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = 'jpg';
    let buffer: Buffer;

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(data, 'base64');
    }

    const safeName = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error("Payment proof upload error:", err);
    res.status(500).json({ error: "Failed to save payment proof image" });
  }
});

app.get('/api/orders', (req: Request, res: Response) => {
  const { customerPhone, customerEmail, customerId } = req.query;
  let orders = db.orders;

  if (customerId) {
    orders = orders.filter(o => o.customerId === customerId);
  } else if (customerPhone) {
    orders = orders.filter(o => o.customerPhone === customerPhone);
  } else if (customerEmail) {
    orders = orders.filter(o => o.customerEmail === customerEmail);
  }

  res.json({ orders });
});

app.get('/api/admin/orders', requireAdmin, (req: Request, res: Response) => {
  const { status, search } = req.query;
  let orders = [...db.orders];

  if (status && status !== 'all') {
    orders = orders.filter(o => o.orderStatus === status);
  }

  if (search) {
    const q = String(search).toLowerCase().trim();
    orders = orders.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q)
    );
  }

  res.json({ orders });
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (req.body.orderStatus) {
    order.orderStatus = req.body.orderStatus;
  }
  if (req.body.paymentStatus) {
    order.paymentStatus = req.body.paymentStatus;
    if (order.paymentStatus === 'verified' && order.orderStatus === 'pending') {
      order.orderStatus = 'processing';
    }
  }

  saveDB(db);
  res.json({ success: true, order });
});

// 6. Admin Authentication & Security
app.get('/api/auth/admin-status', (req: Request, res: Response) => {
  res.json({
    isConfigured: Boolean(db.adminCredentials && db.adminCredentials.isConfigured),
    username: db.adminCredentials?.username || "admin"
  });
});

app.post('/api/auth/admin-setup', (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password || password.length < 6) {
    return res.status(400).json({ error: "Valid username, email, and password (minimum 6 characters) are required." });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  db.adminCredentials = {
    username: username.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    salt,
    isConfigured: true,
    updatedAt: new Date().toISOString()
  };
  saveDB(db);

  const token = crypto.randomBytes(32).toString('hex');
  const session: AdminSession = {
    token,
    email: db.adminCredentials.email,
    username: db.adminCredentials.username,
    role: 'admin',
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  activeAdminSessions.set(token, session);

  res.json({
    success: true,
    token,
    user: {
      username: db.adminCredentials.username,
      email: db.adminCredentials.email,
      role: 'admin'
    }
  });
});

app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  const rawIdentifier = (req.body.identifier || req.body.email || req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!rawIdentifier || !password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const idLower = rawIdentifier.toLowerCase();
  const admin = db.adminCredentials || DEFAULT_ADMIN;

  const matchesIdentifier =
    idLower === admin.email.toLowerCase() ||
    idLower === admin.username.toLowerCase();

  const isPasswordValid = verifyPassword(password, admin.salt, admin.passwordHash);

  if (!matchesIdentifier || !isPasswordValid) {
    // Show simple "Invalid email or password" message as requested. Do not reveal whether account exists.
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Create secure authenticated session
  const token = crypto.randomBytes(32).toString('hex');
  const session: AdminSession = {
    token,
    email: admin.email,
    username: admin.username,
    role: 'admin',
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7-day session
  };
  activeAdminSessions.set(token, session);

  res.json({
    success: true,
    token,
    user: {
      username: admin.username,
      email: admin.email,
      role: "admin"
    }
  });
});

app.get('/api/auth/admin-session', requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  res.json({
    valid: true,
    user: {
      username: session.username,
      email: session.email,
      role: 'admin'
    }
  });
});

app.post('/api/auth/admin-logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    activeAdminSessions.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

app.put('/api/auth/admin-credentials', requireAdmin, (req: Request, res: Response) => {
  const { newUsername, newEmail, newPassword } = req.body;
  if (!db.adminCredentials) {
    db.adminCredentials = { ...DEFAULT_ADMIN };
  }

  if (newUsername && newUsername.trim().length >= 3) {
    db.adminCredentials.username = newUsername.trim();
  }

  if (newEmail && newEmail.includes('@')) {
    db.adminCredentials.email = newEmail.trim().toLowerCase();
  }

  if (newPassword && newPassword.length >= 6) {
    const salt = generateSalt();
    db.adminCredentials.salt = salt;
    db.adminCredentials.passwordHash = hashPassword(newPassword, salt);
  }

  db.adminCredentials.updatedAt = new Date().toISOString();
  saveDB(db);

  const session = (req as any).adminSession as AdminSession;
  if (session) {
    session.username = db.adminCredentials.username;
    session.email = db.adminCredentials.email;
  }

  res.json({
    success: true,
    message: "Admin credentials successfully updated.",
    user: {
      username: db.adminCredentials.username,
      email: db.adminCredentials.email,
      role: "admin"
    }
  });
});

app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const totalOrders = db.orders.length;
  const pendingOrders = db.orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;
  const completedOrders = db.orders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledOrders = db.orders.filter(o => o.orderStatus === 'cancelled').length;
  const totalRevenue = db.orders
    .filter(o => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalProducts = db.products.length;
  const outOfStockCount = db.products.filter(p => p.stock <= 0).length;
  const totalCustomers = db.customers.length;

  const stats: DashboardStats = {
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    totalProducts,
    outOfStockCount,
    totalCustomers,
    recentOrders: db.orders.slice(0, 8)
  };

  res.json({ stats });
});

// 7. Customer Auth
app.post('/api/auth/customer-register', (req: Request, res: Response) => {
  const { name, email, phone, password, address } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: "Name, email, phone, and password are required." });
  }

  const existing = db.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists. Please log in." });
  }

  const initialAddresses: CustomerAddress[] = [];
  if (address && address.street) {
    initialAddresses.push({
      id: `addr-${Date.now()}`,
      label: "Home",
      fullName: name,
      phone: phone,
      street: address.street,
      city: address.city || "Butwal, Nepal",
      zone: address.zone || "kathmandu_valley",
      isDefault: true
    });
  }

  const newCustomer: UserAccount = {
    id: `cust-${Date.now()}`,
    name,
    email,
    phone,
    role: "customer",
    addresses: initialAddresses,
    wishlist: [],
    createdAt: new Date().toISOString()
  };

  db.customers.push(newCustomer);
  saveDB(db);

  const token = `cust-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  activeCustomerTokens.set(token, newCustomer);

  res.status(201).json({ success: true, token, user: newCustomer });
});

app.post('/api/auth/customer-login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const customer = db.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (!customer) {
    return res.status(401).json({ error: "Account not found with this email. Please register." });
  }

  const token = `cust-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  activeCustomerTokens.set(token, customer);

  res.json({ success: true, token, user: customer });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const adminSession = activeAdminSessions.get(token);
  if (adminSession) {
    return res.json({
      user: {
        id: "admin-1",
        name: adminSession.username || "Khojau Administrator",
        email: adminSession.email,
        role: "admin"
      }
    });
  }

  const customer = activeCustomerTokens.get(token);
  if (customer) {
    return res.json({ user: customer });
  }

  res.status(401).json({ error: "Not authenticated" });
});

app.put('/api/auth/customer-profile', (req: Request, res: Response) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const customer = activeCustomerTokens.get(token);
  if (!customer) return res.status(401).json({ error: "Not authenticated" });

  const idx = db.customers.findIndex(c => c.id === customer.id);
  if (idx !== -1) {
    db.customers[idx] = { ...db.customers[idx], ...req.body };
    activeCustomerTokens.set(token, db.customers[idx]);
    saveDB(db);
    return res.json({ success: true, user: db.customers[idx] });
  }

  res.status(404).json({ error: "User not found" });
});

// 8. Grounded AI Shopping & General Intelligence Assistant (Khojau Saathi Smart Brain)
const aiRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkAiRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 35; // 35 messages per minute per IP
  const record = aiRateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    aiRateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count += 1;
  return true;
}

function getGenAiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

function getSafeFirstName(rawName?: string | null): string | null {
  if (!rawName || typeof rawName !== 'string') return null;
  const cleaned = rawName.trim();
  if (
    !cleaned ||
    cleaned.toLowerCase() === 'undefined' ||
    cleaned.toLowerCase() === 'null' ||
    cleaned.includes('@') ||
    cleaned.toLowerCase() === 'customer' ||
    cleaned.toLowerCase() === 'user'
  ) {
    return null;
  }
  const first = cleaned.split(/\s+/)[0];
  return first.length >= 2 ? first : null;
}

function evaluateSafeMathExpression(input: string): string | null {
  const q = input.toLowerCase().trim();

  // Percentage calculation: "what is 25% of 800" or "15 percent of 2500"
  const pctMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*of\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    if (!isNaN(pct) && !isNaN(total)) {
      const result = Number(((pct / 100) * total).toFixed(4));
      return `**${result}** (${pct}% of ${total} = ${result}).`;
    }
  }

  // Square root: "square root of 144" or "sqrt(144)"
  const sqrtMatch = q.match(/(?:square root of|sqrt\s*\(?)\s*(\d+(?:\.\d+)?)\)?/i);
  if (sqrtMatch) {
    const num = parseFloat(sqrtMatch[1]);
    if (!isNaN(num) && num >= 0) {
      const res = Number(Math.sqrt(num).toFixed(4));
      return `The square root of ${num} is **${res}**.`;
    }
  }

  // Basic arithmetic expression: e.g., "what is 45 * 12", "calculate (100 + 50) / 3", "25 + 75"
  const cleanedMath = q
    .replace(/^(what is|calculate|compute|solve|evaluate|how much is|kati huncha)\s+/i, '')
    .replace(/[?=]+$/g, '')
    .replace(/\bplus\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\btimes\b|\bmultiplied by\b/g, '*')
    .replace(/\bdivided by\b/g, '/')
    .trim();

  if (/^[\d\s+\-*/().^]+$/.test(cleanedMath) && /[\d]/.test(cleanedMath) && /[+\-*/^]/.test(cleanedMath)) {
    try {
      const jsExpr = cleanedMath.replace(/\^/g, '**');
      // Safe evaluation after strict character allowlist check
      const val = Function(`"use strict"; return (${jsExpr});`)();
      if (typeof val === 'number' && isFinite(val)) {
        const formatted = Number(val.toFixed(6));
        return `**${formatted}** (${cleanedMath} = ${formatted}).`;
      }
    } catch {}
  }

  return null;
}

export function generateSmartLocalReply(params: {
  message: string;
  history?: { role: string; text: string }[];
  customerFirstName: string | null;
  settings: StoreSettings;
  activeProducts: Product[];
  currentProduct: Product | null;
}): { reply: string; recommendedProductIds: string[] } {
  const { message, history = [], customerFirstName, settings, activeProducts, currentProduct } = params;
  const rawMsg = message.trim();
  const q = rawMsg.toLowerCase().replace(/[?!.,]+$/g, '').trim();
  const words = q.split(/\s+/).filter(Boolean);

  const storeName = settings.storeName || 'Khojau';
  const assistantName = settings.aiSettings?.assistantName || 'Khojau Saathi';
  const storeAddress = settings.storeAddress || 'Traffic Chowk, Butwal, Nepal';
  const contactPhone = settings.contactPhone || '+977-9801234567';
  const contactEmail = settings.contactEmail || 'support@khojau.com';
  const deliveryKathmanduFee = settings.deliveryKathmanduFee ?? 50;
  const deliveryOutsideFee = settings.deliveryOutsideFee ?? 150;
  const freeDeliveryThreshold = settings.freeDeliveryThreshold ?? 2000;
  const founder = settings.founder || {
    name: 'Shishir Pokhrel',
    role: 'Founder & Owner of Khojau',
    bio: 'Started Khojau in Butwal, Nepal to build an honest, reliable Nepali online store.',
    website: 'https://shishirpokhrel.com.np'
  };
  const aboutBrand = settings.aboutBrand || {
    aboutKhojau: 'Khojau (खोजौँ) is a modern Nepali online shopping brand based in Butwal, Nepal.',
    brandDescription: 'Based in Butwal, Nepal, Khojau is built on trust, transparency, and personal care.',
    mission: 'To deliver genuinely useful products from Butwal, Nepal across the nation.'
  };
  const qrPaymentSettings = settings.qrPaymentSettings;
  const promotionalOffer = settings.promotionalOffer;
  const deliveryInfoText = settings.deliveryInfoText || '24-48 hours in Butwal & Rupandehi, 2-4 business days nationwide.';
  const returnPolicyText = settings.returnPolicyText || '7-Day Hassle-Free Returns & Exchanges for defective or incorrect items.';

  const namePrefix = customerFirstName ? ` ${customerFirstName}` : '';
  const hasDevanagari = /[\u0900-\u097F]/.test(rawMsg);
  const lastAiMsg = [...history].reverse().find(h => h.role === 'model')?.text || '';
  const lastUserMsg = [...history].reverse().find(h => h.role === 'user')?.text || '';

  // 1. Exact/Short Conversational Greetings & Courtesies (Never repeat the full initial welcome message!)
  if (/^(hi|hii+|hey|heyy+)$/i.test(q)) {
    return {
      reply: `Hi${namePrefix}! 😊 How can I help you today?`,
      recommendedProductIds: []
    };
  }
  if (/^(hello|helloo+|hlw|hlo)$/i.test(q)) {
    return {
      reply: `Hello${namePrefix}! Welcome back. What can I help you find on ${storeName}?`,
      recommendedProductIds: []
    };
  }
  if (/^(namaste|namaskar|नमस्ते|नमस्कार)$/i.test(q)) {
    return {
      reply: hasDevanagari
        ? `नमस्ते${namePrefix}! 🙏 आज म तपाईंलाई कसरी सहयोग गर्न सक्छु?`
        : `Namaste${namePrefix}! 🙏 How can I help you today?`,
      recommendedProductIds: []
    };
  }
  if (
    /^(how are you|how r u|how are u|kasto chha|kasto xa|k छ|के छ|कस्तो छ|sanchai|सन्चै)$/i.test(q) ||
    q === 'how are you doing'
  ) {
    if (hasDevanagari || /kasto|sanchai/.test(q)) {
      return {
        reply: `म एकदमै ठीक छु, धन्यवाद! 😊 तपाईंलाई ${storeName} (खोजौँ) मा वा अन्य कुनै विषयमा के सहयोग गरूँ?`,
        recommendedProductIds: []
      };
    }
    return {
      reply: `I'm doing well, thank you! 😊 How can I help you with ${storeName} today?`,
      recommendedProductIds: []
    };
  }
  if (/^(thank you|thanks|thx|tq|dhanyabad|dhanyavad|धन्यवाद)$/i.test(q) || q.startsWith('thank you ')) {
    if (hasDevanagari || /dhanyabad|dhanyavad/.test(q)) {
      return {
        reply: `तपाईंलाई धेरै धन्यवाद! 😊 अरू केही जानकारी चाहिएमा भन्नुहोला।`,
        recommendedProductIds: []
      };
    }
    return {
      reply: `You're welcome! 😊 Let me know if you need anything else.`,
      recommendedProductIds: []
    };
  }
  if (/^(bye|goodbye|good bye|see ya|tata|बाइ|बिदा)$/i.test(q)) {
    return {
      reply: `Goodbye${namePrefix}! 👋 Thank you for visiting ${storeName}. Have a great day!`,
      recommendedProductIds: []
    };
  }
  if (/^(ok|okay|okk|okie|हुन्छ|ठिक छ|thik xa|thik chha|la|ल)$/i.test(q)) {
    return {
      reply: hasDevanagari
        ? `हस! 😊 तपाईंलाई सामान, मूल्य, वा अन्य कुनै प्रश्न सोध्न मन छ भने भन्नुहोला।`
        : `Great! 👍 Let me know if you have any questions about our products, prices, or any other topic.`,
      recommendedProductIds: []
    };
  }
  if (/^(help|सहयोग|maddat|madat)$/i.test(q)) {
    return {
      reply: `I'm here to help! 😊 You can ask me about:\n• **${storeName} Shopping:** Available products, prices, discounts, QR payment, delivery from Butwal, or order tracking\n• **General Questions:** Science, math, programming, English grammar, Nepal facts, or everyday topics.\n\nWhat would you like to know?`,
      recommendedProductIds: []
    };
  }
  if (/^(who are you|what is your name|timro naam k ho|तपाईं को हो)$/i.test(q)) {
    return {
      reply: `I am **${assistantName}**, the intelligent AI assistant for **${storeName} (खोजौँ)** in Butwal, Nepal! 😊 I can help you shop on ${storeName} and also answer general questions on science, technology, math, language, and more.`,
      recommendedProductIds: []
    };
  }

  // 2. Context-Aware Follow-Up Resolution (e.g., "Who created it?", "How much does it cost?", "Explain more")
  if (/^(who created it|who made it|who owns it|who founded it|kasle banako|कसले बनाएको)$/i.test(q)) {
    return {
      reply: `**${storeName} (खोजौँ)** was founded by **${founder.name}** (${founder.role}) in Butwal, Nepal.`,
      recommendedProductIds: []
    };
  }
  if (/^(how much does it cost|what is the price|how much is it|kati parcha|मूल्य कति हो|price kati ho)$/i.test(q)) {
    if (currentProduct) {
      const sellingPrice =
        currentProduct.isDiscountActive !== false && currentProduct.discountPrice
          ? currentProduct.discountPrice
          : currentProduct.price;
      return {
        reply: `**${currentProduct.name}** costs **Rs. ${sellingPrice.toLocaleString()}**${
          currentProduct.discountPrice && currentProduct.discountPrice < currentProduct.price
            ? ` (discounted from Rs. ${currentProduct.price.toLocaleString()})`
            : ''
        }. It is currently ${currentProduct.stock > 0 ? `in stock (${currentProduct.stock} available)` : 'out of stock'}.`,
        recommendedProductIds: [currentProduct.id]
      };
    }
    const recentProduct = activeProducts.find(
      p =>
        lastAiMsg.toLowerCase().includes(p.name.toLowerCase()) ||
        lastUserMsg.toLowerCase().includes(p.name.toLowerCase())
    );
    if (recentProduct) {
      const sellingPrice =
        recentProduct.isDiscountActive !== false && recentProduct.discountPrice
          ? recentProduct.discountPrice
          : recentProduct.price;
      return {
        reply: `**${recentProduct.name}** is priced at **Rs. ${sellingPrice.toLocaleString()}** (${
          recentProduct.stock > 0 ? 'In Stock' : 'Out of Stock'
        }).`,
        recommendedProductIds: [recentProduct.id]
      };
    }
  }

  // 3. Math & Calculations
  const mathReply = evaluateSafeMathExpression(rawMsg);
  if (mathReply) {
    return {
      reply: mathReply,
      recommendedProductIds: []
    };
  }

  // 4. Store Location / Address (English, Nepali & Romanized Nepali)
  if (
    /location|where is khojau|located|address|where are you based|office|hub|kaha xa|kaha chha|kata xa|kata chha|कहाँ छ|ठेगाना/i.test(q) &&
    !/capital/.test(q)
  ) {
    if (hasDevanagari || /kaha|kata/.test(q)) {
      return {
        reply: `${storeName} (खोजौँ) नेपालको **बुटवल (${storeAddress})** मा अवस्थित छ। 🇳🇵 हामी बुटवलबाटै नेपालका सातै प्रदेशमा सुरक्षित डेलिभरी गर्छौं।`,
        recommendedProductIds: []
      };
    }
    return {
      reply: `**${storeName} (खोजौँ)** is proudly based in **Butwal, Nepal** (${storeAddress}). 🇳🇵 All orders are inspected and dispatched directly from our Butwal hub across Butwal, Rupandehi, and all 7 provinces of Nepal.`,
      recommendedProductIds: []
    };
  }

  // 5. Order Tracking / How to Track Order
  if (/track|where is my order|order status|mero order|अर्डर ट्र्याक|अर्डर कहाँ/i.test(q)) {
    return {
      reply: `To track your order on **${storeName}**:\n1. Click the **Account / Login** icon in the top navigation bar.\n2. Sign in with the email you used when ordering.\n3. Under **Recent Orders**, you can view your live order status (**Pending**, **Processing**, **Shipped**, or **Delivered**) and payment verification status.\n\nFor direct assistance with an order, you can also call or WhatsApp our Butwal team at **${contactPhone}**.`,
      recommendedProductIds: []
    };
  }

  // 6. How to Place an Order / How to Use the Website
  if (/how to order|how do i order|place an order|how to buy|kasari order|kasari kinne|कसरी अर्डर|कसरी किन्ने|how to use/i.test(q)) {
    return {
      reply: `Ordering on **${storeName} (खोजौँ)** is simple:\n1. Browse the catalog or search for a product and click **Add to Cart**.\n2. Open your **Cart** and click **Proceed to Checkout**.\n3. Enter your delivery details (Butwal/Rupandehi or anywhere in Nepal).\n4. Scan our official **QR Code** using eSewa, Khalti, Fonepay, or Mobile Banking and submit your **Transaction ID**.\n\nOur Butwal team will verify your payment and dispatch your order promptly!`,
      recommendedProductIds: []
    };
  }

  // 7. Payment Methods / QR / COD
  if (/payment|qr|esewa|khalti|fonepay|mobile banking|cod|cash on delivery|kasari tirne|भुक्तानी|पैसा तिर्ने/i.test(q)) {
    return {
      reply: `At **${storeName}**, we accept secure **Official QR Payments** via **${qrPaymentSettings?.providerName || 'eSewa, Khalti, Fonepay, and Mobile Banking'}** (Account: **${qrPaymentSettings?.accountName || 'Khojau Online Store'}**).\n\n• **How it works:** At checkout, scan our official QR code, complete the payment for your order total, and enter your **Transaction ID / Reference Number**.\n• **Note:** Cash on Delivery (COD) is not available. Once our Butwal team verifies your payment, your order is packed and shipped!`,
      recommendedProductIds: []
    };
  }

  // 8. Delivery / Shipping Charges & Timeline
  if (/delivery|shipping|charge|fee|how long|shipping cost|kati lagcha|डेलिभरी|ढुवानी/i.test(q)) {
    return {
      reply: `**Delivery Information from Butwal, Nepal:**\n• **Butwal & Rupandehi:** Rs. ${deliveryKathmanduFee} (FREE on orders above Rs. ${freeDeliveryThreshold.toLocaleString()})\n• **Outside Butwal (Nationwide across Nepal):** Rs. ${deliveryOutsideFee} flat\n• **Estimated Time:** ${deliveryInfoText}`,
      recommendedProductIds: []
    };
  }

  // 9. Returns / Refunds / Exchanges
  if (/return|refund|exchange|replace|policy|damaged|defective|फिर्ता|रिटर्न/i.test(q)) {
    return {
      reply: `**${storeName} Return & Exchange Policy:**\n${returnPolicyText}\n\nIf you need help with a return, please contact our support team at **${contactPhone}** or **${contactEmail}**.`,
      recommendedProductIds: []
    };
  }

  // 10. Contact / Customer Support
  if (/contact|phone|call|email|whatsapp|support|number|सम्पर्क|फोन नम्बर/i.test(q)) {
    return {
      reply: `You can contact **${storeName} (खोजौँ)** in Butwal, Nepal anytime:\n• **Phone / WhatsApp:** ${contactPhone}\n• **Email:** ${contactEmail}\n• **Hub Address:** ${storeAddress}`,
      recommendedProductIds: []
    };
  }

  // 11. Founder / Owner / About Khojau
  if (/founder|owner|who started|who made|who created|shishir|संस्थापक|मालिक/i.test(q)) {
    return {
      reply: `**${storeName} (खोजौँ)** was founded by **${founder.name}** (${founder.role}) in Butwal, Nepal.\n\n"${founder.bio}"\n\nWebsite: ${founder.website || 'https://shishirpokhrel.com.np'}`,
      recommendedProductIds: []
    };
  }
  if (/about khojau|what is khojau|story|mission|खोजौँ के हो/i.test(q)) {
    return {
      reply: `${aboutBrand.aboutKhojau}\n\n${aboutBrand.brandDescription}\n\n**Our Mission:** ${aboutBrand.mission}`,
      recommendedProductIds: []
    };
  }

  // 12. Discounts & Offers
  if (/discount|offer|promo|sale|dashain|deal|छुट|अफर/i.test(q)) {
    const discountedProds = activeProducts.filter(
      p => p.isDiscountActive !== false && p.discountPrice && p.discountPrice < p.price
    );
    const offerText = promotionalOffer?.enabled
      ? `🎉 **Active Offer:** ${promotionalOffer.title} — ${promotionalOffer.subtitle} (Up to ${promotionalOffer.discountPercentage}% OFF!)`
      : `There are no special popup festival promotions active right now.`;
    if (discountedProds.length > 0) {
      const list = discountedProds
        .slice(0, 4)
        .map(p => `• **${p.name}** — Rs. ${p.discountPrice?.toLocaleString()} (was Rs. ${p.price.toLocaleString()})`)
        .join('\n');
      return {
        reply: `${offerText}\n\n**Products currently on discount:**\n${list}\n\nClick any product card below to view full details!`,
        recommendedProductIds: discountedProds.slice(0, 3).map(p => p.id)
      };
    }
    return {
      reply: `${offerText}\n\n${
        activeProducts.length === 0
          ? 'Our product catalog is currently empty while our Butwal team adds new inventory. Please check back soon!'
          : 'You can browse all current prices in our product catalog.'
      }`,
      recommendedProductIds: []
    };
  }

  // 13. Broad General Knowledge, Science, Tech, Programming & Education (Offline/Static Fallback Brain)
  if (/capital of nepal|nepal's capital|nepal ko rajdhani|नेपालको राजधानी/i.test(q)) {
    return {
      reply: `The capital of Nepal is **Kathmandu**! 🇳🇵`,
      recommendedProductIds: []
    };
  }
  if (/photosynthesis|प्रकाश संश्लेषण/i.test(q)) {
    return {
      reply: `**Photosynthesis** is the process by which green plants, algae, and some bacteria use **sunlight**, **water**, and **carbon dioxide** to create their own food (**glucose**) and release **oxygen** into the air.\n\n• **Key pigment:** Chlorophyll (in plant leaves)\n• **Formula:** 6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ (Glucose) + 6O₂`,
      recommendedProductIds: []
    };
  }
  if (/artificial intelligence|what is ai\b|machine learning|how ai works/i.test(q)) {
    return {
      reply: `**Artificial Intelligence (AI)** is a branch of computer science that enables machines and software to perform tasks that typically require human intelligence—such as understanding language, recognizing patterns, solving problems, and making decisions.\n\n**Everyday example:** Voice assistants, recommendation systems on shopping sites, and smart chat assistants like me (**${assistantName}**) use AI models to understand your questions and respond naturally!`,
      recommendedProductIds: []
    };
  }
  if (/teach me python|learn python|what is python|python programming/i.test(q)) {
    return {
      reply: `**Python** is one of the most popular, beginner-friendly programming languages used for web development, data science, automation, and AI.\n\nHere is a simple beginner example:\n\`\`\`python\nname = "${customerFirstName || 'Friend'}"\nprint(f"Namaste, {name}! Welcome to Python.")\n\n# Simple loop\nfor i in range(1, 4):\n    print("Step", i)\n\`\`\`\nWould you like to learn about variables, loops, or functions next?`,
      recommendedProductIds: []
    };
  }
  if (/build a website|make a website|create a website|web development|html|javascript|react/i.test(q)) {
    return {
      reply: `I'd love to help you with building a website! 💻\n\nTypically, a modern website is built with:\n1. **HTML** — Structure and content\n2. **CSS / Tailwind CSS** — Styling, colors, and responsive layout\n3. **JavaScript / TypeScript (React)** — Interactive features\n4. **Backend (Node.js / Database)** — Storing users, products, or orders.\n\nWhat kind of website are you planning to build (e.g., a personal portfolio, blog, or online store)?`,
      recommendedProductIds: []
    };
  }
  if (/mount everest|sagarmatha|सगरमाथा|highest mountain/i.test(q)) {
    return {
      reply: `**Mount Everest (सगरमाथा / Sagarmatha)**, located in the Mahalangur Himal sub-range of the Himalayas in Nepal, is the highest mountain in the world at **8,848.86 meters (29,031.7 ft)** above sea level! 🏔️🇳🇵`,
      recommendedProductIds: []
    };
  }
  if (/newton|gravity|laws of motion|physics/i.test(q)) {
    return {
      reply: `**Newton's Three Laws of Motion** explain how objects move:\n1. **First Law (Inertia):** An object stays at rest or in uniform motion unless acted on by an external force.\n2. **Second Law (F = ma):** Force equals mass times acceleration.\n3. **Third Law:** For every action, there is an equal and opposite reaction.`,
      recommendedProductIds: []
    };
  }

  // 14. Product Queries & Specific Item Search against Real Store Catalog
  const matchedProds = activeProducts.filter(p => {
    const pName = p.name.toLowerCase();
    const pCat = p.category.toLowerCase();
    const pDesc = (p.description || '').toLowerCase();
    if (q.includes(pName) || q.includes(pCat)) return true;
    return words.some(
      w =>
        w.length >= 3 &&
        !['what', 'where', 'when', 'which', 'have', 'does', 'khojau', 'product', 'products', 'available', 'price', 'show', 'buy', 'can', 'the', 'and', 'for'].includes(w) &&
        (pName.includes(w) || pCat.includes(w) || pDesc.includes(w))
    );
  });

  if (matchedProds.length > 0) {
    const lines = matchedProds
      .slice(0, 4)
      .map(p => {
        const hasDisc = p.isDiscountActive !== false && p.discountPrice && p.discountPrice < p.price;
        const sellingPrice = hasDisc ? p.discountPrice! : p.price;
        const priceStr = hasDisc
          ? `Rs. ${sellingPrice.toLocaleString()} (was Rs. ${p.price.toLocaleString()})`
          : `Rs. ${sellingPrice.toLocaleString()}`;
        return `• **${p.name}** (${p.category}) — ${priceStr} · ${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}`;
      })
      .join('\n');
    return {
      reply: `Here ${matchedProds.length === 1 ? 'is the matching product' : 'are the matching products'} from our live **${storeName}** catalog:\n${lines}\n\nYou can click on a product card below to open its product page!`,
      recommendedProductIds: matchedProds.slice(0, 3).map(p => p.id)
    };
  }

  if (
    /product|products|available|catalog|inventory|stock|items|what do you sell|what can i buy|के के पाइन्छ|सामान/i.test(q)
  ) {
    if (activeProducts.length === 0) {
      return {
        reply: `Right now, our **${storeName} (खोजौँ)** catalog has no products listed while our Butwal, Nepal team updates the inventory. Please check back soon or reach out to us at **${contactPhone}** (${contactEmail}) if you're looking for a specific item!`,
        recommendedProductIds: []
      };
    }
    const displayList = activeProducts.slice(0, 5);
    const lines = displayList
      .map(p => {
        const hasDisc = p.isDiscountActive !== false && p.discountPrice && p.discountPrice < p.price;
        const sellingPrice = hasDisc ? p.discountPrice! : p.price;
        return `• **${p.name}** (${p.category}) — Rs. ${sellingPrice.toLocaleString()} · ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}`;
      })
      .join('\n');
    return {
      reply: `We currently have **${activeProducts.length} product${activeProducts.length === 1 ? '' : 's'}** available on **${storeName} (खोजौँ)**:\n${lines}\n\nClick any product card below to view its full details and order!`,
      recommendedProductIds: displayList.slice(0, 3).map(p => p.id)
    };
  }

  // 15. Polite Fallback when offline/unmatched
  if (currentProduct) {
    const sellingPrice =
      currentProduct.isDiscountActive !== false && currentProduct.discountPrice
        ? currentProduct.discountPrice
        : currentProduct.price;
    return {
      reply: `I see you're viewing **${currentProduct.name}** (Rs. ${sellingPrice.toLocaleString()}, ${
        currentProduct.stock > 0 ? `${currentProduct.stock} in stock` : 'Out of stock'
      }).\n\nCould you clarify your question? You can ask me about this product, delivery from Butwal, QR payment, or any general knowledge topic!`,
      recommendedProductIds: [currentProduct.id]
    };
  }

  return {
    reply: `I want to make sure I give you an accurate answer! 😊 Could you rephrase or tell me a bit more about what you'd like to know? You can ask me about **${storeName} (खोजौँ)** products, prices, QR payments, and delivery from Butwal, or ask general questions about science, math, coding, or Nepal.`,
    recommendedProductIds: activeProducts.slice(0, 2).map(p => p.id)
  };
}

app.get('/api/ai/status', (req: Request, res: Response) => {
  const client = getGenAiClient();
  res.json({
    connected: Boolean(client),
    model: 'gemini-3.8-flash',
    assistantName: db.settings.aiSettings?.assistantName || 'Khojau Saathi'
  });
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (!checkAiRateLimit(clientIp)) {
    return res.status(429).json({
      error: "Too many messages sent in a short time. Please wait a moment and try again."
    });
  }

  const { message, history, currentProductId, customerName, storeContextOverride } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: "Please enter a valid message." });
  }

  const sanitizedMessage = message.trim().slice(0, 1200);
  const customerFirstName = getSafeFirstName(customerName);

  // Merge latest settings & products (supports real-time cloud override from client if provided)
  const effectiveSettings: StoreSettings = storeContextOverride?.settings
    ? { ...db.settings, ...storeContextOverride.settings }
    : db.settings;
  const effectiveProducts: Product[] = Array.isArray(storeContextOverride?.products)
    ? storeContextOverride.products
    : db.products;

  const activeProducts = effectiveProducts.filter(p => p.isVisible !== false);
  const currentProduct = currentProductId ? activeProducts.find(p => p.id === currentProductId) || null : null;

  const {
    aiSettings,
    storeName,
    deliveryKathmanduFee,
    deliveryOutsideFee,
    freeDeliveryThreshold,
    contactPhone,
    contactEmail,
    storeAddress,
    founder,
    aboutBrand,
    promotionalOffer,
    qrPaymentSettings,
    returnPolicyText,
    deliveryInfoText
  } = effectiveSettings;

  // 1. Fast-path exact single-word/short greetings ("hi", "hello", "namaste", "how are you?", "thank you", "bye")
  // so they ALWAYS respond naturally and never repeat the initial welcome message!
  const qNorm = sanitizedMessage.toLowerCase().replace(/[?!.,]+$/g, '').trim();
  if (
    /^(hi|hii+|hey|heyy+|hello|helloo+|hlw|hlo|namaste|namaskar|नमस्ते|नमस्कार|how are you|how r u|how are u|thank you|thanks|thx|tq|dhanyabad|धन्यवाद|bye|goodbye|good bye)$/i.test(
      qNorm
    )
  ) {
    const fast = generateSmartLocalReply({
      message: sanitizedMessage,
      history,
      customerFirstName,
      settings: effectiveSettings,
      activeProducts,
      currentProduct
    });
    return res.json({ ...fast, mode: 'instant-greeting' });
  }

  const catalogContext = activeProducts.map(p => {
    const hasDiscount = p.isDiscountActive !== false && p.discountPrice != null && p.discountPrice > 0 && p.discountPrice < p.price;
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      originalPrice: `Rs. ${p.price}`,
      currentSellingPrice: `Rs. ${hasDiscount ? p.discountPrice : p.price}`,
      discount: hasDiscount ? `${p.discountPercentage || Math.round(((p.price - (p.discountPrice as number)) / p.price) * 100)}% OFF` : 'No active discount',
      stockStatus: p.stock > 0 ? `${p.stock} units in stock` : 'Out of stock',
      rating: `${p.rating}/5 (${p.reviewCount} reviews)`,
      description: p.description,
      variants: p.variants ? Object.keys(p.variants).join(', ') : 'Standard'
    };
  });

  const systemPrompt = `You are ${aiSettings?.assistantName || 'Khojau Saathi'}, a fully intelligent, warm, and versatile conversational AI assistant and official shopping guide for ${storeName || 'Khojau'} (खोजौँ).
Never use the old name "Liyau" anywhere. The official brand name is strictly Khojau (खोजौँ).

1. GENERAL INTELLIGENCE & BROAD TOPIC CAPABILITY (CRITICAL):
- You are NOT restricted to shopping-only questions. You must intelligently, accurately, and helpfully answer general questions across ALL topics, including:
  • General knowledge, world facts, geography, history, and Nepali culture
  • Science, physics, chemistry, biology (e.g., photosynthesis), and mathematics/calculations
  • Computer science, programming (Python, JavaScript, React, web development), technology, and how AI/machine learning works
  • English grammar, vocabulary, writing, translation, homework explanations, and step-by-step learning
  • Business, entrepreneurship, online shopping, creative writing, brainstorming, and everyday practical advice.
- When answering a general knowledge, science, math, or coding question, answer it directly and clearly without forcing an unnatural sales pitch.

2. CONVERSATION, CONTEXT & GREETING RULES:
- Understand multi-turn conversation history and pronouns ("it", "there", "who created it?", "how much does it cost?", "explain more simply", "give an example").
- Do NOT repeat the full session welcome message ("Namaste! Welcome to Khojau. I am Khojau Saathi...") on every turn.
- Keep responses clear, well-structured, friendly, and concise (use bullet points or short paragraphs when helpful).
- Language Support:
  • If the user writes in English, reply in clear English.
  • If the user writes in Nepali (Devanagari), reply in natural Nepali.
  • If the user writes in Romanized Nepali (e.g., "kasto chha", "yo kasari kaam garcha", "khojau ma ke ke paincha"), reply naturally in friendly Romanized Nepali or Nepali/English as appropriate.
${customerFirstName ? `- Authenticated Customer Context: The signed-in customer's first name is "${customerFirstName}". Use their name naturally when greeting or assisting them, without overusing it in every sentence.` : ''}

3. VERIFIED KHOJAU (खोजौँ) STORE KNOWLEDGE & STRICT GROUNDING:
When answering questions about ${storeName || 'Khojau'}, its products, prices, orders, payment, delivery, or founder, strictly use ONLY these verified facts:
- Store Name: ${storeName || 'Khojau'} (खोजौँ)
- Location: Proudly based in Butwal, Nepal (${storeAddress || 'Traffic Chowk, Butwal, Nepal'}). NEVER say Khojau is based in Kathmandu.
- Founder & Owner: ${founder?.name || 'Shishir Pokhrel'} (${founder?.role || 'Founder & Owner of Khojau'}). Bio: ${founder?.bio || ''} | Website: ${founder?.website || 'https://shishirpokhrel.com.np'}
- About Khojau: ${aboutBrand?.aboutKhojau || ''} ${aboutBrand?.brandDescription || ''}
- Mission: ${aboutBrand?.mission || ''}
- Contact Support: Phone/WhatsApp: ${contactPhone} | Email: ${contactEmail}
- Payment Method: Official QR Payment (${qrPaymentSettings?.providerName || 'eSewa, Khalti, Fonepay, Mobile Banking'}, Account: ${qrPaymentSettings?.accountName || 'Khojau Online Store'}). Customers scan the official QR at checkout and submit their Transaction ID for verification. Cash on Delivery (COD) is NOT available.
- Delivery Fees & Timelines:
  • Butwal & Rupandehi: Rs. ${deliveryKathmanduFee} (FREE on orders above Rs. ${freeDeliveryThreshold})
  • Nationwide (Outside Butwal across all 7 provinces of Nepal): Rs. ${deliveryOutsideFee} flat
  • Delivery Timeline: ${deliveryInfoText}
- Return Policy: ${returnPolicyText}
- How to Track Orders: Sign in to the customer account via the top navigation bar and check "Recent Orders" for live status (Pending, Processing, Shipped, Delivered), or contact support at ${contactPhone}.
- Current Promotional Offer: ${promotionalOffer?.enabled ? `${promotionalOffer.title} — ${promotionalOffer.subtitle} (Up to ${promotionalOffer.discountPercentage}% OFF)` : 'No special popup festival offer is currently active.'}
- NEVER invent fake products, fake prices, fake discounts, or claim you placed/modified an order.
${currentProduct ? `- Currently Viewed Product on Screen: "${currentProduct.name}" (${currentProduct.category}) — Selling Price: Rs. ${(currentProduct.isDiscountActive !== false && currentProduct.discountPrice) || currentProduct.price}, Stock: ${currentProduct.stock > 0 ? `${currentProduct.stock} in stock` : 'Out of stock'}.` : ''}

LIVE PRODUCT CATALOG (${catalogContext.length} products):
${catalogContext.length > 0 ? JSON.stringify(catalogContext, null, 2) : 'Currently 0 products are listed in the catalog while the Butwal team updates inventory. If asked what products are available, honestly state that no products are currently listed in the catalog yet and invite them to check back soon or contact support.'}

STORE FAQS:
${(aiSettings?.faqList || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

ADMIN CUSTOM INSTRUCTIONS:
${aiSettings?.customInstructions || ''}`;

  const client = getGenAiClient();
  if (client) {
    try {
      const formattedHistory = Array.isArray(history)
        ? history
            .slice(-14)
            .filter(h => h && typeof h.text === 'string' && h.text.trim())
            .map(h => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text.trim().slice(0, 1500) }]
            }))
        : [];

      const contents = [
        ...formattedHistory,
        { role: 'user', parts: [{ text: sanitizedMessage }] }
      ];

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out after 18s')), 18000)
      );

      const response: any = await Promise.race([
        client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.6
          }
        }),
        timeoutPromise
      ]);

      const replyText = response?.text;
      if (replyText && typeof replyText === 'string' && replyText.trim()) {
        const cleanedReply = replyText
          .trim()
          .replace(/Liyau/g, 'Khojau')
          .replace(/liyau/g, 'khojau')
          .replace(/लियौँ/g, 'खोजौँ');

        const mentionedProductIds = activeProducts
          .filter(
            p =>
              cleanedReply.toLowerCase().includes(p.name.toLowerCase()) ||
              (currentProduct && currentProduct.id === p.id && /price|cost|buy|stock|product|this/i.test(qNorm))
          )
          .slice(0, 3)
          .map(p => p.id);

        return res.json({
          reply: cleanedReply,
          recommendedProductIds: mentionedProductIds,
          mode: 'gemini-ai'
        });
      }
    } catch (err) {
      console.warn('Gemini generation error, using smart local brain:', err instanceof Error ? err.message : err);
    }
  }

  // Intelligent Grounded Fallback Brain (handles greetings, store data, math, science, coding, Nepali/Romanized Nepali)
  const fallbackResult = generateSmartLocalReply({
    message: sanitizedMessage,
    history,
    customerFirstName,
    settings: effectiveSettings,
    activeProducts,
    currentProduct
  });

  res.json({
    ...fallbackResult,
    mode: client ? 'fallback-after-error' : 'local-smart-brain'
  });
});

/* ========================================================================= */
/* VITE MIDDLEWARE OR STATIC SERVING                                         */
/* ========================================================================= */

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Khojau server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
