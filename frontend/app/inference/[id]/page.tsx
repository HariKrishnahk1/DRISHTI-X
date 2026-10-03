'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Fingerprint,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  Lock,
  Calendar,
  Layers,
  FileCode
} from 'lucide-react';
import { api } from '@/lib/api';

export default function InferenceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const loadRecord = async () => {
    try {
      const data = await api.getInference(id);
      setRecord(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadRecord();
  }, [id]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyInference(id);
      setVerifyResult(res);
      await loadRecord();
    } catch (err) {
      alert('Verification error: ' + err);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-cyan-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>LOADING PROVENANCE RECORD...</span>
      </div>
    );
  }

  if (!record) {
    return <div className="p-8 text-center text-slate-400">Record not found.</div>;
  }

  const outObj = JSON.parse(record.output_data || '{}');
  const cfgObj = JSON.parse(record.preprocessing_config || '{}');
  const isVerified = record.verification_status === 'VERIFIED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <Link href="/inference" className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center space-x-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO INFERENCE LOGS</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-white font-mono">
              Inference Provenance #{record.sequence_number}
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${
              isVerified
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
                : 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse'
            }`}>
              {record.verification_status}
            </span>
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-xs font-mono font-bold tracking-wide transition flex items-center space-x-2 shadow"
        >
          <CheckCircle className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
          <span>{verifying ? 'VERIFYING SIGNATURE...' : 'RE-VERIFY PROVENANCE'}</span>
        </button>
      </div>

      {/* Cryptographic Binding Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {/* Hashes Column */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              Cryptographic SHA-256 Digest Bindings
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Input Image SHA-256 Digest:</span>
              <div className="bg-slate-900 p-2 rounded text-cyan-400 break-all border border-slate-800">
                {record.input_hash}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Model Binary SHA-256 Digest:</span>
              <div className="bg-slate-900 p-2 rounded text-cyan-400 break-all border border-slate-800">
                {record.model_hash}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Preprocessing Config Hash:</span>
              <div className="bg-slate-900 p-2 rounded text-cyan-400 break-all border border-slate-800">
                {record.config_hash}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Prediction Output Canonical Hash:</span>
              <div className="bg-slate-900 p-2 rounded text-cyan-400 break-all border border-slate-800">
                {record.output_hash}
              </div>
            </div>
          </div>
        </div>

        {/* Signature & Sequence Column */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              Digital Signature & Replay Guard
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Ed25519 Digital Signature:</span>
              <div className="bg-slate-900 p-2 rounded text-emerald-400 break-all border border-slate-800 text-[11px]">
                {record.signature}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">SECURITY NONCE</span>
                <strong className="text-slate-200">{record.nonce}</strong>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">SEQUENCE NUMBER</span>
                <strong className="text-cyan-400">#{record.sequence_number}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">KEY IDENTIFIER</span>
                <strong className="text-slate-200">{record.public_key_id}</strong>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ALGORITHM</span>
                <strong className="text-slate-200">{record.signature_algorithm}</strong>
              </div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] block">TIMESTAMP (UTC)</span>
              <strong className="text-slate-200">{new Date(record.timestamp).toISOString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Payload Inspection JSON Card */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow font-mono text-xs">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 mb-3">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            Decoded Prediction Output Payload
          </h3>
        </div>
        <pre className="bg-[#070a13] p-4 rounded text-slate-300 border border-slate-800 overflow-x-auto text-xs">
          {JSON.stringify(outObj, null, 2)}
        </pre>
      </div>
    </div>
  );
}
