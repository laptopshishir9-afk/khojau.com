import React from 'react';
import { X, Heart, ShieldCheck, Truck, MapPin, Mail, Phone, ArrowRight, ExternalLink, Globe } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { NepalFlag } from './NepalFlag.tsx';

export const AboutModal: React.FC = () => {
  const { isAboutOpen, setIsAboutOpen, settings } = useStore();

  if (!isAboutOpen) return null;

  const founder = settings?.founder || {
    name: "Shishir Pokhrel",
    role: "Founder & Owner of Liyau",
    photoUrl: "/src/assets/images/founder_shishir_1790996757613.jpg",
    bio: "Hi, I'm Shishir Pokhrel. I started Liyau (लियौँ) right here in Butwal, Nepal because I wanted to build an honest, reliable Nepali online store where finding genuine products is straightforward and headache-free. Rather than overwhelming people with endless clutter and misleading discounts, I focus on handpicking real, dependable items—from authentic local Himalayan craftsmanship to verified electronics—and delivering them safely with verified digital payment and dedicated local care across Nepal.",
    website: "https://shishirpokhrel.com.np"
  };

  const founderWebsite = founder.website || "https://shishirpokhrel.com.np";

  const aboutBrand = settings?.aboutBrand || {
    aboutKhojau: "Liyau (लियौँ) is a modern Nepali online shopping brand based in Butwal, Nepal, created to make finding and ordering useful products simple and convenient. The goal is to bring interesting and useful products to customers through a clean, easy-to-use online shopping experience.",
    brandDescription: "Based in Butwal, Nepal, Liyau is built on trust, transparency, and personal care. We inspect every product before it reaches your hands and provide dependable delivery throughout Butwal, Rupandehi, and all major cities in Nepal.",
    mission: "To deliver genuinely useful products and authentic Nepali heritage crafts to homes across Nepal with unmatched reliability and friendly customer support."
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle Nepali Flag theme border at top */}
        <div className="h-1 w-full bg-gradient-to-r from-[#003893] via-[#DC2626] to-[#003893]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Liyau (लियौँ)"
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-xl font-black text-red-600 font-heading">लियौँ</span>
            )}
            <span className="text-zinc-300">/</span>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 font-heading flex items-center gap-2">
              <span>About Liyau & Founder</span>
              <NepalFlag className="w-3.5 h-4" />
            </h2>
          </div>
          <button
            onClick={() => setIsAboutOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
            aria-label="Close about modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8 flex-1">
          
          {/* Section 1: About Liyau */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-red-700 tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>Our Story & Vision</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-heading tracking-tight">
              About Liyau (लियौँ)
            </h3>

            <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-normal">
              {aboutBrand.aboutKhojau}
            </p>

            <p className="text-sm text-zinc-600 leading-relaxed">
              {aboutBrand.brandDescription}
            </p>

            {/* Core Values Strip (No COD) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                <Truck className="w-4 h-4 text-red-600" />
                <p className="font-bold text-xs text-zinc-900">Fast Nationwide Shipping</p>
                <p className="text-[11px] text-zinc-500">Carefully packaged and dispatched across Nepal.</p>
              </div>

              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <p className="font-bold text-xs text-zinc-900">Verified Quality</p>
                <p className="text-[11px] text-zinc-500">Every single package is checked before shipping.</p>
              </div>

              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                <Heart className="w-4 h-4 text-rose-600" />
                <p className="font-bold text-xs text-zinc-900">Direct Local Care</p>
                <p className="text-[11px] text-zinc-500">Real people helping you with dedicated support.</p>
              </div>
            </div>
          </div>

          {/* Section 2: About the Founder (Shishir Pokhrel - Requirement 6) */}
          <div className="pt-8 border-t border-zinc-200 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-1">
                <span>The Person Behind Liyau</span>
              </div>
              <h3 className="text-2xl font-bold text-zinc-950 font-heading">
                About the Founder
              </h3>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-start">
              {/* Founder Photo */}
              <div className="space-y-3 shrink-0 mx-auto sm:mx-0 text-center">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-zinc-200 border border-zinc-300 shadow-sm">
                  <img
                    src={founder.photoUrl || '/src/assets/images/founder_shishir_1790996757613.jpg'}
                    alt={founder.name || "Shishir Pokhrel"}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Founder Text & Official Link */}
              <div className="space-y-3 text-left flex-1">
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-zinc-950 font-heading">
                    {founder.name || "Shishir Pokhrel"}
                  </h4>
                  <p className="text-xs font-semibold text-red-600">
                    {founder.role || "Founder & Owner of Liyau"}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal whitespace-pre-line">
                  {founder.bio || "Hi, I'm Shishir Pokhrel. I started Liyau right here in Butwal, Nepal because I wanted to build an honest, reliable Nepali online store where finding genuine products is straightforward and headache-free."}
                </p>

                {/* Requirement 6: Read More About Shishir Pokhrel link to https://shishirpokhrel.com.np */}
                <div className="pt-2">
                  <a
                    href={founderWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Read More About Shishir Pokhrel</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>

                <div className="pt-2 flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    Butwal, Nepal
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    {settings?.contactEmail || 'support@liyau.com'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Visit Us */}
          <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-bold text-zinc-900">Have feedback or an inquiry?</p>
              <p>Call or WhatsApp us at <strong className="text-zinc-900">{settings?.contactPhone || '+977-9801234567'}</strong></p>
            </div>
            <button
              onClick={() => setIsAboutOpen(false)}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
