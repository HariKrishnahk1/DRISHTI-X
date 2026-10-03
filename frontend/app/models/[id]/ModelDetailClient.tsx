'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Cpu,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  CheckCircle,
  Hash,
  Activity,
  Layers
} from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';
import DispositionBadge from '@/components/DispositionBadge';
import DispositionModal from '@/components/DispositionModal';
import { api } from '@/lib/api';

export default function ModelDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);

  const loadModel = async () => {
    try {
      const data = await api.getModel(id);
      setModel(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadModel();
  }, [id]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api.analyzeModel(id);
      await loadModel();
      alert(`Model analysis complete! Fingerprint deviation: ${(res.fingerprint_deviation * 100).toFixed(1)}%`);
    } catch (err) {
      alert('Analysis failed: ' + err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const rep = await api.generateReport(model.id, 'MODEL', 'Automated model integrity assurance evaluation');
      alert(`Assurance report generated! Report Hash: ${rep.report_hash.slice(0, 16)}...`);
      router.push(`/reports/${rep.id}`);
    } catch (err) {
      alert('Report generation failed: ' + err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-cyan-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>LOADING MODEL RECORD...</span>
      </div>
    );
  }

  if (!model) {
    return <div className="p-8 text-center text-slate-400">Model not found.</div>;
  }

  const subDetails = model.substitution_details ? JSON.parse(model.substitution_details) : null;
  const currentFp = model.current_fingerprint ? JSON.parse(model.current_fingerprint) : null;
  const triggerRes = model.trigger_search_results ? JSON.parse(model.trigger_search_results) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <Link href="/models" className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center space-x-1 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK</span>
          </Link>
          <span className="text-slate-600">|</span>
          <h1 className="text-2xl font-black text-white font-mono whitespace-nowrap">{model.name}</h1>
          <DispositionBadge status={model.status} />
          <RiskBadge score={model.risk_score} level={model.risk_level} />
        </div>

        <div className="flex items-center space-x-2 shrink-0 whitespace-nowrap">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'ANALYZING...' : 'RUN INTEGRITY CHECK'}</span>
          </button>

          <button
            onClick={() => setShowDisposition(true)}
            className="bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700 text-amber-300 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap"
          >
            GOVERNANCE / DISPOSITION
          </button>

          <button
            onClick={handleGenerateReport}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded text-xs font-mono font-bold transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>GENERATE REPORT</span>
          </button>
        </div>
      </div>

      {/* Model Substitution Banner (Section 12 Requirement) */}
      {model.is_substituted ? (
        <div className="bg-rose-950/40 border border-rose-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            <span>CRITICAL ALERT: MODEL SUBSTITUTION / VERSION MISMATCH DETECTED</span>
          </div>
          <p className="text-xs text-slate-300 font-mono leading-relaxed">
            Cryptographic mismatch detected; analyst verification required. The observed binary hash diverges from the certified expected hash.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
            <div className="bg-black/50 p-2.5 rounded border border-rose-900/60">
              <span className="text-slate-400 block text-[10px] uppercase">Expected Registered SHA-256:</span>
              <span className="text-emerald-400 break-all">{model.expected_hash}</span>
            </div>
            <div className="bg-black/50 p-2.5 rounded border border-rose-900/60">
              <span className="text-slate-400 block text-[10px] uppercase">Observed Binary SHA-256:</span>
              <span className="text-rose-400 break-all">{model.model_hash}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/30 border border-emerald-800/80 p-4 rounded-xl flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-mono text-slate-300">
            <strong className="text-emerald-400">Cryptographic Integrity Verified: </strong>
            Model binary hash strictly matches registered baseline specification.
          </div>
        </div>
      )}

      {/* Metadata KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Architecture & Format</div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-1">{model.format} ({model.architecture || 'Backbone'})</div>
          <div className="text-[10px] text-slate-500 mt-1">Input shape: {model.input_shape}</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Access Level</div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-1">{model.access_level}</div>
          <div className="text-[10px] text-slate-500 mt-1">White-box behavioral analysis active</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Fingerprint Deviation</div>
          <div className="text-sm font-bold font-mono text-amber-400 mt-1">
            {(model.fingerprint_deviation * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Relative to reference test battery</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Vendor / Contributor</div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-1">{model.contributor_name}</div>
          <div className="text-[10px] text-slate-500 mt-1">Binary size: {(model.file_size_bytes / 1024).toFixed(1)} KB</div>
        </div>
      </div>

      {/* Behavioral Fingerprinting & Backdoor Indicator (Sections 13, 14, 15) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavioral Fingerprint Battery Table */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Behavioral Fingerprint Battery Results
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">8 Standard Reference Inputs</span>
          </div>

          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Deterministic synthetic defence test battery executed locally on air-gapped engine. Evaluates class probability distribution drift against baseline fingerprint.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#070a13] text-slate-500 text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Pattern #</th>
                  <th className="py-2 px-3">Predicted Class</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Class Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentFp?.fingerprint_vector?.map((item: any) => (
                  <tr key={item.battery_item} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-cyan-400">Pattern #{item.battery_item + 1}</td>
                    <td className="py-2 px-3 text-slate-200 font-bold">Class {item.predicted_class}</td>
                    <td className="py-2 px-3 text-slate-300">{(item.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px]">
                      [{item.distribution?.map((d: number) => d.toFixed(2)).join(', ')}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Backdoor-Like Behavioral Indicator Box */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Backdoor-Like Behavioral Indicator Test
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-mono leading-relaxed">
            Controlled candidate perturbation search applied to reference battery. Checks if localized perimeter high-frequency artifacts trigger prediction flipping.
          </p>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Candidate Trigger Flips Detected:</span>
              <strong className={triggerRes?.flips_detected > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {triggerRes?.flips_detected || 0} / 4 test patterns
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Backdoor Indicator Flag:</span>
              <strong className={triggerRes?.indicator_active ? 'text-rose-400' : 'text-emerald-400'}>
                {triggerRes?.indicator_active ? 'SUSPICIOUS PATTERN SENSITIVITY' : 'NOMINAL INVARIANCE'}
              </strong>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
              <strong>Explicit Limitation:</strong> Labeled as "Backdoor-like behavioral indicator" — not guaranteed universal backdoor detector. Clean-label stealth trojans require formal weight verification.
            </div>
          </div>

          {/* White-box / Black-box Assurance Coverage Matrix (Section 15 & 47 Requirement) */}
          <div className="p-3 bg-[#070a13] border border-slate-800 rounded text-xs font-mono space-y-1.5">
            <div className="text-[11px] font-bold text-cyan-400 uppercase">Assurance Coverage Matrix:</div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">• Cryptographic Hash Continuity:</span>
              <span className="text-emerald-400 font-bold">SUPPORTED</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">• Substitution Detection:</span>
              <span className="text-emerald-400 font-bold">SUPPORTED</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">• Behavioral Fingerprinting:</span>
              <span className="text-emerald-400 font-bold">SUPPORTED</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">• Deep Neural Weight Decompilation:</span>
              <span className="text-amber-400 font-bold">LIMITED</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">• Zero-Day Latent Trojan Detection:</span>
              <span className="text-slate-500 font-bold">NOT COVERED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disposition Modal */}
      {showDisposition && (
        <DispositionModal
          isOpen={true}
          onClose={() => setShowDisposition(false)}
          assetId={model.id}
          assetName={model.name}
          onSuccess={loadModel}
        />
      )}
    </div>
  );
}
