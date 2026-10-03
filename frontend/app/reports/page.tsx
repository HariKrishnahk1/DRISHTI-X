'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  RefreshCw,
  Download,
  CheckCircle,
  Eye,
  ShieldAlert,
  Hash,
  FileText
} from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';
import DispositionBadge from '@/components/DispositionBadge';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const data = await api.getReports();
      setReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleVerifyReportHash = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await api.verifyReportHash(id);
      alert(`Report Hash Verification: ${res.status}\nRecorded: ${res.recorded_hash.slice(0, 16)}...\nCalculated: ${res.recalculated_hash.slice(0, 16)}...`);
    } catch (err) {
      alert('Verification error: ' + err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDownload = (id: string) => {
    window.open(`http://127.0.0.1:8000/api/v1/reports/${id}/download`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-white tracking-wide font-mono whitespace-nowrap">
            ASSURANCE REPORTS REGISTRY
          </h1>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-cyan-400 whitespace-nowrap">
            <span>OFFICIAL MIL-SPEC ASSURANCE</span>
            <span>•</span>
            <span>REPRODUCIBLE EVIDENCE ARTIFACTS</span>
          </div>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>SYNC REPORTS</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono whitespace-nowrap">
            <thead className="bg-[#070a13] text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Report Identifier</th>
                <th className="py-3 px-4 whitespace-nowrap">Target Asset</th>
                <th className="py-3 px-4 whitespace-nowrap">Assurance Risk</th>
                <th className="py-3 px-4 whitespace-nowrap">Disposition</th>
                <th className="py-3 px-4 whitespace-nowrap">Analyst</th>
                <th className="py-3 px-4 whitespace-nowrap">Cryptographic Report Digest</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No assurance reports generated yet. Generate a report from any Dataset or Model page.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-200 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Link href={`/reports/${r.id}`} className="hover:text-cyan-400 flex items-center space-x-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>REP-{r.id.slice(0, 8).toUpperCase()}</span>
                        </Link>
                        <span className="text-[10px] text-slate-500 font-mono font-normal">
                          ({new Date(r.created_at).toLocaleDateString()})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-200 font-bold">{r.asset_name}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-1 py-0.2 rounded font-mono">
                          {r.asset_type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RiskBadge score={r.overall_risk_score} level={r.risk_level} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DispositionBadge status={r.final_disposition} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{r.analyst_name}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {r.report_hash.slice(0, 12)}...
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleVerifyReportHash(r.id)}
                        disabled={verifyingId === r.id}
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-bold transition inline-flex items-center space-x-1 whitespace-nowrap"
                        title="Recompute canonical report hash"
                      >
                        <CheckCircle className={`w-3 h-3 ${verifyingId === r.id ? 'animate-spin' : ''}`} />
                        <span>VERIFY HASH</span>
                      </button>

                      <button
                        onClick={() => handleDownload(r.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 p-1 rounded inline-block align-middle transition"
                        title="Download JSON Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={`/reports/${r.id}`}
                        className="p-1 hover:text-cyan-400 inline-block align-middle text-slate-400"
                        title="View Full Report"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
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
