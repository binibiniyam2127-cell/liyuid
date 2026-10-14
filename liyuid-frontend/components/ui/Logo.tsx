import React from "react";

export interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: "dark" | "light";
  layout?: "row" | "col";
  className?: string;
}

export function Logo({
  size = 36,
  showText = false,
  textColor = "dark",
  layout = "row",
  className = "",
}: LogoProps) {
  const height = Math.round(size * (184 / 142));
  return (
    <div
      className={`inline-flex ${
        layout === "col" ? "flex-col items-center gap-1.5" : "flex-row items-center gap-2.5"
      } select-none shrink-0 ${className}`}
    >
      <img
        src="/images/logo-pin.png"
        alt="LIYUID"
        width={size}
        height={height}
        className="shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,180,240,0.35)]"
        style={{ width: `${size}px`, height: `${height}px` }}
      />
      {showText && (
        <span
          className={`font-black tracking-widest leading-none ${
            textColor === "light" ? "text-white" : "text-[#0d2a54]"
          }`}
          style={{
            fontSize: size > 40 ? "1.65rem" : "1.25rem",
            letterSpacing: "0.12em",
          }}
        >
          LIYUID
        </span>
      )}
    </div>
  );
}