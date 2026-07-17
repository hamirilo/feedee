"use client";

import * as React from "react";
import { ArticleData, InboxItemData } from "@/app/utils/api";
import {
  Check,
  Inbox,
  Bookmark,
  Heart,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface ArticleReaderContentProps {
  article: ArticleData;
  inboxItems: InboxItemData[];
  somedayItems: InboxItemData[];
  handleSendArticleToInbox: (article: ArticleData) => void;
  openPromoteModalForArticle: (article: ArticleData) => void;
  toggleArticleFavorite: (article: ArticleData) => void;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ArticleReaderContent({
  article,
  inboxItems,
  somedayItems,
  handleSendArticleToInbox,
  openPromoteModalForArticle,
  toggleArticleFavorite,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: ArticleReaderContentProps) {
  const isArticleInInbox = inboxItems.some((item) => item.article_id === article.id);
  const isArticleInSomeday = somedayItems.some((item) => item.article_id === article.id);

  const hasImageInContent = React.useMemo(() => {
    if (!article.thumbnail_url) return false;
    const bodyText = article.content || article.summary || "";
    const cleanUrl = article.thumbnail_url.replace(/^https?:/, "");
    if (bodyText.includes(cleanUrl)) return true;

    try {
      const urlObj = new URL(article.thumbnail_url);
      const pathname = urlObj.pathname;
      if (pathname.length > 5 && bodyText.includes(pathname)) return true;
    } catch (e) {
      // ignore
    }
    return false;
  }, [article.thumbnail_url, article.content, article.summary]);

  const showThumbnail = article.thumbnail_url && !hasImageInContent;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#090e18]">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-8 border-b border-gray-200 dark:border-gray-800/40 shrink-0">
        <span className="text-xs text-gray-500 uppercase tracking-widest font-mono truncate max-w-[200px] sm:max-w-xs">
          {article.feed_title || "RSS Article"}
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Navigation Button Group */}
          {(onPrev || onNext) && (
            <div className="flex items-center border border-gray-200 dark:border-gray-800/60 rounded-xl p-0.5 bg-gray-50/50 dark:bg-gray-900/20 mr-1 sm:mr-2">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-955 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                title="前の記事 (K)"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-800" />
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-955 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                title="次の記事 (J)"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {isArticleInInbox || isArticleInSomeday ? (
            <button
              disabled
              className="p-2 rounded-lg text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 cursor-not-allowed"
              title={isArticleInInbox ? "受信トレイ (後で読む) に追加済み" : "そのうち読む (Someday) に追加済み"}
            >
              <Check className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              onClick={() => handleSendArticleToInbox(article)}
              className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
              title="受信トレイ (後で読む) に送る"
            >
              <Inbox className="h-4.5 w-4.5" />
            </button>
          )}

          <button
            onClick={() => openPromoteModalForArticle(article)}
            className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all"
            title="ブックマークに登録 / 昇格"
          >
            <Bookmark className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => toggleArticleFavorite(article)}
            className={`p-2 rounded-lg hover:bg-rose-500/10 border border-transparent transition-all ${
              article.is_favorited ? "text-rose-500" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            title={article.is_favorited ? "お気に入り解除" : "お気に入り登録"}
          >
            <Heart className={`h-4.5 w-4.5 ${article.is_favorited ? "fill-current" : ""}`} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-955 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850/50 transition-all border border-transparent"
            title="閉じる"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="space-y-2 text-left p-0">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-snug">
            {article.title}
          </h1>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {article.published_at
                ? new Date(article.published_at).toLocaleString()
                : ""}
            </span>
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Original Source
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {showThumbnail && article.thumbnail_url && (
          <img
            src={article.thumbnail_url}
            className="w-full max-h-[360px] object-cover rounded-xl border border-gray-200 dark:border-gray-800"
            alt=""
          />
        )}

        {/* Summary or full content HTML */}
        <div
          className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed space-y-4 prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: article.content || article.summary || "No description provided.",
          }}
        />
      </div>
    </div>
  );
}
