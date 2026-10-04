import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

export const Footer: React.FC = () => {
  const { settings, setIsAdminDashboardOpen, setSelectedCategory, setIsAboutOpen } = useStore();

  return (
    <footer className="bg-zinc-900 text-zinc-300 border-t border-zinc-800 text-xs mt-12 sm:mt-16 w-full">
      {/* Nepal Flag-inspired accent theme border at top of footer */}
      <div className="h-1 w-full bg-gradient-to-r from-[#003893] via-[#DC2626] to-[#003893]" />

      {/* Top Value Strip */}
      <div className="border-b border-zinc-800/80 py-6 sm:py-8 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-red-500 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-xs sm:text-sm">
                {settings?.websiteTexts?.footerValue1Title || 'Fast Nationwide Delivery'}
              </p>
              <p className="text-zinc-400 text-[11px] sm:text-xs">
                {settings?.websiteTexts?.footerValue1Sub || 'Dispatched from Butwal, Nepal to all 7 provinces'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-xs sm:text-sm">
                {settings?.websiteTexts?.footerValue2Title || '100% Genuine Guarantee'}
              </p>
              <p className="text-zinc-400 text-[11px] sm:text-xs">
                {settings?.websiteTexts?.footerValue2Sub || 'Inspected at our Butwal, Nepal hub before shipping'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-blue-500 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-xs sm:text-sm">
                {settings?.websiteTexts?.footerValue3Title || '7-Day Easy Returns'}
              </p>
              <p className="text-zinc-400 text-[11px] sm:text-xs">
                {settings?.websiteTexts?.footerValue3Sub || 'Hassle-free replacement or refund'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Contact */}
          <div className="space-y-3.5">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.storeName || 'Liyau (लियौँ)'}
                className="h-9 w-auto max-w-[165px] object-contain brightness-0 invert opacity-95"
              />
            ) : (
              <div className="flex items-baseline gap-1 text-xl font-bold tracking-tight text-white font-heading">
                <span>{settings?.storeName || 'Liyau'}</span>
                <span className="text-red-500 font-black ml-1">लियौँ</span>
              </div>
            )}
            <p className="text-zinc-400 leading-relaxed text-xs">
              {settings?.websiteTexts?.footerBrandSummary || 'Authentic Nepali online shopping store based in Butwal, Nepal for genuine electronics, local craftsmanship, and everyday essentials.'}
            </p>
            <div>
              <button
                onClick={() => setIsAboutOpen(true)}
                className="text-xs text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1 transition-colors underline cursor-pointer"
              >
                <span>Read More About Liyau & Founder →</span>
              </button>
            </div>
            <div className="space-y-2 text-zinc-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="break-words">{settings?.storeAddress || 'Traffic Chowk, Butwal, Nepal'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500 shrink-0" />
                <span>{settings?.contactPhone || '+977-9801234567'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-500 shrink-0" />
                <span className="break-all">{settings?.contactEmail || 'support@liyau.com'}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Top Categories */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-white">Store Collections</h4>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  All Available Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedCategory('Electronics')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Verified Electronics & Audio
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedCategory('Handicrafts & Art')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Nepali Craftsmanship & Heritage
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedCategory('Home & Kitchen')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home & Daily Essentials
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedCategory('Fashion')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Fashion & Apparel
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Support & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-white">Customer Support</h4>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <span>Local Delivery: 24-48h Butwal, Nepal</span>
              </li>
              <li>
                <span>Nationwide Shipping: Rs. {settings?.deliveryOutsideFee || 150} Flat</span>
              </li>
              <li>
                <span>7-Day Return & Replacement</span>
              </li>
              <li>
                <span>Official QR Payment Verification</span>
              </li>
              <li>
                <button
                  onClick={() => setIsAboutOpen(true)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About Liyau & Founder
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment Methods */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-white">Accepted QR Payments</h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded font-semibold">
                eSewa
              </span>
              <span className="bg-purple-950/60 border border-purple-800 text-purple-300 px-2.5 py-1 rounded font-semibold">
                Khalti
              </span>
              <span className="bg-blue-950/60 border border-blue-800 text-blue-300 px-2.5 py-1 rounded font-semibold">
                Fonepay / Mobile Banking
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 pt-2 leading-relaxed">
              {settings?.websiteTexts?.footerDispatchNote || 'Deliveries fulfilled daily from our Butwal, Nepal packaging hub.'}
            </p>
          </div>

        </div>

        {/* Bottom Copyright Bar with Discreet Admin Link in the Extreme Last Bottom-Right Corner (Requirement 3) */}
        <div className="pt-6 mt-8 border-t border-zinc-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2 flex-wrap">
            <p>
              © {new Date().getFullYear()} {settings?.storeName || 'Liyau'} (लियौँ) — {settings?.websiteTexts?.footerCopyrightText || 'Butwal, Nepal. All rights reserved.'}
            </p>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              About &amp; Founder
            </button>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4">
            <span className="text-zinc-500">{settings?.websiteTexts?.topLocationText || 'Butwal, Nepal'}</span>
            <button
              onClick={() => setIsAdminDashboardOpen(true)}
              className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors cursor-pointer select-none ml-auto sm:ml-2"
              aria-label="Admin"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
