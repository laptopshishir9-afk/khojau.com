import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Heart, ShieldCheck, Truck, RefreshCw, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProduct,
    closeProductDetail,
    addToCart,
    setIsCheckoutOpen,
    toggleWishlist,
    isInWishlist,
    openAiWithPrompt
  } = useStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (selectedProduct) {
      setActiveImageIndex(0);
      setSelectedSize(selectedProduct.variants?.sizes?.[0]);
      setSelectedColor(selectedProduct.variants?.colors?.[0]?.name);
      setQuantity(1);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const isFavorited = isInWishlist(selectedProduct.id);
  const isDiscountActive = Boolean(selectedProduct.isDiscountActive && selectedProduct.discountPrice && selectedProduct.discountPrice < selectedProduct.price);
  const effectivePrice = isDiscountActive ? (selectedProduct.discountPrice as number) : selectedProduct.price;
  const discountPercent = isDiscountActive
    ? (selectedProduct.discountPercentage || Math.round(((selectedProduct.price - (selectedProduct.discountPrice as number)) / selectedProduct.price) * 100))
    : 0;
  const isOutOfStock = selectedProduct.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(selectedProduct, quantity, selectedSize, selectedColor);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(selectedProduct, quantity, selectedSize, selectedColor);
    closeProductDetail();
    setIsCheckoutOpen(true);
  };

  const images = selectedProduct.images && selectedProduct.images.length > 0
    ? selectedProduct.images
    : ['/src/assets/images/hero_nepal_shopping_1790995906814.jpg'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div
        className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-200 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold text-red-600 uppercase tracking-wider">{selectedProduct.category}</span>
            <span aria-hidden="true">/</span>
            <span className="truncate max-w-[200px] sm:max-w-md text-zinc-700">{selectedProduct.name}</span>
          </div>

          <button
            onClick={closeProductDetail}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            aria-label="Close product view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Gallery (Left: 6 cols) */}
            <div className="md:col-span-6 space-y-4">
              <div className="relative aspect-4/3 sm:aspect-square bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200">
                <img
                  src={images[activeImageIndex] || images[0]}
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                
                {isDiscountActive && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => toggleWishlist(selectedProduct.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                    isFavorited ? 'bg-red-50 text-red-600' : 'bg-white/80 text-zinc-600 hover:text-red-600'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-red-600' : ''}`} />
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === idx ? 'border-red-600 ring-2 ring-red-600/20' : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* AI Quick Advice Banner */}
              <div className="bg-red-50/60 border border-red-200/80 rounded-xl p-3.5 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-zinc-900">Have questions about this item?</p>
                  <p className="text-zinc-600 mt-0.5">
                    Ask Liyau Thinker about specifications, sizing, genuine material verification, or delivery timeline.
                  </p>
                  <button
                    onClick={() => {
                      openAiWithPrompt(`Is the ${selectedProduct.name} authentic? Tell me more about its material and how it compares with other items in Liyau.`, selectedProduct);
                    }}
                    className="mt-2 text-red-700 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ask Liyau Thinker Now</span>
                    <Sparkles className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Purchase Module (Right: 6 cols) */}
            <div className="md:col-span-6 space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 font-heading leading-tight">
                  {selectedProduct.name}
                </h2>

                {/* Stock Status */}
                <div className="flex items-center gap-3 text-xs mt-2 text-zinc-600">
                  <span className={`font-semibold ${selectedProduct.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {selectedProduct.stock > 0 ? `${selectedProduct.stock} In Stock (Butwal, Nepal)` : 'Currently Sold Out'}
                  </span>
                </div>
              </div>

              {/* Pricing Block */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    {isDiscountActive ? (
                      <>
                        <span className="text-base sm:text-lg text-zinc-400 line-through tabular-nums">
                          Rs. {selectedProduct.price.toLocaleString()}
                        </span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tabular-nums">
                          Rs. {effectivePrice.toLocaleString()}
                        </span>
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-2xs">
                          {discountPercent}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tabular-nums">
                        Rs. {selectedProduct.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {isDiscountActive && (
                    <p className="text-xs font-medium text-emerald-700">
                      You save Rs. {(selectedProduct.price - effectivePrice).toLocaleString()} with this special deal
                    </p>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Inclusive of all taxes. Fast, secure digital checkout via eSewa, Khalti & Mobile Banking.
                </p>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs uppercase font-semibold text-zinc-400 tracking-wider mb-1.5">Description</h4>
                <p className="text-sm text-zinc-700 leading-relaxed font-normal">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Variants: Colors */}
              {selectedProduct.variants?.colors && selectedProduct.variants.colors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-900">Color / Finish:</span>
                    <span className="text-zinc-600 font-medium">{selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedProduct.variants.colors.map(col => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setSelectedColor(col.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          selectedColor === col.name
                            ? 'border-red-600 bg-red-50 text-red-900 ring-1 ring-red-600/30'
                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        {col.hex && (
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 inline-block shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                        )}
                        <span>{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants: Sizes */}
              {selectedProduct.variants?.sizes && selectedProduct.variants.sizes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-900">Select Size / Pack:</span>
                    <span className="text-zinc-600 font-medium">{selectedSize}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedProduct.variants.sizes.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selectedSize === size
                            ? 'border-red-600 bg-red-600 text-white shadow-xs'
                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-900">Quantity:</span>
                <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-200 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold tabular-nums text-zinc-900 min-w-[32px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(selectedProduct.stock, q + 1))}
                    disabled={quantity >= selectedProduct.stock}
                    className="px-3 py-1.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-200 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-zinc-500">Max {selectedProduct.stock} units</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Delivery info bullets */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Butwal, Nepal delivery: 24-48 hrs (Free over Rs. 2,000) · Nationwide 2-4 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Official QR Payment via eSewa, Khalti &amp; Mobile Banking (Admin Verified)</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>7-Day Return and Replacement Policy</span>
                </div>
              </div>
            </div>

          </div>

          {/* Specifications Table */}
          {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
            <div className="pt-6 border-t border-zinc-200">
              <h3 className="text-base font-bold text-zinc-900 font-heading mb-4">
                Product Specifications
              </h3>
              <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-200 text-xs">
                {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 sm:grid-cols-4 p-3 bg-white hover:bg-zinc-50 transition-colors">
                    <span className="font-semibold text-zinc-600 col-span-1">{key}</span>
                    <span className="text-zinc-900 col-span-2 sm:col-span-3">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
