import React, { useState } from 'react';
import { Search, ShoppingBag, User, X, Menu, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { NepalFlag } from './NepalFlag.tsx';

export const Navbar: React.FC = () => {
  const {
    settings,
    cartItemCount,
    setIsCartOpen,
    currentUser,
    setIsAuthModalOpen,
    setAuthMode,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    setIsAiAssistantOpen,
    setIsAboutOpen
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200">
      {/* 1. Subtle Authentic Nepal Flag-inspired Accent Theme */}
      <div className="h-1 w-full bg-gradient-to-r from-[#003893] via-[#DC2626] to-[#003893]" />

      {/* Top Brand Accent Ribbon with Red Nepali लियौँ Text & Butwal Location */}
      <div className="bg-zinc-950 text-white text-[11px] py-1 px-3 sm:px-6 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <span className="font-heading font-black text-red-500 text-xs sm:text-sm tracking-wider animate-softGlow inline-flex items-center shrink-0">
              {settings?.websiteTexts?.topNepaliBrandText || 'लियौँ'}
            </span>
            <span className="text-zinc-700 shrink-0">|</span>
            <span className="text-zinc-300 font-medium hidden sm:inline truncate">
              {settings?.tagline || "Nepal's Trusted Modern Online Store"}
            </span>
            <span className="text-zinc-600 hidden sm:inline shrink-0">·</span>
            <span className="text-zinc-300 font-medium truncate">
              {settings?.websiteTexts?.topLocationText || 'Butwal, Nepal'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 text-zinc-300">
              <NepalFlag className="w-3 h-4 shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-semibold">
                {settings?.websiteTexts?.topRightBadgeText || 'नेपालभर डेलिभरी'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Announcement Bar */}
      {settings?.announcementActive && settings.announcementText && (
        <div className="bg-red-600 text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-6 font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center justify-center gap-1.5 min-w-0 mx-auto lg:mx-0">
              <NepalFlag className="w-3 h-3.5 shrink-0" />
              <span className="truncate">{settings.announcementText}</span>
            </div>
            <button
              onClick={() => setIsAiAssistantOpen(true)}
              className="hidden lg:inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase transition-colors shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-red-200" />
              <span>{settings?.aiSettings?.assistantName || 'Liyau Thinker'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
          
          {/* Zone 1: Mobile Hamburger + Liyau Brand Logo + Red Nepali Text */}
          <div className="flex items-center gap-1 sm:gap-2.5 min-w-0 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-zinc-700 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 focus:outline-none cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory('All');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group min-w-0"
              aria-label={settings?.storeName || 'Liyau Nepal'}
            >
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName || 'Liyau (लियौँ)'}
                  className="h-8 sm:h-9 md:h-10 w-auto max-w-[140px] sm:max-w-[175px] md:max-w-[195px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-102"
                />
              ) : (
                <div className="flex items-baseline gap-1.5 text-lg sm:text-2xl font-bold tracking-tight text-zinc-950 font-heading shrink-0">
                  <span>{settings?.storeName || 'Liyau'}</span>
                  <span className="font-heading font-black text-red-600 text-base sm:text-xl tracking-tight select-none">
                    {settings?.websiteTexts?.topNepaliBrandText || 'लियौँ'}
                  </span>
                </div>
              )}
            </a>
          </div>

          {/* Zone 2: Desktop Search */}
          <div className="flex-1 max-w-xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={settings?.websiteTexts?.searchPlaceholder || 'Search products in Liyau...'}
                  className="w-full pl-9 pr-16 py-2 bg-zinc-100 hover:bg-zinc-100/80 focus:bg-white text-xs sm:text-sm text-zinc-900 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all placeholder:text-zinc-400"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-xs text-zinc-400 hover:text-zinc-600 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Zone 3: Actions (Search Toggle, AI Guide, Account, Cart) */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-zinc-700 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 cursor-pointer"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* AI Assistant shortcut (Tablet & Desktop) */}
            {settings?.aiSettings?.enabled !== false && (
              <button
                onClick={() => setIsAiAssistantOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-lg transition-colors cursor-pointer min-h-[38px]"
                title="Ask Liyau Thinker AI Shopping Assistant"
              >
                <Sparkles className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{settings?.websiteTexts?.askAiButtonText || settings?.aiSettings?.assistantName || 'Liyau Thinker'}</span>
              </button>
            )}

            {/* Account / Login */}
            {currentUser ? (
              <button
                onClick={() => {
                  setAuthMode('profile');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200/80 rounded-lg transition-colors cursor-pointer min-h-[38px]"
                aria-label="My Account"
              >
                <User className="w-4 h-4 text-zinc-600 shrink-0" />
                <span className="hidden lg:inline truncate max-w-[90px]">{currentUser.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer min-h-[38px]"
                aria-label="Login or Register"
              >
                <User className="w-4 h-4 text-zinc-600 shrink-0" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative w-10 h-10 flex items-center justify-center text-zinc-800 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label={`Shopping Cart with ${cartItemCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center tabular-nums shadow-xs">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Row Expand */}
        {isSearchExpanded && (
          <div className="pb-2.5 md:hidden">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products in Liyau..."
                autoFocus
                className="w-full pl-9 pr-8 py-2 bg-zinc-100 text-xs sm:text-sm border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Secondary Category Navigation Strip */}
      {categories.length > 1 && (
        <div className="bg-zinc-50 border-t border-zinc-200 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 py-1.5 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer min-h-[32px] flex items-center ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3.5 space-y-3 shadow-lg animate-fadeIn">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider px-2 pb-1">Categories</p>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer ${
                  selectedCategory === cat ? 'bg-red-50 text-red-700 font-semibold' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAiAssistantOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-red-600 font-semibold cursor-pointer py-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask {settings?.aiSettings?.assistantName || 'Liyau Thinker'}</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAboutOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-950 font-medium cursor-pointer py-1"
            >
              <span>About {settings?.storeName || 'Liyau'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
