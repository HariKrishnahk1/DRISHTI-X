'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, Upload, RefreshCw, Search, ShieldAlert, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';
import DispositionBadge from '@/components/DispositionBadge';
import DispositionModal from '@/components/DispositionModal';
import { api } from '@/lib/api';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadVersion, setUploadVersion] = useState('1.0.0');
  const [uploadFormat, setUploadFormat] = useState('YOLO');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Disposition modal state
  const [dispositionAsset, setDispositionAsset] = useState<{ id: string; name: string } | null>(null);

  const fetchDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleAnalyze = async (id: string, name: string) => {
    setAnalyzingId(id);
    try {
      await api.analyzeDataset(id);
      await fetchDatasets();
      alert(`Integrity analysis completed for "${name}". Risk score and evidence updated.`);
    } catch (err) {
      alert('Analysis failed: ' + err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a dataset file (.zip or image)');
      return;
    }

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('name', uploadName);
    fd.append('version', uploadVersion);
    fd.append('format_type', uploadFormat);

    try {
      await api.uploadDataset(fd);
      setShowUploadModal(false);
      setUploadName('');
      setUploadFile(null);
      await fetchDatasets();
      alert('Dataset successfully uploaded and SHA-256 registered.');
    } catch (err) {
      alert('Upload failed: ' + err);
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = datasets.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.contributor_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-white tracking-wide font-mono whitespace-nowrap">
            DATASET REGISTRY & INTEGRITY
          </h1>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-cyan-400 whitespace-nowrap">
            <span>TRAINING DATA ASSURANCE</span>
            <span>•</span>
            <span>MULTI-CONTRIBUTOR PIPELINE</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 whitespace-nowrap">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded text-xs font-mono font-bold tracking-wide transition shadow"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>INGEST DATASET</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between whitespace-nowrap">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by dataset or contributor..."
            className="w-full bg-slate-900 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 whitespace-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
          >
            <option value="">ALL STATUSES</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REVIEW">REVIEW</option>
            <option value="QUARANTINED">QUARANTINED</option>
            <option value="ANALYZED">ANALYZED</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
      </div>

      {/* Datasets Table */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono whitespace-nowrap">
            <thead className="bg-[#070a13] text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Dataset Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Contributor</th>
                <th className="py-3 px-4 whitespace-nowrap">Format</th>
                <th className="py-3 px-4 whitespace-nowrap">Samples</th>
                <th className="py-3 px-4 whitespace-nowrap">SHA-256 Digest</th>
                <th className="py-3 px-4 whitespace-nowrap">Risk Score</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No datasets found. Ingest a dataset or click Reset Demo.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-200 whitespace-nowrap">
                      <Link href={`/datasets/${d.id}`} className="hover:text-cyan-400 flex items-center space-x-1.5">
                        <Database className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span>{d.name}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{d.contributor_name}</td>
                    <td className="py-3.5 px-4 text-cyan-300 font-semibold whitespace-nowrap">{d.format}</td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{d.num_images} images</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {d.dataset_hash.slice(0, 12)}...
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RiskBadge score={d.risk_score} level={d.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <DispositionBadge status={d.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleAnalyze(d.id, d.name)}
                        disabled={analyzingId === d.id}
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-bold transition inline-flex items-center space-x-1 whitespace-nowrap"
                        title="Run duplicate, trigger, label, and OOD checks"
                      >
                        <RefreshCw className={`w-3 h-3 ${analyzingId === d.id ? 'animate-spin' : ''}`} />
                        <span>{analyzingId === d.id ? 'ANALYZING...' : 'ANALYZE'}</span>
                      </button>

                      <button
                        onClick={() => setDispositionAsset({ id: d.id, name: d.name })}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2.5 py-1 rounded text-[11px] transition whitespace-nowrap"
                        title="Analyst disposition action"
                      >
                        DISPOSITION
                      </button>

                      <Link
                        href={`/datasets/${d.id}`}
                        className="p-1 hover:text-cyan-400 inline-block align-middle text-slate-400"
                        title="View Dataset Details & Samples"
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

      {/* Ingest Dataset Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Ingest New Dataset Archive
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Dataset Name</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. BORDER_PATROL_RADAR_V1"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Version</label>
                  <input
                    type="text"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Annotation Format</label>
                  <select
                    value={uploadFormat}
                    onChange={(e) => setUploadFormat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                  >
                    <option value="YOLO">YOLO (.txt)</option>
                    <option value="COCO">COCO (.json)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Archive File (.zip or single image)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 font-mono file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-cyan-950 file:text-cyan-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded transition shadow"
                >
                  {isUploading ? 'Ingesting & Hashing...' : 'Ingest & Compute SHA-256'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disposition Modal */}
      {dispositionAsset && (
        <DispositionModal
          isOpen={true}
          onClose={() => setDispositionAsset(null)}
          assetId={dispositionAsset.id}
          assetName={dispositionAsset.name}
          onSuccess={fetchDatasets}
        />
      )}
    </div>
  );
}
