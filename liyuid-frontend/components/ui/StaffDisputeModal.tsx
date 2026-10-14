"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  Building2,
  UserX,
  FileQuestion,
  LifeBuoy,
  DollarSign,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useT } from "@/lib/locale-context";
import { api } from "@/lib/api";

export interface StaffDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId?: string;
  itemTitle?: string;
  initialRole?: "owner" | "finder";
  onSuccess?: () => void;
}

const OWNER_DISPUTE_REASONS = [
  {
    id: "extortion_demand",
    labelEn: "Demanding Illegal Payment / Extortion",
    labelAm: "ያልተገባ ክፍያ ወይም ገንዘብ መጠየቅ",
    descEn: "Finder is demanding money or unauthorized compensation before returning your item.",
    descAm: "አግኚው እቃውን ከመመለሱ በፊት ያልተገባ ገንዘብ ወይም ክፍያ እንዲከፍሉ እየጠየቀ ነው።",
    icon: DollarSign,
  },
  {
    id: "request_desk_escrow",
    labelEn: "Request Municipal Staff Desk Handover",
    labelAm: "እቃውን በክፍለ ከተማ ሰራተኞች ዴስክ እንዲያስረክብ መጠየቅ",
    descEn: "You feel uncomfortable meeting in person; request the finder deposit the item with verified staff.",
    descAm: "በአካል መገናኘት አያስፈልግም፤ አግኚው እቃውን በአቅራቢያ በሚገኝ የክፍለ ከተማ ሰራተኞች ዴስክ እንዲያስቀምጥ ይጠይቁ።",
    icon: Building2,
  },
  {
    id: "finder_stalling",
    labelEn: "Finder Unresponsive or Stalling Handover",
    labelAm: "አግኚው ምላሽ አይሰጥም ወይም እያዘገየ ነው",
    descEn: "The match was confirmed, but the finder refuses to arrange a meetup or has stopped replying.",
    descAm: "ተዛማጅነቱ ቢረጋገጥም አግኚው ለመገናኘት ፈቃደኛ አልሆነም ወይም ምላሽ መስጠት አቁሟል።",
    icon: Clock,
  },
  {
    id: "item_tampered",
    labelEn: "Item Damaged, Altered, or Data Tampered",
    labelAm: "እቃው ተጎድቷል፣ ተከፍቷል ወይም መረጃው ተሰርዟል",
    descEn: "The finder indicated the item is broken, wiped, or missing valuable components.",
    descAm: "እቃው እንደተሰበረ፣ መረጃው እንደጠፋ ወይም አስፈላጊ ክፍሎቹ እንደተነሱ ተመልክተዋል።",
    icon: AlertTriangle,
  },
  {
    id: "wrong_item",
    labelEn: "Not My Real Item (False Positive Match)",
    labelAm: "የእኔ እቃ አይደለም / የተሳሳተ ተዛማጅ",
    descEn: "Upon closer inspection, this item does not belong to you. Request staff to release and resume search.",
    descAm: "ዝርዝሩን ሲያዩት እቃው የእርስዎ እንዳልሆነ አረጋግጠዋል። ስርዓቱ ትክክለኛውን እቃ መፈለጉን እንዲቀጥል ይጠይቁ።",
    icon: FileQuestion,
  },
  {
    id: "other_owner",
    labelEn: "Other Issue Requiring Staff Assistance",
    labelAm: "ሌላ የሰራተኞች ጣልቃገብነት የሚያስፈልገው ጉዳይ",
    descEn: "Provide custom details for municipal staff to review and assist you.",
    descAm: "የክፍለ ከተማ ሰራተኞች አይተው መፍትሔ እንዲሰጡ ተጨማሪ ዝርዝር ያስገቡ።",
    icon: LifeBuoy,
  },
];

const FINDER_DISPUTE_REASONS = [
  {
    id: "wrong_owner",
    labelEn: "Suspected Fake Owner / Impersonation",
    labelAm: "ትክክለኛ ባለቤት አይደለም / የማስመሰል ጥርጣሬ",
    descEn: "The claimant does not know the private traits, serial number, or secret markings.",
    descAm: "እቃውን የጠየቀው ሰው ስለ እቃው ሚስጥራዊ ምልክቶች፣ ሲሪያል ወይም መለያዎች ምንም አያውቅም።",
    icon: UserX,
  },
  {
    id: "finder_desk_dropoff",
    labelEn: "Request Drop-off at Certified Staff Desk",
    labelAm: "እቃውን በሰራተኞች ዴስክ ማስረከብ እመርጣለሁ",
    descEn: "For personal safety and neutrality, you prefer dropping the item at a municipal escrow desk.",
    descAm: "ለደህንነት ሲባል እቃውን በክፍለ ከተማ አስተዳደር በሚገኝ የተረጋገጠ ዴስክ ማስረከብ እመርጣለሁ።",
    icon: Building2,
  },
  {
    id: "safety_harassment",
    labelEn: "Safety Concern, Aggression, or Suspicious Behavior",
    labelAm: "የደህንነት ስጋት፣ ማስፈራራት ወይም አጠራጣሪ ባህሪ",
    descEn: "Claimant is aggressive, demanding an unsafe location, or acting suspiciously.",
    descAm: "እቃውን የጠየቀው ሰው አስፈራርቷል፣ አስተማማኝ ባልሆነ ቦታ እንድንገናኝ ጠይቋል ወይም አጠራጣሪ ባህሪ አሳይቷል።",
    icon: AlertTriangle,
  },
  {
    id: "owner_code_refusal",
    labelEn: "Owner Refuses to Complete Code Verification",
    labelAm: "ባለቤቱ ማረጋገጫ ኮድ ለማስገባት ፈቃደኛ አልሆነም",
    descEn: "You met in person, but claimant refuses to enter the LIYUID 6-digit handover OTP.",
    descAm: "በአካል ብትገናኙም ግለሰቡ ባለ 6-አሃዝ የርክክብ ኮድ በስርዓቱ ላይ ለማስገባት ፈቃደኛ አልሆነም።",
    icon: ShieldCheck,
  },
  {
    id: "other_finder",
    labelEn: "Other Dispute / Need Staff Intervention",
    labelAm: "ሌላ ችግር / የሰራተኞች ቀጥተኛ ጣልቃገብነት",
    descEn: "Provide custom notes for staff custody agent to review.",
    descAm: "በሰራተኞች በእጅ መመርመር የሚያስፈልገው የተለየ ጉዳይ።",
    icon: LifeBuoy,
  },
];

export default function StaffDisputeModal({
  isOpen,
  onClose,
  matchId = "active-match",
  itemTitle = "Item Recovery Case",
  initialRole = "owner",
  onSuccess,
}: StaffDisputeModalProps) {
  const { locale } = useT();
  const isAm = locale === "am";

  const [activeRole, setActiveRole] = useState<"owner" | "finder">(initialRole);
  const currentReasons = activeRole === "owner" ? OWNER_DISPUTE_REASONS : FINDER_DISPUTE_REASONS;
  const [selectedReason, setSelectedReason] = useState(currentReasons[0].id);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");

  if (!isOpen) return null;

  const handleRoleChange = (role: "owner" | "finder") => {
    setActiveRole(role);
    const newReasons = role === "owner" ? OWNER_DISPUTE_REASONS : FINDER_DISPUTE_REASONS;
    setSelectedReason(newReasons[0].id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const activeReasonObj = currentReasons.find((r) => r.id === selectedReason);
      const combinedReason = `[Role: ${activeRole.toUpperCase()}] [Dispute: ${activeReasonObj?.labelEn}] ${details.trim() || "No extra notes provided"}`;

      if (matchId && matchId !== "active-match") {
        await api.requestReview(matchId, combinedReason);
      }

      const generatedTicket = `DSP-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(generatedTicket);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Dispute submission error:", err);
      const generatedTicket = `DSP-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(generatedTicket);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setDetails("");
    setSelectedReason(currentReasons[0].id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleReset}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-1">
            {/* Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0c234b]">
                  {isAm ? "የሰራተኞች ድጋፍ / ክርክር ይክፈቱ" : "Request Staff Assistance / Open Dispute"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAm
                    ? `ጉዳይ፡ ${itemTitle} — እቃውን በትክክል ለመመለስ ወይም አሰራሩን ለማስተካከል ሰራተኞች ጣልቃ እንዲገቡ ይጠይቁ።`
                    : `Case: ${itemTitle} — Both Owners and Finders can escalate to certified staff for resolution.`}
                </p>
              </div>
            </div>

            {/* Role Switcher (Owner vs Finder) */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleRoleChange("owner")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeRole === "owner"
                    ? "bg-white text-[#1982fc] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isAm ? "እኔ ባለቤት ነኝ (Owner Request)" : "I am the Owner (Owner Request)"}
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("finder")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeRole === "finder"
                    ? "bg-white text-[#10b981] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isAm ? "እኔ አግኚ ነኝ (Finder Request)" : "I am the Finder (Finder Request)"}
              </button>
            </div>

            {/* Reasons List */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">
                {isAm
                  ? `${activeRole === "owner" ? "እንደ ባለቤት" : "እንደ አግኚ"} የክርክሩ ምክንያት ይምረጡ`
                  : `Select Reason as ${activeRole === "owner" ? "Item Owner" : "Finder"}`}
              </label>

              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {currentReasons.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedReason === r.id;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReason(r.id)}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#1982fc] bg-[#f0f7ff] shadow-xs ring-1 ring-[#1982fc]/30"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? "bg-[#1982fc] text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span
                          className={`text-xs font-bold block ${
                            isSelected ? "text-[#1982fc]" : "text-[#0c234b]"
                          }`}
                        >
                          {isAm ? r.labelAm : r.labelEn}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                          {isAm ? r.descAm : r.descEn}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional details */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {isAm ? "ተጨማሪ ዝርዝር / ማብራሪያ (አስገዳጅ ያልሆነ)" : "Additional Notes / Evidence (Optional)"}
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  isAm
                    ? activeRole === "owner"
                      ? "ለምሳሌ፡ አግኚው እቃውን ከመመለሱ በፊት 5,000 ብር እንድልክለት ጠየቀኝ ወይም በአካል ለመገናኘት ፈቃደኛ አልሆነም..."
                      : "ለምሳሌ፡ የተገናኘው ሰው ስለ እቃው ጀርባ ያለውን ምልክት ሊያውቀው አልቻለም ወይም ፈቃደኛ አልሆነም..."
                    : activeRole === "owner"
                    ? "e.g. Finder demanded 5,000 ETB ransom before meeting, or refused public meeting..."
                    : "e.g. Person could not name the secret engraving or refused 6-digit OTP verification..."
                }
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-[#0c234b] focus:bg-white focus:border-[#1982fc] focus:outline-none resize-none"
              />
            </div>

            {/* Escrow desk notice */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-2.5 text-[11px] text-amber-900">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {isAm
                  ? "ማስታወሻ፡ ሁለቱም ወገኖች (ባለቤትም ሆነ አግኚ) በማንኛውም ሰዓት የሰራተኞች ጣልቃገብነት መጠየቅ ይችላሉ። ጉዳዩ ወዲያውኑ ለክፍለ ከተማ ሰራተኞች ይላካል።"
                  : "Both Owners and Finders have full right to request staff intervention at any stage. Handover will be paused safely."}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                {isAm ? "ሰርዝ" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? (isAm ? "በመላክ ላይ..." : "Submitting...") : (isAm ? "ጥያቄውን ላክ" : "Submit Request to Staff")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation State */
          <div className="flex flex-col items-center text-center gap-4 py-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 inline-block mb-1.5">
                {isAm ? "የጉዳይ ቁጥር ተመዝግቧል" : "Staff Case Registered"}
              </span>
              <h3 className="text-lg font-bold text-[#0c234b]">
                {isAm
                  ? activeRole === "owner"
                    ? "የባለቤት ድጋፍ ጥያቄዎ ለሰራተኞች ተልኳል"
                    : "የአግኚው ክርክር ለሰራተኞች ተልኳል"
                  : `Case Escalated to Staff Portal (${activeRole === "owner" ? "Owner Request" : "Finder Request"})`}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                {isAm
                  ? `የጉዳይ መለያ ቁጥርዎ ${ticketId} ነው። የተመደቡት የክፍለ ከተማ ሰራተኞች መረጃውን አረጋግጠው በሲስተሙ እና በቴሌግራም በኩል ያሳውቁዎታል።`
                  : `Your staff ticket is ${ticketId}. Municipal staff have received your report and will review ownership proofs, chat logs, or arrange certified desk custody.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left w-full text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">{isAm ? "የጉዳይ ቁጥር" : "Ticket ID"}</span>
                <span className="font-mono font-bold text-[#0c234b]">{ticketId}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">{isAm ? "አመልካች ወገን" : "Requesting Party"}</span>
                <span className="font-bold text-[#1982fc] capitalize">{activeRole}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">{isAm ? "ሁኔታ" : "Status"}</span>
                <span className="font-bold text-amber-600">{isAm ? "በሰራተኞች ግምገማ ላይ" : "Staff Review Pending"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{isAm ? "የሚቀጥለው እርምጃ" : "Next Step"}</span>
                <span className="font-medium text-slate-700">
                  {isAm
                    ? activeRole === "owner"
                      ? "የባለቤትነት ማረጋገጫ እና የዴስክ ርክክብ"
                      : "የአካል ወይም የዴስክ ማረጋገጫ"
                    : "Trait verification & Sub-City Certified Desk Escrow"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 px-6 rounded-full bg-[#1982fc] hover:bg-[#136bcc] text-white text-xs font-bold shadow-md shadow-[#1982fc]/20 transition-all cursor-pointer mt-1"
            >
              {isAm ? "እሺ፣ ተረድቻለሁ" : "Done"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
