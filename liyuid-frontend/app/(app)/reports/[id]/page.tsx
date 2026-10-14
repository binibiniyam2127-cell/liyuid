"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Sparkles,
  MapPin,
  Calendar,
  Lock,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { RedactionBar } from "@/components/ui/RedactionBar";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/locale-context";
import { api } from "@/lib/api";
import { ItemResponse } from "@/lib/types";

export default function ReportDetailPage() {
  const { locale, dict } = useT();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [item, setItem] = useState<ItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (id) {
      api
        .getMyReports()
        .then((reports) => {
          const found = reports.find((r) => r.id === id);
          setItem(found || null);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [authLoading, isAuthenticated, id, router]);

  const handleScan = async () => {
    if (!id) return;
    setScanning(true);
    setScanMessage(null);
    try {
      const candidates = await api.findMatches(id);
      setScanMessage(
        `${dict.reportsPage.scanFinishedPrefix} ${candidates.length} ${dict.reportsPage.scanFinishedSuffix}`
      );
      const updated = await api.getMyReports();
      const refound = updated.find((r) => r.id === id);
      if (refound) setItem(refound);
    } catch (err: any) {
      setScanMessage(err?.message || (locale === "am" ? "የAI ፍተሻ ተጠናቋል።" : "Matching check completed."));
    } finally {
      setScanning(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "matched":
        return <StatusBadge variant="pending">{dict.reportsPage.statusPossibleMatch}</StatusBadge>;
      case "verified":
      case "handover_pending":
        return <StatusBadge variant="ok">{dict.reportsPage.statusReadyHandover}</StatusBadge>;
      case "returned":
        return <StatusBadge variant="ok">{dict.reportsPage.statusRecovered}</StatusBadge>;
      default:
        return <StatusBadge variant="private">{dict.reportsPage.statusSearching}</StatusBadge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton height={60} className="w-full rounded-2xl" />
        <Skeleton height={200} className="w-full rounded-2xl" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-white border border-[#e2eaf4] rounded-3xl p-8 text-center flex flex-col items-center gap-3 shadow-xs">
        <FileText className="w-12 h-12 text-slate-300" />
        <h2 className="text-lg font-bold text-[#062B72]">{dict.reportsPage.reportNotFound}</h2>
        <p className="text-xs text-slate-500 max-w-sm">{dict.reportsPage.reportNotFoundDesc}</p>
        <Link href="/reports">
          <Button variant="secondary" className="!w-auto px-5 !min-h-[40px] text-xs font-bold mt-2">
            {dict.reportsPage.backToReports}
          </Button>
        </Link>
      </div>
    );
  }

  const isLost = item.type === "lost";
  const title = [item.primary_color, item.brand, item.model, item.category].filter(Boolean).join(" ");

  const formattedDate = new Date(item.created_at).toLocaleDateString(
    locale === "am" ? "am-ET" : "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      {/* TOP HEADER */}
      <div className="flex items-center justify-between">
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#087FF5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{dict.reportsPage.backToReports}</span>
        </Link>
      </div>

      {scanMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200/70 rounded-2xl text-xs text-[#087FF5] font-semibold flex items-center gap-2.5 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0 text-[#087FF5]" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="bg-white border border-[#e2eaf4] rounded-3xl p-6 flex flex-col gap-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                isLost
                  ? "bg-blue-50 text-[#087FF5] border border-blue-200/60"
                  : "bg-amber-50 text-amber-800 border border-amber-200/60"
              }`}
            >
              {isLost ? dict.reportsPage.tabLost : dict.reportsPage.tabFound}
            </span>
            <span className="text-xs text-slate-400 font-mono">#{item.id.slice(0, 8)}</span>
          </div>
          {renderStatus(item.status)}
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#062B72] capitalize tracking-tight">{title}</h1>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-2">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {item.sub_city || dict.reportsPage.subcityDefault}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* PUBLIC DESCRIPTION BOX */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1.5 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            {dict.reportsPage.publicDescLabel}
          </span>
          <p className="text-[#062B72] leading-relaxed font-medium">{item.public_description}</p>
        </div>

        {/* SEALED PRIVATE VERIFICATION STATUS */}
        <div className="bg-[#f0f7ff] border border-[#d8e8fc] rounded-2xl p-4 flex items-center justify-between text-xs text-[#0096c7]">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 shrink-0 text-[#0096c7]" />
            <div>
              <span className="font-bold block text-[#062B72]">{dict.reportsPage.privateEvidenceLabel}</span>
              <span className="text-[11px] text-slate-500 block">
                {dict.reportsPage.privateEvidenceDesc}
              </span>
            </div>
          </div>
          <RedactionBar width={80} label="AES-GCM" />
        </div>

        {/* ACTION CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#e2eaf4]">
          {isLost && (
            <>
              <Button
                variant="secondary"
                onClick={handleScan}
                loading={scanning}
                className="!min-h-[42px] text-xs flex-1 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#087FF5]" />
                {dict.reportsPage.scanAiCandidates}
              </Button>
              <Link href={`/matches?itemId=${item.id}`} className="flex-1">
                <Button variant="primary" className="!min-h-[42px] text-xs w-full font-bold">
                  <Search className="w-3.5 h-3.5 mr-1" />
                  {dict.reportsPage.viewMatches}
                </Button>
              </Link>
            </>
          )}

          {!isLost && (
            <Link href="/handover" className="w-full">
              <Button variant="primary" className="!min-h-[42px] text-xs w-full font-bold">
                {dict.reportsPage.checkHandover}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
