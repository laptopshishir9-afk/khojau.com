import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  CreditCard,
  ChevronRight,
  QrCode,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import * as api from '../services/api.ts';
import type { Order } from '../types/index.ts';
import { NepalFlag } from './NepalFlag.tsx';

type CheckoutStep = 'address' | 'qr_payment' | 'submit_proof' | 'namaste_success' | 'order_confirmed';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    clearCart,
    currentUser,
    setIsAuthModalOpen,
    setAuthMode,
    settings,
    showToast
  } = useStore();

  const [step, setStep] = useState<CheckoutStep>('address');

  // Address fields
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [street, setStreet] = useState(currentUser?.addresses?.[0]?.street || '');
  const [city, setCity] = useState(currentUser?.addresses?.[0]?.city || 'Butwal');
  const [zone, setZone] = useState<'kathmandu_valley' | 'outside_valley'>('kathmandu_valley');
  const [landmarks, setLandmarks] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment proof fields
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Active order state
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<'amount' | 'remark' | 'account' | null>(null);

  if (!isCheckoutOpen) return null;

  // Delivery fee calculation
  const isFreeDelivery = cartSubtotal >= (settings?.freeDeliveryThreshold || 2000);
  const deliveryFee = isFreeDelivery
    ? 0
    : (zone === 'kathmandu_valley' ? (settings?.deliveryKathmanduFee || 50) : (settings?.deliveryOutsideFee || 150));

  // Automatic Non-Editable Amount (Requirement 2 & 9)
  const payableTotal = cartSubtotal + deliveryFee;

  // Preliminary items summary for payment remark before order creation
  const primaryItemName = cart[0]?.product.name || 'Liyau Order';
  const preliminarySummary = cart.length > 1 ? `${primaryItemName} (+${cart.length - 1} more)` : primaryItemName;

  const copyToClipboard = (text: string, field: 'amount' | 'remark' | 'account') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Step 1 -> Step 2: Create initial pending order in database with verified server prices
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      showToast('Please login or create an account to complete your order.');
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (!fullName.trim() || !phone.trim() || !street.trim()) {
      showToast('Please fill in your name, phone number, and street address.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend validates product ID and computes actual final prices and totals (Requirement 9)
      const orderPayload = {
        customerId: currentUser?.id,
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim() || 'Butwal, Nepal',
          zone,
          landmarks: landmarks.trim(),
          deliveryNotes: deliveryNotes.trim()
        },
        items: cart.map(item => ({
          productId: item.productId,
          name: item.product.name,
          price: (item.product.isDiscountActive !== false && item.product.discountPrice)
            ? item.product.discountPrice
            : item.product.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          image: item.product.images?.[0] || ''
        })),
        notes: deliveryNotes.trim()
      };

      const order = await api.createOrder(orderPayload);
      setCreatedOrder(order);
      clearCart();
      setStep('qr_payment');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to initialize order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle optional screenshot selection
  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 3 -> Step 4: Submit Payment Confirmation (Transaction ID + Screenshot)
  const handleSubmitPaymentConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createdOrder) return;
    if (!transactionId.trim()) {
      showToast('कृपया Transaction ID वा Payment Reference राख्नुहोस्।');
      return;
    }

    setIsUploadingProof(true);
    try {
      let uploadedScreenshotUrl = '';

      if (screenshotPreview) {
        try {
          uploadedScreenshotUrl = await api.uploadPaymentProof(screenshotPreview);
        } catch (uploadErr) {
          console.warn('Screenshot upload fallback, saving reference directly', uploadErr);
        }
      }

      // Submit verification details. Note: Payment status remains "Pending Verification" (Requirement 5)
      const updatedOrder = await api.submitPaymentProof(createdOrder.id, {
        transactionId: transactionId.trim(),
        paymentScreenshotUrl: uploadedScreenshotUrl
      });

      setCreatedOrder(updatedOrder);

      // Trigger respectful Namaste Success Animation (Requirement 7)
      setStep('namaste_success');

      // Transition smoothly from Namaste animation to Order Confirmation card
      setTimeout(() => {
        setStep('order_confirmed');
      }, 2600);

    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to submit payment proof.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleClose = () => {
    setCreatedOrder(null);
    setStep('address');
    setTransactionId('');
    setScreenshotPreview('');
    setScreenshotFile(null);
    setIsCheckoutOpen(false);
  };

  const qrSettings = settings?.qrPaymentSettings || {
    enabled: true,
    qrImageUrl: '',
    providerName: 'eSewa / Fonepay / Khalti / Mobile Banking',
    accountName: 'Liyau Online Store',
    accountNumber: '9801234567',
    instructions: 'तलको QR स्क्यान गरेर भुक्तानी गर्नुहोस्। भुक्तानी गरेपछि Transaction ID राख्नुहोस्।'
  };

  const activeOrderNumber = createdOrder?.orderNumber || 'LY-1025';
  const officialOrderAmount = createdOrder ? createdOrder.total : payableTotal;
  const officialRemark = createdOrder?.paymentRemark || `Liyau Order #${activeOrderNumber} — ${preliminarySummary}`;
  const shortRemark = activeOrderNumber;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[94vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle Nepal Flag Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#003893] via-[#DC2626] to-[#003893]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 font-heading">
              {step === 'address' && '1. Delivery Address & Order Review'}
              {step === 'qr_payment' && '2. Official QR Payment'}
              {step === 'submit_proof' && '3. Confirm Payment Details'}
              {step === 'namaste_success' && 'भुक्तानी पुष्टि'}
              {step === 'order_confirmed' && 'Order Placed — Pending Verification'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">

          {/* ============================================================== */}
          {/* STEP 1: DELIVERY ADDRESS & AUTOMATIC ORDER REVIEW */}
          {/* ============================================================== */}
          {step === 'address' && (
            <form onSubmit={handleProceedToPayment} className="space-y-5 text-xs">
              
              {/* Product & Price Summary Strip (Automatic database price - Requirement 2) */}
              <div className="bg-red-50/60 border border-red-200/70 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between font-semibold text-zinc-800">
                  <span className="flex items-center gap-1.5">
                    <NepalFlag className="w-3.5 h-4.5" />
                    <span>Order Items ({cart.length})</span>
                  </span>
                  <span className="text-zinc-500 font-normal text-[11px]">Butwal, Nepal Dispatch</span>
                </div>

                <div className="divide-y divide-red-100 max-h-36 overflow-y-auto pr-1">
                  {cart.map(item => {
                    const hasDiscount = Boolean(item.product.isDiscountActive !== false && item.product.discountPrice);
                    const sellingPrice = hasDiscount ? (item.product.discountPrice as number) : item.product.price;
                    const lineTotal = sellingPrice * item.quantity;

                    return (
                      <div key={item.productId} className="py-2 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 truncate">
                          <img
                            src={item.product.images?.[0] || '/src/assets/images/liyau_logo.svg'}
                            alt={item.product.name}
                            className="w-9 h-9 rounded object-cover border border-zinc-200 shrink-0 bg-white"
                          />
                          <div className="truncate">
                            <p className="font-bold text-zinc-900 truncate">{item.product.name}</p>
                            <p className="text-[11px] text-zinc-500">
                              Qty: <strong className="text-zinc-800">{item.quantity}</strong> × Rs. {sellingPrice.toLocaleString()}
                              {hasDiscount && (
                                <span className="line-through text-zinc-400 ml-1.5 text-[10px]">
                                  Rs. {item.product.price.toLocaleString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-zinc-950 tabular-nums shrink-0">
                          Rs. {lineTotal.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Delivery Address</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Receiver's Full Name"
                      className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="98XXXXXXXX"
                      className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">City / Town *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g. Butwal, Tilottama, Bhairahawa, Pokhara"
                      className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Delivery Zone *</label>
                    <select
                      value={zone}
                      onChange={e => setZone(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      <option value="kathmandu_valley">Butwal &amp; Rupandehi (Rs. {settings?.deliveryKathmanduFee || 50})</option>
                      <option value="outside_valley">Outside Butwal (Nepal Nationwide: Rs. {settings?.deliveryOutsideFee || 150})</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Street Address / House / Ward *</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      placeholder="House number, Tol, Street, Ward"
                      className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Amount To Pay Box (Non-Editable - Requirement 2) */}
              <div className="bg-zinc-900 text-white rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-zinc-300 text-xs">
                  <span>Product Subtotal:</span>
                  <span className="font-semibold text-white tabular-nums">Rs. {cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-300 text-xs">
                  <span>Delivery ({zone === 'kathmandu_valley' ? 'Butwal & Rupandehi' : 'Outside Butwal'}):</span>
                  <span className="font-semibold text-white tabular-nums">
                    {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400">Total Amount to Pay:</p>
                    <p className="text-xs text-emerald-400 font-semibold">Payment Method: Official QR Payment</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-white tabular-nums font-heading">
                      Rs. {payableTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proceed to QR Payment Button */}
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px]"
              >
                <span>{isSubmitting ? 'Processing Order...' : `Proceed to QR Payment (Rs. ${payableTotal.toLocaleString()})`}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 2: ADVANCED QR PAYMENT PAGE (Requirements 1, 3, 4, 10, 12) */}
          {/* ============================================================== */}
          {step === 'qr_payment' && (
            <div className="space-y-5 text-xs animate-fadeIn">
              
              {/* Amount to Pay Banner (Requirement 2 & 3) */}
              <div className="bg-zinc-950 text-white rounded-2xl p-4 sm:p-5 text-center space-y-1 shadow-md">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Amount to Pay (भुक्तानी गर्नुपर्ने रकम)
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white font-heading tabular-nums py-1">
                  Rs. {officialOrderAmount.toLocaleString()}
                </div>
                <p className="text-zinc-400 text-xs">
                  Order ID: <strong className="text-white font-mono">{activeOrderNumber}</strong> · Payment Method: <strong className="text-white">QR Payment</strong>
                </p>
              </div>

              {/* Nepali Instructions (Requirement 3) */}
              <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 text-center space-y-0.5 text-xs text-amber-950 font-medium">
                <p className="font-bold text-amber-900 text-sm font-heading">
                  "{settings?.websiteTexts?.checkoutQrInstruction1 || 'तलको QR स्क्यान गरेर भुक्तानी गर्नुहोस्।'}"
                </p>
                <p className="text-amber-800 text-xs">
                  "{settings?.websiteTexts?.checkoutQrInstruction2 || 'भुक्तानी गरेपछि Transaction ID राख्नुहोस्।'}"
                </p>
              </div>

              {/* Prominent Square QR Code Display (Requirement 1, 3, 10) */}
              <div className="bg-white border-2 border-zinc-200 rounded-2xl p-3 sm:p-6 text-center max-w-sm mx-auto shadow-sm space-y-3 w-full">
                
                {/* Responsive Square Container without distortion */}
                <div className="relative w-full max-w-[230px] sm:max-w-[280px] aspect-square mx-auto rounded-xl overflow-hidden bg-zinc-50 border border-zinc-300 flex items-center justify-center p-2">
                  {qrSettings.qrImageUrl ? (
                    <img
                      src={qrSettings.qrImageUrl}
                      alt="Liyau Payment QR Code"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    /* Clean Fallback when Admin is yet to upload QR */
                    <div className="space-y-2.5 p-3 text-center">
                      <QrCode className="w-14 h-14 sm:w-16 sm:h-16 text-red-600 mx-auto animate-pulse" />
                      <div>
                        <p className="font-bold text-zinc-900 text-xs sm:text-sm font-heading">{qrSettings.accountName}</p>
                        <p className="text-[11px] sm:text-xs text-zinc-600 font-mono mt-0.5 break-words">{qrSettings.providerName}</p>
                        {qrSettings.accountNumber && (
                          <p className="text-xs font-bold text-red-600 mt-1">Wallet / Mobile: {qrSettings.accountNumber}</p>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Admin: Upload official QR in Admin → Payment Settings → QR Payment
                      </p>
                    </div>
                  )}
                </div>

                {/* Account / Wallet Info */}
                <div className="space-y-1.5 text-xs pt-1 border-t border-zinc-100">
                  <div className="flex items-center justify-between gap-2 text-zinc-600">
                    <span className="shrink-0">Account Name:</span>
                    <strong className="text-zinc-900 text-right truncate">{qrSettings.accountName}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-zinc-600">
                    <span className="shrink-0">Supported Providers:</span>
                    <span className="font-semibold text-zinc-800 text-right truncate">{qrSettings.providerName}</span>
                  </div>
                  {qrSettings.accountNumber && (
                    <div className="flex items-center justify-between gap-2 text-zinc-600">
                      <span className="shrink-0">Account / Wallet No:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(qrSettings.accountNumber || '', 'account')}
                        className="font-mono font-bold text-red-600 inline-flex items-center gap-1 hover:underline cursor-pointer shrink-0"
                      >
                        <span>{qrSettings.accountNumber}</span>
                        {copiedField === 'account' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Automatic Payment Remark / Description (Requirement 4) */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 sm:p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 min-w-0">
                    <Info className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="truncate">भुक्तानी गर्दा राख्नुपर्ने Remark (Auto-Generated)</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 hidden sm:inline shrink-0">Copy &amp; Paste in Bank App</span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-white border border-zinc-200 rounded-lg p-2.5 min-w-0">
                  <span className="font-mono font-semibold text-zinc-900 text-xs truncate min-w-0 flex-1">
                    {officialRemark}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(officialRemark, 'remark')}
                    className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-semibold text-xs inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedField === 'remark' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'remark' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 flex-wrap">
                  <span>छोटो Remark (यदि बैंकमा लामो नअटेमा): <strong className="font-mono text-zinc-800">{shortRemark}</strong></span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(shortRemark, 'remark')}
                    className="text-red-600 font-semibold hover:underline cursor-pointer shrink-0"
                  >
                    Copy Short ID
                  </button>
                </div>
              </div>

              {/* Action Buttons: "मैले भुक्तानी गरेँ" (Requirement 5) */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('submit_proof')}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-sm font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px]"
                >
                  <Check className="w-5 h-5" />
                  <span>{settings?.websiteTexts?.checkoutPaidButtonText || 'मैले भुक्तानी गरेँ (I Have Paid)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="w-full py-2.5 text-zinc-500 hover:text-zinc-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Address Details</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: SUBMIT TRANSACTION ID & SCREENSHOT (Requirement 5) */}
          {/* ============================================================== */}
          {step === 'submit_proof' && (
            <form onSubmit={handleSubmitPaymentConfirmation} className="space-y-4 text-xs animate-fadeIn">
              
              <div className="text-center space-y-1 pb-2 border-b border-zinc-100">
                <h3 className="text-base font-bold text-zinc-950 font-heading">
                  {settings?.websiteTexts?.checkoutProofHeading || 'भुक्तानी पुष्टि विवरण राख्नुहोस्'}
                </h3>
                <p className="text-xs text-zinc-500">
                  {settings?.websiteTexts?.checkoutProofSubheading || 'Transaction ID / Reference Number पेश गरेपछि तपाईंको अर्डर सुरक्षित हुन्छ।'}
                </p>
              </div>

              {/* Order Info Strip */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500">Order ID:</span>{' '}
                  <strong className="font-mono text-zinc-950">{activeOrderNumber}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Amount Paid:</span>{' '}
                  <strong className="text-red-600 font-bold tabular-nums">Rs. {officialOrderAmount.toLocaleString()}</strong>
                </div>
              </div>

              {/* Transaction ID Input (Required - Requirement 5) */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Transaction ID / Payment Reference *
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder="e.g. 26A912384 or Ref Number from eSewa/Khalti"
                  className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  भुक्तानी पूरा भएपछि तपाईंको वालेट वा बैंक एपमा देखिएको ट्रान्ज्याक्सन कोड यहाँ राख्नुहोस्।
                </p>
              </div>

              {/* Optional Payment Screenshot Upload (Requirement 5) */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Payment Screenshot (वैकल्पिक / Optional)
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 rounded-xl cursor-pointer text-xs font-semibold transition-colors">
                    <Upload className="w-4 h-4 text-zinc-600" />
                    <span>{screenshotFile ? 'Change Screenshot' : 'Upload Receipt Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotSelect}
                      className="hidden"
                    />
                  </label>

                  {screenshotFile && (
                    <span className="text-xs text-emerald-700 font-medium truncate max-w-xs">
                      ✓ {screenshotFile.name}
                    </span>
                  )}
                </div>

                {screenshotPreview && (
                  <div className="mt-2 relative w-32 h-32 rounded-xl overflow-hidden border border-zinc-300">
                    <img
                      src={screenshotPreview}
                      alt="Payment Receipt Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotFile(null);
                        setScreenshotPreview('');
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Notice regarding initial verification status */}
              <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>प्रमाणीकरण प्रक्रिया (Verification Process)</span>
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  विवरण पेश गरेपछि तपाईंको भुक्तानी <strong>Pending Verification</strong> मा रहनेछ। एडमिनले रकम बैंकमा प्रमाणीकरण गरेपछि अर्डर डेलिभरीका लागि प्रस्थान हुनेछ।
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isUploadingProof || !transactionId.trim()}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px]"
                >
                  <span>{isUploadingProof ? 'Submitting Details...' : 'Submit Payment Proof (विवरण पेश गर्नुहोस्)'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('qr_payment')}
                  className="w-full py-2.5 text-zinc-500 hover:text-zinc-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to QR Code</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 4: SUCCESS ANIMATION (NAMASTE 🙏) (Requirement 7) */}
          {/* ============================================================== */}
          {step === 'namaste_success' && (
            <div className="py-12 sm:py-16 text-center space-y-4 animate-fadeIn flex flex-col items-center justify-center">
              
              {/* Respectful Namaste Animation Emoji & Icon */}
              <div className="text-6xl sm:text-7xl animate-namaste filter drop-shadow-md select-none">
                🙏
              </div>

              <div className="space-y-2 max-w-md mx-auto pt-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-heading">
                  {settings?.websiteTexts?.namasteSuccessTitle || 'धन्यवाद! 🙏'}
                </h3>
                <p className="text-base sm:text-lg font-bold text-red-600 font-heading">
                  {settings?.websiteTexts?.namasteSuccessSubtitle || 'तपाईंको भुक्तानी विवरण प्राप्त भयो।'}
                </p>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-sm mx-auto">
                  {settings?.websiteTexts?.namasteSuccessMessage || 'तपाईंको अर्डर पुष्टि भएपछि हामी तपाईंलाई जानकारी दिनेछौँ।'}
                </p>
              </div>

              {/* Gentle Loading Indicator before final confirmation card */}
              <div className="flex items-center justify-center gap-1.5 pt-4 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 5: FINAL ORDER CONFIRMATION CARD (Requirement 8) */}
          {/* ============================================================== */}
          {step === 'order_confirmed' && (
            <div className="text-center py-4 space-y-5 max-w-lg mx-auto animate-fadeIn text-xs">
              
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  अर्डर सफलतापूर्वक दर्ता भयो
                </span>
                <h3 className="text-xl font-extrabold text-zinc-950 font-heading pt-1">
                  {settings?.websiteTexts?.orderConfirmHeading || 'तपाईंको अर्डरका लागि धन्यवाद। 🙏'}
                </h3>
                <p className="text-xs text-zinc-500">
                  Order ID: <span className="font-mono font-bold text-zinc-900">{activeOrderNumber}</span>
                </p>
              </div>

              {/* Official Confirmation Card (Requirement 8) */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 sm:p-5 text-left space-y-3">
                <div className="flex justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500">Order ID:</span>
                  <strong className="font-mono text-zinc-950 text-sm">{activeOrderNumber}</strong>
                </div>

                <div className="space-y-1.5 pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 block text-[11px] uppercase font-semibold">Ordered Products:</span>
                  {(createdOrder?.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-800">
                      <span className="truncate max-w-[240px]">
                        {it.name} <strong className="text-zinc-900">× {it.quantity}</strong>
                      </span>
                      <span className="tabular-nums font-semibold">Rs. {(it.price * it.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500">Total Payable:</span>
                  <strong className="text-red-600 font-extrabold text-sm tabular-nums">
                    Rs. {officialOrderAmount.toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500">Transaction ID:</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    {transactionId || createdOrder?.transactionId || 'Submitted'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-zinc-500">Payment Status:</span>
                  <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded text-[11px] border border-amber-300">
                    Pending Verification
                  </span>
                </div>
              </div>

              <div className="bg-zinc-100/70 p-3 rounded-xl text-zinc-600 text-[11px] leading-relaxed">
                {settings?.websiteTexts?.orderConfirmNote || 'हाम्रो बुटवल टिमले तपाईंको भुक्तानी रुजु गरेपछि सामान प्याक गरी डेलिभरीका लागि पठाउनेछ।'}
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                Done (किनमेल जारी राख्नुहोस्)
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
