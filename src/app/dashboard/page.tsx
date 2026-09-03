'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Quotation, Customer, Vehicle, Order } from '@/lib/domain/types';
import {
  TrendingUp,
  FileText,
  Clock,
  ShoppingBag,
  Plus,
  Search,
  Users,
  Car,
  ChevronRight,
  ArrowUpRight,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const { activeTenant, getAuthHeaders } = useTenant();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        const [quotesRes, ordersRes] = await Promise.all([
          fetch('/api/quotations', { headers }),
          fetch('/api/orders', { headers }),
        ]);

        const quotesData = await quotesRes.json();
        const ordersData = await ordersRes.json();

        if (quotesData.success) setQuotations(quotesData.data);
        if (ordersData.success) setOrders(ordersData.data);
      } catch (err) {
        console.error('Failed loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [activeTenant.id]);

  // Derived Metrics
  const totalQuotesCount = quotations.length;
  const approvedQuotes = quotations.filter((q) => q.status === 'APPROVED');
  const pendingSentQuotes = quotations.filter((q) => q.status === 'SENT');
  const draftQuotes = quotations.filter((q) => q.status === 'DRAFT');

  const conversionRate = totalQuotesCount > 0 ? Math.round((approvedQuotes.length / totalQuotesCount) * 100) : 0;
  const totalQuotedValue = quotations.reduce((sum, q) => sum + q.grandTotal, 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'FULFILLED' && o.status !== 'CANCELLED').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Workshop Header & Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Workshop
            </span>
            <span className="text-xs text-slate-400">{activeTenant.location}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {activeTenant.name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational Dashboard • Connected Quotations, Pricing & Procurement
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/parts"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search Parts</span>
          </Link>
          <Link
            href="/quotations/new"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Quotation Pipeline */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Quotation Pipeline</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white tracking-tight">
              R {totalQuotedValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-emerald-400 font-medium">{totalQuotesCount} total quotes</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{draftQuotes.length} drafts</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Quote Conversion Rate */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Conversion Rate</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white tracking-tight">{conversionRate}%</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-cyan-400 font-medium">{approvedQuotes.length} approved</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">High efficiency</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Pending Approvals (SENT) */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Awaiting Customer</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white tracking-tight">{pendingSentQuotes.length}</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-sky-400 font-medium">WhatsApp / SMS Sent</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Active Procurement Orders */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Orders</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white tracking-tight">{activeOrdersCount}</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-indigo-400 font-medium">Parts & Fulfillment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Quotations Activity Stream + Workshop Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quotations Stream (2 Columns) */}
        <div className="lg:col-span-2 glass-panel rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Quotations</h3>
              <p className="text-xs text-slate-400">Live quotation flow for this workshop tenant</p>
            </div>
            <Link
              href="/quotations"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-medium">No quotations created yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Start by creating your first quotation for a customer vehicle.
              </p>
              <Link
                href="/quotations/new"
                className="mt-4 inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-slate-950"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Quote</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {quotations.slice(0, 5).map((q) => (
                <Link
                  key={q.id}
                  href={`/quotations/${q.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:border-emerald-500/40 transition-colors">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {q.quotationNumber}
                        </span>
                        <StatusBadge status={q.status} />
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {q.customer ? `${q.customer.firstName} ${q.customer.lastName}` : 'Customer'} •{' '}
                        {q.vehicle ? `${q.vehicle.make} ${q.vehicle.model}` : 'Vehicle'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-white block">
                      R {q.grandTotal.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Workshop Configuration & Fast Shortcuts (1 Column) */}
        <div className="space-y-6">
          {/* Workshop Rates Card */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Workshop Parameters</h3>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Hourly Labor Rate:</span>
                <span className="font-bold text-white">R {activeTenant.hourlyLaborRate.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Default Parts Markup:</span>
                <span className="font-bold text-emerald-400">+{activeTenant.defaultMarkupPct}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Operating Currency:</span>
                <span className="font-bold text-white">{activeTenant.currency}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Tenant ID:</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                  {activeTenant.id}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/quotations/new"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Start Quotation Slice</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                href="/parts"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Compare Supplier Offers</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                href="/customers"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Customer & Vehicle Directory</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
