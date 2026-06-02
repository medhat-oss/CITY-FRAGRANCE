'use client';

import { useState, useEffect, useCallback } from 'react';
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
function toCatalog(products: Product[], giftSets: GiftSet[]): CatalogItem[] {
  const p: CatalogItem[] = products.map((x) => ({
    id: x.id, name: x.name,
    price: x.salePrice ?? x.price,
    image: x.images?.[0] || '/images/product-placeholder.png',
    kind: 'perfume',
    stock: x.stock,
  }));
  const g: CatalogItem[] = giftSets.map((x) => ({
    id: x.id, name: x.name, price: x.price,
    image: x.image || '/images/product-placeholder.png',
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

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      // Multiple attempts — absorbs transient server hiccups on refresh.
      // The middleware has already confirmed at least one session cookie exists,
      // so a 401 here is likely a temporary blip, not a missing login.
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
            // Authenticated but wrong role — redirect immediately
            if (!cancelled) router.replace('/cashier/login');
            return;
          }
          // 401/403 / other errors — retry
          if (attempt === 3) break;
          await new Promise((r) => setTimeout(r, 500));
        } catch {
          if (attempt === 3) break;
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (cancelled) return;

      if (!userData) {
        // All retries exhausted — no valid session. The redirect URL includes
        // a return path so the user lands back here after re-authenticating.
        if (!cancelled) router.replace('/cashier/login?redirect=/cashier');
        return;
      }

      setCurrentUser(userData);
      setAuthLoading(false);

      // Auto-ensure active shift exists on load
      ensureActiveShift(userData.id);

      // Fetch catalog items
      try {
        const [pData, gData] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/gift-sets', { cache: 'no-store' }).then((r) => r.json()),
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

  const visible = catalog.filter((c) => {
    if (filter !== 'all' && c.kind !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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

  const subtotal = cart.reduce((s, l) => s + l.item.price * l.qty, 0);
  const discountAmt = Math.min(parseFloat(discount) || 0, subtotal);
  const grandTotal = subtotal - discountAmt;

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
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#0a0a0b', color: '#ffffff', overflow: 'hidden'
    }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.8rem 1.5rem', background: '#111827',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FaCashRegister style={{ color: '#c5a880', fontSize: '1.4rem' }} />
          <h1 style={{
            fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
            fontSize: '1.25rem', fontWeight: 600, color: '#f8f9fa',
            margin: 0, letterSpacing: '0.04em'
          }}>
            CITY FRAGRANCE POS <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>/ نظام الكاشير</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          {currentUser && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem',
              borderRadius: '20px', fontSize: '0.8rem', color: '#cbd5e1'
            }}>
              <FaUser style={{ color: '#c5a880', fontSize: '0.75rem' }} />
              <span>{currentUser.username} ({currentUser.role})</span>
            </div>
          )}
          
          <button
            onClick={() => { setShowPasswordModal(true); setPasswordValue(''); setPasswordError(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', border: '1px solid rgba(197, 168, 128, 0.5)',
              borderRadius: '8px', color: '#c5a880', padding: '0.4rem 0.8rem',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: 'var(--font-heading)',
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(197, 168, 128, 0.12)';
              e.currentTarget.style.borderColor = '#c5a880';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(197, 168, 128, 0.5)';
            }}
          >
            <FaClipboardList />
            <span>End Shift / تصفية الوردية</span>
          </button>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px', color: '#ef4444', padding: '0.4rem 0.8rem',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
          >
            <FaSignOutAlt />
            <span>Logout / تسجيل خروج</span>
          </button>
        </div>
      </header>

      {/* ── Split Layout ── */}
      <div style={{
        display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden',
        minHeight: 0, padding: '1rem'
      }}>

        {/* ─── LEFT: Catalog ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {/* Filters + search */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexShrink: 0 }}>
            {([['all', 'All'], ['perfume', 'Perfumes'], ['gift-set', 'Gift Sets']] as [Filter, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid',
                  fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 600,
                  letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s',
                  background: filter === key ? '#c5a880' : 'transparent',
                  color: filter === key ? '#0a0a0b' : '#cbd5e1',
                  borderColor: filter === key ? '#c5a880' : 'rgba(255,255,255,0.15)',
                }}
              >{label}</button>
            ))}
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.8rem' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                style={{
                  padding: '0.4rem 0.6rem 0.4rem 2rem', borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
                  color: '#e2e8f0', fontSize: '0.85rem', width: 180, outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Product grid */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
              {visible.map((item) => {
                const isOutOfStock = item.stock === 0;
                return (
                  <button key={item.id} onClick={() => addToCart(item)}
                    disabled={isOutOfStock}
                    style={{
                      background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px', padding: 0, cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      overflow: 'hidden', textAlign: 'left', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column',
                      opacity: isOutOfStock ? 0.45 : 1,
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
                      <Image src={item.image} alt={item.name} fill sizes="180px" style={{ objectFit: 'cover' }} />
                      {item.kind === 'gift-set' && (
                        <span style={{ position: 'absolute', top: 6, left: 6, background: '#c5a880', color: '#0a0a0b', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>GIFT SET</span>
                      )}
                      {item.stock !== undefined && (
                        <span style={{ 
                          position: 'absolute', 
                          top: 6, 
                          right: 6, 
                          background: isOutOfStock ? '#ef4444' : 'rgba(15, 23, 42, 0.85)', 
                          color: '#e2e8f0', 
                          fontSize: '0.6rem', 
                          fontWeight: 700, 
                          padding: '2px 6px', 
                          borderRadius: '4px' 
                        }}>
                          {isOutOfStock ? 'OUT OF STOCK' : `Stock: ${item.stock}`}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '0.55rem 0.65rem' }}>
                      <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', fontWeight: 700, color: '#c5a880', fontFamily: 'var(--font-heading)' }}>{formatEGP(item.price)}</p>
                    </div>
                  </button>
                );
              })}
              {visible.length === 0 && (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem 0', color: '#475569' }}>No items found.</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Cart / Receipt ─── */}
        <div style={{
          width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          {/* Cart header */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Current Sale
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{cart.length} items</span>
          </div>

          {/* Cart lines */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
            {cart.length === 0 && (
              <p style={{ textAlign: 'center', color: '#475569', padding: '3rem 0', fontSize: '0.85rem' }}>
                Tap a product to add it
              </p>
            )}
            {cart.map((line) => (
              <div key={line.item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#1e293b' }}>
                  <Image src={line.item.image} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{line.item.name}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>{formatEGP(line.item.price)}</p>
                </div>
                {/* Qty controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => updateQty(line.item.id, -1)} style={qtyBtnStyle}><FaMinus style={{ fontSize: '0.55rem' }} /></button>
                  <span style={{ minWidth: 22, textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{line.qty}</span>
                  <button onClick={() => updateQty(line.item.id, 1)} style={qtyBtnStyle}><FaPlus style={{ fontSize: '0.55rem' }} /></button>
                </div>
                <span style={{ width: 70, textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, color: '#c5a880', fontFamily: 'var(--font-heading)' }}>
                  {formatEGP(line.item.price * line.qty)}
                </span>
                <button onClick={() => removeFromCart(line.item.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
                ><FaTrash style={{ fontSize: '0.7rem' }} /></button>
              </div>
            ))}
          </div>

          {/* Totals + checkout */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', flexShrink: 0, background: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>
              <span>Subtotal</span><span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatEGP(subtotal)}</span>
            </div>
            {/* Discount */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Discount (EGP)</label>
              <input value={discount} onChange={(e) => setDiscount(e.target.value)} type="number" min="0" step="1"
                style={{ flex: 1, padding: '0.3rem 0.5rem', borderRadius: 4, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-heading)', padding: '0.4rem 0 0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span>Grand Total</span><span style={{ color: '#c5a880' }}>{formatEGP(grandTotal)}</span>
            </div>
            <button disabled={cart.length === 0} onClick={() => { setShowCheckout(true); setOrderSuccess(null); }}
              style={{
                width: '100%', padding: '0.7rem', borderRadius: 8, border: 'none',
                background: cart.length > 0 ? 'linear-gradient(135deg, #c5a880, #9a7b56)' : '#1e293b',
                color: cart.length > 0 ? '#0a0a0b' : '#475569', fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em',
                cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.25s', textTransform: 'uppercase',
              }}
            >
              Checkout / تأكيد البيع
            </button>
          </div>
        </div>
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

const qtyBtnStyle: React.CSSProperties = {
  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
  color: '#cbd5e1', cursor: 'pointer', padding: 0, transition: 'all 0.15s',
};
