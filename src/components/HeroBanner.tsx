import React from 'react';
import { ArrowRight, Truck, RefreshCw, Sparkles, CreditCard } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { NepalFlag } from './NepalFlag.tsx';
import { resolveAssetUrl } from '../services/fallbackStore.ts';

export const HeroBanner: React.FC = () => {
  const { setIsAiAssistantOpen, settings } = useStore();

  const currentLogo = resolveAssetUrl(settings?.logoUrl || '/src/assets/images/liyau_logo.svg');
  const heroBgUrl = resolveAssetUrl(settings?.heroBannerUrl || '/src/assets/images/khojau_hero_nepal_1791032655932.jpg');

  return (
    <section className="relative overflow-hidden bg-zinc-950 border-b border-zinc-800 text-white w-full">
      {/* Desktop & Tablet Full-Bleed Background */}
      <div className="hidden sm:block absolute inset-0 z-0">
        <img
          src={heroBgUrl}
          alt="Liyau Nepali shopping lifestyle campaign in Butwal, Nepal"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/82 to-zinc-950/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-black/35" />
      </div>

      {/* Dedicated Mobile Hero Visual Header (Visible on < 640px so products & logo are never cropped or overlapping text) */}
      <div className="sm:hidden relative w-full aspect-16/10 bg-zinc-900 overflow-hidden">
        <img
          src={heroBgUrl}
          alt="Liyau authentic products in Butwal, Nepal"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-black/30" />
        {/* Mobile Positioned Liyau Logo in Top-Right Corner of Banner */}
        <div className="absolute top-3 right-3 bg-zinc-950/75 backdrop-blur-xs border border-white/15 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
          <img
            src={currentLogo}
            alt="Liyau (लियौँ)"
            referrerPolicy="no-referrer"
            className="h-5 w-auto max-w-[95px] object-contain brightness-0 invert"
          />
        </div>
      </div>

      {/* Subtle Desktop/Tablet Watermark Logo (Positioned safely on the right so it never covers left-hand text) */}
      <div className="hidden sm:flex absolute inset-y-0 right-6 z-1 items-center justify-end pointer-events-none select-none overflow-hidden">
        <img
          src={currentLogo}
          alt="Liyau Brand Watermark"
          referrerPolicy="no-referrer"
          className="w-[340px] md:w-[460px] lg:w-[540px] h-auto object-contain opacity-10 brightness-0 invert"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 pb-8 sm:py-12 md:py-16 lg:py-20 w-full">
        <div className="max-w-3xl space-y-4 sm:space-y-5 min-w-0">
          
          {/* Authentic Nepal Flag Accent & Official Butwal, Nepal Location Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-zinc-900/90 border-l-3 border-[#003893] border-y border-r border-zinc-700/70 px-3 py-1.5 rounded-full backdrop-blur-md shadow-xs max-w-full">
            <NepalFlag className="w-3.5 h-4 shrink-0" />
            <span className="text-red-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] truncate">
              {settings?.heroBadgeText || 'Authentic Nepali Store'}
            </span>
            <span aria-hidden="true" className="text-zinc-600 shrink-0">·</span>
            <span className="text-zinc-200 font-medium text-[11px] shrink-0">
              {settings?.websiteTexts?.topLocationText || 'Butwal, Nepal'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-heading leading-tight drop-shadow-sm whitespace-pre-line break-words">
            {settings?.heroTitle || 'Genuine Products &\nNepali Craftsmanship,\nDelivered Across Nepal.'}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-zinc-200 max-w-xl font-normal leading-relaxed">
            {settings?.heroSubtitle || 'Handpicked everyday essentials, pure Himalayan cashmere, organic mountain teas, and verified electronics dispatched directly from our Butwal, Nepal hub with verified QR payment.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={() => {
                const el = document.getElementById('catalog-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer min-h-[42px]"
            >
              <span>{settings?.websiteTexts?.heroPrimaryButtonText || 'Browse Catalog'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {settings?.aiSettings?.enabled !== false && (
              <button
                onClick={() => setIsAiAssistantOpen(true)}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 active:scale-98 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/20 backdrop-blur-md transition-colors inline-flex items-center justify-center gap-2 cursor-pointer min-h-[42px]"
              >
                <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
                <span>{settings?.websiteTexts?.heroSecondaryButtonText || `Ask ${settings?.aiSettings?.assistantName || 'Liyau Thinker'}`}</span>
              </button>
            )}
          </div>

          {/* Trust Highlights */}
          <div className="pt-4 sm:pt-5 border-t border-white/15 grid grid-cols-3 gap-2 sm:gap-3 text-xs text-zinc-200 max-w-xl">
            <div className="flex items-start gap-1.5 min-w-0">
              <Truck className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-white text-[11px] sm:text-xs truncate">
                  {settings?.websiteTexts?.heroTrust1Title || 'Fast Shipping'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block truncate">
                  {settings?.websiteTexts?.heroTrust1Sub || 'From Butwal, Nepal'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-1.5 min-w-0">
              <CreditCard className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-white text-[11px] sm:text-xs truncate">
                  {settings?.websiteTexts?.heroTrust2Title || 'QR Payment'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block truncate">
                  {settings?.websiteTexts?.heroTrust2Sub || 'eSewa · Khalti · Banking'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-1.5 min-w-0">
              <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-white text-[11px] sm:text-xs truncate">
                  {settings?.websiteTexts?.heroTrust3Title || '7-Day Return'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block truncate">
                  {settings?.websiteTexts?.heroTrust3Sub || 'Easy replacement'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
