'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FaUserPlus,
  FaFilter,
  FaDownload,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaSpinner,
  FaPhoneAlt,
  FaWhatsapp,
  FaBuilding,
  FaTag,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';
import { formatEGP } from '@/utils/currency';

interface CrmLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  source: string;
  status: string;
  preferredNotes: string | null;
  purchaseOccasion: string | null;
  estimatedBudget: number | null;
  notes: string;
  customerId: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
    customerSegment: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface NewLeadForm {
  name: string;
  phone: string;
  email: string;
  company: string;
  source: string;
  status: string;
  preferredNotes: string;
  purchaseOccasion: string;
  estimatedBudget: string;
  notes: string;
}

const INITIAL_FORM: NewLeadForm = {
  name: '',
  phone: '',
  email: '',
  company: '',
  source: 'Website',
  status: 'New',
  preferredNotes: '',
  purchaseOccasion: 'Personal Signature',
  estimatedBudget: '',
  notes: '',
};

const LEAD_SOURCES = [
  'Website',
  'Instagram',
  'Facebook',
  'Walk-in Store',
  'Referral',
  'Phone Call',
  'Corporate Inquiry',
];

const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Lost', 'Converted'];

const OCCASIONS = [
  'Personal Signature',
  'Wedding Gifting',
  'Corporate Gifts',
  'VIP Gifting',
  'Wholesale Resale',
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewLeadForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Fetch leads from backend API
  const fetchLeads = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/admin/crm/leads');
      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Failed to fetch CRM leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle Form Submission
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Please enter a contact name.');
      return;
    }
    if (!form.phone.trim()) {
      setFormError('Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          source: form.source,
          status: form.status,
          preferredNotes: form.preferredNotes.trim() || null,
          purchaseOccasion: form.purchaseOccasion,
          estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : null,
          notes: form.notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create lead');
      }

      // Prepend to leads list optimistically
      setLeads((prev) => [data.lead, ...prev]);
      setModalOpen(false);
      setForm(INITIAL_FORM);
      setToastMessage(`Lead "${data.lead.name}" successfully created!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while creating the lead';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Inline Quick Status Change
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingStatusId(leadId);
    try {
      const res = await fetch('/api/admin/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead))
        );
        setToastMessage(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        lead.name.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        (lead.preferredNotes && lead.preferredNotes.toLowerCase().includes(q)) ||
        lead.source.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'ALL' || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  // KPI Counts
  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === 'New').length;
    const contacted = leads.filter((l) => l.status === 'Contacted').length;
    const qualified = leads.filter((l) => l.status === 'Qualified' || l.status === 'Converted').length;
    return { total, newCount, contacted, qualified };
  }, [leads]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['Lead ID', 'Name', 'Phone', 'Email', 'Company', 'Source', 'Status', 'Preferred Notes', 'Occasion', 'Budget EGP', 'Created At'];
    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.company.replace(/"/g, '""')}"`,
      `"${l.source}"`,
      `"${l.status}"`,
      `"${(l.preferredNotes || '').replace(/"/g, '""')}"`,
      `"${l.purchaseOccasion || ''}"`,
      l.estimatedBudget || 0,
      `"${new Date(l.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <span className="text-indigo-400 font-medium">Leads Management</span>
          </div>
          <h1 className="text-2xl font-semibold text-white font-heading">Leads & Inquiries</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track prospective wholesale clients, corporate gifting, and bespoke fragrance inquiries.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLeads(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16234D] border border-[#1d3573] hover:bg-[#1a2d5a] text-slate-300 text-xs font-medium transition-all"
            title="Refresh leads"
          >
            <FaSyncAlt className={`text-xs ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
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
            <FaUserPlus className="text-xs" />
            <span>+ New Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip (Odoo ERP inspired) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Leads</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{stats.total}</span>
            <span className="text-[11px] text-slate-400">All channels</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">New Inquiries</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-300 font-mono">{stats.newCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Needs Contact</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Contacted</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-300 font-mono">{stats.contacted}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">In Progress</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Qualified / Hot</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-300 font-mono">{stats.qualified}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">High Value</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, phone, company, or fragrance notes..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#111B3D] border border-[#1d3573] rounded-lg px-2.5 py-1 text-xs">
            <FaFilter className="text-slate-400 text-[10px]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111B3D] text-white">All Statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#111B3D] text-white">{s}</option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5 bg-[#111B3D] border border-[#1d3573] rounded-lg px-2.5 py-1 text-xs">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111B3D] text-white">All Sources</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s} className="bg-[#111B3D] text-white">{s}</option>
              ))}
            </select>
          </div>

          {(search || statusFilter !== 'ALL' || sourceFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setSourceFilter('ALL');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="w-full overflow-hidden rounded-2xl border border-[#1d3573] bg-[#16234D] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#1d3573] bg-[#09142E] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3.5">Contact / Company</th>
                <th className="px-4 py-3.5">Phone & Channel</th>
                <th className="px-4 py-3.5">Fragrance Preferences</th>
                <th className="px-4 py-3.5">Occasion & Budget</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d3573]/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FaSpinner className="text-xl animate-spin text-indigo-400" />
                      <span>Loading leads from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto flex flex-col items-center justify-center gap-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#111B3D] border border-[#1d3573] flex items-center justify-center text-indigo-400">
                        <FaUserPlus className="text-base" />
                      </div>
                      <span className="font-medium text-white text-sm">No leads found</span>
                      <p className="text-xs text-slate-400">
                        {leads.length === 0
                          ? 'No leads have been registered yet. Add your first client inquiry to get started.'
                          : 'No leads match your current search or filter criteria.'}
                      </p>
                      {leads.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
                        >
                          <FaUserPlus className="text-xs" />
                          <span>Add First Lead</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#1a2d5a]/40 transition-colors">
                    {/* Contact & Company */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-white text-sm">{lead.name}</div>
                      {lead.company ? (
                        <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                          <FaBuilding className="text-[10px] text-slate-500" />
                          <span>{lead.company}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 mt-0.5">Individual Client</div>
                      )}
                      {lead.customer && (
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-medium">
                          Linked Customer ({lead.customer.customerSegment})
                        </span>
                      )}
                    </td>

                    {/* Phone & Communication */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 font-mono text-slate-200">
                        <span>{lead.phone}</span>
                        <a
                          href={`tel:${cleanPhone(lead.phone)}`}
                          title="Call client"
                          className="text-slate-400 hover:text-indigo-400 transition-colors p-1"
                        >
                          <FaPhoneAlt className="text-[10px]" />
                        </a>
                        <a
                          href={getWhatsAppLink(lead.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open WhatsApp chat"
                          className="text-slate-400 hover:text-emerald-400 transition-colors p-1"
                        >
                          <FaWhatsapp className="text-xs" />
                        </a>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-[#111B3D] border border-[#1d3573] text-slate-300">
                          {lead.source}
                        </span>
                        {lead.email && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[140px]" title={lead.email}>
                            {lead.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Fragrance Preferences */}
                    <td className="px-4 py-3.5">
                      {lead.preferredNotes ? (
                        <div className="flex items-start gap-1.5 max-w-xs">
                          <FaTag className="text-[10px] text-indigo-400 shrink-0 mt-0.5" />
                          <span className="text-slate-200 text-xs leading-relaxed font-serif italic">
                            {lead.preferredNotes}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Not specified</span>
                      )}
                    </td>

                    {/* Occasion & Budget */}
                    <td className="px-4 py-3.5">
                      <div className="text-slate-200 font-medium">
                        {lead.purchaseOccasion || 'General Inquiry'}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                        {lead.estimatedBudget ? formatEGP(lead.estimatedBudget) : 'Budget Open'}
                      </div>
                    </td>

                    {/* Status with Quick Inline Changer */}
                    <td className="px-4 py-3.5">
                      <div className="relative inline-block">
                        <select
                          value={lead.status}
                          disabled={updatingStatusId === lead.id}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all ${
                            lead.status === 'New'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                              : lead.status === 'Contacted'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                              : lead.status === 'Qualified'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : lead.status === 'Converted'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-[#111B3D] text-white">
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 text-right font-mono text-[11px] text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString('en-US', {
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

      {/* Modal: Create New Lead */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#16234D] border border-[#1d3573] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d3573] bg-[#09142E]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <FaUserPlus className="text-sm" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Create New Lead</h3>
                  <p className="text-[11px] text-slate-400">Register incoming customer inquiry or corporate account</p>
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
            <form onSubmit={handleSubmitLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <FaExclamationCircle className="shrink-0 text-sm" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contact Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Karim Mansour"
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
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Company & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Company / Organization <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Nile Hospitality Group"
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Source & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Lead Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s} className="bg-[#111B3D] text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-[#111B3D] text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Occasion & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Occasion</label>
                  <select
                    value={form.purchaseOccasion}
                    onChange={(e) => setForm({ ...form, purchaseOccasion: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ} value={occ} className="bg-[#111B3D] text-white">
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estimated Budget (EGP) <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={form.estimatedBudget}
                    onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Preferred Notes / Fragrance Taste */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Fragrance Preferences & Notes
                </label>
                <textarea
                  rows={2}
                  value={form.preferredNotes}
                  onChange={(e) => setForm({ ...form, preferredNotes: e.target.value })}
                  placeholder="e.g. Loves rich Cambodian Oud, smoky leather, vanilla, and French floral accords..."
                  className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-serif italic"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Internal Notes & Follow-up Details
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Wants custom engraved 50ml bottles for executive gifts by next month..."
                  className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
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
                      <span>Saving Lead...</span>
                    </>
                  ) : (
                    <span>Create Lead</span>
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
