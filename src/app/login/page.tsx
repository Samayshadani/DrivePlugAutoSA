'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTenant, AVAILABLE_TENANTS } from '@/context/TenantContext';
import { Wrench, Shield, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { activeTenant, setActiveTenantId, role, setRole } = useTenant();

  const handleSelectAndProceed = (tenantId: string, demoRole: any) => {
    setActiveTenantId(tenantId);
    setRole(demoRole);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl animate-fade-in">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-glow mb-4">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            DrivePlug<span className="text-emerald-400">Auto</span> SA
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Automotive Workshop & Ecosystem Management Portal
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Workshop Tenant & Identity:
          </div>

          {/* Workshop A */}
          <div
            onClick={() => handleSelectAndProceed('11111111-1111-1111-1111-111111111111', 'OWNER')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeTenant.id === '11111111-1111-1111-1111-111111111111'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-glow'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Apex Precision Auto Works</h4>
                  <p className="text-xs text-slate-400">Cape Town • Labor R650/h • 25% Markup</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5">User: Marcus Thorne (Owner)</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Workshop B */}
          <div
            onClick={() => handleSelectAndProceed('22222222-2222-2222-2222-222222222222', 'OWNER')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeTenant.id === '22222222-2222-2222-2222-222222222222'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-glow'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Rivonia Performance & Fleet</h4>
                  <p className="text-xs text-slate-400">Johannesburg • Labor R750/h • 20% Markup</p>
                  <p className="text-[11px] text-cyan-400 mt-0.5">User: Johan Steyn (Owner)</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-glow transition-all"
          >
            Enter Dashboard as {activeTenant.name.split(' ')[0]}
          </button>
        </div>

        <div className="text-[11px] text-slate-500 text-center flex items-center justify-center space-x-1">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tenant Isolation Guaranteed by PostgreSQL Row Level Security</span>
        </div>
      </div>
    </div>
  );
}
