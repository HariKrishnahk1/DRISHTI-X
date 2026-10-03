'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingDown,
  RefreshCw,
  Play,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Compass,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ShiftAnalysisPage() {
  const [shiftRecords, setShiftRecords] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [baselineId, setBaselineId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [records, ds] = await Promise.all([
        api.getShiftRecords(),
        api.getDatasets()
      ]);
      setShiftRecords(records || []);
      setDatasets(ds || []);
      if (ds && ds.length >= 2) {
        setBaselineId(ds[0].id);
        setTargetId(ds[1].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baselineId || !targetId) {
      alert('Please select both baseline and target datasets');
      return;
    }
    if (baselineId === targetId) {
      alert('Baseline and Target must be different datasets');
      return;
    }

    setAnalyzing(true);
    try {
      const rec = await api.runShiftAnalysis(baselineId, targetId);
      await fetchData();
      alert(`Shift analysis completed! Classification: ${rec.shift_classification} (Score: ${rec.shift_score}/100)`);
    } catch (err) {
      alert('Shift analysis failed: ' + err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-white tracking-wide font-mono whitespace-nowrap">
            DISTRIBUTION SHIFT ANALYZER
          </h1>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-cyan-400 whitespace-nowrap">
            <span>OPERATIONAL DRIFT & ANOMALY DETECTION</span>
            <span>•</span>
            <span>WASSERSTEIN METRIC</span>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>SYNC DRIFT RECORDS</span>
        </button>
      </div>

      {/* Distinction Directive Banner (Section 21 Requirement) */}
      <div className="bg-[#0b1021] border border-cyan-950 rounded-xl p-4 text-xs font-mono flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center space-x-2 text-cyan-300 shrink-0 whitespace-nowrap">
          <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>OPERATIONAL DOCTRINE:</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          DRISHTI-X distinguishes benign <strong className="text-emerald-400">OPERATIONAL DRIFT</strong> (terrain, season, illumination, sensor profile variance) from <strong className="text-rose-400">SUSPICIOUS MANIPULATION INDICATORS</strong> (synthetic frequency perturbation, localized adversarial injection).
        </p>
      </div>

      {/* Pairwise Shift Trigger Form */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
          <TrendingDown className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Execute Distribution Divergence Comparison
          </h3>
        </div>

        <form onSubmit={handleRunShift} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end font-mono text-xs">
          <div>
            <label className="block text-slate-400 uppercase mb-1">Baseline Certified Dataset</label>
            <select
              value={baselineId}
              onChange={(e) => setBaselineId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.contributor_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 uppercase mb-1">Target Mission Dataset</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.contributor_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={analyzing}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition shadow flex items-center justify-center space-x-1.5"
            >
              <TrendingDown className="w-4 h-4" />
              <span>{analyzing ? 'COMPUTING WASSERSTEIN...' : 'ANALYZE DISTRIBUTION SHIFT'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Distribution Shift Records */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          Recorded Distribution Divergence Assessments ({shiftRecords.length})
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {shiftRecords.map((r) => {
            const isSuspicious = r.shift_classification === 'SUSPICIOUS_MANIPULATION_INDICATOR';
            return (
              <div
                key={r.id}
                className={`p-5 rounded-xl border font-mono text-xs space-y-3 transition shadow ${
                  isSuspicious
                    ? 'bg-rose-950/20 border-rose-800/80'
                    : r.shift_score > 35
                    ? 'bg-[#0d162e] border-cyan-800/60'
                    : 'bg-[#0b1021] border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{r.baseline_name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-cyan-300">{r.target_name}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      isSuspicious
                        ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    }`}>
                      {r.shift_classification.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-black text-white bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                      Score: {r.shift_score} / 100
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {r.explanation}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">ILLUMINATION SHIFT</span>
                    <strong className="text-white">{(r.illumination_shift * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">SENSOR CONTRAST</span>
                    <strong className="text-white">{(r.sensor_variance * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">WASSERSTEIN DIVERGENCE</span>
                    <strong className="text-cyan-400">{r.feature_divergence.toFixed(3)}</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">CONFIDENCE</span>
                    <strong className="text-slate-300">{(r.confidence * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                  Method: {r.method} • Limits: {r.limitations || 'Assumes standard sensor calibration.'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
