"use client";

import * as React from "react";
import { useState } from "react";
import {
  CategoryData,
  TagData,
  SubscriptionData,
  ArticleData,
  InboxItemData,
  BookmarkData,
  api,
} from "@/app/utils/api";
import {
  Search,
  ExternalLink,
  MoreVertical,
  Check,
  Star,
  Pin,
  Clock,
  Archive,
  Bookmark,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  LogOut,
  Edit,
  Trash2,
  AlertTriangle,
  Heart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Section } from "@/app/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 28 } }
};

export interface ContentAreaProps {
  activeSection: Section;
  selectedFeedId: string | null;
  setSelectedFeedId: (id: string | null) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  selectedTagId: string | null;
  setSelectedTagId: (id: string | null) => void;

  categories: CategoryData[];
  tags: TagData[];
  subscriptions: SubscriptionData[];
  inboxItems: InboxItemData[];
  somedayItems: InboxItemData[];
  archivedItems: InboxItemData[];
  bookmarks: BookmarkData[];
  rssItems: ArticleData[];

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  archiveSearchQuery: string;
  setArchiveSearchQuery: (q: string) => void;
  bookmarksSearchQuery: string;
  setBookmarksSearchQuery: (q: string) => void;

  rssFilterUnreadOnly: boolean;
  setRssFilterUnreadOnly: (unreadOnly: boolean) => void;
  rssFilterFav: boolean | undefined;
  setRssFilterFav: (fav: boolean | undefined) => void;

  // actions
  handleInboxAction: (itemId: string, action: "read" | "snooze" | "bookmark") => Promise<void>;
  handleSomedayAction: (itemId: string, action: "delete" | "unsnooze") => Promise<void>;
  handleArchiveAction: (itemId: string, action: "unarchive" | "delete") => Promise<void>;
  handleDeleteBookmark: (id: string) => Promise<void>;
  openPromoteModal: (item: InboxItemData, source: "inbox" | "someday") => void;

  // Bookmark edit bindings
  setEditingBookmarkId: (id: string | null) => void;
  setEditBookmarkTitle: (val: string) => void;
  setEditBookmarkType: (val: "content" | "resource") => void;
  setEditBookmarkCategory: (val: string) => void;
  setEditBookmarkNote: (val: string) => void;
  setEditBookmarkTags: (val: string[]) => void;
  setShowEditBookmark: (show: boolean) => void;

  // Bookmark toggle pin / fav
  toggleBookmarkPin: (bookmark: BookmarkData) => void;
  toggleBookmarkFavorite: (bookmark: BookmarkData) => void;

  // Selected article
  setSelectedArticle: (article: ArticleData | null) => void;
  handleArticleReadState: (article: ArticleData, isRead: boolean) => void;
  handleArticleFavState: (article: ArticleData, isFav: boolean) => void;

  showConfirm: (message: string, onConfirm: () => void) => void;
}

export function ContentArea({
  activeSection,
  selectedFeedId,
  setSelectedFeedId,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedTagId,
  setSelectedTagId,

  categories,
  tags,
  subscriptions,
  inboxItems,
  somedayItems,
  archivedItems,
  bookmarks,
  rssItems,

  searchQuery,
  setSearchQuery,
  archiveSearchQuery,
  setArchiveSearchQuery,
  bookmarksSearchQuery,
  setBookmarksSearchQuery,

  rssFilterUnreadOnly,
  setRssFilterUnreadOnly,
  rssFilterFav,
  setRssFilterFav,

  handleInboxAction,
  handleSomedayAction,
  handleArchiveAction,
  handleDeleteBookmark,
  openPromoteModal,

  setEditingBookmarkId,
  setEditBookmarkTitle,
  setEditBookmarkType,
  setEditBookmarkCategory,
  setEditBookmarkNote,
  setEditBookmarkTags,
  setShowEditBookmark,

  toggleBookmarkPin,
  toggleBookmarkFavorite,

  setSelectedArticle,
  handleArticleReadState,
  handleArticleFavState,

  showConfirm,
}: ContentAreaProps) {

  // Computed Values
  const activeFeed = selectedFeedId ? subscriptions.find((s) => s.id === selectedFeedId) : null;
  const activeCategory = selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId) : null;
  const activeTag = selectedTagId ? tags.find((t) => t.id === selectedTagId) : null;

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-[#070b14] transition-colors duration-200">
      {/* Workspace Header */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-800/40 bg-white/70 dark:bg-gray-900/10 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-10 transition-colors duration-200">
        <div className="flex items-center gap-6 grow max-w-md">
          {activeSection === "rss" && (
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 z-10" />
              <Input
                type="text"
                placeholder="フィード内の記事を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 h-9 bg-white/50 dark:bg-gray-950/40"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1 h-7 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-4">
          {activeSection === "rss" && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-900/40 p-1 rounded-xl border border-gray-200 dark:border-gray-800/60 shrink-0 gap-1">
              <Button
                variant={rssFilterUnreadOnly ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setRssFilterUnreadOnly(!rssFilterUnreadOnly)}
                className={`h-7 px-3 text-xs font-bold rounded-lg ${
                  rssFilterUnreadOnly ? "text-blue-600 dark:text-blue-400 shadow-sm bg-white dark:bg-gray-800" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                未読のみ
              </Button>
              <Button
                variant={rssFilterFav ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setRssFilterFav(!rssFilterFav)}
                className={`h-7 px-3 text-xs font-bold rounded-lg ${
                  rssFilterFav ? "text-rose-500 shadow-sm bg-white dark:bg-gray-800" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                ★ お気に入り
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* SECTION: INBOX */}
        {activeSection === "inbox" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">受信トレイ</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                RSSフィードから追加した未読、または後で読みたいブックマーク
              </p>
            </div>

            {inboxItems.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-gray-900/10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 transition-colors duration-200">
                <Check className="h-10 w-10 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">受信トレイは空です</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  すべてのタスクが完了しました！リラックスしてお過ごしください。
                </p>
              </div>
            ) : (
              <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {inboxItems.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="group flex flex-col md:flex-row gap-5 p-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800/40 dark:bg-gray-900/20 hover:border-gray-300 dark:hover:border-gray-700/50 hover:shadow-lg dark:hover:bg-gray-850/30 transition-all duration-200 shadow-md"
                  >
                    {item.thumbnail_url && (
                      <img
                        src={item.thumbnail_url}
                        className="w-full md:w-32 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-800 shrink-0"
                        alt=""
                      />
                    )}
                    <div className="flex flex-col justify-between grow">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title || "Untitled Link"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-mono truncate">{item.url}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4 shrink-0">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({ variant: "outline", size: "sm", className: "h-8 gap-1 px-3" })}
                          >
                            Open Link
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 shadow-xl">
                            <DropdownMenuItem
                              onClick={() => handleInboxAction(item.id, "read")}
                              className="cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 dark:focus:text-emerald-300 focus:bg-emerald-50 dark:focus:bg-emerald-950/20"
                            >
                              Mark Read (Done)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleInboxAction(item.id, "snooze")}
                              className="cursor-pointer text-indigo-600 dark:text-indigo-400 focus:text-indigo-700 dark:focus:text-indigo-300 focus:bg-indigo-50 dark:focus:bg-indigo-950/20"
                            >
                              Snooze to Someday
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleInboxAction(item.id, "bookmark")}
                              className="cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-700 dark:focus:text-amber-300 focus:bg-amber-50 dark:focus:bg-amber-950/20"
                            >
                              Promote to Bookmark
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* SECTION: SOMEDAY */}
        {activeSection === "someday" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">そのうち読む (Someday)</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                重要度は低いが、時間が空いたときに目を通したいコンテンツ
              </p>
            </div>

            {somedayItems.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-gray-900/10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 transition-colors duration-200">
                <Clock className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">保留リストは空です</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  「いつか読む」にスヌーズした記事がここに表示されます。
                </p>
              </div>
            ) : (
              <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {somedayItems.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="group flex flex-col md:flex-row gap-5 p-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800/40 dark:bg-gray-900/20 hover:border-gray-300 dark:hover:border-gray-700/50 hover:shadow-lg dark:hover:bg-gray-850/30 transition-all duration-200 shadow-md"
                  >
                    {item.thumbnail_url && (
                      <img
                        src={item.thumbnail_url}
                        className="w-full md:w-32 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-800 shrink-0"
                        alt=""
                      />
                    )}
                    <div className="flex flex-col justify-between grow">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.title || "Untitled Link"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-mono truncate">{item.url}</p>
                      </div>

                       <div className="flex items-center justify-between mt-4 shrink-0">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({ variant: "outline", size: "sm", className: "h-8 gap-1 px-3" })}
                          >
                            Open Link
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 shadow-xl">
                            <DropdownMenuItem
                              onClick={() => handleSomedayAction(item.id, "unsnooze")}
                              className="cursor-pointer text-blue-600 dark:text-blue-400 focus:text-blue-700 dark:focus:text-blue-300 focus:bg-blue-50 dark:focus:bg-blue-950/20"
                            >
                              Unsnooze (Move to Inbox)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openPromoteModal(item, "someday")}
                              className="cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-700 dark:focus:text-amber-300 focus:bg-amber-50 dark:focus:bg-amber-950/20"
                            >
                              Promote to Bookmark
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSomedayAction(item.id, "delete")}
                              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/20"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* SECTION: ARCHIVE */}
        {activeSection === "archive" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">アーカイブ</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  既読にした記事の履歴（タイトルやURLで検索可能）
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                  <Search className="h-4 w-4 text-gray-400" />
                </span>
                <Input
                  type="text"
                  placeholder="アーカイブ内を検索..."
                  value={archiveSearchQuery}
                  onChange={(e) => setArchiveSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-12 h-9 bg-white/50 dark:bg-gray-950/40"
                />
                {archiveSearchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setArchiveSearchQuery("")}
                    className="absolute right-1 top-1 h-7 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {archivedItems.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-gray-900/10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 transition-colors duration-200">
                <Archive className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {archiveSearchQuery ? "条件にマッチするアイテムが見つかりません。" : "アーカイブされたアイテムはありません。"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col md:flex-row gap-5 p-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800/40 dark:bg-gray-900/20 hover:border-gray-300 dark:hover:border-gray-700/50 transition-all shadow-md"
                  >
                    {item.thumbnail_url && (
                      <img
                        src={item.thumbnail_url}
                        className="w-full md:w-32 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-800 shrink-0"
                        alt=""
                      />
                    )}
                    <div className="flex flex-col justify-between grow">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {item.title || "Untitled Link"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-mono truncate">{item.url}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{item.description}</p>
                        {item.archived_at && (
                          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                            既読日: {new Date(item.archived_at).toLocaleString()}
                          </p>
                        )}
                      </div>

                       <div className="flex items-center justify-between mt-4 shrink-0">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({ variant: "outline", size: "sm", className: "h-8 gap-1 px-3" })}
                          >
                            Open Link
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 shadow-xl">
                            <DropdownMenuItem
                              onClick={() => handleArchiveAction(item.id, "unarchive")}
                              className="cursor-pointer text-teal-600 dark:text-teal-400 focus:text-teal-700 dark:focus:text-teal-300 focus:bg-teal-50 dark:focus:bg-teal-950/20"
                            >
                              受信トレイに戻す
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                showConfirm("このアイテムをアーカイブから完全に削除しますか？", () => {
                                  handleArchiveAction(item.id, "delete");
                                });
                              }}
                              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/20"
                            >
                              完全に削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTIONS: BOOKMARKS */}
        {(activeSection === "bookmarks_content" || activeSection === "bookmarks_resource") && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {activeSection === "bookmarks_content" ? "コンテンツブックマーク" : "リソースディレクトリ"}
                  {activeCategory && <span className="text-lg font-bold text-gray-400 dark:text-gray-500 ml-2">/ {activeCategory.name}</span>}
                  {activeTag && <span className="text-lg font-bold text-gray-400 dark:text-gray-500 ml-2">/ #{activeTag.name}</span>}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {activeSection === "bookmarks_content"
                    ? "保存した技術コラム、ニュース、長文記事などの管理"
                    : "開発ツール、ライブラリ、Webサイトのディレクトリ管理"}
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                  <Search className="h-4 w-4 text-gray-400" />
                </span>
                <Input
                  type="text"
                  placeholder="ブックマーク内を検索..."
                  value={bookmarksSearchQuery}
                  onChange={(e) => setBookmarksSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-12 h-9 bg-white/50 dark:bg-gray-950/40"
                />
                {bookmarksSearchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBookmarksSearchQuery("")}
                    className="absolute right-1 top-1 h-7 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {bookmarks.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-gray-900/10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 transition-colors duration-200">
                <Bookmark className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {bookmarksSearchQuery ? "条件にマッチするブックマークが見つかりません。" : "ブックマークはありません。"}
                </p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {bookmarks.map((bookmark) => (
                  <motion.div
                    key={bookmark.id}
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group flex flex-col justify-between p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-2xl dark:hover:bg-gray-850/20 transition-all duration-200 shadow-lg"
                  >
                    <div>
                      {bookmark.thumbnail_url && (
                        <img
                          src={bookmark.thumbnail_url}
                          className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-800 mb-4"
                          alt=""
                        />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[150px]">
                          {(() => {
                            try {
                              return new URL(bookmark.url).hostname;
                            } catch {
                              return bookmark.url;
                            }
                          })()}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmarkPin(bookmark);
                            }}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                              bookmark.is_pinned ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                            }`}
                            title={bookmark.is_pinned ? "ピン留めを解除" : "ピン留めする"}
                          >
                            <Pin className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmarkFavorite(bookmark);
                            }}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                              bookmark.is_favorited ? "text-amber-500 dark:text-amber-400" : "text-gray-400 dark:text-gray-500"
                            }`}
                            title={bookmark.is_favorited ? "お気に入りから削除" : "お気に入りに追加"}
                          >
                            <Star className={`w-3.5 h-3.5 ${bookmark.is_favorited ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 break-all">
                        {bookmark.title || bookmark.url}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-3">{bookmark.description}</p>
                      {bookmark.note && (
                        <div className="p-3 text-xs bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/40 text-gray-600 dark:text-gray-400 rounded-lg mt-3">
                          <strong className="text-gray-700 dark:text-gray-300 block mb-0.5">メモ:</strong>
                          {bookmark.note}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-200 dark:border-gray-800/40 shrink-0">
                      <div className="flex flex-wrap gap-1">
                        {bookmark.tags.map((t) => (
                          <span
                            key={t.id}
                            style={{ backgroundColor: t.color + "20", color: t.color }}
                            className="px-2 py-0.5 text-[10px] font-bold rounded"
                          >
                            #{t.name}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonVariants({ variant: "outline", size: "icon", className: "h-8 w-8 text-gray-700 dark:text-white" })}
                          title="ページを開く"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32 bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 shadow-xl">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingBookmarkId(bookmark.id);
                                setEditBookmarkTitle(bookmark.title || "");
                                setEditBookmarkType(bookmark.bookmark_type);
                                setEditBookmarkCategory(bookmark.category_id || "");
                                setEditBookmarkNote(bookmark.note || "");
                                setEditBookmarkTags(bookmark.tags.map(t => t.id));
                                setShowEditBookmark(true);
                              }}
                              className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800"
                            >
                              編集
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteBookmark(bookmark.id)}
                              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/20"
                            >
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* SECTION: RSS (Feed Detail article list) */}
        {activeSection === "rss" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {activeFeed ? activeFeed.display_name || activeFeed.title : "すべてのRSS記事"}
              </h1>
              {activeFeed && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 truncate">
                  URL: {activeFeed.url}
                </p>
              )}
            </div>

            {rssItems.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-gray-900/10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 transition-colors duration-200">
                <AlertTriangle className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  表示する記事が見つかりません。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rssItems.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => {
                      setSelectedArticle(article);
                      // Mark read automatically
                      if (!article.is_read) {
                        handleArticleReadState(article, true);
                      }
                    }}
                    className={`group flex flex-col md:flex-row gap-5 p-5 rounded-xl border transition-all cursor-pointer shadow-md bg-white hover:border-gray-300 dark:bg-gray-900/20 dark:hover:border-gray-700 ${
                      article.is_read
                        ? "border-gray-200 opacity-60 dark:border-gray-800/40"
                        : "border-blue-200 dark:border-blue-900/30 ring-1 ring-blue-500/10"
                    }`}
                  >
                    {article.thumbnail_url && (
                      <img
                        src={article.thumbnail_url}
                        className="w-full md:w-32 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-800 shrink-0"
                        alt=""
                      />
                    )}
                    <div className="flex flex-col justify-between grow min-w-0">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                            {article.feed_title || "RSS Feed"}
                          </span>
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleArticleReadState(article, !article.is_read)}
                              className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                                article.is_read ? "text-gray-400" : "text-blue-600 dark:text-blue-400"
                              }`}
                              title={article.is_read ? "未読にする" : "既読にする"}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleArticleFavState(article, !article.is_favorited)}
                              className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                                article.is_favorited ? "text-rose-500" : "text-gray-400"
                              }`}
                              title={article.is_favorited ? "お気に入り解除" : "お気に入り登録"}
                            >
                              <Heart className={`w-3.5 h-3.5 ${article.is_favorited ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        </div>

                        <h3 className={`text-base font-bold mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 ${
                          article.is_read ? "text-gray-700 dark:text-gray-400" : "text-gray-900 dark:text-white"
                        }`}>
                          {article.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                          {article.published_at ? new Date(article.published_at).toLocaleString() : ""}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{article.summary}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
