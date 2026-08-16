import type React from "react";
import type { AppMode, BookmarkCategory, BookmarkTag, FeedGroup } from "../types";

interface ContextSidebarProps {
  currentMode: AppMode;
  unreadTotal: number;
  readLaterTotal: number;
  bookmarksTotal: number;
  feedGroups: FeedGroup[];
  categories: BookmarkCategory[];
  tags: BookmarkTag[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  settingsSection: "feeds" | "categories" | "display" | "account";
  onSelectSettingsSection: (section: "feeds" | "categories" | "display" | "account") => void;
  onOpenAddFeedModal: () => void;
  onOpenAddBookmarkModal: () => void;
  onExportOpml: () => void;
  onImportOpml: () => void;
}

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
  currentMode,
  unreadTotal,
  readLaterTotal,
  bookmarksTotal,
  feedGroups,
  categories,
  tags,
  selectedFilter,
  onSelectFilter,
  settingsSection,
  onSelectSettingsSection,
  onOpenAddFeedModal,
  onOpenAddBookmarkModal,
  onExportOpml,
  onImportOpml,
}) => {
  if (currentMode === "dashboard") {
    return (
      <aside className="w-52 flex-shrink-0 border-r border-[var(--color-border)] p-4 flex flex-col gap-4 bg-[var(--color-background)] overflow-y-auto">
        <div className="px-2 text-sm font-bold text-[var(--color-foreground)]">ダッシュボード</div>

        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onSelectFilter("today")}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
              selectedFilter === "today"
                ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
                : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
            }`}
          >
            <span>今日のフィード</span>
            <span className="ml-auto text-[11px] tabular-nums font-semibold">{unreadTotal}</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectFilter("read-later")}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
              selectedFilter === "read-later"
                ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
                : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
            }`}
          >
            <span>後で読む</span>
            <span className="ml-auto text-[11px] text-[var(--color-muted-foreground)] tabular-nums">
              {readLaterTotal}
            </span>
          </button>
        </div>

        {/* Groups */}
        <div className="flex flex-col gap-1">
          <div className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--color-muted-foreground)]">
            グループ
          </div>
          <div className="flex flex-col gap-0.5">
            {feedGroups.map((group) => {
              const isSelected = selectedFilter === `group:${group.id}`;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => onSelectFilter(`group:${group.id}`)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
                      : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                  <span className="truncate">{group.name}</span>
                  <span className="ml-auto text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                    {group.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Feed Action */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={onOpenAddFeedModal}
            className="w-full py-1.5 px-3 rounded-[var(--radius)] text-xs font-medium border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>＋</span> フィードを追加
          </button>
        </div>
      </aside>
    );
  }

  if (currentMode === "inbox") {
    return (
      <aside className="w-52 flex-shrink-0 border-r border-[var(--color-border)] p-4 flex flex-col gap-4 bg-[var(--color-background)] overflow-y-auto">
        <div className="px-2 flex items-baseline justify-between">
          <span className="text-sm font-bold text-[var(--color-foreground)]">受信箱</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            未読 <b className="text-[var(--color-foreground)]">{unreadTotal}</b>
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex p-0.5 rounded-[var(--radius)] bg-[var(--color-muted)] gap-0.5">
          <button
            type="button"
            onClick={() => onSelectFilter("unread")}
            className={`flex-1 py-1 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
              selectedFilter === "unread"
                ? "bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs font-semibold"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            未読 {unreadTotal}
          </button>
          <button
            type="button"
            onClick={() => onSelectFilter("all")}
            className={`flex-1 py-1 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
              selectedFilter === "all"
                ? "bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs font-semibold"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            すべて
          </button>
          <button
            type="button"
            onClick={() => onSelectFilter("read-later")}
            className={`flex-1 py-1 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
              selectedFilter === "read-later"
                ? "bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs font-semibold"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            後で {readLaterTotal}
          </button>
        </div>

        {/* Feeds Group Filter */}
        <div className="flex flex-col gap-1">
          <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--color-muted-foreground)]">
            フィード別
          </div>
          <div className="flex flex-col gap-0.5">
            {feedGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectFilter(`feed:${group.id}`)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
                  selectedFilter === `feed:${group.id}`
                    ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
                    : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
                }`}
              >
                <span className="truncate">{group.name}</span>
                <span className="ml-auto text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                  {group.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Shortcut Guide */}
        <div className="mt-auto pt-3 border-t border-[var(--color-border)] flex flex-col gap-1.5 text-[10px] text-[var(--color-muted-foreground)]">
          <div className="font-semibold text-[var(--color-foreground)] mb-0.5">ショートカット</div>
          <div className="flex items-center justify-between">
            <span>移動</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] font-mono font-bold text-[var(--color-foreground)]">
              J / K
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>既読/次へ</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] font-mono font-bold text-[var(--color-foreground)]">
              E / Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>後で読む</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] font-mono font-bold text-[var(--color-foreground)]">
              S
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>ブックマーク保存</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] font-mono font-bold text-[var(--color-foreground)]">
              B
            </kbd>
          </div>
        </div>
      </aside>
    );
  }

  if (currentMode === "settings") {
    return (
      <aside className="w-52 flex-shrink-0 border-r border-[var(--color-border)] p-4 flex flex-col gap-4 bg-[var(--color-background)] overflow-y-auto">
        <div className="px-2 text-sm font-bold text-[var(--color-foreground)]">設定</div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onSelectSettingsSection("feeds")}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
              settingsSection === "feeds"
                ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
                : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
            }`}
          >
            <svg
              className="w-4 h-4"
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
            <span>フィード</span>
            <span className="ml-auto text-[11px] tabular-nums font-semibold">
              {feedGroups.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSettingsSection("categories")}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
              settingsSection === "categories"
                ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
                : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
            }`}
          >
            <svg
              className="w-4 h-4"
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
            <span>分類・タグ</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSettingsSection("display")}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
              settingsSection === "display"
                ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
                : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            <span>表示</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSettingsSection("account")}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
              settingsSection === "account"
                ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
                : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>アカウント</span>
          </button>
        </div>

        {/* OPML Actions */}
        <div className="mt-auto flex flex-col gap-1.5 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onExportOpml}
            className="w-full py-1.5 px-3 rounded-[var(--radius)] text-xs font-medium border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
          >
            OPML を書き出す
          </button>
          <button
            type="button"
            onClick={onImportOpml}
            className="w-full py-1.5 px-3 rounded-[var(--radius)] text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
          >
            OPML を読み込む
          </button>
        </div>
      </aside>
    );
  }

  // Saved / Bookmarks (5c)
  return (
    <aside className="w-52 flex-shrink-0 border-r border-[var(--color-border)] p-4 flex flex-col gap-4 bg-[var(--color-background)] overflow-y-auto">
      <div className="px-2 flex items-baseline justify-between">
        <span className="text-sm font-bold text-[var(--color-foreground)]">保存</span>
        <span className="text-xs text-[var(--color-muted-foreground)] font-medium tabular-nums">
          {bookmarksTotal}
        </span>
      </div>

      {/* Collections */}
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onSelectFilter("all")}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
            selectedFilter === "all"
              ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
              : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span>すべての保存</span>
          <span className="ml-auto text-[11px] tabular-nums font-semibold">{bookmarksTotal}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter("read-later")}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
            selectedFilter === "read-later"
              ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
              : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
          }`}
        >
          <svg className="w-4 h-4 text-[var(--color-info)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>後で読む</span>
          <span className="ml-auto text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
            {readLaterTotal}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter("favorites")}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
            selectedFilter === "favorites"
              ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
              : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
          }`}
        >
          <svg
            className="w-4 h-4 text-[var(--color-warning)]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>お気に入り</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter("archive")}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
            selectedFilter === "archive"
              ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
              : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          <span>アーカイブ</span>
        </button>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-1">
        <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--color-muted-foreground)]">
          カテゴリ
        </div>
        <div className="flex flex-col gap-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectFilter(`category:${cat.id}`)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-xs cursor-pointer transition-colors ${
                selectedFilter === `category:${cat.id}`
                  ? "bg-[var(--color-muted)] font-semibold text-[var(--color-primary)]"
                  : "text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.color || "var(--color-primary)" }}
              />
              <span className="truncate">{cat.name}</span>
              <span className="ml-auto text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1">
        <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--color-muted-foreground)]">
          タグ
        </div>
        <div className="flex flex-wrap gap-1 px-1">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelectFilter(`tag:${tag.id}`)}
              className={`px-2 py-0.5 rounded-full text-[11px] cursor-pointer transition-colors border ${
                selectedFilter === `tag:${tag.id}`
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-semibold"
                  : "border-[var(--color-border)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)]"
              }`}
            >
              #{tag.name} <span className="opacity-70 text-[10px]">{tag.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Bookmark Action */}
      <div className="mt-auto pt-2">
        <button
          type="button"
          onClick={onOpenAddBookmarkModal}
          className="w-full py-1.5 px-3 rounded-[var(--radius)] text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
        >
          <span>＋</span> 保存を追加
        </button>
      </div>
    </aside>
  );
};
