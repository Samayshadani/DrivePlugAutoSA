'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { Order, OrderStatus } from '@/lib/domain/types';
import { StatusBadge } from '@/components/ui/Badge';
import { ShoppingBag, ChevronRight, FileText, CheckCircle2, Clock, Truck } from 'lucide-react';

export default function OrdersPage() {
  const { activeTenant, getAuthHeaders } = useTenant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        const res = await fetch('/api/orders', { headers });
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [activeTenant.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Procurement & Repair Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-generated service orders from approved quotations for {activeTenant.name}
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading procurement orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No active orders yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Orders are created automatically once a customer approves a quotation.
            </p>
            <Link
              href="/quotations"
              className="mt-4 inline-flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950"
            >
              <span>View Quotations</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span className="flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <Link
                          href={`/quotations/${order.quotationId}`}
                          className="hover:underline text-emerald-400 font-mono"
                        >
                          Source Quote
                        </Link>
                      </span>
                      <span>•</span>
                      <span>Placed {new Date(order.placedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-sm font-bold text-white block">
                    R {order.totalAmount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500">Authorized Procurement Amount</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
