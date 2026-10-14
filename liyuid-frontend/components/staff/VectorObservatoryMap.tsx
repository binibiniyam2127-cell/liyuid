"use client";

import React, { useState } from "react";
import {
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Activity,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Search,
  Info,
} from "lucide-react";

interface VectorCluster {
  id: string;
  name: string;
  count: number;
  avgSimilarity: number;
  color: string;
  borderColor: string;
  dotColor: string;
  coordinates: { x: number; y: number }[];
}

export function VectorObservatoryMap() {
  const [activeCluster, setActiveCluster] = useState<string>("electronics");
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.85);

  const clusters: Record<string, VectorCluster> = {
    electronics: {
      id: "electronics",
      name: "Consumer Electronics (Smartphones, Laptops, Audio)",
      count: 0,
      avgSimilarity: 0.0,
      color: "bg-blue-500/10",
      borderColor: "border-blue-400",
      dotColor: "bg-blue-500",
      coordinates: [],
    },
    documents: {
      id: "documents",
      name: "Government Credentials (IDs, Passports, Cards)",
      count: 0,
      avgSimilarity: 0.0,
      color: "bg-emerald-500/10",
      borderColor: "border-emerald-400",
      dotColor: "bg-emerald-500",
      coordinates: [],
    },
    bags: {
      id: "bags",
      name: "Leather Bags, Wallets & Portfolios",
      count: 0,
      avgSimilarity: 0.0,
      color: "bg-purple-500/10",
      borderColor: "border-purple-400",
      dotColor: "bg-purple-500",
      coordinates: [],
    },
    jewelry: {
      id: "jewelry",
      name: "High-Value Jewelry & Timepieces",
      count: 0,
      avgSimilarity: 0.0,
      color: "bg-amber-500/10",
      borderColor: "border-amber-400",
      dotColor: "bg-amber-500",
      coordinates: [],
    },
  };

  const selected = clusters[activeCluster] || clusters.electronics;

  return (
    <div className="bg-white rounded-3xl border-2 border-[#e2eaf4] p-6 sm:p-7 flex flex-col gap-6 shadow-xs text-[#062B72]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#e2eaf4] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#062B72] text-cyan-300 flex items-center justify-center font-black shadow-xs">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black">384-Dimensional pgvector Embedding Space Projection</h3>
            <p className="text-xs text-[#64748B]">
              paraphrase-multilingual-MiniLM-L12-v2 • HNSW Index • Real-Time Semantic Partitioning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span>Cosine Similarity Engine Online</span>
          </span>
        </div>
      </div>

      {/* Interactive 2D Vector Cluster Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Vector Radar Canvas (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="h-80 sm:h-96 w-full rounded-2xl bg-[#0F172A] bg-gradient-to-b from-[#0F172A] to-[#020617] border-2 border-slate-800 relative overflow-hidden p-4 shadow-inner flex flex-col justify-between">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

            {/* Axis Labels */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 relative z-10">
              <span>[-1.0, +1.0] Dim-01 Semantic Axis</span>
              <span>pgvector Cosine Distance Field</span>
            </div>

            {/* Visual Cluster Clouds */}
            <div className="relative w-full h-full my-auto">
              {Object.values(clusters).map((c) => {
                const isActive = activeCluster === c.id;
                return (
                  <React.Fragment key={c.id}>
                    {c.coordinates.map((coord, i) => (
                      <div
                        key={i}
                        style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                        onClick={() => setActiveCluster(c.id)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all cursor-pointer ${
                          isActive
                            ? `${c.dotColor} w-4 h-4 ring-4 ring-white/20 animate-pulse`
                            : "bg-slate-500/60 w-2.5 h-2.5 hover:scale-150"
                        }`}
                        title={`${c.name}: Vector Node #${i + 1}`}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 relative z-10">
              <span className="text-cyan-400 font-bold">ACTIVE CLUSTER: {selected.name.toUpperCase()}</span>
              <span>INDEX: 0 VECTORS (READY FOR LIVE STREAM)</span>
            </div>
          </div>

          {/* Interactive Threshold Slider */}
          <div className="bg-[#F8FAFC] border border-[#e2eaf4] rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#64748B] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#087FF5]" />
                Cosine Auto-Pass Cutoff Threshold
              </span>
              <span className="text-xs font-mono font-black text-[#087FF5] bg-[#EBF5FF] px-2.5 py-0.5 rounded-lg border border-[#B9E1FD]">
                {similarityThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.01"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#087FF5] cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B]">
              <span>0.50 (Permissive)</span>
              <span className="text-amber-600">0.65 (Borderline Triage)</span>
              <span className="text-emerald-700">0.85 (Auto-Pass Benchmark)</span>
              <span>0.95 (Exact Match)</span>
            </div>
          </div>
        </div>

        {/* Right: Cluster Selector & Telemetry (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <span className="text-xs font-black uppercase text-[#64748B] tracking-wider">
            Semantic Vector Domains
          </span>

          <div className="flex flex-col gap-2.5">
            {Object.values(clusters).map((c) => {
              const isSelected = activeCluster === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveCluster(c.id)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 shadow-xs ${
                    isSelected
                      ? "bg-[#062B72] border-[#087FF5] text-white shadow-md"
                      : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-[#B9E1FD] text-[#062B72]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isSelected ? "text-cyan-200" : "text-[#062B72]"}`}>
                      {c.name.split(" ")[0]} {c.name.split(" ")[1]}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      isSelected ? "bg-white/10 text-white" : "bg-white text-[#64748B] border border-[#e2eaf4]"
                    }`}>
                      {c.count} items
                    </span>
                  </div>

                  <div className={`flex items-center justify-between text-[11px] ${
                    isSelected ? "text-slate-300" : "text-[#64748B]"
                  }`}>
                    <span>Mean Cosine Sim:</span>
                    <strong className="font-mono">{c.avgSimilarity.toFixed(2)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

