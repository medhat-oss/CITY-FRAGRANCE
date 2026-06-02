'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatEGP } from '@/utils/currency';
import {
  FaCashRegister, FaSearch, FaMinus, FaPlus, FaTrash,
  FaTimes, FaMoneyBillWave, FaMobileAlt, FaExchangeAlt, FaCreditCard,
  FaCheckCircle, FaSpinner, FaSignOutAlt, FaUser, FaClipboardList,
} from 'react-icons/fa';

/* ── Types ── */
interface Product {
  id: string; name: string; price: number; salePrice: number | null;
  images: string[]; category: string; type: string; badge: string;
  stock?: number;
}
interface GiftSet {
  id: string; name: string; price: number; image: string;
  description: string; productIds: string[];
  stock?: number;
}
interface CatalogItem {
  id: string; name: string; price: number; image: string;
  kind: 'perfume' | 'gift-set';
  stock?: number;
}
interface CartLine { item: CatalogItem; qty: number; }

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

/* ── Helpers ── */
const PLACEHOLDER = '/images/product-placeholder.png';

/** Pick the first real image URL, skipping local placeholders.
 *  Falls back to placeholder if no real image exists. */
function bestImageUrl(images: string[] | string | undefined): string {
  if (!images) return PLACEHOLDER;
  const arr = Array.isArray(images) ? images : [images];
  const real = arr.find((img) => img && img !== PLACEHOLDER && !img.startsWith('/uploads/'));
  return real || arr[0] || PLACEHOLDER;
}

function toCatalog(products: Product[], giftSets: GiftSet[]): CatalogItem[] {
  const p: CatalogItem[] = products.map((x) => ({
    id: x.id, name: x.name,
    price: x.salePrice ?? x.price,
    image: bestImageUrl(x.images),
    kind: 'perfume',
    stock: x.stock,
  }));
  const g: CatalogItem[] = giftSets.map((x) => ({
    id: x.id, name: x.name, price: x.price,
    image: x.image || PLACEHOLDER,
    kind: 'gift-set',
    stock: x.stock,
  }));
  return [...p, ...g];
}

type Filter = 'all' | 'perfume' | 'gift-set';

export default function CashierPage() {
  const router = useRouter();

  /* ── Authentication ── */
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* ── Data ── */
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const shiftEnsured = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      let userData: User | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch('/api/auth/me?role=CASHIER');
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            if (data?.user && (data.user.role === 'CASHIER' || data.user.role === 'ADMIN')) {
              userData = data.user;
              break;
            }
            if (!cancelled) router.replace('/cashier/login');
            return;
          }
          if (attempt === 3) break;
          await new Promise((r) => setTimeout(r, 500));
        } catch {
          if (attempt === 3) break;
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (cancelled) return;

      if (!userData) {
        if (!cancelled) router.replace('/cashier/login?redirect=/cashier');
        return;
      }

      setCurrentUser(userData);
      setAuthLoading(false);

      // Auto-ensure active shift exists on load (only once per mount)
      if (!shiftEnsured.current) {
        shiftEnsured.current = true;
        ensureActiveShift(userData.id);
      }

      // Fetch catalog items — always fresh from server
      try {
        const ts = Date.now();
        const [pData, gData] = await Promise.all([
          fetch(`/api/products?_t=${ts}`, { cache: 'no-store' }).then((r) => r.json()),
          fetch(`/api/gift-sets?_t=${ts}`, { cache: 'no-store' }).then((r) => r.json()),
        ]);
        if (!cancelled) {
          setCatalog(toCatalog(pData.products || [], gData.giftSets || []));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Filters ── */
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => catalog.filter((c) => {
    if (filter !== 'all' && c.kind !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [catalog, filter, search]);

  /* ── Cart ── */
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState('');

  const addToCart = useCallback((item: CatalogItem) => {
    const stockLimit = item.stock !== undefined ? item.stock : 999;
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.item.id === item.id);
      const currentQty = idx >= 0 ? prev[idx].qty : 0;
      if (currentQty + 1 > stockLimit) {
        alert(`عذراً، الكمية المتاحة في المخزن هي ${stockLimit} فقط\nSorry, only ${stockLimit} items left in stock`);
        return prev;
      }
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { item, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.item.id === id);
      if (idx === -1) return prev;
      const item = prev[idx].item;
      const stockLimit = item.stock !== undefined ? item.stock : 999;
      if (delta > 0 && prev[idx].qty + delta > stockLimit) {
        alert(`عذراً، الكمية المتاحة في المخزن هي ${stockLimit} فقط\nSorry, only ${stockLimit} items left in stock`);
        return prev;
      }
      return prev.map((l) =>
        l.item.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l
      );
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((l) => l.item.id !== id));
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.item.price * l.qty, 0), [cart]);
  const discountAmt = useMemo(() => Math.min(parseFloat(discount) || 0, subtotal), [discount, subtotal]);
  const grandTotal = useMemo(() => subtotal - discountAmt, [subtotal, discountAmt]);

  /* ── Checkout modal ── */
  const [showCheckout, setShowCheckout] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  /** Ensure an OPEN shift exists for the current cashier; creates one if needed */
  async function ensureActiveShift(userId?: string): Promise<boolean> {
    const id = userId || currentUser?.id;
    if (!id) {
      console.warn('ensureActiveShift: No user ID available');
      return false;
    }
    try {
      const res = await fetch('/api/admin/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', cashierId: id }),
      });

      if (res.status === 400) {
        // Read body once and inspect
        const errText = await res.text().catch(() => '');
        if (errText.includes('Active shift already exists')) {
          // Cashier already has a valid open shift — this is a success, not an error
          console.info('ensureActiveShift: shift already open for', id);
          return true;
        }
        // Genuine 400 (unexpected)
        console.error('ensureActiveShift 400:', errText);
        return false;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('ensureActiveShift returned', res.status, errText);
        return false;
      }

      const data = await res.json();
      return !!(data?.shift || data?.success);
    } catch (err) {
      console.error('ensureActiveShift network error:', err);
      return false;
    }
  }

  async function handleSubmitOrder() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'POS Walk-in',
          phoneNumber: '—',
          email: '',
          address: 'In-Store',
          apartment: '',
          city: 'In-Store',
          governorate: '',
          items: cart.map((l) => ({
            name: l.item.name, quantity: l.qty,
            price: l.item.price,
          })),
          totalPrice: grandTotal,
          paymentMethod: payMethod,
          source: 'POS',
          cashierId: currentUser?.id,
        }),
      });
      if (res.status === 401) {
        console.error('FRONTEND AUTH ERROR: Place Order returned 401 — cashier_session cookie missing or invalid');
        router.replace('/cashier/login');
        return;
      }
      if (res.status === 403) {
        console.error('FRONTEND AUTH ERROR: Place Order returned 403 — role not permitted');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.order?.orderId || 'OK');
        setCart([]);
        setDiscount('');
      } else {
        console.error('FRONTEND AUTH ERROR: Place Order non-success response', data);
      }
    } catch (err) {
      console.error('FRONTEND AUTH ERROR: Place Order network/parse failure:', err);
    }
    setSubmitting(false);
  }

  function closeSuccess() {
    setOrderSuccess(null);
    setShowCheckout(false);
  }

  /* ── Shift Management ── */
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordVerifying, setPasswordVerifying] = useState(false);

  const [showShiftCheckout, setShowShiftCheckout] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [shiftSummary, setShiftSummary] = useState<{
    orderCount: number;
    totalCash: number;
    totalInstaPay: number;
    totalVodafoneCash: number;
    totalVisa: number;
    expectedTotal: number;
    startTime: string;
  } | null>(null);
  const [actualCash, setActualCash] = useState('');
  const [shiftPassword, setShiftPassword] = useState('');
  const [shiftSubmitting, setShiftSubmitting] = useState(false);

  async function openShiftCheckout() {
    if (!currentUser?.id) {
      alert('User session not loaded yet. Please try again.');
      return;
    }
    // Instantly open the modal in loading state
    setShowShiftCheckout(true);
    setShiftLoading(true);
    setShiftError(null);
    setShiftSummary(null);
    setActualCash('');

    try {
      const res = await fetch(`/api/admin/shifts?status=OPEN&cashierId=${currentUser.id}`);
      if (res.status === 401) {
        setShowShiftCheckout(false);
        router.replace('/cashier/login');
        return;
      }
      if (res.status === 403) {
        setShowShiftCheckout(false);
        alert("Access Denied: You do not have permission to view shift details.");
        return;
      }
      if (!res.ok) {
        throw new Error(`Server returned status code: ${res.status}`);
      }
      const data = await res.json();
      let shift = data?.shift;

      // If no active shift exists, try to create one before showing the error
      if (!shift) {
        const created = await ensureActiveShift(currentUser.id);
        if (created) {
          // Retry the GET now that a shift exists
          const retryRes = await fetch(`/api/admin/shifts?status=OPEN&cashierId=${currentUser.id}`);
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            shift = retryData?.shift;
          }
        }
      }

      if (shift) {
        const orderCount = typeof shift.orderCount === 'number' ? shift.orderCount : 0;
        const totalCash = typeof shift.totalCash === 'number' ? shift.totalCash : 0;
        const totalInstaPay = typeof shift.totalInstaPay === 'number' ? shift.totalInstaPay : 0;
        const totalVodafoneCash = typeof shift.totalVodafoneCash === 'number' ? shift.totalVodafoneCash : 0;
        const totalVisa = typeof shift.totalVisa === 'number' ? shift.totalVisa : 0;
        const expectedTotal = typeof shift.expectedTotal === 'number' ? shift.expectedTotal : 0;
        const startTime = typeof shift.startTime === 'string' ? shift.startTime : new Date().toISOString();
        setShiftSummary({ orderCount, totalCash, totalInstaPay, totalVodafoneCash, totalVisa, expectedTotal, startTime });
      } else {
        // Final fallback: show zero summary with an error message
        setShiftSummary({
          orderCount: 0,
          totalCash: 0,
          totalInstaPay: 0,
          totalVodafoneCash: 0,
          totalVisa: 0,
          expectedTotal: 0,
          startTime: new Date().toISOString(),
        });
        setShiftError('No active shift found. Showing fallback values.');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("CRITICAL SHIFT OPEN ERROR:", err);
      setShiftError(`Failed to load shift data: ${errMsg}`);
      alert(`حدث خطأ أثناء تحميل الوردية: ${errMsg}`);
    } finally {
      setShiftLoading(false);
    }
  }

  async function handleVerifyPassword() {
    if (!passwordValue.trim()) return;
    setPasswordVerifying(true);
    setPasswordError('');
    try {
      const res = await fetch('/api/admin/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-password', shiftPassword: passwordValue, userId: currentUser?.id }),
      });
      if (res.status === 401) {
        const errorText = await res.text();
        let errorMessage = 'Authentication failed';
        try {
          const errData = JSON.parse(errorText);
          errorMessage = errData?.error === 'Incorrect shift password' ? 'Incorrect shift password / كلمة المرور غير صحيحة' : (errData?.error || errorMessage);
        } catch {
          console.error('Non-JSON 401 response:', errorText.slice(0, 300));
        }
        setPasswordError(errorMessage);
        setPasswordVerifying(false);
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = 'Verification failed. Please try again.';
        try {
          const errData = JSON.parse(errorText);
          if (errData?.error) errorMessage = errData.error;
        } catch {
          console.error('Non-JSON verify-password response:', errorText.slice(0, 300));
        }
        setPasswordError(errorMessage);
        setPasswordVerifying(false);
        return;
      }
      const data = await res.json();
      if (data?.success) {
        setShiftPassword(passwordValue);
        setShowPasswordModal(false);
        setPasswordValue('');
        openShiftCheckout();
      }
    } catch {
      setPasswordError('Network error. Please try again.');
    }
    setPasswordVerifying(false);
  }

  async function handleShiftCheckout() {
    if (!currentUser?.id) return;
    setShiftSubmitting(true);
    try {
      const actualCashValue = parseFloat(actualCash) || 0;
      const res = await fetch('/api/admin/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          actualCash: actualCashValue,
          shiftPassword,
          userId: currentUser.id,
        }),
      });
      if (res.status === 401) {
        console.error('FRONTEND AUTH ERROR: End Shift returned 401 — cashier_session cookie missing or invalid');
        router.replace('/cashier/login');
        return;
      }
      if (res.status === 403) {
        console.error('FRONTEND AUTH ERROR: End Shift returned 403 — role not permitted');
        setShiftError('Access denied. Please log in again.');
        alert('Access denied. Please log in again.');
        setShiftSubmitting(false);
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Server returned status code: ${res.status}`;
        try {
          const errData = JSON.parse(errorText);
          if (errData?.error) errorMessage = errData.error;
        } catch {
          console.error('Non-JSON error response from server:', errorText.slice(0, 300));
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      if (data?.success) {
        localStorage.clear();
        sessionStorage.clear();
        await fetch('/api/auth/cashier-logout', { method: 'POST' });
        window.location.href = '/cashier/login';
      } else {
        throw new Error(data?.error || 'Failed to close shift.');
      }
    } catch (err: any) {
      console.error("CRITICAL SHIFT CHECKOUT ERROR:", err);
      alert("حدث خطأ أثناء التصفية: " + (err?.message || String(err)));
      setShiftSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch(`/api/admin/shifts?status=OPEN&cashierId=${currentUser?.id}`);
      if (res.ok) {
        const data = await res.json();
        const activeOrderCount = data?.shift?.orderCount ?? 0;
        if (activeOrderCount > 0) {
          if (!confirm('You have an active shift with orders. Please use "End Shift" to close it properly.')) {
            return;
          }
        }
      }
    } catch (err) {
      console.error('POS Action Error - handleLogout shift check:', err);
    }
    localStorage.clear();
    sessionStorage.clear();
    await fetch('/api/auth/cashier-logout', { method: 'POST' });
    window.location.href = '/cashier/login';
  }

  /* ── Mobile drawer state ── */
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  /* ── Payment methods config ── */
  const PAY_METHODS = [
    { key: 'cash', label: 'Cash / كاش', icon: <FaMoneyBillWave /> },
    { key: 'vodafone', label: 'Vodafone Cash', icon: <FaMobileAlt /> },
    { key: 'instapay', label: 'InstaPay', icon: <FaExchangeAlt /> },
    { key: 'visa', label: 'Visa / Card', icon: <FaCreditCard /> },
  ];

  /* ── Render ── */
  if (authLoading || loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0b', color: '#c5a880'
      }}>
        <FaSpinner className="animate-spin" style={{ fontSize: '2.5rem' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0b] text-white overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-3 md:px-6 py-3 bg-[#111827] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <FaCashRegister style={{ color: '#c5a880', fontSize: '1.2rem', flexShrink: 0 }} />
          <h1 className="font-heading text-sm md:text-lg font-semibold text-[#f8f9fa] m-0 tracking-wider truncate">
            CITY FRAGRANCE POS
          </h1>
          <span className="hidden sm:inline text-xs md:text-sm text-[#64748b] font-normal">/ نظام الكاشير</span>
        </div>

        {/* ── Desktop right section ── */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          {currentUser && (
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full text-xs lg:text-sm text-[#cbd5e1]">
              <FaUser style={{ color: '#c5a880', fontSize: '0.75rem' }} />
              <span className="truncate max-w-[120px]">{currentUser.username} ({currentUser.role})</span>
            </div>
          )}
          <button
            onClick={() => { setShowPasswordModal(true); setPasswordValue(''); setPasswordError(''); }}
            className="flex items-center gap-1.5 bg-transparent border border-[#c5a880]/50 rounded-lg text-[#c5a880] px-3 py-1.5 text-xs lg:text-sm font-semibold cursor-pointer transition-all font-heading tracking-wider whitespace-nowrap hover:bg-[#c5a880]/10 hover:border-[#c5a880]"
          >
            <FaClipboardList style={{ flexShrink: 0 }} />
            <span>End Shift</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-transparent border border-red-500/40 rounded-lg text-red-500 px-3 py-1.5 text-xs lg:text-sm font-semibold cursor-pointer transition-all whitespace-nowrap hover:bg-red-500/10 hover:border-red-500"
          >
            <FaSignOutAlt style={{ flexShrink: 0 }} />
            <span>Logout</span>
          </button>
        </div>

        {/* ── Mobile hamburger ── */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile cart toggle badge */}
          <button
            onClick={() => setMobileCartOpen(!mobileCartOpen)}
            className="relative flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs"
          >
            <span>Sale</span>
            {cart.length > 0 && (
              <span className="bg-[#c5a880] text-[#0a0a0b] text-[0.6rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center justify-center bg-transparent border border-white/20 rounded-lg p-2 text-white cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#09142E] shadow-xl transform transition-transform duration-300 md:hidden ${mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-5">
          <div className="flex items-center justify-between mb-6">
            <span className="font-heading text-sm text-[#c5a880] tracking-widest uppercase">Menu</span>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="text-[#64748b] cursor-pointer bg-transparent border-none p-1"
            >
              <FaTimes style={{ fontSize: '1.1rem' }} />
            </button>
          </div>

          {currentUser && (
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2.5 mb-4">
              <FaUser style={{ color: '#c5a880', fontSize: '0.85rem', flexShrink: 0 }} />
              <div className="min-w-0">
                <div className="text-sm text-white font-semibold truncate">{currentUser.username}</div>
                <div className="text-[0.6rem] text-[#94a3b8] uppercase tracking-wider">{currentUser.role}</div>
              </div>
            </div>
          )}

          <button
            onClick={() => { setMobileDrawerOpen(false); setShowPasswordModal(true); setPasswordValue(''); setPasswordError(''); }}
            className="flex items-center gap-3 w-full bg-transparent border border-[#c5a880]/40 rounded-lg text-[#c5a880] px-4 py-3 text-sm font-semibold cursor-pointer transition-all mb-3 hover:bg-[#c5a880]/10"
          >
            <FaClipboardList style={{ flexShrink: 0 }} />
            <span>End Shift / تصفية الوردية</span>
          </button>

          <button
            onClick={() => { setMobileDrawerOpen(false); handleLogout(); }}
            className="flex items-center gap-3 w-full bg-transparent border border-red-500/40 rounded-lg text-red-500 px-4 py-3 text-sm font-semibold cursor-pointer transition-all hover:bg-red-500/10"
          >
            <FaSignOutAlt style={{ flexShrink: 0 }} />
            <span>Logout / تسجيل خروج</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content: Catalog (desktop: side-by-side, mobile: stacked) ── */}
      <div className="flex flex-col md:flex-row flex-1 gap-2 md:gap-4 overflow-hidden min-h-0 p-2 md:p-4">

        {/* ─── LEFT: Catalog ─── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Filters + search */}
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3 flex-shrink-0">
            {([['all', 'All'], ['perfume', 'Perfumes'], ['gift-set', 'Gift Sets']] as [Filter, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className="text-[0.65rem] md:text-xs font-semibold font-heading tracking-wider cursor-pointer transition-all px-2.5 md:px-4 py-1.5 md:py-2 rounded-full border"
                style={{
                  background: filter === key ? '#c5a880' : 'transparent',
                  color: filter === key ? '#0a0a0b' : '#cbd5e1',
                  borderColor: filter === key ? '#c5a880' : 'rgba(255,255,255,0.15)',
                }}
              >{label}</button>
            ))}
            <div className="ml-auto relative">
              <FaSearch style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.7rem' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                className="text-xs md:text-sm text-[#e2e8f0] bg-white/5 border border-white/10 rounded-md outline-none pl-7 pr-2 py-1.5 md:py-2 w-28 md:w-44"
              />
            </div>
          </div>

          {/* Product grid: 2 cols mobile, 3 cols sm, 4 cols lg */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {visible.map((item) => {
                const isOutOfStock = item.stock === 0;
                return (
                  <button key={item.id} onClick={() => addToCart(item)}
                    disabled={isOutOfStock}
                    className="flex flex-col overflow-hidden rounded-xl text-left transition-all cursor-pointer"
                    style={{
                      background: '#111827',
                      border: '1px solid rgba(255,255,255,0.08)',
                      opacity: isOutOfStock ? 0.45 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.borderColor = '#c5a880';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#1e293b' }}>
                      <ImageWithFallback src={item.image} alt={item.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                      {item.kind === 'gift-set' && (
                        <span className="absolute top-1 left-1 bg-[#c5a880] text-[#0a0a0b] text-[0.5rem] md:text-[0.55rem] font-bold px-1.5 py-0.5 rounded tracking-wider">GIFT</span>
                      )}
                      {item.stock !== undefined && (
                        <span
                          className="absolute top-1 right-1 text-[0.5rem] md:text-[0.55rem] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: isOutOfStock ? '#ef4444' : 'rgba(15, 23, 42, 0.85)',
                            color: '#e2e8f0',
                          }}
                        >
                          {isOutOfStock ? 'OUT' : `${item.stock}`}
                        </span>
                      )}
                    </div>
                    <div className="px-2 md:px-2.5 py-1.5 md:py-2">
                      <p className="m-0 text-[0.65rem] md:text-xs font-semibold text-[#e2e8f0] truncate">{item.name}</p>
                      <p className="m-0 pt-0.5 text-xs md:text-sm font-bold text-[#c5a880] font-heading">{formatEGP(item.price)}</p>
                    </div>
                  </button>
                );
              })}
              {visible.length === 0 && (
                <p className="col-span-full text-center py-8 md:py-12 text-[#475569] text-xs md:text-sm">No items found.</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Cart / Receipt (desktop sidebar / mobile bottom drawer) ─── */}

        {/* Desktop cart panel */}
        <div className="hidden md:flex flex-col w-80 lg:w-88 flex-shrink-0 bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
          <CartPanel
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            setDiscount={setDiscount}
            grandTotal={grandTotal}
            discountAmt={discountAmt}
            qtyBtnStyle={qtyBtnStyle}
            updateQty={updateQty}
            removeFromCart={removeFromCart}
            onCheckout={() => { setShowCheckout(true); setOrderSuccess(null); }}
          />
        </div>
      </div>

      {/* ── Mobile cart bottom bar (always visible when cart has items) ── */}
      <div className="md:hidden flex-shrink-0">
        {/* Floating cart summary bar */}
        <button
          onClick={() => setMobileCartOpen(!mobileCartOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#111827] border-t border-white/10"
        >
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs text-[#94a3b8] uppercase tracking-wider">Cart</span>
            <span className="text-xs text-[#64748b]">({cart.length})</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-heading text-sm font-bold text-[#c5a880]">{formatEGP(grandTotal)}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 text-[#64748b] transition-transform ${mobileCartOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Expandable cart panel on mobile */}
        {mobileCartOpen && (
          <div className="max-h-[50vh] overflow-y-auto bg-[#111827] border-t border-white/5 px-2 py-2">
            <CartPanel
              cart={cart}
              subtotal={subtotal}
              discount={discount}
              setDiscount={setDiscount}
              grandTotal={grandTotal}
              discountAmt={discountAmt}
              qtyBtnStyle={qtyBtnStyle}
              updateQty={updateQty}
              removeFromCart={removeFromCart}
              onCheckout={() => { setShowCheckout(true); setOrderSuccess(null); }}
            />
          </div>
        )}
      </div>

      {/* ── Shift Password Modal ── */}
      {showPasswordModal && (
        <div onClick={() => { if (!passwordVerifying) setShowPasswordModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#0a0a0b', border: '1px solid rgba(197,168,128,0.25)', borderRadius: 14, width: '90%', maxWidth: 380, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <FaClipboardList style={{ color: '#c5a880', fontSize: '1.5rem', marginBottom: '0.5rem' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, color: '#f8f9fa', margin: 0 }}>
                Enter Shift Password
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0.35rem 0 0' }}>
                أدخل كلمة مرور الوردية للمتابعة
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                value={passwordValue}
                onChange={(e) => { setPasswordValue(e.target.value); setPasswordError(''); }}
                placeholder="Shift Password / كلمة المرور"
                disabled={passwordVerifying}
                autoFocus
                autoComplete="off"
                onKeyDown={(e) => { if (e.key === 'Enter' && !passwordVerifying && passwordValue.trim()) handleVerifyPassword(); }}
                style={{
                  width: '100%', padding: '0.75rem 0.9rem', borderRadius: 6,
                  border: passwordError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
                  textAlign: 'center',
                }}
              />
              {passwordError && (
                <p style={{ color: '#f87171', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
                  {passwordError}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={passwordVerifying}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: '0.82rem',
                  cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em',
                }}
              >
                Cancel / إلغاء
              </button>
              <button
                onClick={handleVerifyPassword}
                disabled={passwordVerifying || !passwordValue.trim()}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: 8, border: 'none',
                  background: passwordVerifying ? '#475569' : 'linear-gradient(135deg, #c5a880, #9a7b56)',
                  color: '#0a0a0b', fontWeight: 700, fontSize: '0.82rem',
                  cursor: passwordVerifying ? 'wait' : 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em',
                  opacity: !passwordValue.trim() && !passwordVerifying ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                {passwordVerifying ? <FaSpinner className="animate-spin" style={{ fontSize: '0.9rem' }} /> : null}
                <span>Verify / تأكيد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shift Checkout Modal ── */}
      {showShiftCheckout && (() => {
        /* ── Loading state ── */
        if (shiftLoading) {
          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '3rem 2.5rem', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                <FaSpinner className="animate-spin" style={{ fontSize: '2.5rem', color: '#c5a880', marginBottom: '1rem' }} />
                <p style={{ color: '#94a3b8', fontFamily: 'var(--font-heading)', fontSize: '0.9rem', margin: 0 }}>
                  جاري حساب إجمالي الوردية...
                </p>
              </div>
            </div>
          );
        }

        /* ── Error state ── */
        if (shiftError) {
          return (
            <div onClick={() => setShowShiftCheckout(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: '90%', maxWidth: 400, padding: '2rem', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                <p style={{ color: '#f87171', fontFamily: 'var(--font-heading)', fontSize: '0.95rem', margin: '0 0 1.25rem' }}>{shiftError}</p>
                <button onClick={() => { setShowShiftCheckout(false); setShiftError(null); }}
                  style={{ padding: '0.6rem 2rem', borderRadius: 8, border: 'none', background: '#c5a880', color: '#0a0a0b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}
                >OK</button>
              </div>
            </div>
          );
        }

        /* ── Summary state (requires shiftSummary) ── */
        if (!shiftSummary) return null;

        const orderCount = shiftSummary.orderCount ?? 0;
        const totalCash = shiftSummary.totalCash ?? 0;
        const totalInstaPay = shiftSummary.totalInstaPay ?? 0;
        const totalVodafoneCash = shiftSummary.totalVodafoneCash ?? 0;
        const totalVisa = shiftSummary.totalVisa ?? 0;
        const expectedTotal = shiftSummary.expectedTotal ?? 0;
        let startTimeDisplay = 'Unknown';
        try {
          startTimeDisplay = shiftSummary.startTime ? new Date(shiftSummary.startTime).toLocaleString() : 'Unknown';
        } catch { /* use fallback */ }
        const parsedActual = parseFloat(actualCash);
        const isActualValid = !Number.isNaN(parsedActual) && parsedActual >= 0;
        const discrepancyAmount = isActualValid ? parsedActual - expectedTotal : 0;

        return (
          <div onClick={() => !shiftSubmitting && setShowShiftCheckout(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: '90%', maxWidth: 460, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#f8f9fa', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaClipboardList style={{ color: '#c5a880' }} /> End Shift
                </h3>
                <button onClick={() => setShowShiftCheckout(false)} disabled={shiftSubmitting} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}><FaTimes /></button>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem', padding: '0.6rem 0.8rem', background: 'rgba(197,168,128,0.08)', borderRadius: 8 }}>
                Shift started: <strong style={{ color: '#e2e8f0' }}>{startTimeDisplay}</strong>
              </div>

              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Orders Count</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{orderCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Cash</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatEGP(totalCash)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>InstaPay</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatEGP(totalInstaPay)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Vodafone Cash</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatEGP(totalVodafoneCash)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Visa / Card</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatEGP(totalVisa)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0 0', fontSize: '1rem', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '0.3rem' }}>
                  <span style={{ color: '#e2e8f0' }}>Expected Total</span>
                  <span style={{ color: '#c5a880', fontFamily: 'var(--font-heading)' }}>{formatEGP(expectedTotal)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Actual Cash in Drawer / الكاش الفعلي في الدرج
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="0.00"
                  disabled={shiftSubmitting}
                  style={{
                    width: '100%', padding: '0.7rem 0.9rem', borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
                    color: '#e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {isActualValid && parsedActual > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                    <span style={{ color: '#94a3b8' }}>Discrepancy</span>
                    <span style={{ color: Math.abs(discrepancyAmount) > 0.01 ? '#f87171' : '#22c55e', fontWeight: 600 }}>
                      {formatEGP(discrepancyAmount)}
                    </span>
                  </div>
                )}
              </div>

              <button onClick={handleShiftCheckout} disabled={shiftSubmitting}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: 8, border: 'none',
                  background: shiftSubmitting ? '#475569' : 'linear-gradient(135deg, #c5a880, #9a7b56)',
                  color: '#0a0a0b', fontFamily: 'var(--font-heading)', fontSize: '0.9rem',
                  fontWeight: 700, letterSpacing: '0.08em', cursor: shiftSubmitting ? 'wait' : 'pointer',
                  opacity: shiftSubmitting ? 0.6 : 1, transition: 'opacity 0.2s',
                }}
              >
                {shiftSubmitting ? 'Processing...' : 'Confirm Checkout & Logout / تأكيد التصفية والخروج'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Checkout Modal ── */}
      {showCheckout && (
        <div onClick={() => !submitting && setShowCheckout(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: '90%', maxWidth: 420, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            {orderSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <FaCheckCircle style={{ fontSize: '3rem', color: '#22c55e', marginBottom: '1rem' }} />
                <h3 style={{ color: '#f8f9fa', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', margin: '0 0 0.5rem' }}>Order Confirmed!</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.3rem' }}>Order ID: <strong style={{ color: '#e2e8f0' }}>{orderSuccess}</strong></p>
                <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0 0 1.5rem' }}>The order has been recorded in the system.</p>
                <button onClick={closeSuccess}
                  style={{ padding: '0.6rem 2rem', borderRadius: 8, border: 'none', background: '#c5a880', color: '#0a0a0b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}
                >Done</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ color: '#f8f9fa', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: 0 }}>Complete Sale</h3>
                  <button onClick={() => setShowCheckout(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}><FaTimes /></button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.8rem', background: 'rgba(197,168,128,0.08)', borderRadius: 8, marginBottom: '1.25rem' }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Total</span>
                  <span style={{ color: '#c5a880', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>{formatEGP(grandTotal)}</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment Method</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {PAY_METHODS.map((m) => (
                    <button key={m.key} onClick={() => setPayMethod(m.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.65rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                        border: payMethod === m.key ? '2px solid #c5a880' : '1px solid rgba(255,255,255,0.1)',
                        background: payMethod === m.key ? 'rgba(197,168,128,0.12)' : 'transparent',
                        color: payMethod === m.key ? '#e2e8f0' : '#94a3b8',
                        fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                      }}
                    >{m.icon} {m.label}</button>
                  ))}
                </div>
                <button onClick={handleSubmitOrder} disabled={submitting}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #c5a880, #9a7b56)',
                    color: '#0a0a0b', fontFamily: 'var(--font-heading)', fontSize: '0.9rem',
                    fontWeight: 700, letterSpacing: '0.08em', cursor: submitting ? 'wait' : 'pointer',
                    opacity: submitting ? 0.6 : 1, transition: 'opacity 0.2s',
                  }}
                >{submitting ? 'Processing…' : 'Confirm Order / تأكيد'}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared Cart Panel Component (used in both desktop sidebar & mobile drawer) ── */
function CartPanel({ cart, subtotal, discount, setDiscount, grandTotal, discountAmt, qtyBtnStyle, updateQty, removeFromCart, onCheckout }: {
  cart: CartLine[];
  subtotal: number;
  discount: string;
  setDiscount: (v: string) => void;
  grandTotal: number;
  discountAmt: number;
  qtyBtnStyle: React.CSSProperties;
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onCheckout: () => void;
}) {
  return (
    <>
      {/* Cart header */}
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Current Sale
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{cart.length} items</span>
      </div>

      {/* Cart lines */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem', minHeight: cart.length === 0 ? 0 : 'auto' }}>
        {cart.length === 0 && (
          <p style={{ textAlign: 'center', color: '#475569', padding: '2rem 0', fontSize: '0.8rem' }}>
            Tap a product to add it
          </p>
        )}
        {cart.map((line) => (
          <div key={line.item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#1e293b' }}>
               <ImageWithFallback src={line.item.image} alt="" sizes="36px" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{line.item.name}</p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>{formatEGP(line.item.price)}</p>
            </div>
            {/* Qty controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button onClick={() => updateQty(line.item.id, -1)} style={qtyBtnStyle}><FaMinus style={{ fontSize: '0.5rem' }} /></button>
              <span style={{ minWidth: 20, textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{line.qty}</span>
              <button onClick={() => updateQty(line.item.id, 1)} style={qtyBtnStyle}><FaPlus style={{ fontSize: '0.5rem' }} /></button>
            </div>
            <span style={{ width: 65, textAlign: 'right', fontSize: '0.72rem', fontWeight: 700, color: '#c5a880', fontFamily: 'var(--font-heading)' }}>
              {formatEGP(line.item.price * line.qty)}
            </span>
            <button onClick={() => removeFromCart(line.item.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2, transition: 'color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
            ><FaTrash style={{ fontSize: '0.65rem' }} /></button>
          </div>
        ))}
      </div>

      {/* Totals + checkout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem 1rem', flexShrink: 0, background: '#0f172a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 3 }}>
          <span>Subtotal</span><span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatEGP(subtotal)}</span>
        </div>
        {/* Discount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <label style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Discount</label>
          <input value={discount} onChange={(e) => setDiscount(e.target.value)} type="number" min="0" step="1"
            style={{ flex: 1, padding: '0.25rem 0.4rem', borderRadius: 4, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.75rem', outline: 'none', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-heading)', padding: '0.3rem 0 0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span>Grand Total</span><span style={{ color: '#c5a880' }}>{formatEGP(grandTotal)}</span>
        </div>
        <button disabled={cart.length === 0} onClick={onCheckout}
          style={{
            width: '100%', padding: '0.6rem', borderRadius: 8, border: 'none',
            background: cart.length > 0 ? 'linear-gradient(135deg, #c5a880, #9a7b56)' : '#1e293b',
            color: cart.length > 0 ? '#0a0a0b' : '#475569', fontFamily: 'var(--font-heading)',
            fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em',
            cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Checkout / تأكيد البيع
        </button>
      </div>
    </>
  );
}

/* ── Image with fallback on error ── */
function ImageWithFallback({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      src={failed ? PLACEHOLDER : src}
      alt={alt}
      fill
      sizes={sizes}
      style={{ objectFit: 'cover' }}
      onError={() => setFailed(true)}
    />
  );
}

const qtyBtnStyle: React.CSSProperties = {
  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
  color: '#cbd5e1', cursor: 'pointer', padding: 0, transition: 'all 0.15s',
};
