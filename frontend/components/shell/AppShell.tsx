import React, { useEffect, useState } from "react";
import { DashboardView } from "../dashboard/DashboardView";
import { InboxView } from "../inbox/InboxView";
import { SavedView } from "../saved/SavedView";
import { SettingsView } from "../settings/SettingsView";
import type {
  AppMode,
  ArticleItem,
  BookmarkCategory,
  BookmarkItem,
  BookmarkTag,
  DisplaySettings,
  FeedGroup,
  FeedItem,
  UserStats,
} from "../types";
import { AppHeader } from "./AppHeader";
import { ContextSidebar } from "./ContextSidebar";
import { NavRail } from "./NavRail";

export interface AppShellProps {
  initialMode?: AppMode;
  initialArticles?: ArticleItem[];
  initialFeeds?: FeedItem[];
  initialCategories?: BookmarkCategory[];
  initialTags?: BookmarkTag[];
  initialBookmarks?: BookmarkItem[];
  initialStats?: UserStats;
  userEmail?: string;
  csrfToken?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  initialMode = "dashboard",
  initialArticles = [],
  initialFeeds = [],
  initialCategories = [],
  initialTags = [],
  initialBookmarks = [],
  initialStats,
  userEmail = "user@example.com",
  csrfToken = "",
}) => {
  const [currentMode, setCurrentMode] = useState<AppMode>(initialMode);
  const [selectedFilter, setSelectedFilter] = useState<string>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsSection, setSettingsSection] = useState<
    "feeds" | "categories" | "display" | "account"
  >("feeds");
  const [savedViewMode, setSavedViewMode] = useState<"list" | "gallery" | "panel">("list");

  // Data states
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles);
  const [feeds, setFeeds] = useState<FeedItem[]>(initialFeeds);
  const [categories, setCategories] = useState<BookmarkCategory[]>(initialCategories);
  const [tags, setTags] = useState<BookmarkTag[]>(initialTags);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(initialBookmarks);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(
    initialArticles[0]?.id || null,
  );

  const [stats, setStats] = useState<UserStats>(
    initialStats || {
      unread_total: initialArticles.filter((a) => !a.is_read).length || 51,
      read_later_total: initialArticles.filter((a) => a.is_read_later).length || 6,
      bookmarks_total: initialBookmarks.length || 184,
      completion_rate: 68,
      unread_breakdown: [
        { label: "はてブ テクノロジー", count: 23, percentage: 80 },
        { label: "Publickey", count: 12, percentage: 42 },
        { label: "Zenn Trending", count: 8, percentage: 28 },
      ],
    },
  );

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    default_order: "newest",
    items_per_page: 50,
    theme: "light",
    default_view: "list",
  });

  // Calculate Feed Groups for sidebar
  const feedGroups: FeedGroup[] = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const f of feeds) {
      const g = f.group_name || "General";
      map.set(g, (map.get(g) || 0) + (f.item_count || 1));
    }
    return Array.from(map.entries()).map(([name, count], idx) => ({
      id: String(idx + 1),
      name,
      count,
    }));
  }, [feeds]);

  // Fetch initial data if empty
  useEffect(() => {
    // If running in browser and data is empty, attempt to load from Django API
    if (articles.length === 0) {
      fetch("/app/articles?status=unread")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.items)) {
            setArticles(data.items);
            if (data.items.length > 0) setSelectedArticleId(data.items[0].id);
          }
        })
        .catch(() => {});
    }
  }, [articles.length]);

  // Mode changes
  const handleSelectMode = (mode: AppMode) => {
    setCurrentMode(mode);
    if (mode === "dashboard") setSelectedFilter("today");
    if (mode === "inbox") setSelectedFilter("unread");
    if (mode === "saved") setSelectedFilter("all");
  };

  // Breadcrumbs calculation
  const breadcrumbs = React.useMemo(() => {
    if (currentMode === "dashboard") {
      return [{ label: "ダッシュボード" }, { label: "今日のフィード", active: true }];
    }
    if (currentMode === "inbox") {
      const art = articles.find((a) => a.id === selectedArticleId);
      return [{ label: "受信箱" }, { label: art ? art.feed_title : "すべての記事", active: true }];
    }
    if (currentMode === "settings") {
      const secMap = {
        feeds: "フィード",
        categories: "分類・タグ",
        display: "表示",
        account: "アカウント",
      };
      return [{ label: "設定" }, { label: secMap[settingsSection], active: true }];
    }
    return [{ label: "保存" }, { label: "すべての保存", active: true }];
  }, [currentMode, selectedArticleId, articles, settingsSection]);

  // Filtered Articles
  const filteredArticles = React.useMemo(() => {
    let list = [...articles];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.feed_title.toLowerCase().includes(q),
      );
    }
    if (selectedFilter === "read-later") {
      list = list.filter((a) => a.is_read_later);
    } else if (selectedFilter === "unread") {
      list = list.filter((a) => !a.is_read);
    }
    return list;
  }, [articles, searchQuery, selectedFilter]);

  // Article Action Handlers
  const handleMarkRead = async (articleId: number) => {
    setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, is_read: true } : a)));
    setStats((prev) => ({
      ...prev,
      unread_total: Math.max(0, prev.unread_total - 1),
    }));
    try {
      await fetch(`/app/reading/articles/${articleId}/read`, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken, "Content-Type": "application/json" },
      });
    } catch {}
  };

  const handleMarkReadLater = async (articleId: number) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, is_read_later: !a.is_read_later } : a)),
    );
    try {
      await fetch(`/app/reading/articles/${articleId}/read-later`, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken, "Content-Type": "application/json" },
      });
    } catch {}
  };

  const handleToggleBookmark = async (articleId: number) => {
    const art = articles.find((a) => a.id === articleId);
    if (!art) return;
    const nextState = !art.is_bookmarked;
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, is_bookmarked: nextState } : a)),
    );
    if (nextState) {
      const newBm: BookmarkItem = {
        id: Date.now(),
        title: art.title,
        url: art.url,
        description: art.summary,
        domain: new URL(art.url).hostname,
        tags: [],
        created_at: "たった今",
        is_read_later: false,
        is_favorite: false,
        is_archived: false,
      };
      setBookmarks((prev) => [newBm, ...prev]);
    }
  };

  const handleMarkReadAndNext = () => {
    if (!selectedArticleId) return;
    handleMarkRead(selectedArticleId);
    const currentIndex = filteredArticles.findIndex((a) => a.id === selectedArticleId);
    if (currentIndex >= 0 && currentIndex < filteredArticles.length - 1) {
      setSelectedArticleId(filteredArticles[currentIndex + 1].id);
    }
  };

  // Feed Management Handlers
  const handleAddFeed = async (newFeed: { title: string; url: string; group_name: string }) => {
    const item: FeedItem = {
      id: Date.now(),
      title: newFeed.title,
      url: newFeed.url,
      group_name: newFeed.group_name,
      is_active: true,
      item_count: 0,
    };
    setFeeds((prev) => [item, ...prev]);
    try {
      await fetch("/app/feeds", {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken, "Content-Type": "application/json" },
        body: JSON.stringify(newFeed),
      });
    } catch {}
  };

  const handleUpdateFeed = async (updatedFeed: FeedItem) => {
    setFeeds((prev) => prev.map((f) => (f.id === updatedFeed.id ? updatedFeed : f)));
    try {
      await fetch(`/app/feeds/${updatedFeed.id}`, {
        method: "PUT",
        headers: { "X-CSRFToken": csrfToken, "Content-Type": "application/json" },
        body: JSON.stringify(updatedFeed),
      });
    } catch {}
  };

  const handleDeleteFeed = async (feedId: number) => {
    setFeeds((prev) => prev.filter((f) => f.id !== feedId));
    try {
      await fetch(`/app/feeds/${feedId}`, {
        method: "DELETE",
        headers: { "X-CSRFToken": csrfToken },
      });
    } catch {}
  };

  return (
    <div className="w-full h-screen flex overflow-hidden bg-[var(--color-background)] font-sans text-[var(--color-foreground)] select-none">
      {/* 64px Fixed Nav Rail (5a) */}
      <NavRail
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        unreadCount={stats.unread_total}
        userInitial={userEmail[0] || "U"}
      />

      {/* Context Sidebar (5a / 5b / 5c) */}
      <ContextSidebar
        currentMode={currentMode}
        unreadTotal={stats.unread_total}
        readLaterTotal={stats.read_later_total}
        bookmarksTotal={stats.bookmarks_total}
        feedGroups={feedGroups}
        categories={categories}
        tags={tags}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        settingsSection={settingsSection}
        onSelectSettingsSection={setSettingsSection}
        onOpenAddFeedModal={() => {
          setCurrentMode("settings");
          setSettingsSection("feeds");
        }}
        onOpenAddBookmarkModal={() => {
          setCurrentMode("saved");
        }}
        onExportOpml={() => {
          window.location.href = "/api/opml/export/";
        }}
        onImportOpml={() => {
          setCurrentMode("settings");
          setSettingsSection("feeds");
        }}
      />

      {/* Main Workspace Area (Header + Content) */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <AppHeader
          currentMode={currentMode}
          breadcrumbs={breadcrumbs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefreshFeeds={() => window.location.reload()}
          onMarkAllRead={() => {
            setArticles((prev) => prev.map((a) => ({ ...a, is_read: true })));
            setStats((prev) => ({ ...prev, unread_total: 0 }));
          }}
          onOpenInbox={() => handleSelectMode("inbox")}
          onMarkReadLater={() => selectedArticleId && handleMarkReadLater(selectedArticleId)}
          onOpenOriginal={() => {
            const art = articles.find((a) => a.id === selectedArticleId);
            if (art) window.open(art.url, "_blank");
          }}
          onMarkReadAndNext={handleMarkReadAndNext}
          onOpenAddFeed={() => {
            setCurrentMode("settings");
            setSettingsSection("feeds");
          }}
          savedViewMode={savedViewMode}
          onChangeSavedViewMode={setSavedViewMode}
        />

        {/* View Switcher */}
        {currentMode === "dashboard" && (
          <DashboardView
            articles={filteredArticles}
            stats={stats}
            onSelectArticle={(art) => {
              setSelectedArticleId(art.id);
              handleSelectMode("inbox");
            }}
            onOpenInbox={() => handleSelectMode("inbox")}
          />
        )}

        {currentMode === "inbox" && (
          <InboxView
            articles={filteredArticles}
            selectedArticleId={selectedArticleId}
            onSelectArticle={(art) => setSelectedArticleId(art.id)}
            onMarkRead={handleMarkRead}
            onMarkReadLater={handleMarkReadLater}
            onToggleBookmark={handleToggleBookmark}
            onMarkReadAndNext={handleMarkReadAndNext}
          />
        )}

        {currentMode === "saved" && (
          <SavedView
            bookmarks={bookmarks}
            categories={categories}
            tags={tags}
            viewMode={savedViewMode}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            onToggleFavorite={(id) =>
              setBookmarks((prev) =>
                prev.map((b) => (b.id === id ? { ...b, is_favorite: !b.is_favorite } : b)),
              )
            }
            onToggleReadLater={(id) =>
              setBookmarks((prev) =>
                prev.map((b) => (b.id === id ? { ...b, is_read_later: !b.is_read_later } : b)),
              )
            }
            onDeleteBookmark={(id) => setBookmarks((prev) => prev.filter((b) => b.id !== id))}
            onUpdateBookmark={(bm) =>
              setBookmarks((prev) => prev.map((b) => (b.id === bm.id ? bm : b)))
            }
            onOpenAddModal={() => {}}
          />
        )}

        {currentMode === "settings" && (
          <SettingsView
            section={settingsSection}
            feeds={feeds}
            categories={categories}
            tags={tags}
            displaySettings={displaySettings}
            userEmail={userEmail}
            onAddFeed={handleAddFeed}
            onUpdateFeed={handleUpdateFeed}
            onDeleteFeed={handleDeleteFeed}
            onUpdateDisplaySettings={setDisplaySettings}
            onAddCategory={async (c) => {
              setCategories((prev) => [
                ...prev,
                { id: Date.now(), name: c.name, color: c.color, count: 0 },
              ]);
            }}
            onAddTag={async (t) => {
              setTags((prev) => [
                ...prev,
                { id: Date.now(), name: t.name, color: t.color, count: 0 },
              ]);
            }}
            onChangePassword={async () => {}}
          />
        )}
      </div>
    </div>
  );
};
