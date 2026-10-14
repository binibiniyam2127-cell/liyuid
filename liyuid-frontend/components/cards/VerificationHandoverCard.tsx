"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  AlertTriangle,
  MapPin,
  QrCode,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  HelpCircle,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { RegistryItem } from "@/lib/hooks/useDataFlow";

interface VerificationHandoverCardProps {
  item?: RegistryItem;
  isLoading?: boolean;
  onVerify?: (id: string) => Promise<void>;
  onFlag?: (id: string, reason: string) => Promise<void>;
  onCompleteHandover?: (id: string, code: string) => Promise<boolean>;
}

const SPRING_PHYSICS = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

export function VerificationHandoverCard({
  item,
  isLoading = false,
  onVerify,
  onFlag,
  onCompleteHandover,
}: VerificationHandoverCardProps) {
  const [activeTab, setActiveTab] = useState<"inspection" | "handover" | "audit">("inspection");
  const [handoverCode, setHandoverCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");

  // Physical inspection checklist state
  const [checklist, setChecklist] = useState({
    externalMatches: false,
    hardwareIntact: false,
    distinguishingMarksVerified: false,
  });

  // Zero / Skeleton loading state
  if (isLoading) {
    return (
      <div className="w-full bg-surface-1 border border-surface-border rounded-xl p-5 shadow-subtle animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
          <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        </div>
        <div className="h-16 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
        <div className="flex space-x-2 pt-2">
          <div className="h-9 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
      </div>
    );
  }

  // Zero / Empty State
  if (!item) {
    return (
      <div className="w-full bg-surface-1 border border-surface-border rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-fg">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-subhead font-semibold text-ink">No Verification Item Selected</p>
          <p className="text-caption text-muted-fg max-w-xs">
            Select an active match or report from the Addis Ababa registry to initiate the handover protocol.
          </p>
        </div>
      </div>
    );
  }

  const allChecksPassed =
    checklist.externalMatches &&
    checklist.hardwareIntact &&
    checklist.distinguishingMarksVerified;

  const handleVerifySubmit = async () => {
    if (!allChecksPassed) {
      toast.error("Complete physical check", {
        description: "Please confirm all 3 physical verification points before sealing.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (onVerify) {
        await onVerify(item.id);
      } else {
        toast.success("Verification sealed");
      }
      setActiveTab("handover");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHandoverSubmit = async () => {
    if (handoverCode.length < 4) {
      toast.error("Invalid Code", {
        description: "Please enter the complete 6-digit handover code.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (onCompleteHandover) {
        const success = await onCompleteHandover(item.id, handoverCode);
        if (success) {
          setHandoverCode("");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlagSubmit = async () => {
    if (!flagReason) {
      toast.error("Please provide a reason for the flag");
      return;
    }
    if (onFlag) {
      await onFlag(item.id, flagReason);
    }
    setIsFlagModalOpen(false);
    setFlagReason("");
  };

  // Status configuration
  const statusConfig = {
    matched: {
      label: "PASS Verified",
      color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
      dot: "bg-emerald-500",
    },
    handover_scheduled: {
      label: "Handover Ready",
      color: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
      dot: "bg-blue-500",
    },
    borderline: {
      label: "Staff Review",
      color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
      dot: "bg-amber-500",
    },
    completed: {
      label: "Closed & Archived",
      color: "text-zinc-700 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
      dot: "bg-zinc-400",
    },
    flagged: {
      label: "Discrepancy Flag",
      color: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40",
      dot: "bg-rose-500",
    },
    unmatched: {
      label: "Sealed / Unmatched",
      color: "text-zinc-600 bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800",
      dot: "bg-zinc-400",
    },
  }[item.status];

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={SPRING_PHYSICS}
      className="w-full bg-surface-1 border border-surface-border rounded-xl shadow-subtle hover:shadow-elevation transition-shadow duration-200 overflow-hidden"
    >
      {/* Top Banner & Header */}
      <div className="p-5 pb-4 border-b border-surface-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Object Image or Fallback */}
            <div className="relative w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-surface-border flex-shrink-0 overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <QrCode className="w-6 h-6 text-muted-fg" />
              )}
            </div>

            {/* Title & Metadata */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-caption text-primary font-semibold tracking-wider tnum">
                  {item.code}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-caption text-muted-fg">{item.relativeTime}</span>
              </div>
              <h3 className="text-subhead font-semibold text-ink truncate mt-0.5" title={item.title}>
                {item.title}
              </h3>
              <div className="flex items-center gap-1.5 text-caption text-muted-fg mt-1">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{item.subCity}, {item.specificLocation}</span>
              </div>
            </div>
          </div>

          {/* Status Badge with Micro Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium border flex-shrink-0 ${statusConfig.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} animate-pulse`} />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* SRS Blind Two-Sided Cryptographic Pill */}
        <div className="mt-3.5 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-surface-border flex items-center justify-between text-caption">
          <div className="flex items-center gap-2 text-ink">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">Blind Matching Cryptographic Hash:</span>
            <span className="font-mono text-muted-fg tnum text-[11px] truncate max-w-[140px] sm:max-w-none">
              {item.securityMetadata.anonymizedHash}
            </span>
          </div>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {item.securityMetadata.sealedDetailCount} Sealed Details
          </span>
        </div>
      </div>

      {/* Segmented Layout Controls with shared layoutId */}
      <div className="px-5 pt-3 border-b border-surface-border bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex space-x-1" role="tablist">
          {[
            { id: "inspection", label: "Physical Check", icon: ShieldCheck },
            { id: "handover", label: "Handover Pin", icon: KeyRound },
            { id: "audit", label: "Audit Log", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative px-3 py-2 text-caption font-medium flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-lg ${
                  isActive ? "text-primary" : "text-muted-fg hover:text-ink"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={SPRING_PHYSICS}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tab Body with AnimatePresence */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {activeTab === "inspection" && (
            <motion.div
              key="inspection"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30 rounded-xl p-3.5 text-caption text-blue-900 dark:text-blue-200">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  SRS v3.5 Mandatory Physical Handover Verification
                </div>
                Before custody is released, verify the 3 independent aspects recorded in the private seal:
              </div>

              {/* Physical Checklist */}
              <div className="space-y-2">
                {[
                  {
                    key: "externalMatches" as const,
                    label: "Form factor, bezel etching, & physical hardware condition match description",
                  },
                  {
                    key: "hardwareIntact" as const,
                    label: "Unique distinguishing serial number or custom engraving confirmed",
                  },
                  {
                    key: "distinguishingMarksVerified" as const,
                    label: "Internal compartment content or locked-screen wallpaper verified",
                  },
                ].map((itemCheck) => (
                  <label
                    key={itemCheck.key}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checklist[itemCheck.key]
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-ink"
                        : "bg-surface-1 border-surface-border text-muted-fg hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checklist[itemCheck.key]}
                      onChange={(e) =>
                        setChecklist({ ...checklist, [itemCheck.key]: e.target.checked })
                      }
                      className="mt-0.5 rounded border-zinc-300 text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-body-sm leading-snug">{itemCheck.label}</span>
                  </label>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsFlagModalOpen(true)}
                  className="px-3.5 py-2 text-caption font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Report Discrepancy
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={!allChecksPassed || isSubmitting || item.status === "completed"}
                  onClick={handleVerifySubmit}
                  className={`px-4 py-2 text-body-sm font-semibold rounded-lg flex items-center gap-2 transition-all shadow-subtle ${
                    allChecksPassed && item.status !== "completed"
                      ? "bg-primary text-primary-fg hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary"
                      : "bg-zinc-200 dark:bg-zinc-800 text-muted-fg cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sealing...
                    </span>
                  ) : item.physicalCheck.status === "passed" ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Passed & Sealed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Confirm Verification <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === "handover" && (
            <motion.div
              key="handover"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="bg-surface-2 border border-surface-border rounded-xl p-4 text-center space-y-2">
                <KeyRound className="w-6 h-6 text-primary mx-auto" />
                <h4 className="text-subhead font-semibold text-ink">Two-Party Handover Release</h4>
                <p className="text-caption text-muted-fg max-w-sm mx-auto">
                  Owner and finder must exchange their single-use 6-character release code in person at the campus handover desk.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-caption font-medium text-ink">Enter 6-Digit Handover Code</label>
                <div className="relative">
                  <input
                    type={showCode ? "text" : "password"}
                    maxLength={6}
                    value={handoverCode}
                    onChange={(e) => setHandoverCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 7K9-B2"
                    className="w-full font-mono text-center tracking-[0.3em] uppercase text-card-title py-3 px-4 rounded-xl border border-surface-border bg-surface-1 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary tnum"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-fg hover:text-ink"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={handoverCode.length < 4 || isSubmitting || item.status === "completed"}
                onClick={handleHandoverSubmit}
                className={`w-full py-2.5 text-body-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-subtle ${
                  handoverCode.length >= 4 && item.status !== "completed"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    : "bg-zinc-200 dark:bg-zinc-800 text-muted-fg cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Validating Transfer...
                  </span>
                ) : item.status === "completed" ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Handover Already Completed
                  </span>
                ) : (
                  <span>Validate Code & Release Item</span>
                )}
              </motion.button>
            </motion.div>
          )}

          {activeTab === "audit" && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="space-y-2 text-caption">
                <div className="flex justify-between py-1.5 border-b border-surface-border">
                  <span className="text-muted-fg">Registry Item ID</span>
                  <span className="font-mono text-ink font-semibold">{item.code}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-border">
                  <span className="text-muted-fg">Reporter Identity</span>
                  <span className="font-mono text-ink">{item.reporter.anonymousId}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-border">
                  <span className="text-muted-fg">Finder Response Gate</span>
                  <span className="capitalize font-medium text-emerald-600 dark:text-emerald-400">
                    {item.finderResponse}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-border">
                  <span className="text-muted-fg">Staff Supervision</span>
                  <span className="font-medium text-ink">
                    {item.securityMetadata.isStaffSupervised ? "Supervised Protocol" : "Autonomous Match"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-fg">Cryptographic Proof</span>
                  <span className="font-mono text-primary truncate max-w-[200px]">
                    {item.securityMetadata.anonymizedHash}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Discrepancy Modal with AnimatePresence */}
      <AnimatePresence>
        {isFlagModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={SPRING_PHYSICS}
              className="w-full max-w-md bg-surface-1 border border-surface-border rounded-2xl p-6 shadow-elevation space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600 font-semibold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Report Physical Discrepancy</span>
                </div>
                <button
                  onClick={() => setIsFlagModalOpen(false)}
                  className="text-muted-fg hover:text-ink rounded-lg p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-caption text-muted-fg">
                Explain the difference between the claimant's claims and the physical item. This will alert staff moderators immediately.
              </p>

              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="e.g. Claimant stated device is black 128GB, but physical device is 256GB purple..."
                rows={3}
                className="w-full text-body-sm p-3 rounded-xl border border-surface-border bg-surface-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              />

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFlagModalOpen(false)}
                  className="px-4 py-2 text-caption font-medium text-muted-fg hover:text-ink"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFlagSubmit}
                  className="px-4 py-2 text-caption font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-subtle"
                >
                  Submit Discrepancy Escalation
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
