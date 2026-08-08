"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActiveIndicator } from "./ActiveIndicator";

export type NavItemColor = "blue" | "indigo" | "teal" | "amber" | "rose" | "emerald";

interface NavItemBaseProps {
  isActive: boolean;
  icon: ReactNode;
  label: string;
  count?: number;
  activeColor?: NavItemColor;
  layoutId?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

interface NavItemLinkProps extends NavItemBaseProps {
  href: string;
}

interface NavItemButtonProps extends NavItemBaseProps {
  href?: undefined;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

export type NavItemProps = NavItemLinkProps | NavItemButtonProps;

const colorStyles: Record<
  NavItemColor,
  { text: string; indicator: string; badge: string }
> = {
  blue: {
    text: "text-blue-500 dark:text-blue-400 font-semibold",
    indicator: "bg-blue-600/10 dark:bg-blue-600/20 border-blue-500/20",
    badge: "bg-blue-600/20 text-blue-500 dark:text-blue-400",
  },
  indigo: {
    text: "text-indigo-500 dark:text-indigo-400 font-semibold",
    indicator: "bg-indigo-600/10 dark:bg-indigo-600/20 border-indigo-500/20",
    badge: "bg-indigo-600/20 text-indigo-500 dark:text-indigo-400",
  },
  teal: {
    text: "text-teal-500 dark:text-teal-400 font-semibold",
    indicator: "bg-teal-600/10 dark:bg-teal-600/20 border-teal-500/20",
    badge: "bg-teal-600/20 text-teal-500 dark:text-teal-400",
  },
  amber: {
    text: "text-amber-500 dark:text-amber-400 font-semibold",
    indicator: "bg-amber-600/10 dark:bg-amber-600/20 border-amber-500/20",
    badge: "bg-amber-600/20 text-amber-500 dark:text-amber-400",
  },
  rose: {
    text: "text-rose-500 dark:text-rose-400 font-semibold",
    indicator: "bg-rose-600/10 dark:bg-rose-600/20 border-rose-500/20",
    badge: "bg-rose-600/20 text-rose-500 dark:text-rose-400",
  },
  emerald: {
    text: "text-emerald-500 dark:text-emerald-400 font-semibold",
    indicator: "bg-emerald-600/10 dark:bg-emerald-600/20 border-emerald-500/20",
    badge: "bg-emerald-600/20 text-emerald-500 dark:text-emerald-400",
  },
};

export function NavItem({
  href,
  onClick,
  isActive,
  icon,
  label,
  count,
  activeColor = "blue",
  layoutId = "active-nav-indicator",
  className,
}: NavItemProps) {
  const currentStyle = colorStyles[activeColor];

  const sharedClasses = cn(
    buttonVariants({ variant: "ghost" }),
    "relative flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors border border-transparent select-none cursor-pointer h-auto",
    isActive
      ? currentStyle.text
      : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30",
    className
  );

  const innerContent = (
    <>
      <span className="relative z-10 flex items-center gap-2.5">
        {icon}
        <span className="truncate">{label}</span>
      </span>

      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "relative z-10 px-2 py-0.5 text-xs font-semibold rounded-full",
            currentStyle.badge
          )}
        >
          {count}
        </span>
      )}

      {isActive && (
        <ActiveIndicator layoutId={layoutId} className={currentStyle.indicator} />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className={sharedClasses}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={sharedClasses}
    >
      {innerContent}
    </button>
  );
}
