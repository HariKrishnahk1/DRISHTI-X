'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, X } from 'lucide-react';
import { api } from '@/lib/api';

interface DispositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assetName: string;
  onSuccess: () => void;
}

export default function DispositionModal({ isOpen, onClose, assetId, assetName, onSuccess }: DispositionModalProps) {
  const [action, setAction] = useState<'ACCEPT' | 'REVIEW' | 'QUARANTINE'>('QUARANTINE');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('A formal justification reason is required for defence audit compliance.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === 'ACCEPT') {
        await api.acceptAsset(assetId, reason, notes);
      } else if (action === 'REVIEW') {
        await api.reviewAsset(assetId, reason, notes);
      } else {
        await api.quarantineAsset(assetId, reason, notes);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to update disposition: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              Analyst Governance Disposition
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Target Asset</label>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded text-xs font-mono text-cyan-300">
              {assetName} ({assetId})
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Recommended Disposition</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction('ACCEPT')}
                className={`py-2 px-3 text-xs font-mono font-bold rounded border transition ${
                  action === 'ACCEPT'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                ACCEPT
              </button>
              <button
                type="button"
                onClick={() => setAction('REVIEW')}
                className={`py-2 px-3 text-xs font-mono font-bold rounded border transition ${
                  action === 'REVIEW'
                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                REVIEW
              </button>
              <button
                type="button"
                onClick={() => setAction('QUARANTINE')}
                className={`py-2 px-3 text-xs font-mono font-bold rounded border transition ${
                  action === 'QUARANTINE'
                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                QUARANTINE
              </button>
            </div>
          </div>

          {action === 'QUARANTINE' && (
            <div className="bg-rose-950/40 border border-rose-900/60 p-3 rounded text-xs text-rose-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Quarantine will immediately isolate this asset from active operational inference pipelines and log a high-severity event in the cryptographic audit chain.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
              Justification Reason <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Unverified SHA-256 hash mismatch / Backdoor trigger pattern identified"
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
              Analyst Tactical Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add specific observations, sample IDs, or vendor remediation requirements..."
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-xs font-mono font-bold rounded shadow transition ${
                action === 'QUARANTINE'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : action === 'REVIEW'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSubmitting ? 'Recording...' : `Confirm ${action}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
