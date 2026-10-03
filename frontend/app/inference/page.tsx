'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Fingerprint,
  Upload,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileCheck2,
  Lock,
  Eye,
  Sliders,
  Play
} from 'lucide-react';
import { api } from '@/lib/api';

export default function InferencePage() {
  const [inferences, setInferences] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Run Inference form
  const [selectedModelId, setSelectedModelId] = useState('');
  const [testImageFile, setTestImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Verification result modal
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [inf, md] = await Promise.all([
        api.getInferences(),
        api.getModels()
      ]);
      setInferences(inf || []);
      setModels(md || []);
      if (md && md.length > 0 && !selectedModelId) {
        setSelectedModelId(md[0].id);
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

  const handleRunInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testImageFile) {
      alert('Please select an input image for inference');
      return;
    }
    if (!selectedModelId) {
      alert('Please select a model');
      return;
    }

    setIsRunning(true);
    const fd = new FormData();
    fd.append('model_id', selectedModelId);
    fd.append('image', testImageFile);
    fd.append('normalize', 'true');
    fd.append('confidence_threshold', '0.5');

    try {
      const rec = await api.runInference(fd);
      await fetchData();
      alert(`Inference completed! Sequence #${rec.sequence_number} cryptographically signed with Ed25519.`);
    } catch (err) {
      alert('Inference execution failed: ' + err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await api.verifyInference(id);
      setVerifyResult(res);
      await fetchData();
    } catch (err) {
      alert('Verification error: ' + err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleTamper = async (id: string) => {
    if (!confirm('Simulate malicious tampering on this output prediction payload? This demonstrates instant cryptographic mismatch detection.')) return;
    try {
      await api.tamperInference(id);
      await fetchData();
      alert('Output tampered for testing! Now click "VERIFY" to inspect cryptographic failure.');
    } catch (err) {
      alert('Tamper simulation failed: ' + err);
    }
  };

  const handleReplay = async (id: string) => {
    if (!confirm('Simulate nonce/sequence replay attack on this record?')) return;
    try {
      await api.replayInference(id);
      await fetchData();
      alert('Replay simulated! Now click "VERIFY" to inspect replay alert.');
    } catch (err) {
      alert('Replay simulation failed: ' + err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-white tracking-wide font-mono whitespace-nowrap">
            INFERENCE PROVENANCE & TAMPER VERIFICATION
          </h1>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-cyan-400 whitespace-nowrap">
            <span>CRYPTOGRAPHIC PROVENANCE BINDING</span>
            <span>•</span>
            <span>SHA-256 + ED25519</span>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-mono transition shrink-0 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>SYNC RECORDS</span>
        </button>
      </div>

      {/* Concept Architecture Banner */}
      <div className="bg-[#0b1021] border border-cyan-950 rounded-xl p-4 text-xs font-mono flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-slate-300 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center space-x-2 text-cyan-300 shrink-0">
          <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>CRYPTOGRAPHIC PROVENANCE BINDING:</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">INPUT SHA-256</span>
          <span>+</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">MODEL SHA-256</span>
          <span>+</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">CONFIG HASH</span>
          <span>+</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">OUTPUT HASH</span>
          <span>+</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">NONCE + SEQ</span>
          <span>➜</span>
          <span className="bg-cyan-950 border border-cyan-700 px-2 py-0.5 rounded text-cyan-200 font-bold">Ed25519 SIGNATURE</span>
        </div>
      </div>

      {/* Live Inference Runner Card */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
          <Play className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Execute Cryptographically Bound Inference
          </h3>
        </div>

        <form onSubmit={handleRunInference} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end font-mono text-xs">
          <div>
            <label className="block text-slate-400 uppercase mb-1">Target Model</label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.format})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 uppercase mb-1">Input Image File</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              required
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                setTestImageFile(file);
                if (file) {
                  setImagePreview(URL.createObjectURL(file));
                } else {
                  setImagePreview(null);
                }
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-cyan-950 file:text-cyan-300 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase mb-1">Preprocessing Mode</label>
            <div className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-300">
              Standard RGB 224x224 Norm
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isRunning}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition shadow flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{isRunning ? 'RUNNING & SIGNING...' : 'RUN & SIGN INFERENCE'}</span>
            </button>
          </div>
        </form>

        {imagePreview && (
          <div className="mt-4 p-3 bg-[#060912] rounded-xl border border-cyan-800/60 flex items-center space-x-3.5 font-mono text-xs animate-in fade-in duration-200">
            <img src={imagePreview} alt="Selected preview" className="w-12 h-12 rounded-lg object-cover border border-cyan-500/50 shadow" />
            <div className="min-w-0 flex-1">
              <div className="text-slate-100 font-bold truncate flex items-center space-x-2">
                <span>{testImageFile?.name}</span>
                <span className="text-[9px] bg-cyan-950 border border-cyan-700 text-cyan-300 px-1.5 py-0.2 rounded font-bold">READY</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Size: {((testImageFile?.size || 0) / 1024).toFixed(1)} KB • Ready for cryptographic SHA-256 hashing & Ed25519 military provenance signing.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provenance Records Table */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Cryptographic Provenance Records ({inferences.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono whitespace-nowrap">
            <thead className="bg-[#070a13] text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Seq / Nonce</th>
                <th className="py-3 px-4 whitespace-nowrap">Model Asset</th>
                <th className="py-3 px-4 whitespace-nowrap">Input SHA-256</th>
                <th className="py-3 px-4 whitespace-nowrap">Output SHA-256</th>
                <th className="py-3 px-4 whitespace-nowrap">Ed25519 Signature</th>
                <th className="py-3 px-4 whitespace-nowrap">Integrity Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inferences.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No inference records found. Execute an inference or click Reset Demo.
                  </td>
                </tr>
              ) : (
                inferences.map((rec) => {
                  const outObj = JSON.parse(rec.output_data || '{}');
                  const isVerified = rec.verification_status === 'VERIFIED';
                  return (
                    <tr key={rec.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-cyan-400">#{rec.sequence_number}</span>
                          <span className="text-[10px] text-slate-500 font-mono" title={rec.nonce}>
                            ({rec.nonce.slice(0, 8)}...)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-200">{rec.model_name}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono">
                            {outObj.class_label} ({(outObj.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {rec.input_hash.slice(0, 10)}...
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {rec.output_hash.slice(0, 10)}...
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[10px] whitespace-nowrap">
                        {rec.signature.slice(0, 12)}...
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isVerified ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>VERIFIED</span>
                          </span>
                        ) : rec.verification_status === 'REPLAY_DETECTED' ? (
                          <span className="inline-flex items-center space-x-1 text-orange-400 bg-orange-950/80 border border-orange-800 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-orange-400 shrink-0" />
                            <span>REPLAY ALERT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>INTEGRITY FAILURE</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleVerify(rec.id)}
                          disabled={verifyingId === rec.id}
                          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-bold transition inline-flex items-center space-x-1"
                          title="Recompute all SHA-256 digests and check Ed25519 signature"
                        >
                          <CheckCircle className={`w-3 h-3 ${verifyingId === rec.id ? 'animate-spin' : ''}`} />
                          <span>VERIFY</span>
                        </button>

                        <button
                          onClick={() => handleTamper(rec.id)}
                          className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 px-2 py-1 rounded text-[10px] transition"
                          title="Simulate output modification attack"
                        >
                          TAMPER TEST
                        </button>

                        <button
                          onClick={() => handleReplay(rec.id)}
                          className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800 px-2 py-1 rounded text-[10px] transition"
                          title="Simulate replay attack"
                        >
                          REPLAY TEST
                        </button>

                        <Link
                          href={`/inference/${rec.id}`}
                          className="p-1 hover:text-cyan-400 inline-block align-middle text-slate-400"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Result Modal */}
      {verifyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {verifyResult.is_valid ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Cryptographic Verification Result
                </h3>
              </div>
              <button onClick={() => setVerifyResult(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center p-3 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 uppercase">Verification Status:</span>
                <span className={`text-sm font-bold ${verifyResult.is_valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {verifyResult.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 uppercase font-bold">Cryptographic Sub-Checks:</div>
                <div className="p-3 bg-[#070a13] border border-slate-800 rounded space-y-1.5">
                  <div className="flex justify-between">
                    <span>• Input Image Hash Consistency:</span>
                    <strong className={verifyResult.checks?.input_hash_valid ? 'text-emerald-400' : 'text-rose-400'}>
                      {verifyResult.checks?.input_hash_valid ? 'VALID' : 'MISMATCH'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>• Output Prediction Canonical Hash:</span>
                    <strong className={verifyResult.checks?.output_hash_valid ? 'text-emerald-400' : 'text-rose-400'}>
                      {verifyResult.checks?.output_hash_valid ? 'VALID' : 'MISMATCH'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>• Preprocessing Config Digest:</span>
                    <strong className={verifyResult.checks?.config_hash_valid ? 'text-emerald-400' : 'text-rose-400'}>
                      {verifyResult.checks?.config_hash_valid ? 'VALID' : 'MISMATCH'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>• Nonce Collision / Replay Guard:</span>
                    <strong className={verifyResult.checks?.replay_free ? 'text-emerald-400' : 'text-rose-400'}>
                      {verifyResult.checks?.replay_free ? 'PASS (UNIQUE NONCE)' : 'REPLAY DETECTED'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>• Ed25519 Cryptographic Signature:</span>
                    <strong className={verifyResult.checks?.signature_valid ? 'text-emerald-400' : 'text-rose-400'}>
                      {verifyResult.checks?.signature_valid ? 'SIGNATURE VALID' : 'SIGNATURE COMPROMISED'}
                    </strong>
                  </div>
                </div>
              </div>

              {verifyResult.failure_reasons?.length > 0 && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 rounded text-rose-300 space-y-1">
                  <div className="font-bold uppercase text-[11px]">Integrity Violations:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {verifyResult.failure_reasons.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setVerifyResult(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
