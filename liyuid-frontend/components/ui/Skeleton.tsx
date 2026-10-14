import React from "react";

export interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
}

export function Skeleton({ className = "", height, width }: SkeletonProps) {
  const style: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    width: typeof width === "number" ? `${width}px` : width,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-line/60 rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}