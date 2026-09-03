'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant, AVAILABLE_TENANTS } from '@/context/TenantContext';
import { BusinessRole } from '@/lib/domain/types';
import {
  Wrench,
  Gauge,
  Users,
  Car,
  Layers,
  FileText,
  ShoppingBag,
  PlusCircle,
  Building2,
  Shield,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { activeTenant, role, setActiveTenantId, setRole } = useTenant();
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Gauge },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/parts', label: 'Parts & Pricing', icon: Layers },
    { href: '/quotations', label: 'Quotations', icon: FileText },
    { href: '/orders', label: 'Orders', icon: ShoppingBag },
  ];

  const roles: BusinessRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white flex items-center">
                  DrivePlug<span className="text-emerald-400">Auto</span>
                  <span className="ml-1.5 px-1.5 py-0.2 text-[10px] uppercase font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                    SA
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 -mt-1 tracking-wider uppercase">Connected Ecosystem</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions: Tenant Switcher, Role Selector, New Quote CTA */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* New Quote CTA */}
            <Link
              href="/quotations/new"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-glow transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Create Quote</span>
            </Link>

            {/* Tenant Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs text-slate-200 transition-all"
                title="Switch Active Workshop Tenant"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <div className="flex flex-col text-left">
                  <span className="font-medium max-w-[130px] truncate">{activeTenant.name}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {tenantDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-fade-in">
                  <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    Select Active Tenant
                  </div>
                  {AVAILABLE_TENANTS.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        setActiveTenantId(tenant.id);
                        setTenantDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs flex flex-col transition-colors ${
                        tenant.id === activeTenant.id
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-semibold">{tenant.name}</span>
                      <span className="text-[10px] text-slate-400">{tenant.location}</span>
                    </button>
                  ))}

                  {/* Role Selector Inside Tenant Dropdown */}
                  <div className="mt-2 pt-2 border-t border-slate-800 px-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-cyan-400" />
                      <span>Simulate RBAC Role</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {roles.map((r) => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`px-2 py-1 rounded text-[11px] font-medium text-center transition-all ${
                            role === r
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              <item.icon className="w-4 h-4 text-emerald-400" />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href="/quotations/new"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 text-slate-950"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Quote</span>
          </Link>
        </div>
      )}
    </header>
  );
};
