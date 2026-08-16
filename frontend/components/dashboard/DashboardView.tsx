import React from "react";
import type { ArticleItem, UserStats } from "../types";

interface DashboardViewProps {
  articles: ArticleItem[];
  stats: UserStats;
  onSelectArticle: (article: ArticleItem) => void;
  onOpenInbox: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  articles,
  stats,
  onSelectArticle,
  onOpenInbox,
}) => {
  const heroArticle = articles[0];
  const subArticles = articles.slice(1, 6);

  const todayStr = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  return (
    <div className="flex-1 min-w-0 flex overflow-hidden p-6 gap-6 bg-[var(--color-background)]">
      {/* Main Feed Content Grid */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pr-2">
        {/* Title Header */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
              今日のフィード
            </h1>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {todayStr} · 未読 {stats.unread_total}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenInbox}
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
          >
            受信箱ですべて読む →
          </button>
        </div>

        {articles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-[var(--color-border)] rounded-xl text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-1">
              未読記事はありません
            </h3>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              すべて読み終わりました！素晴らしい消化ペースです。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-5">
            {/* Hero Article (Left Column) */}
            {heroArticle && (
              <div
                onClick={() => onSelectArticle(heroArticle)}
                className="group flex flex-col gap-2.5 cursor-pointer p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all"
              >
                <div className="w-full h-44 rounded-lg overflow-hidden bg-[var(--color-muted)] flex items-center justify-center relative">
                  {heroArticle.image_url ? (
                    <img
                      src={heroArticle.image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-[var(--color-muted-foreground)] flex flex-col items-center gap-1">
                      <svg
                        className="w-8 h-8 opacity-40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-[var(--color-muted-foreground)] flex items-center gap-1.5">
                  <span className="font-semibold text-[var(--color-secondary-foreground)]">
                    {heroArticle.feed_title}
                  </span>
                  <span>·</span>
                  <span>{heroArticle.published_relative}</span>
                  {heroArticle.reading_time_minutes && (
                    <>
                      <span>·</span>
                      <span>{heroArticle.reading_time_minutes} 分</span>
                    </>
                  )}
                </div>
                <h2 className="text-base font-bold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                  {heroArticle.title}
                </h2>
                <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)] line-clamp-3">
                  {heroArticle.summary}
                </p>
              </div>
            )}

            {/* Sub Articles List (Right Column) */}
            <div className="flex flex-col gap-3">
              {subArticles.map((art, idx) => (
                <React.Fragment key={art.id}>
                  {idx > 0 && <div className="h-px bg-[var(--color-border)]" />}
                  <div
                    onClick={() => onSelectArticle(art)}
                    className="group flex gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
                  >
                    <div className="w-24 h-18 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--color-muted)] flex items-center justify-center">
                      {art.image_url ? (
                        <img src={art.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg
                          className="w-5 h-5 opacity-30 text-[var(--color-muted-foreground)]"
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
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col justify-center gap-1">
                      <div className="text-[11px] text-[var(--color-muted-foreground)]">
                        {art.feed_title} · {art.published_relative}
                      </div>
                      <h3 className="text-xs font-semibold leading-snug text-[var(--color-foreground)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                        {art.title}
                      </h3>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar Widget (Breakdown & Completion Rate) */}
      <aside className="w-60 flex-shrink-0 flex flex-col gap-4">
        {/* Unread Breakdown */}
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col gap-3">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-[var(--color-muted-foreground)]">
            未読の内訳
          </div>
          <div className="flex flex-col gap-2.5">
            {stats.unread_breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-[var(--color-secondary-foreground)]">
                  {item.label}
                </span>
                <span className="w-16 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <span
                    className="block h-full bg-[var(--color-primary)] rounded-full"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </span>
                <b className="w-6 text-right tabular-nums text-[11px] text-[var(--color-foreground)]">
                  {item.count}
                </b>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Rate Widget */}
        <div className="p-4 rounded-xl bg-[var(--color-muted)] flex flex-col gap-1.5">
          <div className="text-xs font-semibold text-[var(--color-secondary-foreground)]">
            今週の消化率
          </div>
          <div className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {stats.completion_rate}
            <span className="text-xs font-semibold text-[var(--color-muted-foreground)] ml-0.5">
              %
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-success)] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.completion_rate)}%` }}
            />
          </div>
        </div>
      </aside>
    </div>
  );
};
