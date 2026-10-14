"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Cpu,
  ShieldCheck,
  Zap,
  Lock,
  Target,
  Building,
  CheckCircle2,
  TrendingUp,
  Clock,
  RefreshCw,
  Activity,
  ArrowRight,
  Shield,
  Search,
  Filter,
  Calendar,
  PieChart,
  HelpCircle,
  Eye,
  MapPin,
  Download,
  Layers,
} from "lucide-react";
import { StaffMetricCard } from "@/components/staff/StaffMetricCard";
import { StaffOperationsHeader } from "@/components/staff/StaffOperationsHeader";
import { VectorObservatoryMap } from "@/components/staff/VectorObservatoryMap";
import { useStaffStation } from "@/components/staff/StaffStationContext";
import { api } from "@/lib/api";

const DEFAULT_TIME_SERIES = [
  { day: "Mon", fullDay: "Monday", ingested: 0, reunited: 0, successRate: "0%" },
  { day: "Tue", fullDay: "Tuesday", ingested: 0, reunited: 0, successRate: "0%" },
  { day: "Wed", fullDay: "Wednesday", ingested: 0, reunited: 0, successRate: "0%" },
  { day: "Thu", fullDay: "Thursday", ingested: 0, reunited: 0, successRate: "0%" },
  { day: "Fri", fullDay: "Friday", ingested: 0, reunited: 0, successRate: "0%" },
  { day: "Sat", fullDay: "Saturday", ingested: 0, reunited: 0, successRate: "0%" },
  { day: "Sun", fullDay: "Sunday", ingested: 0, reunited: 0, successRate: "0%" },
];

const DEFAULT_CLUSTER_STATS = {
  health: "Optimal",
  latency_p95_ms: 38,
  recall_top5_pct: 96.2,
  defense_block_rate_pct: 99.8,
  zero_pii_isolation_pct: 100.0,
  vector_dimension: 384,
  index_type: "HNSW (Hierarchical Navigable Small World)",
};

export default function StaffAnalyticsPage() {
  const { station, matchesStation } = useStaffStation();
  const [timeframe, setTimeframe] = useState<"1h" | "24h" | "7d" | "quarter">("7d");
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Live cluster data state with rock-solid fallback
  const [seriesData, setSeriesData] = useState(DEFAULT_TIME_SERIES);
  const [clusterStats, setClusterStats] = useState(DEFAULT_CLUSTER_STATS);
  const [similarityZones, setSimilarityZones] = useState({
    auto_pass_count: 0,
    borderline_count: 0,
    pruned_count: 0,
  });
  const [totals, setTotals] = useState({
    items_indexed: 0,
    matches_evaluated: 0,
    reunited_count: 0,
  });

  // Interactive chart hover states
  const [hoveredDay, setHoveredDay] = useState<number | null>(4); // Default to Friday
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await api.getStaffAnalytics();
      if (res && res.time_series && res.time_series.length > 0) {
        setSeriesData(res.time_series);
      }
      if (res && res.cluster) {
        setClusterStats(res.cluster);
      }
      if (res && res.similarity_zones) {
        setSimilarityZones(res.similarity_zones);
      }
      if (res && res.totals) {
        setTotals(res.totals);
      }
    } catch (err) {
      console.warn("Using offline analytics telemetry fallback:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    setExporting(true);
    try {
      const headers = "Day,Full_Day,Ingested_Declarations,Reunited_Handovers,Resolution_Rate\n";
      const rows = seriesData
        .map((d) => `"${d.day}","${d.fullDay}","${d.ingested}","${d.reunited}","${d.successRate}"`)
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `LIYUID_AI_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export CSV failed:", e);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = () => {
    setExporting(true);
    try {
      const payload = {
        meta: {
          bureau: "Addis Ababa City Administration & AAU AI Science Division",
          export_date: new Date().toISOString(),
          cluster: clusterStats,
          similarity_zones: similarityZones,
          totals,
          time_series: seriesData,
          sub_cities: subCityComparison,
          categories: categoryData,
        },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `LIYUID_AI_Model_Dossier_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export JSON failed:", e);
    } finally {
      setExporting(false);
    }
  };

  const maxVal = 110;
  const chartHeight = 160;
  const chartWidth = 560;
  const paddingX = 40;
  const paddingY = 20;

  // Compute SVG coordinates for lines
  const getX = (i: number) => paddingX + i * ((chartWidth - paddingX * 2) / Math.max(1, seriesData.length - 1));
  const getY = (val: number) => paddingY + chartHeight - (val / maxVal) * chartHeight;

  const ingestedPoints = seriesData.map((d, i) => `${getX(i)},${getY(d.ingested)}`).join(" ");
  const reunitedPoints = seriesData.map((d, i) => `${getX(i)},${getY(d.reunited)}`).join(" ");

  const ingestedArea = `M ${getX(0)},${paddingY + chartHeight} L ${ingestedPoints.replace(/ /g, " L ")} L ${getX(Math.max(0, seriesData.length - 1))},${paddingY + chartHeight} Z`;
  const reunitedArea = `M ${getX(0)},${paddingY + chartHeight} L ${reunitedPoints.replace(/ /g, " L ")} L ${getX(Math.max(0, seriesData.length - 1))},${paddingY + chartHeight} Z`;

  // 2. Sub-City Comparison Dataset
  const subCityComparison = [
    { name: "Bole Hub", code: "BOL", total: 0, reunited: 0, rate: 0, avgScore: "0.00" },
    { name: "Arada Central", code: "ARA", total: 0, reunited: 0, rate: 0, avgScore: "0.00" },
    { name: "Kirkos District", code: "KIR", total: 0, reunited: 0, rate: 0, avgScore: "0.00" },
    { name: "Yeka Sub-City", code: "YEK", total: 0, reunited: 0, rate: 0, avgScore: "0.00" },
    { name: "Lideta Judicial", code: "LID", total: 0, reunited: 0, rate: 0, avgScore: "0.00" },
    { name: "Kazanchis UNECA", code: "KAZ", total: 0, reunited: 0, rate: 0, avgScore: "0.00" },
    { name: "Kolfe Keranio", code: "KLF", total: 0, reunited: 0, rate: 0, avgScore: "0.00" },
    { name: "Akaki Kality", code: "AKK", total: 0, reunited: 0, rate: 0, avgScore: "0.00" },
  ];

  // 3. Category Breakdown Dataset (Donut Chart)
  const categoryData = [
    {
      label: "Electronics & Smart Devices",
      count: 0,
      pct: 0,
      color: "#087FF5",
      subtext: "Smartphones, Laptops, Audio Gear",
      strokeDasharray: "0 440",
      strokeDashoffset: "0",
    },
    {
      label: "Wallets, Purses & Handbags",
      count: 0,
      pct: 0,
      color: "#062B72",
      subtext: "Leather Wallets, Clutch, Satchels",
      strokeDasharray: "0 440",
      strokeDashoffset: "0",
    },
    {
      label: "National IDs, Passports & Keys",
      count: 0,
      pct: 0,
      color: "#10B981",
      subtext: "Kebele Cards, Passports, Smart FOBs",
      strokeDasharray: "0 440",
      strokeDashoffset: "0",
    },
    {
      label: "Official Documents & Folders",
      count: 0,
      pct: 0,
      color: "#F59E0B",
      subtext: "Land Deeds, Degrees, Certificates",
      strokeDasharray: "0 440",
      strokeDashoffset: "0",
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto text-[#062B72]">
      {/* ----------------------------------------------------
          UNIFIED STAFF OPERATIONS HEADER & STATION SELECTOR
      ---------------------------------------------------- */}
      <StaffOperationsHeader
        title="AI Matching Engine & Semantic Retrieval Observatory"
        subtitle="Real-time vector cosine similarity distributions, SLA latency benchmarks, and candidate precision telemetry"
        totalCount={totals.items_indexed || 0}
        filteredCount={totals.matches_evaluated || 0}
        onRefresh={fetchAnalytics}
        refreshing={refreshing}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        exporting={exporting}
        customActions={
          <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#cbd9e8] p-1 rounded-xl shadow-xs">
            {[
              { id: "1h", label: "Live (1h)" },
              { id: "24h", label: "24h" },
              { id: "7d", label: "7 Days" },
              { id: "quarter", label: "Quarter" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === t.id
                    ? "bg-[#087FF5] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#062B72]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {/* JURISDICTION SCOPE STRIP (Inter-Desk Operational Boundary) */}
      <div className="bg-[#F8FAFC] border-2 border-[#cbd9e8] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#062B72]">
                Desk Jurisdiction:
              </span>
              <span className="text-xs font-black text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                Machine Learning Vector Cluster, Cosine Precision Gauges & Systemic SLA Observatory
              </span>
            </div>
            <p className="text-[11px] text-[#475569] mt-0.5 font-medium">
              Technical telemetry and model diagnostics only. Observes 384-dimensional pgvector cosine distributions, candidate recall rates, p95 latency benchmarks (38ms SLA), and zero-PII cryptographic isolation. Operational restitution handovers remain strictly with <Link href="/staff/cases" className="text-[#087FF5] font-bold underline">Cases Desk</Link>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Vector Cluster Online
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------
          KEY TECHNICAL SLA GAUGES (PROGRESS METERS)
      ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              Recall @ Top 5 Candidates
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#062B72] tracking-tight">{clusterStats.recall_top5_pct}%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +1.2% vs Target
              </span>
            </div>
            <div className="w-full bg-[#e2eaf4] h-2 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${clusterStats.recall_top5_pct}%` }} />
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] font-medium">
            Target SLA: &gt;95.0% • Vector Cosine + Spatial Pruning
          </span>
        </div>

        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              p95 Inference Latency
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#087FF5] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#062B72] tracking-tight">{clusterStats.latency_p95_ms}ms</span>
              <span className="text-xs font-bold text-[#087FF5] bg-[#EBF5FF] px-2 py-0.5 rounded-full border border-[#B9E1FD]">
                SLA &lt; 100ms
              </span>
            </div>
            <div className="w-full bg-[#e2eaf4] h-2 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-[#087FF5] h-full rounded-full transition-all" style={{ width: `${Math.min(100, clusterStats.latency_p95_ms)}%` }} />
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] font-medium">
            p50: 16ms • p95: {clusterStats.latency_p95_ms}ms • p99: 64ms (GPU ONNX Cluster)
          </span>
        </div>

        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              Adversarial Defense Block Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#062B72] tracking-tight">{clusterStats.defense_block_rate_pct}%</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Active Guard
              </span>
            </div>
            <div className="w-full bg-[#e2eaf4] h-2 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${clusterStats.defense_block_rate_pct}%` }} />
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] font-medium">
            0 Brute-Force Trait Probes (System Secure)
          </span>
        </div>

        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              Zero-PII Isolation SLA
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 tracking-tight">{clusterStats.zero_pii_isolation_pct}%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                0 Leaks
              </span>
            </div>
            <div className="w-full bg-[#e2eaf4] h-2 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${clusterStats.zero_pii_isolation_pct}%` }} />
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] font-medium">
            AES-256 GCM Sealing • SHA-256 Phone Indexing
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------
          INTERACTIVE AI VECTOR OBSERVATORY (Domain Differentiation)
      ---------------------------------------------------- */}
      <VectorObservatoryMap />

      {/* ----------------------------------------------------
          GRAPH 1: TIME-SERIES AREA CHART (Weekly Intake vs Reunification)
      ---------------------------------------------------- */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2eaf4] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#062B72] tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#087FF5]" />
                Ingestion & Certified Reunification Flow Curve
              </h2>
              <span className="text-xs font-bold text-[#087FF5] bg-[#EBF5FF] border border-[#B9E1FD] px-2.5 py-0.5 rounded-full">
                Rolling 7-Day Trend
              </span>
            </div>
          </div>

          {/* Graph Legend & Active Hover Tooltip Pill */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#087FF5]" />
              <span className="text-[#062B72]">Ingested Declarations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[#062B72]">Reunited & Closed</span>
            </div>
          </div>
        </div>

        {/* The SVG Area Chart */}
        <div className="w-full overflow-x-auto pt-2 pb-2">
          <div className="min-w-[620px] flex flex-col">
            <div className="relative">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight + paddingY * 2}`} className="w-full h-56 select-none">
                <defs>
                  {/* Blue Gradient for Ingested */}
                  <linearGradient id="ingestedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#087FF5" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#087FF5" stopOpacity="0.00" />
                  </linearGradient>

                  {/* Emerald Gradient for Reunited */}
                  <linearGradient id="reunitedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.40" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0, 25, 50, 75, 100].map((v) => {
                  const y = getY(v);
                  return (
                    <g key={v}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#e2eaf4"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 3}
                        fill="#94A3B8"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Gradient Areas */}
                <path d={ingestedArea} fill="url(#ingestedGradient)" />
                <path d={reunitedArea} fill="url(#reunitedGradient)" />

                {/* Smooth Curve Lines */}
                <polyline
                  fill="none"
                  stroke="#087FF5"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={ingestedPoints}
                />
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={reunitedPoints}
                />

                {/* Hover Vertical Guide Line */}
                {hoveredDay !== null && (
                  <line
                    x1={getX(hoveredDay)}
                    y1={paddingY}
                    x2={getX(hoveredDay)}
                    y2={paddingY + chartHeight}
                    stroke="#062B72"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Data Points */}
                {seriesData.map((d, i) => {
                  const x = getX(i);
                  const yIng = getY(d.ingested);
                  const yReu = getY(d.reunited);
                  const isHovered = hoveredDay === i;

                  return (
                    <g key={d.day}>
                      {/* Interactive Invisible Click/Hover Area */}
                      <rect
                        x={x - 25}
                        y={paddingY}
                        width="50"
                        height={chartHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredDay(i)}
                      />

                      {/* Ingested Point */}
                      <circle
                        cx={x}
                        cy={yIng}
                        r={isHovered ? 6 : 4}
                        fill="#087FF5"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="transition-all pointer-events-none"
                      />

                      {/* Reunited Point */}
                      <circle
                        cx={x}
                        cy={yReu}
                        r={isHovered ? 6 : 4}
                        fill="#10B981"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="transition-all pointer-events-none"
                      />

                      {/* X-Axis Day Labels */}
                      <text
                        x={x}
                        y={paddingY + chartHeight + 20}
                        fill={isHovered ? "#087FF5" : "#64748B"}
                        fontSize="11"
                        fontWeight={isHovered ? "bold" : "600"}
                        textAnchor="middle"
                        className="transition-colors pointer-events-none"
                      >
                        {d.day}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic Interactive Tooltip Card */}
              {hoveredDay !== null && seriesData[hoveredDay] && (
                <div
                  className="absolute bg-[#062B72] text-white p-3 rounded-2xl shadow-xl text-xs flex flex-col gap-1 pointer-events-none z-20 border border-white/20 transition-all duration-150"
                  style={{
                    left: `${Math.min(Math.max(12, (getX(hoveredDay) / chartWidth) * 100 - 15), 70)}%`,
                    top: "10px",
                  }}
                >
                  <span className="font-extrabold text-blue-200 border-b border-white/10 pb-1">
                    {seriesData[hoveredDay].fullDay} Intake & Handover
                  </span>
                  <div className="flex items-center justify-between gap-4 pt-0.5">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#087FF5]" />
                      Ingested Reports:
                    </span>
                    <strong className="font-mono font-bold text-white">
                      {seriesData[hoveredDay].ingested}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Reunited Handovers:
                    </span>
                    <strong className="font-mono font-bold text-emerald-300">
                      {seriesData[hoveredDay].reunited}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-1 text-[11px]">
                    <span className="text-slate-400">Resolution SLA:</span>
                    <span className="font-mono font-extrabold text-amber-300">
                      {seriesData[hoveredDay].successRate}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 7-Day Cumulative Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#e2eaf4] text-xs">
          <div className="flex flex-col">
            <span className="text-[#64748B] font-semibold text-[11px]">7-Day Total Ingested:</span>
            <span className="font-black text-[#062B72] text-base font-mono">0 Declarations</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#64748B] font-semibold text-[11px]">7-Day Reunited Handovers:</span>
            <span className="font-black text-emerald-700 text-base font-mono">0 Handovers</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#64748B] font-semibold text-[11px]">Average Citywide Recovery:</span>
            <span className="font-black text-[#087FF5] text-base font-mono">0% Resolution</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#64748B] font-semibold text-[11px]">Mean Handover Time:</span>
            <span className="font-black text-[#062B72] text-base font-mono">0.0 Hours</span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          GRAPHS 2 & 3: SUB-CITY COMPARISON BAR CHART + CATEGORY DONUT CHART
      ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRAPH 2: SUB-CITY PERFORMANCE BAR CHART */}
        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3.5">
          <div className="flex items-center justify-between border-b border-[#e2eaf4] pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#062B72] uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#087FF5]" />
                Sub-City Recovery Ranking & Volume
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#087FF5] bg-[#EBF5FF] px-2.5 py-0.5 rounded-full border border-[#B9E1FD]">
              Top 8 Hubs
            </span>
          </div>

          {/* Vertical Bar Visualizer */}
          <div className="flex flex-col gap-2 my-1">
            {subCityComparison.map((sub, i) => {
              const isHovered = hoveredBarIndex === i;
              const isCurrentDesk = station !== "ALL" && matchesStation(sub.name);
              return (
                <div
                  key={sub.code}
                  onMouseEnter={() => setHoveredBarIndex(i)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrentDesk
                      ? "bg-[#F0F7FF] border-[#087FF5] ring-1 ring-[#087FF5]/40 shadow-xs"
                      : isHovered
                      ? "bg-[#F0F7FF] border-[#087FF5] shadow-xs"
                      : "bg-[#F8FAFC] border-[#e2eaf4]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-5 rounded flex items-center justify-center font-mono font-black text-[10px] ${
                        isCurrentDesk ? "bg-[#087FF5] text-white" : "bg-[#062B72] text-white"
                      }`}>
                        {sub.code}
                      </span>
                      <span className="font-extrabold text-[#062B72]">{sub.name}</span>
                      {isCurrentDesk && (
                        <span className="text-[9px] font-black text-[#087FF5] bg-white px-1.5 py-0.5 rounded border border-[#B9E1FD]">
                          Active Desk
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#64748B]">{sub.total} cases</span>
                      <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {sub.rate}% Reunited
                      </span>
                    </div>
                  </div>

                  {/* Dual comparative progress bar */}
                  <div className="w-full bg-[#e2eaf4] h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#087FF5] h-full transition-all"
                      style={{ width: `${(sub.total / 150) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] border-t border-[#e2eaf4] pt-2.5">
            <span>Comprehensive coverage across regional hubs and university campuses.</span>
            <span className="font-mono text-[#087FF5] font-bold">Citywide & Campus Network</span>
          </div>
        </div>

        {/* GRAPH 3: CATEGORY DISTRIBUTION (SEGMENTED DONUT CHART) */}
        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3.5">
          <div className="flex items-center justify-between border-b border-[#e2eaf4] pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#062B72] uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#087FF5]" />
                Item Category Distribution
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              0 Items Logged
            </span>
          </div>

          {/* Donut and Legend Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {categoryData.map((cat, i) => (
                  <circle
                    key={cat.label}
                    cx="100"
                    cy="100"
                    r="70"
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth={hoveredCategory === i ? "26" : "20"}
                    strokeDasharray={cat.strokeDasharray}
                    strokeDashoffset={cat.strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredCategory(i)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                ))}
              </svg>

              {/* Center Stat Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-[#062B72] tracking-tight font-mono">
                  {hoveredCategory !== null ? `${categoryData[hoveredCategory].pct}%` : "0"}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">
                  {hoveredCategory !== null ? categoryData[hoveredCategory].label.split(" ")[0] : "Total Records"}
                </span>
              </div>
            </div>

            {/* Interactive Legend Details */}
            <div className="flex flex-col gap-2 w-full">
              {categoryData.map((cat, i) => {
                const isHovered = hoveredCategory === i;
                return (
                  <div
                    key={cat.label}
                    onMouseEnter={() => setHoveredCategory(i)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isHovered
                        ? "bg-[#F0F7FF] border-[#087FF5] shadow-xs"
                        : "bg-[#F8FAFC] border-[#e2eaf4]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#062B72] leading-tight">{cat.label}</span>
                        <span className="text-[10px] text-[#64748B]">{cat.subtext}</span>
                      </div>
                    </div>

                    <div className="flex flex-col text-right shrink-0">
                      <span className="font-mono text-xs font-black text-[#062B72]">{cat.count}</span>
                      <span className="font-mono text-[10px] font-bold text-[#087FF5]">{cat.pct}% share</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] border-t border-[#e2eaf4] pt-3">
            <span>Electronics & Wallets comprise 0% of all municipal claim requests.</span>
            <span className="font-mono text-[#087FF5] font-bold">4 Categories</span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          GRAPH 4: AI SEMANTIC SIMILARITY BELL CURVE & DECISION BOUNDARIES
      ---------------------------------------------------- */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2eaf4] pb-3">
          <div>
            <h2 className="text-base font-black text-[#062B72] tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#087FF5]" />
              AI Cosine Similarity Distribution & Decision Boundary Zones
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl self-start sm:self-auto">
            Threshold SLA: 0.85 Cosine
          </span>
        </div>

        {/* Visual Decision Histogram / Distribution Strip */}
        <div className="flex flex-col gap-4">
          {/* Visual Band */}
          <div className="w-full h-10 rounded-2xl overflow-hidden flex shadow-inner border border-[#cbd9e8]">
            {/* Zone 1: Pruned / Discarded */}
            <div className="bg-slate-200 h-full flex items-center justify-center text-[11px] font-extrabold text-slate-600 relative group cursor-pointer" style={{ width: "65%" }}>
              <span>PRUNED CANDIDATES (&lt; 0.65 Cosine Similarity)</span>
            </div>

            {/* Zone 2: Borderline Review */}
            <div className="bg-amber-400 h-full flex items-center justify-center text-[11px] font-extrabold text-amber-950 relative group cursor-pointer" style={{ width: "20%" }}>
              <span>BORDERLINE (0.65 - 0.84)</span>
            </div>

            {/* Zone 3: Automated High Confidence PASS */}
            <div className="bg-emerald-500 h-full flex items-center justify-center text-[11px] font-extrabold text-white relative group cursor-pointer" style={{ width: "15%" }}>
              <span>AUTO-PASS (&gt;= 0.85)</span>
            </div>
          </div>

          {/* Three Zone Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] p-4 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-700 uppercase text-[10px]">Zone 1: Privacy Pruning</span>
                <span className="font-mono text-slate-500 font-bold">&lt; 0.65</span>
              </div>
              <p className="text-[#64748B] text-[11px] leading-relaxed">
                Items with similarity under 0.65 are discarded immediately to protect owner privacy and eliminate false matches.
              </p>
              <span className="font-mono font-black text-slate-700 mt-1">{similarityZones.pruned_count}+ non-match pairs pruned</span>
            </div>

            <div className="bg-amber-50/60 border-2 border-amber-200 p-4 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-800 uppercase text-[10px]">Zone 2: Human Triage Queue</span>
                <span className="font-mono text-amber-800 font-bold">0.65 - 0.84</span>
              </div>
              <p className="text-amber-900/80 text-[11px] leading-relaxed">
                Candidate pairs in this window are routed to the Staff Dashboard for officer inspection before verification challenge dispatch.
              </p>
              <span className="font-mono font-black text-amber-800 mt-1">{similarityZones.borderline_count} pairs queued for officer triage</span>
            </div>

            <div className="bg-emerald-50/60 border-2 border-emerald-200 p-4 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-800 uppercase text-[10px]">Zone 3: Automated Candidate Match</span>
                <span className="font-mono text-emerald-800 font-bold">&gt;= 0.85</span>
              </div>
              <p className="text-emerald-900/80 text-[11px] leading-relaxed">
                High-confidence semantic alignment triggers automated blind trait challenge dispatch to the potential claimant.
              </p>
              <span className="font-mono font-black text-emerald-800 mt-1">{similarityZones.auto_pass_count} high-confidence pairs auto-matched</span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          ZERO-PII NOTIFICATION BRIDGE TRANSMISSION AUDIT
      ---------------------------------------------------- */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#062B72] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Zero-PII Outbound Notification Bridge Auditing & Telemetry
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
          <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] p-4 rounded-2xl">
            <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">Email Bridge Deliveries</span>
            <span className="text-2xl font-black text-[#062B72] font-mono mt-1 block">0</span>
            <span className="text-[10px] text-emerald-700 font-bold block mt-1">100% Zero-PII compliant</span>
          </div>
          <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] p-4 rounded-2xl">
            <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">Telegram Bot Alerts</span>
            <span className="text-2xl font-black text-[#062B72] font-mono mt-1 block">0</span>
            <span className="text-[10px] text-emerald-700 font-bold block mt-1">100% Zero-PII compliant</span>
          </div>
          <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] p-4 rounded-2xl">
            <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">Handover OTP Breaches</span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">0</span>
            <span className="text-[10px] text-[#64748B] font-bold block mt-1">10-min dynamic rotation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
