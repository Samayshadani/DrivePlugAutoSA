import React from 'react';
import { QuotationStatus, OrderStatus } from '@/lib/domain/types';

interface BadgeProps {
  status: QuotationStatus | OrderStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const getStyle = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'SENT':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'APPROVED':
      case 'CONFIRMED':
      case 'FULFILLED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'EXPIRED':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      case 'PENDING':
      case 'PARTS_ORDERED':
      case 'IN_PROGRESS':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
};
