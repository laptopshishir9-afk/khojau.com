import React from 'react';
import { ShoppingBag, Heart, Sparkles } from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useStore } from '../context/StoreContext.tsx';
import { resolveAssetUrl } from '../services/fallbackStore.ts';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    openProductDetail,
    addToCart,
    toggleWishlist,
    isInWishlist,
    openAiWithPrompt
  } = useStore();

  const isFavorited = isInWishlist(product.id);
  const isDiscountActive = Boolean(product.isDiscountActive && product.discountPrice && product.discountPrice < product.price);
  const effectivePrice = isDiscountActive ? (product.discountPrice as number) : product.price;
  const discountPercent = isDiscountActive
    ? (product.discountPercentage || Math.round(((product.price - (product.discountPrice as number)) / product.price) * 100))
    : 0;
  const isOutOfStock = product.stock <= 0;

  const handleCardClick = () => {
    openProductDetail(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1, product.variants?.sizes?.[0], product.variants?.colors?.[0]?.name);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleAskAi = (e: React.MouseEvent) => {
    e.stopPropagation();
    openAiWithPrompt(`Tell me more about ${product.name}. Is it in stock in Butwal and what is the current price?`, product);
  };

  const primaryImage = resolveAssetUrl(product.images?.[0] || '/src/assets/images/hero_nepal_shopping_1790995906814.jpg');

  return (
    <article
      onClick={handleCardClick}
      className="group relative bg-white border border-zinc-200/90 rounded-xl overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full min-w-0"
    >
      {/* Visual Image Container (Consistent 1:1 on mobile, 4:3 on tablet/desktop) */}
      <div className="relative aspect-square sm:aspect-4/3 bg-zinc-100 overflow-hidden w-full">
        <img
          src={primaryImage}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Wishlist toggle */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
            isFavorited
              ? 'bg-red-50 text-red-600 shadow-xs'
              : 'bg-white/85 text-zinc-500 hover:text-red-600 hover:bg-white'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorited ? 'fill-current text-red-600' : ''}`} />
        </button>

        {/* Discount & Stock Indicator */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {isDiscountActive && (
            <span className="bg-red-600 text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-sm tracking-tight shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-zinc-900 text-white text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Ask AI button on hover (Desktop) */}
        <button
          type="button"
          onClick={handleAskAi}
          className="hidden sm:flex absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white text-zinc-800 text-[11px] font-semibold px-2 py-1 rounded shadow-xs items-center gap-1 cursor-pointer"
          title="Ask Liyau Thinker about this item"
        >
          <Sparkles className="w-3 h-3 text-red-600" />
          <span>Ask Liyau Thinker</span>
        </button>
      </div>

      {/* Product Content Details */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between min-w-0">
        <div className="min-w-0">
          {/* Category */}
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs text-zinc-500 mb-1">
            <span className="uppercase tracking-wider font-semibold text-zinc-400 truncate">
              {product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-zinc-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug break-words">
            {product.name}
          </h3>

          {/* Short description preview (Desktop/Tablet) */}
          <p className="hidden sm:block text-xs text-zinc-500 line-clamp-1 mt-1 font-normal">
            {product.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-zinc-100 flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base md:text-lg font-extrabold text-zinc-950 tabular-nums">
                Rs. {effectivePrice.toLocaleString()}
              </span>
              {isDiscountActive && (
                <span className="text-[10px] sm:text-xs text-zinc-400 line-through tabular-nums">
                  Rs. {product.price.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium truncate">
              {isDiscountActive ? `Save Rs. ${(product.price - effectivePrice).toLocaleString()}` : 'Verified Genuine'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full sm:w-auto min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
              isOutOfStock
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-900 text-white hover:bg-red-600 active:scale-95'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
