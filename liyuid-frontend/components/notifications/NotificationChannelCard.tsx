"use client";

import React from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface NotificationChannelCardProps {
  email: string;
  emailEnabled?: boolean;
  telegramConnected?: boolean;
  onManage?: () => void;
}

export function NotificationChannelCard({
  email,
  emailEnabled = true,
  telegramConnected = true,
  onManage,
}: NotificationChannelCardProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Email channel */}
      <div className="bg-slate-50/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Email</span>
            <span className="text-xs text-slate-400 font-mono">{email}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>✓ Enabled</span>
        </div>
      </div>

      {/* Telegram channel */}
      <div className="bg-slate-50/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center font-bold">
            <Send className="w-5 h-5 -rotate-12" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Telegram</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800">
                ✓ Connected
              </span>
            </div>
            <span className="text-xs text-slate-400 mt-0.5">
              Receive LIYUID updates through Telegram
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
          <span>✓ Enabled</span>
        </div>
      </div>
    </div>
  );
}

