'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { Customer, Vehicle, Quotation } from '@/lib/domain/types';
import { StatusBadge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  MapPin,
  Car,
  Plus,
  FileText,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { activeTenant, getAuthHeaders } = useTenant();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Vehicle Modal
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState<number>(0);
  const [engineCode, setEngineCode] = useState('');
  const [transmission, setTransmission] = useState<'AUTOMATIC' | 'MANUAL' | 'DSG'>('AUTOMATIC');
  const [vehicleError, setVehicleError] = useState('');
  const [submittingVehicle, setSubmittingVehicle] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, [params.id, activeTenant.id]);

  async function loadCustomerData() {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [custRes, quotesRes] = await Promise.all([
        fetch(`/api/customers/${params.id}`, { headers }),
        fetch('/api/quotations', { headers }),
      ]);

      const custData = await custRes.json();
      const quotesData = await quotesRes.json();

      if (custData.success) {
        setCustomer(custData.data);
        setVehicles(custData.data.vehicles || []);
      }
      if (quotesData.success) {
        setQuotations(quotesData.data.filter((q: Quotation) => q.customerId === params.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleError('');
    setSubmittingVehicle(true);

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: params.id,
          vin: vin.trim().toUpperCase(),
          licensePlate: licensePlate.trim().toUpperCase(),
          make,
          model,
          year: Number(year),
          mileage: Number(mileage),
          engineCode: engineCode || undefined,
          transmission,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setVehicleError(data.error?.message || 'Failed to register vehicle');
        return;
      }

      setShowVehicleModal(false);
      setMake('');
      setModel('');
      setVin('');
      setLicensePlate('');
      setMileage(0);
      loadCustomerData();
    } catch (err: any) {
      setVehicleError(err.message || 'Error registering vehicle');
    } finally {
      setSubmittingVehicle(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-300 font-bold">Customer Not Found</p>
        <p className="text-xs text-slate-500 mt-1">This record does not exist or belongs to another workshop.</p>
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
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
        <Link
          href={`/quotations/new?customerId=${customer.id}`}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation for Customer</span>
        </Link>
      </div>

      {/* Customer Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-glow">
              {customer.firstName[0]}
              {customer.lastName[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-white">
                  {customer.firstName} {customer.lastName}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                  Customer
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{customer.phone}</span>
                </span>
                {customer.email && (
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{customer.email}</span>
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{customer.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Vehicles Garage & Quotation History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles Garage */}
        <div className="glass-panel rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Car className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Registered Garage ({vehicles.length})</h3>
            </div>
            <button
              onClick={() => setShowVehicleModal(true)}
              className="flex items-center space-x-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-8 text-center">
              <Car className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No vehicles registered yet.</p>
              <button
                onClick={() => setShowVehicleModal(true)}
                className="mt-2 text-xs text-cyan-400 font-semibold"
              >
                + Register first vehicle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((v) => (
                <Link
                  key={v.id}
                  href={`/vehicles/${v.id}`}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-colors group block"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {v.year} {v.make} {v.model}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {v.licensePlate}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      VIN: {v.vin} • {v.mileage.toLocaleString()} km
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Past Quotations */}
        <div className="glass-panel rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Quotation History ({quotations.length})</h3>
            </div>
          </div>

          {quotations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No quotations created for this customer yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {quotations.map((q) => (
                <Link
                  key={q.id}
                  href={`/quotations/${q.id}`}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-colors group"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                        {q.quotationNumber}
                      </span>
                      <StatusBadge status={q.status} />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">R {q.grandTotal.toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-400 group-hover:underline">View Quote →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register Vehicle</h3>
              <button
                onClick={() => setShowVehicleModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {vehicleError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{vehicleError}</span>
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Make *</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                    placeholder="e.g. BMW"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                    placeholder="e.g. 320i Sedan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Year *</label>
                  <input
                    type="number"
                    required
                    min={1950}
                    max={2050}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Mileage (km) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">License Plate *</label>
                  <input
                    type="text"
                    required
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white uppercase font-mono"
                    placeholder="CA 123-456"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e: any) => setTransmission(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="AUTOMATIC">AUTOMATIC</option>
                    <option value="MANUAL">MANUAL</option>
                    <option value="DSG">DSG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">VIN (11–17 Characters) *</label>
                <input
                  type="text"
                  required
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono uppercase"
                  placeholder="WBA3A5C50DF289110"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVehicle}
                  className="px-4 py-2 rounded-lg font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-50"
                >
                  {submittingVehicle ? 'Registering...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
