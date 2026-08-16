import type React from "react";
import type { AppMode } from "../types";

interface NavRailProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  unreadCount?: number;
  userInitial?: string;
}

export const NavRail: React.FC<NavRailProps> = ({
  currentMode,
  onSelectMode,
  unreadCount = 0,
  userInitial = "U",
}) => {
  const navItems: { mode: AppMode; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      mode: "dashboard",
      label: "ダッシュ",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" d="M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z" />
        </svg>
      ),
    },
    {
      mode: "inbox",
      label: "受信箱",
      badge: unreadCount > 0 ? unreadCount : undefined,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      ),
    },
    {
      mode: "saved",
      label: "保存",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
    },
    {
      mode: "settings",
      label: "設定",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
          />
          <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="w-16 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-muted)] flex flex-col items-center gap-1 py-3.5 select-none z-20">
      {/* Brand Logo */}
      <div
        onClick={() => onSelectMode("dashboard")}
        className="w-[34px] h-[34px] rounded-[10px] bg-[var(--color-primary)] flex items-center justify-center mb-2.5 cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
        title="Feedee Home"
      >
        <svg
          className="w-[18px] h-[18px] text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <circle cx="6" cy="18" r="1.75" fill="currentColor" stroke="none" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 11a9 9 0 019 9m-9-14a14 14 0 0114 14"
          />
        </svg>
      </div>

      {/* Nav Rail Buttons */}
      <div className="flex flex-col items-center gap-1.5 w-full px-2">
        {navItems.map((item) => {
          const isActive = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => onSelectMode(item.mode)}
              className={`relative w-12 py-2 rounded-[10px] flex flex-col items-center gap-0.5 text-[10px] transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--color-background)] shadow-xs text-[var(--color-primary)] font-semibold"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary-hover)]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>

              {/* Badge */}
              {item.badge !== undefined && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-primary)] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Avatar */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectMode("settings")}
          className="w-[30px] h-[30px] rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
          title="アカウント / 設定"
        >
          {userInitial.toUpperCase()}
        </button>
      </div>
    </nav>
  );
};
