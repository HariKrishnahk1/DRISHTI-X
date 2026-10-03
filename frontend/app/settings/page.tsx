'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Radio,
  Lock,
  Database,
  RefreshCw,
  HardDrive,
  Cpu,
  CheckCircle
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemo = async () => {
    if (!confirm('Re-seed clean and contaminated demonstration scenarios in the database?')) return;
    setIsResetting(true);
    try {
      await api.seedDemo();
      alert('Demo datasets, models, inferences, and audit records successfully seeded!');
    } catch (e) {
      alert('Seed failed: ' + e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-mono text-xs">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-white tracking-wide font-mono whitespace-nowrap">
            ASSURANCE SYSTEM PARAMETERS
          </h1>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-cyan-400 whitespace-nowrap">
            <span>PLATFORM CONFIGURATION</span>
            <span>•</span>
            <span>MIL-SPEC ASSURANCE PROFILE</span>
          </div>
        </div>
      </div>

      {/* Air-Gapped Status Card */}
      <div className="bg-[#0b1021] border border-cyan-950 p-5 rounded-xl space-y-3 shadow">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>AIR-GAPPED OPERATION ENFORCEMENT</span>
          </div>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
            ACTIVE & SECURE
          </span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          DRISHTI-X is executing in fully self-contained local mode without external network endpoints, cloud AI APIs, or remote storage. All computer-vision analysis, model inference, and cryptographic signing are executed locally.
        </p>
      </div>

      {/* Platform Specification Table */}
      <div className="bg-[#0b1021] border border-slate-800 p-5 rounded-xl space-y-4 shadow">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
          Platform Metadata & Governance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">PLATFORM NAME</span>
            <strong className="text-white">DRISHTI-X</strong>
          </div>
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">DEPLOYMENT ENVIRONMENT</span>
            <strong className="text-emerald-400">Air-Gapped Defence Network</strong>
          </div>
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">TARGET AGENCY</span>
            <strong className="text-slate-200">Ministry of Defence / Indian Army / DGIS</strong>
          </div>
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">CRYPTOGRAPHIC STANDARD</span>
            <strong className="text-emerald-400">Ed25519 (RFC 8032) + SHA-256</strong>
          </div>
        </div>
      </div>

      {/* Storage & Environment Config */}
      <div className="bg-[#0b1021] border border-slate-800 p-5 rounded-xl space-y-4 shadow">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
          Local Storage & Engine Paths
        </h3>

        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Dataset Archive Storage:</span>
            <span className="text-slate-200">./data/uploads</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Model Artifacts Directory:</span>
            <span className="text-slate-200">./models</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Cryptographic Key Storage:</span>
            <span className="text-slate-200">./backend/app/provenance/.keys/</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Assurance Reports Directory:</span>
            <span className="text-slate-200">./data/reports/</span>
          </div>
        </div>
      </div>

      {/* Demo Scenario Maintenance */}
      <div className="bg-[#0b1021] border border-slate-800 p-5 rounded-xl space-y-3 shadow">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
          Demonstration Environment Control
        </h3>
        <p className="text-slate-400 leading-relaxed">
          Reset all demonstration datasets (clean, near-duplicate flooded, backdoor trigger, operational drift), registered models (baseline certified, substituted), inferences, and cryptographic audit records.
        </p>
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded font-bold transition flex items-center space-x-2 shadow"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'RE-SEEDING ENVIRONMENT...' : 'RE-INITIALIZE DEMO SCENARIOS'}</span>
        </button>
      </div>
    </div>
  );
}
