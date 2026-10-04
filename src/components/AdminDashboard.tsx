import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  Settings,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Check,
  Eye,
  EyeOff,
  LogOut,
  Search,
  DollarSign,
  AlertCircle,
  Truck,
  Save,
  Lock,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  KeyRound,
  UserCheck,
  Tag,
  Percent,
  QrCode,
  Gift,
  Flag,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import * as api from '../services/api.ts';
import type { Product, Order, Review, StoreSettings, DashboardStats, WebsiteTexts } from '../types/index.ts';

export const AdminDashboard: React.FC = () => {
  const {
    isAdminDashboardOpen,
    setIsAdminDashboardOpen,
    adminToken,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    refreshProducts,
    refreshSettings,
    settings: globalSettings
  } = useStore();

  // Internal Admin Panel Notification State (shown strictly inside the Admin Panel)
  const [adminToast, setAdminToast] = useState<{ message: string; type: 'success' | 'error'; id: number } | null>(null);

  const showToast = (msg: string) => {
    const isErr = /fail|error|invalid|mismatch|not match|cannot/i.test(msg);
    const id = Date.now();
    setAdminToast({ message: msg, type: isErr ? 'error' : 'success', id });
    setTimeout(() => {
      setAdminToast(prev => (prev && prev.id === id ? null : prev));
    }, 3800);
  };

  // Tab navigation
  type TabType = 'overview' | 'products' | 'orders' | 'payment' | 'offers' | 'brand' | 'texts' | 'reviews' | 'settings' | 'ai' | 'security';
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Admin Login state (Clean, no hardcoded or visible passwords)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminErrorKey, setAdminErrorKey] = useState(0);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Product Edit/Create Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    category: 'Electronics',
    price: 1000,
    discountPrice: null,
    isDiscountActive: false,
    discountPercentage: 0,
    stock: 20,
    description: '',
    images: [''],
    specifications: {},
    variants: { sizes: [], colors: [] },
    isFeatured: false,
    isNew: true,
    isPopular: false,
    isVisible: true
  });
  const [specsInput, setSpecsInput] = useState<{ key: string; val: string }[]>([
    { key: 'Material', val: '' },
    { key: 'Origin', val: 'Nepal' }
  ]);
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);

  // Store Settings & Brand / Founder Form state
  const [storeSettingsForm, setStoreSettingsForm] = useState<StoreSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingFounderPhoto, setIsUploadingFounderPhoto] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [isUploadingPopupImg, setIsUploadingPopupImg] = useState(false);
  const [isUploadingFlag, setIsUploadingFlag] = useState(false);
  const [enlargedScreenshotUrl, setEnlargedScreenshotUrl] = useState<string | null>(null);

  // Security Credentials update state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  // Load all admin data
  const loadAdminData = async () => {
    if (!adminToken) return;
    setIsLoadingData(true);
    try {
      const [statsData, prodsData, ordersData, reviewsData, settingsData] = await Promise.all([
        api.fetchAdminStats(adminToken),
        api.fetchAdminProducts(adminToken),
        api.fetchAdminOrders(adminToken),
        api.fetchAdminReviews(adminToken),
        api.fetchStoreSettings()
      ]);
      setStats(statsData);
      setAdminProducts(prodsData);
      setAdminOrders(ordersData);
      setAdminReviews(reviewsData);
      setStoreSettingsForm(settingsData.settings);
    } catch (err: any) {
      console.error(err);
      showToast('Error syncing admin data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminDashboardOpen && isAdmin) {
      loadAdminData();
    }
  }, [isAdminDashboardOpen, isAdmin, adminToken]);

  if (!isAdminDashboardOpen) return null;

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminLoginError('Please enter both admin email/username and password.');
      setAdminErrorKey(prev => prev + 1);
      return;
    }
    setIsLoggingIn(true);
    try {
      await loginAdmin(adminEmail.trim(), adminPassword);
      setAdminPassword('');
      setAdminLoginError(null);
    } catch (err: any) {
      setAdminLoginError(err.message || 'Invalid administrator email or password.');
      setAdminErrorKey(prev => prev + 1);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Open Create Product Modal
  const handleOpenCreateProduct = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      category: 'Electronics',
      price: 1500,
      discountPrice: null,
      isDiscountActive: false,
      discountPercentage: 0,
      stock: 25,
      description: '',
      images: ['/src/assets/images/hero_nepal_shopping_1790995906814.jpg'],
      specifications: { 'Origin': 'Nepal', 'Warranty': '6 Months' },
      isFeatured: false,
      isNew: true,
      isPopular: false,
      isVisible: true
    });
    setSpecsInput([
      { key: 'Origin', val: 'Nepal' },
      { key: 'Warranty', val: '6 Months' }
    ]);
    setSizesInput('');
    setColorsInput('Black, Silver');
    setImagesInput('/src/assets/images/hero_nepal_shopping_1790995906814.jpg');
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    const hasDiscount = Boolean(prod.isDiscountActive && prod.discountPrice);
    const percent = hasDiscount && prod.discountPrice && prod.price
      ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100)
      : (prod.discountPercentage || 0);

    setProductForm({
      ...prod,
      isDiscountActive: hasDiscount,
      discountPercentage: percent
    });
    setSpecsInput(
      Object.entries(prod.specifications || {}).map(([key, val]) => ({ key, val }))
    );
    setSizesInput(prod.variants?.sizes?.join(', ') || '');
    setColorsInput(prod.variants?.colors?.map(c => c.name).join(', ') || '');
    setImagesInput(prod.images?.join('\n') || '');
    setIsProductModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    const specsObj: Record<string, string> = {};
    specsInput.forEach(s => {
      if (s.key.trim() && s.val.trim()) {
        specsObj[s.key.trim()] = s.val.trim();
      }
    });

    const imageList = imagesInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const sizes = sizesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const colors = colorsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({ name }));

    const price = Number(productForm.price) || 0;
    const isDiscountActive = Boolean(productForm.isDiscountActive);
    const discountPrice = isDiscountActive && productForm.discountPrice ? Number(productForm.discountPrice) : null;
    const discountPercentage = isDiscountActive && discountPrice && discountPrice < price
      ? Math.round(((price - discountPrice) / price) * 100)
      : (productForm.discountPercentage || 0);

    const payload: Partial<Product> = {
      ...productForm,
      price,
      discountPrice,
      isDiscountActive,
      discountPercentage,
      specifications: specsObj,
      images: imageList.length > 0 ? imageList : ['/src/assets/images/hero_nepal_shopping_1790995906814.jpg'],
      variants: {
        sizes: sizes.length > 0 ? sizes : undefined,
        colors: colors.length > 0 ? colors : undefined
      }
    };

    try {
      if (editingProductId) {
        await api.updateProduct(editingProductId, payload, adminToken);
        showToast('Product updated successfully!');
      } else {
        await api.createProduct(payload, adminToken);
        showToast('New product created!');
      }
      setIsProductModalOpen(false);
      await loadAdminData();
      await refreshProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product');
    }
  };

  // Image upload handler for product
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;

    setIsUploadingProductImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64Data, adminToken, file.name);
        setImagesInput(prev => prev.trim() ? `${uploadedUrl}\n${prev}` : uploadedUrl);
        showToast('Product image uploaded and added to list!');
      } catch (err) {
        showToast('Failed to upload image. Please try again.');
      } finally {
        setIsUploadingProductImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Image upload handler for Founder Photo
  const handleFounderPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken || !storeSettingsForm) return;

    setIsUploadingFounderPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64Data, adminToken, file.name);
        setStoreSettingsForm({
          ...storeSettingsForm,
          founder: {
            ...storeSettingsForm.founder,
            photoUrl: uploadedUrl
          }
        });
        showToast('Founder photo uploaded! Remember to click "Save Brand & Founder Info" below.');
      } catch (err) {
        showToast('Failed to upload founder photo.');
      } finally {
        setIsUploadingFounderPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Image upload handler for Main Khojau Hero Image (Requirement 2)
  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken || !storeSettingsForm) return;

    setIsUploadingHero(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64Data, adminToken, file.name);
        setStoreSettingsForm({
          ...storeSettingsForm,
          heroBannerUrl: uploadedUrl
        });
        showToast('Hero image uploaded! Click "Save Brand & Hero Settings" below to apply everywhere.');
      } catch (err) {
        showToast('Failed to upload hero image.');
      } finally {
        setIsUploadingHero(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Image upload handler for Khojau Logo (Requirement 5)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken || !storeSettingsForm) return;

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64Data, adminToken, file.name);
        setStoreSettingsForm({
          ...storeSettingsForm,
          logoUrl: uploadedUrl
        });
        showToast('Logo uploaded! Click "Save Brand & Hero Settings" below to apply everywhere.');
      } catch (err) {
        showToast('Failed to upload logo.');
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Image upload handler for Promotional / Hero Banner
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken || !storeSettingsForm) return;

    setIsUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64Data, adminToken, file.name);
        setStoreSettingsForm({
          ...storeSettingsForm,
          heroBannerUrl: uploadedUrl,
          promoBannerUrl: uploadedUrl
        });
        showToast('Promotional banner uploaded! Remember to click "Save Settings Live" below.');
      } catch (err) {
        showToast('Failed to upload promotional banner.');
      } finally {
        setIsUploadingBanner(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // QR Code upload handler
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken || !storeSettingsForm) return;

    setIsUploadingQr(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64Data, adminToken, file.name);
        setStoreSettingsForm({
          ...storeSettingsForm,
          qrPaymentSettings: {
            ...(storeSettingsForm.qrPaymentSettings || {
              enabled: true,
              providerName: 'Fonepay / eSewa / NepalPay',
              accountName: 'KHOJAU ONLINE STORE',
              instructions: 'Scan this QR code using any Nepali mobile banking or digital wallet app.'
            }),
            qrImageUrl: uploadedUrl
          }
        });
        showToast('Official QR code uploaded! Click "Save Payment Settings" below.');
      } catch (err) {
        showToast('Failed to upload QR code image.');
      } finally {
        setIsUploadingQr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Dashain Popup Image upload handler
  const handlePopupImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken || !storeSettingsForm) return;

    setIsUploadingPopupImg(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64Data, adminToken, file.name);
        setStoreSettingsForm({
          ...storeSettingsForm,
          promotionalOffer: {
            ...(storeSettingsForm.promotionalOffer || {
              enabled: true,
              title: 'दशैंको विशेष अफर 🎉',
              subtitle: 'सबै उत्पादनमा २५% सम्म छुट!',
              discountPercentage: 25,
              buttonText: 'अहिले किनमेल गर्नुहोस्'
            }),
            popupImageUrl: uploadedUrl
          }
        });
        showToast('Popup image uploaded! Click "Save Promotional Offer" to publish.');
      } catch (err) {
        showToast('Failed to upload popup image.');
      } finally {
        setIsUploadingPopupImg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Custom Nepal Flag upload handler
  const handleFlagUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken || !storeSettingsForm) return;

    setIsUploadingFlag(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64Data, adminToken, file.name);
        setStoreSettingsForm({
          ...storeSettingsForm,
          nepalFlagUrl: uploadedUrl
        });
        showToast('Custom Nepal flag uploaded! Click "Save Settings" to apply.');
      } catch (err) {
        showToast('Failed to upload flag image.');
      } finally {
        setIsUploadingFlag(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!adminToken) return;
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      await api.deleteProduct(id, adminToken);
      showToast(`Product "${name}" deleted`);
      await loadAdminData();
      await refreshProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product');
    }
  };

  // Toggle Visibility
  const handleToggleVisibility = async (prod: Product) => {
    if (!adminToken) return;
    try {
      await api.updateProduct(prod.id, { isVisible: !prod.isVisible }, adminToken);
      showToast(`Product is now ${!prod.isVisible ? 'Visible' : 'Hidden'}`);
      await loadAdminData();
      await refreshProducts();
    } catch (err: any) {
      showToast('Failed to update visibility');
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (!adminToken) return;
    try {
      await api.updateOrderStatus(orderId, { orderStatus: status }, adminToken);
      showToast(`Order status updated to ${status}`);
      await loadAdminData();
    } catch (err: any) {
      showToast('Failed to update order');
    }
  };

  // Update Order Payment Status (Pending Verification / Payment Verified / Payment Rejected)
  const handleUpdateOrderPaymentStatus = async (orderId: string, paymentStatus: string, orderStatus?: string) => {
    if (!adminToken) return;
    try {
      await api.updateOrderStatus(orderId, { paymentStatus, ...(orderStatus ? { orderStatus } : {}) }, adminToken);
      showToast(`Payment status updated to ${paymentStatus.replace('_', ' ')}`);
      await loadAdminData();
    } catch (err: any) {
      showToast('Failed to update payment status');
    }
  };

  // Update Review Status
  const handleUpdateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    if (!adminToken) return;
    try {
      await api.updateReviewStatus(reviewId, status, adminToken);
      showToast(`Review ${status}`);
      await loadAdminData();
    } catch (err: any) {
      showToast('Failed to moderate review');
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId: string) => {
    if (!adminToken) return;
    if (!confirm('Delete this customer review?')) return;
    try {
      await api.deleteReview(reviewId, adminToken);
      showToast('Review removed');
      await loadAdminData();
    } catch (err: any) {
      showToast('Failed to delete review');
    }
  };

  // Save Settings & Brand/Founder
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !storeSettingsForm) return;
    setIsSavingSettings(true);
    try {
      await api.updateStoreSettings(storeSettingsForm, adminToken);
      await refreshSettings();
      showToast('Store settings & Founder info updated live!');
    } catch (err: any) {
      showToast('Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Change Admin Email/Password
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    if (newAdminPassword && newAdminPassword !== confirmAdminPassword) {
      showToast('Passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdatingCredentials(true);
    try {
      await api.updateAdminCredentials(
        {
          newEmail: newAdminEmail.trim() || undefined,
          newPassword: newAdminPassword || undefined
        },
        adminToken
      );
      showToast('Admin credentials updated successfully!');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update credentials');
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div
        className="relative bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden h-[94vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header with official खोजौँ branding */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-200 bg-zinc-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            {globalSettings?.logoUrl ? (
              <img
                src={globalSettings.logoUrl}
                alt="Khojau"
                className="h-7 w-auto object-contain brightness-0 invert"
              />
            ) : (
              <span className="text-xl font-black text-red-500 font-heading">खोजौँ</span>
            )}
            <span className="text-zinc-600">|</span>
            <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
              Admin Portal
            </span>
            <h1 className="text-sm font-bold font-heading hidden sm:inline">
              {globalSettings?.storeName || 'Khojau'} Merchant Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={logoutAdmin}
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={() => setIsAdminDashboardOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close admin dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Admin Panel Internal Notification Banner */}
        {adminToast && (
          <div
            key={adminToast.id}
            className={`absolute top-16 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
              adminToast.type === 'error'
                ? 'bg-red-600 text-white border-red-400 animate-errorShake'
                : 'bg-emerald-600 text-white border-emerald-400 animate-bounce'
            }`}
          >
            {adminToast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span className="flex-1 leading-snug">{adminToast.message}</span>
            <button
              type="button"
              onClick={() => setAdminToast(null)}
              className="p-0.5 rounded hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Not Logged In: Secure Admin Login Screen */}
        {!isAdmin ? (
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 bg-zinc-50">
            <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
              
              {/* Khojau Official Branding on Login */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-1">
                  {globalSettings?.logoUrl ? (
                    <img
                      src={globalSettings.logoUrl}
                      alt="Khojau Logo"
                      className="h-12 w-auto object-contain max-w-[200px]"
                    />
                  ) : (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100 text-red-600 mb-1">
                      <span className="text-3xl font-black font-heading">खोजौँ</span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-extrabold text-zinc-950 font-heading">
                  Khojau Merchant Administration
                </h2>
                <p className="text-xs text-zinc-500">
                  Authorized store owner access only. Manage your products, prices, and orders securely.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                {adminLoginError && (
                  <div
                    key={adminErrorKey}
                    className="animate-errorShake flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border-2 border-red-500 text-red-700 shadow-sm"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex-1 text-xs">
                      <p className="font-extrabold text-red-700 uppercase tracking-wide">Login Failed</p>
                      <p className="font-medium text-red-600 mt-0.5">{adminLoginError}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Administrator Email / Username</label>
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={e => {
                      setAdminEmail(e.target.value);
                      if (adminLoginError) setAdminLoginError(null);
                    }}
                    placeholder="Enter admin email or username"
                    className={`w-full text-xs p-2.5 bg-zinc-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors ${
                      adminLoginError ? 'border-red-500 bg-red-50/40' : 'border-zinc-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={e => {
                      setAdminPassword(e.target.value);
                      if (adminLoginError) setAdminLoginError(null);
                    }}
                    placeholder="Enter admin password"
                    className={`w-full text-xs p-2.5 bg-zinc-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors ${
                      adminLoginError ? 'border-red-500 bg-red-50/40' : 'border-zinc-200'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors active:scale-98 cursor-pointer"
                >
                  {isLoggingIn ? 'Verifying Credentials...' : 'Sign In to Admin Panel'}
                </button>
              </form>

              <div className="text-center text-[11px] text-zinc-400 pt-2 border-t border-zinc-100">
                Encrypted Session · Protected Endpoints
              </div>
            </div>
          </div>
        ) : (
          /* Logged In Admin Dashboard Layout */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-50">
            
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-56 bg-white border-r border-zinc-200 p-3 flex md:flex-col gap-1 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'overview' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'products' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Products ({adminProducts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'orders' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Orders ({adminOrders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('payment')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'payment' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>QR Payment Settings</span>
              </button>

              <button
                onClick={() => setActiveTab('offers')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'offers' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Gift className="w-4 h-4 text-red-600" />
                <span>Offers & Dashain Popup</span>
              </button>

              <button
                onClick={() => setActiveTab('brand')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'brand' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <UserCheck className="w-4 h-4 text-red-600" />
                <span>Brand & Visuals</span>
              </button>

              <button
                onClick={() => setActiveTab('texts')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'texts' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <FileText className="w-4 h-4 text-red-600" />
                <span>Website Texts (All Copy)</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'reviews' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Reviews ({adminReviews.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'settings' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Store & Logistics</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'ai' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>AI Assistant</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'security' ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Security / Password</span>
              </button>

              <div className="mt-auto pt-3 border-t border-zinc-100 hidden md:block text-[11px] text-zinc-400 px-2">
                Khojau Core · Clean Data
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              
              {/* TAB 1: OVERVIEW (Real-Business Clean Data starting at 0) */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 font-heading">Store Performance Overview</h2>
                    <p className="text-xs text-zinc-500">Live analytics starting with clean real-business data.</p>
                  </div>

                  {/* 4 Key Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-zinc-500 mb-2">
                        <span className="text-xs font-semibold">Total Revenue</span>
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xl sm:text-2xl font-extrabold text-zinc-950 tabular-nums">
                        Rs. {(stats?.totalRevenue || 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">Total Sales: Rs. {(stats?.totalRevenue || 0).toLocaleString()}</p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-zinc-500 mb-2">
                        <span className="text-xs font-semibold">Total Orders</span>
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xl sm:text-2xl font-extrabold text-zinc-950 tabular-nums">
                        {stats?.totalOrders || 0}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {stats?.completedOrders || 0} Delivered
                      </p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-zinc-500 mb-2">
                        <span className="text-xs font-semibold">Pending Orders</span>
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-xl sm:text-2xl font-extrabold text-zinc-950 tabular-nums">
                        {stats?.pendingOrders || 0}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">Awaiting dispatch</p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-zinc-500 mb-2">
                        <span className="text-xs font-semibold">Catalog Products</span>
                        <Package className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-xl sm:text-2xl font-extrabold text-zinc-950 tabular-nums">
                        {stats?.totalProducts || 0}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {stats?.outOfStockCount || 0} Out of Stock
                      </p>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-900 font-heading">Recent Orders</h3>
                      {adminOrders.length > 0 && (
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="text-xs text-red-600 font-bold hover:underline"
                        >
                          View All Orders →
                        </button>
                      )}
                    </div>

                    {adminOrders.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-400">
                        No orders placed yet. When customers place orders via COD or digital payments, they will appear here live.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                            <tr>
                              <th className="py-2.5 px-4">Order #</th>
                              <th className="py-2.5 px-4">Customer</th>
                              <th className="py-2.5 px-4">Total</th>
                              <th className="py-2.5 px-4">Status</th>
                              <th className="py-2.5 px-4">Quick Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {adminOrders.slice(0, 5).map(o => (
                              <tr key={o.id} className="hover:bg-zinc-50">
                                <td className="py-3 px-4 font-mono font-bold text-zinc-900">{o.orderNumber}</td>
                                <td className="py-3 px-4">
                                  <p className="font-semibold text-zinc-900">{o.customerName}</p>
                                  <p className="text-[11px] text-zinc-400">{o.customerPhone}</p>
                                </td>
                                <td className="py-3 px-4 font-bold tabular-nums">Rs. {o.total.toLocaleString()}</td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      o.orderStatus === 'delivered'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : o.orderStatus === 'shipped'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {o.orderStatus}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={o.orderStatus}
                                    onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                                    className="text-xs p-1 bg-white border border-zinc-200 rounded focus:ring-1 focus:ring-red-600"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS MANAGER (Full CRUD + Discounts ON/OFF + Image Upload) */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-950 font-heading">Product Catalog Management</h2>
                      <p className="text-xs text-zinc-500">
                        Upload photos, adjust prices, toggle discounts ON/OFF, and update inventory.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenCreateProduct}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors self-start"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                          <tr>
                            <th className="py-2.5 px-4">Item</th>
                            <th className="py-2.5 px-4">Category</th>
                            <th className="py-2.5 px-4">Price / Discount</th>
                            <th className="py-2.5 px-4">Stock</th>
                            <th className="py-2.5 px-4">Visibility</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {adminProducts.map(prod => {
                            const isDiscountActive = Boolean(prod.isDiscountActive && prod.discountPrice);
                            return (
                              <tr key={prod.id} className="hover:bg-zinc-50">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={prod.images?.[0] || ''}
                                      alt={prod.name}
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                                    />
                                    <div className="truncate max-w-[200px] sm:max-w-xs">
                                      <p className="font-bold text-zinc-900 truncate">{prod.name}</p>
                                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                        {prod.isFeatured && <span className="text-red-600 font-semibold">Featured</span>}
                                        {prod.isNew && <span>· New</span>}
                                        {prod.isPopular && <span>· Popular</span>}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4 font-medium text-zinc-600">{prod.category}</td>

                                <td className="py-3 px-4">
                                  {isDiscountActive ? (
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="font-bold text-zinc-900 tabular-nums">
                                        Rs. {prod.discountPrice?.toLocaleString()}
                                      </span>
                                      <span className="text-[11px] text-zinc-400 line-through tabular-nums">
                                        Rs. {prod.price.toLocaleString()}
                                      </span>
                                      <span className="text-[10px] font-bold text-red-600">
                                        ({prod.discountPercentage || Math.round(((prod.price - (prod.discountPrice || 0)) / prod.price) * 100)}% OFF)
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-zinc-900 tabular-nums">
                                      Rs. {prod.price.toLocaleString()}
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4">
                                  <span className={`font-semibold tabular-nums ${prod.stock > 0 ? 'text-zinc-900' : 'text-rose-600 font-bold'}`}>
                                    {prod.stock} units
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => handleToggleVisibility(prod)}
                                    className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                                      prod.isVisible
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                                    }`}
                                  >
                                    {prod.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    <span>{prod.isVisible ? 'Live' : 'Hidden'}</span>
                                  </button>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleOpenEditProduct(prod)}
                                      className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md"
                                      title="Edit Product"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ORDERS MANAGER */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 font-heading">Order Management & Fulfillment</h2>
                    <p className="text-xs text-zinc-500">Track shipments, verify delivery addresses, and change statuses.</p>
                  </div>

                  {/* Order Search & Status Filter Strip */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-zinc-200 rounded-xl shadow-2xs">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={e => setOrderSearchQuery(e.target.value)}
                        placeholder="Search orders by ID, customer name, phone, city..."
                        className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2 pointer-events-none" />
                      {orderSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setOrderSearchQuery('')}
                          className="absolute right-2.5 top-1.5 text-zinc-400 hover:text-zinc-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
                      {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => (
                        <button
                          key={st}
                          onClick={() => setOrderStatusFilter(st)}
                          className={`px-2.5 py-1 rounded-md capitalize transition-colors whitespace-nowrap ${
                            orderStatusFilter === st
                              ? 'bg-zinc-900 text-white'
                              : 'text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const filteredOrders = adminOrders.filter(o => {
                      if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                      if (!orderSearchQuery.trim()) return true;
                      const q = orderSearchQuery.toLowerCase();
                      return (
                        o.orderNumber.toLowerCase().includes(q) ||
                        o.customerName.toLowerCase().includes(q) ||
                        o.customerPhone.includes(q) ||
                        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
                        o.shippingAddress.city.toLowerCase().includes(q) ||
                        o.shippingAddress.street.toLowerCase().includes(q)
                      );
                    });

                    if (filteredOrders.length === 0) {
                      return (
                        <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-8 text-center text-xs text-zinc-500 space-y-2">
                          <ShoppingBag className="w-8 h-8 text-zinc-300 mx-auto" />
                          <p className="font-semibold text-zinc-800">
                            {adminOrders.length === 0 ? "No active customer orders right now." : "No orders matching current filter or search."}
                          </p>
                          <p className="text-zinc-400">All customer checkouts will be queued here.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {filteredOrders.map(order => (
                        <div key={order.id} className="p-4 sm:p-5 bg-white border border-zinc-200 rounded-xl space-y-3.5 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-zinc-950 text-sm">{order.orderNumber}</span>
                              <span className="text-zinc-400">· {new Date(order.createdAt).toLocaleString()}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  order.paymentStatus === 'verified' || order.paymentStatus === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : order.paymentStatus === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {order.paymentStatus === 'verified' || order.paymentStatus === 'paid'
                                  ? '✓ Payment Verified'
                                  : order.paymentStatus === 'rejected'
                                  ? '✕ Payment Rejected'
                                  : '⏳ Pending Verification'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500">Order Status:</span>
                              <select
                                value={order.orderStatus}
                                onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                                className={`text-xs font-bold uppercase px-2.5 py-1 rounded border ${
                                  order.orderStatus === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : order.orderStatus === 'shipped'
                                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          {/* Customer & Address Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-zinc-50 p-3 rounded-lg">
                            <div>
                              <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Customer</span>
                              <p className="font-bold text-zinc-900">{order.customerName}</p>
                              <p className="text-zinc-600">{order.customerPhone}</p>
                              {order.customerEmail && <p className="text-zinc-400 text-[11px]">{order.customerEmail}</p>}
                            </div>

                            <div className="sm:col-span-2">
                              <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Shipping Address</span>
                              <p className="font-semibold text-zinc-900">{order.shippingAddress.street}</p>
                              <p className="text-zinc-600">
                                {order.shippingAddress.city} · {order.shippingAddress.zone === 'kathmandu_valley' ? 'Butwal & Rupandehi' : 'Outside Butwal (Nationwide)'}
                              </p>
                              {order.shippingAddress.landmarks && (
                                <p className="text-zinc-500 text-[11px]">Landmark: {order.shippingAddress.landmarks}</p>
                              )}
                            </div>
                          </div>

                          {/* Ordered Products */}
                          <div className="divide-y divide-zinc-100 text-xs">
                            {order.items.map((it, i) => (
                              <div key={i} className="py-1.5 flex items-center justify-between">
                                <span className="text-zinc-800">
                                  <span className="font-bold">{it.quantity}x</span> {it.name}
                                  <span className="text-zinc-400 ml-1.5">(Rs. {it.price.toLocaleString()} each)</span>
                                  {it.selectedSize && ` (${it.selectedSize})`}
                                  {it.selectedColor && ` [${it.selectedColor}]`}
                                </span>
                                <span className="font-semibold text-zinc-900 tabular-nums">
                                  Rs. {(it.price * it.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* QR Payment Proof & Verification Box (Requirement 6) */}
                          <div className="bg-zinc-50/90 border border-zinc-200 rounded-xl p-3.5 space-y-3 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500">Payment Method:</span>
                                  <strong className="text-zinc-900 uppercase">
                                    {order.paymentMethod === 'qr_pay' ? 'QR Payment' : order.paymentMethod}
                                  </strong>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500">Transaction ID:</span>
                                  {order.transactionId ? (
                                    <span className="font-mono font-bold text-zinc-950 bg-white border border-zinc-300 px-2 py-0.5 rounded select-all">
                                      {order.transactionId}
                                    </span>
                                  ) : (
                                    <span className="text-amber-700 italic">Waiting for customer submission</span>
                                  )}
                                </div>
                                {order.paymentRemark && (
                                  <div className="text-[11px] text-zinc-500">
                                    Remark: <span className="font-mono text-zinc-700">{order.paymentRemark}</span>
                                  </div>
                                )}
                              </div>

                              {/* Optional Payment Screenshot Thumbnail */}
                              {order.paymentScreenshotUrl && (
                                <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-zinc-200">
                                  <img
                                    src={order.paymentScreenshotUrl}
                                    alt="Payment Receipt"
                                    onClick={() => setEnlargedScreenshotUrl(order.paymentScreenshotUrl || null)}
                                    className="w-12 h-12 rounded object-cover border border-zinc-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  />
                                  <div>
                                    <p className="font-bold text-zinc-800 text-[11px]">Payment Screenshot</p>
                                    <button
                                      type="button"
                                      onClick={() => setEnlargedScreenshotUrl(order.paymentScreenshotUrl || null)}
                                      className="text-red-600 font-semibold text-[11px] hover:underline inline-flex items-center gap-1"
                                    >
                                      <span>View Full Receipt</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Admin Verification Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-zinc-200/80">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Set Payment Status:</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderPaymentStatus(order.id, 'verified', 'processing')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    order.paymentStatus === 'verified'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  }`}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Payment Verified</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderPaymentStatus(order.id, 'pending_verification')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    order.paymentStatus === 'pending_verification'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300'
                                  }`}
                                >
                                  <span>Pending Verification</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderPaymentStatus(order.id, 'rejected')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    order.paymentStatus === 'rejected'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300'
                                  }`}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Payment Rejected</span>
                                </button>
                              </div>

                              <span className="text-sm font-extrabold text-red-600 tabular-nums">
                                Total: Rs. {order.total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                </div>
              )}

              {/* TAB: QR PAYMENT SETTINGS (Requirement 1 & 11) */}
              {activeTab === 'payment' && storeSettingsForm && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-950 font-heading flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-emerald-600" />
                        <span>Official Khojau QR Payment Settings</span>
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Upload your real bank or wallet QR code. Customers scan this exact QR code at checkout across all devices.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-3.5 py-2 rounded-xl cursor-pointer shadow-2xs">
                      <input
                        type="checkbox"
                        checked={storeSettingsForm.qrPaymentSettings?.enabled !== false}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          qrPaymentSettings: {
                            ...(storeSettingsForm.qrPaymentSettings || {
                              qrImageUrl: '',
                              providerName: 'Fonepay / eSewa / Khalti / NepalPay',
                              accountName: 'KHOJAU ONLINE STORE',
                              instructions: 'तलको QR स्क्यान गरेर भुक्तानी गर्नुहोस्। भुक्तानी गरेपछि Transaction ID राख्नुहोस्।'
                            }),
                            enabled: e.target.checked
                          }
                        })}
                        className="text-emerald-600 rounded w-4 h-4"
                      />
                      <span className="text-xs font-bold text-zinc-800">
                        {storeSettingsForm.qrPaymentSettings?.enabled !== false ? 'QR Payment Active' : 'QR Payment Disabled'}
                      </span>
                    </label>
                  </div>

                  {/* Official QR Code Upload & Square Preview */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        <span>Official Payment QR Code Image</span>
                      </h3>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        1:1 Square · High-Res Scannable
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                      {/* Square QR Preview */}
                      <div className="w-56 h-56 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-300 flex items-center justify-center p-3 shrink-0 overflow-hidden shadow-inner">
                        {storeSettingsForm.qrPaymentSettings?.qrImageUrl ? (
                          <img
                            src={storeSettingsForm.qrPaymentSettings.qrImageUrl}
                            alt="Official Khojau QR Preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center space-y-2 text-zinc-400 p-4">
                            <QrCode className="w-12 h-12 mx-auto text-zinc-300" />
                            <p className="text-[11px] font-medium">No QR Code Uploaded Yet</p>
                            <p className="text-[10px]">Upload your eSewa, Khalti, or Fonepay QR image</p>
                          </div>
                        )}
                      </div>

                      {/* Upload / Replace / Remove Controls */}
                      <div className="space-y-3 flex-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer text-xs font-bold shadow-xs transition-colors">
                            <Upload className="w-4 h-4" />
                            <span>
                              {isUploadingQr
                                ? 'Uploading QR...'
                                : storeSettingsForm.qrPaymentSettings?.qrImageUrl
                                ? 'Replace QR Code'
                                : 'Upload Official QR Code'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingQr}
                              onChange={handleQrUpload}
                              className="hidden"
                            />
                          </label>

                          {storeSettingsForm.qrPaymentSettings?.qrImageUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setStoreSettingsForm({
                                  ...storeSettingsForm,
                                  qrPaymentSettings: {
                                    ...storeSettingsForm.qrPaymentSettings,
                                    qrImageUrl: ''
                                  }
                                });
                                showToast('QR code removed. Click "Save QR Payment Settings" to apply.');
                              }}
                              className="px-3 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition-colors"
                            >
                              Delete / Remove QR Code
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-zinc-700 mb-1">QR Image URL / Path</label>
                          <input
                            type="text"
                            value={storeSettingsForm.qrPaymentSettings?.qrImageUrl || ''}
                            onChange={e => setStoreSettingsForm({
                              ...storeSettingsForm,
                              qrPaymentSettings: {
                                ...(storeSettingsForm.qrPaymentSettings || {
                                  enabled: true,
                                  providerName: 'Fonepay / eSewa / Khalti',
                                  accountName: 'KHOJAU ONLINE STORE',
                                  instructions: ''
                                }),
                                qrImageUrl: e.target.value
                              }
                            })}
                            placeholder="Upload above or paste direct QR image URL"
                            className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono"
                          />
                        </div>

                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Uses the exact QR image uploaded by you. Never stretched or distorted. Saved centrally so every customer on mobile, tablet, and desktop sees your latest QR immediately.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Provider, Account Name & Instructions */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs shadow-2xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                      Payment Provider & Account Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Payment Provider Name *</label>
                        <input
                          type="text"
                          required
                          value={storeSettingsForm.qrPaymentSettings?.providerName || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            qrPaymentSettings: {
                              ...storeSettingsForm.qrPaymentSettings,
                              providerName: e.target.value
                            }
                          })}
                          placeholder="e.g. Fonepay / eSewa / Khalti / NepalPay"
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Account / Wallet Name *</label>
                        <input
                          type="text"
                          required
                          value={storeSettingsForm.qrPaymentSettings?.accountName || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            qrPaymentSettings: {
                              ...storeSettingsForm.qrPaymentSettings,
                              accountName: e.target.value
                            }
                          })}
                          placeholder="e.g. KHOJAU ONLINE STORE"
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Wallet ID / Account Number (Optional)</label>
                      <input
                        type="text"
                        value={storeSettingsForm.qrPaymentSettings?.accountNumber || ''}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          qrPaymentSettings: {
                            ...storeSettingsForm.qrPaymentSettings,
                            accountNumber: e.target.value
                          }
                        })}
                        placeholder="e.g. 9841000000"
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Payment Instructions (Nepali / English)</label>
                      <textarea
                        rows={3}
                        value={storeSettingsForm.qrPaymentSettings?.instructions || ''}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          qrPaymentSettings: {
                            ...storeSettingsForm.qrPaymentSettings,
                            instructions: e.target.value
                          }
                        })}
                        placeholder="तलको QR स्क्यान गरेर भुक्तानी गर्नुहोस्। भुक्तानी गरेपछि Transaction ID राख्नुहोस्।"
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSettings ? 'Saving...' : 'Save QR Payment Settings'}</span>
                  </button>
                </form>
              )}

              {/* TAB: OFFERS & DASHAIN PROMOTIONAL POPUP (Requirement 4) */}
              {activeTab === 'offers' && storeSettingsForm && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-950 font-heading flex items-center gap-2">
                        <Gift className="w-5 h-5 text-red-600" />
                        <span>Dashain Offer & Promotional Popup</span>
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Configure the promotional popup image, Nepali text, and discount percentage shown when customers enter Khojau.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-3.5 py-2 rounded-xl cursor-pointer shadow-2xs">
                      <input
                        type="checkbox"
                        checked={storeSettingsForm.promotionalOffer?.enabled !== false}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          promotionalOffer: {
                            ...(storeSettingsForm.promotionalOffer || {
                              title: 'दशैंको विशेष अफर 🎉',
                              subtitle: 'सबै उत्पादनमा २५% सम्म छुट!',
                              discountPercentage: 25,
                              buttonText: 'अहिले किनमेल गर्नुहोस्'
                            }),
                            enabled: e.target.checked
                          }
                        })}
                        className="text-red-600 rounded w-4 h-4"
                      />
                      <span className="text-xs font-bold text-zinc-800">
                        {storeSettingsForm.promotionalOffer?.enabled !== false ? 'Popup Enabled' : 'Popup Disabled'}
                      </span>
                    </label>
                  </div>

                  {/* Popup Image Upload & Preview */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-red-600" />
                        <span>Promotional Popup Banner Image</span>
                      </h3>
                      <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                        Uploaded from Admin Seat
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      <div className="w-full sm:w-56 aspect-16/10 rounded-xl bg-zinc-100 border border-zinc-300 overflow-hidden flex items-center justify-center shrink-0">
                        {storeSettingsForm.promotionalOffer?.popupImageUrl ? (
                          <img
                            src={storeSettingsForm.promotionalOffer.popupImageUrl}
                            alt="Popup Offer Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4 text-zinc-400 space-y-1">
                            <ImageIcon className="w-8 h-8 mx-auto" />
                            <p className="text-[11px]">No custom popup image</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 flex-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {isUploadingPopupImg
                                ? 'Uploading Image...'
                                : storeSettingsForm.promotionalOffer?.popupImageUrl
                                ? 'Replace Popup Image'
                                : 'Upload Popup Image'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingPopupImg}
                              onChange={handlePopupImageUpload}
                              className="hidden"
                            />
                          </label>

                          {storeSettingsForm.promotionalOffer?.popupImageUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setStoreSettingsForm({
                                  ...storeSettingsForm,
                                  promotionalOffer: {
                                    ...storeSettingsForm.promotionalOffer!,
                                    popupImageUrl: ''
                                  }
                                });
                                showToast('Popup image removed. Click Save below to apply.');
                              }}
                              className="px-3 py-2 border border-zinc-200 hover:bg-zinc-100 text-rose-600 font-semibold rounded-lg text-xs transition-colors"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-zinc-700 mb-1">Popup Image URL</label>
                          <input
                            type="text"
                            value={storeSettingsForm.promotionalOffer?.popupImageUrl || ''}
                            onChange={e => setStoreSettingsForm({
                              ...storeSettingsForm,
                              promotionalOffer: {
                                ...(storeSettingsForm.promotionalOffer || {
                                  enabled: true,
                                  title: 'दशैंको विशेष अफर 🎉',
                                  subtitle: 'सबै उत्पादनमा २५% सम्म छुट!',
                                  discountPercentage: 25,
                                  buttonText: 'अहिले किनमेल गर्नुहोस्'
                                }),
                                popupImageUrl: e.target.value
                              }
                            })}
                            placeholder="Upload above or paste image URL"
                            className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Offer Text & Discount Details */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Offer Heading (Title) *</label>
                        <input
                          type="text"
                          required
                          value={storeSettingsForm.promotionalOffer?.title || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            promotionalOffer: {
                              ...storeSettingsForm.promotionalOffer!,
                              title: e.target.value
                            }
                          })}
                          placeholder="दशैंको विशेष अफर 🎉"
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Discount Percentage (%) *</label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          required
                          value={storeSettingsForm.promotionalOffer?.discountPercentage ?? 25}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            promotionalOffer: {
                              ...storeSettingsForm.promotionalOffer!,
                              discountPercentage: Number(e.target.value)
                            }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Offer Description / Subtitle *</label>
                      <input
                        type="text"
                        required
                        value={storeSettingsForm.promotionalOffer?.subtitle || ''}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          promotionalOffer: {
                            ...storeSettingsForm.promotionalOffer!,
                            subtitle: e.target.value
                          }
                        })}
                        placeholder="सबै उत्पादनमा २५% सम्म छुट!"
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">CTA Button Text</label>
                        <input
                          type="text"
                          value={storeSettingsForm.promotionalOffer?.buttonText || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            promotionalOffer: {
                              ...storeSettingsForm.promotionalOffer!,
                              buttonText: e.target.value
                            }
                          })}
                          placeholder="अहिले किनमेल गर्नुहोस्"
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Start Date (Optional)</label>
                        <input
                          type="date"
                          value={storeSettingsForm.promotionalOffer?.startDate || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            promotionalOffer: {
                              ...storeSettingsForm.promotionalOffer!,
                              startDate: e.target.value
                            }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">End Date (Optional)</label>
                        <input
                          type="date"
                          value={storeSettingsForm.promotionalOffer?.endDate || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            promotionalOffer: {
                              ...storeSettingsForm.promotionalOffer!,
                              endDate: e.target.value
                            }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSettings ? 'Saving...' : 'Save Promotional Offer'}</span>
                  </button>
                </form>
              )}

              {/* TAB 4: BRAND & FOUNDER SETTINGS (Completely Editable with Photo, Hero Text, Nepal Flag & Hero Upload) */}
              {activeTab === 'brand' && storeSettingsForm && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 font-heading">
                      Brand, Hero Texts, Nepal Flag & Founder Customization
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Manage Khojau's official logo, homepage hero texts, custom Nepal flag, hero banner, and founder story.
                    </p>
                  </div>

                  {/* Homepage Hero Texts (Badge, Main Heading, Subtitle) */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-red-600" />
                        <span>Homepage Hero Texts (Editable Main Heading & Badge)</span>
                      </h3>
                      <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                        Live Homepage Copy
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Top Badge Text (e.g. AUTHENTIC NEPALI STORE)
                      </label>
                      <input
                        type="text"
                        value={storeSettingsForm.heroBadgeText || ''}
                        onChange={e => setStoreSettingsForm({ ...storeSettingsForm, heroBadgeText: e.target.value })}
                        placeholder="Authentic Nepali Store"
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Main Hero Heading (Genuine Products & Nepali...)
                      </label>
                      <textarea
                        rows={3}
                        value={storeSettingsForm.heroTitle || ''}
                        onChange={e => setStoreSettingsForm({ ...storeSettingsForm, heroTitle: e.target.value })}
                        placeholder="Genuine Products & Nepali Craftsmanship, Delivered Across Nepal."
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-heading font-bold leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Hero Subtitle / Description
                      </label>
                      <textarea
                        rows={3}
                        value={storeSettingsForm.heroSubtitle || ''}
                        onChange={e => setStoreSettingsForm({ ...storeSettingsForm, heroSubtitle: e.target.value })}
                        placeholder="Handpicked everyday essentials, pure Himalayan cashmere, organic mountain teas, and verified electronics..."
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Nepal Flag Upload & Customization */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Flag className="w-4 h-4 text-red-600" />
                        <span>Nepal Flag Icon / Image Customization</span>
                      </h3>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Header & Hero Flag
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                      <div className="w-24 h-24 rounded-xl bg-zinc-50 border border-dashed border-zinc-300 flex items-center justify-center p-3 shrink-0">
                        {storeSettingsForm.nepalFlagUrl ? (
                          <img
                            src={storeSettingsForm.nepalFlagUrl}
                            alt="Custom Nepal Flag"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center space-y-1">
                            <span className="text-2xl">🇳🇵</span>
                            <p className="text-[10px] text-zinc-500">Default SVG</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 flex-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingFlag ? 'Uploading Flag...' : storeSettingsForm.nepalFlagUrl ? 'Replace Flag Image' : 'Upload Custom Nepal Flag'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingFlag}
                              onChange={handleFlagUpload}
                              className="hidden"
                            />
                          </label>

                          {storeSettingsForm.nepalFlagUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setStoreSettingsForm({
                                  ...storeSettingsForm,
                                  nepalFlagUrl: ''
                                });
                                showToast('Reverted to authentic double-pennant Nepal Flag SVG. Click Save to apply.');
                              }}
                              className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-rose-600 font-semibold rounded-lg text-xs transition-colors"
                            >
                              Reset to Default Flag
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-zinc-700 mb-1">Custom Flag Image URL</label>
                          <input
                            type="text"
                            value={storeSettingsForm.nepalFlagUrl || ''}
                            onChange={e => setStoreSettingsForm({ ...storeSettingsForm, nepalFlagUrl: e.target.value })}
                            placeholder="Leave empty for built-in authentic double-triangle SVG flag"
                            className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1. Official Khojau Logo Management (Requirement 5) */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-red-600" />
                        <span>Khojau Official Brand Logo</span>
                      </h3>
                      <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                        Vector / High-Res Image
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Logo Preview Container preserving original aspect ratio and transparency */}
                      <div className="p-4 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl flex items-center justify-center min-w-[200px] max-w-xs min-h-[90px] overflow-hidden">
                        {storeSettingsForm.logoUrl ? (
                          <img
                            src={storeSettingsForm.logoUrl}
                            alt="Khojau Brand Logo Preview"
                            className="max-h-14 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-zinc-400 text-xs italic">No logo uploaded yet</span>
                        )}
                      </div>

                      {/* Logo Actions: Upload, Replace, Remove */}
                      <div className="space-y-2.5 flex-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingLogo ? 'Uploading Logo...' : storeSettingsForm.logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingLogo}
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>

                          {storeSettingsForm.logoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setStoreSettingsForm({
                                  ...storeSettingsForm,
                                  logoUrl: ''
                                });
                                showToast('Logo removed. Click Save below to apply.');
                              }}
                              className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-rose-600 font-semibold rounded-lg text-xs transition-colors"
                            >
                              Remove Logo
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setStoreSettingsForm({
                                ...storeSettingsForm,
                                logoUrl: '/src/assets/images/khojau_logo.svg'
                              });
                              showToast('Reset to default Khojau SVG logo. Click Save to apply.');
                            }}
                            className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold rounded-lg text-xs transition-colors"
                          >
                            Default Logo
                          </button>
                        </div>

                        <div>
                          <label className="block font-semibold text-zinc-700 mb-1">Logo URL / Image Path</label>
                          <input
                            type="text"
                            value={storeSettingsForm.logoUrl || ''}
                            onChange={e => setStoreSettingsForm({ ...storeSettingsForm, logoUrl: e.target.value })}
                            placeholder="Enter image URL or upload file above"
                            className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                          />
                        </div>

                        <p className="text-[11px] text-zinc-500">
                          Preserves original aspect ratio and transparency. Updates automatically in Header, Mobile navigation, Footer, Admin Login, Admin Dashboard, and About page.
                        </p>
                      </div>
                    </div>

                    {/* Favicon Management */}
                    <div className="pt-4 border-t border-zinc-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-zinc-800 text-xs">Browser Tab Favicon</label>
                        <span className="text-[10px] font-semibold text-zinc-500">Updates browser tab icon globally</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-10 h-10 rounded-lg border border-zinc-300 bg-zinc-50 flex items-center justify-center p-1.5 shrink-0">
                          <img
                            src={storeSettingsForm.faviconUrl || storeSettingsForm.logoUrl || './src/assets/images/khojau_logo.svg'}
                            alt="Favicon preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Favicon</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !adminToken) return;
                              const reader = new FileReader();
                              reader.onload = async () => {
                                const base64 = reader.result as string;
                                const uploadedUrl = await api.uploadImage(base64, adminToken, file.name);
                                const updated = { ...storeSettingsForm, faviconUrl: uploadedUrl };
                                setStoreSettingsForm(updated);
                                await api.updateStoreSettings(updated, adminToken);
                                await refreshSettings();
                                showToast('Favicon uploaded and synced globally!');
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={storeSettingsForm.faviconUrl || ''}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, faviconUrl: e.target.value })}
                          placeholder="Favicon URL or leave blank to use Store Logo"
                          className="flex-1 min-w-[180px] p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Global Store Categories Management */}
                    <div className="pt-4 border-t border-zinc-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-zinc-800 text-xs">Storefront Product Categories (Comma-Separated)</label>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Syncs to Navbar & Filters</span>
                      </div>
                      <input
                        type="text"
                        value={(storeSettingsForm.customCategories || [
                          'Electronics',
                          'Fashion',
                          'Home & Kitchen',
                          'Beauty & Personal Care',
                          'Handicrafts & Art',
                          'Groceries & Tea',
                          'Accessories'
                        ]).join(', ')}
                        onChange={e =>
                          setStoreSettingsForm({
                            ...storeSettingsForm,
                            customCategories: e.target.value
                              .split(',')
                              .map(c => c.trim())
                              .filter(Boolean)
                          })
                        }
                        placeholder="Electronics, Fashion, Home & Kitchen, Handicrafts & Art..."
                        className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                      <p className="text-[11px] text-zinc-500">
                        Add, rename, or reorder categories here. Click Save Store Settings below to update navigation and product filters across all devices.
                      </p>
                    </div>
                  </div>

                  {/* 2. Main Khojau Hero Image (Requirement 1 & 2) */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-red-600" />
                        <span>Main Homepage Hero Banner Image</span>
                      </h3>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        16:9 Landscape Banner
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Responsive 16:9 Aspect Ratio Preview Container */}
                      <div className="relative w-full aspect-16/9 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-300 shadow-inner">
                        {storeSettingsForm.heroBannerUrl ? (
                          <img
                            src={storeSettingsForm.heroBannerUrl}
                            alt="Main Khojau Hero Preview"
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-xs">No hero image uploaded</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-zinc-950/75 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded">
                          Live Homepage Hero Preview
                        </div>
                      </div>

                      {/* Hero Image Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingHero ? 'Uploading Hero...' : storeSettingsForm.heroBannerUrl ? 'Replace Hero Image' : 'Upload Hero Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingHero}
                            onChange={handleHeroImageUpload}
                            className="hidden"
                          />
                        </label>

                        {storeSettingsForm.heroBannerUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setStoreSettingsForm({
                                ...storeSettingsForm,
                                heroBannerUrl: ''
                              });
                              showToast('Hero image removed. Click Save below to apply.');
                            }}
                            className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-rose-600 font-semibold rounded-lg text-xs transition-colors"
                          >
                            Remove Hero
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setStoreSettingsForm({
                              ...storeSettingsForm,
                              heroBannerUrl: '/src/assets/images/khojau_hero_nepal_1791032655932.jpg'
                            });
                            showToast('Reverted to official Khojau campaign photo. Click Save to apply.');
                          }}
                          className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold rounded-lg text-xs transition-colors"
                        >
                          Reset to Official Campaign Hero
                        </button>
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Hero Image URL / File Path</label>
                        <input
                          type="text"
                          value={storeSettingsForm.heroBannerUrl || ''}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, heroBannerUrl: e.target.value })}
                          placeholder="Image path or external URL"
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-[11px]"
                        />
                      </div>

                      <p className="text-[11px] text-zinc-500">
                        The hero banner image is stored in the central backend database and syncs instantly to all customers across desktop, tablet, and mobile devices.
                      </p>
                    </div>
                  </div>

                  {/* 3. Founder Section */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs shadow-2xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-red-600" />
                      <span>Founder Profile</span>
                    </h3>

                    {/* Founder Photo Upload & Preview */}
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1.5">Founder Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-300 shrink-0">
                          {storeSettingsForm.founder?.photoUrl ? (
                            <img
                              src={storeSettingsForm.founder.photoUrl}
                              alt="Founder preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingFounderPhoto ? 'Uploading...' : 'Upload New Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingFounderPhoto}
                              onChange={handleFounderPhotoUpload}
                              className="hidden"
                            />
                          </label>

                          {storeSettingsForm.founder?.photoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setStoreSettingsForm({
                                  ...storeSettingsForm,
                                  founder: { ...storeSettingsForm.founder, photoUrl: '' }
                                });
                                showToast('Photo removed. Click Save below to apply.');
                              }}
                              className="block text-[11px] text-rose-600 hover:underline"
                            >
                              Remove Photo
                            </button>
                          )}
                          <p className="text-[10px] text-zinc-400">Supports JPG, PNG, WEBP files.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Founder Name *</label>
                        <input
                          type="text"
                          required
                          value={storeSettingsForm.founder?.name || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            founder: { ...storeSettingsForm.founder, name: e.target.value }
                          })}
                          placeholder="e.g. Shishir"
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Founder Role / Title *</label>
                        <input
                          type="text"
                          required
                          value={storeSettingsForm.founder?.role || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            founder: { ...storeSettingsForm.founder, role: e.target.value }
                          })}
                          placeholder="e.g. Founder & Owner of Khojau"
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Founder Introduction / Bio *</label>
                      <textarea
                        rows={4}
                        required
                        value={storeSettingsForm.founder?.bio || ''}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          founder: { ...storeSettingsForm.founder, bio: e.target.value }
                        })}
                        placeholder="Write a natural, human story about why you started Khojau..."
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* About Khojau Section */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span className="text-red-600 font-heading text-sm">खोजौँ</span>
                      <span>About Khojau Brand Story</span>
                    </h3>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Khojau About Text *</label>
                      <textarea
                        rows={3}
                        required
                        value={storeSettingsForm.aboutBrand?.aboutKhojau || ''}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          aboutBrand: { ...storeSettingsForm.aboutBrand, aboutKhojau: e.target.value }
                        })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Brand Description & Origin</label>
                      <textarea
                        rows={2}
                        value={storeSettingsForm.aboutBrand?.brandDescription || ''}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          aboutBrand: { ...storeSettingsForm.aboutBrand, brandDescription: e.target.value }
                        })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSettings ? 'Saving...' : 'Save Brand & Founder Info'}</span>
                  </button>
                </form>
              )}

              {/* ================================================================= */}
              {/* TAB: WEBSITE TEXTS (ALL COPY ACROSS WEBSITE)                      */}
              {/* ================================================================= */}
              {activeTab === 'texts' && storeSettingsForm && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-950 font-heading flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-600" />
                        <span>All Website Texts &amp; Copy Editor</span>
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Edit any heading, badge, button label, Nepali text, footer line, or checkout message used across the entire Khojau website.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingSettings ? 'Saving Texts...' : 'Save All Website Texts'}</span>
                    </button>
                  </div>

                  {/* SECTION 1: TOP BAR, HEADER & ANNOUNCEMENT BAR */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-100 pb-2">
                      1. Top Header, Brand Name &amp; Navigation Texts
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Store Brand Name (English)</label>
                        <input
                          type="text"
                          value={storeSettingsForm.storeName || ''}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, storeName: e.target.value })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Red Nepali Brand Text (खोजौँ)</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.topNepaliBrandText ?? 'खोजौँ'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), topNepaliBrandText: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-red-600"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Top Bar Tagline</label>
                        <input
                          type="text"
                          value={storeSettingsForm.tagline || ''}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, tagline: e.target.value })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Active Business Location Badge</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.topLocationText ?? 'Butwal, Nepal'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), topLocationText: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Top-Right Nepali Delivery Badge</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.topRightBadgeText ?? 'नेपालभर डेलिभरी'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), topRightBadgeText: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Search Box Placeholder Text</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.searchPlaceholder ?? 'Search products in Khojau...'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), searchPlaceholder: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Header AI Button Label</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.askAiButtonText ?? 'Ask Saathi'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), askAiButtonText: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Red Announcement Bar Text</label>
                        <input
                          type="text"
                          value={storeSettingsForm.announcementText || ''}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, announcementText: e.target.value })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: HOMEPAGE HERO BANNER & TRUST HIGHLIGHTS */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-100 pb-2">
                      2. Homepage Hero Section &amp; Trust Highlights
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-zinc-700 mb-1">Hero Top Pill Badge Text (e.g., Authentic Nepali Store)</label>
                        <input
                          type="text"
                          value={storeSettingsForm.heroBadgeText || ''}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, heroBadgeText: e.target.value })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-zinc-700 mb-1">Hero Main Heading (Genuine Products &amp; Nepali Craftsmanship...)</label>
                        <textarea
                          rows={2}
                          value={storeSettingsForm.heroTitle || ''}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, heroTitle: e.target.value })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-zinc-700 mb-1">Hero Subtitle / Description Paragraph</label>
                        <textarea
                          rows={2}
                          value={storeSettingsForm.heroSubtitle || ''}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, heroSubtitle: e.target.value })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Hero Primary Button Text</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.heroPrimaryButtonText ?? 'Browse Catalog'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), heroPrimaryButtonText: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Hero Secondary AI Button Text</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.heroSecondaryButtonText ?? 'Ask Khojau Saathi'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), heroSecondaryButtonText: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      {/* 3 Trust Highlights */}
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Trust Badge 1 Title</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.heroTrust1Title ?? 'Fast Shipping'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), heroTrust1Title: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Trust Badge 1 Subtitle</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.heroTrust1Sub ?? 'From Butwal, Nepal'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), heroTrust1Sub: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Trust Badge 2 Title</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.heroTrust2Title ?? 'QR Payment'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), heroTrust2Title: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Trust Badge 2 Subtitle</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.heroTrust2Sub ?? 'eSewa · Khalti · Banking'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), heroTrust2Sub: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Trust Badge 3 Title</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.heroTrust3Title ?? '7-Day Return'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), heroTrust3Title: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Trust Badge 3 Subtitle</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.heroTrust3Sub ?? 'Easy replacement'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), heroTrust3Sub: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: CATALOG EMPTY STATE */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-100 pb-2">
                      3. Catalog Empty Message
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Empty Catalog Heading</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.catalogEmptyTitle ?? 'New Products Coming Soon'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), catalogEmptyTitle: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Empty Catalog Subtitle</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.catalogEmptySubtitle ?? ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), catalogEmptySubtitle: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: FOOTER & CONTACT TEXTS */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-100 pb-2">
                      4. Footer Value Strip, Brand Summary &amp; Contact Texts
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Footer Value 1 Title</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.footerValue1Title ?? 'Fast Nationwide Delivery'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), footerValue1Title: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Footer Value 1 Subtitle</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.footerValue1Sub ?? 'Dispatched from Butwal, Nepal to all 7 provinces'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), footerValue1Sub: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Footer Value 2 Title</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.footerValue2Title ?? '100% Genuine Guarantee'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), footerValue2Title: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Footer Value 2 Subtitle</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.footerValue2Sub ?? 'Inspected at our Butwal, Nepal hub before shipping'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), footerValue2Sub: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Footer Value 3 Title</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.footerValue3Title ?? '7-Day Easy Returns'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), footerValue3Title: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Footer Value 3 Subtitle</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.footerValue3Sub ?? 'Hassle-free replacement or refund'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), footerValue3Sub: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-zinc-700 mb-1">Footer Brand Description Paragraph</label>
                        <textarea
                          rows={2}
                          value={storeSettingsForm.websiteTexts?.footerBrandSummary ?? ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), footerBrandSummary: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Footer Dispatch Note</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.footerDispatchNote ?? ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), footerDispatchNote: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Footer Copyright Text</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.footerCopyrightText ?? 'Butwal, Nepal. All rights reserved.'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), footerCopyrightText: e.target.value }
                          })}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5: CHECKOUT, QR PAYMENT & NAMASTE CONFIRMATION TEXTS */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-100 pb-2">
                      5. Checkout, QR Payment &amp; Namaste Confirmation Texts (Nepali &amp; English)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">QR Scan Instruction Line 1</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.checkoutQrInstruction1 ?? 'तलको QR स्क्यान गरेर भुक्तानी गर्नुहोस्।'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), checkoutQrInstruction1: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">QR Scan Instruction Line 2</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.checkoutQrInstruction2 ?? 'भुक्तानी गरेपछि Transaction ID राख्नुहोस्।'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), checkoutQrInstruction2: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">"I Have Paid" Button Text</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.checkoutPaidButtonText ?? 'मैले भुक्तानी गरेँ (I Have Paid)'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), checkoutPaidButtonText: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Namaste Animation Main Greeting (धन्यवाद! 🙏)</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.namasteSuccessTitle ?? 'धन्यवाद! 🙏'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), namasteSuccessTitle: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Namaste Animation Subtitle</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.namasteSuccessSubtitle ?? 'तपाईंको भुक्तानी विवरण प्राप्त भयो।'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), namasteSuccessSubtitle: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Namaste Animation Message</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.namasteSuccessMessage ?? 'तपाईंको अर्डर पुष्टि भएपछि हामी तपाईंलाई जानकारी दिनेछौँ।'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), namasteSuccessMessage: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Order Confirmation Heading</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.orderConfirmHeading ?? 'तपाईंको अर्डरका लागि धन्यवाद। 🙏'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), orderConfirmHeading: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Order Confirmation Bottom Dispatch Note</label>
                        <input
                          type="text"
                          value={storeSettingsForm.websiteTexts?.orderConfirmNote ?? 'हाम्रो बुटवल टिमले तपाईंको भुक्तानी रुजु गरेपछि सामान प्याक गरी डेलिभरीका लागि पठाउनेछ।'}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            websiteTexts: { ...(storeSettingsForm.websiteTexts as WebsiteTexts), orderConfirmNote: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 6: ABOUT KHOJAU, FOUNDER & POLICY TEXTS */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-100 pb-2">
                      6. About Khojau, Founder Bio &amp; Store Policy Texts
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">About Khojau Main Story</label>
                        <textarea
                          rows={2}
                          value={storeSettingsForm.aboutBrand?.aboutKhojau || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            aboutBrand: { ...storeSettingsForm.aboutBrand, aboutKhojau: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Brand Description &amp; Butwal Origin</label>
                        <textarea
                          rows={2}
                          value={storeSettingsForm.aboutBrand?.brandDescription || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            aboutBrand: { ...storeSettingsForm.aboutBrand, brandDescription: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Founder Biography ({storeSettingsForm.founder?.name || 'Shishir Pokhrel'})</label>
                        <textarea
                          rows={3}
                          value={storeSettingsForm.founder?.bio || ''}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            founder: { ...storeSettingsForm.founder, bio: e.target.value }
                          })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-zinc-700 mb-1">Delivery Information Policy Text</label>
                          <textarea
                            rows={2}
                            value={storeSettingsForm.deliveryInfoText || ''}
                            onChange={e => setStoreSettingsForm({ ...storeSettingsForm, deliveryInfoText: e.target.value })}
                            className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-zinc-700 mb-1">Return &amp; Replacement Policy Text</label>
                          <textarea
                            rows={2}
                            value={storeSettingsForm.returnPolicyText || ''}
                            onChange={e => setStoreSettingsForm({ ...storeSettingsForm, returnPolicyText: e.target.value })}
                            className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingSettings ? 'Saving All Website Texts...' : 'Save All Website Texts Live'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 5: REVIEWS MODERATION */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 font-heading">Customer Reviews Moderation</h2>
                    <p className="text-xs text-zinc-500">Approve authentic customer reviews or remove inappropriate content.</p>
                  </div>

                  <div className="space-y-3">
                    {adminReviews.map(rev => {
                      const prod = adminProducts.find(p => p.id === rev.productId);
                      return (
                        <div key={rev.id} className="p-4 bg-white border border-zinc-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-zinc-900">{rev.userName}</span>
                              <span className="text-zinc-400 ml-1.5">({rev.userCity})</span>
                              {rev.isSample && <span className="text-zinc-400 ml-2">· Sample Review</span>}
                            </div>
                            <span className="font-bold text-amber-600">{'★'.repeat(rev.rating)} ({rev.rating}/5)</span>
                          </div>

                          <p className="text-zinc-700 italic">"{rev.comment}"</p>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-zinc-500">
                            <span>Product: <strong className="text-zinc-800">{prod?.name || rev.productId}</strong></span>
                            <div className="flex items-center gap-2">
                              {rev.status === 'approved' ? (
                                <button
                                  onClick={() => handleUpdateReviewStatus(rev.id, 'rejected')}
                                  className="text-amber-700 hover:underline font-semibold"
                                >
                                  Hide / Unapprove
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateReviewStatus(rev.id, 'approved')}
                                  className="text-emerald-700 hover:underline font-semibold"
                                >
                                  Approve
                                </button>
                              )}
                              <span>·</span>
                              <button
                                onClick={() => handleDeleteReview(rev.id)}
                                className="text-rose-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: STORE & LOGISTICS SETTINGS */}
              {activeTab === 'settings' && storeSettingsForm && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 font-heading">Store Information & Logistics</h2>
                    <p className="text-xs text-zinc-500">Configure delivery rules, fees, and contact details.</p>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Contact & Fulfillment</h3>
                    
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Store Name</label>
                      <input
                        type="text"
                        value={storeSettingsForm.storeName}
                        onChange={e => setStoreSettingsForm({ ...storeSettingsForm, storeName: e.target.value })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Support Phone</label>
                        <input
                          type="text"
                          value={storeSettingsForm.contactPhone}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, contactPhone: e.target.value })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Support Email</label>
                        <input
                          type="email"
                          value={storeSettingsForm.contactEmail}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, contactEmail: e.target.value })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Store / Hub Address</label>
                      <input
                        type="text"
                        value={storeSettingsForm.storeAddress}
                        onChange={e => setStoreSettingsForm({ ...storeSettingsForm, storeAddress: e.target.value })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Announcement Banner */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Top Announcement Bar</h3>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storeSettingsForm.announcementActive}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, announcementActive: e.target.checked })}
                          className="text-red-600 rounded"
                        />
                        <span className="font-semibold text-zinc-700">Display Banner</span>
                      </label>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Announcement Message</label>
                      <input
                        type="text"
                        value={storeSettingsForm.announcementText}
                        onChange={e => setStoreSettingsForm({ ...storeSettingsForm, announcementText: e.target.value })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Promotional & Hero Banner Upload (Requirement 8) */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-red-600" />
                      <span>Promotional Banner & Store Hero Visuals</span>
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="relative w-full sm:w-48 aspect-16/10 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-300 shrink-0">
                        {storeSettingsForm.heroBannerUrl ? (
                          <img
                            src={storeSettingsForm.heroBannerUrl}
                            alt="Hero banner preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingBanner ? 'Uploading Banner...' : 'Upload Promotional Banner Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingBanner}
                            onChange={handleBannerUpload}
                            className="hidden"
                          />
                        </label>

                        <div>
                          <label className="block font-semibold text-zinc-700 mb-1">Banner Image URL / File Path</label>
                          <input
                            type="text"
                            value={storeSettingsForm.heroBannerUrl || ''}
                            onChange={e => setStoreSettingsForm({
                              ...storeSettingsForm,
                              heroBannerUrl: e.target.value,
                              promoBannerUrl: e.target.value
                            })}
                            placeholder="Enter image URL or upload above"
                            className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          Appears on the customer homepage hero showcase. Instant live update upon saving.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Charges */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Delivery & Logistics Rules</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Butwal &amp; Rupandehi Fee (Rs.)</label>
                        <input
                          type="number"
                          value={storeSettingsForm.deliveryKathmanduFee}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, deliveryKathmanduFee: Number(e.target.value) })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Outside Butwal Nationwide Fee (Rs.)</label>
                        <input
                          type="number"
                          value={storeSettingsForm.deliveryOutsideFee}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, deliveryOutsideFee: Number(e.target.value) })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">Free Delivery Min Total (Rs.)</label>
                        <input
                          type="number"
                          value={storeSettingsForm.freeDeliveryThreshold}
                          onChange={e => setStoreSettingsForm({ ...storeSettingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                          className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSettings ? 'Saving...' : 'Save Settings Live'}</span>
                  </button>
                </form>
              )}

              {/* TAB 7: AI ASSISTANT SETTINGS */}
              {activeTab === 'ai' && storeSettingsForm && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 font-heading">AI Shopping Assistant Configuration</h2>
                    <p className="text-xs text-zinc-500">
                      Customize Khojau's AI Persona, behavior, store knowledge, and response guidelines.
                    </p>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                      <div>
                        <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Assistant Status</h3>
                        <p className="text-[11px] text-zinc-500">Enable or disable the AI shopping guide across the storefront</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className={`text-xs font-bold ${storeSettingsForm.aiSettings.enabled !== false ? 'text-emerald-700' : 'text-zinc-400'}`}>
                          {storeSettingsForm.aiSettings.enabled !== false ? 'ENABLED (LIVE)' : 'DISABLED (OFF)'}
                        </span>
                        <input
                          type="checkbox"
                          checked={storeSettingsForm.aiSettings.enabled !== false}
                          onChange={e => setStoreSettingsForm({
                            ...storeSettingsForm,
                            aiSettings: { ...storeSettingsForm.aiSettings, enabled: e.target.checked }
                          })}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">AI Assistant Name</label>
                      <input
                        type="text"
                        value={storeSettingsForm.aiSettings.assistantName}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          aiSettings: { ...storeSettingsForm.aiSettings, assistantName: e.target.value }
                        })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Welcome Greeting Message</label>
                      <input
                        type="text"
                        value={storeSettingsForm.aiSettings.welcomeMessage}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          aiSettings: { ...storeSettingsForm.aiSettings, welcomeMessage: e.target.value }
                        })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Tone & Persona</label>
                      <input
                        type="text"
                        value={storeSettingsForm.aiSettings.tone}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          aiSettings: { ...storeSettingsForm.aiSettings, tone: e.target.value }
                        })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Store Biography (AI Knowledge Base)</label>
                      <textarea
                        rows={3}
                        value={storeSettingsForm.aiSettings.storeBio}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          aiSettings: { ...storeSettingsForm.aiSettings, storeBio: e.target.value }
                        })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Custom Prompt Instructions</label>
                      <textarea
                        rows={3}
                        value={storeSettingsForm.aiSettings.customInstructions}
                        onChange={e => setStoreSettingsForm({
                          ...storeSettingsForm,
                          aiSettings: { ...storeSettingsForm.aiSettings, customInstructions: e.target.value }
                        })}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSettings ? 'Saving...' : 'Save AI Configuration'}</span>
                  </button>
                </form>
              )}

              {/* TAB 8: ADMIN SECURITY / PASSWORD (NEW - Secure Self-Management) */}
              {activeTab === 'security' && (
                <form onSubmit={handleUpdateCredentials} className="space-y-6 max-w-md">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 font-heading">
                      Admin Account & Password Security
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Set your own custom email/username and secure password.
                    </p>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">New Admin Email / Username</label>
                      <input
                        type="text"
                        value={newAdminEmail}
                        onChange={e => setNewAdminEmail(e.target.value)}
                        placeholder="Leave blank to keep current email"
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">New Password (Min 6 chars)</label>
                      <input
                        type="password"
                        value={newAdminPassword}
                        onChange={e => setNewAdminPassword(e.target.value)}
                        placeholder="Enter new strong password"
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmAdminPassword}
                        onChange={e => setConfirmAdminPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingCredentials || (!newAdminEmail && !newAdminPassword)}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isUpdatingCredentials ? 'Updating...' : 'Update Admin Credentials'}</span>
                  </button>
                </form>
              )}

            </main>
          </div>
        )}

        {/* Product Create / Edit Modal (With Discount System & Photo Upload) */}
        {isProductModalOpen && (
          <div className="fixed inset-0 z-60 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-900 font-heading">
                  {editingProductId ? 'Edit Product' : 'Add New Product to Store'}
                </h3>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
                
                {/* 1. Basic Info */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name || ''}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Pure Himalayan Cashmere Pashmina Shawl"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Category</label>
                    <select
                      value={productForm.category || 'General'}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Handicrafts & Art">Handicrafts & Art</option>
                      <option value="Organic & Food">Organic & Food</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      value={productForm.stock ?? 0}
                      onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg tabular-nums"
                    />
                  </div>
                </div>

                {/* 2. DISCOUNT PRICING SYSTEM (Detailed Requirement 3) */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-red-600" />
                      <span>Pricing & Discount System</span>
                    </span>

                    {/* Discount ON/OFF Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] font-semibold text-zinc-600">
                        Discount Status: <strong className={productForm.isDiscountActive ? "text-emerald-700" : "text-zinc-500"}>
                          {productForm.isDiscountActive ? "ACTIVE (ON)" : "OFF"}
                        </strong>
                      </span>
                      <input
                        type="checkbox"
                        checked={productForm.isDiscountActive || false}
                        onChange={e => {
                          const isActive = e.target.checked;
                          setProductForm(prev => ({
                            ...prev,
                            isDiscountActive: isActive,
                            discountPrice: isActive ? (prev.discountPrice || Math.round((prev.price || 1000) * 0.8)) : null,
                            discountPercentage: isActive ? (prev.discountPercentage || 20) : 0
                          }));
                        }}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Original Price (Rs.) *</label>
                      <input
                        type="number"
                        required
                        value={productForm.price || ''}
                        onChange={e => {
                          const newPrice = Number(e.target.value);
                          setProductForm(prev => {
                            const disc = prev.discountPrice;
                            const newPercent = (prev.isDiscountActive && disc && disc < newPrice)
                              ? Math.round(((newPrice - disc) / newPrice) * 100)
                              : prev.discountPercentage;
                            return { ...prev, price: newPrice, discountPercentage: newPercent };
                          });
                        }}
                        className="w-full p-2 bg-white border border-zinc-200 rounded-lg tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Discounted Price (Rs.)
                      </label>
                      <input
                        type="number"
                        disabled={!productForm.isDiscountActive}
                        value={productForm.isDiscountActive ? (productForm.discountPrice || '') : ''}
                        onChange={e => {
                          const disc = e.target.value ? Number(e.target.value) : null;
                          setProductForm(prev => {
                            const price = prev.price || 0;
                            const newPercent = (disc && price > disc)
                              ? Math.round(((price - disc) / price) * 100)
                              : 0;
                            return { ...prev, discountPrice: disc, discountPercentage: newPercent };
                          });
                        }}
                        placeholder={productForm.isDiscountActive ? "e.g. 1499" : "Turn discount ON"}
                        className="w-full p-2 bg-white border border-zinc-200 rounded-lg tabular-nums disabled:bg-zinc-100 disabled:text-zinc-400"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Discount % (Auto-calc)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          disabled={!productForm.isDiscountActive}
                          value={productForm.isDiscountActive ? (productForm.discountPercentage || 0) : 0}
                          onChange={e => {
                            const pct = Number(e.target.value);
                            setProductForm(prev => {
                              const price = prev.price || 0;
                              const disc = pct > 0 && price > 0 ? Math.round(price * (1 - pct / 100)) : null;
                              return { ...prev, discountPercentage: pct, discountPrice: disc };
                            });
                          }}
                          className="w-full p-2 bg-white border border-zinc-200 rounded-lg tabular-nums disabled:bg-zinc-100 disabled:text-zinc-400"
                        />
                        <span className="absolute right-3 top-2 text-zinc-400 font-bold">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual preview of how customer sees it */}
                  <div className="text-[11px] text-zinc-600 pt-1 flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">Customer Preview:</span>
                    {productForm.isDiscountActive && productForm.discountPrice && productForm.price ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="line-through text-zinc-400">Rs. {Number(productForm.price).toLocaleString()}</span>
                        <strong className="text-zinc-950 font-bold">Rs. {Number(productForm.discountPrice).toLocaleString()}</strong>
                        <span className="text-red-600 font-bold">({productForm.discountPercentage || Math.round(((productForm.price - productForm.discountPrice) / productForm.price) * 100)}% OFF)</span>
                      </span>
                    ) : (
                      <span className="font-bold text-zinc-900">
                        Rs. {(productForm.price || 0).toLocaleString()} (Normal Price, No Discount)
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Product Images (With Image Upload Button & Preview) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-zinc-700">Product Images</label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md cursor-pointer text-xs font-semibold transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingProductImage ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingProductImage}
                        onChange={handleProductImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <textarea
                    rows={2}
                    value={imagesInput}
                    onChange={e => setImagesInput(e.target.value)}
                    placeholder="Enter URLs or upload files above (one path per line)..."
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-[11px]"
                  />

                  {/* Image Thumbnails Preview */}
                  {imagesInput.trim() && (
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {imagesInput.split('\n').filter(Boolean).map((imgUrl, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 shrink-0 group">
                          <img
                            src={imgUrl.trim()}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = imagesInput.split('\n').filter(Boolean).filter((_, idx) => idx !== i).join('\n');
                              setImagesInput(remaining);
                            }}
                            className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Description & Badges */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description || ''}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured || false}
                      onChange={e => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                      className="text-red-600 rounded"
                    />
                    <span>Featured in Home</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isNew || false}
                      onChange={e => setProductForm({ ...productForm, isNew: e.target.checked })}
                      className="text-red-600 rounded"
                    />
                    <span>New Arrival</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isPopular || false}
                      onChange={e => setProductForm({ ...productForm, isPopular: e.target.checked })}
                      className="text-red-600 rounded"
                    />
                    <span>Popular Pick</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-zinc-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Save Product Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enlarged Payment Screenshot Lightbox Modal */}
        {enlargedScreenshotUrl && (
          <div
            className="fixed inset-0 z-70 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setEnlargedScreenshotUrl(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 p-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-100 px-1">
                <span className="text-xs font-bold text-zinc-900">Customer Payment Screenshot Proof</span>
                <button
                  type="button"
                  onClick={() => setEnlargedScreenshotUrl(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-zinc-900 rounded-xl p-2">
                <img
                  src={enlargedScreenshotUrl}
                  alt="Customer Payment Proof"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
