'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useDispatch } from 'react-redux';
import { decrementQuantity, incrementQuantity, removeFromCart, setCart } from '@/redux/slices/cartSlice';
import CartItem from '@/components/CartItem';
import { ChevronLeft, CreditCard, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { removeCartItem, updateCartItem } from '@/services/cartService';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const dispatch = useDispatch();
  const cart = useCart();
  const cartItems = cart?.items || [];
  const cartLoading = cart?.loading;
  const cartError = cart?.error;
  const refreshCart = cart?.refreshCart;
  const [isMounted, setIsMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { initialized, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (isAuthenticated && user?.role !== 'user') {
      router.replace(user?.role === 'seller' ? '/seller/dashboard' : '/admin/dashboard');
    }
  }, [initialized, isAuthenticated, router, user?.role]);

  const totalPrice = cartItems.reduce((total, item) => total + (item?.price || 0) * (item?.quantity || 0), 0);

  const syncCart = async (id, quantity) => {
    setIsUpdating(true);

    try {
      const data = await updateCartItem(id, quantity);
      dispatch(setCart(data.items ?? []));
      toast.success('Quantity updated');
    } catch (error) {
      toast.error(error.message || 'Unable to update cart');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = (id) => {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    if (!isAuthenticated || item.source === 'local') {
      dispatch(incrementQuantity(id));
      return;
    }

    syncCart(id, item.quantity + 1);
  };

  const handleDecrement = (id) => {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item || item.quantity <= 1) {
      return;
    }

    if (!isAuthenticated || item.source === 'local') {
      dispatch(decrementQuantity(id));
      return;
    }

    syncCart(id, item.quantity - 1);
  };

  const handleRemove = async (id, title) => {
    if (!isAuthenticated || cartItems.find((item) => item.id === id)?.source === 'local') {
      dispatch(removeFromCart(id));
      toast.success(`${title} removed from cart`);
      return;
    }

    setIsUpdating(true);

    try {
      const data = await removeCartItem(id);
      dispatch(setCart(data.items ?? []));
      toast.success(`${title} removed from cart`);
    } catch (error) {
      toast.error(error.message || 'Unable to remove item');
    } finally {
      setIsUpdating(false);
    }
  };

  const shippingCost = totalPrice > 1000 ? 0 : 50;
  const totalWithShipping = totalPrice + shippingCost;
  const itemCount = cartItems.reduce((count, item) => count + (item?.quantity || 0), 0);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fffcf8] to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-[#f2e5d4] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffcf8] to-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10"
        >
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#7b6652] transition-all duration-300 hover:text-[#c9a14a]"
          >
            <span className="rounded-full bg-[#f9f0e3] p-2 transition group-hover:bg-[#fff4de]">
              <ChevronLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
            </span>
            Continue Shopping
          </Link>

          <div className="overflow-hidden rounded-[2rem] border border-[#eadfce] bg-[radial-gradient(circle_at_top_left,_rgba(255,238,206,0.9),_transparent_36%),linear-gradient(135deg,_#fffdf9_0%,_#fff7eb_55%,_#ffffff_100%)] p-6 shadow-[0_35px_100px_-70px_rgba(140,98,35,0.6)] md:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#b99662] shadow-sm">
                  <Sparkles size={14} />
                  Premium Cart
                </div>
                <h1 className="luxury-serif mt-5 text-4xl text-[#3d2f24] md:text-5xl">
                  Curated for checkout
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[#7b6652] md:text-base">
                  Review your selected pieces, adjust quantities, and move through a smooth, secure checkout experience.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
                <StatPill label="Line Items" value={cartItems.length} />
                <StatPill label="Units" value={itemCount} />
                <StatPill label="Subtotal" value={`₹${totalPrice.toFixed(0)}`} />
              </div>
            </div>
          </div>
        </motion.div>
        {cartLoading && isAuthenticated ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-[2rem] bg-gradient-to-r from-[#f7ecd9] via-[#fff7ea] to-[#f7ecd9]" />
              ))}
            </div>
            <div className="h-72 animate-pulse rounded-[2rem] bg-gradient-to-r from-[#f7ecd9] via-[#fff7ea] to-[#f7ecd9]" />
          </div>
        ) : cartError && isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-[2rem] border border-[#f3d2d2] bg-white p-10 text-center shadow-sm"
          >
            <h2 className="luxury-serif text-2xl text-[#3d2f24]">Unable to load cart</h2>
            <p className="mt-3 text-[#7b6652]">{cartError}</p>
            <button
              type="button"
              onClick={() => refreshCart?.({ mergeGuestItems: false })}
              className="mt-6 inline-flex rounded-full bg-[#c9a14a] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition-transform hover:scale-105"
            >
              Retry
            </button>
          </motion.div>
        ) : cartItems.length === 0 ? (
          // Empty Cart State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-[2rem] border border-[#eadfce] bg-white p-16 text-center shadow-sm"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-gradient-to-br from-[#fff4de] to-[#ffe5b4]">
              <ShoppingBag size={48} className="text-[#c9a14a]" />
            </div>
            <h2 className="luxury-serif text-2xl text-[#3d2f24]">Your Cart is Empty</h2>
            <p className="mt-3 text-[#7b6652]">Explore our elegant jewellery collection and add your favourite pieces.</p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-full bg-[#c9a14a] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white hover:bg-[#b88f37] shadow-lg shadow-[#c9a14a30] transition-transform hover:scale-105"
            >
              Shop Now
            </Link>
          </motion.div>
        ) : (
          // Cart Items
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-8 lg:grid-cols-[1fr_360px]"
          >
            <motion.div className="space-y-5">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item?.id}
                  variants={itemVariants}
                  custom={index}
                >
                  <CartItem
                    item={item}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onRemove={() => handleRemove(item.id, item.title)}
                    disabled={isUpdating}
                  />
                </motion.div>
              ))}
            </motion.div>

            <motion.aside
              variants={itemVariants}
              className="sticky top-32 h-fit overflow-hidden rounded-[2rem] border border-[#eadfce] bg-gradient-to-b from-white via-[#fffcf8] to-[#fff8ef] p-6 shadow-[0_32px_90px_-70px_rgba(146,110,50,0.8)]"
            >
              <div className="rounded-[1.5rem] bg-[#fff7ea] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b99662]">Checkout Summary</p>
                <h2 className="luxury-serif mt-2 text-2xl text-[#3d2f24]">Ready when you are</h2>
                <p className="mt-2 text-sm leading-6 text-[#7b6652]">
                  Every item stays saved until your order is placed successfully.
                </p>
              </div>

              <div className="mt-6 space-y-4 border-b border-[#f2e5d4] pb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#7b6652]">Subtotal</span>
                  <span className="font-semibold text-[#3d2f24]">₹{totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#7b6652]">Shipping</span>
                  <div className="text-right">
                    <span className="font-semibold text-[#3d2f24]">{shippingCost === 0 ? 'Free' : `₹${shippingCost}`}</span>
                    {shippingCost === 0 && (
                      <p className="mt-1 text-xs text-[#9b7a48]">Free shipping unlocked</p>
                    )}
                  </div>
                </div>

                {shippingCost > 0 && (
                  <div className="rounded-xl bg-[#fef3c7] p-3 text-xs text-[#9f7a40]">
                    Add ₹{(1000 - totalPrice).toFixed(2)} more for free shipping!
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between text-lg">
                <span className="font-black text-[#3d2f24]">Total</span>
                <span className="luxury-serif text-3xl font-black text-[#c9a14a]">₹{totalWithShipping.toFixed(2)}</span>
              </div>

              <Link
                href={isAuthenticated ? "/user/checkout" : "/auth/login?redirect=/user/checkout"}
                aria-disabled={isUpdating}
                className="mt-8 block w-full rounded-full bg-[#c9a14a] px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-[#c9a14a30] transition-all hover:bg-[#b88f37] hover:shadow-xl hover:shadow-[#c9a14a40] disabled:bg-[#d9cec1] disabled:text-[#9b7a48]"
              >
                {isUpdating ? 'Updating...' : isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
              </Link>

              <div className="mt-6 space-y-3 rounded-[1.4rem] border border-[#f2e5d4] bg-white/70 p-4">
                <TrustRow icon={ShieldCheck} text="Secure checkout with protected payment flow" />
                <TrustRow icon={Truck} text="Fast dispatch and delivery updates" />
                <TrustRow icon={CreditCard} text="No cart clearing until payment is confirmed" />
              </div>

              <p className="mt-4 text-center text-xs text-[#9b7a48]">
                {isAuthenticated ? 'Your cart is synced to your account.' : 'Guest cart stays saved in this browser until you sign in.'}
              </p>
            </motion.aside>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-[1.4rem] border border-[#f1e5d6] bg-white/85 px-4 py-4 shadow-sm backdrop-blur">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b99662]">{label}</p>
      <p className="mt-2 text-xl font-black text-[#3d2f24]">{value}</p>
    </div>
  );
}

function TrustRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#6f5a45]">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff4de] text-[#c9a14a]">
        <Icon size={16} />
      </div>
      <span>{text}</span>
    </div>
  );
}
