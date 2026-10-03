'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldAlert,
  Play,
  CheckCircle,
  X,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuidedTourModal({ isOpen, onClose }: GuidedTourModalProps) {
  const [mounted, setMounted] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      api.getScenarios().then((data) => setScenarios(data || []));
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleRunScenario = async (scenarioId: string) => {
    setRunningId(scenarioId);
    setActiveResult(null);
    try {
      const res = await api.runScenario(scenarioId);
      setActiveResult(res);
    } catch (err) {
      alert('Scenario execution failed: ' + err);
    } finally {
      setRunningId(null);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6 font-mono text-xs">
      <div className="bg-[#0b1020] border border-amber-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-black/90 relative">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#070b16] whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Guided Evaluator Tour
              </h3>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-amber-300/90 font-mono">
                Reproducible Threat & Assurance Scenarios
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
            title="Close Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-130px)]">
          {/* Banner Description */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <p className="leading-relaxed">
              Select any real-world defence attack scenario below to trigger controlled test injections in real time.
            </p>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded font-bold shrink-0 self-start sm:self-auto whitespace-nowrap">
              AIR-GAPPED SIMULATOR
            </span>
          </div>

          {/* Scenario Cards */}
          <div className="space-y-3">
            {scenarios.map((sc) => {
              const isRunning = runningId === sc.id;
              const isCrit = sc.severity === 'CRITICAL';
              return (
                <div
                  key={sc.id}
                  className={`p-4 rounded-xl border transition space-y-3 ${
                    isCrit ? 'bg-rose-950/15 border-rose-900/60' : 'bg-slate-900/50 border-slate-800/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 pb-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border font-mono shrink-0 ${
                        isCrit ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}>
                        {sc.severity}
                      </span>
                      <h4 className="font-bold text-slate-100 text-xs font-mono truncate">{sc.title}</h4>
                      <span className="text-slate-600 hidden md:inline">|</span>
                      <span className="text-[11px] text-slate-400 font-mono hidden md:inline truncate">{sc.category}</span>
                    </div>

                    <button
                      onClick={() => handleRunScenario(sc.id)}
                      disabled={isRunning}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 px-3.5 py-1.5 rounded-lg font-bold font-mono text-xs transition flex items-center space-x-1.5 shadow-md shadow-amber-950/40 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                      <span>{isRunning ? 'EXECUTING TEST...' : 'RUN SCENARIO'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-baseline space-x-2 text-[11px] text-slate-300">
                      <strong className="text-slate-400 font-mono shrink-0">Threat Model:</strong>
                      <span className="leading-relaxed">{sc.threat_description}</span>
                    </div>

                    <div className="flex items-baseline space-x-2 text-[11px] text-emerald-400 bg-[#060912] p-2.5 rounded-lg border border-slate-800/80">
                      <strong className="text-emerald-300 font-mono shrink-0">Expected Action:</strong>
                      <span className="leading-relaxed">{sc.expected_action}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Execution Result Box */}
          {activeResult && (
            <div className="p-4 rounded-xl bg-[#060912] border border-cyan-700/80 shadow-xl space-y-3.5 mt-4">
              <div className="flex items-center space-x-2 text-cyan-400 border-b border-slate-800 pb-2.5 whitespace-nowrap">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="font-bold uppercase tracking-wider text-xs font-mono">
                  Scenario Execution Results: {activeResult.scenario}
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
                {activeResult.status && (
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">DETECTION STATUS</span>
                    <strong className="text-rose-400 font-bold text-xs mt-0.5">{activeResult.status}</strong>
                  </div>
                )}
                {activeResult.recommended_disposition && (
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">DISPOSITION</span>
                    <strong className="text-amber-300 font-bold text-xs mt-0.5">{activeResult.recommended_disposition}</strong>
                  </div>
                )}
                {activeResult.risk_score !== undefined && (
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">RISK SCORE</span>
                    <strong className="text-white font-bold text-xs mt-0.5">{activeResult.risk_score} / 100</strong>
                  </div>
                )}
                {activeResult.shift_score !== undefined && (
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">SHIFT SCORE</span>
                    <strong className="text-cyan-400 font-bold text-xs mt-0.5">{activeResult.shift_score} / 100</strong>
                  </div>
                )}
              </div>

              {activeResult.findings && (
                <p className="text-xs text-slate-200">
                  <strong className="text-cyan-400 font-mono">Forensic Findings: </strong>
                  {activeResult.findings}
                </p>
              )}
              {activeResult.failure_reasons && (
                <div className="text-rose-300 text-[11px]">
                  <strong className="font-mono">Cryptographic Violations: </strong>
                  {activeResult.failure_reasons.join('; ')}
                </div>
              )}
              {activeResult.explanation && (
                <p className="text-xs text-slate-300">
                  <strong className="text-cyan-400 font-mono">Assurance Explanation: </strong>
                  {activeResult.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between shrink-0 bg-[#070b16] whitespace-nowrap">
          <span className="text-[10px] text-slate-500 font-mono">
            DRISHTI-X Automated Attack Simulation & Verification Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold font-mono text-xs transition cursor-pointer"
          >
            Close Tour
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
