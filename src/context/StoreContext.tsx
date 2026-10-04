import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Product, CartItem, StoreSettings, UserAccount, Order } from '../types/index.ts';
import * as api from '../services/api.ts';
import { getLocalStoreDB } from '../services/fallbackStore.ts';
import { subscribeToCloudStore } from '../services/firebaseClient.ts';

interface StoreContextType {
  // Store info
  settings: StoreSettings | null;
  categories: string[];
  refreshSettings: () => Promise<void>;

  // Products
  products: Product[];
  featuredProducts: Product[];
  newProducts: Product[];
  popularProducts: Product[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  isLoadingProducts: boolean;
  refreshProducts: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartItemCount: number;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Active product detail
  selectedProduct: Product | null;
  openProductDetail: (product: Product) => void;
  closeProductDetail: () => void;

  // Modals & Navigation
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register' | 'profile';
  setAuthMode: (mode: 'login' | 'register' | 'profile') => void;
  isAdminDashboardOpen: boolean;
  setIsAdminDashboardOpen: (open: boolean) => void;
  isAboutOpen: boolean;
  setIsAboutOpen: (open: boolean) => void;

  // AI Assistant
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  aiInitialPrompt: string | null;
  openAiWithPrompt: (prompt: string, product?: Product) => void;

  // Auth (Customer & Admin)
  currentUser: UserAccount | null;
  customerToken: string | null;
  adminToken: string | null;
  isAdmin: boolean;
  loginCustomer: (email: string, pass: string) => Promise<void>;
  registerCustomer: (data: any) => Promise<void>;
  logoutCustomer: () => void;
  loginAdmin: (email: string, pass: string) => Promise<void>;
  logoutAdmin: () => void;

  // Feedback Notification
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialDb = React.useMemo(() => getLocalStoreDB(), []);

  const [settings, setSettings] = useState<StoreSettings | null>(() => initialDb.settings);
  const [categories, setCategories] = useState<string[]>(() => {
    const prodCats = initialDb.products.map(p => p.category).filter(Boolean);
    return Array.from(new Set(['All', 'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty & Personal Care', 'Handicrafts & Art', 'Groceries & Tea', 'Accessories', ...prodCats]));
  });
  const [products, setProducts] = useState<Product[]>(() =>
    initialDb.products.filter(p => p.isVisible !== false)
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popular');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'profile'>('login');
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // AI Assistant
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Cart in LocalStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('khojau_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('khojau_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Wishlist in LocalStorage
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('khojau_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('khojau_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  // Auth tokens
  const [customerToken, setCustomerToken] = useState<string | null>(() => localStorage.getItem('khojau_cust_token'));
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('khojau_admin_token'));
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Verify Admin Session on startup
  useEffect(() => {
    if (adminToken) {
      api.verifyAdminSession(adminToken)
        .then(() => setIsAdmin(true))
        .catch(() => {
          localStorage.removeItem('khojau_admin_token');
          setAdminToken(null);
          setIsAdmin(false);
        });
    } else {
      setIsAdmin(false);
    }
  }, [adminToken]);

  // Load Settings
  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.fetchStoreSettings();
      setSettings(data.settings);
      setCategories(['All', ...data.categories]);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  }, []);

  // Load Products (Silent background update without blocking UI)
  const refreshProducts = useCallback(async () => {
    try {
      const data = await api.fetchProducts({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        sort: sortBy
      });
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Dynamically update document Title, Favicon, and Meta Description when settings change
  useEffect(() => {
    if (!settings) return;
    const brandName = settings.storeName || 'Khojau';
    const nepaliName = settings.websiteTexts?.topNepaliBrandText || 'खोजौँ';
    const tagline = settings.tagline || 'Authentic Online Shopping Store in Butwal, Nepal';
    document.title = `${brandName} (${nepaliName}) – ${tagline}`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && settings.aboutBrand?.aboutKhojau) {
      metaDesc.setAttribute('content', settings.aboutBrand.aboutKhojau);
    }

    const favUrl = settings.faviconUrl || settings.logoUrl || './src/assets/images/khojau_logo.svg';
    let linkEl = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'icon';
      document.head.appendChild(linkEl);
    }
    linkEl.href = favUrl;
  }, [settings]);

  // Synchronize Cart items and active selectedProduct whenever product prices/details update from Admin Panel
  useEffect(() => {
    if (!products || products.length === 0) return;
    setCart(prevCart => {
      let changed = false;
      const updated = prevCart.map(item => {
        const freshProd = products.find(p => p.id === item.productId);
        if (
          freshProd &&
          (freshProd.price !== item.product.price ||
            freshProd.discountPrice !== item.product.discountPrice ||
            freshProd.name !== item.product.name ||
            freshProd.images?.[0] !== item.product.images?.[0])
        ) {
          changed = true;
          return { ...item, product: freshProd };
        }
        return item;
      });
      return changed ? updated : prevCart;
    });

    setSelectedProduct(prev => {
      if (!prev) return null;
      const fresh = products.find(p => p.id === prev.id);
      return fresh || prev;
    });
  }, [products]);

  // Real-time Multi-Device & Multi-Tab Synchronization via Central Cloud Firestore + SSE
  useEffect(() => {
    let lastSeenVersion = 0;
    let eventSource: EventSource | null = null;
    const isStaticHost =
      window.location.hostname.includes('github.io') ||
      window.location.protocol === 'file:';

    const triggerLiveSync = () => {
      refreshSettings();
      refreshProducts();
    };

    // 1. Subscribe to central Firebase Firestore real-time updates (works across ALL devices, browsers, and GitHub Pages!)
    const unsubscribeCloud = subscribeToCloudStore((cloudDb) => {
      setSettings(cloudDb.settings);
      setCategories(['All', ...api.computeCategories(cloudDb.products, cloudDb.settings)]);
      refreshProducts();
    });

    if (!isStaticHost) {
      // 2. Connect to Server-Sent Events (/api/events) for instant push on Express server
      try {
        eventSource = new EventSource('/api/events');
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'CONNECTED' && data.version) {
              lastSeenVersion = data.version;
            } else if (data.type === 'STORE_UPDATED') {
              if (data.version && data.version !== lastSeenVersion) {
                lastSeenVersion = data.version;
                triggerLiveSync();
              }
            }
          } catch {}
        };
      } catch {}
    }

    // 3. Cross-tab storage listener & window focus sync
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'khojau_static_store_db_v3' ||
        e.key === 'khojau_static_store_db_v2' ||
        e.key === 'khojau_static_store_db_v1'
      ) {
        triggerLiveSync();
      }
    };
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        triggerLiveSync();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      unsubscribeCloud();
      if (eventSource) eventSource.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [refreshSettings, refreshProducts]);

  // Verify Customer Session
  useEffect(() => {
    if (customerToken) {
      api.verifySession(customerToken)
        .then(res => setCurrentUser(res.user))
        .catch(() => {
          localStorage.removeItem('khojau_cust_token');
          setCustomerToken(null);
          setCurrentUser(null);
        });
    }
  }, [customerToken]);

  // Cart Operations
  const addToCart = (product: Product, quantity = 1, size?: string, color?: string) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item =>
        item.productId === product.id &&
        item.selectedSize === size &&
        item.selectedColor === color
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [...prev, {
        productId: product.id,
        product,
        quantity,
        selectedSize: size,
        selectedColor: color
      }];
    });
    showToast(`Added "${product.name}" to cart`);
  };

  const updateCartQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.productId === productId && item.selectedSize === size && item.selectedColor === color) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, size?: string, color?: string) => {
    setCart(prev =>
      prev.filter(item => !(item.productId === productId && item.selectedSize === size && item.selectedColor === color))
    );
    showToast('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((sum, item) => {
    const itemPrice = (item.product.isDiscountActive !== false && item.product.discountPrice)
      ? item.product.discountPrice
      : item.product.price;
    return sum + (itemPrice * item.quantity);
  }, 0);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Removed from wishlist');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Added to wishlist');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // PDP Handlers
  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
  };

  // AI Assistant trigger with context
  const openAiWithPrompt = (prompt: string, product?: Product) => {
    setAiInitialPrompt(prompt);
    if (product) {
      setSelectedProduct(product);
    }
    setIsAiAssistantOpen(true);
  };

  // Customer Auth
  const loginCustomer = async (email: string, pass: string) => {
    const res = await api.customerLogin(email, pass);
    localStorage.setItem('khojau_cust_token', res.token);
    setCustomerToken(res.token);
    setCurrentUser(res.user);
    setIsAuthModalOpen(false);
    showToast(`Welcome back, ${res.user.name}!`);
  };

  const registerCustomer = async (data: any) => {
    const res = await api.customerRegister(data);
    localStorage.setItem('khojau_cust_token', res.token);
    setCustomerToken(res.token);
    setCurrentUser(res.user);
    setIsAuthModalOpen(false);
    showToast(`Account created successfully! Welcome to Khojau.`);
  };

  const logoutCustomer = () => {
    localStorage.removeItem('khojau_cust_token');
    setCustomerToken(null);
    setCurrentUser(null);
    showToast('Logged out of customer account.');
  };

  // Admin Auth
  const loginAdmin = async (identifier: string, pass: string) => {
    const res = await api.adminLogin(identifier, pass);
    localStorage.setItem('khojau_admin_token', res.token);
    setAdminToken(res.token);
    setIsAdmin(true);
    setIsAdminDashboardOpen(true);
  };

  const logoutAdmin = async () => {
    if (adminToken) {
      await api.adminLogout(adminToken);
    }
    localStorage.removeItem('khojau_admin_token');
    setAdminToken(null);
    setIsAdmin(false);
    setIsAdminDashboardOpen(false);
    showToast('Logged out of Admin Panel.');
  };

  const featuredProducts = products.filter(p => p.isFeatured);
  const newProducts = products.filter(p => p.isNew);
  const popularProducts = products.filter(p => p.isPopular);

  return (
    <StoreContext.Provider
      value={{
        settings,
        categories,
        refreshSettings,
        products,
        featuredProducts,
        newProducts,
        popularProducts,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        isLoadingProducts,
        refreshProducts,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartItemCount,
        wishlist,
        toggleWishlist,
        isInWishlist,
        selectedProduct,
        openProductDetail,
        closeProductDetail,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        isAdminDashboardOpen,
        setIsAdminDashboardOpen,
        isAboutOpen,
        setIsAboutOpen,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
        aiInitialPrompt,
        openAiWithPrompt,
        currentUser,
        customerToken,
        adminToken,
        isAdmin,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        loginAdmin,
        logoutAdmin,
        toastMessage,
        showToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
