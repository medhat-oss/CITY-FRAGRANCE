'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HiLockClosed, HiChevronDown, HiTag } from 'react-icons/hi2';
import { useCart } from '@/context/CartContext';
import { formatEGP } from '@/utils/currency';
import {
  DEFAULT_GOVERNORATES,
  DEFAULT_SHIPPING_RATES,
} from '@/data/defaults';

interface FormState {
  email: string;
  emailOffers: boolean;
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  governorate: string;
  phone: string;
  shippingMethod: string;
  paymentMethod: string;
  discountCode: string;
}

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const [governorates, setGovernorates] = useState<string[]>(DEFAULT_GOVERNORATES);
  const [shippingRates, setShippingRates] = useState<Record<string, number>>(DEFAULT_SHIPPING_RATES);

  const [form, setForm] = useState<FormState>({
    email: '',
    emailOffers: false,
    country: 'Egypt',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    governorate: '',
    phone: '',
    shippingMethod: 'standard',
    paymentMethod: 'cod',
    discountCode: '',
  });
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'vodafone' | 'instapay' | 'cod' | null>(null);
  const [shippingCost, setShippingCost] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/settings', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.shippingRates && Object.keys(data.shippingRates).length > 0) {
          const rates = data.shippingRates as Record<string, number>;
          setShippingRates(rates);
          setGovernorates(Object.keys(rates));
          if (form.governorate && rates[form.governorate] !== undefined) {
            setShippingCost(rates[form.governorate]);
          }
        }
      })
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm((prev) => ({ ...prev, governorate: '' }));
    setShippingCost(0);
  }, [governorates]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'governorate' && typeof value === 'string') {
      setShippingCost(shippingRates[value] ?? 0);
    }
  };

  const handleApplyDiscount = async () => {
    const code = form.discountCode.trim();
    if (!code) return;
    setDiscountError('');
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountPct(data.discountPct);
        setDiscountApplied(true);
      } else {
        setDiscountError(data.error || 'Invalid coupon code');
        setDiscountApplied(false);
        setDiscountPct(0);
      }
    } catch {
      setDiscountError('Failed to validate coupon. Please try again.');
      setDiscountApplied(false);
      setDiscountPct(0);
    }
  };

  const discountAmount = discountApplied ? Math.round(cartTotal * (discountPct / 100)) : 0;
  const total = cartTotal + shippingCost - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (!selectedPayment) {
      setPaymentError('Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      const items = cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.salePrice ?? item.price,
      }));

      const orderData = {
        customerName: `${form.firstName} ${form.lastName}`,
        phoneNumber: form.phone,
        email: form.email,
        address: form.address,
        apartment: form.apartment,
        city: form.city,
        governorate: form.governorate,
        items,
        totalPrice: total,
        paymentMethod: selectedPayment,
        discountCode: discountApplied ? form.discountCode.trim().toUpperCase() : '',
        discountAmount,
      };

      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save order');
      }

      const orderId = data.order.orderId;
      clearCart();

      if (selectedPayment === 'instapay') {
        router.push(`/order-payment/instapay?orderId=${orderId}`);
      } else if (selectedPayment === 'vodafone') {
        router.push(`/order-payment/vodafone-cash?orderId=${orderId}`);
      } else {
        router.push(`/order-payment/success?orderId=${orderId}`);
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Something went wrong');
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#09142E] flex flex-col items-center justify-center px-4">
        <h2 className="font-heading text-2xl text-navy dark:text-white mb-4">Your cart is empty</h2>
        <Link href="/" className="btn btn-primary">
          Return to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#09142E] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Secure bar */}
      <div className="bg-white dark:bg-brandDark-card border-b border-gray-100 dark:border-slate-800 px-6 sm:px-10 py-1.5 flex justify-end items-center gap-1.5 text-xs tracking-wide text-gray-400 dark:text-slate-400">
        <HiLockClosed className="text-xs" />
        <span>Secure Checkout</span>
      </div>

      {/* ===== Two-Column Layout ===== */}
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_480px]">
        {/* ═══ LEFT: Form ═══ */}
        <form onSubmit={handleSubmit} className="px-4 sm:px-10 pt-0 pb-0">
          {/* Logo */}
          <Link href="/" className="block my-0 bg-transparent">
            <Image
              src="/images/checkout-logo.png"
              alt="City Fragrance"
              width={220}
              height={90}
              style={{ height: 'auto' }}
              className="w-[160px] sm:w-[180px] md:w-[220px] object-contain bg-transparent mix-blend-screen"
              priority
            />
          </Link>

          {/* ── Contact ── */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-lg font-normal text-navy dark:text-white">Contact</h2>
              <span className="font-body text-xs text-ink-lighter dark:text-slate-300">
                Already have an account?{' '}
                <Link href="#" className="text-navy dark:text-white underline underline-offset-2">
                  Log in
                </Link>
              </span>
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 placeholder:text-gray-300 dark:placeholder-slate-400 focus:outline-none focus:border-navy transition-colors"
            />
            <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
              <input
                type="checkbox"
                name="emailOffers"
                checked={form.emailOffers}
                onChange={handleChange}
                className="accent-navy w-4 h-4"
              />
              <span className="font-body text-sm text-ink-lighter dark:text-slate-300">
                Email me with news and offers
              </span>
            </label>
          </section>

          {/* ── Delivery ── */}
          <section className="mb-10">
            <h2 className="font-heading text-lg font-normal text-navy dark:text-white mb-5">Delivery</h2>

            <div className="relative mb-3">
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 appearance-none cursor-pointer focus:outline-none focus:border-navy transition-colors"
              >
                <option>Egypt</option>
              </select>
              <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 placeholder:text-gray-300 dark:placeholder-slate-400 focus:outline-none focus:border-navy transition-colors"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 placeholder:text-gray-300 dark:placeholder-slate-400 focus:outline-none focus:border-navy transition-colors"
              />
            </div>

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 placeholder:text-gray-300 dark:placeholder-slate-400 focus:outline-none focus:border-navy transition-colors mb-3"
            />

            <input
              type="text"
              name="apartment"
              placeholder="Apartment, suite, etc. (optional)"
              value={form.apartment}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 placeholder:text-gray-300 dark:placeholder-slate-400 focus:outline-none focus:border-navy transition-colors mb-3"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 placeholder:text-gray-300 dark:placeholder-slate-400 focus:outline-none focus:border-navy transition-colors"
              />
              <div className="relative">
                <select
                  name="governorate"
                  value={form.governorate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 appearance-none cursor-pointer focus:outline-none focus:border-navy transition-colors"
                >
                  <option value="">Governorate</option>
                  {governorates.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              </div>
            </div>

            <input
              type="tel"
              name="phone"
              placeholder="Phone (e.g. 01xxxxxxxxx)"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 placeholder:text-gray-300 dark:placeholder-slate-400 focus:outline-none focus:border-navy transition-colors"
            />
          </section>

          {/* ── Shipping Method ── */}
          <section className="mb-10">
            <h2 className="font-heading text-lg font-normal text-navy dark:text-white mb-5">
              Shipping method
            </h2>
            <label
              className={`block border-2 rounded-sm p-4 cursor-pointer transition-all duration-300 ease-in-out ${
                form.shippingMethod === 'standard'
                  ? 'border-navy bg-navy/[0.02] dark:bg-navy/20'
                  : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shippingMethod"
                  value="standard"
                  checked={form.shippingMethod === 'standard'}
                  onChange={handleChange}
                  className="accent-navy"
                />
                <div className="flex-1">
                  <span className="block font-heading text-sm font-medium text-navy dark:text-white">
                    Standard Shipping
                  </span>
                  <span className="block font-body text-xs text-ink-lighter dark:text-slate-300 mt-0.5">
                    3–5 business days
                  </span>
                </div>
                <span className="font-heading text-sm font-semibold text-navy dark:text-white">
                  {shippingCost > 0 ? formatEGP(shippingCost) : '—'}
                </span>
              </div>
            </label>
          </section>

          {/* ── Payment ── */}
          <section className="mb-10">
            <h2 className="font-heading text-lg font-normal text-navy dark:text-white mb-2">
              Payment
            </h2>
            <p className="font-body text-xs text-ink-lighter dark:text-slate-300 mb-5">
              Select your preferred payment method
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setSelectedPayment('vodafone')}
                className={`w-full text-left px-5 py-4 border-2 rounded-sm font-heading text-sm font-medium transition-all duration-300 ease-in-out ${
                  selectedPayment === 'vodafone'
                    ? 'border-white bg-white/10 text-white font-bold'
                    : 'border-slate-700 bg-[#11224D] text-white hover:border-white/50'
                }`}
              >
                <span className="block text-base">Vodafone Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayment('instapay')}
                className={`w-full text-left px-5 py-4 border-2 rounded-sm font-heading text-sm font-medium transition-all duration-300 ease-in-out ${
                  selectedPayment === 'instapay'
                    ? 'border-white bg-white/10 text-white font-bold'
                    : 'border-slate-700 bg-[#11224D] text-white hover:border-white/50'
                }`}
              >
                <span className="block text-base">InstaPay</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayment('cod')}
                className={`w-full text-left px-5 py-4 border-2 rounded-sm font-heading text-sm font-medium transition-all duration-300 ease-in-out ${
                  selectedPayment === 'cod'
                    ? 'border-white bg-white/10 text-white font-bold'
                    : 'border-slate-700 bg-[#11224D] text-white hover:border-white/50'
                }`}
              >
                <span className="block text-base">Cash on Delivery</span>
              </button>
            </div>

            <p className="text-xs md:text-sm text-white mb-1.5 font-medium leading-relaxed">
              For Cash on Delivery (COD) orders, our team will contact you via WhatsApp to confirm a secure deposit of less than 15% to finalize your request.
            </p>
            <p className="font-body text-xs text-ink-lighter dark:text-slate-400 mt-2">
              Payment details will be displayed after order confirmation.
            </p>
          </section>

          {/* Error */}
          {paymentError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-sm px-4 py-3 mb-6">
              {paymentError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isProcessing}
             className="w-full py-4 bg-navy text-white font-heading text-sm font-semibold tracking-[0.15em] uppercase rounded-sm cursor-pointer transition-all duration-300 ease-in-out hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isProcessing ? 'Processing...' : 'Place Order'}
          </button>

            <p className="font-body text-xs text-ink-lighter dark:text-slate-300 text-center">
              By placing your order, you agree to our{' '}
              <Link href="/privacy-policy" className="text-navy dark:text-white underline underline-offset-2">
                Privacy Policy
              </Link>
            </p>
        </form>

        {/* ═══ RIGHT: Order Summary ═══ */}
        <aside className="bg-[#fafafa] dark:bg-[#0c1b3d] border-l border-gray-100 dark:border-slate-800 px-4 sm:px-10 pt-0 pb-8 sm:pb-12 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto order-first lg:order-last">
          <h2 className="font-heading text-lg font-normal text-navy dark:text-white mb-4">
            Order summary
          </h2>

          {/* Items */}
          <ul className="space-y-4 mb-6">
            {cartItems.map((item) => {
              const price = item.salePrice ?? item.price;
              const mainImage =
                item.images?.[0] || '/images/product-placeholder.png';
              return (
                <li key={item.id} className="flex gap-3">
                  <div className="relative shrink-0">
                    <Image
                      src={mainImage}
                      alt={item.name}
                      width={64}
                      height={80}
                      className="rounded-sm object-cover"
                    />
                    <span className="absolute -top-2 -right-2 bg-navy text-white font-heading text-[0.6rem] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="font-heading text-sm font-medium text-navy dark:text-white truncate">
                      {item.name}
                    </span>
                    {[item.topNotes, item.middleNotes, item.baseNotes].filter(Boolean).length > 0 && (
                      <span className="font-body text-xs text-ink-lighter dark:text-slate-300 italic">
                        {[item.topNotes, item.middleNotes, item.baseNotes].filter(Boolean).join(' • ')}
                      </span>
                    )}
                  </div>
                  <span className="font-heading text-sm font-medium text-navy dark:text-white shrink-0 self-center">
                    {formatEGP(price * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Discount Code */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <HiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
              <input
                type="text"
                name="discountCode"
                placeholder="Discount code"
                value={form.discountCode}
                onChange={handleChange}
                disabled={discountApplied}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-sm font-body text-sm text-ink dark:text-white bg-white dark:bg-slate-900 placeholder:text-gray-300 dark:placeholder-slate-400 focus:outline-none focus:border-navy transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={!form.discountCode.trim() || discountApplied}
              className="px-5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-sm font-heading text-xs font-semibold uppercase tracking-wider text-navy dark:text-white bg-white dark:bg-slate-900 cursor-pointer transition-colors hover:border-navy hover:bg-navy hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {discountApplied ? 'Applied' : 'Apply'}
            </button>
          </div>
          {discountError && (
            <p className="font-body text-xs text-red-500 mb-4">{discountError}</p>
          )}

          <div className="h-px bg-gray-200 dark:bg-slate-800 my-4" />

          {/* Price Breakdown */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between font-body text-sm text-ink-light dark:text-slate-300">
              <span>Subtotal</span>
              <span>{formatEGP(cartTotal)}</span>
            </div>
            <div className="flex justify-between font-body text-sm text-ink-light dark:text-slate-300">
              <span>Shipping</span>
              <span>{shippingCost > 0 ? formatEGP(shippingCost) : '—'}</span>
            </div>
            {discountApplied && discountAmount > 0 && (
              <div className="flex justify-between font-body text-sm text-green-600">
                <span>Discount ({form.discountCode} &minus;{discountPct}%)</span>
                <span>&minus; {formatEGP(discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-200 dark:bg-slate-800 my-4" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-heading text-sm font-semibold text-navy dark:text-white">Total</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-body text-xs text-ink-lighter dark:text-slate-300">EGP</span>
              <span className="font-heading text-xl font-bold text-navy dark:text-white">
                {total.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
