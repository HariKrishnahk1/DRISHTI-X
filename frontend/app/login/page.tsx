'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User as UserIcon, Terminal, CheckCircle, Award, Sparkles, ChevronRight, Fingerprint, Film } from 'lucide-react';
import { api } from '@/lib/api';
import { getRoleConfig } from '@/lib/roles';

const QUICK_PROFILES = [
  { 
    name: 'Defence Commander', 
    role: 'DEFENCE', 
    user: 'defence_commander', 
    org: 'Indian Army / DGIS HQ', 
    desc: 'Strategic oversight, high-risk quarantine approvals & operational clearance' 
  },
  { 
    name: 'Lead Assurance Analyst', 
    role: 'ANALYST', 
    user: 'lead_analyst', 
    org: 'Defence AI Assurance Wing', 
    desc: 'Deep Trojan detection, distribution shift forensics & report generation' 
  },
  { 
    name: 'Bharat Defence Vendor', 
    role: 'VENDOR', 
    user: 'bharat_vendor', 
    org: 'Bharat Defence Systems Ltd', 
    desc: 'Certified ONNX/PyTorch model uploads & cryptographic attestation' 
  },
  { 
    name: 'Field Recon Contributor', 
    role: 'CONTRIBUTOR', 
    user: 'field_contributor', 
    org: 'Northern Command Recon Unit', 
    desc: 'Battlefield dataset ingestion & raw surveillance footage telemetry' 
  },
  { 
    name: 'External Auditor', 
    role: 'AUDITOR', 
    user: 'cag_auditor', 
    org: 'Defence Audit Directorate / CAG', 
    desc: 'Tamper-evident blockchain audit validation & compliance certification' 
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('defence_commander');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(username, password);
      if (data.access_token) {
        localStorage.setItem('drishti_token', data.access_token);
        localStorage.setItem('drishti_user', JSON.stringify(data.user));
        
        // Notify application layout of auth state change
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('drishti_auth_change'));
          window.location.href = '/dashboard';
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.detail || 'Authentication failed. Please verify defence credentials.');
      }
    } catch (err: any) {
      setError('Connection refused or authentication failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (uname: string) => {
    setUsername(uname);
    setPassword('Password123!');
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(uname, 'Password123!');
      if (data.access_token) {
        localStorage.setItem('drishti_token', data.access_token);
        localStorage.setItem('drishti_user', JSON.stringify(data.user));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('drishti_auth_change'));
          window.location.href = '/dashboard';
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError('Quick login failed: ' + (err.message || err));
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen py-10 px-4 flex flex-col justify-center items-center relative font-sans">
      {/* Top Indian Government & Defence Header Strip */}
      <div className="w-full max-w-2xl mb-8 flex flex-col items-center text-center space-y-3">
        {/* National Tricolour Accent Line */}
        <div className="w-48 h-1 rounded-full india-tricolour-bar india-tricolour-glow mb-2" />

        {/* Official DRISHTI-X Defence Insignia */}
        <div className="relative group">
          <img
            src="/drishti_logo.png"
            alt="DRISHTI-X"
            className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] group-hover:scale-105 transition duration-300 relative z-10"
          />
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 blur-xl -z-10 group-hover:opacity-100 opacity-60 transition duration-300" />
        </div>

        {/* Government of India & Ministry Bilingual Motto */}
        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-amber-300 tracking-wider">
            <span>सत्यमेव जयते</span>
            <span className="text-slate-500">•</span>
            <span>रक्षा मंत्रालय</span>
            <span className="text-slate-500">•</span>
            <span>MINISTRY OF DEFENCE</span>
          </div>
          <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
            Government of India • Indian Army / DGIS
          </div>
        </div>

        {/* DRISHTI-X Main Title in Metallic Gold & Silver */}
        <div className="pt-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-gold-gradient font-mono">
            DRISHTI-X
          </h1>
          <p className="text-xs text-silver-gradient font-mono tracking-widest uppercase mt-1">
            Defence AI Vision Integrity & Assurance Platform
          </p>
        </div>

        {/* Badges: Security Protocol */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[10px]">
          <span className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 text-slate-200 px-3 py-1 rounded-full font-bold">
            ATMANIRBHAR BHARAT DEFENCE AI
          </span>
          <span className="bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 px-3 py-1 rounded-full font-bold">
            AIR-GAPPED OFFLINE PROTOCOL
          </span>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                try {
                  sessionStorage.removeItem('drishti_intro_session_done');
                  localStorage.removeItem('drishti_startup_video_shown');
                } catch (e) {}
                window.dispatchEvent(new Event('drishti_replay_intro'));
              }
            }}
            className="bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/60 hover:border-amber-400 text-amber-300 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:shadow-amber-950/50"
            title="Watch DRISHTI-X Startup Briefing Video"
          >
            <Film className="w-3 h-3 text-amber-400" />
            <span>PLAY STARTUP VIDEO</span>
          </button>
        </div>
      </div>

      {/* Main Login Card - Gold & Silver Chamfered Obsidian Frame */}
      <div className="w-full max-w-xl relative">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-amber-500/40 via-slate-600/30 to-amber-500/40 blur-sm opacity-70" />
        
        <div className="relative bg-[#0b1020]/95 backdrop-blur-xl border-2 border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          {/* Card Top Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 font-mono text-xs">
            <div className="flex items-center space-x-2 text-amber-400">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span className="font-bold tracking-wider">DEFENCE COMMAND ACCESS PORTAL</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CLASSIFIED / RESTRICTED</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-700/80 text-rose-200 text-xs rounded-lg font-mono flex items-start space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-1.5 flex items-center justify-between">
                <span>OPERATOR CALL-SIGN / USERNAME</span>
                <span className="text-[10px] text-amber-400/80 font-normal">MILITARY ID</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-amber-400/70" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. defence_commander"
                  className="w-full bg-[#070b16] border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-100 font-mono transition placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-1.5 flex items-center justify-between">
                <span>CRYPTOGRAPHIC PASSKEY / ACCESS TOKEN</span>
                <span className="text-[10px] text-slate-400 font-normal">ED25519 COMPLIANT</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-amber-400/70" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#070b16] border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-100 font-mono transition placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Submit Button with Rich Gold Gradient */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-500 text-slate-950 rounded-lg font-mono text-xs font-extrabold uppercase tracking-widest transition shadow-lg shadow-amber-900/40 flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING WITH DEFENCE VAULT...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>AUTHENTICATE & ENTER COMMAND PLATFORM</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Evaluator Role Selector - Styled as Military Insignia Badges */}
          <div className="pt-5 border-t border-slate-800 space-y-3 font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-amber-300 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Role Authentication (Evaluator 1-Click Access):</span>
              </span>
              <span className="text-[10px] text-slate-500">DEFENCE OPERATOR ACCESS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_PROFILES.map((p) => {
                const isSelected = username === p.user;
                const rConf = getRoleConfig(p.role);
                return (
                  <button
                    key={p.user}
                    type="button"
                    onClick={() => handleQuickLogin(p.user)}
                    className={`text-left p-3 rounded-xl border transition group relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? `${rConf.theme.pillBg} ${rConf.theme.pillBorder} shadow-lg shadow-black/60`
                        : `bg-[#070b16]/80 border-slate-800/90 hover:border-slate-700 hover:bg-[#0c1224]`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold font-sans ${isSelected ? rConf.theme.pillText : 'text-slate-200 group-hover:text-white'}`}>
                        {p.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                        isSelected 
                          ? `${rConf.theme.badgeBg} ${rConf.theme.badgeBorder} ${rConf.theme.badgeText} border` 
                          : 'bg-slate-900 border border-slate-800 text-slate-400'
                      }`}>
                        {p.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{p.org}</div>
                    <div className="text-[10px] text-slate-400 font-sans line-clamp-1 mt-1 leading-tight">
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* National Emblem & Bottom Copyright Notice */}
      <div className="mt-8 text-center space-y-1 font-mono text-[10px] text-slate-500">
        <div className="text-slate-400 font-medium">
          DEFENCE ARTIFICIAL INTELLIGENCE & CYBER ASSURANCE DIRECTORATE
        </div>
        <div>
          INDIAN ARMY / DGIS • ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}
