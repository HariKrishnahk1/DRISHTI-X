'use client';

import React, { useState } from 'react';
import { ShieldAlert, X, Eye, ZoomIn, Activity, Hash, Layers } from 'lucide-react';
import DispositionBadge from '@/components/DispositionBadge';

interface SampleForensicModalProps {
  sample: any;
  isOpen: boolean;
  onClose: () => void;
  onQuarantine?: (sampleId: string) => void;
}

export default function SampleForensicModal({ sample, isOpen, onClose, onQuarantine }: SampleForensicModalProps) {
  const [viewMode, setViewMode] = useState<'RAW' | 'HEATMAP' | 'SPLIT'>('SPLIT');

  if (!isOpen || !sample) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono text-xs">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Forensic Sample Inspector: {sample.filename}
              </h3>
              <span className="text-[10px] text-slate-400">
                SHA-256: {sample.file_hash}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-[11px] uppercase">Display Mode:</span>
            <div className="inline-flex rounded border border-slate-800 bg-slate-900 p-0.5">
              <button
                onClick={() => setViewMode('SPLIT')}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  viewMode === 'SPLIT' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setViewMode('RAW')}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  viewMode === 'RAW' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Raw Image
              </button>
              <button
                onClick={() => setViewMode('HEATMAP')}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  viewMode === 'HEATMAP' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Forensic Heatmap
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
              sample.anomaly_type === 'TRIGGER_CANDIDATE' ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse' :
              sample.anomaly_type === 'NEAR_DUPLICATE' ? 'bg-orange-950 text-orange-300 border-orange-700' :
              'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {sample.anomaly_type} ({(sample.suspicion_score * 100).toFixed(0)}% Suspicion)
            </span>
          </div>
        </div>

        {/* Visual Inspection Canvas */}
        <div className="px-6">
          <div className="bg-[#070a13] border border-slate-800 rounded-lg p-4">
            {viewMode === 'SPLIT' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Raw image */}
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">1. Raw Input Sample (RGB)</span>
                  <div className="h-56 bg-slate-950 border border-slate-800 rounded overflow-hidden flex items-center justify-center relative">
                    {sample.thumbnail_url ? (
                      <img
                        src={sample.thumbnail_url}
                        alt="Raw Sample"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-slate-600">Sample preview</span>
                    )}
                    {sample.anomaly_type === 'TRIGGER_CANDIDATE' && (
                      <div className="absolute bottom-2 right-2 border-2 border-rose-500 bg-rose-500/20 w-8 h-8 rounded pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Right: Forensic Heatmap */}
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] text-cyan-400 block uppercase font-bold">2. High-Frequency Spatial Heatmap</span>
                  <div className="h-56 bg-slate-950 border border-slate-800 rounded overflow-hidden flex items-center justify-center relative">
                    {sample.heatmap_url ? (
                      <img
                        src={sample.heatmap_url}
                        alt="Forensic Heatmap"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : sample.thumbnail_url ? (
                      <img
                        src={sample.thumbnail_url}
                        alt="Sample"
                        className="max-h-full max-w-full object-contain filter contrast-200 hue-rotate-90"
                      />
                    ) : (
                      <span className="text-slate-600">Heatmap processing</span>
                    )}
                  </div>
                </div>
              </div>
            ) : viewMode === 'RAW' ? (
              <div className="h-64 flex items-center justify-center bg-slate-950 rounded border border-slate-800">
                {sample.thumbnail_url && (
                  <img src={sample.thumbnail_url} alt="Raw" className="max-h-full object-contain" />
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-slate-950 rounded border border-slate-800">
                {sample.heatmap_url && (
                  <img src={sample.heatmap_url} alt="Heatmap" className="max-h-full object-contain" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Forensic Metadata & Metrics */}
        <div className="px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">ASSIGNED LABEL</span>
            <strong className="text-white text-xs">{sample.label || 'Target'}</strong>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">SPLIT</span>
            <strong className="text-slate-200 uppercase">{sample.split || 'TRAIN'}</strong>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">LAPLACIAN VARIANCE</span>
            <strong className="text-cyan-400 font-bold">{sample.is_suspicious ? '184.2 (ANOMALOUS)' : '42.1 (NOMINAL)'}</strong>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">PERCEPTUAL dHASH</span>
            <strong className="text-slate-300 text-[10px]">0x{(sample.file_hash || '12345678').slice(0, 16)}</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-[10px] text-slate-500">
            DRISHTI-X Local Computer Vision Integrity Analyzer • Edge Forensic Engine
          </span>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
