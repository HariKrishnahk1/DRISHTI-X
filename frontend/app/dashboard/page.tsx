'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Database,
  Cpu,
  Fingerprint,
  History,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  FileCheck2,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import WorkflowBar from '@/components/WorkflowBar';
import RiskBadge from '@/components/RiskBadge';
import DispositionBadge from '@/components/DispositionBadge';
import ThreatRadar from '@/components/ThreatRadar';
import { api } from '@/lib/api';
import {
  Crosshair,
  Lock,
  Layers,
  Activity,
  AlertOctagon,
  Radar
} from 'lucide-react';
import { getRoleConfig } from '@/lib/roles';

export default function DashboardPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [inferences, setInferences] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [auditStatus, setAuditStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const loadData = async () => {
    try {
      const [ds, md, inf, ev, aud] = await Promise.all([
        api.getDatasets(),
        api.getModels(),
        api.getInferences(),
        api.getEvidence(),
        api.verifyAuditChain()
      ]);
      setDatasets(ds || []);
      setModels(md || []);
      setInferences(inf || []);
      setEvidence(ev || []);
      setAuditStatus(aud || null);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadUser();
    const handleAuth = () => loadUser();
    window.addEventListener('storage', handleAuth);
    window.addEventListener('drishti_auth_change', handleAuth);
    return () => {
      window.removeEventListener('storage', handleAuth);
      window.removeEventListener('drishti_auth_change', handleAuth);
    };
  }, []);

  // Aggregated Stats
  const totalAssets = datasets.length + models.length;
  const quarantinedCount = datasets.filter(d => d.status === 'QUARANTINED').length + models.filter(m => m.status === 'QUARANTINED').length;
  const reviewCount = datasets.filter(d => d.status === 'REVIEW').length + models.filter(m => m.status === 'REVIEW').length;
  const acceptedCount = datasets.filter(d => d.status === 'ACCEPTED').length + models.filter(m => m.status === 'ACCEPTED').length;
  const criticalEvidenceCount = evidence.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
  const inferenceTamperCount = inferences.filter(i => i.verification_status !== 'VERIFIED').length;

  // Map assets to ThreatRadar
  const radarAssets = [
    ...datasets.map((d, idx) => ({
      id: d.id,
      name: d.name,
      type: 'DATASET',
      status: d.status,
      riskScore: d.risk_score || 0,
      angle: (idx * 65 + 35) % 360,
      radius: Math.min(0.9, Math.max(0.2, (d.risk_score || 10) / 100)),
    })),
    ...models.map((m, idx) => ({
      id: m.id,
      name: m.name,
      type: 'MODEL',
      status: m.status,
      riskScore: m.risk_score || 0,
      angle: (idx * 90 + 200) % 360,
      radius: Math.min(0.9, Math.max(0.2, (m.risk_score || 10) / 100)),
    })),
  ];

  const triggerThreatCount = evidence.filter(e => e.evidence_type === 'TRIGGER_DETECTED').length;
  const duplicateThreatCount = evidence.filter(e => e.evidence_type === 'DUPLICATE_FLOOD').length;
  const substitutedModelCount = models.filter(m => m.is_substituted).length;

  const roleConfig = getRoleConfig(currentUser?.role);

  return (
    <div className="space-y-6">
      {/* Title & Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/20 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3 shrink-0">
          <h1 className="text-2xl font-black text-gold-gradient tracking-wide font-mono whitespace-nowrap">
            MISSION INTEGRITY OPERATIONS
          </h1>
        </div>

        <div className="flex items-center space-x-3 shrink-0 whitespace-nowrap">
          <button
            onClick={() => { setLoading(true); loadData(); }}
            className="flex items-center space-x-1.5 bg-[#0e1628] border border-slate-700 hover:border-amber-400/50 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-mono transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            <span>SYNC DATA</span>
          </button>
          <Link
            href="/reports"
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-mono font-extrabold tracking-wide transition shadow shadow-amber-900/40"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>ASSURANCE REPORTS</span>
          </Link>
        </div>
      </div>

      {/* Role Mandate & Active Clearance Operational Strip */}
      <div className={`p-4 rounded-xl border ${roleConfig.theme.border} ${roleConfig.theme.bg} shadow-lg relative overflow-hidden font-mono`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${roleConfig.theme.badgeBg} ${roleConfig.theme.badgeBorder} ${roleConfig.theme.badgeText}`}>
                {roleConfig.banner.tag}
              </span>
              <span className="text-xs text-slate-200 font-bold truncate">
                {roleConfig.banner.title}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed pt-0.5">
              {roleConfig.banner.description}
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 whitespace-nowrap">
            <Link
              href={roleConfig.banner.primaryActionHref}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wide transition flex items-center space-x-1.5 shadow ${roleConfig.theme.pillBg} ${roleConfig.theme.pillBorder} ${roleConfig.theme.pillText} hover:brightness-110`}
            >
              <span>{roleConfig.banner.primaryActionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Workflow Progress Bar */}
      <WorkflowBar activeStep="ASSURANCE" />

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Assets</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{totalAssets}</div>
          <div className="text-[10px] text-slate-500 mt-1">{datasets.length} Datasets • {models.length} Models</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Trusted Assets</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{acceptedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Accepted for deployment</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Under Review</div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">{reviewCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Pending analyst check</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-rose-400 uppercase tracking-wider">Quarantined</div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1">{quarantinedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Isolated from pipeline</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-orange-400 uppercase tracking-wider">Integrity Alerts</div>
          <div className="text-2xl font-black font-mono text-orange-400 mt-1">{criticalEvidenceCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">High / Critical severity</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Audit Chain</div>
          <div className="text-xs font-mono font-bold text-emerald-400 mt-2 flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{auditStatus?.is_valid ? 'CHAIN VALID' : 'CHECKING...'}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{auditStatus?.verified_events || 0} Blocks Verified</div>
        </div>
      </div>

      {/* Threat Surveillance Radar & Active Attack Surface Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <ThreatRadar assets={radarAssets} />
        </div>

        {/* Threat Vector Defense Matrix (8 cols) */}
        <div className="lg:col-span-8 bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow font-mono flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Assurance Threat Vector Matrix
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded uppercase">
                Air-Gapped Active Guards
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Vector 1 */}
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-lg flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400 font-bold">1. Trojan Triggers</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${triggerThreatCount > 0 ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {triggerThreatCount > 0 ? 'ALERT' : 'CLEAR'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Spatial residual Laplacian & patch entropy detection for stealthy triggers.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500">Flags: {triggerThreatCount}</span>
                  <Link href="/datasets" className="text-cyan-400 hover:underline flex items-center">
                    Inspect <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Vector 2 */}
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-lg flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400 font-bold">2. Model Substitution</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${substitutedModelCount > 0 ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {substitutedModelCount > 0 ? 'MISMATCH' : 'VERIFIED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    SHA-256 weight hash validation & 8-pattern behavioral fingerprint battery.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500">Substituted: {substitutedModelCount}</span>
                  <Link href="/models" className="text-cyan-400 hover:underline flex items-center">
                    Inspect <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Vector 3 */}
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-lg flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400 font-bold">3. Crypto Tampering</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${inferenceTamperCount > 0 ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {inferenceTamperCount > 0 ? 'INTERCEPTED' : 'ENFORCED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Ed25519 digital signatures binding input, model, config, and output.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500">Tampered: {inferenceTamperCount}</span>
                  <Link href="/inference" className="text-cyan-400 hover:underline flex items-center">
                    Inspect <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Vector 4 */}
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-lg flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400 font-bold">4. Replay Guard</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300">
                      PROTECTED
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Cryptographic nonce tracking and strictly monotonic sequence counters.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500">Nonces: Monitored</span>
                  <Link href="/inference" className="text-cyan-400 hover:underline flex items-center">
                    Inspect <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Vector 5 */}
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-lg flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400 font-bold">5. Perceptual Flooding</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${duplicateThreatCount > 0 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {duplicateThreatCount > 0 ? 'FLAGGED' : 'NOMINAL'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    dHash hamming distance & HSV color histogram correlation screening.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500">Clusters: {duplicateThreatCount}</span>
                  <Link href="/datasets" className="text-cyan-400 hover:underline flex items-center">
                    Inspect <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Vector 6 */}
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-lg flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400 font-bold">6. Terrain Drift</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-cyan-950 text-cyan-300">
                      CALIBRATED
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Multivariate Wasserstein metric & edge density integral across operational domains.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500">Shift Index: Evaluated</span>
                  <Link href="/shift-analysis" className="text-cyan-400 hover:underline flex items-center">
                    Inspect <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Vector Defence AI Vision Integrity Pipeline: Active</span>
            </span>
            <span className="text-cyan-400 font-bold">Offline Local Execution Only</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Pipeline Health & Critical Evidence Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline Components Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datasets Table Summary */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Training Data Ingestion & Integrity Status
                </h3>
              </div>
              <Link href="/datasets" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1">
                <span>View All ({datasets.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070a13] text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Dataset Name</th>
                    <th className="py-2.5 px-4">Contributor</th>
                    <th className="py-2.5 px-4">Samples</th>
                    <th className="py-2.5 px-4">SHA-256 Digest</th>
                    <th className="py-2.5 px-4">Risk</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {datasets.slice(0, 4).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-200">
                        <Link href={`/datasets/${d.id}`} className="hover:text-cyan-400">
                          {d.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{d.contributor_name}</td>
                      <td className="py-3 px-4 text-slate-300">{d.num_images} images</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {d.dataset_hash ? `${d.dataset_hash.slice(0, 10)}...` : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge score={d.risk_score} level={d.risk_level} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <DispositionBadge status={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Models Table Summary */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Model Registry & Substitution Verification
                </h3>
              </div>
              <Link href="/models" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1">
                <span>View All ({models.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070a13] text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Model Asset</th>
                    <th className="py-2.5 px-4">Format</th>
                    <th className="py-2.5 px-4">Substitution Status</th>
                    <th className="py-2.5 px-4">Battery Deviation</th>
                    <th className="py-2.5 px-4">Risk</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {models.slice(0, 3).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-200">
                        <Link href={`/models/${m.id}`} className="hover:text-cyan-400">
                          {m.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{m.format}</td>
                      <td className="py-3 px-4">
                        {m.is_substituted ? (
                          <span className="text-rose-400 bg-rose-950/70 border border-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            HASH MISMATCH
                          </span>
                        ) : (
                          <span className="text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                            VERIFIED MATCH
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {(m.fingerprint_deviation * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge score={m.risk_score} level={m.risk_level} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <DispositionBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: High-Severity Evidence Feed & Judge Walkthrough */}
        <div className="space-y-6">
          {/* Judge Walkthrough Quick Card */}
          <div className="bg-gradient-to-br from-[#0e172e] to-[#070b14] border border-cyan-900/80 rounded-xl p-5 shadow-xl">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase mb-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>JUDGE DEMONSTRATION WORKFLOW</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              DRISHTI-X provides a complete, demonstrable assurance pipeline running completely offline without external APIs.
            </p>
            <div className="space-y-2 text-xs font-mono">
              <Link
                href="/datasets"
                className="flex items-center justify-between p-2 rounded bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-700 transition"
              >
                <span>1. Data Integrity & Backdoor Scan</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
              <Link
                href="/models"
                className="flex items-center justify-between p-2 rounded bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-700 transition"
              >
                <span>2. Model Substitution & Fingerprint</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
              <Link
                href="/inference"
                className="flex items-center justify-between p-2 rounded bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-700 transition"
              >
                <span>3. Ed25519 Provenance & Tamper Test</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
              <Link
                href="/shift-analysis"
                className="flex items-center justify-between p-2 rounded bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-700 transition"
              >
                <span>4. Terrain & Operational Drift</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
              <Link
                href="/audit"
                className="flex items-center justify-between p-2 rounded bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-700 transition"
              >
                <span>5. Verify Cryptographic Audit Chain</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
            </div>
          </div>

          {/* Recent Flagged Evidence */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Critical Integrity Flags
                </h3>
              </div>
              <Link href="/evidence" className="text-[11px] font-mono text-cyan-400 hover:underline">
                All ({evidence.length})
              </Link>
            </div>

            <div className="space-y-3">
              {evidence.slice(0, 4).map((ev) => (
                <div key={ev.id} className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                      {ev.evidence_type.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      ev.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300' :
                      ev.severity === 'HIGH' ? 'bg-orange-950 text-orange-300' : 'bg-amber-950 text-amber-300'
                    }`}>
                      {ev.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                    {ev.description}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Confidence: {(ev.confidence * 100).toFixed(0)}% • Method: {ev.detection_method.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
