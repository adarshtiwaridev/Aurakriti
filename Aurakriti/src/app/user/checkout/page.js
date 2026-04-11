'use client';

import { useCart } from '@/hooks/useCart';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Lock, CheckCircle2, Package, CreditCard, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { clearCart, setCart } from '@/redux/slices/cartSlice';
import Navbar from '@/components/ecommerce/Navbar';
import { clearServerCart } from '@/services/cartService';
import { createCheckout, finalizeOrder, processPayment } from '@/services/paymentService';

export default function CheckoutPage() {
  const { cartItems = [], totalPrice = 0, shippingCost = 0, cartCount } = useCart();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, initialized, isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    contact: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setUserDetails((prev) => ({
      ...prev,
      name: user?.name || prev.name,
      email: user?.email || prev.email,
    }));
  }, [user?.email, user?.name]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      toast.error('Please login to proceed');
      router.replace('/auth/login?redirect=/user/checkout');
      return;
    }
    if (user?.role !== 'user') {
      toast.error('Seller accounts cannot place buyer orders.');
      router.replace(user?.role === 'seller' ? '/seller/dashboard' : '/admin/dashboard');
    }
  }, [initialized, isAuthenticated, router, user?.role]);

  const validateForm = () => {
    const newErrors = {};
    if (!userDetails.name.trim()) newErrors.name = 'Name is required';
    if (!userDetails.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDetails.email)) newErrors.email = 'Invalid email';
    if (!userDetails.address.trim()) newErrors.address = 'Address is required';
    if (!userDetails.city.trim()) newErrors.city = 'City is required';
    if (!userDetails.contact.trim()) newErrors.contact = 'Phone is required';
    if (!/^\d{10}$/.test(userDetails.contact.replace(/\D/g, ''))) newErrors.contact = 'Invalid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }
    setIsProcessing(true);
    try {
      let order;
      if (paymentMethod === 'cod') {
        const checkoutData = await createCheckout(userDetails, 'cod');
        order = await finalizeOrder(checkoutData.orderId, { method: 'cod' });
      } else {
        const checkoutData = await createCheckout(userDetails);
        order = await processPayment({ checkoutData, customer: userDetails });
      }
      dispatch(clearCart());
      dispatch(setCart([]));
      try { await clearServerCart(); } catch { /* ignore */ }
      setPlacedOrderId(order.id);
      setOrderPlaced(true);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('eco_last_order_id', String(order.id));
      }
      toast.success(paymentMethod === 'cod' ? 'Order placed with Cash on Delivery!' : 'Order placed successfully!');
    } catch (error) {
      toast.error(error.message || 'Unable to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fffcf8] to-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="h-12 w-12 rounded-full border-4 border-[#f2e5d4] border-t-[#c9a14a] mx-auto mb-4"
          />
          <p className="text-[#6b5645]">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fffcf8] to-white">
        <Navbar cartCount={cartCount} searchTerm="" onSearch={() => {}} />
        <div className="mx-auto max-w-7xl px-4 py-8 pt-28 sm:px-6 lg:px-8">
          <Link href="/user/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7b6652] hover:text-[#c9a14a] transition mb-8">
            <ChevronLeft size={16} /> Back to Cart
          </Link>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-[#eadfce] bg-white p-16 text-center shadow-sm">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="luxury-serif text-3xl text-[#3d2f24]">Your Cart is Empty</h2>
            <p className="mt-2 text-[#7b6652]">Add some beautiful jewellery pieces before checkout.</p>
            <Link href="/" className="mt-6 inline-flex rounded-full bg-[#c9a14a] px-8 py-3 text-sm font-semibold text-white hover:bg-[#b88f37] transition-all hover:scale-105">
              Explore Collection
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fffcf8] to-white flex items-center justify-center px-4 pt-20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }} className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#fff4de] to-[#ffe5b4] mx-auto shadow-lg">
            <CheckCircle2 size={48} className="text-[#c9a14a]" />
          </motion.div>
          <h1 className="luxury-serif text-4xl text-[#3d2f24] mb-3">Order Confirmed!</h1>
          <p className="text-[#7b6652] mb-2">Thank you for choosing Aurakriti!</p>
          <p className="text-sm text-[#9b7a48] mb-8">Your jewellery will be carefully prepared and shipped.</p>
          <div className="bg-white rounded-2xl border border-[#eadfce] p-6 mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9b7a48]">Order ID</p>
            <p className="luxury-serif text-2xl text-[#c9a14a] mt-2 font-bold">{placedOrderId}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/user/dashboard" className="rounded-full bg-[#c9a14a] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#b88f37] shadow-lg transition-all hover:scale-105 block">Track Order</Link>
            <Link href="/" className="rounded-full border-2 border-[#c9a14a] px-8 py-3.5 text-sm font-semibold text-[#c9a14a] hover:bg-[#fff4de] transition-all">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const finalTotal = totalPrice + shippingCost;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffcf8] to-white">
      <Navbar cartCount={cartCount} searchTerm="" onSearch={() => {}} />
      <div className="mx-auto max-w-7xl px-4 py-8 pt-28 sm:px-6 lg:px-8">
        <Link href="/user/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7b6652] hover:text-[#c9a14a] transition mb-8">
          <ChevronLeft size={16} /> Back to Cart
        </Link>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="luxury-serif text-4xl text-[#3d2f24]">Secure Checkout</h1>
          <p className="mt-2 text-[#7b6652]">Complete your jewellery order</p>
        </motion.div>

        <form onSubmit={handleCheckout} className="grid gap-8 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-2 space-y-6">
            
            {/* Delivery Details */}
            <div className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4de]">
                  <Truck size={20} className="text-[#c9a14a]" />
                </div>
                <h2 className="luxury-serif text-xl text-[#3d2f24]">Delivery Details</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {[
                  ['name', 'Full Name', 'Your name', true],
                  ['email', 'Email Address', 'you@example.com', true],
                  ['contact', 'Phone Number', '9876543210', true],
                  ['city', 'City', 'New Delhi', true],
                  ['state', 'State', 'Delhi', false],
                  ['postalCode', 'Postal Code', '110001', false],
                ].map(([name, label, placeholder, required]) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-[#5a4a3c] mb-2">
                      {label} {required && <span className="text-[#d97706]">*</span>}
                    </label>
                    <input
                      type={name === 'email' ? 'email' : 'text'}
                      name={name}
                      value={userDetails[name]}
                      onChange={handleInputChange}
                      placeholder={placeholder}
                      className={`w-full rounded-xl border ${errors[name] ? 'border-[#d97706]' : 'border-[#e7dccf]'} bg-white px-4 py-3 text-sm text-[#3d2f24] placeholder:text-[#b8a78b] outline-none transition focus:border-[#c9a14a] focus:ring-4 focus:ring-[#fffdf8]`}
                    />
                    {errors[name] && <p className="mt-1 text-xs text-[#d97706]">{errors[name]}</p>}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#5a4a3c] mb-2">
                    Street Address <span className="text-[#d97706]">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={userDetails.address}
                    onChange={handleInputChange}
                    placeholder="House/flat number, street, landmark..."
                    rows={3}
                    className={`w-full rounded-xl border ${errors.address ? 'border-[#d97706]' : 'border-[#e7dccf]'} bg-white px-4 py-3 text-sm text-[#3d2f24] placeholder:text-[#b8a78b] outline-none transition focus:border-[#c9a14a] focus:ring-4 focus:ring-[#fffdf8] resize-none`}
                  />
                  {errors.address && <p className="mt-1 text-xs text-[#d97706]">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4de]">
                  <CreditCard size={20} className="text-[#c9a14a]" />
                </div>
                <h2 className="luxury-serif text-xl text-[#3d2f24]">Payment Method</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when order arrives', icon: '💵' },
                  { value: 'online', label: 'Online Payment', sub: 'Razorpay · UPI · Cards', icon: '💳' },
                ].map(({ value, label, sub, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-all ${paymentMethod === value ? 'border-[#c9a14a] bg-[#fff4de] ring-2 ring-[#f2e5d4]' : 'border-[#e7dccf] hover:border-[#d9cec1]'}`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="font-bold text-[#3d2f24] text-sm">{label}</span>
                    <span className="text-xs text-[#9b7a48]">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4de]">
                  <Package size={20} className="text-[#c9a14a]" />
                </div>
                <h2 className="luxury-serif text-xl text-[#3d2f24]">Order Items ({cartItems.length})</h2>
              </div>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-[#f2e5d4] pb-4 last:border-0">
                    <div className="flex items-center gap-4 flex-1">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-16 w-16 rounded-xl object-cover border border-[#eadfce]" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-[#f9f0e3] flex items-center justify-center text-xl">💎</div>
                      )}
                      <div>
                        <p className="font-semibold text-[#3d2f24]">{item.title}</p>
                        <p className="text-sm text-[#9b7a48]">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold text-[#c9a14a]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Price Summary Sidebar */}
          <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="lg:col-span-1">
            <div className="sticky top-32 rounded-3xl border border-[#eadfce] bg-gradient-to-b from-white to-[#fffcf8] p-6 shadow-sm">
              <h3 className="luxury-serif text-xl text-[#3d2f24] mb-6">Price Summary</h3>

              <div className="space-y-3 border-b border-[#f2e5d4] pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-[#7b6652]">Subtotal ({cartItems.length} items)</p>
                  <p className="font-semibold text-[#3d2f24]">₹{totalPrice.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[#7b6652]">Shipping</p>
                  <p className="font-semibold text-[#3d2f24]">{shippingCost === 0 ? <span className="text-green-600">Free</span> : `₹${shippingCost}`}</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 text-lg border-b border-[#f2e5d4] mb-4">
                <p className="font-black text-[#3d2f24]">Total</p>
                <p className="luxury-serif font-black text-[#c9a14a]">₹{finalTotal.toLocaleString('en-IN')}</p>
              </div>

              <div className="flex items-center gap-2 mb-6 px-3 py-3 rounded-xl bg-[#fef3c7] border border-[#f2e5d4]">
                <Lock size={16} className="text-[#c9a14a] flex-shrink-0" />
                <p className="text-xs text-[#9f7a40]">Secured with SSL encryption</p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-full bg-[#c9a14a] px-6 py-3.5 font-semibold text-white transition-all disabled:bg-[#d9cec1] hover:bg-[#b88f37] hover:shadow-lg active:scale-95"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                    />
                    Processing...
                  </span>
                ) : (
                  `${paymentMethod === 'cod' ? 'Place COD Order' : 'Pay Now'} · ₹${finalTotal.toLocaleString('en-IN')}`
                )}
              </button>

              <p className="mt-4 text-center text-xs text-[#9b7a48]">
                {paymentMethod === 'cod' ? '✓ Pay at the time of delivery' : '🔒 100% secure online payment'}
              </p>
            </div>
          </motion.aside>
        </form>
      </div>
    </div>
  );
}
