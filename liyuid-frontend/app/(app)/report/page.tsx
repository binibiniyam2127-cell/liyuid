"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Tag,
  AlertCircle,
  HelpCircle,
  Layers,
  Smartphone,
  Info,
  Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

const STEPS = ["01 Item", "02 Public Details", "03 Private Verification", "04 Review"];

const VERIFICATION_ATTRIBUTES = [
  { id: "marking", label: "Marking", desc: "E.g. small scratch, sticker", icon: Tag },
  { id: "damage", label: "Damage", desc: "E.g. cracked screen", icon: AlertCircle },
  { id: "accessory", label: "Accessory", desc: "E.g. case, charger", icon: Layers },
  { id: "screen", label: "Screen content", desc: "E.g. wallpaper, message", icon: Smartphone },
  { id: "contents", label: "Contents", desc: "E.g. items inside", icon: HelpCircle },
  { id: "identifier", label: "Identifier", desc: "E.g. serial number, code", icon: Lock },
  { id: "other", label: "Other", desc: "E.g. unique feature", icon: Info },
];

function ReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(0); // 0 = Item, 1 = Public Details, 2 = Private Verification, 3 = Review
  const [reportType, setReportType] = useState<"lost" | "found">(
    searchParams.get("type") === "found" ? "found" : "lost"
  );

  // Step 1: Item Fields (Screen 6)
  const [category, setCategory] = useState("Electronics");
  const [itemType, setItemType] = useState("Smartphone");
  const [customItemType, setCustomItemType] = useState("");
  const [brand, setBrand] = useState("iPhone");
  const [customBrand, setCustomBrand] = useState("");
  const [model, setModel] = useState("iPhone 13");
  const [color, setColor] = useState("Black");
  const [customColor, setCustomColor] = useState("");
  const [description, setDescription] = useState(
    "Black iPhone 13 with a blue case, small scratch on the back."
  );

  // Step 2: Public Details Fields
  const [subCity, setSubCity] = useState("Bole");
  const [specificLocation, setSpecificLocation] = useState("Near Edna Mall");
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().slice(0, 10));
  const [deskEscrow, setDeskEscrow] = useState(false);

  // Step 3: Private Verification Attributes (Screen 7)
  const [attributes, setAttributes] = useState<Record<string, string>>({
    marking: "Sticker on the back case with initials BM",
    damage: "",
    accessory: "Blue silicone magnetic case",
    screen: "",
    contents: "",
    identifier: "",
    other: "",
  });
  const [activeAttr, setActiveAttr] = useState<string | null>("marking");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      submitReport();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const effectiveItemType =
    itemType === "Other" && customItemType.trim() ? customItemType.trim() : itemType;
  const effectiveBrand =
    brand === "Other" && customBrand.trim() ? customBrand.trim() : brand;
  const effectiveColor =
    color === "Other" && customColor.trim() ? customColor.trim() : color;
  const effectiveSubCity = subCity.trim() || "Bole";

  const mapCategory = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes("electr")) return "electronics";
    if (lower.includes("doc")) return "documents_ids";
    if (lower.includes("bag") || lower.includes("luggage")) return "bags_luggage";
    if (lower.includes("cloth")) return "clothing";
    if (lower.includes("access") || lower.includes("jewel")) return "jewelry_accessories";
    if (lower.includes("key")) return "keys";
    if (lower.includes("wall") || lower.includes("card")) return "wallets_cards";
    return "other";
  };

  const submitReport = async () => {
    setLoading(true);
    try {
      const privateDetailsSummary = Object.entries(attributes)
        .filter(([_, v]) => v.trim().length > 0)
        .map(([k, v]) => `[${k}]: ${v}`)
        .join(" | ");

      const payload: any = {
        type: reportType,
        category: mapCategory(category),
        sub_city: effectiveSubCity,
        location_description: deskEscrow
          ? `[Certified Desk Escrow Requested] ${specificLocation}`
          : specificLocation,
        brand: effectiveBrand,
        model: `${model || ""} (${effectiveItemType})`.trim(),
        primary_color: effectiveColor,
        public_description: description,
        date_from: new Date(dateOccurred).toISOString(),
        date_to: new Date(dateOccurred).toISOString(),
      };

      if (reportType === "found") {
        payload.proof_kind = "other";
        payload.proof_primary = attributes.marking || attributes.accessory || "Verified private trait";
        payload.private_detail = privateDetailsSummary || "Sealed verification attributes";
      }

      await api.createReport(payload);
      router.push("/matches");
    } catch {
      router.push("/matches");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* ----------------------------------------------------
          TOP STEPPER (01 Item · 02 Public Details · 03 Private Verification · 04 Review)
      ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#e2eaf4] p-3 sm:p-4 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        {STEPS.map((step, idx) => {
          const isCurrent = idx === currentStep;
          const isDone = idx < currentStep;

          return (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isCurrent
                  ? "bg-[#1982fc] text-white shadow-xs"
                  : isDone
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                    isCurrent ? "bg-white text-[#1982fc]" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {idx + 1}
                </span>
              )}
              <span>{step.replace(/^\d+\s*/, "")}</span>
            </button>
          );
        })}
      </div>

      {/* ----------------------------------------------------
          SCREEN 6: STEP 1 (ITEM)
      ---------------------------------------------------- */}
      {currentStep === 0 && (
        <div className="bg-white rounded-[28px] border border-[#e2eaf4] p-6 sm:p-8 shadow-xs flex flex-col gap-6 animate-fadeIn">
          {/* Heading */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0c234b]">
              {reportType === "lost" ? "What did you lose?" : "What did you find?"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select item classification and brand details.
            </p>
          </div>

          {/* Lost / Found Toggle Boxes */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReportType("lost")}
              className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all cursor-pointer ${
                reportType === "lost"
                  ? "bg-[#1982fc] text-white border-[#1982fc] shadow-md shadow-[#1982fc]/20"
                  : "bg-[#f8fbff] border-[#dce6f2] text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  reportType === "lost" ? "bg-white/20" : "bg-slate-200 text-slate-600"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span>Lost Item</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType("found")}
              className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all cursor-pointer ${
                reportType === "found"
                  ? "bg-[#10b981] text-white border-[#10b981] shadow-md shadow-[#10b981]/20"
                  : "bg-[#f8fbff] border-[#dce6f2] text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  reportType === "found" ? "bg-white/20" : "bg-slate-200 text-slate-600"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Found Item</span>
            </button>
          </div>

          {/* Form Fields: 2 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dce6f2] bg-[#f8fbff] text-xs font-medium text-[#0c234b] focus:border-[#0096c7] focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="Electronics">Electronics</option>
                <option value="Documents">Documents & IDs</option>
                <option value="Bags">Bags & Luggage</option>
                <option value="Accessories">Accessories</option>
                <option value="Keys">Keys</option>
                <option value="Clothing">Clothing & Wearables</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Item type */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Item type</label>
                {itemType === "Other" && (
                  <span className="text-[10px] text-[#0096c7] font-semibold">Custom Type</span>
                )}
              </div>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dce6f2] bg-[#f8fbff] text-xs font-medium text-[#0c234b] focus:border-[#0096c7] focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="Smartphone">Smartphone</option>
                <option value="Laptop">Laptop / Tablet</option>
                <option value="Headphones">Headphones / AirPods / Earbuds</option>
                <option value="Passport">Passport / National ID / Bank Card</option>
                <option value="Backpack">Backpack / Luggage / Bag</option>
                <option value="Wallet">Wallet / Purse</option>
                <option value="Watch">Watch / Smartwatch</option>
                <option value="Keys">Keys / Key Fob</option>
                <option value="Eyeglasses">Eyeglasses / Sunglasses</option>
                <option value="Other">Other (Specify)</option>
              </select>

              {itemType === "Other" && (
                <input
                  type="text"
                  value={customItemType}
                  onChange={(e) => setCustomItemType(e.target.value)}
                  placeholder="Specify item type (e.g. Eyeglasses, Smartwatch, Camera, Ring...)"
                  className="w-full mt-1 px-4 py-2 rounded-xl border border-[#0096c7] bg-white text-xs font-medium text-[#0c234b] focus:outline-none shadow-xs"
                  autoFocus
                />
              )}
            </div>

            {/* Brand */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Brand</label>
                {brand === "Other" && (
                  <span className="text-[10px] text-[#0096c7] font-semibold">Custom Brand</span>
                )}
              </div>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dce6f2] bg-[#f8fbff] text-xs font-medium text-[#0c234b] focus:border-[#0096c7] focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="iPhone">iPhone / Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Sony">Sony</option>
                <option value="Dell">Dell</option>
                <option value="HP">HP</option>
                <option value="Lenovo">Lenovo</option>
                <option value="Huawei">Huawei</option>
                <option value="Xiaomi">Xiaomi / Tecno / Infinix</option>
                <option value="Other">Other (Specify)</option>
              </select>

              {brand === "Other" && (
                <input
                  type="text"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Specify brand (e.g. Asus, Nike, Ray-Ban, Michael Kors...)"
                  className="w-full mt-1 px-4 py-2 rounded-xl border border-[#0096c7] bg-white text-xs font-medium text-[#0c234b] focus:outline-none shadow-xs"
                  autoFocus
                />
              )}
            </div>

            {/* Model (optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Model (optional)
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="iPhone 13"
                className="w-full px-4 py-2.5 rounded-xl border border-[#dce6f2] bg-[#f8fbff] text-xs font-medium text-[#0c234b] focus:border-[#0096c7] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Color</label>
                {color === "Other" && (
                  <span className="text-[10px] text-[#0096c7] font-semibold">Custom Color</span>
                )}
              </div>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dce6f2] bg-[#f8fbff] text-xs font-medium text-[#0c234b] focus:border-[#0096c7] focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="Black">Black</option>
                <option value="White">White</option>
                <option value="Blue">Blue</option>
                <option value="Silver">Silver / Gray</option>
                <option value="Gold">Gold</option>
                <option value="Red">Red</option>
                <option value="Brown">Brown</option>
                <option value="Green">Green</option>
                <option value="Purple">Purple / Pink</option>
                <option value="Yellow">Yellow / Orange</option>
                <option value="Patterned">Patterned / Multi-color</option>
                <option value="Other">Other (Specify)</option>
              </select>

              {color === "Other" && (
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="Specify color (e.g. Turquoise, Bronze, Rose Gold, Camouflage...)"
                  className="w-full mt-1 px-4 py-2 rounded-xl border border-[#0096c7] bg-white text-xs font-medium text-[#0c234b] focus:outline-none shadow-xs"
                  autoFocus
                />
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Black iPhone 13 with a blue case, small scratch on the back."
                className="w-full p-3.5 rounded-xl border border-[#dce6f2] bg-[#f8fbff] text-xs font-medium text-[#0c234b] focus:border-[#0096c7] focus:bg-white focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Cyan to Blue Pill Gradient Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-[0_6px_20px_rgba(0,180,216,0.38)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 2: PUBLIC DETAILS (Location & Date)
      ---------------------------------------------------- */}
      {currentStep === 1 && (
        <div className="bg-white rounded-[28px] border border-[#e2eaf4] p-6 sm:p-8 shadow-xs flex flex-col gap-6 animate-fadeIn">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0c234b]">
              Location & Time
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Where and when did this event take place?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Writable Sub-City / Area Field with Suggestions */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Sub-city / Area / Neighborhood
                </label>
                <span className="text-[11px] text-[#0096c7] font-semibold">
                  ✍️ Write your own area
                </span>
              </div>

              <input
                type="text"
                list="subcities-list"
                value={subCity}
                onChange={(e) => setSubCity(e.target.value)}
                placeholder="Type your area or sub-city (e.g. Kazanchis, Bole, CMC, Piassa, Arada, 4 Kilo...)"
                className="w-full px-4 py-2.5 rounded-xl border border-[#dce6f2] bg-[#f8fbff] text-xs font-medium text-[#0c234b] focus:border-[#0096c7] focus:bg-white focus:outline-none shadow-xs"
                required
              />

              <datalist id="subcities-list">
                <option value="Bole" />
                <option value="Arada" />
                <option value="Yeka" />
                <option value="Kirkos" />
                <option value="Lideta" />
                <option value="Nifas Silk-Lafto" />
                <option value="Gullele" />
                <option value="Akaki Kality" />
                <option value="Kolfe Keranio" />
                <option value="Addis Ketema" />
                <option value="Lemi Kura" />
                <option value="Kazanchis" />
                <option value="Piassa" />
                <option value="CMC" />
                <option value="Gerji" />
                <option value="Saris" />
                <option value="Megenagna" />
                <option value="AAU Sidist Kilo Main Campus" />
                <option value="AAiT Amist Kilo Engineering Campus" />
                <option value="AAU FBE Business Campus" />
                <option value="AAU Arat Kilo Science Campus" />
                <option value="Lebu" />
                <option value="Ayat" />
                <option value="Mexico" />
                <option value="Jemo" />
              </datalist>

              {/* Quick Selection Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400 font-semibold">Quick picks:</span>
                {[
                  "Bole",
                  "AAU Sidist Kilo",
                  "AAiT Amist Kilo",
                  "Kazanchis",
                  "Kirkos",
                  "AAU FBE",
                  "Arada",
                  "AAU Arat Kilo",
                  "Piassa",
                  "CMC",
                ].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setSubCity(sc)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      subCity.toLowerCase() === sc.toLowerCase()
                        ? "bg-[#1982fc] text-white border-[#1982fc] shadow-xs"
                        : "bg-[#f1f6fc] text-slate-600 border-[#dce6f2] hover:bg-slate-200"
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Field */}
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-700">Date</label>
              <input
                type="date"
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dce6f2] bg-[#f8fbff] text-xs font-medium text-[#0c234b] focus:border-[#0096c7] focus:bg-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Specific Landmark / Spot */}
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-700">
                Specific Landmark / Spot (Optional)
              </label>
              <input
                type="text"
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                placeholder="e.g. Near Edna Mall, Cafe entrance"
                className="w-full px-4 py-2.5 rounded-xl border border-[#dce6f2] bg-[#f8fbff] text-xs font-medium text-[#0c234b] focus:border-[#0096c7] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Certified Desk Drop-off Option */}
            <div className="sm:col-span-2 p-3.5 bg-cyan-50/70 border border-cyan-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#0096c7] shrink-0" />
                <div>
                  <span className="font-bold text-[#0c234b] block">
                    Drop Off at Certified Desk (Staff Escrow)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Prefer not to meet directly? Request municipal desk drop-off.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                id="desk-escrow"
                checked={deskEscrow}
                onChange={(e) => setDeskEscrow(e.target.checked)}
                className="w-4 h-4 rounded text-[#0096c7] focus:ring-[#0096c7] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="py-2.5 px-6 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="py-3 px-8 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] text-white text-xs font-bold shadow-md shadow-[#00b4d8]/20 flex items-center gap-2 transition-all"
            >
              <span>Next: Private Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SCREEN 7: STEP 3 (PRIVATE VERIFICATION)
      ---------------------------------------------------- */}
      {currentStep === 2 && (
        <div className="bg-white rounded-[28px] border border-[#e2eaf4] p-6 sm:p-8 shadow-xs flex flex-col gap-6 animate-fadeIn">
          {/* Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0c234b]">
              Private verification
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              These details are used only for ownership verification. They are NOT publicly shown.
            </p>
          </div>

          {/* List of 7 Attributes */}
          <div className="flex flex-col gap-2.5">
            {VERIFICATION_ATTRIBUTES.map((attr) => {
              const Icon = attr.icon;
              const isSelected = activeAttr === attr.id;
              const hasVal = attributes[attr.id]?.trim().length > 0;

              return (
                <div
                  key={attr.id}
                  className={`border rounded-2xl transition-all ${
                    isSelected
                      ? "border-[#0096c7] bg-[#f8fbff]"
                      : hasVal
                      ? "border-emerald-300 bg-emerald-50/20"
                      : "border-[#dce6f2] bg-white hover:bg-slate-50/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveAttr(isSelected ? null : attr.id)}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          hasVal
                            ? "bg-emerald-100 text-emerald-700"
                            : isSelected
                            ? "bg-[#0096c7]/15 text-[#0096c7]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#0c234b] block">
                          {attr.label}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {attr.desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasVal && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Configured
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isSelected ? "rotate-90 text-[#0096c7]" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Input Dropdown */}
                  {isSelected && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100/80">
                      <input
                        type="text"
                        value={attributes[attr.id] || ""}
                        onChange={(e) =>
                          setAttributes({ ...attributes, [attr.id]: e.target.value })
                        }
                        placeholder={attr.desc}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#dce6f2] bg-white text-xs text-[#0c234b] focus:border-[#0096c7] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Privacy Warning Banner */}
          <div className="p-3.5 bg-[#f0f7ff] border border-[#d0e5fc] rounded-2xl flex items-center gap-3 text-xs text-[#0c234b]">
            <Lock className="w-4 h-4 text-[#0096c7] shrink-0" />
            <span className="text-[11px] font-medium">
              Do not enter phone numbers, emails or other personal contact information.
            </span>
          </div>

          {/* Button Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="py-2.5 px-6 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="py-3 px-8 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] text-white text-xs font-bold shadow-md shadow-[#00b4d8]/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Seal private details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 4: REVIEW & CONFIRM
      ---------------------------------------------------- */}
      {currentStep === 3 && (
        <div className="bg-white rounded-[28px] border border-[#e2eaf4] p-6 sm:p-8 shadow-xs flex flex-col gap-6 animate-fadeIn">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0c234b]">
              Review & Submit
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Confirm your report before sealing and initiating AI radar matching.
            </p>
          </div>

          <div className="border border-[#e2eaf4] rounded-2xl p-4 bg-[#f8fbff] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Type</span>
              <span className="text-xs font-bold capitalize text-[#0c234b]">{reportType} Item</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Item</span>
              <span className="text-xs font-bold text-[#0c234b]">
                {effectiveBrand} {model} ({effectiveItemType}, {effectiveColor})
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Location</span>
              <span className="text-xs font-bold text-[#0c234b]">
                {effectiveSubCity} {deskEscrow ? "• Drop Off at Certified Desk (Staff Escrow)" : ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Private Seal</span>
              <span className="text-xs font-bold text-emerald-600">✓ Encrypted AES-256</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="py-2.5 px-6 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={submitReport}
              disabled={loading}
              className="py-3 px-8 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] text-white text-xs font-bold shadow-md shadow-[#00b4d8]/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{loading ? "Sealing..." : "Initiate AI Matching"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4f8fc]">
          <div className="w-8 h-8 border-3 border-[#0088ff] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReportPageContent />
    </Suspense>
  );
}
