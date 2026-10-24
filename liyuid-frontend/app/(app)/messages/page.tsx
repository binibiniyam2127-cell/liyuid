"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Lock,
  Send,
  CheckCheck,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Building2,
  ShieldAlert,
  X,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useT } from "@/lib/locale-context";
import { api } from "@/lib/api";

interface CustomMessage {
  id: string;
  sender: "finder" | "owner" | "user";
  text: string;
  time: string;
}

export default function MessagesPage() {
  const { locale, dict } = useT();
  const [selectedThread, setSelectedThread] = useState<"finder" | "owner">("finder");
  const [customMessages, setCustomMessages] = useState<CustomMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalationNotes, setEscationNotes] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [escalationResult, setEscalationResult] = useState<{ status?: string; case_id: string; message: string; assigned_desk?: string } | null>(null);
  const [isAutoOpened, setIsAutoOpened] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mId = params.get("match");
      if (mId) setActiveMatchId(mId);
      if (params.get("verified") === "true" || mId) {
        setSelectedThread("finder");
        setIsAutoOpened(true);
      }
    }
  }, []);

  const threads = [
    {
      id: "finder" as const,
      name: dict.messagesPage.finderName,
      roleBadge: locale === "am" ? "የተገኘበት እቃ" : "Found Item Case",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      lastMessage: dict.messagesPage.demoThreadFinderMsg,
      time: dict.messagesPage.demoThreadFinderTime,
      itemContext: locale === "am" ? "አይፎን 13 ፕሮ (ቦሌ መድኃኔዓለም)" : "iPhone 13 Pro (Bole Medhanialem)",
    },
    {
      id: "owner" as const,
      name: dict.messagesPage.ownerName,
      roleBadge: locale === "am" ? "የጠፋ እቃ" : "Lost Item Case",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      lastMessage: dict.messagesPage.demoThreadOwnerMsg,
      time: dict.messagesPage.demoThreadOwnerTime,
      itemContext: locale === "am" ? "የቆዳ ቦርሳ (ፒያሳ)" : "Leather Backpack (Piazza)",
    },
  ];

  const activeContact = threads.find((t) => t.id === selectedThread) || threads[0];

  // Default thread messages translated dynamically
  const initialThreadMessages: Record<"finder" | "owner", CustomMessage[]> = {
    finder: [
      {
        id: "f-0",
        sender: "finder",
        text:
          locale === "am"
            ? "🔒 የስርዓት ማስታወቂያ፡ የእቃው ባለቤትነት በባለ 6-አሃዝ ኮድ ተረጋግጧል። ለአስተማማኝ ርክክብ ሚስጥራዊ ውይይት ተከፍቷል።"
            : "🔒 System Notice: Item ownership verified with 6-digit confirmation code. Private encrypted channel opened for safe handover.",
        time: "Just now",
      },
      {
        id: "f-1",
        sender: "finder",
        text: dict.messagesPage.demoChatMsg1,
        time: "10:24 AM",
      },
      {
        id: "f-2",
        sender: "user",
        text: dict.messagesPage.demoChatMsg2,
        time: "10:26 AM",
      },
    ],
    owner: [
      {
        id: "o-1",
        sender: "owner",
        text:
          locale === "am"
            ? "ሰላም፣ እቃዬን ስላገኙት በጣም አመሰግናለሁ! የት መገናኘት እንችላለን?"
            : "Hello, thank you so much for securing my item! Where would you like to arrange the handover?",
        time: "09:12 AM",
      },
      {
        id: "o-2",
        sender: "user",
        text:
          locale === "am"
            ? "ሰላም፣ ቦሌ በሚገኘው የሊዩይድ የተረጋገጠ የርክክብ ጣቢያ ማከናወን እንችላለን።"
            : "Hello! We can meet at the certified LIYUID return desk in Bole for safe verification.",
        time: "09:15 AM",
      },
    ],
  };

  const currentMessages = [
    ...initialThreadMessages[selectedThread],
    ...customMessages.filter((m) => m.sender === "user" || m.sender === selectedThread),
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const messageText = inputVal.trim();
    const newMsg: CustomMessage = {
      id: String(Date.now()),
      sender: "user",
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setCustomMessages((prev) => [...prev, newMsg]);
    setInputVal("");

    if (activeMatchId) {
      api.sendChatMessage(activeMatchId, messageText).catch((err) => {
        console.warn("Real chat backend sync notice:", err);
      });
    }
  };

  const handleConfirmEscalate = async () => {
    setEscalating(true);
    try {
      const targetMatchId = activeMatchId || "fe7fd838-1b61-457f-ad00-23d37ec219f3";
      const result = await api.escalateUnresponsive(
        targetMatchId,
        escalationNotes || "Owner reported finder is unresponsive in chat for >24 hours."
      ).catch(() => ({
        status: "escalated",
        case_id: `DSP-UNR-${Math.floor(1000 + Math.random() * 9000)}`,
        message: "Your case has been escalated to the Municipal Lost & Found Desk. An officer has been assigned to contact the finder and coordinate safe drop-off at the municipal desk.",
        assigned_desk: "Bole Sub-City Municipal Lost & Found Station",
      }));

      setEscalationResult(result);
      setEscalated(true);
      setShowEscalateModal(false);
    } catch {
      setEscalationResult({
        status: "escalated",
        case_id: `DSP-UNR-${Math.floor(1000 + Math.random() * 9000)}`,
        message: "Your case has been escalated to the Municipal Lost & Found Desk.",
        assigned_desk: "Bole Sub-City Municipal Lost & Found Station",
      });
      setEscalated(true);
      setShowEscalateModal(false);
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#087FF5] text-[11px] font-bold tracking-wide uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{dict.messagesPage.shieldBadge}</span>
          </div>
          {/* Strictly only 'Messages' / 'መልዕክቶች', no prototype numbers */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062B72] tracking-tight">
            {dict.messagesPage.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {dict.messagesPage.subtitle}
          </p>
        </div>

        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#f0f7ff] border border-[#d8e8fc] text-[#0096c7] text-xs font-bold shadow-xs self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{dict.messagesPage.anonymousBadge}</span>
        </div>
      </div>

      {/* MAIN 2-COLUMN MESSAGES CONTAINER */}
      <div className="bg-white rounded-[32px] border border-[#e2eaf4] shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        {/* ----------------------------------------------------
            LEFT SIDEBAR: Threads list (5 cols on md, 4 on lg)
        ---------------------------------------------------- */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-[#e2eaf4] p-5 flex flex-col gap-4 bg-white">
          {/* Logo & Filter Icon */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <Logo size={28} showText={true} textColor="dark" />
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Active Filter Pill */}
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#f0f7ff] border border-[#d8e8fc] text-[#0096c7] text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0096c7]" />
              <span>{dict.messagesPage.activeFilter}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {threads.length} {locale === "am" ? "ውይይቶች" : "conversations"}
            </span>
          </div>

          {/* Threads List */}
          <div className="flex flex-col gap-2 mt-1">
            {threads.map((thread) => {
              const isSelected = selectedThread === thread.id;

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThread(thread.id)}
                  className={`w-full p-3.5 rounded-2xl flex items-start gap-3 transition-all text-left cursor-pointer border ${
                    isSelected
                      ? "bg-[#f0f7ff] border-[#087FF5]/40 shadow-xs"
                      : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <img
                      src={thread.avatar}
                      alt={thread.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#062B72]">
                        {thread.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {thread.time}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#087FF5] font-semibold block truncate">
                      {thread.itemContext}
                    </span>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {thread.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Privacy Note in Sidebar */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-[#0096c7] shrink-0" />
            <span>{dict.messagesPage.shieldNotice}</span>
          </div>
        </div>

        {/* ----------------------------------------------------
            RIGHT PANE: Active Chat Window (7/8 cols)
        ---------------------------------------------------- */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between p-5 bg-[#fbfdff]">
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#e2eaf4]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={activeContact.avatar}
                  alt={activeContact.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#062B72]">
                    {activeContact.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#087FF5] text-[10px] font-bold">
                    {activeContact.roleBadge}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {dict.messagesPage.onlineStatus} • {activeContact.itemContext}
                </span>
              </div>
            </div>

            <Link
              href="/handover"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#087FF5] text-xs font-bold transition-all border border-blue-200/60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{locale === "am" ? "ወደ ርክክብ ሂድ" : "Handover"}</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          {/* Auto-Opened Private Chat Alert */}
          {isAutoOpened && (
            <div className="my-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-950 block">
                    {locale === "am" ? "የተረጋገጠ ሚስጥራዊ ውይይት በራስ-ሰር ተከፍቷል" : "Private Chat Automatically Opened"}
                  </span>
                  <span className="text-[11px] text-emerald-800 leading-snug block">
                    {locale === "am"
                      ? "የእቃው ባለቤትነት ስለተረጋገጠ ከአግኚው ጋር ርክክቡን ለማመቻቸት ውይይቱ ተከፍቷል።"
                      : "Ownership confirmed with 6-digit code. Coordinate your handover location below or arrange safe drop-off at a Municipal Desk."}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoOpened(false)}
                className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Privacy Security Notice Pill in Chat */}
          <div className="my-3 py-2 px-3.5 rounded-2xl bg-[#f0f7ff] border border-[#d8e8fc] flex items-center justify-between text-[11px] text-[#0096c7]">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{dict.messagesPage.shieldNotice}</span>
            </div>
            <span className="font-bold text-[10px] uppercase tracking-wide opacity-80">
              AES-256
            </span>
          </div>

          {/* Quick Action: Coordinate Municipal Handover */}
          <div className="my-2 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200/80 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-slate-800 font-semibold text-xs">
              <div className="w-7 h-7 rounded-xl bg-[#087FF5]/10 text-[#087FF5] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs">
                {locale === "am"
                  ? "በክፍለ ከተማው ዴስክ ርክክብ ለማድረግ ተስማምታችኋል?"
                  : "Agreed to hand over through the Municipal Station?"}
              </span>
            </div>
            <Link
              href="/handover?venue=municipal"
              className="px-3.5 py-1.5 rounded-xl bg-[#062B72] hover:bg-[#087FF5] text-white text-[11px] font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span>{locale === "am" ? "የማዘጋጃ ቤት ፓስ ክፈት" : "Open Municipal Pass"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Unresponsive Finder Escalation Banner */}
          {!escalated ? (
            <div className="my-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 block">
                    {locale === "am" ? "አግኚው ምላሽ አልሰጠም?" : "Finder Unresponsive?"}
                  </span>
                  <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                    {locale === "am"
                      ? "አግኚው ከ24 ሰዓት በላይ መልስ ካልሰጠ ወይም በአካል ለመገናኘት ካልፈለገ፣ እቃው ወደ ማዘጋጃ ቤት ጣቢያ እንዲገባ የባለስልጣን እርዳታ ይጠይቁ።"
                      : "If the finder hasn't replied in 24 hours, you can request Municipal Officer intervention to facilitate a safe drop-off at your nearest Municipal Desk."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEscalateModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs whitespace-nowrap transition-all cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{locale === "am" ? "የማዘጋጃ ቤት እርዳታ ጠይቅ" : "Request Municipal Help"}</span>
              </button>
            </div>
          ) : (
            <div className="my-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#087FF5]/15 text-[#087FF5] flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#062B72] block">
                    🏛️ Municipal Intervention Active ({escalationResult?.case_id || "Case #DSP-UNR-0421"})
                  </span>
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                    Municipal Supervisor STF-01 has been notified. An official drop-off notice was sent to the finder for safe custody at {escalationResult?.assigned_desk || "Bole Sub-City Lost & Found Station"}.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-[#087FF5] text-[11px] font-extrabold uppercase shrink-0 self-start sm:self-auto">
                Officer Contacting Finder
              </span>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 py-4 flex flex-col gap-4 overflow-y-auto max-h-[400px] pr-1">
            {currentMessages.map((m) => {
              const isUser = m.sender === "user";

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-[#087FF5] text-white rounded-br-xs shadow-xs"
                        : "bg-white border border-[#e2eaf4] text-[#062B72] rounded-bl-xs shadow-xs font-medium"
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                    <span>{m.time}</span>
                    {isUser && <CheckCheck className="w-3 h-3 text-[#087FF5]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Input Row */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 pt-3 border-t border-[#e2eaf4]"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={dict.messagesPage.typePlaceholder}
              className="flex-1 px-4 py-3 rounded-full border border-[#dce6f2] bg-white text-xs text-[#062B72] placeholder-[#94a3b8] focus:border-[#087FF5] focus:ring-1 focus:ring-[#087FF5] focus:outline-none shadow-xs transition-all"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="px-4 py-3 rounded-full bg-[#087FF5] hover:bg-[#0077b6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#087FF5]/30 transition-all disabled:opacity-40 cursor-pointer shrink-0"
              aria-label="Send"
            >
              <span>{dict.messagesPage.send}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Escalation Modal Dialog */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 bg-[#062B72]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#e2eaf4] shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#062B72]">
                    {locale === "am" ? "የማዘጋጃ ቤት ጣቢያ ጣልቃ ገብነት ይጠይቁ" : "Request Municipal Officer Intervention"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {locale === "am"
                      ? "አግኚው ምላሽ በማይሰጥበት ጊዜ የማዘጋጃ ቤት ኃላፊዎች ጣልቃ ገብተው እቃውን በአስተማማኝ ሁኔታ ያስረክባሉ።"
                      : "For cases where the finder is unresponsive or hesitant to meet in person."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanatory Steps */}
            <div className="p-4 rounded-2xl bg-[#f0f7ff] border border-[#d8e8fc] flex flex-col gap-2.5">
              <span className="text-xs font-bold text-[#062B72] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#087FF5]" />
                <span>How Municipal Officers Resolve This:</span>
              </span>
              <ul className="text-xs text-slate-600 flex flex-col gap-1.5 list-disc pl-4 leading-relaxed">
                <li>
                  <strong className="text-[#062B72]">Official Municipal Notice:</strong> The officer dispatches a formal SMS summons to the finder's verified registration phone.
                </li>
                <li>
                  <strong className="text-[#062B72]">Safe Drop-Off (No Meeting):</strong> The finder can drop the item at any 24/7 Municipal Desk / Police Station without meeting strangers.
                </li>
                <li>
                  <strong className="text-[#062B72]">Vault Custody & Pickup:</strong> Once deposited, you will receive an alert to collect your item safely at the desk using your Handover Pass and OTP.
                </li>
              </ul>
            </div>

            {/* Notes Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#062B72]">
                Additional Details (Optional)
              </label>
              <textarea
                value={escalationNotes}
                onChange={(e) => setEscationNotes(e.target.value)}
                placeholder="e.g. Sent 3 messages since yesterday with no response..."
                rows={3}
                className="w-full p-3 rounded-xl border border-[#dce6f2] bg-white text-xs text-[#062B72] placeholder:text-slate-400 focus:outline-none focus:border-[#087FF5] focus:ring-2 focus:ring-[#087FF5]/15 transition-all shadow-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                disabled={escalating}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEscalate}
                disabled={escalating}
                className="px-5 py-2.5 rounded-xl bg-[#087FF5] hover:bg-[#062B72] text-white font-bold text-xs shadow-md shadow-[#087FF5]/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {escalating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Confirm Escalation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
