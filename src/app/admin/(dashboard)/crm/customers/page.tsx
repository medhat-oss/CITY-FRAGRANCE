'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaUserCheck, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  segment: 'VIP Retail' | 'Wholesale' | 'Corporate' | 'Loyal Customer';
  totalSpent: string;
  ordersCount: number;
  lastActive: string;
}

const SAMPLE_CUSTOMERS: CustomerRecord[] = [
  { id: 'CUST-001', name: 'Dr. Sherif Allam', phone: '+20 100 234 5678', email: 's.allam@apex.eg', city: 'Cairo (New Cairo)', segment: 'VIP Retail', totalSpent: '18,450 EGP', ordersCount: 9, lastActive: 'Yesterday' },
  { id: 'CUST-002', name: 'Farida Hegazy', phone: '+20 111 876 5432', email: 'farida.h@outlook.com', city: 'Alexandria', segment: 'Corporate', totalSpent: '54,200 EGP', ordersCount: 4, lastActive: '3 days ago' },
  { id: 'CUST-003', name: 'Mostafa El-Gohary', phone: '+20 122 345 6789', email: 'm.gohary@giza-group.com', city: 'Giza (Sheikh Zayed)', segment: 'Wholesale', totalSpent: '124,000 EGP', ordersCount: 12, lastActive: 'Oct 21, 2026' },
  { id: 'CUST-004', name: 'Laila Rostom', phone: '+20 102 987 6543', email: 'laila.rostom@gmail.com', city: 'Cairo (Maadi)', segment: 'Loyal Customer', totalSpent: '9,800 EGP', ordersCount: 6, lastActive: 'Oct 19, 2026' },
  { id: 'CUST-005', name: 'Hossam El-Din', phone: '+20 114 555 4321', email: 'hossam@redsea-marina.eg', city: 'Hurghada', segment: 'Corporate', totalSpent: '38,500 EGP', ordersCount: 3, lastActive: 'Oct 18, 2026' },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.city.toLowerCase().includes(search.toLowerCase())
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
            <span className="text-indigo-400">Customers</span>
          </div>
          <h1 className="text-2xl font-semibold text-white font-heading">Customer Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">Centralized client profiles, order history, VIP tiers, and customer lifetime value (LTV).</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm"
          >
            <FaUserCheck className="text-xs" />
            <span>Add Customer</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16234D] border border-[#1d3573] hover:bg-[#1a2d5a] text-slate-300 text-xs font-medium transition-all"
          >
            <FaDownload className="text-xs" />
            <span>Export CSV</span>
          </button>
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

      {/* Customer Directory Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-[#1d3573] bg-[#16234D]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#1d3573] bg-[#09142E] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3.5">Customer ID</th>
                <th className="px-4 py-3.5">Client Name</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">City / Region</th>
                <th className="px-4 py-3.5">Segment Tier</th>
                <th className="px-4 py-3.5">Total Spend</th>
                <th className="px-4 py-3.5">Orders</th>
                <th className="px-4 py-3.5">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d3573]/50">
              {filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-[#1a2d5a]/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-indigo-300">{cust.id}</td>
                  <td className="px-4 py-3.5 font-medium text-white">{cust.name}</td>
                  <td className="px-4 py-3.5 text-slate-300">
                    <div>{cust.phone}</div>
                    <div className="text-[11px] text-slate-500">{cust.email}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">{cust.city}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        cust.segment === 'VIP Retail'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : cust.segment === 'Wholesale'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : cust.segment === 'Corporate'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                      }`}
                    >
                      {cust.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-400">{cust.totalSpent}</td>
                  <td className="px-4 py-3.5 text-slate-300">{cust.ordersCount}</td>
                  <td className="px-4 py-3.5 text-slate-400">{cust.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
