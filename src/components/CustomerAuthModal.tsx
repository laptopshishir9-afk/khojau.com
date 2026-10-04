import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, MapPin, Package, Heart, LogOut, CheckCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import * as api from '../services/api.ts';
import type { Order } from '../types/index.ts';

export const CustomerAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    currentUser,
    customerToken,
    loginCustomer,
    registerCustomer,
    logoutCustomer,
    loginAdmin,
    products,
    openProductDetail,
    wishlist,
    showToast,
    setIsAdminDashboardOpen
  } = useStore();

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regStreet, setRegStreet] = useState('');
  const [regCity, setRegCity] = useState('Butwal');
  const [regZone, setRegZone] = useState<'kathmandu_valley' | 'outside_valley'>('kathmandu_valley');

  const [isLoading, setIsLoading] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    setAuthError(null);
  }, [isAuthModalOpen, authMode]);

  useEffect(() => {
    if (isAuthModalOpen && currentUser) {
      setIsLoadingOrders(true);
      api.fetchCustomerOrders({ customerId: currentUser.id, customerEmail: currentUser.email })
        .then(orders => setMyOrders(orders))
        .catch(err => console.error(err))
        .finally(() => setIsLoadingOrders(false));
    }
  }, [isAuthModalOpen, currentUser]);

  if (!isAuthModalOpen) return null;

  const triggerError = (msg: string) => {
    setAuthError(msg);
    setErrorKey(prev => prev + 1);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    const trimmedIdentifier = loginEmail.trim();
    try {
      // Allow admin credentials (username "admin" or admin email) to log in directly from here too
      if (
        trimmedIdentifier.toLowerCase() === 'admin' ||
        trimmedIdentifier.toLowerCase() === 'admin@liyau.com' ||
        trimmedIdentifier.toLowerCase() === 'admin@khojau.com'
      ) {
        try {
          await loginAdmin(trimmedIdentifier, loginPassword);
          setIsAuthModalOpen(false);
          setLoginPassword('');
          return;
        } catch {
          // If not matching admin password, fall through or show error inside login panel
        }
      }
      await loginCustomer(trimmedIdentifier, loginPassword);
      setLoginPassword('');
    } catch (err: any) {
      triggerError(err.message || 'Login Failed! Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    try {
      await registerCustomer({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        address: {
          street: regStreet.trim(),
          city: regCity.trim(),
          zone: regZone
        }
      });
    } catch (err: any) {
      triggerError(err.message || 'Registration Failed! Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-zinc-900 font-heading">
              {currentUser
                ? 'My Liyau Account'
                : authMode === 'login'
                ? 'Customer Login'
                : 'Create Customer Account'}
            </h2>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {currentUser ? (
            /* Logged In Profile View */
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{currentUser.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{currentUser.email} · {currentUser.phone}</p>
                </div>
                <button
                  onClick={logoutCustomer}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-red-600" />
                  <span>Recent Orders ({myOrders.length})</span>
                </h4>

                {isLoadingOrders ? (
                  <p className="text-xs text-zinc-400 py-3">Loading order history...</p>
                ) : myOrders.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl">
                    <p className="text-xs text-zinc-500">You haven't placed any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map(order => (
                      <div key={order.id} className="p-3.5 bg-white border border-zinc-200 rounded-xl text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900">{order.orderNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              order.orderStatus === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700'
                                : order.orderStatus === 'shipped'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </div>

                        <div className="divide-y divide-zinc-100">
                          {order.items.map((item, i) => (
                            <div key={i} className="py-1 flex justify-between text-zinc-600">
                              <span className="truncate max-w-[220px]">{item.quantity}x {item.name}</span>
                              <span className="font-semibold text-zinc-900 tabular-nums">
                                Rs. {(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-zinc-500">
                          <span>Payment: {order.paymentMethod.toUpperCase()}</span>
                          <span className="font-bold text-zinc-900">Total: Rs. {order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Wishlist quick list */}
              {wishlist.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-zinc-200">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span>My Wishlist ({wishlist.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {products
                      .filter(p => wishlist.includes(p.id))
                      .slice(0, 4)
                      .map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setIsAuthModalOpen(false);
                            openProductDetail(p);
                          }}
                          className="p-2 border border-zinc-200 rounded-lg flex items-center gap-2 cursor-pointer hover:border-red-600 transition-colors"
                        >
                          <img
                            src={p.images?.[0] || ''}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="truncate">
                            <p className="text-xs font-semibold truncate text-zinc-900">{p.name}</p>
                            <p className="text-[11px] text-red-600 font-bold tabular-nums">
                              Rs. {(p.discountPrice || p.price).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : authMode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authError && (
                <div
                  key={errorKey}
                  className="animate-errorShake flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border-2 border-red-500 text-red-700 shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1 text-xs">
                    <p className="font-extrabold text-red-700 uppercase tracking-wide">Login Failed</p>
                    <p className="font-medium text-red-600 mt-0.5">{authError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={e => {
                      setLoginEmail(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="e.g. sujan@gmail.com"
                    className={`w-full text-xs p-2.5 pl-8 bg-zinc-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors ${
                      authError ? 'border-red-500 bg-red-50/40' : 'border-zinc-200'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => {
                      setLoginPassword(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Enter account password"
                    className={`w-full text-xs p-2.5 pl-8 bg-zinc-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors ${
                      authError ? 'border-red-500 bg-red-50/40' : 'border-zinc-200'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isLoading ? 'Signing In...' : 'Log In to Account'}
              </button>

              <div className="pt-2 text-center text-xs text-zinc-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Create New Account
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {authError && (
                <div
                  key={errorKey}
                  className="animate-errorShake flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border-2 border-red-500 text-red-700 shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1 text-xs">
                    <p className="font-extrabold text-red-700 uppercase tracking-wide">Registration Failed</p>
                    <p className="font-medium text-red-600 mt-0.5">{authError}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="e.g. Maya Adhikari"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="maya@gmail.com"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Create Password *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Delivery City</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={e => setRegCity(e.target.value)}
                    placeholder="Butwal"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Zone</label>
                  <select
                    value={regZone}
                    onChange={e => setRegZone(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="kathmandu_valley">Butwal &amp; Rupandehi</option>
                    <option value="outside_valley">Outside Butwal (Nepal Nationwide)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={regStreet}
                    onChange={e => setRegStreet(e.target.value)}
                    placeholder="House number, Street, Ward"
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                {isLoading ? 'Creating Account...' : 'Complete Registration'}
              </button>

              <div className="pt-2 text-center text-xs text-zinc-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="font-bold text-red-600 hover:underline"
                >
                  Log In Here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
