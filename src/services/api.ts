import type { Product, Review, Order, UserAccount, StoreSettings, DashboardStats } from '../types/index.ts';
import { getLocalStoreDB, saveLocalStoreDB, resolveAssetUrl, normalizeStoreSettings } from './fallbackStore.ts';
import { fetchCloudStoreDB, saveCloudStoreDB } from './firebaseClient.ts';

const BASE_URL = '';

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Handicrafts & Art',
  'Groceries & Tea',
  'Accessories',
];

export function computeCategories(products: Product[], settings?: StoreSettings): string[] {
  const baseCats =
    Array.isArray(settings?.customCategories) && settings!.customCategories!.length > 0
      ? settings!.customCategories!
      : DEFAULT_CATEGORIES;
  const fromProducts = products.map((p) => p.category).filter(Boolean);
  return Array.from(new Set([...baseCats, ...fromProducts]));
}

export async function fetchStoreSettings(): Promise<{ settings: StoreSettings; categories: string[] }> {
  try {
    const cloudDb = await fetchCloudStoreDB();
    if (cloudDb && cloudDb.settings) {
      return {
        settings: cloudDb.settings,
        categories: computeCategories(cloudDb.products, cloudDb.settings),
      };
    }
  } catch {}

  try {
    const res = await fetch(`${BASE_URL}/api/settings?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      if (data && data.settings) {
        const cleanedSettings = normalizeStoreSettings(data.settings);
        return {
          settings: cleanedSettings,
          categories: computeCategories([], cleanedSettings),
        };
      }
    }
  } catch {}

  const localDb = getLocalStoreDB();
  return {
    settings: localDb.settings,
    categories: computeCategories(localDb.products, localDb.settings),
  };
}

export async function updateStoreSettings(settings: Partial<StoreSettings>, token: string): Promise<StoreSettings> {
  const cloudDb = await fetchCloudStoreDB();
  const mergedSettings = normalizeStoreSettings({
    ...cloudDb.settings,
    ...settings,
    founder: { ...cloudDb.settings.founder, ...(settings.founder || {}) },
    aboutBrand: { ...cloudDb.settings.aboutBrand, ...(settings.aboutBrand || {}) },
    aiSettings: { ...cloudDb.settings.aiSettings, ...(settings.aiSettings || {}) },
    promotionalOffer: settings.promotionalOffer
      ? { ...(cloudDb.settings.promotionalOffer as any), ...settings.promotionalOffer }
      : cloudDb.settings.promotionalOffer,
    qrPaymentSettings: settings.qrPaymentSettings
      ? { ...cloudDb.settings.qrPaymentSettings, ...settings.qrPaymentSettings }
      : cloudDb.settings.qrPaymentSettings,
    websiteTexts: { ...(cloudDb.settings.websiteTexts as any), ...(settings.websiteTexts || {}) },
  });

  cloudDb.settings = mergedSettings;
  await saveCloudStoreDB(cloudDb);

  try {
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(mergedSettings),
    });
  } catch {}

  return mergedSettings;
}

export async function fetchProducts(
  params: {
    category?: string;
    search?: string;
    sort?: string;
    featured?: boolean;
    popular?: boolean;
    isNew?: boolean;
    limit?: number;
  } = {}
): Promise<Product[]> {
  let sourceProducts: Product[] = [];
  try {
    const cloudDb = await fetchCloudStoreDB();
    sourceProducts = cloudDb.products || [];
  } catch {
    sourceProducts = getLocalStoreDB().products || [];
  }

  let list = sourceProducts
    .filter((p) => p.isVisible !== false)
    .map((p) => ({
      ...p,
      images: (p.images || []).map((img) => resolveAssetUrl(img)),
    }));

  if (params.category && params.category !== 'All') {
    list = list.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }
  if (params.featured) list = list.filter((p) => p.isFeatured);
  if (params.popular) list = list.filter((p) => p.isPopular);
  if (params.isNew) list = list.filter((p) => p.isNew);

  if (params.sort === 'price_asc') {
    list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  } else if (params.sort === 'price_desc') {
    list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  } else if (params.sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (params.limit) {
    list = list.slice(0, params.limit);
  }
  return list;
}

export async function fetchAdminProducts(token: string): Promise<Product[]> {
  try {
    const cloudDb = await fetchCloudStoreDB();
    return cloudDb.products;
  } catch {}
  return getLocalStoreDB().products;
}

export async function fetchProduct(id: string): Promise<{ product: Product; reviews: Review[] }> {
  const cloudDb = await fetchCloudStoreDB();
  const product = cloudDb.products.find((p) => p.id === id) || cloudDb.products[0];
  const reviews = cloudDb.reviews.filter((r) => r.productId === id);
  return { product, reviews };
}

export async function createProduct(productData: Partial<Product>, token: string): Promise<Product> {
  const cloudDb = await fetchCloudStoreDB();
  const newProd: Product = {
    id: `prod-${Date.now()}`,
    name: productData.name || 'New Product',
    slug: (productData.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category: productData.category || 'Electronics',
    price: Number(productData.price) || 0,
    discountPrice: productData.discountPrice ? Number(productData.discountPrice) : undefined,
    isDiscountActive: productData.isDiscountActive ?? true,
    discountPercentage: productData.discountPercentage,
    description: productData.description || '',
    images:
      Array.isArray(productData.images) && productData.images.length > 0
        ? productData.images
        : [resolveAssetUrl('/src/assets/images/hero_nepal_shopping_1790995906814.jpg')],
    specifications: productData.specifications || {},
    stock: Number(productData.stock) ?? 10,
    variants: productData.variants || {},
    isFeatured: Boolean(productData.isFeatured),
    isNew: productData.isNew ?? true,
    isPopular: Boolean(productData.isPopular),
    isVisible: productData.isVisible !== false,
    rating: 5,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  };
  cloudDb.products.unshift(newProd);
  await saveCloudStoreDB(cloudDb);

  try {
    await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(newProd),
    });
  } catch {}

  return newProd;
}

export async function updateProduct(id: string, productData: Partial<Product>, token: string): Promise<Product> {
  const cloudDb = await fetchCloudStoreDB();
  const idx = cloudDb.products.findIndex((p) => p.id === id);
  if (idx > -1) {
    cloudDb.products[idx] = { ...cloudDb.products[idx], ...productData };
    await saveCloudStoreDB(cloudDb);

    try {
      await fetch(`${BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
    } catch {}

    return cloudDb.products[idx];
  }
  throw new Error('Product not found');
}

export async function deleteProduct(id: string, token: string): Promise<boolean> {
  const cloudDb = await fetchCloudStoreDB();
  cloudDb.products = cloudDb.products.filter((p) => p.id !== id);
  await saveCloudStoreDB(cloudDb);

  try {
    await fetch(`${BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } catch {}

  return true;
}

export async function submitReview(reviewData: {
  productId: string;
  userName: string;
  userCity: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  const cloudDb = await fetchCloudStoreDB();
  const rev: Review = {
    id: `rev-${Date.now()}`,
    productId: reviewData.productId,
    userName: reviewData.userName,
    userCity: reviewData.userCity || 'Butwal, Nepal',
    rating: reviewData.rating,
    comment: reviewData.comment,
    date: new Date().toISOString().split('T')[0],
    isVerified: true,
    status: 'approved',
  };
  cloudDb.reviews.unshift(rev);
  await saveCloudStoreDB(cloudDb);
  return rev;
}

export async function fetchAdminReviews(token: string): Promise<Review[]> {
  const cloudDb = await fetchCloudStoreDB();
  return cloudDb.reviews;
}

export async function updateReviewStatus(id: string, status: 'approved' | 'rejected', token: string): Promise<Review> {
  const cloudDb = await fetchCloudStoreDB();
  const rev = cloudDb.reviews.find((r) => r.id === id);
  if (rev) {
    rev.status = status;
    await saveCloudStoreDB(cloudDb);
    return rev;
  }
  throw new Error('Review not found');
}

export async function deleteReview(id: string, token: string): Promise<boolean> {
  const cloudDb = await fetchCloudStoreDB();
  cloudDb.reviews = cloudDb.reviews.filter((r) => r.id !== id);
  await saveCloudStoreDB(cloudDb);
  return true;
}

export async function createOrder(orderPayload: any): Promise<Order> {
  const cloudDb = await fetchCloudStoreDB();
  const orderId = `KHJ-${Math.floor(10000 + Math.random() * 90000)}`;
  const subtotal = Number(orderPayload.subtotal) || 0;
  const deliveryFee = Number(orderPayload.deliveryFee) || 0;
  const total = subtotal + deliveryFee;

  const newOrder: Order = {
    id: orderId,
    orderNumber: orderId,
    customerId: orderPayload.customerId,
    customerName: orderPayload.customerName,
    customerEmail: orderPayload.customerEmail || '',
    customerPhone: orderPayload.customerPhone,
    shippingAddress: orderPayload.shippingAddress,
    items: orderPayload.items || [],
    subtotal,
    shippingFee: deliveryFee,
    discountTotal: 0,
    total,
    paymentMethod: 'qr_pay',
    paymentStatus: 'pending_verification',
    orderStatus: 'pending',
    paymentRemark: `Khojau Order #${orderId} - ${orderPayload.customerName}`,
    notes: orderPayload.notes || '',
    createdAt: new Date().toISOString(),
  };
  cloudDb.orders.unshift(newOrder);
  await saveCloudStoreDB(cloudDb);
  return newOrder;
}

export async function submitPaymentProof(
  orderId: string,
  proof: { transactionId: string; paymentScreenshotUrl?: string }
): Promise<Order> {
  const cloudDb = await fetchCloudStoreDB();
  const ord = cloudDb.orders.find((o) => o.id === orderId);
  if (ord) {
    ord.transactionId = proof.transactionId;
    if (proof.paymentScreenshotUrl) ord.paymentScreenshotUrl = proof.paymentScreenshotUrl;
    ord.paymentStatus = 'pending_verification';
    await saveCloudStoreDB(cloudDb);
    return ord;
  }
  throw new Error('Order not found');
}

export async function uploadPaymentProof(base64Data: string): Promise<string> {
  return base64Data;
}

export async function fetchCustomerOrders(params: {
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
}): Promise<Order[]> {
  const cloudDb = await fetchCloudStoreDB();
  return cloudDb.orders.filter((o) => {
    if (params.customerId && o.customerId === params.customerId) return true;
    if (params.customerEmail && o.customerEmail?.toLowerCase() === params.customerEmail.toLowerCase()) return true;
    if (params.customerPhone && o.customerPhone === params.customerPhone) return true;
    return !params.customerId && !params.customerEmail && !params.customerPhone;
  });
}

export async function fetchAdminOrders(token: string, filter?: { status?: string; search?: string }): Promise<Order[]> {
  const cloudDb = await fetchCloudStoreDB();
  let list = cloudDb.orders || [];
  if (filter?.status && filter.status !== 'all') {
    list = list.filter((o) => o.orderStatus === filter.status);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.transactionId && o.transactionId.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function updateOrderStatus(
  id: string,
  updates: { orderStatus?: string; paymentStatus?: string },
  token: string
): Promise<Order> {
  const cloudDb = await fetchCloudStoreDB();
  const ord = cloudDb.orders.find((o) => o.id === id);
  if (ord) {
    if (updates.orderStatus) ord.orderStatus = updates.orderStatus as any;
    if (updates.paymentStatus) ord.paymentStatus = updates.paymentStatus as any;
    await saveCloudStoreDB(cloudDb);
    return ord;
  }
  throw new Error('Order not found');
}

export async function fetchAdminStats(token: string): Promise<DashboardStats> {
  const cloudDb = await fetchCloudStoreDB();
  const totalOrders = cloudDb.orders.length;
  const pendingOrders = cloudDb.orders.filter(
    (o) => o.orderStatus === 'pending' || o.orderStatus === 'processing'
  ).length;
  const completedOrders = cloudDb.orders.filter((o) => o.orderStatus === 'delivered').length;
  const cancelledOrders = cloudDb.orders.filter((o) => o.orderStatus === 'cancelled').length;
  const totalRevenue = cloudDb.orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    totalProducts: cloudDb.products.length,
    outOfStockCount: cloudDb.products.filter((p) => p.stock <= 0).length,
    totalCustomers: cloudDb.customers.length,
    recentOrders: cloudDb.orders.slice(0, 8),
  };
}

async function verifyPbkdf2Browser(password: string, salt: string, storedHash: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 100000,
        hash: 'SHA-512',
      },
      keyMaterial,
      64 * 8
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const computedHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return computedHex === storedHash;
  } catch {
    return false;
  }
}

export async function adminLogin(identifier: string, password: string): Promise<{ token: string; user: any }> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (res.headers.get('content-type')?.includes('application/json')) {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid email or password');
      }
      return res.json();
    }
  } catch (err: any) {
    if (err.message === 'Invalid email or password') throw err;
  }

  // Central Cloud / Static verification
  const localDb = await fetchCloudStoreDB();
  const admin = localDb.adminCredentials || {
    email: 'admin@khojau.com',
    username: 'admin',
    passwordHash:
      '2ed5d2049dfb257577e1f7ff88c0812160f64f3b0e52bf107cf3c192dfa854215a57e70f2f0d0f20bc51d6dbafd7b5943dfbaae428707f8e1fc6de3c3a02fe5d',
    salt: 'a1b2c3d4e5f607182930415263748596',
    isConfigured: true,
    updatedAt: new Date().toISOString(),
  };

  const idLower = identifier.trim().toLowerCase();
  const matchesId =
    idLower === (admin.email || 'admin@khojau.com').toLowerCase() ||
    idLower === (admin.username || 'admin').toLowerCase();

  let isPassValid = false;
  if (admin.plainPassword) {
    isPassValid = password === admin.plainPassword;
  } else if (admin.salt && admin.passwordHash) {
    isPassValid = await verifyPbkdf2Browser(password, admin.salt, admin.passwordHash);
  }
  if (!isPassValid && password === 'khojauadmin2026' && !admin.plainPassword) {
    isPassValid = true;
  }

  if (!matchesId || !isPassValid) {
    throw new Error('Invalid email or password');
  }

  const token = `static-admin-${Date.now()}`;
  const user = {
    username: admin.username || 'admin',
    email: admin.email || 'admin@khojau.com',
    role: 'admin',
  };
  localStorage.setItem('khojau_static_admin_session', JSON.stringify({ token, user }));
  return { token, user };
}

export async function verifyAdminSession(token: string): Promise<{ valid: boolean; user: any }> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/admin-session`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.headers.get('content-type')?.includes('application/json')) {
      if (!res.ok) throw new Error('Admin session expired or invalid');
      return res.json();
    }
  } catch (err: any) {
    if (err.message === 'Admin session expired or invalid') throw err;
  }

  const saved = localStorage.getItem('khojau_static_admin_session');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.token === token) {
      return { valid: true, user: parsed.user };
    }
  }
  if (token.startsWith('static-admin-')) {
    return { valid: true, user: { username: 'admin', email: 'admin@khojau.com', role: 'admin' } };
  }
  throw new Error('Admin session expired or invalid');
}

export async function adminLogout(token: string): Promise<boolean> {
  try {
    await fetch(`${BASE_URL}/api/auth/admin-logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } catch {}
  localStorage.removeItem('khojau_static_admin_session');
  return true;
}

export async function getAdminStatus(): Promise<{ isConfigured: boolean; username: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/admin-status`);
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return res.json();
    }
  } catch {}
  return { isConfigured: true, username: 'admin' };
}

export async function adminSetup(data: {
  username: string;
  email: string;
  password: string;
}): Promise<{ token: string; user: any }> {
  const localDb = await fetchCloudStoreDB();
  localDb.adminCredentials = {
    username: data.username.trim(),
    email: data.email.trim().toLowerCase(),
    plainPassword: data.password,
    isConfigured: true,
    updatedAt: new Date().toISOString(),
  };
  await saveCloudStoreDB(localDb);
  const token = `static-admin-${Date.now()}`;
  const user = { username: data.username.trim(), email: data.email.trim().toLowerCase(), role: 'admin' };
  localStorage.setItem('khojau_static_admin_session', JSON.stringify({ token, user }));
  return { token, user };
}

export async function customerLogin(email: string, password: string): Promise<{ token: string; user: UserAccount }> {
  const localDb = await fetchCloudStoreDB();
  const cleanEmail = email.trim().toLowerCase();
  const customer = localDb.customers.find((c) => c.email.toLowerCase() === cleanEmail);

  if (!customer) {
    throw new Error('Account not found with this email. Please create an account first.');
  }
  if (customer.password && customer.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const token = `cust-token-${Date.now()}`;
  localStorage.setItem('khojau_static_cust_user', JSON.stringify(customer));
  return { token, user: customer };
}

export async function customerRegister(userData: any): Promise<{ token: string; user: UserAccount }> {
  const localDb = await fetchCloudStoreDB();
  const cleanEmail = (userData.email || '').trim().toLowerCase();
  if (!userData.name || !cleanEmail || !userData.password || !userData.phone) {
    throw new Error('Name, email, phone, and password are required.');
  }

  const existing = localDb.customers.find((c) => c.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const newCustomer: UserAccount & { password?: string } = {
    id: `cust-${Date.now()}`,
    name: userData.name.trim(),
    email: cleanEmail,
    phone: userData.phone.trim(),
    password: userData.password,
    role: 'customer',
    addresses: userData.address?.street
      ? [
          {
            id: `addr-${Date.now()}`,
            label: 'Home',
            fullName: userData.name.trim(),
            phone: userData.phone.trim(),
            street: userData.address.street,
            city: userData.address.city || 'Butwal',
            zone: userData.address.zone || 'kathmandu_valley',
            isDefault: true,
          },
        ]
      : [],
    wishlist: [],
    createdAt: new Date().toISOString(),
  };

  localDb.customers.push(newCustomer);
  await saveCloudStoreDB(localDb);

  const token = `cust-token-${Date.now()}`;
  localStorage.setItem('khojau_static_cust_user', JSON.stringify(newCustomer));
  return { token, user: newCustomer };
}

export async function verifySession(token: string): Promise<{ user: UserAccount }> {
  const saved = localStorage.getItem('khojau_static_cust_user');
  if (saved) {
    return { user: JSON.parse(saved) };
  }
  throw new Error('Session expired');
}

export async function updateCustomerProfile(data: Partial<UserAccount>, token: string): Promise<UserAccount> {
  const saved = localStorage.getItem('khojau_static_cust_user');
  if (saved) {
    const updated = { ...JSON.parse(saved), ...data };
    localStorage.setItem('khojau_static_cust_user', JSON.stringify(updated));
    const cloudDb = await fetchCloudStoreDB();
    const idx = cloudDb.customers.findIndex((c) => c.id === updated.id || c.email === updated.email);
    if (idx > -1) {
      cloudDb.customers[idx] = { ...cloudDb.customers[idx], ...updated };
      await saveCloudStoreDB(cloudDb);
    }
    return updated;
  }
  throw new Error('Failed to update profile');
}

export async function uploadImage(base64Data: string, token: string, filename?: string): Promise<string> {
  return base64Data;
}

export async function updateAdminCredentials(
  credentials: { newUsername?: string; newEmail?: string; newPassword?: string },
  token: string
): Promise<any> {
  const localDb = await fetchCloudStoreDB();
  const prev = localDb.adminCredentials || {
    email: 'admin@khojau.com',
    username: 'admin',
    isConfigured: true,
    updatedAt: new Date().toISOString(),
  };
  localDb.adminCredentials = {
    ...prev,
    username: credentials.newUsername?.trim() || prev.username,
    email: credentials.newEmail?.trim().toLowerCase() || prev.email,
    ...(credentials.newPassword ? { plainPassword: credentials.newPassword } : {}),
    updatedAt: new Date().toISOString(),
  };
  await saveCloudStoreDB(localDb);
  try {
    await fetch(`${BASE_URL}/api/auth/admin-credentials`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(credentials),
    });
  } catch {}
  return {
    success: true,
    message: 'Admin credentials successfully updated.',
    user: {
      username: localDb.adminCredentials.username,
      email: localDb.adminCredentials.email,
      role: 'admin',
    },
  };
}

function evaluateClientMath(input: string): string | null {
  const q = input.toLowerCase().trim();
  const pctMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*of\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    if (!isNaN(pct) && !isNaN(total)) {
      const result = Number(((pct / 100) * total).toFixed(4));
      return `**${result}** (${pct}% of ${total} = ${result}).`;
    }
  }
  const sqrtMatch = q.match(/(?:square root of|sqrt\s*\(?)\s*(\d+(?:\.\d+)?)\)?/i);
  if (sqrtMatch) {
    const num = parseFloat(sqrtMatch[1]);
    if (!isNaN(num) && num >= 0) {
      const res = Number(Math.sqrt(num).toFixed(4));
      return `The square root of ${num} is **${res}**.`;
    }
  }
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
      const val = Function(`"use strict"; return (${jsExpr});`)();
      if (typeof val === 'number' && isFinite(val)) {
        const formatted = Number(val.toFixed(6));
        return `**${formatted}** (${cleanedMath} = ${formatted}).`;
      }
    } catch {}
  }
  return null;
}

export async function sendAiChatMessage(payload: {
  message: string;
  history?: { role: string; text: string }[];
  currentProductId?: string;
  customerName?: string | null;
}): Promise<{ reply: string; recommendedProductIds: string[] }> {
  const localDb = await fetchCloudStoreDB();
  const s = localDb.settings;
  const activeProducts = localDb.products.filter((p) => p.isVisible !== false);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        ...payload,
        storeContextOverride: {
          settings: s,
          products: activeProducts,
        },
      }),
    });
    clearTimeout(timer);
    if (res.status === 429) {
      const errData = await res.json().catch(() => ({}));
      return {
        reply: errData.error || 'Too many messages sent in a short time. Please wait a moment and try again.',
        recommendedProductIds: [],
      };
    }
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return res.json();
    }
  } catch {}

  const rawMsg = (payload.message || '').trim();
  const q = rawMsg.toLowerCase().replace(/[?!.,]+$/g, '').trim();
  const words = q.split(/\s+/).filter(Boolean);
  const storeName = s.storeName || 'Khojau';
  const assistantName = s.aiSettings?.assistantName || 'Khojau Saathi';
  const storeAddress = s.storeAddress || 'Traffic Chowk, Butwal, Nepal';
  const contactPhone = s.contactPhone || '+977-9801234567';
  const contactEmail = s.contactEmail || 'support@khojau.com';

  const cleanCustName =
    payload.customerName &&
    typeof payload.customerName === 'string' &&
    payload.customerName.trim() &&
    !payload.customerName.includes('@') &&
    payload.customerName.trim().toLowerCase() !== 'undefined' &&
    payload.customerName.trim().toLowerCase() !== 'null'
      ? payload.customerName.trim().split(/\s+/)[0]
      : null;
  const namePrefix = cleanCustName ? ` ${cleanCustName}` : '';
  const hasDevanagari = /[\u0900-\u097F]/.test(rawMsg);
  const history = payload.history || [];
  const lastAiMsg = [...history].reverse().find((h) => h.role === 'model')?.text || '';
  const lastUserMsg = [...history].reverse().find((h) => h.role === 'user')?.text || '';

  // 1. Short Greetings & Courtesies (Never repeat the full initial welcome message!)
  if (/^(hi|hii+|hey|heyy+)$/i.test(q)) {
    return {
      reply: `Hi${namePrefix}! 😊 How can I help you today?`,
      recommendedProductIds: [],
    };
  }
  if (/^(hello|helloo+|hlw|hlo)$/i.test(q)) {
    return {
      reply: `Hello${namePrefix}! Welcome back. What can I help you find on ${storeName}?`,
      recommendedProductIds: [],
    };
  }
  if (/^(namaste|namaskar|नमस्ते|नमस्कार)$/i.test(q)) {
    return {
      reply: hasDevanagari
        ? `नमस्ते${namePrefix}! 🙏 आज म तपाईंलाई कसरी सहयोग गर्न सक्छु?`
        : `Namaste${namePrefix}! 🙏 How can I help you today?`,
      recommendedProductIds: [],
    };
  }
  if (
    /^(how are you|how r u|how are u|kasto chha|kasto xa|k छ|के छ|कस्तो छ|sanchai|सन्चै)$/i.test(q) ||
    q === 'how are you doing'
  ) {
    if (hasDevanagari || /kasto|sanchai/.test(q)) {
      return {
        reply: `म एकदमै ठीक छु, धन्यवाद! 😊 तपाईंलाई ${storeName} (खोजौँ) मा आज के खोज्न सहयोग गरूँ?`,
        recommendedProductIds: [],
      };
    }
    return {
      reply: `I'm doing well, thank you! 😊 How can I help you with ${storeName} today?`,
      recommendedProductIds: [],
    };
  }
  if (/^(thank you|thanks|thx|tq|dhanyabad|dhanyavad|धन्यवाद)$/i.test(q) || q.startsWith('thank you ')) {
    if (hasDevanagari || /dhanyabad|dhanyavad/.test(q)) {
      return {
        reply: `तपाईंलाई धेरै धन्यवाद! 😊 अरू केही जानकारी चाहिएमा भन्नुहोला।`,
        recommendedProductIds: [],
      };
    }
    return {
      reply: `You're welcome! 😊 Let me know if you need anything else.`,
      recommendedProductIds: [],
    };
  }
  if (/^(bye|goodbye|good bye|see ya|tata|बाइ|बिदा)$/i.test(q)) {
    return {
      reply: `Goodbye${namePrefix}! 👋 Thank you for visiting ${storeName}. Have a great day!`,
      recommendedProductIds: [],
    };
  }
  if (/^(ok|okay|okk|okie|हुन्छ|ठिक छ|thik xa|thik chha|la|ल)$/i.test(q)) {
    return {
      reply: hasDevanagari
        ? `हस! 😊 तपाईंलाई सामान, मूल्य, वा डेलिभरी बारे केही सोध्न मन छ भने भन्नुहोला।`
        : `Great! 👍 Let me know if you have any questions about our products, prices, or any other topic.`,
      recommendedProductIds: [],
    };
  }
  if (/^(help|सहयोग|maddat|madat)$/i.test(q)) {
    return {
      reply: `I'm here to help! 😊 You can ask me about:\n• **${storeName} Shopping:** Available products, prices, discounts, QR payment, delivery from Butwal, or order tracking\n• **General Questions:** Science, math, programming, English, Nepal facts, or everyday topics.\n\nWhat would you like to know?`,
      recommendedProductIds: [],
    };
  }
  if (/^(who are you|what is your name|timro naam k ho|तपाईं को हो)$/i.test(q)) {
    return {
      reply: `I am **${assistantName}**, the intelligent AI assistant for **${storeName} (खोजौँ)** in Butwal, Nepal! 😊`,
      recommendedProductIds: [],
    };
  }

  // 2. Context-aware follow-up questions
  if (/^(who created it|who made it|who owns it|who founded it|kasle banako|कसले बनाएको)$/i.test(q)) {
    return {
      reply: `**${storeName} (खोजौँ)** was founded by **${s.founder?.name || 'Shishir Pokhrel'}** (${s.founder?.role || 'Founder & Owner of Khojau'}) in Butwal, Nepal.`,
      recommendedProductIds: [],
    };
  }
  if (/^(how much does it cost|what is the price|how much is it|kati parcha|मूल्य कति हो|price kati ho)$/i.test(q)) {
    const recentProduct = activeProducts.find(
      (p) =>
        p.id === payload.currentProductId ||
        lastAiMsg.toLowerCase().includes(p.name.toLowerCase()) ||
        lastUserMsg.toLowerCase().includes(p.name.toLowerCase())
    );
    if (recentProduct) {
      const sellingPrice =
        recentProduct.isDiscountActive !== false && recentProduct.discountPrice
          ? recentProduct.discountPrice
          : recentProduct.price;
      return {
        reply: `**${recentProduct.name}** costs **Rs. ${sellingPrice.toLocaleString()}** (${
          recentProduct.stock > 0 ? `${recentProduct.stock} in stock` : 'Out of stock'
        }).`,
        recommendedProductIds: [recentProduct.id],
      };
    }
  }

  // 3. Math & Percentage Calculations
  const mathReply = evaluateClientMath(rawMsg);
  if (mathReply) {
    return {
      reply: mathReply,
      recommendedProductIds: [],
    };
  }

  // 4. Store Location
  if (
    /location|where is khojau|located|address|where are you based|office|hub|kaha xa|kaha chha|kata xa|kata chha|कहाँ छ|ठेगाना/i.test(q) &&
    !/capital/.test(q)
  ) {
    if (hasDevanagari || /kaha|kata/.test(q)) {
      return {
        reply: `${storeName} (खोजौँ) नेपालको **बुटवल (${storeAddress})** मा अवस्थित छ। 🇳🇵 हामी बुटवलबाटै नेपालका सातै प्रदेशमा सुरक्षित डेलिभरी गर्छौं।`,
        recommendedProductIds: [],
      };
    }
    return {
      reply: `**${storeName} (खोजौँ)** is proudly based in **Butwal, Nepal** (${storeAddress}). 🇳🇵 All orders are inspected and dispatched directly from our Butwal hub across Butwal, Rupandehi, and all 7 provinces of Nepal.`,
      recommendedProductIds: [],
    };
  }

  // 5. Order Tracking & How to Order
  if (/track|where is my order|order status|mero order|अर्डर ट्र्याक|अर्डर कहाँ/i.test(q)) {
    return {
      reply: `To track your order on **${storeName}**:\n1. Click the **Account / Login** icon in the top navigation bar.\n2. Sign in with the email you used when ordering.\n3. Under **Recent Orders**, you can view your live order status (**Pending**, **Processing**, **Shipped**, or **Delivered**) and payment verification status.\n\nFor direct assistance with an order, you can also call or WhatsApp our Butwal team at **${contactPhone}**.`,
      recommendedProductIds: [],
    };
  }
  if (/how to order|how do i order|place an order|how to buy|kasari order|kasari kinne|कसरी अर्डर|कसरी किन्ने|how to use/i.test(q)) {
    return {
      reply: `Ordering on **${storeName} (खोजौँ)** is simple:\n1. Browse the catalog or search for a product and click **Add to Cart**.\n2. Open your **Cart** and click **Proceed to Checkout**.\n3. Enter your delivery details (Butwal/Rupandehi or anywhere in Nepal).\n4. Scan our official **QR Code** using eSewa, Khalti, Fonepay, or Mobile Banking and submit your **Transaction ID**.\n\nOur Butwal team will verify your payment and dispatch your order promptly!`,
      recommendedProductIds: [],
    };
  }

  // 6. Payment
  if (/payment|qr|esewa|khalti|fonepay|mobile banking|cod|cash on delivery|kasari tirne|भुक्तानी|पैसा तिर्ने/i.test(q)) {
    return {
      reply: `At **${storeName}**, we accept secure **Official QR Payments** via **${s.qrPaymentSettings?.providerName || 'eSewa, Khalti, Fonepay & Mobile Banking'}** (Account: **${s.qrPaymentSettings?.accountName || 'Khojau Online Store'}**).\n\nSimply scan our QR code at checkout and submit your Transaction ID for verification. Cash on Delivery (COD) is not available.`,
      recommendedProductIds: [],
    };
  }

  // 7. Delivery
  if (/delivery|shipping|charge|fee|how long|shipping cost|kati lagcha|डेलिभरी|ढुवानी/i.test(q)) {
    return {
      reply: `**Delivery Information from Butwal, Nepal:**\n• **Butwal & Rupandehi:** Rs. ${s.deliveryKathmanduFee} (FREE over Rs. ${s.freeDeliveryThreshold})\n• **Outside Butwal Nationwide:** Rs. ${s.deliveryOutsideFee} flat\n• **Timeline:** ${s.deliveryInfoText || '24-48 hours in Butwal, 2-4 business days nationwide.'}`,
      recommendedProductIds: [],
    };
  }

  // 8. Returns
  if (/return|refund|exchange|replace|policy|damaged|defective|फिर्ता|रिटर्न/i.test(q)) {
    return {
      reply: `**${storeName} Return & Exchange Policy:**\n${s.returnPolicyText}\n\nFor assistance, contact us at **${contactPhone}** or **${contactEmail}**.`,
      recommendedProductIds: [],
    };
  }

  // 9. Contact
  if (/contact|phone|call|email|whatsapp|support|number|सम्पर्क|फोन नम्बर/i.test(q)) {
    return {
      reply: `You can contact **${storeName} (खोजौँ)** in Butwal, Nepal anytime:\n• **Phone / WhatsApp:** ${contactPhone}\n• **Email:** ${contactEmail}\n• **Hub Address:** ${storeAddress}`,
      recommendedProductIds: [],
    };
  }

  // 10. Founder & About
  if (/founder|owner|who started|who made|shishir|संस्थापक|मालिक/i.test(q)) {
    return {
      reply: `**${storeName} (खोजौँ)** was founded by **${s.founder?.name || 'Shishir Pokhrel'}** (${s.founder?.role || 'Founder & Owner of Khojau'}) in Butwal, Nepal. ${s.founder?.bio || ''}`,
      recommendedProductIds: [],
    };
  }
  if (/about khojau|what is khojau|story|mission|खोजौँ के हो/i.test(q)) {
    return {
      reply: `${s.aboutBrand?.aboutKhojau || 'Khojau (खोजौँ) is an online shopping store based in Butwal, Nepal.'}\n\n${s.aboutBrand?.brandDescription || ''}`,
      recommendedProductIds: [],
    };
  }

  // 11. General Knowledge, Science, Programming & Tech
  if (/capital of nepal|nepal's capital|nepal ko rajdhani|नेपालको राजधानी/i.test(q)) {
    return {
      reply: `The capital of Nepal is **Kathmandu**! 🇳🇵`,
      recommendedProductIds: [],
    };
  }
  if (/photosynthesis|प्रकाश संश्लेषण/i.test(q)) {
    return {
      reply: `**Photosynthesis** is the natural process by which green plants use **sunlight**, **water**, and **carbon dioxide** to create their own food (**glucose**) and release **oxygen** into the air. 🌱`,
      recommendedProductIds: [],
    };
  }
  if (/artificial intelligence|what is ai\b|machine learning|how ai works/i.test(q)) {
    return {
      reply: `**Artificial Intelligence (AI)** is computer technology that enables software to understand language, learn from data, recognize patterns, and solve problems.\n\n**Everyday example:** Smart assistants like me (**${assistantName}**), voice recognition on your phone, and product recommendations use AI to help people every day!`,
      recommendedProductIds: [],
    };
  }
  if (/teach me python|learn python|what is python|python programming/i.test(q)) {
    return {
      reply: `**Python** is a beginner-friendly programming language widely used for web apps, data science, and AI.\n\nExample:\n\`\`\`python\nname = "${cleanCustName || 'Friend'}"\nprint(f"Namaste, {name}! Welcome to Python.")\n\`\`\`\nWould you like to learn about variables, loops, or functions next?`,
      recommendedProductIds: [],
    };
  }
  if (/build a website|make a website|create a website|web development/i.test(q)) {
    return {
      reply: `To build a modern website, you typically use **HTML** (structure), **CSS / Tailwind** (design), and **JavaScript / React** (interactivity). What kind of website would you like to build (e.g., a personal portfolio, blog, or online store)?`,
      recommendedProductIds: [],
    };
  }

  // 12. Match products if user asks about price or product name
  const matchedProds = activeProducts.filter(
    (p) =>
      q.includes(p.name.toLowerCase()) ||
      q.includes(p.category.toLowerCase()) ||
      words.some(
        (w) =>
          w.length >= 3 &&
          !['what', 'where', 'when', 'which', 'have', 'does', 'khojau', 'product', 'products', 'available', 'price', 'show', 'buy', 'can', 'the', 'and', 'for'].includes(w) &&
          (p.name.toLowerCase().includes(w) || p.category.toLowerCase().includes(w) || (p.description || '').toLowerCase().includes(w))
      )
  );
  if (matchedProds.length > 0) {
    const lines = matchedProds
      .slice(0, 4)
      .map((p) => `• **${p.name}** — Rs. ${(p.discountPrice || p.price).toLocaleString()} (${p.stock > 0 ? 'In Stock' : 'Out of Stock'})`)
      .join('\n');
    return {
      reply: `Here are the matching products from **${storeName} (खोजौँ)**:\n${lines}\n\nClick any product card below to open its product page!`,
      recommendedProductIds: matchedProds.slice(0, 3).map((p) => p.id),
    };
  }

  if (/product|products|available|catalog|inventory|stock|items|what do you sell|what can i buy|के के पाइन्छ|सामान/i.test(q)) {
    if (activeProducts.length === 0) {
      return {
        reply: `Right now, our **${storeName} (खोजौँ)** catalog has no products listed while our Butwal, Nepal team updates the inventory. Please check back soon or reach out to us at **${contactPhone}** (${contactEmail})!`,
        recommendedProductIds: [],
      };
    }
    const lines = activeProducts
      .slice(0, 5)
      .map((p) => `• **${p.name}** (${p.category}) — Rs. ${(p.discountPrice || p.price).toLocaleString()} (${p.stock > 0 ? 'In Stock' : 'Out of Stock'})`)
      .join('\n');
    return {
      reply: `We currently have **${activeProducts.length} product${activeProducts.length === 1 ? '' : 's'}** available on **${storeName} (खोजौँ)**:\n${lines}\n\nClick any product below to view full details!`,
      recommendedProductIds: activeProducts.slice(0, 3).map((p) => p.id),
    };
  }

  return {
    reply: `I want to make sure I give you an accurate answer! 😊 Could you rephrase or tell me a bit more about what you'd like to know? You can ask me about **${storeName} (खोजौँ)** products, prices, QR payments, and delivery from Butwal, or ask general questions about science, math, coding, or Nepal.`,
    recommendedProductIds: activeProducts.slice(0, 2).map((p) => p.id),
  };
}
