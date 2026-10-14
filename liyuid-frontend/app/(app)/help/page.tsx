"use client";

import React from "react";
import Link from "next/link";
import {
  HelpCircle,
  ShieldCheck,
  MapPin,
  Lock,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/locale-context";

export default function HelpPage() {
  const { t } = useT();

  const faqs = [
    {
      q: "Why can't I search for found items like in social media groups?",
      a: "Public catalogs allow unscrupulous actors to memorize item features and claim items that do not belong to them. LIYUID protects you by running blind AI matching in the background and requiring claimants to prove secret ground truths.",
    },
    {
      q: "Where should I meet the other person for handover?",
      a: "Always meet in a well-lit, busy public location in Addis Ababa during daylight hours. Recommended meeting spots include: Federal or Sub-City Police Stations, University Main Gates, Addis Ababa Light Rail stations, or major shopping malls.",
    },
    {
      q: "What is the single-use 6-digit handover code?",
      a: "When ownership verification succeeds, a unique 6-digit code is generated. When meeting in person, the owner shows this code to the finder. The finder enters the code into the app. When both confirm, the case is safely closed.",
    },
    {
      q: "What happens if someone enters the wrong secret proof repeatedly?",
      a: "If 3 incorrect attempts are made, the match is locked by our security system. The claimant can request a manual review with our staff team to prevent brute-forcing.",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-card border border-line rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand" />
          <h1 className="text-base font-bold text-ink">Help & Safety Guide</h1>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="bg-card border border-line rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-gold">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-sm font-bold text-ink">Safety Guidelines for In-Person Meetup</h2>
        </div>

        <ul className="flex flex-col gap-2 text-xs text-mute list-disc pl-4 leading-relaxed">
          <li>Never agree to meet in isolated, secluded, or private residences.</li>
          <li>Do not share your personal phone number, Telegram handle, or home address in the chat.</li>
          <li>Physically verify the item's condition and serial details before entering the handover code.</li>
          <li>Bring a friend or family member along if meeting someone for high-value electronics.</li>
        </ul>
      </div>

      {/* FAQs */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink px-1">
          Frequently Asked Questions
        </h3>

        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-card border border-line rounded-2xl p-4 flex flex-col gap-1.5 shadow-xs"
          >
            <h4 className="text-xs font-bold text-ink leading-snug">{faq.q}</h4>
            <p className="text-xs text-mute leading-relaxed mt-0.5">{faq.a}</p>
          </div>
        ))}
      </div>

      {/* Support Box */}
      <div className="bg-bg border border-line rounded-2xl p-4 text-center flex flex-col items-center gap-2">
        <p className="text-xs text-mute">Need assistance with a locked claim or security dispute?</p>
        <Link href="/report">
          <Button variant="primary" className="!w-auto px-4 !min-h-[38px] text-xs">
            Submit a New Report
          </Button>
        </Link>
      </div>
    </div>
  );
}
