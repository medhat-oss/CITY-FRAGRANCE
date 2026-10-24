'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FaUserCheck,
  FaSearch,
  FaFilter,
  FaDownload,
  FaSyncAlt,
  FaPhoneAlt,
  FaWhatsapp,
  FaCity,
  FaCrown,
  FaBuilding,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';
import { formatEGP } from '@/utils/currency';

interface CrmCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  customerSegment: string;
  lifetimeValue: number;
  totalOrders: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  leadsCount?: number;
  dealsCount?: number;
}

const CUSTOMER_SEGMENTS = ['Regular', 'VIP', 'Wholesale', 'Corporate'] as const;

interface NewCustomerForm {
  name: string;
  phone: string;
  email: string;
  city: string;
  customerSegment: string;
  totalOrders: string;
  lifetimeValue: string;
  notes: string;
}

const INITIAL_FORM: NewCustomerForm = {
  name: '',
  phone: '',
  email: '',
  city: 'Cairo',
  customerSegment: 'Regular',
  totalOrders: '0',
  lifetimeValue: '0',
  notes: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewCustomerForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingSegmentId, setUpdatingSegmentId] = useState<string | null>(null);

  // Fetch customers
  const fetchCustomers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/admin/crm/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Inline Segment Update
  const handleSegmentChange = async (customerId: string, newSegment: string) => {
    setUpdatingSegmentId(customerId);
    try {
      const res = await fetch('/api/admin/crm/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customerId, segment: newSegment }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, customerSegment: newSegment } : c))
        );
        setToastMessage(`Segment updated to ${newSegment}`);
      }
    } catch (err) {
      console.error('Failed to update segment:', err);
    } finally {
      setUpdatingSegmentId(null);
    }
  };

  // Create Customer Form Submission
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Please enter the customer name.');
      return;
    }
    if (!form.phone.trim()) {
      setFormError('Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          city: form.city.trim(),
          customerSegment: form.customerSegment,
          totalOrders: parseInt(form.totalOrders) || 0,
          lifetimeValue: parseFloat(form.lifetimeValue) || 0,
          notes: form.notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create customer');
      }

      // Prepend optimistically
      setCustomers((prev) => [data.customer, ...prev]);
      setModalOpen(false);
      setForm(INITIAL_FORM);
      setToastMessage(`Customer "${data.customer.name}" created successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create customer';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        cust.name.toLowerCase().includes(q) ||
        cust.phone.includes(q) ||
        (cust.email && cust.email.toLowerCase().includes(q)) ||
        (cust.city && cust.city.toLowerCase().includes(q));

      const matchesSegment = segmentFilter === 'ALL' || cust.customerSegment === segmentFilter;

      return matchesSearch && matchesSegment;
    });
  }, [customers, search, segmentFilter]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const total = customers.length;
    const vipCount = customers.filter(
      (c) => c.customerSegment === 'VIP' || c.customerSegment === 'Corporate'
    ).length;
    const totalLTV = customers.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0);
    const avgLTV = total > 0 ? Math.round(totalLTV / total) : 0;

    return { total, vipCount, totalLTV, avgLTV };
  }, [customers]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return;
    const headers = ['Customer ID', 'Name', 'Phone', 'Email', 'City', 'Segment', 'Total Orders', 'Lifetime Value EGP', 'Joined Date'];
    const rows = filteredCustomers.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.city}"`,
      `"${c.customerSegment}"`,
      c.totalOrders,
      c.lifetimeValue,
      `"${new Date(c.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cleanPhone = (phone: string) => {
    return phone.replace(/[^\d+]/g, '');
  };

  const getWhatsAppLink = (phone: string) => {
    let p = cleanPhone(phone);
    if (p.startsWith('01')) p = '2' + p;
    else if (p.startsWith('+20')) p = p.substring(1);
    return `https://wa.me/${p}`;
  };

  return (
    <div dir="ltr" className="w-full max-w-full min-w-0 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl backdrop-blur-md animate-fade-in">
          <FaCheckCircle className="text-emerald-400 text-sm" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-slate-200">CRM</span>
            <span>/</span>
            <span className="text-indigo-400 font-medium">Customer Directory</span>
          </div>
          <h1 className="text-2xl font-semibold text-white font-heading">Customer Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized client profiles, order history, VIP tiers, and customer lifetime value (LTV).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchCustomers(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16234D] border border-[#1d3573] hover:bg-[#1a2d5a] text-slate-300 text-xs font-medium transition-all"
            title="Refresh directory"
          >
            <FaSyncAlt className={`text-xs ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredCustomers.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16234D] border border-[#1d3573] hover:bg-[#1a2d5a] text-slate-300 disabled:opacity-50 text-xs font-medium transition-all"
          >
            <FaDownload className="text-xs" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setForm(INITIAL_FORM);
              setFormError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm"
          >
            <FaUserCheck className="text-xs" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Clients</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{metrics.total}</span>
            <span className="text-[11px] text-slate-400">Registered</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <FaCrown className="text-amber-400 text-xs" /> VIP & Corporate
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-300 font-mono">{metrics.vipCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              High Value Tier
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Portfolio LTV</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono">
              {formatEGP(metrics.totalLTV)}
            </span>
            <span className="text-[11px] text-slate-400">Total Spend</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">Avg Client Value</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-sky-300 font-mono">
              {formatEGP(metrics.avgLTV)}
            </span>
            <span className="text-[11px] text-slate-400">Avg LTV</span>
          </div>
        </div>
      </div>

      {/* Search / Filter Control Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, email, or city..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#111B3D] border border-[#1d3573] rounded-lg px-2.5 py-1 text-xs">
            <FaFilter className="text-slate-400 text-[10px]" />
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111B3D] text-white">All Segments</option>
              {CUSTOMER_SEGMENTS.map((seg) => (
                <option key={seg} value={seg} className="bg-[#111B3D] text-white">
                  {seg}
                </option>
              ))}
            </select>
          </div>

          {(search || segmentFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSegmentFilter('ALL');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-[#1d3573] bg-[#16234D] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#1d3573] bg-[#09142E] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3.5">Client Profile</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">City / Region</th>
                <th className="px-4 py-3.5">Segment Tier</th>
                <th className="px-4 py-3.5">Orders</th>
                <th className="px-4 py-3.5">Lifetime Value (LTV)</th>
                <th className="px-4 py-3.5 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d3573]/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FaSpinner className="text-xl animate-spin text-indigo-400" />
                      <span>Loading customer directory from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto flex flex-col items-center justify-center gap-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#111B3D] border border-[#1d3573] flex items-center justify-center text-indigo-400">
                        <FaUserCheck className="text-base" />
                      </div>
                      <span className="font-medium text-white text-sm">No customers found</span>
                      <p className="text-xs text-slate-400">
                        {customers.length === 0
                          ? 'No customers recorded yet. Add your first client to start building your CRM profiles.'
                          : 'No customers match your search or filter criteria.'}
                      </p>
                      {customers.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
                        >
                          <FaUserCheck className="text-xs" />
                          <span>Add First Customer</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#1a2d5a]/40 transition-colors">
                    {/* Client Profile */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-white text-sm">{cust.name}</div>
                      <div className="font-mono text-slate-500 text-[10px] mt-0.5">{cust.id}</div>
                    </td>

                    {/* Contact Details */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 font-mono text-slate-200">
                        <span>{cust.phone}</span>
                        <a
                          href={`tel:${cleanPhone(cust.phone)}`}
                          title="Call client"
                          className="text-slate-400 hover:text-indigo-400 transition-colors p-1"
                        >
                          <FaPhoneAlt className="text-[10px]" />
                        </a>
                        <a
                          href={getWhatsAppLink(cust.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open WhatsApp chat"
                          className="text-slate-400 hover:text-emerald-400 transition-colors p-1"
                        >
                          <FaWhatsapp className="text-xs" />
                        </a>
                      </div>
                      {cust.email && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]" title={cust.email}>
                          {cust.email}
                        </div>
                      )}
                    </td>

                    {/* City / Region */}
                    <td className="px-4 py-3.5 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <FaCity className="text-[10px] text-slate-500" />
                        <span>{cust.city || 'Egypt'}</span>
                      </div>
                    </td>

                    {/* Segment Tier with Inline Changer */}
                    <td className="px-4 py-3.5">
                      <div className="relative inline-block">
                        <select
                          value={cust.customerSegment}
                          disabled={updatingSegmentId === cust.id}
                          onChange={(e) => handleSegmentChange(cust.id, e.target.value)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all ${
                            cust.customerSegment === 'VIP'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                              : cust.customerSegment === 'Corporate'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                              : cust.customerSegment === 'Wholesale'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                              : 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20'
                          }`}
                        >
                          {CUSTOMER_SEGMENTS.map((seg) => (
                            <option key={seg} value={seg} className="bg-[#111B3D] text-white">
                              {seg}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Orders Count */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-slate-200 font-medium">
                        {cust.totalOrders}
                      </div>
                    </td>

                    {/* Lifetime Value */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-emerald-400">
                        {formatEGP(cust.lifetimeValue)}
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-3.5 text-right font-mono text-[11px] text-slate-400">
                      {new Date(cust.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Customer */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#16234D] border border-[#1d3573] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d3573] bg-[#09142E]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <FaUserCheck className="text-xs" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Add New Customer</h3>
                  <p className="text-[11px] text-slate-400">Register new client profile with segment assignment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <FaExclamationCircle className="shrink-0 text-sm" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Client Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dr. Sherif Allam"
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Email & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="client@domain.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    City / Governorate <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Cairo (New Cairo)"
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Segment Tier */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer Segment Tier</label>
                <select
                  value={form.customerSegment}
                  onChange={(e) => setForm({ ...form, customerSegment: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {CUSTOMER_SEGMENTS.map((seg) => (
                    <option key={seg} value={seg} className="bg-[#111B3D] text-white">
                      {seg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Orders & LTV */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Orders Count <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.totalOrders}
                    onChange={(e) => setForm({ ...form, totalOrders: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Lifetime Spend (EGP) <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={form.lifetimeValue}
                    onChange={(e) => setForm({ ...form, lifetimeValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Client Profile Notes & Preferences <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. VIP client, prefers Oud Royal and French Vanilla collections..."
                  className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1d3573]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-transparent hover:bg-white/5 border border-[#1d3573] text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="text-xs animate-spin" />
                      <span>Saving Customer...</span>
                    </>
                  ) : (
                    <span>Create Customer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
