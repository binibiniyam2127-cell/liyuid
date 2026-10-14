"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export type EmailType = "possible_match" | "finder_response" | "handover" | "report_status";

interface EmailNotificationPreviewProps {
  initialType?: EmailType;
}

export function EmailNotificationPreview({ initialType = "possible_match" }: EmailNotificationPreviewProps) {
  const [selectedType, setSelectedType] = useState<EmailType>(initialType);

  const templates: Record<EmailType, { subject: string; title: string; body: string; link: string }> = {
    possible_match: {
      subject: "LIYUID — Update about your report",
      title: "Update about your report",
      body: "There is an update regarding one of your reports.",
      link: "/matches",
    },
    finder_response: {
      subject: "LIYUID — Your report has an update",
      title: "Your report has an update",
      body: "There has been an update regarding one of your reports.",
      link: "/messages",
    },
    handover: {
      subject: "LIYUID — Handover update",
      title: "Handover update",
      body: "Your LIYUID case has a new handover update.",
      link: "/handover",
    },
    report_status: {
      subject: "LIYUID — Report status update",
      title: "Report status update",
      body: "One of your LIYUID reports has an update.",
      link: "/home",
    },
  };

  const current = templates[selectedType];

  return (
    <div className="flex flex-col gap-4">
      {/* Type Switcher */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: "possible_match", label: "Possible Match" },
          { id: "finder_response", label: "Finder Response" },
          { id: "handover", label: "Handover" },
          { id: "report_status", label: "Report Status" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedType(t.id as EmailType)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedType === t.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Rendered Responsive Email Box */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-[#0A192F] px-6 py-5 text-center text-white">
            <span className="text-xl font-black tracking-tight">LIYUID</span>
            <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
              Lost · Found · Reunited
            </span>
          </div>

          {/* Email Subject meta */}
          <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
            <span>Subject: </span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{current.subject}</span>
          </div>

          {/* Body */}
          <div className="p-6 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {current.body}
            </p>

            <Link href={current.link} className="mt-3 w-full max-w-[200px]">
              <Button variant="primary" className="w-full !min-h-[42px] text-xs font-bold">
                Open LIYUID
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/40 text-center text-[10px] text-slate-400 leading-relaxed flex flex-col gap-1">
            <div>Please open LIYUID to view details or take action.</div>
            <div className="text-[9px] text-slate-400/80">
              LIYUID Notification Relay · Privacy reminder: Zero sensitive details shared via email.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

