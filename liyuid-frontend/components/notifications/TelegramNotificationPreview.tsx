"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, ShieldCheck, ExternalLink } from "lucide-react";

export type TelegramType =
  | "possible_match"
  | "finder_response"
  | "handover"
  | "report_status"
  | "finder_reminder";

interface TelegramNotificationPreviewProps {
  initialType?: TelegramType;
}

export function TelegramNotificationPreview({ initialType = "possible_match" }: TelegramNotificationPreviewProps) {
  const [selectedType, setSelectedType] = useState<TelegramType>(initialType);

  const messages: Record<TelegramType, { text: string; link: string }> = {
    possible_match: {
      text: "There is an update regarding one of your reports.",
      link: "/matches",
    },
    finder_response: {
      text: "There has been an update regarding one of your reports.",
      link: "/messages",
    },
    handover: {
      text: "Your case has a new handover update.",
      link: "/handover",
    },
    report_status: {
      text: "One of your reports has an update.",
      link: "/home",
    },
    finder_reminder: {
      text: "There is an action waiting for you in LIYUID.",
      link: "/matches",
    },
  };

  const current = messages[selectedType];

  return (
    <div className="flex flex-col gap-4">
      {/* Type Switcher */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: "possible_match", label: "Possible Match" },
          { id: "finder_response", label: "Finder Response" },
          { id: "handover", label: "Handover" },
          { id: "report_status", label: "Report Status" },
          { id: "finder_reminder", label: "Finder Reminder" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedType(t.id as TelegramType)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedType === t.id
                ? "bg-[#229ED9] text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Telegram Chat Simulation */}
      <div className="bg-[#0e1621] text-white border border-[#242f3d] rounded-2xl p-6 flex flex-col items-center gap-4 shadow-inner max-w-md mx-auto w-full">
        {/* Telegram header */}
        <div className="flex items-center gap-2.5 border-b border-[#242f3d] pb-3 w-full">
          <div className="w-8 h-8 rounded-full bg-[#229ED9] flex items-center justify-center text-white font-bold">
            <Send className="w-4 h-4 -rotate-12" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              LIYUID Bot <span className="text-[9px] bg-[#229ED9]/20 text-[#229ED9] px-1.5 py-0.2 rounded font-mono">bot</span>
            </div>
            <span className="text-[10px] text-[#6c7883]">Notification Assistant</span>
          </div>
        </div>

        {/* Telegram Chat Bubble */}
        <div className="w-full flex justify-start">
          <div className="bg-[#182533] border border-[#2b3a4a] rounded-2xl rounded-tl-sm p-4 max-w-sm flex flex-col gap-3 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#64b5f6]">
              <ShieldCheck className="w-4 h-4" />
              LIYUID
            </div>
            <p className="text-xs text-[#e4ecf2] leading-relaxed">
              {current.text}
            </p>
            {/* Telegram Action Button */}
            <Link href={current.link} className="w-full">
              <button
                type="button"
                className="w-full py-2.5 px-4 bg-[#2b5278] hover:bg-[#33618e] text-[#64b5f6] hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                Open LIYUID <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>

        <span className="text-[10px] text-[#8e9ba8] text-center">
          Telegram is a notification assistant · All reporting and verification occur inside LIYUID
        </span>
      </div>
    </div>
  );
}

