import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { CustomerAuthModal } from './components/CustomerAuthModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AiShoppingAssistant } from './components/AiShoppingAssistant.tsx';
import { Footer } from './components/Footer.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import { DashainOfferModal } from './components/DashainOfferModal.tsx';
import {
  Sparkles,
  SlidersHorizontal,
  CheckCircle,
  Search
} from 'lucide-react';

const StoreContent: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isLoadingProducts,
    toastMessage,
    openAiWithPrompt,
    settings,
    isAdminDashboardOpen,
    setIsAdminDashboardOpen
  } = useStore();

  React.useEffect(() => {
    const checkAdminRoute = () => {
      if (window.location.hash === '#admin' || window.location.search.includes('admin=true') || window.location.pathname === '/admin') {
        setIsAdminDashboardOpen(true);
      }
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsAdminDashboardOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setIsAdminDashboardOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#18181B] w-full overflow-x-hidden">
      
      {/* Toast Notification Container (Website Storefront Only) */}
      {toastMessage && !isAdminDashboardOpen && (
        <div className="fixed top-20 right-3 sm:right-6 z-50 max-w-[calc(100vw-1.5rem)] bg-zinc-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xl border border-zinc-700/60 flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar />

      {/* Hero Banner */}
      {!searchQuery && selectedCategory === 'All' && <HeroBanner />}

      {/* Main Catalog Content */}
      <main id="catalog-section" className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-8 sm:space-y-10">
        
        {/* Filter & Sorting Control Strip */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Active Search & Category indicator */}
          <div className="flex items-center gap-2 text-xs flex-wrap min-w-0">
            <span className="font-bold text-zinc-900">
              {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory === 'All' ? 'All Products' : selectedCategory}
            </span>
            <span className="text-zinc-400 font-normal">
              ({products.length} {products.length === 1 ? 'item' : 'items'} available)
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-red-600 hover:underline font-semibold ml-1 cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 w-full sm:w-auto justify-between sm:justify-end">
              <span className="inline-flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-red-600"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">New Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5 py-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square sm:aspect-4/3 bg-zinc-200"></div>
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-3 bg-zinc-200 rounded w-1/3"></div>
                  <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                  <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty Search or Catalog State */
          <div className="text-center py-12 sm:py-16 bg-white border border-dashed border-zinc-300 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Search className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 font-heading">
              {searchQuery || selectedCategory !== 'All'
                ? 'No matching products found'
                : (settings?.websiteTexts?.catalogEmptyTitle || 'New Products Coming Soon')}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== 'All'
                ? "We couldn't find items matching your filter. Try resetting filters or ask our Butwal AI shopping guide."
                : (settings?.websiteTexts?.catalogEmptySubtitle || 'Our Butwal, Nepal store catalog is ready for new products. Add products anytime from the Admin Dashboard.')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {(searchQuery || selectedCategory !== 'All') && (
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
              <button
                onClick={() => openAiWithPrompt('Where is Khojau located and how does ordering work?')}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                <span>{settings?.websiteTexts?.heroSecondaryButtonText || 'Ask Khojau Saathi'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Responsive Product Grid: Clean 2 columns on mobile (320px+), 3 on tablet (md), 4 on desktop (lg) */
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* Global Interactive Modals & Drawers */}
      <DashainOfferModal />
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <CustomerAuthModal />
      <AdminDashboard />
      <AiShoppingAssistant />
      <AboutModal />

    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <StoreContent />
    </StoreProvider>
  );
}
