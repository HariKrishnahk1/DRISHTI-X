'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Cpu,
  Fingerprint,
  TrendingDown,
  ShieldAlert,
  History,
  FileCheck2,
  Sliders,
  Shield,
  UserCheck,
  Lock
} from 'lucide-react';
import { getRoleConfig, RoleConfig } from '@/lib/roles';

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Mission Overview', icon: LayoutDashboard, badge: null },
  { href: '/datasets', label: 'Dataset Registry', icon: Database, badge: null },
  { href: '/models', label: 'Model Integrity', icon: Cpu, badge: null },
  { href: '/inference', label: 'Inference Provenance', icon: Fingerprint, badge: 'CORE' },
  { href: '/shift-analysis', label: 'Distribution Shift', icon: TrendingDown, badge: null },
  { href: '/evidence', label: 'Evidence Vault', icon: ShieldAlert, badge: null },
  { href: '/audit', label: 'Audit Chain', icon: History, badge: 'HASH' },
  { href: '/reports', label: 'Assurance Reports', icon: FileCheck2, badge: null },
  { href: '/settings', label: 'Assurance Config', icon: Sliders, badge: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadUser = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('drishti_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          // ignore
        }
      }
    }
  };

  useEffect(() => {
    loadUser();
    const handleAuthChange = () => loadUser();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('drishti_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('drishti_auth_change', handleAuthChange);
    };
  }, []);

  const roleConfig: RoleConfig = getRoleConfig(currentUser?.role);

  // Filter allowed navigation items for this specific role
  const permittedItems = ALL_NAV_ITEMS.filter((item) =>
    roleConfig.allowedNav.includes(item.href)
  );

  return (
    <aside className="w-64 bg-[#080d19] border-r border-amber-500/20 flex flex-col shrink-0 min-h-[calc(100vh-57px)] font-sans">
      {/* Operator Role Clearance Strip */}
      <div className={`p-3.5 border-b border-slate-800/80 bg-[#060912] font-mono transition-colors`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1">
            <UserCheck className="w-3 h-3 text-amber-400" />
            <span>OPERATOR ROLE</span>
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${roleConfig.theme.badgeBg} ${roleConfig.theme.badgeBorder} ${roleConfig.theme.badgeText}`}>
            {currentUser?.role || 'DEFENCE'}
          </span>
        </div>
        <div className="text-xs font-black text-slate-100 mt-1 truncate">
          {roleConfig.title}
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center justify-between">
          <span>{currentUser?.organization || roleConfig.unit}</span>
          <span className="text-[9px] text-emerald-400 font-bold">AIR-GAPPED</span>
        </div>
      </div>

      {/* Navigation List - Filtered strictly by Operator Role */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-2 pb-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          AUTHORIZED MODULES ({permittedItems.length})
        </div>

        {permittedItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-amber-950/70 to-[#191508] text-amber-300 border border-amber-500/60 shadow-sm shadow-amber-950/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1222]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isActive ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Indian Defence Compliance badge */}
      <div className="p-4 border-t border-amber-500/20 bg-[#060912] space-y-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono font-bold text-amber-300 flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>DEFENCE CLEARANCE</span>
          </div>
          <span className="text-[9px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300 px-1 py-0.2 rounded font-bold">
            {roleConfig.clearanceLevel.split('//')[0].trim()}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 leading-tight font-sans">
          Complies with DGIS military-grade offline integrity verification protocol. Zero external telemetry.
        </div>
      </div>
    </aside>
  );
}
