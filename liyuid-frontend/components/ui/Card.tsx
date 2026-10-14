"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export function Card({
  children,
  hoverable = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      {...props}
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-shadow ${
        hoverable ? "hover:shadow-md hover:border-blue-500/40" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

