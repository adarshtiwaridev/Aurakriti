'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useDispatch } from 'react-redux';
import { setCart } from '@/redux/slices/cartSlice';
import CartItem from '@/components/CartItem';
import Navbar from '@/components/ecommerce/Navbar';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
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

    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/user/cart');
      return;
    }

    if (user?.role !== 'user') {
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

    syncCart(id, item.quantity + 1);
  };

  const handleDecrement = (id) => {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item || item.quantity <= 1) {
      return;
    }

    syncCart(id, item.quantity - 1);
  };

  const handleRemove = async (id, title) => {
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
      <Navbar cartCount={cartItems.length} searchTerm="" onSearch={() => {}} />
      <div className="mx-auto max-w-7xl px-4 py-8 pt-28 sm:px-6 lg:px-8">
        {/* Header */}
<motion.div
  initial={{ opacity: 0, y: -30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
  className="mb-10"
>
  {/* Back to Shop */}
  <Link
    href="/"
    className="group inline-flex items-center gap-2 text-sm font-semibold text-[#7b6652] hover:text-[#c9a14a] transition-all duration-300 mb-6"
  >
    <span className="p-2 rounded-full bg-[#f9f0e3] group-hover:bg-[#fff4de] transition">
      <ChevronLeft
        size={16}
        className="group-hover:-translate-x-1 transition-transform duration-300"
      />
    </span>
    Continue Shopping
  </Link>

  {/* Heading Section */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    
    {/* Title */}
    <div>
      <h1 className="luxury-serif text-3xl md:text-5xl text-[#3d2f24]">
        Your Cart
      </h1>

      <p className="mt-2 text-[#7b6652] text-sm md:text-base">
        You have{" "}
        <span className="font-semibold text-[#c9a14a]">
          {cartItems.length}
        </span>{" "}
        {cartItems.length === 1 ? "item" : "items"} in your cart
      </p>
    </div>

    {/* Badge */}
    <div className="self-start md:self-auto">
      <span className="px-4 py-2 rounded-full bg-[#fff4de] text-[#c9a14a] text-sm font-semibold shadow-sm">
        ✨ Premium Collection
      </span>
    </div>
  </div>
</motion.div>
        {cartItems.length === 0 ? (
          // Empty Cart State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-[#eadfce] bg-white p-16 text-center shadow-sm"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#fff4de] to-[#ffe5b4]">
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
            {/* Cart Items List */}
            <motion.div className="space-y-4">
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
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Order Summary Sidebar */}
            <motion.aside
              variants={itemVariants}
              className="sticky top-32 h-fit rounded-3xl border border-[#eadfce] bg-gradient-to-b from-white to-[#fffcf8] p-6 shadow-sm"
            >
              <h2 className="luxury-serif text-xl text-[#3d2f24] mb-6">Price Summary</h2>

              <div className="space-y-4 border-b border-[#f2e5d4] pb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#7b6652]">Subtotal</span>
                  <span className="font-semibold text-[#3d2f24]">₹{totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#7b6652]">Shipping</span>
                  <div className="text-right">
                    <span className="font-semibold text-[#3d2f24]">{shippingCost === 0 ? 'Free' : `₹${shippingCost}`}</span>
                    {shippingCost === 0 && (
                      <p className="text-xs text-[#9b7a48] mt-1">✓ Free shipping</p>
                    )}
                  </div>
                </div>

                {shippingCost > 0 && (
                  <div className="rounded-lg bg-[#fef3c7] p-2 text-xs text-[#9f7a40]">
                    Add ₹{(1000 - totalPrice).toFixed(2)} more for free shipping!
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between text-lg">
                <span className="font-black text-[#3d2f24]">Total</span>
                <span className="luxury-serif text-2xl font-black text-[#c9a14a]">₹{totalWithShipping.toFixed(2)}</span>
              </div>

              <Link
                href="/user/checkout"
                aria-disabled={isUpdating}
                className="mt-8 block w-full rounded-full bg-[#c9a14a] px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-[#c9a14a30] hover:bg-[#b88f37] transition-all hover:shadow-xl hover:shadow-[#c9a14a40] disabled:bg-[#d9cec1] disabled:text-[#9b7a48]"
              >
                {isUpdating ? 'Updating...' : 'Proceed to Checkout'}
              </Link>

              <p className="mt-4 text-center text-xs text-[#9b7a48]">🔒 Secure checkout</p>
            </motion.aside>
          </motion.div>
        )}
      </div>
    </div>
  );
}
