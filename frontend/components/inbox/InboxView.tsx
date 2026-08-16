import type React from "react";
import { useEffect, useRef } from "react";
import type { ArticleItem } from "../types";

interface InboxViewProps {
  articles: ArticleItem[];
  selectedArticleId: number | null;
  onSelectArticle: (article: ArticleItem) => void;
  onMarkRead: (articleId: number) => void;
  onMarkReadLater: (articleId: number) => void;
  onToggleBookmark: (articleId: number) => void;
  onMarkReadAndNext: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  articles,
  selectedArticleId,
  onSelectArticle,
  onMarkRead,
  onMarkReadLater,
  onToggleBookmark,
  onMarkReadAndNext,
}) => {
  const selectedArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcuts (J, K, E, S, B, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs or textareas
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (articles.length === 0) return;
      const currentIndex = articles.findIndex(
        (a) => a.id === (selectedArticle?.id ?? articles[0].id),
      );

      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(articles.length - 1, currentIndex + 1);
        onSelectArticle(articles[nextIndex]);
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(0, currentIndex - 1);
        onSelectArticle(articles[prevIndex]);
      } else if (e.key === "e" || e.key === "E" || e.key === "Enter") {
        e.preventDefault();
        onMarkReadAndNext();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (selectedArticle) onMarkReadLater(selectedArticle.id);
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        if (selectedArticle) onToggleBookmark(selectedArticle.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    articles,
    selectedArticle,
    onSelectArticle,
    onMarkReadLater,
    onToggleBookmark,
    onMarkReadAndNext,
  ]);

  return (
    <div className="flex-1 min-w-0 flex overflow-hidden bg-[var(--color-background)]">
      {/* Left List Pane (420px) */}
      <div className="w-96 lg:w-[420px] flex-shrink-0 border-r border-[var(--color-border)] flex flex-col">
        {/* Article Items Scrollable List */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {articles.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-muted-foreground)]">
              表示する記事がありません
            </div>
          ) : (
            articles.map((article) => {
              const isSelected = selectedArticle?.id === article.id;
              return (
                <div
                  key={article.id}
                  onClick={() => onSelectArticle(article)}
                  className={`flex gap-3 p-3.5 border-b border-[var(--color-border)] cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--color-primary)]/8 border-l-[3px] border-l-[var(--color-primary)] pl-3"
                      : "hover:bg-[var(--color-muted)]/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[var(--color-muted-foreground)] mb-1 flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--color-secondary-foreground)] truncate max-w-[150px]">
                        {article.feed_title}
                      </span>
                      <span>·</span>
                      <span>{article.published_relative}</span>
                      {article.is_read_later && (
                        <span className="ml-auto px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[var(--color-info)]/15 text-[var(--color-info)]">
                          後で
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs leading-snug line-clamp-2 ${isSelected ? "font-bold text-[var(--color-foreground)]" : "font-medium text-[var(--color-secondary-foreground)]"}`}
                    >
                      {article.title}
                    </div>
                  </div>

                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-[var(--color-muted)]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] opacity-40">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
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
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Shortcut Legend Bar */}
        <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-muted)] flex gap-2.5 text-[10px] text-[var(--color-muted-foreground)] select-none">
          <span>
            <b className="text-[var(--color-foreground)]">J/K</b> 移動
          </span>
          <span>
            <b className="text-[var(--color-foreground)]">E</b> 既読
          </span>
          <span>
            <b className="text-[var(--color-foreground)]">S</b> 後で
          </span>
          <span>
            <b className="text-[var(--color-foreground)]">B</b> 保存
          </span>
        </div>
      </div>

      {/* Right Reader Pane */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {selectedArticle ? (
          <div className="max-w-2xl w-full mx-auto px-6 py-8 flex flex-col">
            {/* Meta */}
            <div className="text-xs text-[var(--color-muted-foreground)] mb-2 flex items-center gap-2">
              <span className="font-semibold text-[var(--color-secondary-foreground)]">
                {selectedArticle.feed_title}
              </span>
              <span>·</span>
              <span>{selectedArticle.published_relative}</span>
              {selectedArticle.reading_time_minutes && (
                <>
                  <span>·</span>
                  <span>読了 {selectedArticle.reading_time_minutes} 分</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold leading-snug tracking-tight text-[var(--color-foreground)] mb-4">
              {selectedArticle.title}
            </h1>

            {/* Cover Image */}
            {selectedArticle.image_url && (
              <img
                src={selectedArticle.image_url}
                alt=""
                className="w-full h-56 object-cover rounded-xl bg-[var(--color-muted)] mb-5"
              />
            )}

            {/* Content / Summary */}
            <div
              className="text-sm leading-relaxed text-[var(--color-secondary-foreground)] space-y-4 article-prose"
              dangerouslySetInnerHTML={{
                __html: selectedArticle.content_html || `<p>${selectedArticle.summary}</p>`,
              }}
            />

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                <span>元記事を読む</span>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onMarkReadLater(selectedArticle.id)}
                  className={`h-8 px-3 rounded-[var(--radius)] text-xs font-medium border transition-colors cursor-pointer ${
                    selectedArticle.is_read_later
                      ? "bg-[var(--color-info)] text-white border-[var(--color-info)]"
                      : "border-[var(--color-border)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)]"
                  }`}
                >
                  {selectedArticle.is_read_later ? "後で読む保存済" : "後で読む"}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleBookmark(selectedArticle.id)}
                  className={`h-8 px-3 rounded-[var(--radius)] text-xs font-medium border transition-colors cursor-pointer ${
                    selectedArticle.is_bookmarked
                      ? "bg-[var(--color-warning)] text-white border-[var(--color-warning)]"
                      : "border-[var(--color-border)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)]"
                  }`}
                >
                  {selectedArticle.is_bookmarked ? "★ 保存済" : "☆ 保存"}
                </button>

                <button
                  type="button"
                  onClick={onMarkReadAndNext}
                  className="h-8 px-3.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  既読にして次へ ⏎
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-[var(--color-muted-foreground)]">
            記事を選択してください
          </div>
        )}
      </div>
    </div>
  );
};
