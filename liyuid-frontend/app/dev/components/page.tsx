"use client";

import React, { useState } from "react";
import { Home, FileText, Search, ShieldCheck, CheckSquare, Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { RedactionBar } from "@/components/ui/RedactionBar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SignalBar } from "@/components/ui/SignalBar";
import { StepTracker } from "@/components/ui/StepTracker";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { OptionButton } from "@/components/ui/OptionButton";
import { CodeDisplay } from "@/components/ui/CodeDisplay";
import { Dots } from "@/components/ui/Dots";
import { Toast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { TabBar } from "@/components/ui/TabBar";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useT } from "@/lib/locale-context";

export default function ComponentShowcasePage() {
  const { t } = useT();
  const [selectedOption, setSelectedOption] = useState<number | null>(0);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [attemptsUsed, setAttemptsUsed] = useState(1);

  const steps = ["Report", "Match", "Verify", "Chat", "Handover", "Closed"];

  const tabs = [
    { href: "/dev/components#home", label: t("nav.home"), icon: Home },
    { href: "/dev/components#report", label: t("nav.report"), icon: FileText },
    { href: "/dev/components#matches", label: t("nav.matches"), icon: Search },
    { href: "/dev/components#verify", label: t("nav.verify"), icon: ShieldCheck },
    { href: "/dev/components#handover", label: t("nav.handover"), icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink flex justify-center p-3 pb-24">
      <main className="w-full max-w-[390px] flex flex-col gap-6">
        {/* Header with Switchers */}
        <header className="flex items-center justify-between p-3.5 bg-head text-card rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-gold text-head rounded-lg font-bold flex items-center justify-center">
              L
            </span>
            <h1 className="text-base font-bold m-0">{t("dev.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </header>

        {/* Buttons and Badges */}
        <section className="bg-card p-4 rounded-2xl border border-line flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">{t("dev.buttons")}</h2>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="primary" loading>
            Loading Button
          </Button>

          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge variant="ok">Verified</StatusBadge>
            <StatusBadge variant="pending">In Progress</StatusBadge>
            <StatusBadge variant="locked">Claim Locked</StatusBadge>
            <StatusBadge variant="private">Private Data</StatusBadge>
          </div>
        </section>

        {/* Form Fields & Redaction */}
        <section className="bg-card p-4 rounded-2xl border border-line flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">{t("dev.fields")}</h2>
          <Field
            label="Standard Input"
            placeholder={t("dev.samplePlaceholder")}
            hint={t("dev.sampleHint")}
            autoComplete="off"
          />
          <Field
            label="Error Input"
            defaultValue="invalid_input"
            error={t("dev.sampleError")}
            autoComplete="off"
          />
          <div className="flex items-center justify-between text-sm py-2 border-t border-line">
            <span>Hidden Phone/Secret:</span>
            <RedactionBar width={110} label="Phone masked" />
          </div>
        </section>

        {/* Scores, Bars, and Steps */}
        <section className="bg-card p-4 rounded-2xl border border-line flex flex-col gap-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">{t("dev.indicators")}</h2>
          <div className="flex justify-around items-center">
            <ScoreRing value={82} label="Composite" />
            <ScoreRing value={45} label="Weak" />
          </div>

          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <SignalBar label="Semantic" value={88} />
            <SignalBar label="Attributes" value={100} />
            <SignalBar label="Distance" value={90} />
          </div>

          <div className="border-t border-line pt-3">
            <StepTracker steps={steps} currentIndex={2} />
          </div>
        </section>

        {/* Chat, Dots & Code Display */}
        <section className="bg-card p-4 rounded-2xl border border-line flex flex-col gap-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">{t("dev.chatAndCode")}</h2>

          <div className="flex justify-between items-center">
            <span className="text-xs text-mute font-medium">Attempts remaining:</span>
            <Dots total={3} used={attemptsUsed} />
          </div>

          <div className="flex flex-col gap-2 bg-bg p-3 rounded-xl">
            <ChatBubble from="system">Ownership verification initiated</ChatBubble>
            <ChatBubble from="them" author="LIYUID">
              Which hidden detail is on the item?
            </ChatBubble>
            <ChatBubble from="me" author="You (Blue Kite)">
              Lion sticker on back
            </ChatBubble>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <OptionButton
              selected={selectedOption === 0}
              onClick={() => setSelectedOption(0)}
            >
              Lion sticker on back
            </OptionButton>
            <OptionButton
              selected={selectedOption === 1}
              onClick={() => setSelectedOption(1)}
            >
              Cracked screen
            </OptionButton>
          </div>

          <CodeDisplay
            code="482 913"
            secondsLeft={secondsLeft}
            onRegenerate={() => setSecondsLeft(600)}
            labels={{
              expiresIn: t("dev.expiresIn"),
              expiredLabel: t("dev.expiredLabel"),
              regenerate: t("dev.regenerate"),
            }}
          />
        </section>

        {/* Skeleton, Empty State, and Toast */}
        <section className="flex flex-col gap-3">
          <Toast type="success" message="Verification successful. Finder notified." />
          <Toast type="error" message="Claim locked after 3 wrong answers." />
          <EmptyState
            icon={Inbox}
            title="No matches found yet"
            text="We will notify you on Telegram and email when a candidate report is filed."
          />
          <div className="bg-card p-4 rounded-2xl border border-line flex flex-col gap-2">
            <Skeleton height={20} width="60%" />
            <Skeleton height={14} width="90%" />
            <Skeleton height={40} className="w-full mt-2" />
          </div>
        </section>
      </main>

      <TabBar items={tabs} />
    </div>
  );
}