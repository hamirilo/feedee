"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
  onToggle?: (isDark: boolean) => void;
}

export function ThemeToggle({
  className,
  iconClassName = "w-4 h-4",
  ariaLabel = "テーマ切り替え",
  onToggle,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  const handleToggle = () => {
    const nextDark = !isDark;
    setTheme(nextDark ? "dark" : "light");
    onToggle?.(nextDark);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
        className
      )}
      title={mounted ? (isDark ? "ライトモードに切り替え" : "ダークモードに切り替え") : ariaLabel}
      aria-label={ariaLabel}
    >
      {!mounted ? (
        <span className={cn("inline-block", iconClassName)} aria-hidden="true" />
      ) : isDark ? (
        <Sun className={cn(iconClassName, "text-amber-400")} />
      ) : (
        <Moon className={cn(iconClassName, "text-indigo-600")} />
      )}
    </button>
  );
}
