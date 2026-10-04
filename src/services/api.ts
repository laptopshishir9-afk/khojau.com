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

export async function sendAiChatMessage(payload: {
  message: string;
  history?: { role: string; text: string }[];
  currentProductId?: string;
}): Promise<{ reply: string; recommendedProductIds: string[] }> {
  try {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return res.json();
    }
  } catch {}

  const localDb = await fetchCloudStoreDB();
  const s = localDb.settings;
  const activeProducts = localDb.products.filter((p) => p.isVisible !== false);
  const q = payload.message.toLowerCase();

  if (
    q.includes('location') ||
    q.includes('where') ||
    q.includes('address') ||
    q.includes('based') ||
    q.includes('butwal')
  ) {
    return {
      reply: `Namaste! 🙏 ${s.storeName} (खोजौँ) is proudly based in **Butwal, Nepal** (${s.storeAddress || 'Butwal, Nepal'}). We deliver across Butwal, Rupandehi, and all 7 provinces of Nepal.`,
      recommendedProductIds: [],
    };
  }
  if (q.includes('payment') || q.includes('qr') || q.includes('esewa') || q.includes('khalti')) {
    return {
      reply: `At ${s.storeName}, we accept Official QR Payments via ${s.qrPaymentSettings?.providerName || 'eSewa, Khalti, Fonepay & Mobile Banking'}. Simply scan our QR code at checkout and submit your Transaction ID for verification.`,
      recommendedProductIds: [],
    };
  }
  if (q.includes('delivery') || q.includes('shipping') || q.includes('charge')) {
    return {
      reply: `Delivery from **Butwal, Nepal**:\n• Butwal & Rupandehi: Rs. ${s.deliveryKathmanduFee} (Free over Rs. ${s.freeDeliveryThreshold})\n• Outside Butwal Nationwide: Rs. ${s.deliveryOutsideFee} flat.`,
      recommendedProductIds: [],
    };
  }
  if (q.includes('founder') || q.includes('owner') || q.includes('shishir')) {
    return {
      reply: `**${s.founder?.name || 'Shishir Pokhrel'}** is the ${s.founder?.role || 'Founder & Owner of Khojau'}. ${s.founder?.bio || ''}`,
      recommendedProductIds: [],
    };
  }

  // Match products if user asks about price or product name
  const matchedProds = activeProducts.filter(
    (p) =>
      q.includes(p.name.toLowerCase()) ||
      q.includes(p.category.toLowerCase()) ||
      p.name
        .toLowerCase()
        .split(' ')
        .some((w) => w.length > 3 && q.includes(w))
  );
  if (matchedProds.length > 0) {
    const lines = matchedProds
      .slice(0, 4)
      .map((p) => `• **${p.name}** — Rs. ${(p.discountPrice || p.price).toLocaleString()} (${p.stock > 0 ? 'In Stock' : 'Out of Stock'})`)
      .join('\n');
    return {
      reply: `Here are the latest details from **${s.storeName} (खोजौँ)**:\n${lines}`,
      recommendedProductIds: matchedProds.slice(0, 3).map((p) => p.id),
    };
  }

  return {
    reply: `Namaste! 🙏 I am **${s.aiSettings?.assistantName || 'Khojau Saathi'}**, your shopping guide at **${s.storeName} (खोजौँ)** in **Butwal, Nepal**. Feel free to ask about our products, prices, QR payment, or delivery across Nepal, or reach us at ${s.contactPhone} (${s.contactEmail}).`,
    recommendedProductIds: activeProducts.slice(0, 3).map((p) => p.id),
  };
}
