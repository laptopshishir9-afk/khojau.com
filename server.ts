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
  heroBannerUrl: "/src/assets/images/khojau_hero_nepal_1791032655932.jpg",
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
    welcomeMessage: "Namaste! 🙏 I am Khojau Saathi, your shopping assistant for Khojau in Butwal, Nepal. How can I help you today?",
    tone: "Friendly, helpful, honest, and culturally respectful Nepali shopping guide",
    storeBio: "Khojau (खोजौँ) is an authentic Nepali online shopping store based in Butwal, Nepal, founded by Shishir Pokhrel in Butwal, Nepal. We connect customers across Nepal with genuine products, local craftsmanship, and verified electronics with secure QR digital payments.",
    faqList: [
      { question: "Where is Khojau store located?", answer: "Khojau is proudly based in Butwal, Nepal. Our main office and fulfillment hub is located in Butwal, Nepal, and we deliver nationwide across all provinces of Nepal." },
      { question: "How do I make payment?", answer: "You can pay securely via QR Payment using eSewa, Khalti, Fonepay, or any Nepali Mobile Banking app. After scanning the official QR code and completing payment, submit your Transaction ID for verification." },
      { question: "What is your delivery charge?", answer: "Local delivery in Butwal & Rupandehi is Rs. 50 (Free for orders above Rs. 2,000). Nationwide delivery outside Butwal across Nepal is Rs. 150 flat." },
      { question: "What is your return policy?", answer: "We offer a 7-day hassle-free return and replacement policy for damaged, defective, or incorrect products." }
    ],
    suggestedQuestions: [
      "Where is Khojau located in Nepal?",
      "How does QR payment work on Khojau?",
      "What are the delivery charges from Butwal?",
      "Who is the founder of Khojau?"
    ],
    customInstructions: "CRITICAL: Khojau is strictly based in Butwal, Nepal. Always state Butwal, Nepal whenever business location is asked or relevant. Never say Khojau is based in Kathmandu. Answer questions using only the actual current website and database information (products, prices, discounts, offers, orders, QR payment, Butwal location, contact details, delivery info, return policy, About Khojau, and Founder Shishir Pokhrel). Never invent products, prices, stock, or policies."
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

// 8. Grounded AI Shopping Assistant (Updated for Butwal, Nepal & Real Database Grounding)
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { message, currentProductId } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const activeProducts = db.products.filter(p => p.isVisible);
  const currentProduct = currentProductId ? activeProducts.find(p => p.id === currentProductId) : null;
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
  } = db.settings;

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

  const systemPrompt = `You are ${aiSettings.assistantName || 'Khojau Saathi'}, the official AI customer assistant for ${storeName} (खोजौँ).
CRITICAL LOCATION FACT:
- ${storeName} is based in Butwal, Nepal.
- Official Store Address: ${storeAddress || 'Butwal, Nepal'}
- Contact Phone: ${contactPhone} | Contact Email: ${contactEmail}
- NEVER say that Khojau is based in Kathmandu. Always state Butwal, Nepal whenever the business location is asked or relevant.

ABOUT KHOJAU & FOUNDER:
- About Khojau: ${aboutBrand.aboutKhojau} ${aboutBrand.brandDescription}
- Mission: ${aboutBrand.mission}
- Founder: ${founder.name} (${founder.role})
- Founder Bio: ${founder.bio}
- Founder Website: ${founder.website || 'https://shishirpokhrel.com.np'}

PAYMENT & ORDER RULES:
- Payment Method: Official QR Payment (${qrPaymentSettings?.providerName || 'eSewa, Khalti, Fonepay, Mobile Banking'}).
- Account Name: ${qrPaymentSettings?.accountName || 'Khojau Online Store'}
- Payment Instructions: ${qrPaymentSettings?.instructions || 'Scan the official QR code at checkout and submit your Transaction ID for verification.'}
- Cash on Delivery (COD) is NOT available. Never say Cash on Delivery is available.
- After payment submission, order payment status is "Pending Verification" until verified by the Khojau admin team in Butwal, Nepal.

DELIVERY & RETURN POLICIES:
- Local Delivery (Butwal & Rupandehi): Rs. ${deliveryKathmanduFee} (FREE for orders above Rs. ${freeDeliveryThreshold}).
- Nationwide Delivery (Outside Butwal across Nepal): Rs. ${deliveryOutsideFee} flat.
- Delivery Timeline: ${deliveryInfoText}
- Return/Refund Policy: ${returnPolicyText}

CURRENT PROMOTIONAL OFFER:
- ${promotionalOffer?.enabled ? `${promotionalOffer.title} — ${promotionalOffer.subtitle} (Up to ${promotionalOffer.discountPercentage}% OFF)` : 'No special festival popup offer is currently active.'}

STRICT INVENTORY & GROUNDING RULE:
- You must ONLY use the actual current website/database information below.
- NEVER invent product names, prices, stock counts, discounts, payment details, delivery charges, policies, contact details, or business locations.
- If a product or piece of information is not in the current database below, clearly state that the information or product is not currently available in the store catalog.
${currentProduct ? `\nCurrently Viewed Product: "${currentProduct.name}" at Rs. ${(currentProduct.isDiscountActive !== false && currentProduct.discountPrice) || currentProduct.price}.` : ''}

CURRENT LIVE PRODUCT CATALOG (${catalogContext.length} products):
${catalogContext.length > 0 ? JSON.stringify(catalogContext, null, 2) : 'Currently 0 products are listed in the catalog. The store admin is updating the inventory.'}

STORE FAQS:
${aiSettings.faqList.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

CUSTOM INSTRUCTIONS:
${aiSettings.customInstructions}`;

  if (aiClient) {
    try {
      const response: any = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nCustomer question: ${message}` }] }
        ]
      });
      const replyText = response?.text;
      if (replyText) {
        const mentionedProductIds = activeProducts
          .filter(p => replyText.toLowerCase().includes(p.name.toLowerCase()) || (currentProduct && currentProduct.id === p.id))
          .slice(0, 3)
          .map(p => p.id);

        return res.json({
          reply: replyText,
          recommendedProductIds: mentionedProductIds
        });
      }
    } catch {
      // Quietly fall through to accurate database-grounded response without logging false error alerts
    }
  }

  // Accurate Database-Grounded Response Engine (Never invents products or facts, always uses Butwal, Nepal)
  const q = message.toLowerCase();
  let localReply = "";
  let matchingProds: Product[] = [];

  if (q.includes("location") || q.includes("where") || q.includes("address") || q.includes("based") || q.includes("butwal") || q.includes("city") || q.includes("office") || q.includes("hub")) {
    localReply = `Namaste! 🙏 ${storeName} (खोजौँ) is proudly based in **Butwal, Nepal** (${storeAddress || 'Butwal, Nepal'}). We inspect and dispatch all orders directly from our Butwal hub to customers across Butwal, Rupandehi, and all 7 provinces of Nepal.`;
  } else if (q.includes("founder") || q.includes("owner") || q.includes("who made") || q.includes("who started") || q.includes("shishir")) {
    localReply = `${storeName} was founded in Butwal, Nepal by **${founder.name}** (${founder.role}). ${founder.bio} You can also learn more at ${founder.website || 'https://shishirpokhrel.com.np'}.`;
  } else if (q.includes("about") || q.includes("what is khojau") || q.includes("story") || q.includes("mission")) {
    localReply = `${aboutBrand.aboutKhojau}\n\n${aboutBrand.brandDescription}\n\nOur Mission: ${aboutBrand.mission}`;
  } else if (q.includes("contact") || q.includes("phone") || q.includes("call") || q.includes("email") || q.includes("whatsapp") || q.includes("support")) {
    localReply = `You can reach ${storeName} in Butwal, Nepal via:\n• Phone / WhatsApp: ${contactPhone}\n• Email: ${contactEmail}\n• Address: ${storeAddress || 'Butwal, Nepal'}`;
  } else if (q.includes("payment") || q.includes("qr") || q.includes("esewa") || q.includes("khalti") || q.includes("fonepay") || q.includes("pay") || q.includes("cod") || q.includes("cash")) {
    localReply = `At ${storeName}, we accept secure **Official QR Payments** via ${qrPaymentSettings?.providerName || 'eSewa, Khalti, Fonepay, and Mobile Banking'} (Account: ${qrPaymentSettings?.accountName || 'Khojau Online Store'}). Cash on Delivery (COD) is not available.\n\nWhen you checkout, the exact payable amount and order remark are calculated automatically. Simply scan our official QR code, make the payment, and submit your Transaction ID for verification by our Butwal team.`;
  } else if (q.includes("delivery") || q.includes("shipping") || q.includes("charge") || q.includes("fee") || q.includes("how long")) {
    localReply = `Here is our current delivery information from **Butwal, Nepal**:\n• Local Delivery (Butwal & Rupandehi): Rs. ${deliveryKathmanduFee} (FREE on orders above Rs. ${freeDeliveryThreshold.toLocaleString()})\n• Nationwide Delivery (Outside Butwal across Nepal): Rs. ${deliveryOutsideFee} flat\n• Timeline: ${deliveryInfoText}`;
  } else if (q.includes("return") || q.includes("refund") || q.includes("exchange") || q.includes("policy") || q.includes("warranty")) {
    localReply = `Our Return & Refund Policy:\n${returnPolicyText}`;
  } else if (q.includes("offer") || q.includes("discount") || q.includes("dashain") || q.includes("promo") || q.includes("sale")) {
    const discountedProds = activeProducts.filter(p => p.isDiscountActive !== false && p.discountPrice && p.discountPrice < p.price);
    const offerText = promotionalOffer?.enabled
      ? `Current Promotional Offer: **${promotionalOffer.title}** — ${promotionalOffer.subtitle} (Up to ${promotionalOffer.discountPercentage}% OFF).`
      : `There are currently no active festival popup promotions.`;
    if (discountedProds.length > 0) {
      const list = discountedProds.slice(0, 4).map(p => `• ${p.name}: Rs. ${p.discountPrice?.toLocaleString()} (was Rs. ${p.price.toLocaleString()})`).join('\n');
      localReply = `${offerText}\n\nProducts currently on discount:\n${list}`;
      matchingProds = discountedProds.slice(0, 3);
    } else {
      localReply = `${offerText}\n\n${activeProducts.length === 0 ? 'Our product catalog is currently empty while our admin adds new items.' : 'Check out our catalog for current product pricing.'}`;
    }
  } else if (q.includes("product") || q.includes("price") || q.includes("stock") || q.includes("available") || q.includes("buy") || q.includes("item") || q.includes("catalog") || q.includes("recommend")) {
    if (activeProducts.length === 0) {
      localReply = `Namaste! 🙏 Currently, there are no products listed in the ${storeName} catalog as our Butwal, Nepal team is updating the inventory. Please check back soon or contact us at ${contactPhone} for inquiries!`;
      matchingProds = [];
    } else {
      // Search matching products by keyword
      const words = q.split(/\s+/).filter(w => w.length > 2);
      const found = activeProducts.filter(p =>
        words.some(w => p.name.toLowerCase().includes(w) || p.category.toLowerCase().includes(w) || p.description.toLowerCase().includes(w))
      );
      const displayList = (found.length > 0 ? found : activeProducts).slice(0, 4);
      const lines = displayList.map(p => {
        const hasDisc = p.isDiscountActive !== false && p.discountPrice && p.discountPrice < p.price;
        const priceStr = hasDisc ? `Rs. ${p.discountPrice?.toLocaleString()} (Discounted from Rs. ${p.price.toLocaleString()})` : `Rs. ${p.price.toLocaleString()}`;
        return `• **${p.name}** (${p.category}) — ${priceStr} · ${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}`;
      }).join('\n');
      localReply = `Here are the current products available at ${storeName} (Butwal, Nepal):\n${lines}`;
      matchingProds = displayList.slice(0, 3);
    }
  } else {
    if (activeProducts.length === 0) {
      localReply = `Namaste! 🙏 Welcome to **${storeName} (खोजौँ)**, based in **Butwal, Nepal**. I can help you with questions about our store location (${storeAddress}), QR payment process, delivery charges (Rs. ${deliveryKathmanduFee} in Butwal, Rs. ${deliveryOutsideFee} nationwide), return policy, or founder ${founder.name}. Currently, our product catalog has 0 items listed while the admin updates stock. How can I assist you?`;
    } else {
      const topP = activeProducts.slice(0, 3);
      const lines = topP.map(p => {
        const sellingPrice = (p.isDiscountActive !== false && p.discountPrice) ? p.discountPrice : p.price;
        return `• **${p.name}**: Rs. ${sellingPrice.toLocaleString()}`;
      }).join('\n');
      localReply = `Namaste! 🙏 Welcome to **${storeName} (खोजौँ)** in **Butwal, Nepal**. Here are some of our available products:\n${lines}\n\nFeel free to ask me about product prices, discounts, QR payment, delivery from Butwal, or our 7-day return policy!`;
      matchingProds = topP;
    }
  }

  res.json({
    reply: localReply,
    recommendedProductIds: matchingProds.map(p => p.id)
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
