"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
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
} from "lucide-react";

type Section = "inbox" | "someday" | "bookmarks_content" | "bookmarks_resource" | "rss";

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

  // RSS Filter States
  const [rssFilterRead, setRssFilterRead] = useState<boolean | undefined>(undefined);
  const [rssFilterFav, setRssFilterFav] = useState<boolean | undefined>(undefined);

  // Load basic items on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
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
      }
    } catch (err) {
      console.error(`Failed to refresh ${section} content`, err);
    }
  };

  // Trigger content reload when section/filter changes
  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      refreshSectionContent(activeSection, selectedFeedId, selectedCategoryId, selectedTagId);
    }
  }, [activeSection, selectedFeedId, selectedCategoryId, selectedTagId, rssFilterRead, rssFilterFav]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
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
    } catch (err: any) {
      alert(err.message || "Failed to subscribe to feed");
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
    } catch (err: any) {
      alert(err.message || "Failed to create bookmark");
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
      alert("Sent to Inbox!");
      loadInitialData();
    } catch (err: any) {
      alert(err.message || "Failed to add to Inbox");
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
    if (confirm("Are you sure you want to delete this bookmark?")) {
      try {
        await api.deleteBookmark(id);
        refreshSectionContent(activeSection, selectedFeedId, selectedCategoryId, selectedTagId);
      } catch (err) {
        console.error(err);
      }
    }
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
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800/40 bg-white dark:bg-gray-900/20 backdrop-blur-xl flex flex-col justify-between shrink-0 transition-colors duration-200">
        <div className="flex flex-col overflow-y-auto grow">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 gap-3 border-b border-gray-200 dark:border-gray-800/40 shrink-0 transition-colors duration-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/10">
              <BookOpen className="h-4.5 w-4.5 text-white" />
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
                Inbox (Later)
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
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-955 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="h-4 w-4" />
                Someday
              </span>
              {somedayItems.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-600/20 text-indigo-500 dark:text-indigo-400">
                  {somedayItems.length}
                </span>
              )}
            </button>
          </nav>

          {/* Bookmarks Split */}
          <nav className="p-4 space-y-1 border-b border-gray-200 dark:border-gray-800/40 transition-colors duration-200">
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Bookmarks
            </span>
            <button
              onClick={() => {
                setActiveSection("bookmarks_content");
                setSelectedFeedId(null);
                setSelectedCategoryId(null);
                setSelectedTagId(null);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === "bookmarks_content"
                  ? "bg-indigo-600/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-955 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Content Bookmarks
            </button>
            <button
              onClick={() => {
                setActiveSection("bookmarks_resource");
                setSelectedFeedId(null);
                setSelectedCategoryId(null);
                setSelectedTagId(null);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === "bookmarks_resource"
                  ? "bg-emerald-600/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-955 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
              }`}
            >
              <ExternalLink className="h-4 w-4" />
              Resource Directory
            </button>
          </nav>


          {/* RSS Subscriptions */}
          <div className="p-4 flex-grow">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                RSS Subscriptions
              </span>
              <button
                onClick={() => setShowAddFeed(true)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Add Feed"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
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
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-955 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 border border-transparent"
                }`}
              >
                <List className="h-4 w-4" />
                All RSS Articles
              </button>

              {/* Dynamic categories or single subscriptions */}
              {subscriptions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setActiveSection("rss");
                    setSelectedFeedId(sub.id);
                    setSelectedCategoryId(null);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors truncate ${
                    activeSection === "rss" && selectedFeedId === sub.id
                      ? "bg-blue-600/10 text-blue-500 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-955 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/20"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <img
                      src={sub.favicon_url || "https://www.google.com/s2/favicons?domain=" + sub.url}
                      className="w-3.5 h-3.5 rounded shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/favicon.ico";
                      }}
                      alt=""
                    />
                    <span className="truncate">{sub.display_name || sub.title || sub.url}</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Unsubscribe?")) {
                        api.unsubscribeFeed(sub.id).then(() => loadInitialData());
                      }
                    }}
                    className="text-gray-600 hover:text-red-400 opacity-0 hover:opacity-100 transition-opacity p-0.5"
                  >
                    ×
                  </button>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User logout section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800/40 bg-gray-100/30 dark:bg-gray-950/40 flex items-center justify-between shrink-0 transition-colors duration-200">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Owner</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-red-100 dark:hover:bg-red-955/30 hover:border-red-900/30 border border-transparent transition-all"
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
            {activeSection === "rss" && (
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
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : rssFilterRead === true
                      ? "border-gray-700 bg-gray-800/30 text-gray-400"
                      : "border-gray-800 text-gray-500 hover:text-white"
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
          {/* SECTION: INBOX */}
          {activeSection === "inbox" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold text-white">Inbox (Read Later)</h1>
                <p className="text-gray-400 text-sm mt-1">Process your inbox queue sequentially</p>
              </div>

              {filteredInbox.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                  <Inbox className="h-10 w-10 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-sm">Your read later queue is empty!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredInbox.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col md:flex-row gap-5 p-5 rounded-xl border border-gray-800/40 bg-gray-900/20 backdrop-blur-xl hover:border-gray-700/50 transition-all shadow-md"
                    >
                      {item.thumbnail_url && (
                        <img
                          src={item.thumbnail_url}
                          className="w-full md:w-32 h-20 object-cover rounded-lg border border-gray-800 shrink-0"
                          alt=""
                        />
                      )}
                      <div className="flex flex-col justify-between grow">
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                            {item.title || "Untitled Link"}
                          </h3>
                          <p className="text-gray-400 text-xs mt-1 font-mono truncate">{item.url}</p>
                          <p className="text-gray-400 text-sm mt-2 line-clamp-2">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-3 mt-4 shrink-0">
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800/80 hover:bg-gray-700 text-white transition-colors"
                            >
                              Open Link
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleInboxAction(item.id, "read")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 transition-colors"
                          >
                            Mark Read (Done)
                          </button>
                          <button
                            onClick={() => handleInboxAction(item.id, "snooze")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 transition-colors"
                          >
                            Snooze to Someday
                          </button>
                          <button
                            onClick={() => handleInboxAction(item.id, "bookmark")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 transition-colors"
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
                <h1 className="text-3xl font-extrabold text-white">Someday Queue</h1>
                <p className="text-gray-400 text-sm mt-1">Read whenever you have spare time</p>
              </div>

              {filteredSomeday.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                  <Clock className="h-10 w-10 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-sm">No items kept here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredSomeday.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col md:flex-row gap-5 p-5 rounded-xl border border-gray-800/40 bg-gray-900/20 hover:border-gray-700/50 transition-all shadow-md"
                    >
                      <div className="flex flex-col justify-between grow">
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {item.title || "Untitled Link"}
                          </h3>
                          <p className="text-gray-400 text-xs mt-1 font-mono truncate">{item.url}</p>
                        </div>

                        <div className="flex items-center gap-3 mt-4 shrink-0">
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800/80 hover:bg-gray-700 text-white transition-colors"
                            >
                              Open Link
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleSomedayAction(item.id, "unsnooze")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-colors"
                          >
                            Unsnooze (Move to Inbox)
                          </button>
                          <button
                            onClick={() => handleSomedayAction(item.id, "delete")}
                            className="p-1.5 rounded-lg bg-red-950/20 border border-red-900/20 text-red-400 hover:bg-red-900/30 hover:border-red-800/30 transition-colors"
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
          {activeSection === "rss" && (
            <div className="space-y-6">
              <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold text-white">
                  {selectedFeedId
                    ? subscriptions.find((s) => s.id === selectedFeedId)?.display_name || "Feed Articles"
                    : "Aggregated RSS Articles"}
                </h1>
                <p className="text-gray-400 text-sm mt-1">Read your subscribed channels</p>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                  <List className="h-10 w-10 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-sm">No articles fetched. Wait for worker sync.</p>
                </div>
              ) : viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article) => (
                    <article
                      key={article.id}
                      onClick={() => openArticleReader(article)}
                      className={`group flex flex-col justify-between p-5 rounded-xl border transition-all shadow-lg hover:shadow-xl cursor-pointer ${
                        article.is_read
                          ? "border-gray-800/40 bg-gray-950/20 opacity-70"
                          : "border-gray-800 bg-gray-900/30 hover:border-gray-700"
                      }`}
                    >
                      <div>
                        {article.thumbnail_url && (
                          <img
                            src={article.thumbnail_url}
                            className="w-full h-40 object-cover rounded-lg border border-gray-800 mb-4"
                            alt=""
                          />
                        )}
                        <span className="text-xs text-gray-500 font-medium">
                          {article.feed_title || "RSS Feed"}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-400 text-sm mt-2 line-clamp-3">{article.summary}</p>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-800/40 shrink-0">
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
                            className={`p-1.5 rounded-lg hover:bg-gray-800 transition-colors ${
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
                <div className="border border-gray-800/40 bg-gray-950/20 backdrop-blur-xl rounded-xl divide-y divide-gray-800/40 shadow-lg">
                  {filteredArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => openArticleReader(article)}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-900/20 transition-all ${
                        article.is_read ? "opacity-60" : "font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 pr-4">
                        <span className="text-xs text-gray-500 truncate w-32 shrink-0">
                          {article.feed_title || "RSS Feed"}
                        </span>
                        <span className="text-sm text-white truncate max-w-lg">{article.title}</span>
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
          {(activeSection === "bookmarks_content" || activeSection === "bookmarks_resource") && (
            <div className="space-y-6">
              <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold text-white">
                  {activeSection === "bookmarks_content" ? "Content Archive" : "Resources Directory"}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  {activeSection === "bookmarks_content"
                    ? "In-depth articles, ideas and columns saved forever"
                    : "Development toolkits, icons, libraries, and utilities"}
                </p>
              </div>

              {filteredBookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                  <Bookmark className="h-10 w-10 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-sm">No bookmarks created yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="group flex flex-col justify-between p-5 rounded-xl border border-gray-800 bg-gray-900/30 hover:border-gray-700 transition-all shadow-lg"
                    >
                      <div>
                        {bookmark.thumbnail_url && (
                          <img
                            src={bookmark.thumbnail_url}
                            className="w-full h-40 object-cover rounded-lg border border-gray-800 mb-4"
                            alt=""
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-mono truncate max-w-[150px]">
                            {new URL(bookmark.url).hostname}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleBookmarkPin(bookmark)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                bookmark.is_pinned ? "text-blue-400" : "text-gray-500"
                              }`}
                            >
                              Pin
                            </button>
                            <button
                              onClick={() => toggleBookmarkFavorite(bookmark)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                bookmark.is_favorited ? "text-amber-400 font-bold" : "text-gray-500"
                              }`}
                            >
                              Fav
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-white mt-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {bookmark.title || bookmark.url}
                        </h3>
                        <p className="text-gray-400 text-sm mt-2 line-clamp-3">{bookmark.description}</p>
                        {bookmark.note && (
                          <div className="p-3 text-xs bg-gray-950/40 border border-gray-800/40 text-gray-400 rounded-lg mt-3">
                            <strong className="text-gray-300 block mb-0.5">Note:</strong>
                            {bookmark.note}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-800/40 shrink-0">
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
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                            title="Visit Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="p-1.5 rounded-lg bg-red-950/20 border border-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
                            title="Delete"
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
          <div className="w-full max-w-2xl h-full bg-[#090e18] border-l border-gray-800 flex flex-col justify-between shadow-2xl animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-8 border-b border-gray-800/40 shrink-0">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                {selectedArticle.feed_title || "RSS Article"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSendArticleToInbox(selectedArticle)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
                >
                  Send to Inbox (Read Later)
                </button>
                <button
                  onClick={() => toggleArticleFavorite(selectedArticle)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    selectedArticle.is_favorited ? "text-amber-400" : "text-gray-500"
                  }`}
                >
                  Favorite
                </button>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-gray-500 hover:text-white transition-colors text-sm font-semibold px-2"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <h1 className="text-2xl font-black text-white leading-snug">{selectedArticle.title}</h1>
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
                  className="flex items-center gap-1 text-blue-400 hover:underline"
                >
                  View Original Source
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {selectedArticle.thumbnail_url && (
                <img
                  src={selectedArticle.thumbnail_url}
                  className="w-full max-h-[300px] object-cover rounded-xl border border-gray-800"
                  alt=""
                />
              )}

              {/* Summary or full content HTML */}
              <div
                className="text-sm text-gray-300 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{
                  __html: selectedArticle.content || selectedArticle.summary || "No description provided.",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL: Add Feed */}
      {showAddFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border border-gray-800 bg-[#090e18] shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Subscribe to RSS Feed</h2>
            <form onSubmit={handleAddFeed} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Feed XML URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/feed.xml"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-950/40 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="My favorite blog"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-950/40 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFeed(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-colors"
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
          <div className="w-full max-w-md p-6 rounded-xl border border-gray-800 bg-[#090e18] shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Add New Bookmark</h2>
            <form onSubmit={handleAddBookmark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/article"
                  value={newBookmarkUrl}
                  onChange={(e) => setNewBookmarkUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-950/40 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Stunning design system"
                  value={newBookmarkTitle}
                  onChange={(e) => setNewBookmarkTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-950/40 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Type</label>
                <select
                  value={newBookmarkType}
                  onChange={(e) => setNewBookmarkType(e.target.value as "content" | "resource")}
                  className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-950/40 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                >
                  <option value="content">Content (Column / Read-only)</option>
                  <option value="resource">Resource (Tool / Reference)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Personal Note (Optional)
                </label>
                <textarea
                  placeholder="Why is this valuable? Key insights..."
                  value={newBookmarkNote}
                  onChange={(e) => setNewBookmarkNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-950/40 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookmark(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-colors"
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
    </div>
  );
}
