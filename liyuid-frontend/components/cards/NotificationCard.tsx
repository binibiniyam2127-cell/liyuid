"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface NotificationCardProps {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  timestamp: string;
  unread?: boolean;
}

export function NotificationCard({
  title,
  message,
  link,
  timestamp,
  unread = false,
}: NotificationCardProps) {
  return (
    <Card
      hoverable
      className={`flex flex-col gap-2.5 transition-colors ${
        unread ? "border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/10" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              unread ? "bg-blue-600 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
            }`}
          />
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h4>
        </div>
        <span className="text-[11px] text-slate-400">{timestamp}</span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
        {message}
      </p>

      <div className="pt-1 flex items-center justify-end">
        <Link href={link}>
          <Button variant="primary" className="!min-h-[36px] !py-1 text-xs px-4 font-bold">
            Open LIYUID <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

