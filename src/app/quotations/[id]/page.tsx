'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { Quotation, Order } from '@/lib/domain/types';
import { StatusBadge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Printer,
  Calendar,
  Users,
  Car,
  AlertCircle,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function QuotationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { activeTenant, getAuthHeaders } = useTenant();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [linkedOrder, setLinkedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Customer opted for alternative repair');

  useEffect(() => {
    loadQuotation();
  }, [params.id, activeTenant.id]);

  async function loadQuotation() {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [quoteRes, ordersRes] = await Promise.all([
        fetch(`/api/quotations/${params.id}`, { headers }),
        fetch('/api/orders', { headers }),
      ]);

      const quoteData = await quoteRes.json();
      const ordersData = await ordersRes.json();

      if (quoteData.success) {
        setQuotation(quoteData.data);
      }
      if (ordersData.success) {
        const matchingOrder = ordersData.data.find((o: Order) => o.quotationId === params.id);
        if (matchingOrder) setLinkedOrder(matchingOrder);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Action: Send to Customer (DRAFT -> SENT)
  const handleSend = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/quotations/${params.id}/send`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.error?.message || 'Failed to send quotation');
        return;
      }
      setSuccessMessage('Quotation sent to customer via WhatsApp & Email adapter!');
      loadQuotation();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending quotation');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Approve Quotation (SENT -> APPROVED -> Order Auto-generation)
  const handleApprove = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/quotations/${params.id}/approve`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.error?.message || 'Failed to approve quotation');
        return;
      }
      setSuccessMessage(`Quotation approved! Procurement Order generated automatically.`);
      loadQuotation();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error approving quotation');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject Quotation (SENT -> REJECTED)
  const handleReject = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/quotations/${params.id}/reject`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.error?.message || 'Failed to reject quotation');
        return;
      }
      setShowRejectModal(false);
      setSuccessMessage('Quotation marked as Rejected by customer.');
      loadQuotation();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error rejecting quotation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading quotation details...</div>;
  }

  if (!quotation) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-300 font-bold">Quotation Not Found</p>
        <p className="text-xs text-slate-500 mt-1">This quotation does not exist or belongs to another workshop.</p>
        <Link
          href="/quotations"
          className="mt-4 inline-flex items-center space-x-1 px-4 py-2 rounded-lg text-xs bg-slate-800 text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <Link
          href="/quotations"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Approved Quotation -> Linked Order Banner */}
      {quotation.status === 'APPROVED' && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                Legally Approved Contract • Procurement Order Generated
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {linkedOrder ? `Linked Order Number: ${linkedOrder.orderNumber}` : 'Order dispatched to suppliers'}
              </p>
            </div>
          </div>

          <Link
            href="/orders"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
          >
            <span>View Order in Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Quotation Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-black text-white">{quotation.quotationNumber}</h1>
                <StatusBadge status={quotation.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Issued by {activeTenant.name} • Created {new Date(quotation.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Interactive State Machine Action Buttons */}
          <div className="flex items-center space-x-2">
            {quotation.status === 'DRAFT' && (
              <button
                disabled={actionLoading}
                onClick={handleSend}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{actionLoading ? 'Sending...' : 'Send to Customer'}</span>
              </button>
            )}

            {quotation.status === 'SENT' && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={handleApprove}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionLoading ? 'Approving...' : 'Simulate Customer Approval'}</span>
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => setShowRejectModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline</span>
                </button>
              </>
            )}

            {quotation.status === 'APPROVED' && (
              <div className="flex items-center space-x-1 text-xs text-slate-400 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Locked Contract (Read Only)</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Vehicle Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-2">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Details</span>
            </div>
            {quotation.customer ? (
              <>
                <div className="font-bold text-white text-sm">
                  {quotation.customer.firstName} {quotation.customer.lastName}
                </div>
                <div className="text-slate-400">Phone: {quotation.customer.phone}</div>
                {quotation.customer.email && (
                  <div className="text-slate-400">Email: {quotation.customer.email}</div>
                )}
              </>
            ) : (
              <div className="text-slate-500">No customer linked</div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-2">
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vehicle Details</span>
            </div>
            {quotation.vehicle ? (
              <>
                <div className="font-bold text-white text-sm">
                  {quotation.vehicle.year} {quotation.vehicle.make} {quotation.vehicle.model}
                </div>
                <div className="text-slate-400 font-mono">
                  Plate: {quotation.vehicle.licensePlate} • VIN: {quotation.vehicle.vin}
                </div>
                <div className="text-slate-400">Odometer: {quotation.vehicle.mileage.toLocaleString()} km</div>
              </>
            ) : (
              <div className="text-slate-500">No vehicle linked</div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quoted Line Items ({quotation.items?.length || 0})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty / Hrs</th>
                  <th className="py-2.5 px-3 text-right">Wholesale Cost</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {quotation.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-850/40">
                    <td className="py-3 px-3 font-sans">
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                        {item.itemType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="font-bold text-white">{item.description}</span>
                      {item.markupPct > 0 && (
                        <span className="text-[10px] text-emerald-400 block font-mono">
                          +{item.markupPct}% markup
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.itemType === 'LABOR' ? `${item.laborHours}h` : item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {item.unitCost > 0 ? `R ${item.unitCost.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-white">
                      R {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-300">
                      R {item.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Parts Subtotal:</span>
              <span className="font-mono text-white">R {quotation.partsSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Labor Subtotal:</span>
              <span className="font-mono text-white">R {quotation.laborSubtotal.toFixed(2)}</span>
            </div>
            {quotation.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount Applied:</span>
                <span className="font-mono">- R {quotation.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>VAT ({quotation.taxRate}%):</span>
              <span className="font-mono text-white">R {quotation.taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-bold text-sm">
              <span className="text-white">Grand Total:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                R {quotation.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Decline Quotation</h3>
            <p className="text-xs text-slate-400">
              Please enter the reason provided by the customer for declining this quotation.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 bg-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleReject}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
