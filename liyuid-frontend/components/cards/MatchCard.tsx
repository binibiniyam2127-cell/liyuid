"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Calendar,
  ArrowRight,
  User,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MatchItemDetail } from "@/lib/types";

interface MatchCardProps {
  match: MatchItemDetail;
  onFinderAccept?: (matchId: string) => void;
  isFinderView?: boolean;
}

export function MatchCard({
  match,
  onFinderAccept,
  isFinderView = false,
}: MatchCardProps) {
  const isPass = match.is_verified;
  const isBorderline = match.is_locked;
  const title = [match.primary_color, match.brand, match.model, match.category]
    .filter(Boolean)
    .join(" ");

  return (
    <Card hoverable className="flex flex-col gap-3.5">
      {/* Header with Pseudonym & Clean Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {match.finder_display_name || "Community Member"}
          </span>
        </div>

        {isPass ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>🟢 Match verified · Private details verified</span>
          </div>
        ) : isBorderline ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>🟡 Possible item found · Staff review</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Candidate Match</span>
          </div>
        )}
      </div>

      {/* Candidate Description (NO numeric scores, NO trait counts, NO item photos after PASS) */}
      <div>
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white capitalize">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {match.public_description}
        </p>
      </div>

      {/* Status Explanatory Box */}
      {isPass ? (
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
          <div className="text-[11px] leading-relaxed">
            <b>Ownership verified:</b> Private verification details were verified blindly. Found item photographs and raw evidence remain sealed for security. Coordinate physical meetup via anonymous chat.
          </div>
        </div>
      ) : isBorderline ? (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="text-[11px] leading-relaxed">
            <b>Possible item found:</b> Staff will review this case. No immediate action required from your side.
          </div>
        </div>
      ) : (
        <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
          <div className="text-[11px] leading-relaxed">
            <b>4-Layer Zero-Clue Verification:</b> Submit your pre-registered private identifier or secret trait proof to authenticate ownership without quizzes or guessing.
          </div>
        </div>
      )}

      {/* Metadata Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{match.sub_city || "Addis Ababa"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(match.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="pt-1">
        {isFinderView ? (
          /* Finder Response Rule 11: The ONLY response action is "Accept & Continue". STRICTLY NO decline button. */
          <Button
            variant="primary"
            onClick={() => onFinderAccept?.(match.match_id)}
            className="w-full !min-h-[42px] text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Accept & Continue
          </Button>
        ) : isPass ? (
          <div className="flex gap-2">
            <Link href={`/messages?matchId=${match.match_id}`} className="flex-1">
              <Button variant="secondary" className="w-full !min-h-[40px] text-xs font-semibold">
                <MessageSquare className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Anonymous Chat
              </Button>
            </Link>
            <Link href={`/handover?matchId=${match.match_id}`} className="flex-1">
              <Button variant="primary" className="w-full !min-h-[40px] text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Handover Code
              </Button>
            </Link>
          </div>
        ) : isBorderline ? (
          <Button variant="secondary" disabled className="w-full !min-h-[40px] text-xs opacity-60">
            Under Staff Review
          </Button>
        ) : (
          <Link href={`/verify?matchId=${match.match_id}`} className="w-full">
            <Button variant="primary" className="w-full !min-h-[42px] text-xs font-bold">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Authenticate Private Ownership Proof
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

