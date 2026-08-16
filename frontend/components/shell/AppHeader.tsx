import React from "react";
import type { AppMode } from "../types";

interface AppHeaderProps {
  currentMode: AppMode;
  breadcrumbs: { label: string; active?: boolean }[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  // Dashboard actions
  onRefreshFeeds?: () => void;
  onMarkAllRead?: () => void;
  onOpenInbox?: () => void;
  // Inbox actions
  onMarkReadLater?: () => void;
  onOpenOriginal?: () => void;
  onMarkReadAndNext?: () => void;
  // Settings actions
  onReorderFeeds?: () => void;
  onOpenAddFeed?: () => void;
  // Saved actions
  savedViewMode?: "list" | "gallery" | "panel";
  onChangeSavedViewMode?: (mode: "list" | "gallery" | "panel") => void;
  onBatchAction?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentMode,
  breadcrumbs,
  searchQuery,
  onSearchChange,
  onRefreshFeeds,
  onMarkAllRead,
  onOpenInbox,
  onMarkReadLater,
  onOpenOriginal,
  onMarkReadAndNext,
  onReorderFeeds,
  onOpenAddFeed,
  savedViewMode = "list",
  onChangeSavedViewMode,
  onBatchAction,
}) => {
  return (
    <header className="h-14 flex-shrink-0 border-b border-[var(--color-border)] px-6 flex items-center gap-3.5 bg-[var(--color-background)] select-none z-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <svg
                className="w-3 h-3 text-[var(--color-border)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
            <span className={crumb.active ? "text-[var(--color-foreground)] font-semibold" : ""}>
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Global Search Bar */}
      <div className="w-64 max-w-sm ml-2">
        <div className="relative flex items-center">
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 text-[var(--color-muted-foreground)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="すべてを検索  ⌘K"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
      </div>

      {/* Mode-specific Action Buttons */}
      <div className="ml-auto flex items-center gap-2">
        {currentMode === "dashboard" && (
          <>
            <button
              type="button"
              onClick={onRefreshFeeds}
              className="h-8 px-3 rounded-[var(--radius)] text-xs font-medium text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
            >
              更新
            </button>
            <button
              type="button"
              onClick={onMarkAllRead}
              className="h-8 px-3 rounded-[var(--radius)] text-xs font-medium border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
            >
              全て既読
            </button>
            <button
              type="button"
              onClick={onOpenInbox}
              className="h-8 px-3.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              受信箱を開く
            </button>
          </>
        )}

        {currentMode === "inbox" && (
          <>
            <button
              type="button"
              onClick={onMarkReadLater}
              className="h-8 px-3 rounded-[var(--radius)] text-xs font-medium text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
            >
              後で読む
            </button>
            <button
              type="button"
              onClick={onOpenOriginal}
              className="h-8 px-3 rounded-[var(--radius)] text-xs font-medium border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
            >
              原文
            </button>
            <button
              type="button"
              onClick={onMarkReadAndNext}
              className="h-8 px-3.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs flex items-center gap-1"
            >
              <span>既読にして次へ</span>
              <span className="opacity-75">⏎</span>
            </button>
          </>
        )}

        {currentMode === "settings" && (
          <>
            <button
              type="button"
              onClick={onReorderFeeds}
              className="h-8 px-3 rounded-[var(--radius)] text-xs font-medium border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
            >
              並べ替え
            </button>
            <button
              type="button"
              onClick={onOpenAddFeed}
              className="h-8 px-3.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              ＋ フィード追加
            </button>
          </>
        )}

        {currentMode === "saved" && (
          <>
            {/* View switcher */}
            <div className="flex p-0.5 rounded-[var(--radius)] bg-[var(--color-muted)] border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => onChangeSavedViewMode?.("list")}
                title="リスト表示"
                className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                  savedViewMode === "list"
                    ? "bg-[var(--color-background)] text-[var(--color-primary)] shadow-xs"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onChangeSavedViewMode?.("gallery")}
                title="ギャラリー表示"
                className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                  savedViewMode === "gallery"
                    ? "bg-[var(--color-background)] text-[var(--color-primary)] shadow-xs"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v7H4zM13 14h7v7h-7z"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onChangeSavedViewMode?.("panel")}
                title="2ペイン表示"
                className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                  savedViewMode === "panel"
                    ? "bg-[var(--color-background)] text-[var(--color-primary)] shadow-xs"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" d="M9 4H4v16h5V4zm11 0h-9v16h9V4z" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={onBatchAction}
              className="h-8 px-3 rounded-[var(--radius)] text-xs font-medium border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
            >
              一括操作
            </button>
          </>
        )}
      </div>
    </header>
  );
};
