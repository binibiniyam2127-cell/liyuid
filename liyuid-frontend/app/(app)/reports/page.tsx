"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  PlusCircle,
  Search,
  Sparkles,
  MapPin,
  Calendar,
  ArrowRight,
  RefreshCw,
  Inbox,
  Filter,
  FolderArchive,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/locale-context";
import { api } from "@/lib/api";
import { ItemResponse } from "@/lib/types";

export default function ReportsListPage() {
  const { locale, dict } = useT();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all");
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.getMyReports();
      setReports(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadReports();
    }
  }, [authLoading, isAuthenticated, router]);

  const handleScan = async (id: string) => {
    setScanningId(id);
    setMessage(null);
    try {
      const candidates = await api.findMatches(id);
      setMessage(
        `${dict.reportsPage.scanFinishedPrefix} ${candidates.length} ${dict.reportsPage.scanFinishedSuffix}`
      );
      await loadReports();
    } catch (err: any) {
      setMessage(err?.message || (locale === "am" ? "የAI ፍተሻ ተጠናቋል።" : "Matching check completed."));
    } finally {
      setScanningId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterType === "all") return true;
    return r.type === filterType;
  });

  const lostCount = reports.filter((r) => r.type === "lost").length;
  const foundCount = reports.filter((r) => r.type === "found").length;

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

  if (authLoading || (loading && reports.length === 0)) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton height={80} className="w-full rounded-2xl" />
        <Skeleton height={140} className="w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#087FF5] text-[11px] font-bold tracking-wide uppercase mb-2">
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{locale === "am" ? "የእቃዎች ማህደር" : "Case File Archive"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062B72] tracking-tight">
            {dict.reportsPage.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {dict.reportsPage.subtitle}
          </p>
        </div>

        <Link href="/reports/new">
          <Button variant="primary" className="!w-auto !min-h-[42px] px-5 text-xs font-bold shadow-md shadow-[#087FF5]/20">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            {dict.reportsPage.newReport}
          </Button>
        </Link>
      </div>

      {message && (
        <div className="p-3.5 bg-blue-50 border border-blue-200/70 rounded-2xl text-xs text-[#087FF5] font-semibold flex items-center gap-2.5 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0 text-[#087FF5]" />
          <span>{message}</span>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex items-center justify-between gap-3">
        <div className="bg-white border border-[#e2eaf4] p-1.5 rounded-2xl flex gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-[#087FF5] text-white shadow-xs"
                : "text-slate-600 hover:text-[#062B72] hover:bg-slate-50"
            }`}
          >
            {dict.reportsPage.tabAll} ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("lost")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "lost"
                ? "bg-[#087FF5] text-white shadow-xs"
                : "text-slate-600 hover:text-[#062B72] hover:bg-slate-50"
            }`}
          >
            {dict.reportsPage.tabLost} ({lostCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("found")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "found"
                ? "bg-[#087FF5] text-white shadow-xs"
                : "text-slate-600 hover:text-[#062B72] hover:bg-slate-50"
            }`}
          >
            {dict.reportsPage.tabFound} ({foundCount})
          </button>
        </div>

        <button
          onClick={loadReports}
          aria-label="Refresh reports"
          className="w-10 h-10 rounded-2xl border border-[#e2eaf4] bg-white flex items-center justify-center text-slate-500 hover:text-[#062B72] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#087FF5]" : ""}`} />
        </button>
      </div>

      {/* REPORTS LIST */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={dict.reportsPage.emptyTitle}
          text={dict.reportsPage.emptyDesc}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((item) => {
            const isLost = item.type === "lost";
            const title = [item.primary_color, item.brand, item.model, item.category]
              .filter(Boolean)
              .join(" ");

            const formattedDate = new Date(item.created_at).toLocaleDateString(
              locale === "am" ? "am-ET" : "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            );

            return (
              <div
                key={item.id}
                className="bg-white border border-[#e2eaf4] rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-xs hover:border-[#087FF5]/40 transition-all"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                          isLost
                            ? "bg-blue-50 text-[#087FF5] border border-blue-200/60"
                            : "bg-amber-50 text-amber-800 border border-amber-200/60"
                        }`}
                      >
                        {isLost ? dict.reportsPage.tabLost : dict.reportsPage.tabFound}
                      </span>
                      <span className="text-xs text-slate-400 capitalize font-medium">
                        {item.category.replace("_", " ")}
                      </span>
                    </div>
                    {renderStatus(item.status)}
                  </div>

                  <div>
                    <Link href={`/reports/${item.id}`} className="group">
                      <h3 className="font-bold text-sm text-[#062B72] capitalize group-hover:text-[#087FF5] transition-colors">
                        {title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                      {item.public_description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-[#e2eaf4]">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.sub_city || dict.reportsPage.subcityDefault}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {isLost && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => handleScan(item.id)}
                          loading={scanningId === item.id}
                          className="!min-h-[38px] !py-1 text-xs flex-1 font-semibold"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-[#087FF5]" />
                          {dict.reportsPage.scanAi}
                        </Button>
                        <Link href={`/matches?itemId=${item.id}`} className="flex-1">
                          <Button variant="primary" className="!min-h-[38px] !py-1 text-xs w-full font-bold">
                            {dict.reportsPage.matches}
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </>
                    )}

                    {!isLost && (
                      <Link href={`/reports/${item.id}`} className="w-full">
                        <Button variant="secondary" className="!min-h-[38px] !py-1 text-xs w-full font-semibold">
                          {dict.reportsPage.viewDetails}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
