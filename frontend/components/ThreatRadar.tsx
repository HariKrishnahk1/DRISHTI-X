'use client';

import React, { useState } from 'react';
import { Compass, ShieldAlert, CheckCircle, AlertTriangle, Radio } from 'lucide-react';

interface ThreatRadarProps {
  assets: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    riskScore: number;
    angle: number;
    radius: number;
  }>;
}

export default function ThreatRadar({ assets }: ThreatRadarProps) {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  return (
    <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 shadow font-mono text-xs flex flex-col items-center">
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            Sector Threat Radar & Asset Surveillance
          </h3>
        </div>
        <span className="text-[10px] text-cyan-400 bg-cyan-950/70 border border-cyan-800 px-2 py-0.5 rounded uppercase">
          360° SWEEP ACTIVE
        </span>
      </div>

      <div className="relative w-72 h-72 flex items-center justify-center my-2">
        {/* Radar Rings */}
        <div className="absolute w-72 h-72 rounded-full border border-cyan-900/40 bg-slate-950/40" />
        <div className="absolute w-52 h-52 rounded-full border border-cyan-900/50" />
        <div className="absolute w-32 h-32 rounded-full border border-cyan-900/60" />
        <div className="absolute w-12 h-12 rounded-full border border-cyan-500/40" />

        {/* Crosshairs */}
        <div className="absolute w-full h-[1px] bg-cyan-900/40" />
        <div className="absolute h-full w-[1px] bg-cyan-900/40" />

        {/* Sweeping Beam Animation */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.25) 0deg, rgba(6, 182, 212, 0) 60deg, transparent 360deg)',
            animation: 'spin 4s linear infinite',
          }}
        />

        {/* Asset Blips */}
        {assets.map((asset, i) => {
          // polar to cartesian
          const rad = (asset.angle * Math.PI) / 180;
          const r = asset.radius * 120; // 0 to 120px from center
          const x = 144 + r * Math.cos(rad);
          const y = 144 + r * Math.sin(rad);

          const isQuarantined = asset.status === 'QUARANTINED';
          const isReview = asset.status === 'REVIEW';
          const colorClass = isQuarantined
            ? 'bg-rose-500 border-rose-300 shadow-rose-500 animate-ping'
            : isReview
            ? 'bg-amber-400 border-amber-200 shadow-amber-400'
            : 'bg-emerald-400 border-emerald-200 shadow-emerald-400';

          return (
            <button
              key={asset.id || i}
              onClick={() => setSelectedAsset(asset)}
              style={{ left: `${x - 6}px`, top: `${y - 6}px` }}
              className="absolute group z-10 focus:outline-none"
              title={`${asset.name} (${asset.status})`}
            >
              <span className={`block w-3 h-3 rounded-full border ${colorClass} shadow-md transition-transform group-hover:scale-150`} />
              <span className="hidden group-hover:block absolute left-4 -top-2 whitespace-nowrap bg-black/90 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] z-20">
                {asset.name} • {asset.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Asset Readout */}
      <div className="w-full mt-3 p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] flex items-center justify-between">
        {selectedAsset ? (
          <>
            <div>
              <span className="text-slate-400 block text-[10px]">SELECTED TRACK:</span>
              <strong className="text-cyan-300 font-bold">{selectedAsset.name}</strong>
              <span className="text-slate-500 ml-1">({selectedAsset.type})</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">STATUS / RISK:</span>
              <strong className={selectedAsset.status === 'QUARANTINED' ? 'text-rose-400' : 'text-emerald-400'}>
                {selectedAsset.status} ({selectedAsset.riskScore}/100)
              </strong>
            </div>
          </>
        ) : (
          <span className="text-slate-500 text-center w-full">
            Click any radar blip to inspect live track telemetry.
          </span>
        )}
      </div>
    </div>
  );
}
