import type React from "react";
import { useState } from "react";
import type { BookmarkCategory, BookmarkItem, BookmarkTag } from "../types";

interface SavedViewProps {
  bookmarks: BookmarkItem[];
  categories: BookmarkCategory[];
  tags: BookmarkTag[];
  viewMode: "list" | "gallery" | "panel";
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  onToggleFavorite: (id: number) => void;
  onToggleReadLater: (id: number) => void;
  onDeleteBookmark: (id: number) => void;
  onUpdateBookmark: (bookmark: BookmarkItem) => void;
  onOpenAddModal: () => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  bookmarks,
  viewMode,
  onToggleFavorite,
  onToggleReadLater,
  onDeleteBookmark,
  onOpenAddModal,
}) => {
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkItem | null>(
    bookmarks[0] || null,
  );

  return (
    <div className="flex-1 min-w-0 flex overflow-hidden bg-[var(--color-background)]">
      {/* Bookmarks Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
              保存
            </h1>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {bookmarks.length} 件
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="h-8 px-3 rounded-[var(--radius)] text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            ＋ 保存を追加
          </button>
        </div>

        {bookmarks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-[var(--color-border)] rounded-xl text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] mb-3">
              <svg
                className="w-6 h-6"
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
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-1">
              保存されたブックマークはありません
            </h3>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              気になる記事やリンクを保存して整理しましょう。
            </p>
          </div>
        ) : (
          <>
            {/* ── LIST VIEW ─────────────────────────── */}
            {viewMode === "list" && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] divide-y divide-[var(--color-border)]">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    onClick={() => setSelectedBookmark(bm)}
                    className="p-4 hover:bg-[var(--color-muted)]/40 transition-colors flex items-start gap-4 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
                          {bm.domain}
                        </span>
                        {bm.category && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: bm.category.color || "var(--color-primary)" }}
                          >
                            {bm.category.name}
                          </span>
                        )}
                        {bm.tags.map((t) => (
                          <span
                            key={t.id}
                            className="text-[11px] text-[var(--color-muted-foreground)]"
                          >
                            #{t.name}
                          </span>
                        ))}
                      </div>

                      <a
                        href={bm.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors inline-block"
                      >
                        {bm.title}
                      </a>

                      {bm.description && (
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-2">
                          {bm.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(bm.id);
                        }}
                        title="お気に入り"
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          bm.is_favorite
                            ? "text-[var(--color-warning)]"
                            : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill={bm.is_favorite ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleReadLater(bm.id);
                        }}
                        title="後で読む"
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          bm.is_read_later
                            ? "text-[var(--color-info)]"
                            : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill={bm.is_read_later ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBookmark(bm.id);
                        }}
                        title="削除"
                        className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── GALLERY / CARD VIEW ───────────────── */}
            {viewMode === "gallery" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    onClick={() => setSelectedBookmark(bm)}
                    className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/40 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] text-[var(--color-muted-foreground)] truncate font-medium">
                          {bm.domain}
                        </span>
                        {bm.category && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-semibold text-white flex-shrink-0"
                            style={{ backgroundColor: bm.category.color || "var(--color-primary)" }}
                          >
                            {bm.category.name}
                          </span>
                        )}
                      </div>

                      <a
                        href={bm.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-bold leading-snug text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors line-clamp-2 mb-2"
                      >
                        {bm.title}
                      </a>

                      {bm.description && (
                        <p className="text-[11px] leading-relaxed text-[var(--color-muted-foreground)] line-clamp-3">
                          {bm.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {bm.tags.slice(0, 2).map((t) => (
                          <span
                            key={t.id}
                            className="text-[10px] text-[var(--color-muted-foreground)]"
                          >
                            #{t.name}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(bm.id);
                          }}
                          className={`p-1 rounded cursor-pointer ${
                            bm.is_favorite
                              ? "text-[var(--color-warning)]"
                              : "text-[var(--color-muted-foreground)]"
                          }`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill={bm.is_favorite ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 2-PANE VIEW ───────────────────────── */}
            {viewMode === "panel" && (
              <div className="flex-1 flex overflow-hidden border border-[var(--color-border)] rounded-xl">
                {/* Left Mini List */}
                <div className="w-80 border-r border-[var(--color-border)] overflow-y-auto divide-y divide-[var(--color-border)]">
                  {bookmarks.map((bm) => {
                    const isSelected = selectedBookmark?.id === bm.id;
                    return (
                      <div
                        key={bm.id}
                        onClick={() => setSelectedBookmark(bm)}
                        className={`p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[var(--color-primary)]/8 border-l-2 border-l-[var(--color-primary)]"
                            : "hover:bg-[var(--color-muted)]/40"
                        }`}
                      >
                        <div className="text-[10px] text-[var(--color-muted-foreground)] mb-0.5">
                          {bm.domain}
                        </div>
                        <div className="text-xs font-semibold text-[var(--color-foreground)] line-clamp-2">
                          {bm.title}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Detail Preview */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
                  {selectedBookmark ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs text-[var(--color-muted-foreground)]">
                        <span>{selectedBookmark.domain}</span>
                        <span>·</span>
                        <span>{selectedBookmark.created_at}</span>
                      </div>
                      <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-3">
                        {selectedBookmark.title}
                      </h2>
                      <p className="text-xs leading-relaxed text-[var(--color-secondary-foreground)] mb-4">
                        {selectedBookmark.description || "説明はありません"}
                      </p>
                      <a
                        href={selectedBookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                      >
                        リンクを開く →
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      ブックマークを選択してください
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
