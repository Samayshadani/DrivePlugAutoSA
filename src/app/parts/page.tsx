'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { PartWithSupplierOffers } from '@/lib/domain/parts/parts.repository';
import {
  Search,
  Layers,
  Building2,
  Clock,
  Package,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function PartsCataloguePage() {
  const { activeTenant, getAuthHeaders } = useTenant();
  const [parts, setParts] = useState<PartWithSupplierOffers[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const categories = ['ALL', 'Braking System', 'Service & Engine', 'Ignition & Electrical', 'Belts & Cooling'];

  useEffect(() => {
    async function loadParts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('q', search);
        if (category !== 'ALL') queryParams.set('category', category);

        const res = await fetch(`/api/parts/search?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setParts(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadParts();
  }, [search, category]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Live Supplier Aggregator
            </span>
            <span className="text-xs text-slate-400">Multi-Wholesaler Comparison Feed</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Parts Catalogue & Supplier Pricing Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare wholesale cost, stock availability, and lead times across verified South African automotive suppliers.
          </p>
        </div>

        <Link
          href="/quotations/new"
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </Link>
      </div>

      {/* Filter Controls: Search & Category Chips */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search part name, SKU, or OEM reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Parts Cards with Supplier Pricing Matrix */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading live supplier price feeds...</div>
      ) : parts.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800">
          <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">No parts found</p>
          <p className="text-xs text-slate-500 mt-1">Try searching for &quot;brake&quot;, &quot;filter&quot;, or &quot;spark plug&quot;</p>
        </div>
      ) : (
        <div className="space-y-6">
          {parts.map((part) => {
            const bestOffer = part.supplierOffers[0];

            return (
              <div
                key={part.id}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700/80 transition-all shadow-xl"
              >
                {/* Part Header */}
                <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white">{part.name}</h3>
                        {part.isOem ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            OEM GENUINE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                            AFTERMARKET
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="font-mono text-cyan-400">Part #: {part.partNumber}</span>
                        {part.oemReference && (
                          <span className="font-mono text-slate-500">OEM Ref: {part.oemReference}</span>
                        )}
                        <span className="px-2 py-0.2 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                          {part.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {bestOffer && (
                    <div className="text-left sm:text-right bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold block">
                        Best Wholesale Price
                      </span>
                      <span className="text-base font-extrabold text-white">
                        R {bestOffer.costPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">via {bestOffer.supplierName}</span>
                    </div>
                  )}
                </div>

                {/* Supplier Offers Comparison Matrix */}
                <div className="p-5">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Supplier Offers Comparison ({part.supplierOffers.length} available)</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="py-2.5 px-3">Supplier Wholesaler</th>
                          <th className="py-2.5 px-3">Wholesale Cost</th>
                          <th className="py-2.5 px-3">
                            Workshop Price (+{activeTenant.defaultMarkupPct}%)
                          </th>
                          <th className="py-2.5 px-3">Stock & Availability</th>
                          <th className="py-2.5 px-3">Lead Time</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 font-mono">
                        {part.supplierOffers.map((offer) => {
                          const retailPrice = offer.costPrice * (1 + activeTenant.defaultMarkupPct / 100);

                          return (
                            <tr key={offer.id} className="hover:bg-slate-850/50 transition-colors">
                              <td className="py-3 px-3 font-sans">
                                <span className="font-bold text-white block">{offer.supplierName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  SKU: {offer.supplierSku}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-sm font-bold text-white">
                                  R {offer.costPrice.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-sm font-bold text-emerald-400">
                                  R {retailPrice.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-500 block font-sans">
                                  +{activeTenant.defaultMarkupPct}% margin
                                </span>
                              </td>
                              <td className="py-3 px-3 font-sans">
                                {offer.availability === 'IN_STOCK' ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{offer.stockQuantity} In Stock</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>{offer.stockQuantity} Low Stock</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-sans">
                                <span className="flex items-center space-x-1 text-slate-300">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{offer.leadTimeDays} {offer.leadTimeDays === 1 ? 'Day' : 'Days'}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-sans">
                                <Link
                                  href={`/quotations/new?preselectPartId=${part.id}&preselectSupplierPartId=${offer.id}`}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to Quote</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
