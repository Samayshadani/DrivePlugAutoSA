'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { Customer, Vehicle } from '@/lib/domain/types';
import { PartWithSupplierOffers } from '@/lib/domain/parts/parts.repository';
import {
  ArrowLeft,
  Users,
  Car,
  Layers,
  Wrench,
  Search,
  Plus,
  Trash2,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface QuoteLineItem {
  id: string;
  itemType: 'PART' | 'LABOR' | 'MISC';
  partId?: string;
  supplierPartId?: string;
  supplierName?: string;
  description: string;
  quantity: number;
  unitCost: number;
  markupPct: number;
  laborHours: number;
  laborRate: number;
}

function QuotationBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeTenant, getAuthHeaders } = useTenant();

  // Step 1: Customer & Vehicle State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Step 2: Parts Search & Supplier Selection
  const [partCatalog, setPartCatalog] = useState<PartWithSupplierOffers[]>([]);
  const [partSearchQuery, setPartSearchQuery] = useState<string>('');
  const [selectedPartForOffer, setSelectedPartForOffer] = useState<PartWithSupplierOffers | null>(null);

  // Step 3: Quotation Line Items & Parameters
  const [items, setItems] = useState<QuoteLineItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(15.0);
  const [discountAmount, setDiscountAmount] = useState<number>(0.0);
  const [validUntilDays, setValidUntilDays] = useState<number>(14);

  // UI state
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Load Customers, Vehicles & Parts
  useEffect(() => {
    async function loadData() {
      try {
        const headers = getAuthHeaders();
        const [custRes, vehRes, partsRes] = await Promise.all([
          fetch('/api/customers', { headers }),
          fetch('/api/vehicles', { headers }),
          fetch('/api/parts/search', { headers }),
        ]);

        const custData = await custRes.json();
        const vehData = await vehRes.json();
        const partsData = await partsRes.json();

        if (custData.success) {
          setCustomers(custData.data);
          // Check query params for customer pre-selection
          const qCust = searchParams.get('customerId');
          if (qCust && custData.data.some((c: Customer) => c.id === qCust)) {
            setSelectedCustomerId(qCust);
          } else if (custData.data.length > 0) {
            setSelectedCustomerId(custData.data[0].id);
          }
        }

        if (vehData.success) {
          setVehicles(vehData.data);
          const qVeh = searchParams.get('vehicleId');
          if (qVeh && vehData.data.some((v: Vehicle) => v.id === qVeh)) {
            setSelectedVehicleId(qVeh);
          }
        }

        if (partsData.success) {
          setPartCatalog(partsData.data);
        }
      } catch (err) {
        console.error('Failed to load quotation form dependencies:', err);
      }
    }

    loadData();
  }, [activeTenant.id]);

  // Update vehicles when selected customer changes
  const customerVehicles = vehicles.filter((v) => v.customerId === selectedCustomerId);

  useEffect(() => {
    if (customerVehicles.length > 0 && !customerVehicles.some((v) => v.id === selectedVehicleId)) {
      setSelectedVehicleId(customerVehicles[0].id);
    }
  }, [selectedCustomerId, vehicles]);

  // Add Part with selected Supplier Offer
  const handleAddSupplierPart = (part: PartWithSupplierOffers, offer: any) => {
    const newItem: QuoteLineItem = {
      id: crypto.randomUUID(),
      itemType: 'PART',
      partId: part.id,
      supplierPartId: offer.id,
      supplierName: offer.supplierName,
      description: `${part.name} (${offer.supplierName})`,
      quantity: 1,
      unitCost: offer.costPrice,
      markupPct: activeTenant.defaultMarkupPct,
      laborHours: 0,
      laborRate: 0,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedPartForOffer(null);
    setSuccessMessage(`Added ${part.name} to quote items.`);
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  // Add Standard Labor Line
  const handleAddLabor = () => {
    const newItem: QuoteLineItem = {
      id: crypto.randomUUID(),
      itemType: 'LABOR',
      description: 'Vehicle Inspection & Mechanical Labor',
      quantity: 1,
      unitCost: 0,
      markupPct: 0,
      laborHours: 1.5,
      laborRate: activeTenant.hourlyLaborRate,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof QuoteLineItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  // Live Calculations Engine
  let partsSubtotal = 0;
  let laborSubtotal = 0;

  items.forEach((item) => {
    if (item.itemType === 'PART') {
      const unitPrice = item.unitCost * (1 + item.markupPct / 100);
      partsSubtotal += item.quantity * unitPrice;
    } else if (item.itemType === 'LABOR') {
      laborSubtotal += item.quantity * (item.laborHours * item.laborRate);
    } else {
      partsSubtotal += item.quantity * item.unitCost;
    }
  });

  const netSubtotal = Math.max(0, partsSubtotal + laborSubtotal - discountAmount);
  const taxAmount = netSubtotal * (taxRate / 100);
  const grandTotal = netSubtotal + taxAmount;

  // Submit Handler: Save Draft or Send Directly
  const handleSubmitQuotation = async (action: 'DRAFT' | 'SEND') => {
    setErrorMessage('');
    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer for this quote.');
      return;
    }
    if (!selectedVehicleId) {
      setErrorMessage('Please select a vehicle registered to this customer.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one line item (part or labor) to the quotation.');
      return;
    }

    setSubmitting(true);
    try {
      const headers = getAuthHeaders();

      // 1. Create Quotation in DRAFT
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          vehicleId: selectedVehicleId,
          notes: notes || undefined,
          validUntilDays,
          taxRate,
          discountAmount,
          items: items.map((i) => ({
            itemType: i.itemType,
            partId: i.partId || undefined,
            supplierPartId: i.supplierPartId || undefined,
            description: i.description,
            quantity: Number(i.quantity),
            unitCost: Number(i.unitCost),
            markupPct: Number(i.markupPct),
            laborHours: Number(i.laborHours),
            laborRate: Number(i.laborRate),
          })),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.error?.message || 'Failed to create quotation');
        setSubmitting(false);
        return;
      }

      const createdQuote = data.data;

      // 2. If action === 'SEND', immediately transition to SENT
      if (action === 'SEND') {
        const sendRes = await fetch(`/api/quotations/${createdQuote.id}/send`, {
          method: 'POST',
          headers,
        });
        const sendData = await sendRes.json();
        if (!sendData.success) {
          console.warn('Quote created but failed to dispatch send:', sendData.error);
        }
      }

      router.push(`/quotations/${createdQuote.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating quotation');
      setSubmitting(false);
    }
  };

  const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);
  const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicleId);

  // Filter Parts Search
  const filteredCatalog = partCatalog.filter((p) => {
    if (!partSearchQuery) return true;
    const q = partSearchQuery.toLowerCase();
    return (
      p.partNumber.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <Link
          href="/quotations"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Back to Quotes</span>
        </Link>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Workshop Quoting Slice
          </span>
          <span className="text-xs text-slate-400 font-medium">{activeTenant.name}</span>
        </div>
      </div>

      {/* Progress Wizard Steps */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setStep(1)}
          className={`p-3 rounded-xl border text-left transition-all ${
            step === 1
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider">Step 1</div>
          <div className="text-xs font-semibold text-white mt-0.5 flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Customer & Vehicle</span>
          </div>
        </button>

        <button
          onClick={() => setStep(2)}
          className={`p-3 rounded-xl border text-left transition-all ${
            step === 2
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider">Step 2</div>
          <div className="text-xs font-semibold text-white mt-0.5 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Search & Compare Parts</span>
          </div>
        </button>

        <button
          onClick={() => setStep(3)}
          className={`p-3 rounded-xl border text-left transition-all ${
            step === 3
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider">Step 3</div>
          <div className="text-xs font-semibold text-white mt-0.5 flex items-center space-x-1.5">
            <Wrench className="w-3.5 h-3.5" />
            <span>Review, Labor & Finalize</span>
          </div>
        </button>
      </div>

      {/* Error & Success Toasts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* STEP 1: CUSTOMER & VEHICLE SELECTION */}
      {step === 1 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Select Customer & Vehicle</h3>
            <p className="text-xs text-slate-400">Choose who this quotation is prepared for</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Select Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.phone})
                  </option>
                ))}
              </select>

              {selectedCustomerObj && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-white">
                    {selectedCustomerObj.firstName} {selectedCustomerObj.lastName}
                  </div>
                  <div className="text-slate-400">Mobile: {selectedCustomerObj.phone}</div>
                  {selectedCustomerObj.email && (
                    <div className="text-slate-400">Email: {selectedCustomerObj.email}</div>
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Select Vehicle *</label>
              {customerVehicles.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                  No vehicles registered for this customer.
                  <Link
                    href={`/customers/${selectedCustomerId}`}
                    className="text-cyan-400 block mt-1 hover:underline font-semibold"
                  >
                    + Register a vehicle in customer garage
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {customerVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} [{v.licensePlate}]
                    </option>
                  ))}
                </select>
              )}

              {selectedVehicleObj && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-white flex items-center space-x-2">
                    <span>
                      {selectedVehicleObj.year} {selectedVehicleObj.make} {selectedVehicleObj.model}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-cyan-300">
                      {selectedVehicleObj.licensePlate}
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">VIN: {selectedVehicleObj.vin}</div>
                  <div className="text-slate-400">Mileage: {selectedVehicleObj.mileage.toLocaleString()} km</div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            >
              <span>Continue to Parts Search</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PARTS SEARCH & SUPPLIER PRICE COMPARISON */}
      {step === 2 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">Search Parts & Compare Supplier Offers</h3>
              <p className="text-xs text-slate-400">
                Select replacement parts and pick the best wholesaler pricing and lead time
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-medium">
              Items added to quote: <strong>{items.length}</strong>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search brake pads, filters, spark plugs, alternators..."
              value={partSearchQuery}
              onChange={(e) => setPartSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Catalogue List with Supplier Matrix */}
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {filteredCatalog.map((part) => (
              <div
                key={part.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{part.name}</h4>
                    <span className="text-[11px] font-mono text-cyan-400">Part #: {part.partNumber}</span>
                    <span className="text-[11px] text-slate-500 ml-2">({part.category})</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {part.supplierOffers.length} Supplier Offers
                  </span>
                </div>

                {/* Side-by-side Supplier Offers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-850">
                  {part.supplierOffers.map((offer) => {
                    const clientPrice = offer.costPrice * (1 + activeTenant.defaultMarkupPct / 100);

                    return (
                      <div
                        key={offer.id}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800/90 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white truncate max-w-[120px]">
                              {offer.supplierName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {offer.leadTimeDays}d lead
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-xs text-slate-400">Cost: R {offer.costPrice.toFixed(2)}</span>
                            <span className="text-xs font-bold text-emerald-400">
                              R {clientPrice.toFixed(2)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            {offer.stockQuantity} in stock ({offer.availability})
                          </span>
                        </div>

                        <button
                          onClick={() => handleAddSupplierPart(part, offer)}
                          className="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Quote</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900"
            >
              ← Back to Customer
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            >
              <span>Review Line Items ({items.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW LINE ITEMS, LABOR & TOTALS */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Items Table (2 Columns) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Quotation Line Items</h3>
                <p className="text-xs text-slate-400">Adjust quantities, markups, and add workshop labor</p>
              </div>
              <button
                onClick={handleAddLabor}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Labor</span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-12 text-center">
                <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-300">No items added to quote</p>
                <p className="text-xs text-slate-500 mt-1">
                  Go back to Step 2 to search parts or click &quot;+ Add Labor&quot; above.
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="mt-3 text-xs text-emerald-400 font-semibold"
                >
                  ← Go to Parts Search
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-300">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="bg-transparent text-xs font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-800 text-slate-400">
                          {item.itemType}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Numeric inputs for PART */}
                    {item.itemType === 'PART' && (
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Cost (ZAR)</label>
                          <input
                            type="number"
                            min={0}
                            value={item.unitCost}
                            onChange={(e) => handleUpdateItem(item.id, 'unitCost', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Markup %</label>
                          <input
                            type="number"
                            min={0}
                            value={item.markupPct}
                            onChange={(e) => handleUpdateItem(item.id, 'markupPct', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-emerald-400 font-bold"
                          />
                        </div>
                        <div className="text-right">
                          <label className="text-[10px] text-slate-400 block mb-1">Line Total</label>
                          <span className="text-xs font-bold text-white font-mono leading-7">
                            R {(item.quantity * item.unitCost * (1 + item.markupPct / 100)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Numeric inputs for LABOR */}
                    {item.itemType === 'LABOR' && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Hours</label>
                          <input
                            type="number"
                            step={0.5}
                            min={0.5}
                            value={item.laborHours}
                            onChange={(e) => handleUpdateItem(item.id, 'laborHours', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Rate (R/hr)</label>
                          <input
                            type="number"
                            min={0}
                            value={item.laborRate}
                            onChange={(e) => handleUpdateItem(item.id, 'laborRate', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                          />
                        </div>
                        <div className="text-right">
                          <label className="text-[10px] text-slate-400 block mb-1">Line Total</label>
                          <span className="text-xs font-bold text-white font-mono leading-7">
                            R {(item.quantity * item.laborHours * item.laborRate).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quotation Notes */}
            <div className="pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Quotation Notes / Terms for Customer
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Parts quotation includes genuine OEM specification warranty. Valid for 14 days."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Financial Summary & Actions (1 Column) */}
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5">
                Quotation Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Parts Subtotal:</span>
                  <span className="font-mono text-white font-bold">R {partsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Labor Subtotal:</span>
                  <span className="font-mono text-white font-bold">R {laborSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 items-center">
                  <span>Discount (R):</span>
                  <input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-20 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-right text-white font-mono"
                  />
                </div>
                <div className="flex justify-between text-slate-400 items-center">
                  <span>VAT ({taxRate}%):</span>
                  <span className="font-mono text-white font-bold">R {taxAmount.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-white">Grand Total:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    R {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  disabled={submitting}
                  onClick={() => handleSubmitQuotation('SEND')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Send Quote to Customer'}</span>
                </button>

                <button
                  disabled={submitting}
                  onClick={() => handleSubmitQuotation('DRAFT')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Draft</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 text-center">
                Sending automatically transmits quote link via WhatsApp & Email adapter.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading Quotation Slice...
        </div>
      }
    >
      <QuotationBuilderContent />
    </React.Suspense>
  );
}
