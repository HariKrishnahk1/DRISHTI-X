'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileCheck2,
  ArrowLeft,
  Download,
  Printer,
  CheckCircle,
  Shield,
  ShieldAlert,
  Lock,
  RefreshCw,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';
import DispositionBadge from '@/components/DispositionBadge';
import { api, fetchWithAuth } from '@/lib/api';

export default function ReportDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      const data = await api.getReport(id);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadReport();
  }, [id]);

  const handleVerifyHash = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyReportHash(id);
      setVerifyMsg(`${res.status}: Re-calculated SHA-256 strictly matches recorded report digest (${res.recalculated_hash.slice(0, 16)}...)`);
    } catch (err) {
      alert('Verification error: ' + err);
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetchWithAuth(`/reports/${id}/download`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drishti_assurance_report_${id.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download report: ' + err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-cyan-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>COMPILING ASSURANCE REPORT...</span>
      </div>
    );
  }

  if (!report) {
    return <div className="p-8 text-center text-slate-400">Report not found.</div>;
  }

  const fullData = report.full_report_data ? JSON.parse(report.full_report_data) : {};
  const evidenceList = fullData.contributing_evidence || [];
  const coverageMatrix = fullData.assurance_coverage || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 print:hidden whitespace-nowrap">
        <Link href="/reports" className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center space-x-1 shrink-0 whitespace-nowrap">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO ASSURANCE REPORTS</span>
        </Link>

        <div className="flex items-center space-x-2 shrink-0 whitespace-nowrap">
          <button
            onClick={handleVerifyHash}
            disabled={verifying}
            className="bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 px-3 py-1.5 rounded text-xs font-mono font-bold transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <CheckCircle className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'VERIFYING...' : 'VERIFY REPORT HASH'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs font-mono font-bold transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded text-xs font-mono font-bold transition flex items-center space-x-1.5 shadow whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT REPORT</span>
          </button>
        </div>
      </div>

      {verifyMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs font-mono rounded flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{verifyMsg}</span>
        </div>
      )}

      {/* Formal Military Assurance Document */}
      <div className="bg-[#0b1021] border border-slate-700 rounded-xl p-8 shadow-2xl font-mono text-xs space-y-6 text-slate-300 print:bg-white print:text-black print:border-black">
        {/* Document Header */}
        <div className="border-b-2 border-slate-700 print:border-black pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <img src="/drishti_logo.png" alt="DRISHTI-X" className="w-12 h-12 object-contain shrink-0 drop-shadow" />
              <div>
                <h1 className="text-xl font-black text-gold-gradient print:text-black tracking-wider uppercase font-mono">
                  DRISHTI-X
                </h1>
                <div className="text-xs font-bold text-amber-400 print:text-gray-700 uppercase tracking-wide">
                  Defence AI Vision Integrity & Assurance Platform
                </div>
                <div className="text-[11px] text-slate-400 print:text-gray-600">
                  Department: Ministry of Defence / Indian Army / DGIS
                </div>
              </div>
            </div>

            <div className="text-right text-[11px]">
              <span className="bg-rose-950/80 text-rose-300 border border-rose-800 px-2.5 py-0.5 rounded font-bold uppercase tracking-widest block mb-1">
                CONFIDENTIAL // DEFENCE OPERATIONS
              </span>
              <span className="text-slate-400">Date: {new Date(report.created_at).toUTCString()}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary & Disposition */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            1. EXECUTIVE ASSURANCE EVALUATION
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] block">OVERALL RISK SCORE</span>
              <div className="text-lg font-black text-white mt-0.5">
                {report.overall_risk_score} / 100 ({report.risk_level})
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] block">EVALUATOR CONFIDENCE</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5">
                {(report.confidence * 100).toFixed(0)}% ASSURED
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] block">RECOMMENDED DISPOSITION</span>
              <div className="mt-1">
                <DispositionBadge status={report.recommended_disposition} />
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] block">FINAL DISPOSITION</span>
              <div className="mt-1">
                <DispositionBadge status={report.final_disposition} />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-3 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase font-bold">Assurance Engine Rationale:</span>
            <p className="text-slate-200 mt-0.5 leading-relaxed">
              {fullData.risk_assessment?.reason || 'Multi-vector assurance check executed across training data, model binaries, and cryptographic provenance bindings.'}
            </p>
          </div>
        </div>

        {/* Section 2: Asset Specification */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            2. TARGET ASSET INFORMATION
          </div>

          <div className="grid grid-cols-3 gap-3 text-[11px]">
            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ASSET IDENTIFIER</span>
              <strong className="text-slate-200">{report.asset_id}</strong>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ASSET NAME</span>
              <strong className="text-cyan-300">{report.asset_name}</strong>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ASSET TYPE</span>
              <strong className="text-slate-200">{report.asset_type}</strong>
            </div>
          </div>
        </div>

        {/* Section 3: Contributing Forensic Evidence */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            3. CONTRIBUTING INTEGRITY EVIDENCE ({evidenceList.length} Items)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border border-slate-800">
              <thead className="bg-[#070a13] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Evidence ID</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Detection Method</th>
                  <th className="py-2 px-3">Forensic Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {evidenceList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      No adverse integrity flags recorded. Nominal parameters.
                    </td>
                  </tr>
                ) : (
                  evidenceList.map((e: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-900/30">
                      <td className="py-2 px-3 text-cyan-400">{e.evidence_id}</td>
                      <td className="py-2 px-3">
                        <span className={`font-bold ${e.severity === 'CRITICAL' ? 'text-rose-400' : e.severity === 'HIGH' ? 'text-orange-400' : 'text-amber-400'}`}>
                          {e.severity}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">{e.evidence_type}</td>
                      <td className="py-2 px-3 text-slate-400">{e.detection_method}</td>
                      <td className="py-2 px-3 text-slate-200">{e.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Mandatory Assurance Coverage Matrix (Section 47 Requirement) */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            4. ASSURANCE COVERAGE & BOUNDARY LIMITATIONS
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            {Object.entries(coverageMatrix).map(([key, val]: [string, any]) => {
              const isSupp = val.status === 'SUPPORTED';
              const isLim = val.status === 'LIMITED';
              return (
                <div key={key} className="bg-slate-900/60 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isSupp ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      isLim ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {val.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{val.description}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-[#070a13] p-3 rounded border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <strong className="text-slate-300 block uppercase font-bold">Mandatory Operational Notice:</strong>
            <p>
              This assurance evaluation is generated from cryptographically bound SHA-256 digests and statistical indicators. Automated detectors provide defense-in-depth triage rather than mathematical certainty. Analyst physical and operational corroboration is mandatory before pipeline clearance.
            </p>
          </div>
        </div>

        {/* Section 5: Cryptographic Digest & Signature Sign-Off */}
        <div className="border-t-2 border-slate-700 print:border-black pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Cryptographic Report SHA-256 Digest:</span>
              <span className="text-cyan-300 font-bold break-all">{report.report_hash}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[10px] uppercase block">Assurance Officer:</span>
              <span className="text-slate-200 font-bold">{report.analyst_name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
