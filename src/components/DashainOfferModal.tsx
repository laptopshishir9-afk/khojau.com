import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, Tag, Gift, Flame } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { NepalFlag } from './NepalFlag.tsx';

export const DashainOfferModal: React.FC = () => {
  const { settings, showToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const offer = settings?.promotionalOffer || {
    enabled: true,
    title: 'दशैंको विशेष अफर 🎉',
    subtitle: 'सबै उत्पादनमा २५% सम्म छुट!',
    discountPercentage: 25,
    buttonText: 'अहिले किनमेल गर्नुहोस्'
  };

  useEffect(() => {
    // Only show if enabled in admin settings
    if (offer.enabled === false) return;

    // Check if dismissed in this browsing session
    const isDismissed = sessionStorage.getItem('khojau_dashain_dismissed');
    if (!isDismissed) {
      // Gentle delay so initial page loads smoothly first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [offer.enabled]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('khojau_dashain_dismissed', 'true');
  };

  const handleShopNow = () => {
    handleClose();
    const catalog = document.getElementById('catalog-section');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
    showToast(`🎉 ${offer.title} - ${offer.discountPercentage}% छुट लागू भयो!`);
  };

  if (!isOpen || offer.enabled === false) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashain-offer-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-red-600/30 transform transition-all duration-300 animate-fadeInUp">
        {/* Festive Dashain Header with authentic Nepali flag tricolor ribbon */}
        <div className="h-2 w-full bg-gradient-to-r from-[#003893] via-[#DC2626] to-[#003893]" />

        {/* Optional Admin-Uploaded Popup Image */}
        {offer.popupImageUrl && (
          <div className="relative w-full aspect-16/9 bg-zinc-900 overflow-hidden border-b border-zinc-200">
            <img
              src={offer.popupImageUrl}
              alt={offer.title || "Festival Special Offer"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
          aria-label="Close promotion modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Festive Banner Background */}
        <div className="relative bg-gradient-to-br from-red-600 via-rose-700 to-red-900 text-white p-6 sm:p-7 text-center overflow-hidden">
          {/* Subtle Decorative Marigold / Festive Geometry */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-rose-400/20 blur-xl pointer-events-none" />

          {/* Badges */}
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs mb-3">
            <NepalFlag className="w-3.5 h-4 drop-shadow-xs" />
            <span>शुभ विजया दशमी तथा दिपावली महोत्सव</span>
          </div>

          <h2
            id="dashain-offer-title"
            className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight drop-shadow-sm leading-tight"
          >
            {offer.title || 'दशैंको विशेष अफर 🎉'}
          </h2>

          <p className="text-base sm:text-lg font-bold text-amber-300 mt-2 font-heading drop-shadow-xs">
            {offer.subtitle || `सबै उत्पादनमा ${offer.discountPercentage}% सम्म छुट!`}
          </p>

          <p className="text-xs text-red-100 mt-1.5 opacity-90">
            Handcrafted cashmere, organic mountain teas, and verified electronics across Nepal.
          </p>
        </div>

        {/* Content & Action */}
        <div className="p-5 sm:p-6 bg-white space-y-4 text-center">
          <div className="grid grid-cols-3 gap-2 py-1 text-center">
            <div className="p-2.5 bg-red-50/60 rounded-xl border border-red-100">
              <span className="block text-lg font-extrabold text-red-600 font-heading">
                {offer.discountPercentage}%
              </span>
              <span className="text-[10px] text-zinc-600 font-semibold">अधिकतम छुट</span>
            </div>
            <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
              <span className="block text-lg font-extrabold text-blue-700 font-heading">
                १००%
              </span>
              <span className="text-[10px] text-zinc-600 font-semibold">सक्कली सामान</span>
            </div>
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="block text-lg font-extrabold text-emerald-700 font-heading">
                द्रुत
              </span>
              <span className="text-[10px] text-zinc-600 font-semibold">डेलिभरी सेवा</span>
            </div>
          </div>

          {/* Call to Action Button */}
          <button
            onClick={handleShopNow}
            className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{offer.buttonText || 'अहिले किनमेल गर्नुहोस्'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-zinc-400">
            Secure digital checkout via eSewa, Khalti, and Mobile Banking.
          </p>
        </div>
      </div>
    </div>
  );
};
