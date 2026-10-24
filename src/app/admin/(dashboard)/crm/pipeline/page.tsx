'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaSpinner,
  FaCalendarAlt,
  FaBuilding,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowsAlt,
  FaDollarSign,
  FaTrophy,
} from 'react-icons/fa';
import { formatEGP } from '@/utils/currency';

interface CrmLeadSummary {
  id: string;
  name: string;
  phone: string;
  company: string;
  customerId?: string | null;
}

interface CrmDeal {
  id: string;
  title: string;
  expectedValue: number;
  stage: string;
  leadId: string | null;
  customerId: string | null;
  closingDate: string | null;
  notes: string;
  createdAt: string;
  lead?: {
    id: string;
    name: string;
    phone: string;
    company: string;
    preferredNotes?: string | null;
  } | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
    customerSegment: string;
  } | null;
}

interface StageConfig {
  id: string;
  title: string;
  accent: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

const PIPELINE_STAGES: StageConfig[] = [
  {
    id: 'Lead In',
    title: 'Lead In',
    accent: '#38bdf8',
    badgeBg: 'bg-sky-500/10',
    badgeBorder: 'border-sky-500/20',
    badgeText: 'text-sky-400',
  },
  {
    id: 'Qualified',
    title: 'Qualified',
    accent: '#f59e0b',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/20',
    badgeText: 'text-amber-400',
  },
  {
    id: 'Proposal Sent',
    title: 'Proposal Sent',
    accent: '#a855f7',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/20',
    badgeText: 'text-purple-400',
  },
  {
    id: 'Closed Won',
    title: 'Closed Won',
    accent: '#22c55e',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/20',
    badgeText: 'text-emerald-400',
  },
  {
    id: 'Closed Lost',
    title: 'Closed Lost',
    accent: '#f43f5e',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/20',
    badgeText: 'text-rose-400',
  },
];

interface NewDealForm {
  title: string;
  expectedValue: string;
  stage: string;
  leadId: string;
  closingDate: string;
  notes: string;
}

const INITIAL_FORM: NewDealForm = {
  title: '',
  expectedValue: '',
  stage: 'Lead In',
  leadId: '',
  closingDate: '',
  notes: '',
};

export default function PipelinePage() {
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [leads, setLeads] = useState<CrmLeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Drag & Drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewDealForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch deals & leads
  const fetchPipelineData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/admin/crm/deals');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.deals)) setDeals(data.deals);
        if (Array.isArray(data.leads)) setLeads(data.leads);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelineData();
  }, [fetchPipelineData]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle stage change (both drag & drop and selector)
  const handleMoveStage = async (dealId: string, targetStage: string) => {
    const currentDeal = deals.find((d) => d.id === dealId);
    if (!currentDeal || currentDeal.stage === targetStage) return;

    // Optimistic UI update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage } : d))
    );
    setToastMessage(`Moved to ${targetStage}`);

    try {
      const res = await fetch('/api/admin/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dealId, stage: targetStage }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback on failure
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: currentDeal.stage } : d))
        );
        setToastMessage('Failed to update stage. Reverting.');
      }
    } catch {
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: currentDeal.stage } : d))
      );
      setToastMessage('Network error. Reverting stage.');
    }
  };

  // Drag Handlers
  const handleDragStart = (dealId: string) => {
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (stageId: string) => {
    if (dragOverStage === stageId) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (stageId: string) => {
    setDragOverStage(null);
    if (draggedDealId) {
      handleMoveStage(draggedDealId, stageId);
      setDraggedDealId(null);
    }
  };

  // Create Deal Submit
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setFormError('Please enter a deal title.');
      return;
    }
    const val = parseFloat(form.expectedValue);
    if (isNaN(val) || val < 0) {
      setFormError('Please enter a valid expected value.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          expectedValue: val,
          stage: form.stage,
          leadId: form.leadId || null,
          closingDate: form.closingDate || null,
          notes: form.notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create deal');
      }

      // Prepend optimistically
      setDeals((prev) => [data.deal, ...prev]);
      setModalOpen(false);
      setForm(INITIAL_FORM);
      setToastMessage(`Deal "${data.deal.title}" created successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create deal';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    if (!search.trim()) return deals;
    const q = search.toLowerCase();
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.lead?.name && d.lead.name.toLowerCase().includes(q)) ||
        (d.lead?.company && d.lead.company.toLowerCase().includes(q)) ||
        (d.customer?.name && d.customer.name.toLowerCase().includes(q)) ||
        d.stage.toLowerCase().includes(q)
    );
  }, [deals, search]);

  // Top Metrics Calculation
  const metrics = useMemo(() => {
    let pipelineTotal = 0;
    let wonTotal = 0;
    let activeCount = 0;
    let wonCount = 0;
    let lostCount = 0;

    deals.forEach((d) => {
      const val = d.expectedValue || 0;
      if (d.stage === 'Closed Won') {
        wonTotal += val;
        wonCount += 1;
      } else if (d.stage === 'Closed Lost') {
        lostCount += 1;
      } else {
        // Active stages (Lead In, Qualified, Proposal Sent)
        pipelineTotal += val;
        activeCount += 1;
      }
    });

    const resolved = wonCount + lostCount;
    const winRate = resolved > 0 ? Math.round((wonCount / resolved) * 100) : 0;

    return { pipelineTotal, wonTotal, activeCount, winRate };
  }, [deals]);

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
            <span className="text-indigo-400 font-medium">Sales Pipeline</span>
          </div>
          <h1 className="text-2xl font-semibold text-white font-heading">Sales Pipeline & Deals</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive Kanban board for corporate gift orders, wholesale distribution, and bespoke contracts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchPipelineData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16234D] border border-[#1d3573] hover:bg-[#1a2d5a] text-slate-300 text-xs font-medium transition-all"
            title="Refresh pipeline"
          >
            <FaSyncAlt className={`text-xs ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
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
            <FaPlus className="text-xs" />
            <span>+ New Deal</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip (Odoo ERP inspired) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FaDollarSign className="text-indigo-400 text-xs" /> Active Pipeline
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono">
              {formatEGP(metrics.pipelineTotal)}
            </span>
            <span className="text-[11px] text-slate-400">{metrics.activeCount} open deals</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <FaTrophy className="text-emerald-400 text-xs" /> Won Revenue
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono">
              {formatEGP(metrics.wonTotal)}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Closed
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">Active Deals</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-sky-300 font-mono">{metrics.activeCount}</span>
            <span className="text-[11px] text-slate-400">In negotiation</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
          <span className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">Win Rate</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-300 font-mono">{metrics.winRate}%</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Resolved
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-3 p-3 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by title, company, or contact person..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-[#1d3573] bg-[#16234D]/50 text-slate-400 gap-3">
          <FaSpinner className="text-2xl animate-spin text-indigo-400" />
          <span className="text-xs">Loading pipeline deals...</span>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex items-start gap-4 min-w-[1100px]">
            {PIPELINE_STAGES.map((col) => {
              const stageDeals = filteredDeals.filter((d) => d.stage === col.id);
              const columnSum = stageDeals.reduce((sum, d) => sum + (d.expectedValue || 0), 0);
              const isOver = dragOverStage === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={() => handleDragLeave(col.id)}
                  onDrop={() => handleDrop(col.id)}
                  className={`flex-1 flex flex-col rounded-2xl border transition-all duration-200 p-3.5 min-h-[580px] ${
                    isOver
                      ? 'border-indigo-500 bg-[#16234D] ring-2 ring-indigo-500/20 shadow-xl'
                      : 'border-[#1d3573] bg-[#16234D]/80'
                  }`}
                >
                  {/* Column Header */}
                  <div className="pb-3 mb-3 border-b border-[#1d3573]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: col.accent }}
                        />
                        <h3 className="text-xs font-semibold text-white font-heading truncate">
                          {col.title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#111B3D] border border-[#1d3573] text-slate-300">
                        {stageDeals.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total Value</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {formatEGP(columnSum)}
                      </span>
                    </div>
                  </div>

                  {/* Deals Stack */}
                  <div className="flex flex-col gap-2.5 flex-1">
                    {stageDeals.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-[#1d3573]/60 rounded-xl text-center text-slate-500 text-xs">
                        <span>Drop deals here</span>
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={() => handleDragStart(deal.id)}
                          className="group relative p-3.5 rounded-xl border border-[#1d3573] bg-[#111B3D] hover:border-indigo-500/60 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing"
                        >
                          {/* Card Header: Value & Drag Grip */}
                          <div className="flex items-center justify-between mb-1.5 text-[11px]">
                            <span className="font-mono font-bold text-emerald-400 text-xs">
                              {formatEGP(deal.expectedValue)}
                            </span>
                            <span className="text-slate-500 group-hover:text-slate-400 transition-colors">
                              <FaArrowsAlt className="text-[10px]" />
                            </span>
                          </div>

                          {/* Deal Title */}
                          <h4 className="text-xs font-semibold text-white leading-snug mb-2 group-hover:text-indigo-200 transition-colors">
                            {deal.title}
                          </h4>

                          {/* Associated Lead / Account */}
                          {deal.lead ? (
                            <div className="mb-2 text-[11px] text-slate-300">
                              <div className="font-medium text-slate-200 truncate">{deal.lead.name}</div>
                              {deal.lead.company && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                  <FaBuilding className="text-[9px] text-slate-500" />
                                  <span className="truncate">{deal.lead.company}</span>
                                </div>
                              )}
                            </div>
                          ) : deal.customer ? (
                            <div className="mb-2 text-[11px] text-slate-300">
                              <div className="font-medium text-slate-200 truncate">{deal.customer.name}</div>
                              <div className="text-[10px] text-indigo-400">VIP Client</div>
                            </div>
                          ) : (
                            <div className="mb-2 text-[10px] text-slate-500 italic">Standalone Deal</div>
                          )}

                          {/* Closing Date & Notes */}
                          {deal.closingDate && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mb-2">
                              <FaCalendarAlt className="text-[9px] text-indigo-400" />
                              <span>Target: {new Date(deal.closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}

                          {/* Card Footer: Quick Stage Switcher Dropdown */}
                          <div className="pt-2 border-t border-[#1d3573]/60 flex items-center justify-between gap-1 text-[10px]">
                            <span className="text-slate-500">Move:</span>
                            <select
                              value={deal.stage}
                              onChange={(e) => handleMoveStage(deal.id, e.target.value)}
                              className="bg-[#16234D] border border-[#1d3573] text-slate-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s.id} value={s.id} className="bg-[#111B3D] text-white">
                                  {s.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create New Deal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#16234D] border border-[#1d3573] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d3573] bg-[#09142E]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <FaPlus className="text-xs" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Add New Deal</h3>
                  <p className="text-[11px] text-slate-400">Register new prospective contract or wholesale order</p>
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
            <form onSubmit={handleCreateDeal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <FaExclamationCircle className="shrink-0 text-sm" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Deal Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deal Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Corporate Year-End Gift Sets 50pcs"
                  className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Value & Stage Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expected Value (EGP) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={form.expectedValue}
                    onChange={(e) => setForm({ ...form, expectedValue: e.target.value })}
                    placeholder="e.g. 75000"
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Stage</label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#111B3D] text-white">
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lead Association */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Link to Registered Lead <span className="text-slate-500">(Optional)</span>
                </label>
                <select
                  value={form.leadId}
                  onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="" className="bg-[#111B3D] text-slate-400">
                    -- Standalone Deal (No Lead Linked) --
                  </option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id} className="bg-[#111B3D] text-white">
                      {l.name} {l.company ? `(${l.company})` : ''} - {l.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Closing Date */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Closing Date <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={form.closingDate}
                  onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deal Notes & Terms <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Client requested customized wooden boxes with metallic hot-stamped logos..."
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
                      <span>Saving Deal...</span>
                    </>
                  ) : (
                    <span>Create Deal</span>
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
