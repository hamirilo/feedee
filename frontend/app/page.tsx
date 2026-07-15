"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  TOKEN_KEY,
  CategoryData,
  TagData,
  SubscriptionData,
  ArticleData,
  InboxItemData,
  BookmarkData,
} from "@/app/utils/api";
import {
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Folder,
  Grid,
  Hash,
  Heart,
  Inbox,
  List,
  LogOut,
  Plus,
  PlusCircle,
  Search,
  Star,
  Sun,
  Moon,
  Tag,
  Trash2,
  Pin,
  Edit,
  X,
  Rss,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";

type Section = "inbox" | "someday" | "bookmarks_content" | "bookmarks_resource" | "rss" | "pinned" | "favorites";

// ===== Toast System =====
type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const base = "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium backdrop-blur-xl border pointer-events-auto cursor-pointer min-w-[260px] max-w-[360px] transition-all duration-300 animate-in slide-in-from-bottom-4";
        const styles: Record<ToastType, string> = {
          success: `${base} bg-emerald-950/90 border-emerald-500/30 text-emerald-100`,
          error:   `${base} bg-red-950/90 border-red-500/30 text-red-100`,
          info:    `${base} bg-gray-900/90 border-gray-600/30 text-gray-100`,
        };
        const icons: Record<ToastType, JSX.Element> = {
          success: <Check className="w-4 h-4 text-emerald-400 shrink-0" />,
          error:   <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />,
          info:    <Info className="w-4 h-4 text-blue-400 shrink-0" />,
        };
        return (
          <div key={t.id} className={styles[t.type]} onClick={() => onDismiss(t.id)}>
            {icons[t.type]}
            <span className="flex-1 leading-snug">{t.message}</span>
            <X className="w-3.5 h-3.5 opacity-50 shrink-0" />
          </div>
        );
      })}
    </div>
  );
}

// ===== Confirm Dialog =====
interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-200 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            実行する
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedIcon({ url, faviconUrl, className = "w-3.5 h-3.5" }: { url: string; faviconUrl: string | null; className?: string }) {
  const [isError, setIsError] = useState(false);

  if (isError) {
    return <Rss className={`${className} text-orange-500 dark:text-orange-400 shrink-0`} />;
  }

  const domain = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const src = faviconUrl || "https://www.google.com/s2/favicons?domain=" + domain;

  return (
    <img
      src={src}
      className={`${className} rounded shrink-0`}
      onError={() => setIsError(true)}
      alt=""
    />
  );
}

export default function Dashboard() {
  const router = useRouter();

  // Navigation & UI state
  const [activeSection, setActiveSection] = useState<Section>("inbox");
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  }, []);

  // Data state
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [tags, setTags] = useState<TagData[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItemData[]>([]);
  const [somedayItems, setSomedayItems] = useState<InboxItemData[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);

  // Modals & Form states
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkData | null>(null);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState("");
  const [newFeedName, setNewFeedName] = useState("");

  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("");
  const [newBookmarkTitle, setNewBookmarkTitle] = useState("");
  const [newBookmarkType, setNewBookmarkType] = useState<"content" | "resource">("content");
  const [newBookmarkCategory, setNewBookmarkCategory] = useState("");
  const [newBookmarkNote, setNewBookmarkNote] = useState("");
  const [newBookmarkTags, setNewBookmarkTags] = useState<string[]>([]);
  
  // Edit Bookmark Form states
  const [showEditBookmark, setShowEditBookmark] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editBookmarkTitle, setEditBookmarkTitle] = useState("");
  const [editBookmarkType, setEditBookmarkType] = useState<"content" | "resource">("content");
  const [editBookmarkCategory, setEditBookmarkCategory] = useState("");
  const [editBookmarkNote, setEditBookmarkNote] = useState("");
  const [editBookmarkTags, setEditBookmarkTags] = useState<string[]>([]);

  // Edit Feed Form states
  const [showEditFeed, setShowEditFeed] = useState(false);
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editFeedDisplayName, setEditFeedDisplayName] = useState("");
  const [editFeedCategory, setEditFeedCategory] = useState("");

  // RSS Filter States
  const [rssFilterRead, setRssFilterRead] = useState<boolean | undefined>(undefined);
  const [rssFilterFav, setRssFilterFav] = useState<boolean | undefined>(undefined);

  // Favorites subtab state
  const [favSubTab, setFavSubTab] = useState<"articles" | "bookmarks">("articles");

  // Category creation states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6b7280");
  const [newCategoryScope, setNewCategoryScope] = useState<"rss" | "bookmark">("bookmark");

  // Tag creation states
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6b7280");

  const isArticleInInbox = selectedArticle ? inboxItems.some(item => item.article_id === selectedArticle.id) : false;
  const isArticleInSomeday = selectedArticle ? somedayItems.some(item => item.article_id === selectedArticle.id) : false;

  // Load basic items on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.push("/login");
      return;
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    loadInitialData();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };


  const loadInitialData = async () => {
    try {
      const [catsData, tagsData, subsData, inboxData, somedayData] = await Promise.all([
        api.getCategories(),
        api.getTags(),
        api.getSubscriptions(),
        api.getInbox(),
        api.getSomeday(),
      ]);
      setCategories(catsData);
      setTags(tagsData);
      setSubscriptions(subsData);
      setInboxItems(inboxData);
      setSomedayItems(somedayData);

      // Load active section content
      refreshSectionContent(activeSection);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const refreshSectionContent = async (section: Section, feedId: string | null = null, catId: string | null = null, tagId: string | null = null) => {
    try {
      if (section === "inbox") {
        const data = await api.getInbox();
        setInboxItems(data);
      } else if (section === "someday") {
        const data = await api.getSomeday();
        setSomedayItems(data);
      } else if (section === "bookmarks_content") {
        const data = await api.getBookmarks({
          bookmarkType: "content",
          categoryId: catId || undefined,
          tagId: tagId || undefined,
        });
        setBookmarks(data);
      } else if (section === "bookmarks_resource") {
        const data = await api.getBookmarks({
          bookmarkType: "resource",
          categoryId: catId || undefined,
          tagId: tagId || undefined,
        });
        setBookmarks(data);
      } else if (section === "rss") {
        const data = await api.getArticles({
          feedId: feedId || undefined,
          categoryId: catId || undefined,
          isRead: rssFilterRead,
          isFavorited: rssFilterFav,
        });
        setArticles(data);
      } else if (section === "pinned") {
        const data = await api.getBookmarks({
          isPinned: true,
        });
        setBookmarks(data);
      } else if (section === "favorites") {
        const [favBookmarks, favArticles] = await Promise.all([
          api.getBookmarks({ isFavorited: true }),
          api.getArticles({ isFavorited: true }),
        ]);
        setBookmarks(favBookmarks);
        setArticles(favArticles);
      }
    } catch (err) {
      console.error(`Failed to refresh ${section} content`, err);
    }
  };

  // Trigger content reload when section/filter changes
  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) {
      refreshSectionContent(activeSection, selectedFeedId, selectedCategoryId, selectedTagId);
    }
  }, [activeSection, selectedFeedId, selectedCategoryId, selectedTagId, rssFilterRead, rssFilterFav]);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    router.push("/login");
  };

  // Add Category Handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCategory(newCategoryName, newCategoryColor, newCategoryScope);
      setShowAddCategory(false);
      setNewCategoryName("");
      setNewCategoryColor("#6b7280");
      loadInitialData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create category");
    }
  };

  // Add Tag Handler
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTag(newTagName, newTagColor);
      setShowAddTag(false);
      setNewTagName("");
      setNewTagColor("#6b7280");
      loadInitialData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create tag");
    }
  };

  // Add Feed Handler
  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.subscribeFeed(newFeedUrl, newFeedCategory || null, newFeedName || undefined);
      setShowAddFeed(false);
      setNewFeedUrl("");
      setNewFeedName("");
      setNewFeedCategory("");
      const subsData = await api.getSubscriptions();
      setSubscriptions(subsData);
      showToast("success", "フィードを登録しました");
    } catch (err: any) {
      showToast("error", err.message || "Failed to subscribe to feed");
    }
  };

  // Add Bookmark Handler
  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBookmark({
        url: newBookmarkUrl,
        title: newBookmarkTitle || null,
        bookmarkType: newBookmarkType,
        categoryId: newBookmarkCategory || null,
        note: newBookmarkNote || null,
        tagIds: newBookmarkTags,
      });
      setShowAddBookmark(false);
      setNewBookmarkUrl("");
      setNewBookmarkTitle("");
      setNewBookmarkCategory("");
      setNewBookmarkNote("");
      setNewBookmarkTags([]);
      refreshSectionContent(activeSection, selectedFeedId, selectedCategoryId, selectedTagId);
      showToast("success", "ブックマークを追加しました");
    } catch (err: any) {
      showToast("error", err.message || "Failed to create bookmark");
    }
  };

  // Edit Bookmark Handler
  const handleEditBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBookmarkId) return;
    try {
      await api.updateBookmark(editingBookmarkId, {
        title: editBookmarkTitle || null,
        note: editBookmarkNote || null,
        bookmarkType: editBookmarkType,
        categoryId: editBookmarkCategory || null,
        tagIds: editBookmarkTags,
      });
      setShowEditBookmark(false);
      setEditingBookmarkId(null);
      setEditBookmarkTitle("");
      setEditBookmarkNote("");
      setEditBookmarkTags([]);
      refreshSectionContent(activeSection, selectedFeedId, selectedCategoryId, selectedTagId);
      showToast("success", "ブックマークを更新しました");
    } catch (err: any) {
      showToast("error", err.message || "Failed to update bookmark");
    }
  };

  // Edit Feed Handler
  const handleEditFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedId) return;
    try {
      await api.updateSubscription(editingFeedId, {
        displayName: editFeedDisplayName || null,
        categoryId: editFeedCategory || null,
      });
      setShowEditFeed(false);
      setEditingFeedId(null);
      setEditFeedDisplayName("");
      setEditFeedCategory("");
      loadInitialData(); // Reload both feeds list and feed articles
      showToast("success", "フィードを更新しました");
    } catch (err: any) {
      showToast("error", err.message || "Failed to update feed");
    }
  };

  // Read Later Pipeline Operations
  const handleInboxAction = async (itemId: string, action: "read" | "snooze" | "bookmark") => {
    try {
      if (action === "read") {
        await api.deleteInboxItem(itemId);
      } else if (action === "snooze") {
        await api.snoozeItem(itemId);
      } else if (action === "bookmark") {
        const item = inboxItems.find((i) => i.id === itemId);
        if (item) {
          await api.createBookmark({
            url: item.url || "",
            title: item.title,
            description: item.description,
            thumbnailUrl: item.thumbnail_url,
            bookmarkType: "content",
          });
          await api.deleteInboxItem(itemId);
        }
      }
      loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSomedayAction = async (itemId: string, action: "delete" | "unsnooze") => {
    try {
      if (action === "delete") {
        await api.deleteSomedayItem(itemId);
      } else if (action === "unsnooze") {
        await api.unsnoozeItem(itemId);
      }
      loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  // Article View Detail & Reader
  const openArticleReader = async (article: ArticleData) => {
    setSelectedArticle(article);
    if (!article.is_read) {
      try {
        await api.markArticleRead(article.id);
        // Refresh local articles list state to mark as read
        setArticles(articles.map(a => a.id === article.id ? { ...a, is_read: true } : a));
        // Update inbox badge counts
        const inboxData = await api.getInbox();
        setInboxItems(inboxData);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleArticleFavorite = async (article: ArticleData) => {
    try {
      if (article.is_favorited) {
        await api.unfavoriteArticle(article.id);
        setArticles(articles.map(a => a.id === article.id ? { ...a, is_favorited: false } : a));
        if (selectedArticle?.id === article.id) {
          setSelectedArticle({ ...selectedArticle, is_favorited: false });
        }
      } else {
        await api.favoriteArticle(article.id);
        setArticles(articles.map(a => a.id === article.id ? { ...a, is_favorited: true } : a));
        if (selectedArticle?.id === article.id) {
          setSelectedArticle({ ...selectedArticle, is_favorited: true });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendArticleToInbox = async (article: ArticleData) => {
    try {
      await api.addToInbox({ articleId: article.id });
      showToast("success", "受信トレイに追加しました");
      loadInitialData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to add to Inbox");
    }
  };

  // Bookmark Actions
  const toggleBookmarkFavorite = async (b: BookmarkData) => {
    try {
      if (b.is_favorited) {
        await api.unfavoriteBookmark(b.id);
      } else {
        await api.favoriteBookmark(b.id);
      }
      refreshSectionContent(activeSection, selectedFeedId, selectedCategoryId, selectedTagId);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBookmarkPin = async (b: BookmarkData) => {
    try {
      if (b.is_pinned) {
        await api.unpinBookmark(b.id);
      } else {
        await api.pinBookmark(b.id);
      }
      refreshSectionContent(activeSection, selectedFeedId, selectedCategoryId, selectedTagId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    showConfirm("このブックマークを削除しますか？", async () => {
      setConfirmDialog(null);
      try {
        await api.deleteBookmark(id);
        refreshSectionContent(activeSection, selectedFeedId, selectedCategoryId, selectedTagId);
        showToast("success", "ブックマークを削除しました");
      } catch (err) {
        console.error(err);
        showToast("error", "削除に失敗しました");
      }
    });
  };

  // Filter lists based on Search Query
  const filteredInbox = inboxItems.filter((i) =>
    (i.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSomeday = somedayItems.filter((i) =>
    (i.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredArticles = articles.filter((a) =>
    (a.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredBookmarks = bookmarks.filter((b) =>
    (b.title || b.url || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#070b14] text-gray-700 dark:text-gray-200 overflow-hidden font-sans transition-colors duration-200">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800/40 bg-white dark:bg-gray-900/20 backdrop-blur-xl flex flex-col justify-between shrink-0 transition-colors duration-200">
        <div className="flex flex-col overflow-y-auto grow">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 gap-3 border-b border-gray-200 dark:border-gray-800/40 shrink-0 transition-colors duration-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/10">
              <BookOpen className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Feedee v2
            </span>
          </div>

          {/* Read Later Pipeline */}
          <nav className="p-4 space-y-1 border-b border-gray-200 dark:border-gray-800/40 transition-colors duration-200">
            <button
              onClick={() => {
                setActiveSection("inbox");
                setSelectedFeedId(null);
                setSelectedCategoryId(null);
                setSelectedTagId(null);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === "inbox"
                  ? "bg-blue-600/10 text-blue-500 dark:text-blue-400 border border-blue-500/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
              }`}
            >

              <span className="flex items-center gap-2.5">
                <Inbox className="h-4 w-4" />
                受信トレイ (後で読む)
              </span>
              {inboxItems.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600/20 text-blue-400">
                  {inboxItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("someday");
                setSelectedFeedId(null);
                setSelectedCategoryId(null);
                setSelectedTagId(null);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === "someday"
                  ? "bg-indigo-600/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="h-4 w-4" />
                いつか読む
              </span>
              {somedayItems.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-600/20 text-indigo-500 dark:text-indigo-400">
                  {somedayItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("pinned");
                setSelectedFeedId(null);
                setSelectedCategoryId(null);
                setSelectedTagId(null);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === "pinned"
                  ? "bg-amber-600/10 text-amber-500 dark:text-amber-400 border border-amber-500/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Pin className="h-4 w-4" />
                ピン留め
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection("favorites");
                setSelectedFeedId(null);
                setSelectedCategoryId(null);
                setSelectedTagId(null);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === "favorites"
                  ? "bg-rose-600/10 text-rose-500 dark:text-rose-400 border border-rose-500/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Heart className="h-4 w-4" />
                お気に入り
              </span>
            </button>
          </nav>
          
          {/* Bookmarks Split */}
          <nav className="p-4 space-y-1 border-b border-gray-200 dark:border-gray-800/40 transition-colors duration-200">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ブックマーク
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setNewCategoryScope("bookmark");
                    setShowAddCategory(true);
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="カテゴリ追加"
                >
                  <Folder className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setShowAddTag(true)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="タグ追加"
                >
                  <Tag className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
            <button
              onClick={() => {
                setActiveSection("bookmarks_content");
                setSelectedFeedId(null);
                setSelectedCategoryId(null);
                setSelectedTagId(null);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === "bookmarks_content" && selectedCategoryId === null && selectedTagId === null
                  ? "bg-indigo-600/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              コンテンツブックマーク
            </button>
            <button
              onClick={() => {
                setActiveSection("bookmarks_resource");
                setSelectedFeedId(null);
                setSelectedCategoryId(null);
                setSelectedTagId(null);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === "bookmarks_resource" && selectedCategoryId === null && selectedTagId === null
                  ? "bg-emerald-600/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
              }`}
            >
              <ExternalLink className="h-4 w-4" />
              リソースディレクトリ
            </button>

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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setNewCategoryScope("rss");
                    setShowAddCategory(true);
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="カテゴリ追加"
                >
                  <Folder className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setShowAddFeed(true)}
                  className="text-gray-500 dark:text-gray-455 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Add Feed"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveSection("rss");
                  setSelectedFeedId(null);
                  setSelectedCategoryId(null);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === "rss" && selectedFeedId === null && selectedCategoryId === null
                    ? "bg-blue-600/10 text-blue-500 dark:text-blue-400 border border-blue-500/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
                }`}
              >
                <List className="h-4 w-4" />
                All RSS Articles
              </button>

              {/* RSS Categories */}
              {categories.filter(c => c.scope === "rss").map((cat) => {
                const catFeeds = subscriptions.filter(s => s.category_id === cat.id);
                const isCatActive = activeSection === "rss" && selectedCategoryId === cat.id;
                return (
                  <div key={cat.id} className="space-y-0.5">
                    <div
                      onClick={() => {
                        setActiveSection("rss");
                        setSelectedFeedId(null);
                        setSelectedCategoryId(cat.id);
                      }}
                      className={`group flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isCatActive
                          ? "bg-blue-600/10 text-blue-500 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/20"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Folder className="w-3.5 h-3.5" style={{ color: cat.color }} />
                        <span className="truncate">{cat.name}</span>
                      </span>
                    </div>
                    {/* Feeds under this category */}
                    <div className="pl-4 border-l border-gray-200 dark:border-gray-800/60 ml-4 space-y-0.5">
                      {catFeeds.map((sub) => (
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
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFeedId(sub.id);
                                setEditFeedDisplayName(sub.display_name || sub.title || "");
                                setEditFeedCategory(sub.category_id || "");
                                setShowEditFeed(true);
                              }}
                              className="text-gray-500 hover:text-blue-400 p-0.5 transition-colors"
                              title="編集"
                            >
                              <Edit className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showConfirm("このフィードの購読を解除しますか？", () => {
                                  setConfirmDialog(null);
                                  api.unsubscribeFeed(sub.id).then(() => { loadInitialData(); showToast("info", "フィードの購読を解除しました"); });
                                });
                              }}
                              className="text-gray-500 hover:text-red-400 text-[10px] font-bold p-0.5 transition-colors"
                              title="購読解除"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFeedId(sub.id);
                            setEditFeedDisplayName(sub.display_name || sub.title || "");
                            setEditFeedCategory(sub.category_id || "");
                            setShowEditFeed(true);
                          }}
                          className="text-gray-500 hover:text-blue-400 p-0.5 transition-colors"
                          title="編集"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirm("このフィードの購読を解除しますか？", () => {
                              setConfirmDialog(null);
                              api.unsubscribeFeed(sub.id).then(() => { loadInitialData(); showToast("info", "フィードの購読を解除しました"); });
                            });
                          }}
                          className="text-gray-500 hover:text-red-400 text-sm font-bold p-0.5 transition-colors"
                          title="購読解除"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* User logout section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800/40 bg-gray-100/30 dark:bg-gray-950/40 flex items-center justify-between shrink-0 transition-colors duration-200">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Owner</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-900/30 border border-transparent transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>


      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-[#070b14] transition-colors duration-200">
        {/* Workspace Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800/40 bg-white/70 dark:bg-gray-900/10 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-10 transition-colors duration-200">
          <div className="flex items-center gap-6 grow max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-gray-950/30 placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-950/20 transition-colors shadow-sm"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            {/* View Mode controls */}
            {(activeSection === "rss" || (activeSection === "favorites" && favSubTab === "articles")) && (
              <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-800 p-0.5 bg-white dark:bg-gray-950/30">
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "card"
                      ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                      : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                      : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            )}


            {/* RSS Specific filter toggles */}
            {activeSection === "rss" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRssFilterRead(rssFilterRead === undefined ? false : rssFilterRead === false ? true : undefined)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    rssFilterRead === false
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : rssFilterRead === true
                      ? "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-400"
                      : "border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-950/20"
                  }`}
                >
                  {rssFilterRead === false ? "Unread Only" : rssFilterRead === true ? "Read Only" : "All Read/Unread"}
                </button>
              </div>
            )}

            {/* Add Bookmarks button */}
            {(activeSection === "bookmarks_content" || activeSection === "bookmarks_resource") && (
              <button
                onClick={() => setShowAddBookmark(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Bookmark
              </button>
            )}
          </div>
        </header>

        {/* Workspace Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Subtabs for Favorites view */}
          {activeSection === "favorites" && (
            <div className="flex border-b border-gray-200 dark:border-gray-800/40 pb-px mb-6 transition-colors duration-200">
              <button
                onClick={() => setFavSubTab("articles")}
                className={`py-2 px-4 text-sm font-semibold border-b-2 transition-all ${
                  favSubTab === "articles"
                    ? "border-rose-500 text-rose-500 dark:text-rose-400"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                お気に入り記事
              </button>
              <button
                onClick={() => setFavSubTab("bookmarks")}
                className={`py-2 px-4 text-sm font-semibold border-b-2 transition-all ${
                  favSubTab === "bookmarks"
                    ? "border-rose-500 text-rose-500 dark:text-rose-400"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                お気に入りブックマーク
              </button>
            </div>
          )}

          {/* SECTION: INBOX */}
          {activeSection === "inbox" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Inbox (Read Later)</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Process your inbox queue sequentially</p>
              </div>

              {filteredInbox.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/10">
                  <Inbox className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Your read later queue is empty!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredInbox.map((item) => (
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
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title || "Untitled Link"}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-mono truncate">{item.url}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-3 mt-4 shrink-0">
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-700 dark:text-white transition-colors"
                            >
                              Open Link
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleInboxAction(item.id, "read")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                          >
                            Mark Read (Done)
                          </button>
                          <button
                            onClick={() => handleInboxAction(item.id, "snooze")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                          >
                            Snooze to Someday
                          </button>
                          <button
                            onClick={() => handleInboxAction(item.id, "bookmark")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/10 hover:bg-amber-600/20 text-amber-600 dark:text-amber-400 transition-colors"
                          >
                            Promote to Bookmark
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION: SOMEDAY */}
          {activeSection === "someday" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Someday Queue</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Read whenever you have spare time</p>
              </div>

              {filteredSomeday.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/10">
                  <Clock className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No items kept here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredSomeday.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col md:flex-row gap-5 p-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800/40 dark:bg-gray-900/20 hover:border-gray-300 dark:hover:border-gray-700/50 transition-all shadow-md"
                    >
                      <div className="flex flex-col justify-between grow">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.title || "Untitled Link"}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-mono truncate">{item.url}</p>
                        </div>

                        <div className="flex items-center gap-3 mt-4 shrink-0">
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-700 dark:text-white transition-colors"
                            >
                              Open Link
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleSomedayAction(item.id, "unsnooze")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            Unsnooze (Move to Inbox)
                          </button>
                          <button
                            onClick={() => handleSomedayAction(item.id, "delete")}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:border-red-800/30 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION: RSS ARTICLES */}
          {(activeSection === "rss" || (activeSection === "favorites" && favSubTab === "articles")) && (
            <div className="space-y-6">
              <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                  {activeSection === "favorites"
                    ? "お気に入り記事"
                    : selectedFeedId
                    ? subscriptions.find((s) => s.id === selectedFeedId)?.display_name || "Feed Articles"
                    : selectedCategoryId
                    ? (
                      <>
                        Aggregated RSS Articles
                        <span className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 ml-2">
                          カテゴリ: {categories.find(c => c.id === selectedCategoryId)?.name || ""}
                        </span>
                      </>
                    )
                    : "Aggregated RSS Articles"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {activeSection === "favorites" ? "お気に入りに登録されたRSS記事" : "Read your subscribed channels"}
                </p>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/10">
                  <List className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No articles fetched. Wait for worker sync.</p>
                </div>
              ) : viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article) => (
                    <article
                      key={article.id}
                      onClick={() => openArticleReader(article)}
                      className={`group flex flex-col justify-between p-5 rounded-xl border transition-all shadow-lg hover:shadow-xl cursor-pointer ${
                        article.is_read
                          ? "border-gray-200 bg-gray-100/60 dark:border-gray-800/30 dark:bg-gray-900/40 opacity-60"
                          : "border-gray-200 bg-white hover:border-gray-350 dark:border-gray-800 dark:bg-gray-900/30 dark:hover:border-gray-700"
                      }`}
                    >
                      <div>
                        {article.thumbnail_url && (
                          <img
                            src={article.thumbnail_url}
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-800 mb-4"
                            alt=""
                          />
                        )}
                        <span className="text-xs text-gray-500 font-medium">
                          {article.feed_title || "RSS Feed"}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-3">{article.summary}</p>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-250 dark:border-gray-800/40 shrink-0">
                        <span className="text-xs text-gray-500">
                          {article.published_at
                            ? new Date(article.published_at).toLocaleDateString()
                            : "No Date"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleArticleFavorite(article);
                            }}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                              article.is_favorited ? "text-amber-400" : "text-gray-500"
                            }`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 bg-white dark:border-gray-800/40 dark:bg-gray-900/30 rounded-xl divide-y divide-gray-200 dark:divide-gray-800/40 shadow-md">
                  {filteredArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => openArticleReader(article)}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-all ${
                        article.is_read ? "opacity-60" : "font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 pr-4">
                        <span className="text-xs text-gray-500 truncate w-32 shrink-0">
                          {article.feed_title || "RSS Feed"}
                        </span>
                        <span className="text-sm text-gray-800 dark:text-white truncate max-w-lg">{article.title}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                        <span>
                          {article.published_at
                            ? new Date(article.published_at).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION: BOOKMARKS */}
          {(activeSection === "bookmarks_content" ||
            activeSection === "bookmarks_resource" ||
            activeSection === "pinned" ||
            (activeSection === "favorites" && favSubTab === "bookmarks")) && (
            <div className="space-y-6">
              <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                  {activeSection === "pinned" && "ピン留め一覧"}
                  {activeSection === "favorites" && "お気に入りブックマーク"}
                  {(activeSection === "bookmarks_content" || activeSection === "bookmarks_resource") && (
                    <>
                      {activeSection === "bookmarks_content" && "コンテンツアーカイブ"}
                      {activeSection === "bookmarks_resource" && "リソースディレクトリ"}
                      {selectedCategoryId && (
                        <span className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 ml-2">
                          カテゴリ: {categories.find(c => c.id === selectedCategoryId)?.name || ""}
                        </span>
                      )}
                      {selectedTagId && (
                        <span className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 ml-2">
                          タグ: {tags.find(t => t.id === selectedTagId)?.name || ""}
                        </span>
                      )}
                    </>
                  )}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {activeSection === "bookmarks_content" && "永久に保存された長文記事、アイデア、コラム"}
                  {activeSection === "bookmarks_resource" && "開発ツールキット、アイコン、ライブラリ、ユーティリティ"}
                  {activeSection === "pinned" && "ピン留めされたブックマーク"}
                  {activeSection === "favorites" && "お気に入りに登録されたブックマーク"}
                </p>
              </div>

              {filteredBookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl bg-gray-900/5 dark:bg-gray-900/10">
                  <Bookmark className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">ブックマークはまだ登録されていません。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="group flex flex-col justify-between p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-lg"
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
                          <button
                            onClick={() => {
                              setEditingBookmarkId(bookmark.id);
                              setEditBookmarkTitle(bookmark.title || "");
                              setEditBookmarkType(bookmark.bookmark_type);
                              setEditBookmarkCategory(bookmark.category_id || "");
                              setEditBookmarkNote(bookmark.note || "");
                              setEditBookmarkTags(bookmark.tags.map(t => t.id));
                              setShowEditBookmark(true);
                            }}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors"
                            title="編集"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors"
                            title="ページを開く"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent dark:border-red-900/20 transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* 3. MODALS & FORMS OVERLAYS */}

      {/* MODAL: Article Reader */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl h-full bg-white dark:bg-[#090e18] border-l border-gray-200 dark:border-gray-800 flex flex-col justify-between shadow-2xl animate-slide-in">
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
              <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-snug">{selectedArticle.title}</h1>
              <div className="flex items-center justify-between text-xs text-gray-500">
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
              </div>

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
          </div>
        </div>
      )}

      {/* FORM MODAL: Add Category */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#090e18] shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Category</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technology, Design"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Scope
                </label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="category-scope"
                      value="bookmark"
                      checked={newCategoryScope === "bookmark"}
                      onChange={() => setNewCategoryScope("bookmark")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Bookmarks
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="category-scope"
                      value="rss"
                      checked={newCategoryScope === "rss"}
                      onChange={() => setNewCategoryScope("rss")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    RSS Feeds
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Category Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-10 h-10 rounded border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    placeholder="#6b7280"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: Add Tag */}
      {showAddTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#090e18] shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Tag</h2>
            <form onSubmit={handleAddTag} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. javascript, tutorial"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Tag Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-10 h-10 rounded border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    placeholder="#6b7280"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTag(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: Add Feed */}
      {showAddFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#090e18] shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Subscribe to RSS Feed</h2>
            <form onSubmit={handleAddFeed} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Feed XML URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/feed.xml"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="My favorite blog"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFeed(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: Add Bookmark */}
      {showAddBookmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#090e18] shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Bookmark</h2>
            <form onSubmit={handleAddBookmark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/article"
                  value={newBookmarkUrl}
                  onChange={(e) => setNewBookmarkUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Stunning design system"
                  value={newBookmarkTitle}
                  onChange={(e) => setNewBookmarkTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Content */}
                  <label
                    onClick={() => setNewBookmarkType("content")}
                    className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all ${
                      newBookmarkType === "content"
                        ? "border-blue-600 bg-blue-500/5 ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-500/5"
                        : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">
                          コンテンツ
                        </span>
                        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                          コラム、ニュース、長文記事など
                        </span>
                      </div>
                    </div>
                    <div className={`shrink-0 self-center ${newBookmarkType === "content" ? "text-blue-500" : "text-transparent"}`}>
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </label>

                  {/* Option 2: Resource */}
                  <label
                    onClick={() => setNewBookmarkType("resource")}
                    className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all ${
                      newBookmarkType === "resource"
                        ? "border-blue-600 bg-blue-500/5 ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-500/5"
                        : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">
                          リソース
                        </span>
                        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                          開発ツール、ライブラリ、Webサイトなど
                        </span>
                      </div>
                    </div>
                    <div className={`shrink-0 self-center ${newBookmarkType === "resource" ? "text-blue-500" : "text-transparent"}`}>
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
                <select
                  value={newBookmarkCategory}
                  onChange={(e) => setNewBookmarkCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                >
                  <option value="">No Category</option>
                  {categories
                    .filter((c) => c.scope === "bookmark")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border border-gray-300 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-950/40">
                  {tags.map((t) => {
                    const isSelected = newBookmarkTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewBookmarkTags(newBookmarkTags.filter((id) => id !== t.id));
                          } else {
                            setNewBookmarkTags([...newBookmarkTags, t.id]);
                          }
                        }}
                        style={{
                          backgroundColor: isSelected ? t.color + "30" : "transparent",
                          borderColor: isSelected ? t.color : (theme === "dark" ? "rgb(31, 41, 55)" : "rgb(229, 231, 235)"),
                          color: isSelected ? t.color : (theme === "dark" ? "rgb(156, 163, 175)" : "rgb(107, 114, 128)"),
                        }}
                        className="px-2 py-0.5 text-xs font-semibold rounded border transition-all"
                      >
                        #{t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Personal Note (Optional)
                </label>
                <textarea
                  placeholder="Why is this valuable? Key insights..."
                  value={newBookmarkNote}
                  onChange={(e) => setNewBookmarkNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookmark(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: Edit Bookmark */}
      {showEditBookmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#090e18] shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Bookmark</h2>
            <form onSubmit={handleEditBookmark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Bookmark title"
                  value={editBookmarkTitle}
                  onChange={(e) => setEditBookmarkTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Content */}
                  <label
                    onClick={() => setEditBookmarkType("content")}
                    className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all ${
                      editBookmarkType === "content"
                        ? "border-blue-600 bg-blue-500/5 ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-500/5"
                        : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">
                          コンテンツ
                        </span>
                        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                          コラム、ニュース、長文記事など
                        </span>
                      </div>
                    </div>
                    <div className={`shrink-0 self-center ${editBookmarkType === "content" ? "text-blue-500" : "text-transparent"}`}>
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </label>

                  {/* Option 2: Resource */}
                  <label
                    onClick={() => setEditBookmarkType("resource")}
                    className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all ${
                      editBookmarkType === "resource"
                        ? "border-blue-600 bg-blue-500/5 ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-500/5"
                        : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">
                          リソース
                        </span>
                        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                          開発ツール、ライブラリ、Webサイトなど
                        </span>
                      </div>
                    </div>
                    <div className={`shrink-0 self-center ${editBookmarkType === "resource" ? "text-blue-500" : "text-transparent"}`}>
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
                <select
                  value={editBookmarkCategory}
                  onChange={(e) => setEditBookmarkCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                >
                  <option value="">No Category</option>
                  {categories
                    .filter((c) => c.scope === "bookmark")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border border-gray-300 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                  {tags.map((t) => {
                    const isSelected = editBookmarkTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditBookmarkTags(editBookmarkTags.filter((id) => id !== t.id));
                          } else {
                            setEditBookmarkTags([...editBookmarkTags, t.id]);
                          }
                        }}
                        style={{
                          backgroundColor: isSelected ? t.color + "30" : "transparent",
                          borderColor: isSelected ? t.color : (theme === "dark" ? "rgb(31, 41, 55)" : "rgb(229, 231, 235)"),
                          color: isSelected ? t.color : (theme === "dark" ? "rgb(156, 163, 175)" : "rgb(107, 114, 128)"),
                        }}
                        className="px-2 py-0.5 text-xs font-semibold rounded border transition-all"
                      >
                        #{t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Personal Note (Optional)
                </label>
                <textarea
                  placeholder="Why is this valuable? Key insights..."
                  value={editBookmarkNote}
                  onChange={(e) => setEditBookmarkNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-800/40 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBookmark(false);
                    setEditingBookmarkId(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: Edit Feed */}
      {showEditFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#090e18] shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit RSS Feed</h2>
            <form onSubmit={handleEditFeed} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Feed display name"
                  value={editFeedDisplayName}
                  onChange={(e) => setEditFeedDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
                <select
                  value={editFeedCategory}
                  onChange={(e) => setEditFeedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm dark:border-gray-800 dark:bg-gray-800/40 dark:text-white"
                >
                  <option value="">No Category</option>
                  {categories
                    .filter((c) => c.scope === "rss")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditFeed(false);
                    setEditingFeedId(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
