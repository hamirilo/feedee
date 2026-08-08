"use client";

import React from "react";
import { motion } from "framer-motion";

export interface ActiveIndicatorProps {
  layoutId?: string;
  className?: string;
}

export function ActiveIndicator({
  layoutId = "active-nav-indicator",
  className = "bg-blue-600/10 dark:bg-blue-600/20 border-blue-500/20",
}: ActiveIndicatorProps) {
  return (
    <motion.div
      layoutId={layoutId}
      aria-hidden="true"
      className={`absolute inset-0 border rounded-lg z-0 pointer-events-none ${className}`}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    />
  );
}
