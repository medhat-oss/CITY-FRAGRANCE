'use client';

import Link from 'next/link';
import { FaPlus, FaFilter, FaDownload } from 'react-icons/fa';

interface DealCard {
  id: string;
  title: string;
  account: string;
  amount: string;
  owner: string;
}

interface PipelineColumn {
  id: string;
  title: string;
  accent: string;
  totalValue: string;
  deals: DealCard[];
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    id: 'lead-in',
    title: 'Lead In',
    accent: '#38bdf8',
    totalValue: '86,000 EGP',
    deals: [
      { id: 'D-201', title: 'Corporate Year-End Gift Sets', account: 'Apex Capital', amount: '54,000 EGP', owner: 'Sales Desk' },
      { id: 'D-202', title: 'VIP Signature Fragrance Order', account: 'Red Sea Marina', amount: '32,000 EGP', owner: 'Medhat E.' },
    ],
  },
  {
    id: 'qualified',
    title: 'Qualified',
    accent: '#f59e0b',
    totalValue: '120,000 EGP',
    deals: [
      { id: 'D-203', title: 'Boutique Retail Consignment', account: 'Zamalek Concept Store', amount: '120,000 EGP', owner: 'Medhat E.' },
    ],
  },
  {
    id: 'proposal',
    title: 'Proposal Sent',
    accent: '#a855f7',
    totalValue: '95,000 EGP',
    deals: [
      { id: 'D-204', title: 'Private Event Scent Bar', account: 'Etoile Events', amount: '95,000 EGP', owner: 'Sales Desk' },
    ],
  },
  {
    id: 'won',
    title: 'Closed Won',
    accent: '#22c55e',
    totalValue: '185,000 EGP',
    deals: [
      { id: 'D-205', title: 'Luxury Hotel Room Sprays (Q4)', account: 'Nile Palace Hotel', amount: '185,000 EGP', owner: 'Medhat E.' },
    ],
  },
];

export default function PipelinePage() {
  return (
    <div dir="ltr" className="w-full max-w-full min-w-0">
      {/* Breadcrumb & Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-slate-200">CRM</span>
            <span>/</span>
            <span className="text-indigo-400">Sales Pipeline</span>
          </div>
          <h1 className="text-2xl font-semibold text-white font-heading">Sales Pipeline & Deals</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage enterprise B2B sales cycles, corporate partnerships, and bulk orders.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm"
          >
            <FaPlus className="text-xs" />
            <span>New Deal</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16234D] border border-[#1d3573] hover:bg-[#1a2d5a] text-slate-300 text-xs font-medium transition-all"
          >
            <FaFilter className="text-xs" />
            <span>Filter</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16234D] border border-[#1d3573] hover:bg-[#1a2d5a] text-slate-300 text-xs font-medium transition-all"
          >
            <FaDownload className="text-xs" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIPELINE_COLUMNS.map((col) => (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl border border-[#1d3573] bg-[#16234D]/80 p-4 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1d3573]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: col.accent }}
                />
                <h3 className="text-sm font-semibold text-white font-heading">{col.title}</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111B3D] text-slate-400">
                  {col.deals.length}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-300">{col.totalValue}</span>
            </div>

            {/* Deal Cards */}
            <div className="flex flex-col gap-3 flex-1">
              {col.deals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-3.5 rounded-xl border border-[#1d3573] bg-[#111B3D] hover:border-indigo-500/50 hover:bg-[#111B3D]/80 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{deal.id}</span>
                    <span className="text-emerald-400 font-semibold font-sans">{deal.amount}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white mb-1 leading-snug">{deal.title}</h4>
                  <p className="text-[11px] text-slate-400 mb-2.5">{deal.account}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#1d3573]/50 text-[10px] text-slate-500">
                    <span>Owner</span>
                    <span className="text-slate-300 font-medium">{deal.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
