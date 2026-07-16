"use client";

import * as React from "react";
import { ArticleData, InboxItemData } from "@/app/utils/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Check,
  Inbox,
  Bookmark,
  Heart,
  X,
  ExternalLink,
} from "lucide-react";

export interface ArticleReaderSheetProps {
  selectedArticle: ArticleData | null;
  setSelectedArticle: (article: ArticleData | null) => void;
  inboxItems: InboxItemData[];
  somedayItems: InboxItemData[];
  handleSendArticleToInbox: (article: ArticleData) => void;
  openPromoteModalForArticle: (article: ArticleData) => void;
  toggleArticleFavorite: (article: ArticleData) => void;
}

export function ArticleReaderSheet({
  selectedArticle,
  setSelectedArticle,
  inboxItems,
  somedayItems,
  handleSendArticleToInbox,
  openPromoteModalForArticle,
  toggleArticleFavorite,
}: ArticleReaderSheetProps) {
  const isArticleInInbox = selectedArticle
    ? inboxItems.some((item) => item.article_id === selectedArticle.id)
    : false;
  const isArticleInSomeday = selectedArticle
    ? somedayItems.some((item) => item.article_id === selectedArticle.id)
    : false;

  return (
    <Sheet open={!!selectedArticle} onOpenChange={(open) => { if (!open) setSelectedArticle(null); }}>
      <SheetContent showCloseButton={false} className="w-full max-w-2xl sm:max-w-2xl h-full bg-white dark:bg-[#090e18] border-l border-gray-200 dark:border-gray-800 p-0 flex flex-col justify-between shadow-2xl">
        {selectedArticle && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-8 border-b border-gray-200 dark:border-gray-800/40 shrink-0">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                {selectedArticle.feed_title || "RSS Article"}
              </span>
              <div className="flex items-center gap-2">
                {isArticleInInbox || isArticleInSomeday ? (
                  <button
                    disabled
                    className="p-2 rounded-lg text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 cursor-not-allowed"
                    title={isArticleInInbox ? "受信トレイ (後で読む) に追加済み" : "そのうち読む (Someday) に追加済み"}
                  >
                    <Check className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendArticleToInbox(selectedArticle)}
                    className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
                    title="受信トレイ (後で読む) に送る"
                  >
                    <Inbox className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => openPromoteModalForArticle(selectedArticle)}
                  className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all"
                  title="ブックマークに登録 / 昇格"
                >
                  <Bookmark className="h-5 w-5" />
                </button>
                <button
                  onClick={() => toggleArticleFavorite(selectedArticle)}
                  className={`p-2 rounded-lg hover:bg-rose-500/10 border border-transparent transition-all ${
                    selectedArticle.is_favorited ? "text-rose-500" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  title={selectedArticle.is_favorited ? "お気に入り解除" : "お気に入り登録"}
                >
                  <Heart className={`h-5 w-5 ${selectedArticle.is_favorited ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all border border-transparent"
                  title="閉じる"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <SheetHeader className="space-y-2 text-left p-0">
                <SheetTitle className="text-2xl font-black text-gray-900 dark:text-white leading-snug">{selectedArticle.title}</SheetTitle>
                <SheetDescription className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {selectedArticle.published_at
                      ? new Date(selectedArticle.published_at).toLocaleString()
                      : ""}
                  </span>
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Original Source
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </SheetDescription>
              </SheetHeader>

              {selectedArticle.thumbnail_url && (
                <img
                  src={selectedArticle.thumbnail_url}
                  className="w-full max-h-[300px] object-cover rounded-xl border border-gray-200 dark:border-gray-800"
                  alt=""
                />
              )}

              {/* Summary or full content HTML */}
              <div
                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{
                  __html: selectedArticle.content || selectedArticle.summary || "No description provided.",
                }}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
