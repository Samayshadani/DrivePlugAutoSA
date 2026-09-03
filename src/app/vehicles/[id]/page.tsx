'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { Vehicle, Customer, Quotation } from '@/lib/domain/types';
import { StatusBadge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Car,
  Users,
  Gauge,
  Cpu,
  FileText,
  Plus,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const { activeTenant, getAuthHeaders } = useTenant();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicle() {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        const vehRes = await fetch(`/api/vehicles/${params.id}`, { headers });
        const vehData = await vehRes.json();

        if (vehData.success) {
          setVehicle(vehData.data);
          // Load customer
          const custRes = await fetch(`/api/customers/${vehData.data.customerId}`, { headers });
          const custData = await custRes.json();
          if (custData.success) setCustomer(custData.data);

          // Load quotations for this vehicle
          const quoteRes = await fetch('/api/quotations', { headers });
          const quoteData = await quoteRes.json();
          if (quoteData.success) {
            setQuotations(quoteData.data.filter((q: Quotation) => q.vehicleId === params.id));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadVehicle();
  }, [params.id, activeTenant.id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading vehicle details...</div>;
  }

  if (!vehicle) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-300 font-bold">Vehicle Not Found</p>
        <p className="text-xs text-slate-500 mt-1">This vehicle does not exist or belongs to another workshop.</p>
        <Link
          href="/customers"
          className="mt-4 inline-flex items-center space-x-1 px-4 py-2 rounded-lg text-xs bg-slate-800 text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={customer ? `/customers/${customer.id}` : '/customers'}
          className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{customer ? `Back to ${customer.firstName}'s Garage` : 'Back'}</span>
        </Link>
        <Link
          href={`/quotations/new?customerId=${vehicle.customerId}&vehicleId=${vehicle.id}`}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Quote for this Vehicle</span>
        </Link>
      </div>

      {/* Vehicle Hero Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-slate-950 font-black flex items-center justify-center shadow-cyanGlow">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-white">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  {vehicle.licensePlate}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">VIN: {vehicle.vin}</p>
            </div>
          </div>

          {customer && (
            <Link
              href={`/customers/${customer.id}`}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center space-x-3 transition-colors"
            >
              <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Registered Owner</span>
                <span className="text-xs font-bold text-white">
                  {customer.firstName} {customer.lastName}
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Odometer</span>
            </div>
            <span className="text-sm font-bold text-white block mt-1">
              {vehicle.mileage.toLocaleString()} km
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Engine Code</span>
            </div>
            <span className="text-sm font-mono font-bold text-white block mt-1">
              {vehicle.engineCode || 'Standard'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <Car className="w-3.5 h-3.5 text-indigo-400" />
              <span>Transmission</span>
            </div>
            <span className="text-sm font-bold text-white block mt-1">
              {vehicle.transmission || 'Automatic'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>RLS Tenant Lock</span>
            </div>
            <span className="text-xs font-mono text-slate-300 block mt-1 truncate">
              {activeTenant.name.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Service & Quotation History */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Quotation & Work History</h3>
          </div>
        </div>

        {quotations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No quotations recorded for this vehicle yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {quotations.map((q) => (
              <Link
                key={q.id}
                href={`/quotations/${q.id}`}
                className="py-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors group px-2 rounded-lg"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                      {q.quotationNumber}
                    </span>
                    <StatusBadge status={q.status} />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">{q.notes || 'Service quote'}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white block">R {q.grandTotal.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-400 group-hover:underline">View Breakdown →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
