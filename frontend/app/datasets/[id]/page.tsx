'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Database,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  User,
  Hash,
  Layers,
  FileCheck2,
  CheckCircle,
  Copy
} from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';
import DispositionBadge from '@/components/DispositionBadge';
import DispositionModal from '@/components/DispositionModal';
import SampleForensicModal from '@/components/SampleForensicModal';
import { api } from '@/lib/api';

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [dataset, setDataset] = useState<any>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);

  const loadDataset = async () => {
    try {
      const [ds, smp] = await Promise.all([
        api.getDataset(id),
        api.getDatasetSamples(id, suspiciousOnly)
      ]);
      setDataset(ds);
      setSamples(smp || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadDataset();
  }, [id, suspiciousOnly]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      await api.analyzeDataset(id);
      await loadDataset();
      alert('Integrity analysis completed. Multi-vector signals updated.');
    } catch (err) {
      alert('Analysis failed: ' + err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const rep = await api.generateReport(dataset.id, 'DATASET', 'Automated assurance analysis via dataset detail interface');
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
        <span>LOADING DATASET RECORD...</span>
      </div>
    );
  }

  if (!dataset) {
    return <div className="p-8 text-center text-slate-400">Dataset not found.</div>;
  }

  const analysisSummary = dataset.analysis_summary ? JSON.parse(dataset.analysis_summary) : null;
  const contributorRisk = analysisSummary?.contributor_risk;

  return (
    <div className="space-y-6">
      {/* Back button & Action header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <Link href="/datasets" className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center space-x-1 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK</span>
          </Link>
          <span className="text-slate-600">|</span>
          <h1 className="text-2xl font-black text-white font-mono whitespace-nowrap">{dataset.name}</h1>
          <DispositionBadge status={dataset.status} />
          <RiskBadge score={dataset.risk_score} level={dataset.risk_level} />
        </div>

        <div className="flex items-center space-x-2 shrink-0 whitespace-nowrap">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'ANALYZING...' : 'RUN INTEGRITY SCAN'}</span>
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

      {/* Dataset Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Dataset SHA-256 Digest</div>
          <div className="text-xs font-mono text-cyan-400 truncate mt-1 select-all" title={dataset.dataset_hash}>
            {dataset.dataset_hash}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Immutable archive digest</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Contributor Source</div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-1">{dataset.contributor_name}</div>
          <div className="text-[10px] text-slate-500 mt-1">Multi-contributor tracking</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Format & Ingestion</div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-1">{dataset.format} (v{dataset.version})</div>
          <div className="text-[10px] text-slate-500 mt-1">{dataset.num_images} images • {dataset.num_labels} labels</div>
        </div>

        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Assurance Disposition</div>
          <div className="mt-1">
            <DispositionBadge status={dataset.status} />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {dataset.analyzed_at ? `Scanned ${new Date(dataset.analyzed_at).toLocaleTimeString()}` : 'Unscanned'}
          </div>
        </div>
      </div>

      {/* Contributor / Source Risk Explanation Box (Section 10 Requirement) */}
      {contributorRisk && (
        <div className="bg-gradient-to-r from-[#0d162d] to-[#0b1021] border border-cyan-900/80 rounded-xl p-5 shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Contributor Source Risk Assessment: {contributorRisk.contributor_name}
              </h3>
            </div>
            <div className="text-sm font-mono font-black text-cyan-300">
              Source Risk: {contributorRisk.source_risk_score} / 100
            </div>
          </div>

          <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
            {contributorRisk.explanation}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
              <span className="text-slate-500 block text-[10px]">TOTAL SAMPLES</span>
              <strong className="text-white text-sm">{contributorRisk.total_contributed_samples}</strong>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
              <span className="text-slate-500 block text-[10px]">DUPLICATE CLUSTERS</span>
              <strong className="text-orange-400 text-sm">{contributorRisk.duplicate_clusters}</strong>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
              <span className="text-slate-500 block text-[10px]">LABEL ANOMALIES</span>
              <strong className="text-amber-400 text-sm">{contributorRisk.label_anomalies}</strong>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
              <span className="text-slate-500 block text-[10px]">OOD ANOMALIES</span>
              <strong className="text-cyan-400 text-sm">{contributorRisk.ood_samples}</strong>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
              <span className="text-slate-500 block text-[10px]">TRIGGER PATTERNS</span>
              <strong className="text-rose-400 text-sm">{contributorRisk.trigger_indicators}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Samples Grid Inspection */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Dataset Samples Inspection ({samples.length} displayed)
            </h3>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={suspiciousOnly}
                onChange={(e) => setSuspiciousOnly(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>SHOW SUSPICIOUS ONLY</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {samples.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSample(s)}
              className={`p-3 rounded-lg border font-mono text-xs space-y-2 transition cursor-pointer hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-950/30 group ${
                s.is_suspicious
                  ? 'bg-rose-950/20 border-rose-800/80'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="truncate max-w-[130px] font-bold text-slate-200 group-hover:text-cyan-300 transition" title={s.filename}>
                  {s.filename}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  s.anomaly_type === 'TRIGGER_CANDIDATE' ? 'bg-rose-950 text-rose-300' :
                  s.anomaly_type === 'NEAR_DUPLICATE' ? 'bg-orange-950 text-orange-300' :
                  s.anomaly_type === 'LABEL_ANOMALY' ? 'bg-amber-950 text-amber-300' :
                  s.anomaly_type === 'OOD_ANOMALY' ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {s.anomaly_type}
                </span>
              </div>

              {/* Sample Preview Placeholder / Canvas */}
              <div className="h-28 bg-[#060a14] rounded border border-slate-800/80 flex items-center justify-center text-slate-600 text-xs overflow-hidden relative group-hover:border-slate-700 transition">
                {s.thumbnail_url ? (
                  <img
                    src={s.thumbnail_url}
                    alt={s.filename}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                    <Database className="w-6 h-6 text-slate-700 group-hover:text-cyan-600 transition" />
                    <span className="text-[10px] text-slate-500 font-mono">{s.label || 'Target'}</span>
                  </div>
                )}
                {s.anomaly_type === 'TRIGGER_CANDIDATE' && (
                  <div className="absolute bottom-1.5 right-1.5 border border-rose-500 bg-rose-500/20 text-[9px] text-rose-300 px-1 py-0.2 rounded font-bold">
                    TRIGGER
                  </div>
                )}
              </div>

              <div className="space-y-1 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Assigned Label:</span>
                  <strong className="text-slate-200">{s.label}</strong>
                </div>
                <div className="flex justify-between">
                  <span>SHA-256:</span>
                  <span className="text-[10px] font-mono text-slate-500">{s.file_hash.slice(0, 10)}...</span>
                </div>
                {s.is_suspicious ? (
                  <div className="flex justify-between text-rose-300 font-bold">
                    <span>Suspicion Score:</span>
                    <span>{(s.suspicion_score * 100).toFixed(0)}%</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-400 font-mono text-[10px]">
                    <span>Status:</span>
                    <span>NOMINAL</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analyst Disposition Modal */}
      {showDisposition && (
        <DispositionModal
          isOpen={true}
          onClose={() => setShowDisposition(false)}
          assetId={dataset.id}
          assetName={dataset.name}
          onSuccess={loadDataset}
        />
      )}

      {/* Forensic Sample Inspector Modal */}
      <SampleForensicModal
        sample={selectedSample}
        isOpen={Boolean(selectedSample)}
        onClose={() => setSelectedSample(null)}
      />
    </div>
  );
}
