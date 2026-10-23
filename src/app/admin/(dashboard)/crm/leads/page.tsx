'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaUserPlus, FaFilter, FaDownload, FaSearch } from 'react-icons/fa';

interface LeadPlaceholder {
  id: string;
  name: string;
  company: string;
  source: string;
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal';
  value: string;
  date: string;
}

const SAMPLE_LEADS: LeadPlaceholder[] = [
  { id: 'LD-101', name: 'Karim Mansour', company: 'Nile Hospitality Group', source: 'Website Inquiry', stage: 'Qualified', value: '45,000 EGP', date: 'Oct 23, 2026' },
  { id: 'LD-102', name: 'Nouran El-Shazly', company: 'Cairo Boutique Hotel', source: 'Direct Referral', stage: 'Proposal', value: '78,000 EGP', date: 'Oct 22, 2026' },
  { id: 'LD-103', name: 'Tarek Zaki', company: 'Giza Retail Co.', source: 'Inbound Call', stage: 'Contacted', value: '24,000 EGP', date: 'Oct 21, 2026' },
  { id: 'LD-104', name: 'Salma Farid', company: 'Alexandria Spa Resort', source: 'Trade Event', stage: 'New', value: '62,000 EGP', date: 'Oct 20, 2026' },
];

export default function LeadsPage() {
  const [search, setSearch] = useState('');

  const filteredLeads = SAMPLE_LEADS.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.source.toLowerCase().includes(search.toLowerCase())
  );

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
            <span className="text-indigo-400">Leads</span>
          </div>
          <h1 className="text-2xl font-semibold text-white font-heading">Leads Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track prospective wholesale clients, corporate gifting, and high-value inquiries.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm"
          >
            <FaUserPlus className="text-xs" />
            <span>New Lead</span>
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

      {/* Filter / Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-xl bg-[#16234D]/80 border border-[#1d3573]">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, company, or source..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111B3D] border border-[#1d3573] text-xs text-slate-300 hover:text-white transition-colors"
          >
            <FaFilter className="text-xs" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-[#1d3573] bg-[#16234D]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#1d3573] bg-[#09142E] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3.5">Lead ID</th>
                <th className="px-4 py-3.5">Contact Name</th>
                <th className="px-4 py-3.5">Company / Account</th>
                <th className="px-4 py-3.5">Source</th>
                <th className="px-4 py-3.5">Stage</th>
                <th className="px-4 py-3.5">Estimated Value</th>
                <th className="px-4 py-3.5">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d3573]/50">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#1a2d5a]/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-indigo-300">{lead.id}</td>
                  <td className="px-4 py-3.5 font-medium text-white">{lead.name}</td>
                  <td className="px-4 py-3.5 text-slate-300">{lead.company}</td>
                  <td className="px-4 py-3.5 text-slate-400">{lead.source}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        lead.stage === 'New'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : lead.stage === 'Contacted'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : lead.stage === 'Qualified'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-400">{lead.value}</td>
                  <td className="px-4 py-3.5 text-slate-400">{lead.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
