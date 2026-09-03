import type { Metadata } from 'next';
import './globals.css';
import { TenantProvider } from '@/context/TenantContext';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'DrivePlugAutoSA - Automotive Connected Ecosystem',
  description:
    'Connected digital ecosystem linking workshops, dealerships, vehicle owners, and parts suppliers for seamless quotations and procurement.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080c14] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <TenantProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-900 bg-[#060910] py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-400">DrivePlugAutoSA</span>
                <span>•</span>
                <span>Pilot Version 1.0 (MVP)</span>
              </div>
              <div className="text-slate-400">
                Multi-Tenant Isolation Powered by PostgreSQL RLS & Supabase
              </div>
            </div>
          </footer>
        </TenantProvider>
      </body>
    </html>
  );
}
