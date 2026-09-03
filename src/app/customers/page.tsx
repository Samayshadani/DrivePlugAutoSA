'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { Customer, Vehicle } from '@/lib/domain/types';
import { Users, Search, Plus, Phone, Mail, Car, ChevronRight, X, AlertCircle } from 'lucide-react';

export default function CustomersPage() {
  const { activeTenant, getAuthHeaders } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [activeTenant.id, search]);

  async function loadCustomers() {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const url = search ? `/api/customers?search=${encodeURIComponent(search)}` : '/api/customers';
      const [custRes, vehRes] = await Promise.all([
        fetch(url, { headers }),
        fetch('/api/vehicles', { headers }),
      ]);

      const custData = await custRes.json();
      const vehData = await vehRes.json();

      if (custData.success) setCustomers(custData.data);
      if (vehData.success) setVehicles(vehData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formFirstName,
          lastName: formLastName,
          phone: formPhone,
          email: formEmail || undefined,
          address: formAddress || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setFormError(data.error?.message || 'Failed to create customer');
        return;
      }

      // Reset form and close
      setFormFirstName('');
      setFormLastName('');
      setFormPhone('');
      setFormEmail('');
      setFormAddress('');
      setShowAddModal(false);
      loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Network error creating customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage clients, contact profiles, and vehicle registrations for {activeTenant.name}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Customers List / Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No customers found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or add a new customer.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {customers.map((c) => {
              const custVehicles = vehicles.filter((v) => v.customerId === c.id);
              return (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors group"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {c.firstName[0]}
                      {c.lastName[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {c.firstName} {c.lastName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{c.phone}</span>
                        </span>
                        {c.email && (
                          <span className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{c.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pl-13 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center space-x-1 text-xs text-slate-300">
                        <Car className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {custVehicles.length} {custVehicles.length === 1 ? 'vehicle' : 'vehicles'} registered
                        </span>
                      </div>
                      {custVehicles.length > 0 && (
                        <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                          {custVehicles[0].make} {custVehicles[0].model}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Customer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Sipho"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Dlamini"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Phone Number (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="+27821234567"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="sipho@example.co.za"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Physical Address</label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Street, Suburb, City"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
