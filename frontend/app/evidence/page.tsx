'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  ExternalLink,
  Info,
  Layers
} from 'lucide-react';
import { api } from '@/lib/api';

export default function EvidencePage() {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchEvidence = async () => {
    try {
      const data = await api.getEvidence(severityFilter || undefined);
      setEvidenceList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [severityFilter]);

  const filtered = evidenceList.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.evidence_type.toLowerCase().includes(search.toLowerCase()) ||
    e.detection_method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-white tracking-wide font-mono whitespace-nowrap">
            EVIDENCE VAULT & DETECTIONS
          </h1>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-cyan-400 whitespace-nowrap">
            <span>EVIDENCE-FIRST ASSURANCE</span>
            <span>•</span>
            <span>EXPLAINABLE FORENSIC AUDITING</span>
          </div>
        </div>

        <button
          onClick={fetchEvidence}
          className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>REFRESH EVIDENCE</span>
        </button>
      </div>

      {/* Philosophy banner */}
      <div className="bg-[#0b1021] border border-cyan-950 rounded-xl p-4 text-xs font-mono text-slate-300 flex items-start space-x-3">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cyan-300">EVIDENCE-BASED INTEGRITY RULE: </strong>
          DRISHTI-X never outputs an opaque, arbitrary risk score. Every risk score is backed by structured cryptographic or statistical forensic evidence items displaying exact observation values, detection method, detector confidence, explicit coverage limits, and recommended analyst disposition.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between font-mono text-xs whitespace-nowrap">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evidence descriptions or methods..."
            className="w-full bg-slate-900 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 whitespace-nowrap">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Structured Evidence Cards Grid */}
      <div className="grid grid-cols-1 gap-4 font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-[#0b1021] border border-slate-800 rounded-xl">
            No evidence records matching current filter.
          </div>
        ) : (
          filtered.map((item) => {
            const isCrit = item.severity === 'CRITICAL';
            const isHigh = item.severity === 'HIGH';
            return (
              <div
                key={item.id}
                className={`p-5 rounded-xl border space-y-4 transition shadow ${
                  isCrit
                    ? 'bg-rose-950/20 border-rose-800/90'
                    : isHigh
                    ? 'bg-orange-950/20 border-orange-800/80'
                    : 'bg-[#0b1021] border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                      isCrit ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse' :
                      isHigh ? 'bg-orange-950 text-orange-300 border-orange-700' : 'bg-amber-950 text-amber-300 border-amber-700'
                    }`}>
                      {item.severity} SEVERITY
                    </span>
                    <span className="font-bold text-slate-200">
                      {item.evidence_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">({item.asset_type})</span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Confidence: <strong className="text-cyan-400">{(item.confidence * 100).toFixed(0)}%</strong> • {new Date(item.created_at).toLocaleTimeString()}
                  </div>
                </div>

                {/* Question & Answer Forensic Structure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: What & Why */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block mb-0.5">What Happened? (Observation)</span>
                      <p className="text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
                        {item.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">OBSERVED VALUE</span>
                        <strong className="text-rose-300">{item.observed_value || 'Anomalous'}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">EXPECTED VALUE</span>
                        <strong className="text-emerald-400">{item.expected_value || 'Certified Baseline'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: How detected, Limitations, Recommended Action */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block mb-0.5">How was it detected?</span>
                      <div className="text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                        {item.detection_method}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block mb-0.5">What should the analyst do?</span>
                      <div className="text-amber-300 bg-slate-900/60 p-2.5 rounded border border-slate-800 font-semibold">
                        {item.recommended_action || 'Inspect asset and update governance disposition.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Limitations Footer */}
                {item.limitations && (
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center space-x-1.5">
                    <strong>Coverage & Limitations:</strong>
                    <span>{item.limitations}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
