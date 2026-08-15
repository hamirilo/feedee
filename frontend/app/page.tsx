"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Sidebar } from "@/components/Sidebar";
import { ContentArea } from "@/components/ContentArea";
import { ArticleReaderSheet } from "@/components/ArticleReaderSheet";
import { FormModals } from "@/components/FormModals";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export type Section = "inbox" | "someday" | "archive" | "bookmarks_content" | "bookmarks_resource" | "rss" | "pinned" | "favorites";

export default function Dashboard() {
  const router = useRouter();

  // Navigation & UI state
  const [activeSection, setActiveSection] = useState<Section>("inbox");
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeSection, selectedFeedId, selectedCategoryId, selectedTagId]);

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
  const [archivedItems, setArchivedItems] = useState<InboxItemData[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState("");
  const [bookmarksSearchQuery, setBookmarksSearchQuery] = useState("");

  // Modals & Form states
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
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
  const [promoteSourceId, setPromoteSourceId] = useState<string | null>(null);
  const [promoteSourceType, setPromoteSourceType] = useState<"inbox" | "someday" | "article" | null>(null);
  
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
  const [rssFilterUnreadOnly, setRssFilterUnreadOnly] = useState<boolean>(false);
  const [rssFilterFav, setRssFilterFav] = useState<boolean | undefined>(undefined);

  // Category creation states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6b7280");
  const [newCategoryScope, setNewCategoryScope] = useState<"rss" | "bookmark">("bookmark");

  // Tag creation states
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6b7280");

  // Load basic items on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.push("/login");
      return;
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [catsData, tagsData, subsData, inboxData, somedayData, archivedData] = await Promise.all([
        api.getCategories(),
        api.getTags(),
        api.getSubscriptions(),
        api.getInbox(),
        api.getSomeday(),
        api.getArchivedItems(),
      ]);
      setCategories(catsData);
      setTags(tagsData);
      setSubscriptions(subsData);
      setInboxItems(inboxData);
      setSomedayItems(somedayData);
      setArchivedItems(archivedData);

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
      } else if (section === "archive") {
        const data = await api.getArchivedItems(archiveSearchQuery);
        setArchivedItems(data);
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
          isRead: rssFilterUnreadOnly ? false : undefined,
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
  }, [activeSection, selectedFeedId, selectedCategoryId, selectedTagId, rssFilterUnreadOnly, rssFilterFav, archiveSearchQuery]);

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
      toast.error(err.message || "Failed to create category");
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
      toast.error(err.message || "Failed to create tag");
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
      toast.success("フィードを登録しました");
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe to feed");
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

      if (promoteSourceId) {
        if (promoteSourceType === "inbox") {
          await api.archiveInboxItem(promoteSourceId);
        } else if (promoteSourceType === "someday") {
          await api.deleteSomedayItem(promoteSourceId);
        }
      }

      setShowAddBookmark(false);
      setNewBookmarkUrl("");
      setNewBookmarkTitle("");
      setNewBookmarkCategory("");
      setNewBookmarkNote("");
      setNewBookmarkTags([]);
      setPromoteSourceId(null);
      setPromoteSourceType(null);
      loadInitialData();
      toast.success(promoteSourceId ? "ブックマークに昇格しました" : "ブックマークを追加しました");
    } catch (err: any) {
      toast.error(err.message || "Failed to create bookmark");
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
      toast.success("ブックマークを更新しました");
    } catch (err: any) {
      toast.error(err.message || "Failed to update bookmark");
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
      toast.success("フィードを更新しました");
    } catch (err: any) {
      toast.error(err.message || "Failed to update feed");
    }
  };

  const openPromoteModal = (item: InboxItemData, type: "inbox" | "someday") => {
    setNewBookmarkUrl(item.url || "");
    setNewBookmarkTitle(item.title || "");
    setNewBookmarkType("content"); // default
    setNewBookmarkCategory("");
    setNewBookmarkNote(item.description || "");
    setNewBookmarkTags([]);
    setPromoteSourceId(item.id);
    setPromoteSourceType(type);
    setShowAddBookmark(true);
  };

  const openPromoteModalForArticle = (article: ArticleData) => {
    setNewBookmarkUrl(article.url || "");
    setNewBookmarkTitle(article.title || "");
    setNewBookmarkType("content"); // default
    setNewBookmarkCategory("");
    setNewBookmarkNote(article.summary || "");
    setNewBookmarkTags([]);
    setPromoteSourceId(article.id);
    setPromoteSourceType("article");
    setShowAddBookmark(true);
  };

  // Read Later Pipeline Operations
  const handleInboxAction = async (itemId: string, action: "read" | "snooze" | "bookmark") => {
    try {
      if (action === "read") {
        await api.archiveInboxItem(itemId);
        toast.success("既読にしました（アーカイブに移動）");
      } else if (action === "snooze") {
        await api.snoozeItem(itemId);
        toast.success("Somedayに移動しました");
      } else if (action === "bookmark") {
        const item = inboxItems.find((i) => i.id === itemId);
        if (item) {
          openPromoteModal(item, "inbox");
        }
        return; // Skip loadInitialData since we just open the modal
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
        toast.info("削除しました");
      } else if (action === "unsnooze") {
        await api.unsnoozeItem(itemId);
        toast.success("受信トレイに戻しました");
      }
      loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveAction = async (itemId: string, action: "unarchive" | "delete") => {
    try {
      if (action === "unarchive") {
        await api.unarchiveItem(itemId);
        toast.success("受信トレイに戻しました");
      } else if (action === "delete") {
        await api.deleteInboxItem(itemId);
        toast.info("完全に削除しました");
      }
      loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  // Article View Detail & Reader
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
      toast.success("受信トレイに追加しました");
      loadInitialData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add to Inbox");
    }
  };

  const handleArticleReadState = async (article: ArticleData, isRead: boolean) => {
    try {
      if (isRead) {
        await api.markArticleRead(article.id);
        setArticles(articles.map(a => a.id === article.id ? { ...a, is_read: true } : a));
      } else {
        await api.markArticleUnread(article.id);
        setArticles(articles.map(a => a.id === article.id ? { ...a, is_read: false } : a));
      }
      const inboxData = await api.getInbox();
      setInboxItems(inboxData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleArticleFavState = async (article: ArticleData, isFav: boolean) => {
    await toggleArticleFavorite(article);
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
        toast.success("ブックマークを削除しました");
      } catch (err) {
        console.error(err);
        toast.error("削除に失敗しました");
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

  const activeIndex = selectedArticle
    ? filteredArticles.findIndex((a) => a.id === selectedArticle.id)
    : -1;

  const selectArticle = useCallback((index: number) => {
    if (index < 0 || index >= filteredArticles.length) return;
    const article = filteredArticles[index];
    setSelectedArticle(article);
    if (!article.is_read) {
      handleArticleReadState(article, true);
    }
  }, [filteredArticles, handleArticleReadState]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#070b14] text-gray-700 dark:text-gray-200 overflow-hidden font-sans transition-colors duration-200">
      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        {confirmDialog && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                実行する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      {/* 1. LEFT SIDEBAR (Desktop) */}
      <div className="hidden lg:flex h-full shrink-0">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          selectedFeedId={selectedFeedId}
          setSelectedFeedId={setSelectedFeedId}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          selectedTagId={selectedTagId}
          setSelectedTagId={setSelectedTagId}
          categories={categories}
          tags={tags}
          subscriptions={subscriptions}
          inboxItems={inboxItems}
          somedayItems={somedayItems}
          archivedItems={archivedItems}
          setNewCategoryScope={setNewCategoryScope}
          setShowAddCategory={setShowAddCategory}
          setShowAddTag={setShowAddTag}
          setShowAddBookmark={setShowAddBookmark}
          setShowAddFeed={setShowAddFeed}
          setEditingFeedId={setEditingFeedId}
          setEditFeedDisplayName={setEditFeedDisplayName}
          setEditFeedCategory={setEditFeedCategory}
          setShowEditFeed={setShowEditFeed}
          handleLogout={handleLogout}
          loadInitialData={loadInitialData}
          showConfirm={showConfirm}
        />
      </div>

      {/* 1. LEFT SIDEBAR (Mobile Drawer) */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <Sidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            selectedFeedId={selectedFeedId}
            setSelectedFeedId={setSelectedFeedId}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            selectedTagId={selectedTagId}
            setSelectedTagId={setSelectedTagId}
            categories={categories}
            tags={tags}
            subscriptions={subscriptions}
            inboxItems={inboxItems}
            somedayItems={somedayItems}
            archivedItems={archivedItems}
            setNewCategoryScope={setNewCategoryScope}
            setShowAddCategory={setShowAddCategory}
            setShowAddTag={setShowAddTag}
            setShowAddBookmark={setShowAddBookmark}
            setShowAddFeed={setShowAddFeed}
            setEditingFeedId={setEditingFeedId}
            setEditFeedDisplayName={setEditFeedDisplayName}
            setEditFeedCategory={setEditFeedCategory}
            setShowEditFeed={setShowEditFeed}
            handleLogout={handleLogout}
            loadInitialData={loadInitialData}
            showConfirm={showConfirm}
          />
        </SheetContent>
      </Sheet>

      {/* 2. MAIN WORKSPACE */}
      <ContentArea
        activeSection={activeSection}
        selectedFeedId={selectedFeedId}
        setSelectedFeedId={setSelectedFeedId}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        selectedTagId={selectedTagId}
        setSelectedTagId={setSelectedTagId}
        categories={categories}
        tags={tags}
        subscriptions={subscriptions}
        inboxItems={filteredInbox}
        somedayItems={filteredSomeday}
        archivedItems={archivedItems}
        bookmarks={filteredBookmarks}
        rssItems={filteredArticles}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        archiveSearchQuery={archiveSearchQuery}
        setArchiveSearchQuery={setArchiveSearchQuery}
        bookmarksSearchQuery={bookmarksSearchQuery}
        setBookmarksSearchQuery={setBookmarksSearchQuery}
        rssFilterUnreadOnly={rssFilterUnreadOnly}
        setRssFilterUnreadOnly={setRssFilterUnreadOnly}
        rssFilterFav={rssFilterFav}
        setRssFilterFav={setRssFilterFav}
        handleInboxAction={handleInboxAction}
        handleSomedayAction={handleSomedayAction}
        handleArchiveAction={handleArchiveAction}
        handleDeleteBookmark={handleDeleteBookmark}
        openPromoteModal={openPromoteModal}
        setEditingBookmarkId={setEditingBookmarkId}
        setEditBookmarkTitle={setEditBookmarkTitle}
        setEditBookmarkType={setEditBookmarkType}
        setEditBookmarkCategory={setEditBookmarkCategory}
        setEditBookmarkNote={setEditBookmarkNote}
        setEditBookmarkTags={setEditBookmarkTags}
        setShowEditBookmark={setShowEditBookmark}
        toggleBookmarkPin={toggleBookmarkPin}
        toggleBookmarkFavorite={toggleBookmarkFavorite}
        
        selectedArticle={selectedArticle}
        setSelectedArticle={setSelectedArticle}
        handleArticleReadState={handleArticleReadState}
        handleArticleFavState={handleArticleFavState}
        handleSendArticleToInbox={handleSendArticleToInbox}
        openPromoteModalForArticle={openPromoteModalForArticle}
        toggleArticleFavorite={toggleArticleFavorite}
        
        isMobile={isMobile}
        setIsSidebarOpen={setIsSidebarOpen}
        showConfirm={showConfirm}
      />

      {/* 3. MODALS & FORMS OVERLAYS */}
      <ArticleReaderSheet
        selectedArticle={selectedArticle}
        setSelectedArticle={setSelectedArticle}
        inboxItems={inboxItems}
        somedayItems={somedayItems}
        handleSendArticleToInbox={handleSendArticleToInbox}
        openPromoteModalForArticle={openPromoteModalForArticle}
        toggleArticleFavorite={toggleArticleFavorite}
        isMobile={isMobile}
        onPrev={activeIndex > 0 ? () => selectArticle(activeIndex - 1) : undefined}
        onNext={activeIndex >= 0 && activeIndex < filteredArticles.length - 1 ? () => selectArticle(activeIndex + 1) : undefined}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex >= 0 && activeIndex < filteredArticles.length - 1}
      />

      <FormModals
        categories={categories}
        tags={tags}
        showAddCategory={showAddCategory}
        setShowAddCategory={setShowAddCategory}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        newCategoryColor={newCategoryColor}
        setNewCategoryColor={setNewCategoryColor}
        newCategoryScope={newCategoryScope}
        setNewCategoryScope={setNewCategoryScope}
        handleAddCategory={handleAddCategory}
        showAddTag={showAddTag}
        setShowAddTag={setShowAddTag}
        newTagName={newTagName}
        setNewTagName={setNewTagName}
        newTagColor={newTagColor}
        setNewTagColor={setNewTagColor}
        handleAddTag={handleAddTag}
        showAddFeed={showAddFeed}
        setShowAddFeed={setShowAddFeed}
        newFeedUrl={newFeedUrl}
        setNewFeedUrl={setNewFeedUrl}
        newFeedName={newFeedName}
        setNewFeedName={setNewFeedName}
        newFeedCategory={newFeedCategory}
        setNewFeedCategory={setNewFeedCategory}
        handleAddFeed={handleAddFeed}
        showAddBookmark={showAddBookmark}
        setShowAddBookmark={setShowAddBookmark}
        newBookmarkUrl={newBookmarkUrl}
        setNewBookmarkUrl={setNewBookmarkUrl}
        newBookmarkTitle={newBookmarkTitle}
        setNewBookmarkTitle={setNewBookmarkTitle}
        newBookmarkType={newBookmarkType}
        setNewBookmarkType={setNewBookmarkType}
        newBookmarkCategory={newBookmarkCategory}
        setNewBookmarkCategory={setNewBookmarkCategory}
        newBookmarkTags={newBookmarkTags}
        setNewBookmarkTags={setNewBookmarkTags}
        newBookmarkNote={newBookmarkNote}
        setNewBookmarkNote={setNewBookmarkNote}
        promoteSourceId={promoteSourceId}
        setPromoteSourceId={setPromoteSourceId}
        promoteSourceType={promoteSourceType}
        setPromoteSourceType={setPromoteSourceType}
        handleAddBookmark={handleAddBookmark}
        showEditBookmark={showEditBookmark}
        setShowEditBookmark={setShowEditBookmark}
        setEditingBookmarkId={setEditingBookmarkId}
        editBookmarkTitle={editBookmarkTitle}
        setEditBookmarkTitle={setEditBookmarkTitle}
        editBookmarkType={editBookmarkType}
        setEditBookmarkType={setEditBookmarkType}
        editBookmarkCategory={editBookmarkCategory}
        setEditBookmarkCategory={setEditBookmarkCategory}
        editBookmarkTags={editBookmarkTags}
        setEditBookmarkTags={setEditBookmarkTags}
        editBookmarkNote={editBookmarkNote}
        setEditBookmarkNote={setEditBookmarkNote}
        handleEditBookmark={handleEditBookmark}
        showEditFeed={showEditFeed}
        setShowEditFeed={setShowEditFeed}
        setEditingFeedId={setEditingFeedId}
        editFeedDisplayName={editFeedDisplayName}
        setEditFeedDisplayName={setEditFeedDisplayName}
        editFeedCategory={editFeedCategory}
        setEditFeedCategory={setEditFeedCategory}
        handleEditFeed={handleEditFeed}
      />
    </div>
  );
}
