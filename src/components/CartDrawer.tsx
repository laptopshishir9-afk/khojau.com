import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Truck, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartItemCount,
    setIsCheckoutOpen,
    settings
  } = useStore();

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = settings?.freeDeliveryThreshold || 2000;
  const isFreeDeliveryEligible = cartSubtotal >= freeDeliveryThreshold;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-zinc-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-zinc-900 font-heading">
              Shopping Cart ({cartItemCount})
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Incentive Bar */}
        <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-200 text-xs">
          {isFreeDeliveryEligible ? (
            <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Congratulations! You qualify for Free Delivery in Butwal, Nepal!</span>
            </p>
          ) : (
            <div>
              <p className="text-zinc-600">
                Add <span className="font-bold text-red-600">Rs. {amountNeededForFreeDelivery.toLocaleString()}</span> more for <span className="font-semibold text-zinc-900">Free Butwal Delivery</span>
              </p>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-red-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 font-heading">Your cart is empty</h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                Explore handwoven cashmere, pure orthodox teas, and trending electronics delivered nationwide.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item, idx) => {
              const hasDiscount = Boolean(item.product.isDiscountActive !== false && item.product.discountPrice && item.product.discountPrice < item.product.price);
              const effectivePrice = hasDiscount ? (item.product.discountPrice as number) : item.product.price;
              const image = item.product.images?.[0] || '/src/assets/images/hero_nepal_shopping_1790995906814.jpg';

              return (
                <div
                  key={`${item.productId}-${item.selectedSize}-${item.selectedColor}-${idx}`}
                  className="flex gap-3 p-3 bg-white border border-zinc-200 rounded-xl"
                >
                  <img
                    src={image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-18 h-18 rounded-lg object-cover bg-zinc-100 shrink-0 border border-zinc-100"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-zinc-900 truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.productId, item.selectedSize, item.selectedColor)}
                          className="text-zinc-400 hover:text-red-600 p-0.5"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant tags */}
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {item.selectedSize && `Size: ${item.selectedSize}`}
                          {item.selectedSize && item.selectedColor && ' · '}
                          {item.selectedColor && `Color: ${item.selectedColor}`}
                        </p>
                      )}

                      <div className="flex items-baseline gap-1.5 mt-1">
                        {hasDiscount && (
                          <span className="text-[11px] text-zinc-400 line-through tabular-nums">
                            Rs. {item.product.price.toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs font-bold text-zinc-900 tabular-nums">
                          Rs. {effectivePrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100">
                      <div className="flex items-center border border-zinc-200 rounded bg-zinc-50">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.selectedSize, item.selectedColor)}
                          className="px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.selectedSize, item.selectedColor)}
                          className="px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 tabular-nums">
                        Rs. {(effectivePrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-zinc-200 bg-white space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900 tabular-nums">
                  Rs. {cartSubtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Estimated Delivery</span>
                <span className="font-medium text-emerald-700">
                  {isFreeDeliveryEligible ? 'Free in Butwal, Nepal' : 'Calculated at checkout'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-100">
                <span>Estimated Total</span>
                <span className="text-base text-red-600 tabular-nums">
                  Rs. {cartSubtotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Secure Digital Checkout · 7-Day Returns</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
