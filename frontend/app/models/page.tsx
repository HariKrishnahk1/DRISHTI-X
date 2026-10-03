'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cpu, Upload, RefreshCw, Search, ShieldAlert, CheckCircle, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import RiskBadge from '@/components/RiskBadge';
import DispositionBadge from '@/components/DispositionBadge';
import DispositionModal from '@/components/DispositionModal';
import { api } from '@/lib/api';

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadVersion, setUploadVersion] = useState('1.0.0');
  const [uploadFormat, setUploadFormat] = useState('ONNX');
  const [expectedHash, setExpectedHash] = useState('');
  const [accessLevel, setAccessLevel] = useState('WHITE_BOX');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Disposition modal
  const [dispositionAsset, setDispositionAsset] = useState<{ id: string; name: string } | null>(null);

  const fetchModels = async () => {
    try {
      const data = await api.getModels();
      setModels(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleAnalyze = async (id: string, name: string) => {
    setAnalyzingId(id);
    try {
      const res = await api.analyzeModel(id);
      await fetchModels();
      alert(`Model analysis completed for "${name}". Substitution: ${res.is_substituted ? 'MISMATCH DETECTED' : 'VERIFIED MATCH'}, Deviation: ${(res.fingerprint_deviation * 100).toFixed(1)}%`);
    } catch (err) {
      alert('Model analysis failed: ' + err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a model file (.onnx, .pt, .bin)');
      return;
    }

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('name', uploadName);
    fd.append('version', uploadVersion);
    fd.append('format_type', uploadFormat);
    if (expectedHash) fd.append('expected_hash', expectedHash.trim());
    fd.append('access_level', accessLevel);

    try {
      await api.uploadModel(fd);
      setShowUploadModal(false);
      setUploadName('');
      setExpectedHash('');
      setUploadFile(null);
      await fetchModels();
      alert('Model registered and cryptographic digest recorded.');
    } catch (err) {
      alert('Model upload failed: ' + err);
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.contributor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-white tracking-wide font-mono whitespace-nowrap">
            MODEL REGISTRY & FINGERPRINTING
          </h1>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-cyan-400 whitespace-nowrap">
            <span>MODEL INTEGRITY & ASSURANCE</span>
            <span>•</span>
            <span>ADAPTER ARCHITECTURE</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 whitespace-nowrap">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded text-xs font-mono font-bold tracking-wide transition shadow"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>REGISTER MODEL</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl flex items-center justify-between whitespace-nowrap">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search model registry..."
            className="w-full bg-slate-900 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono whitespace-nowrap">
            <thead className="bg-[#070a13] text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Model Asset</th>
                <th className="py-3 px-4 whitespace-nowrap">Format</th>
                <th className="py-3 px-4 whitespace-nowrap">Access Level</th>
                <th className="py-3 px-4 whitespace-nowrap">SHA-256 Digest</th>
                <th className="py-3 px-4 whitespace-nowrap">Substitution Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Fingerprint Deviation</th>
                <th className="py-3 px-4 whitespace-nowrap">Risk</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    No models registered. Click Register Model or Reset Demo.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-200 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Link href={`/models/${m.id}`} className="hover:text-cyan-400 flex items-center space-x-1.5">
                          <Cpu className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span>{m.name}</span>
                        </Link>
                        <span className="text-[10px] text-slate-500 font-normal">
                          (v{m.version} • {m.contributor_name})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 font-bold whitespace-nowrap">{m.format}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {m.access_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {m.model_hash.slice(0, 12)}...
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {m.is_substituted ? (
                        <span className="text-rose-400 bg-rose-950/70 border border-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          SUBSTITUTION DETECTED
                        </span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                          VERIFIED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      {(m.fingerprint_deviation * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RiskBadge score={m.risk_score} level={m.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <DispositionBadge status={m.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleAnalyze(m.id, m.name)}
                        disabled={analyzingId === m.id}
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-bold transition inline-flex items-center space-x-1 whitespace-nowrap"
                        title="Run substitution, behavioral battery & backdoor check"
                      >
                        <RefreshCw className={`w-3 h-3 ${analyzingId === m.id ? 'animate-spin' : ''}`} />
                        <span>{analyzingId === m.id ? 'SCANNING...' : 'ANALYZE'}</span>
                      </button>

                      <button
                        onClick={() => setDispositionAsset({ id: m.id, name: m.name })}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2.5 py-1 rounded text-[11px] transition whitespace-nowrap"
                        title="Analyst disposition action"
                      >
                        DISPOSITION
                      </button>

                      <Link
                        href={`/models/${m.id}`}
                        className="p-1 hover:text-cyan-400 inline-block align-middle text-slate-400"
                        title="View Model Details"
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

      {/* Upload Model Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Register CV Model Artifact
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. DEFENCE_TACTICAL_YOLO_V8"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Format</label>
                  <select
                    value={uploadFormat}
                    onChange={(e) => setUploadFormat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                  >
                    <option value="ONNX">ONNX (.onnx)</option>
                    <option value="PYTORCH">PyTorch / TorchScript (.pt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Access Level</label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                  >
                    <option value="WHITE_BOX">WHITE_BOX</option>
                    <option value="BLACK_BOX">BLACK_BOX</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Expected Registered SHA-256 Hash (For Substitution Check)
                </label>
                <input
                  type="text"
                  value={expectedHash}
                  onChange={(e) => setExpectedHash(e.target.value)}
                  placeholder="Optional baseline hash (will flag mismatch if different)"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Model Binary File</label>
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
                  {isUploading ? 'Registering...' : 'Register Model'}
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
          onSuccess={fetchModels}
        />
      )}
    </div>
  );
}
