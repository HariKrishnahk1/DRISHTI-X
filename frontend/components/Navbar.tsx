'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, UserCheck, LogOut, ChevronDown, RefreshCw, Award, Film } from 'lucide-react';
import { api } from '@/lib/api';
import GuidedTourModal from '@/components/GuidedTourModal';
import { getRoleConfig } from '@/lib/roles';

const DEMO_ROLES = [
  { username: 'defence_commander', role: 'DEFENCE', label: 'Defence Commander' },
  { username: 'lead_analyst', role: 'ANALYST', label: 'Lead Assurance Analyst' },
  { username: 'bharat_vendor', role: 'VENDOR', label: 'Defence Vendor' },
  { username: 'field_contributor', role: 'CONTRIBUTOR', label: 'Field Contributor' },
  { username: 'cag_auditor', role: 'AUDITOR', label: 'External Auditor' },
];

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const roleConfig = getRoleConfig(currentUser?.role);

  useEffect(() => {
    const stored = localStorage.getItem('drishti_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleRoleSwitch = async (username: string) => {
    try {
      const data = await api.login(username, 'Password123!');
      if (data.access_token) {
        localStorage.setItem('drishti_token', data.access_token);
        localStorage.setItem('drishti_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setRoleDropdown(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('drishti_auth_change'));
        }
        window.location.reload();
      }
    } catch (e) {
      console.error('Role switch failed', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('drishti_token');
    localStorage.removeItem('drishti_user');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('drishti_auth_change'));
      window.location.href = '/login';
    } else {
      router.push('/login');
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Re-initialize demonstration datasets, models, and cryptographic audit records?')) return;
    setIsResetting(true);
    try {
      await api.seedDemo();
      alert('Demo environment successfully re-seeded!');
      window.location.reload();
    } catch (e) {
      alert('Failed to re-seed demo: ' + e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090d18]/95 backdrop-blur-md border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between shadow-lg shadow-black/60 relative">
      {/* Subtle Indian Tricolour top line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] india-tricolour-bar opacity-80" />

      {/* Brand & Mission Spec */}
      <div className="flex items-center space-x-4 shrink-0">
        <Link href="/dashboard" className="flex items-center space-x-3 group whitespace-nowrap">
          <img
            src="/drishti_logo.png"
            alt="DRISHTI-X"
            className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] group-hover:scale-105 transition shrink-0"
          />
          <div className="flex items-center space-x-2.5">
            <span className="font-extrabold tracking-wider text-gold-gradient text-lg font-mono">DRISHTI-X</span>
            <span className="hidden xl:inline-block text-[9px] bg-slate-900 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
              🇮🇳 BHARAT AI
            </span>
            <span className="hidden sm:inline-block text-slate-600">|</span>
            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-400 tracking-tight font-medium">
              <span>Defence AI Vision Assurance</span>
              <span className="text-amber-500/60">•</span>
              <span className="text-slate-300">Indian Army / DGIS</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Center status */}
      <div className="hidden lg:flex items-center space-x-4 text-xs font-mono whitespace-nowrap shrink-0">
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 text-[11px]">DEFENCE STATUS: <strong className="text-emerald-400 font-semibold">AIR-GAPPED SECURE</strong></span>
        </div>
      </div>

      {/* Right controls: Briefing Video, Guided Tour, Demo Reset, Role Switcher, Profile */}
      <div className="flex items-center space-x-2.5 shrink-0 whitespace-nowrap">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('drishti_replay_intro'));
            }
          }}
          className="text-xs bg-[#0e1628] hover:bg-[#141e33] text-amber-300 border border-amber-500/40 hover:border-amber-400 px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-sm hover:shadow-amber-950/40"
          title="Play Startup Briefing Video"
        >
          <Film className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline font-mono font-semibold">BRIEFING</span>
        </button>

        <button
          onClick={() => setShowTour(true)}
          className="text-xs bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-500 text-slate-950 font-mono font-extrabold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shadow-md shadow-amber-950/50 cursor-pointer active:scale-95"
          title="Interactive Evaluator Tour & Threat Simulator"
        >
          <Award className="w-3.5 h-3.5" />
          <span>EVALUATOR TOUR</span>
        </button>

        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="text-xs bg-[#0e1628] hover:bg-[#141e33] text-slate-300 border border-slate-700 hover:border-amber-400/50 px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition"
          title="Reset & Re-seed demonstration scenarios"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdown(!roleDropdown)}
            className={`flex items-center space-x-2 border px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${roleConfig.theme.pillBg} ${roleConfig.theme.pillBorder}`}
          >
            <UserCheck className={`w-3.5 h-3.5 ${roleConfig.theme.accent}`} />
            <span>Role: <strong className={`font-mono font-bold ${roleConfig.theme.pillText}`}>{roleConfig.title}</strong></span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0c1222] border-2 border-amber-500/40 rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3.5 py-1.5 text-[10px] font-mono font-bold text-amber-400 border-b border-amber-500/20 uppercase tracking-wider">
                SWITCH OPERATOR ROLE:
              </div>
              {DEMO_ROLES.map((r) => (
                <button
                  key={r.username}
                  onClick={() => handleRoleSwitch(r.username)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition cursor-pointer ${
                    currentUser?.username === r.username ? 'bg-amber-950/60 text-amber-300 font-semibold' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate pr-2">{r.label}</span>
                  <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-bold shrink-0">{r.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-1.5 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 rounded-lg transition"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <GuidedTourModal isOpen={showTour} onClose={() => setShowTour(false)} />
    </header>
  );
}
