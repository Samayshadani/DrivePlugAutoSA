'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { Quotation, QuotationStatus } from '@/lib/domain/types';
import { StatusBadge } from '@/components/ui/Badge';
import {
  FileText,
  Search,
  Plus,
  ChevronRight,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function QuotationsPage() {
  const { activeTenant, getAuthHeaders } = useTenant();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const tabs = ['ALL', 'DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'];

  useEffect(() => {
    async function loadQuotations() {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        const url = activeTab === 'ALL' ? '/api/quotations' : `/api/quotations?status=${activeTab}`;
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (data.success) {
          setQuotations(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadQuotations();
  }, [activeTenant.id, activeTab]);

  const filteredQuotes = quotations.filter((q) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      q.quotationNumber.toLowerCase().includes(query) ||
      (q.customer && `${q.customer.firstName} ${q.customer.lastName}`.toLowerCase().includes(query)) ||
      (q.vehicle && `${q.vehicle.make} ${q.vehicle.model} ${q.vehicle.licensePlate}`.toLowerCase().includes(query))
    );
  });

  const totalValue = filteredQuotes.reduce((acc, q) => acc + q.grandTotal, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quotations Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track and manage full lifecycle quotes for {activeTenant.name}
          </p>
        </div>

        <Link
          href="/quotations/new"
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quote</span>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quote #, customer, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Summary Strip */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs">
        <span className="text-slate-400">
          Showing <strong className="text-white">{filteredQuotes.length}</strong> quotations
        </span>
        <span className="text-slate-400">
          Total Value:{' '}
          <strong className="text-emerald-400 font-mono">
            R {totalValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </strong>
        </span>
      </div>

      {/* Quotations List */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading quotations...</div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No quotations found</p>
            <p className="text-xs text-slate-500 mt-1">
              No quotes match the selected status filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredQuotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/quotations/${quote.id}`}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors group"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 group-hover:border-emerald-500/40 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {quote.quotationNumber}
                      </span>
                      <StatusBadge status={quote.status} />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {quote.customer ? `${quote.customer.firstName} ${quote.customer.lastName}` : 'Customer'} •{' '}
                      {quote.vehicle ? `${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}` : 'Vehicle'}
                    </div>
                    {quote.notes && (
                      <div className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                        {quote.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-bold text-white block">
                      R {quote.grandTotal.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Parts: R {quote.partsSubtotal.toFixed(2)} | Labor: R {quote.laborSubtotal.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Created {new Date(quote.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
