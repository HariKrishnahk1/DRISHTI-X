'use client';

import React, { useEffect, useState } from 'react';
import {
  History,
  CheckCircle,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Lock,
  Layers,
  Link as LinkIcon
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const data = await api.getAuditEvents();
      setEvents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setVerificationResult(res);
      await fetchEvents();
    } catch (err) {
      alert('Verification request failed: ' + err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperTest = async () => {
    if (!confirm('Simulate unauthorized alteration of an earlier audit log event? This will deliberately break the cryptographic hash chain to demonstrate tamper detection.')) return;
    try {
      const res = await api.tamperAuditTest();
      alert(`Tamper test executed on event: ${res.event_id}. Now click "VERIFY AUDIT CHAIN" to observe chain breakage!`);
      await fetchEvents();
    } catch (err) {
      alert('Tamper test error: ' + err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-white tracking-wide font-mono whitespace-nowrap">
            DEFENCE AUDIT TRAIL
          </h1>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-cyan-400 whitespace-nowrap">
            <span>TAMPER-EVIDENT CRYPTOGRAPHIC LOG</span>
            <span>•</span>
            <span>SHA-256 HASH CHAIN</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 whitespace-nowrap">
          <button
            onClick={handleTamperTest}
            className="bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800 px-3 py-1.5 rounded text-xs font-mono transition"
            title="Inject test alteration into audit event to demonstrate cryptographic detection"
          >
            SIMULATE AUDIT TAMPERING
          </button>

          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded text-xs font-mono font-bold tracking-wide transition shadow flex items-center space-x-1.5"
          >
            <CheckCircle className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'VERIFYING CHAIN...' : 'VERIFY AUDIT CHAIN'}</span>
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      {verificationResult && (
        <div className={`p-4 rounded-xl border font-mono text-xs shadow-lg transition flex items-center justify-between ${
          verificationResult.is_valid
            ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
            : 'bg-rose-950/60 border-rose-700 text-rose-300 animate-pulse'
        }`}>
          <div className="flex items-center space-x-3">
            {verificationResult.is_valid ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="text-sm font-bold uppercase tracking-wider">
                {verificationResult.status}
              </div>
              <div className="text-[11px] opacity-90 mt-0.5">
                {verificationResult.details} ({verificationResult.verified_events} of {verificationResult.total_events} blocks cryptographically verified)
              </div>
              {verificationResult.compromised_event_id && (
                <div className="text-rose-200 font-black mt-1">
                  COMPROMISED BLOCK DETECTED: {verificationResult.compromised_event_id}
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Continuous Chain Integrity</span>
            <span className="text-xs font-bold font-mono">
              {verificationResult.is_valid ? '100% UNCOMPROMISED' : 'VIOLATION FLAGGED'}
            </span>
          </div>
        </div>
      )}

      {/* Cryptographic Chain Concept Banner */}
      <div className="bg-[#0b1021] border border-cyan-950 rounded-xl p-4 text-xs font-mono flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-300 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center space-x-2 text-cyan-300 shrink-0">
          <LinkIcon className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>CRYPTOGRAPHIC CHAINING MECHANISM:</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 shrink-0">
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">EVENT 1 (H1)</span>
          <span>➜</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">EVENT 2 + H1 (H2)</span>
          <span>➜</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">EVENT 3 + H2 (H3)</span>
          <span>➜</span>
          <span className="bg-cyan-950 border border-cyan-700 px-2 py-0.5 rounded text-emerald-300 font-bold">STATE IMMUTABLE</span>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono whitespace-nowrap">
            <thead className="bg-[#070a13] text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Event ID / Block</th>
                <th className="py-3 px-4 whitespace-nowrap">Timestamp (UTC)</th>
                <th className="py-3 px-4 whitespace-nowrap">Operator / Role</th>
                <th className="py-3 px-4 whitespace-nowrap">Action</th>
                <th className="py-3 px-4 whitespace-nowrap">Target Asset</th>
                <th className="py-3 px-4 whitespace-nowrap">Previous Event Hash</th>
                <th className="py-3 px-4 whitespace-nowrap">Current Block Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-bold text-cyan-400 whitespace-nowrap">
                      {e.event_id}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {e.timestamp_str || new Date(e.timestamp).toISOString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-200 font-bold">{e.actor}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded font-mono">
                          {e.role}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 font-bold">
                        {e.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {e.asset_id ? `${e.asset_id.slice(0, 10)}...` : 'GLOBAL'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[10px] whitespace-nowrap">
                      {e.previous_event_hash.slice(0, 10)}...
                    </td>
                    <td className="py-3 px-4 text-emerald-400 text-[10px] whitespace-nowrap">
                      {e.current_event_hash.slice(0, 10)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
