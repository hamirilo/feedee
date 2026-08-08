"use client";

import * as React from "react";
import { useState } from "react";
import {
  CategoryData,
  TagData,
  SubscriptionData,
  InboxItemData,
  api,
} from "@/app/utils/api";
import { Section } from "@/app/page";
import {
  Inbox,
  Clock,
  Archive,
  Pin,
  Heart,
  Folder,
  Tag,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  LogOut,
  MoreVertical,
  Edit,
  Rss,
  Bookmark,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavItem } from "@/components/NavItem";

function FeedIcon({ url, faviconUrl, className = "w-3.5 h-3.5" }: { url: string; faviconUrl: string | null; className?: string }) {
  const [isError, setIsError] = useState(false);

  if (isError) {
    return <Rss className={`${className} text-orange-500 dark:text-orange-400 shrink-0`} />;
  }

  return (
    <img
      src={faviconUrl || `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`}
      className={`${className} rounded-sm object-contain shrink-0`}
      onError={() => setIsError(true)}
      alt=""
    />
  );
}

export interface SidebarProps {
  activeSection: Section;
  setActiveSection: (s: Section) => void;
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
  setNewCategoryScope: (scope: "rss" | "bookmark") => void;
  setShowAddCategory: (show: boolean) => void;
  setShowAddTag: (show: boolean) => void;
  setShowAddFeed: (show: boolean) => void;
  setEditingFeedId: (id: string | null) => void;
  setEditFeedDisplayName: (name: string) => void;
  setEditFeedCategory: (catId: string) => void;
  setShowEditFeed: (show: boolean) => void;
  handleLogout: () => void;
  loadInitialData: () => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

export function Sidebar({
  activeSection,
  setActiveSection,
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
  setNewCategoryScope,
  setShowAddCategory,
  setShowAddTag,
  setShowAddFeed,
  setEditingFeedId,
  setEditFeedDisplayName,
  setEditFeedCategory,
  setShowEditFeed,
  handleLogout,
  loadInitialData,
  showConfirm,
}: SidebarProps) {
  // Sidebar feed lists collapsed states
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const clearSubSelections = () => {
    setSelectedFeedId(null);
    setSelectedCategoryId(null);
    setSelectedTagId(null);
  };

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800/40 bg-white dark:bg-gray-900/20 backdrop-blur-xl flex flex-col justify-between shrink-0 transition-colors duration-200">
      <div className="flex flex-col overflow-y-auto grow">
        {/* LOGO & THEME SWITCHER */}
        <div className="h-16 px-6 border-b border-gray-200 dark:border-gray-800/40 flex items-center justify-between shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white tracking-tight">feedee</span>
          </div>

          <ThemeToggle />
        </div>

        {/* Navigation list */}
        <nav aria-label="メインナビゲーション" className="p-4 space-y-1 border-b border-gray-200 dark:border-gray-800/40 transition-colors duration-200">
          <NavItem
            isActive={activeSection === "inbox"}
            onClick={() => {
              setActiveSection("inbox");
              clearSubSelections();
            }}
            icon={<Inbox className="h-4 w-4" />}
            label="受信トレイ (後で読む)"
            count={inboxItems.length}
            activeColor="blue"
          />

          <NavItem
            isActive={activeSection === "someday"}
            onClick={() => {
              setActiveSection("someday");
              clearSubSelections();
            }}
            icon={<Clock className="h-4 w-4" />}
            label="いつか読む"
            count={somedayItems.length}
            activeColor="indigo"
          />

          <NavItem
            isActive={activeSection === "archive"}
            onClick={() => {
              setActiveSection("archive");
              clearSubSelections();
            }}
            icon={<Archive className="h-4 w-4" />}
            label="アーカイブ"
            count={archivedItems.length}
            activeColor="teal"
          />

          <NavItem
            isActive={activeSection === "pinned"}
            onClick={() => {
              setActiveSection("pinned");
              clearSubSelections();
            }}
            icon={<Pin className="h-4 w-4" />}
            label="ピン留め"
            activeColor="amber"
          />

          <NavItem
            isActive={activeSection === "favorites"}
            onClick={() => {
              setActiveSection("favorites");
              clearSubSelections();
            }}
            icon={<Heart className="h-4 w-4" />}
            label="お気に入り"
            activeColor="rose"
          />
        </nav>

        {/* Bookmarks Split */}
        <nav aria-label="ブックマークナビゲーション" className="p-4 space-y-1 border-b border-gray-200 dark:border-gray-800/40 transition-colors duration-200">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ブックマーク
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setNewCategoryScope("bookmark");
                  setShowAddCategory(true);
                }}
                className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="カテゴリ追加"
              >
                <Folder className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddTag(true)}
                className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="タグ追加"
              >
                <Tag className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <NavItem
            isActive={activeSection === "bookmarks_content" && selectedCategoryId === null && selectedTagId === null}
            onClick={() => {
              setActiveSection("bookmarks_content");
              clearSubSelections();
            }}
            icon={<Bookmark className="h-4 w-4" />}
            label="コンテンツブックマーク"
            activeColor="indigo"
          />

          <NavItem
            isActive={activeSection === "bookmarks_resource" && selectedCategoryId === null && selectedTagId === null}
            onClick={() => {
              setActiveSection("bookmarks_resource");
              clearSubSelections();
            }}
            icon={<ExternalLink className="h-4 w-4" />}
            label="リソースディレクトリ"
            activeColor="emerald"
          />

          {/* Bookmark Categories */}
          {categories.filter(c => c.scope === "bookmark").length > 0 && (
            <div className="pt-2">
              <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 px-3 uppercase tracking-wider mb-1">Categories</span>
              {categories.filter(c => c.scope === "bookmark").map((cat) => {
                const isCatActive = selectedCategoryId === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      if (activeSection !== "bookmarks_content" && activeSection !== "bookmarks_resource") {
                        setActiveSection("bookmarks_content");
                      }
                      setSelectedCategoryId(cat.id);
                      setSelectedTagId(null);
                    }}
                    className={`group flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors truncate cursor-pointer ${
                      isCatActive
                        ? "bg-indigo-600/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/10"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/20"
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="pt-2">
              <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 px-3 uppercase tracking-wider mb-1">Tags</span>
              <div className="flex flex-wrap gap-1.5 px-3 py-1">
                {tags.map((tag) => {
                  const isTagActive = selectedTagId === tag.id;
                  return (
                    <span
                      key={tag.id}
                      onClick={() => {
                        if (activeSection !== "bookmarks_content" && activeSection !== "bookmarks_resource") {
                          setActiveSection("bookmarks_content");
                        }
                        setSelectedTagId(isTagActive ? null : tag.id);
                        setSelectedCategoryId(null);
                      }}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-all border ${
                        isTagActive
                          ? "bg-blue-600/20 text-blue-500 border-blue-500/50"
                          : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/40 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-transparent"
                      }`}
                      style={{ borderLeftColor: tag.color, borderLeftWidth: "3px" }}
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* RSS Subscriptions */}
        <div className="p-4 flex-grow overflow-y-auto">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              RSS購読
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setNewCategoryScope("rss");
                  setShowAddCategory(true);
                }}
                className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="カテゴリ追加"
              >
                <Folder className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddFeed(true)}
                className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="フィード追加"
              >
                <PlusCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Categorized Feeds */}
          {categories.filter(c => c.scope === "rss").map((cat) => {
            const catSubs = subscriptions.filter(s => s.category_id === cat.id);
            if (catSubs.length === 0) return null;
            const isCollapsed = collapsedCategories[cat.id];
            return (
              <div key={cat.id} className="mb-2">
                <div
                  onClick={() => toggleCategoryCollapse(cat.id)}
                  className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1 truncate">
                    <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {isCollapsed ? <ChevronRight className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                </div>

                {!isCollapsed && (
                  <div className="pl-4 mt-0.5 space-y-0.5 border-l border-gray-100 dark:border-gray-800/40">
                    {catSubs.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setActiveSection("rss");
                          setSelectedFeedId(sub.id);
                          setSelectedCategoryId(null);
                        }}
                        className={`group flex w-full items-center justify-between px-2 py-1 text-[11px] font-medium rounded transition-colors truncate cursor-pointer ${
                          activeSection === "rss" && selectedFeedId === sub.id
                            ? "bg-blue-600/10 text-blue-500 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/10"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <FeedIcon url={sub.url} faviconUrl={sub.favicon_url} className="w-3 h-3" />
                          <span className="truncate">{sub.display_name || sub.title || sub.url}</span>
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-0.5 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                              >
                                <MoreVertical className="w-2.5 h-2.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 shadow-xl">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFeedId(sub.id);
                                  setEditFeedDisplayName(sub.display_name || sub.title || "");
                                  setEditFeedCategory(sub.category_id || "");
                                  setShowEditFeed(true);
                                }}
                                className="cursor-pointer text-xs"
                              >
                                編集
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirm("このフィードの購読を解除しますか？", () => {
                                    api.unsubscribeFeed(sub.id).then(() => { loadInitialData(); toast.info("フィードの購読を解除しました"); });
                                  });
                                }}
                                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/20 text-xs"
                              >
                                購読解除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized Feeds */}
          {subscriptions.filter(s => !s.category_id).length > 0 && (
            <div className="pt-2 space-y-0.5">
              <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 px-3 uppercase tracking-wider">Uncategorized</span>
              {subscriptions.filter(s => !s.category_id).map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => {
                    setActiveSection("rss");
                    setSelectedFeedId(sub.id);
                    setSelectedCategoryId(null);
                  }}
                  className={`group flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors truncate cursor-pointer ${
                    activeSection === "rss" && selectedFeedId === sub.id
                      ? "bg-blue-600/10 text-blue-500 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/20"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <FeedIcon url={sub.url} faviconUrl={sub.favicon_url} className="w-3.5 h-3.5" />
                    <span className="truncate">{sub.display_name || sub.title || sub.url}</span>
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-6 p-0.5 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 shadow-xl">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFeedId(sub.id);
                            setEditFeedDisplayName(sub.display_name || sub.title || "");
                            setEditFeedCategory(sub.category_id || "");
                            setShowEditFeed(true);
                          }}
                          className="cursor-pointer text-xs"
                        >
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirm("このフィードの購読を解除しますか？", () => {
                              api.unsubscribeFeed(sub.id).then(() => { loadInitialData(); toast.info("フィードの購読を解除しました"); });
                            });
                          }}
                          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/20 text-xs"
                        >
                          購読解除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User logout section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800/40 bg-gray-100/30 dark:bg-gray-950/40 flex items-center justify-between shrink-0 transition-colors duration-200">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Owner</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-900/30 transition-all h-8"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
