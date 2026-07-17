const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://127.0.0.1:8000";
};

const BASE_URL = getBaseUrl();

export const TOKEN_KEY = process.env.NODE_ENV === "development" ? "feedee_token_dev" : "feedee_token_prod";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "API Request Failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export interface CategoryData {
  id: string;
  name: string;
  color: string;
  scope: "rss" | "bookmark";
}

export interface TagData {
  id: string;
  name: string;
  color: string;
}

export interface SubscriptionData {
  id: string;
  url: string;
  title: string | null;
  site_url: string | null;
  favicon_url: string | null;
  display_name: string | null;
  category_id: string | null;
  order: number;
}

export interface ArticleData {
  id: string;
  feed_id: string;
  feed_title: string | null;
  url: string;
  title: string | null;
  summary: string | null;
  content: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  is_read: boolean;
  is_favorited: boolean;
}

export interface InboxItemData {
  id: string;
  article_id: string | null;
  url: string | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  order: number;
  is_archived: boolean;
  archived_at: string | null;
}

export interface BookmarkData {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  note: string | null;
  bookmark_type: "resource" | "content";
  category_id: string | null;
  tags: TagData[];
  is_pinned: boolean;
  is_favorited: boolean;
  created_at: string;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    fetchAPI("/app/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  // Categories & Tags
  getCategories: (scope?: "rss" | "bookmark"): Promise<CategoryData[]> =>
    fetchAPI(`/app/categories${scope ? `?scope=${scope}` : ""}`),
  createCategory: (name: string, color: string, scope: "rss" | "bookmark"): Promise<CategoryData> =>
    fetchAPI("/app/categories", {
      method: "POST",
      body: JSON.stringify({ name, color, scope }),
    }),
  getTags: (): Promise<TagData[]> => fetchAPI("/app/tags"),
  createTag: (name: string, color: string): Promise<TagData> =>
    fetchAPI("/app/tags", {
      method: "POST",
      body: JSON.stringify({ name, color }),
    }),

  // Feeds
  getSubscriptions: (): Promise<SubscriptionData[]> => fetchAPI("/app/feeds"),
  subscribeFeed: (url: string, categoryId?: string | null, displayName?: string): Promise<SubscriptionData> =>
    fetchAPI("/app/feeds", {
      method: "POST",
      body: JSON.stringify({ url, category_id: categoryId, display_name: displayName }),
    }),
  unsubscribeFeed: (feedId: string): Promise<void> =>
    fetchAPI(`/app/feeds/${feedId}`, { method: "DELETE" }),
  updateSubscription: (feedId: string, payload: { displayName?: string | null; categoryId?: string | null }): Promise<SubscriptionData> =>
    fetchAPI(`/app/feeds/${feedId}`, {
      method: "PUT",
      body: JSON.stringify({
        display_name: payload.displayName,
        category_id: payload.categoryId,
      }),
    }),

  // Articles
  getArticles: (params: { isRead?: boolean; isFavorited?: boolean; feedId?: string; categoryId?: string; limit?: number; offset?: number } = {}): Promise<ArticleData[]> => {
    const urlParams = new URLSearchParams();
    if (params.isRead !== undefined) urlParams.set("is_read", String(params.isRead));
    if (params.isFavorited !== undefined) urlParams.set("is_favorited", String(params.isFavorited));
    if (params.feedId) urlParams.set("feed_id", params.feedId);
    if (params.categoryId) urlParams.set("category_id", params.categoryId);
    if (params.limit) urlParams.set("limit", String(params.limit));
    if (params.offset) urlParams.set("offset", String(params.offset));
    return fetchAPI(`/app/feeds/articles?${urlParams.toString()}`);
  },
  markArticleRead: (id: string): Promise<void> => fetchAPI(`/app/feeds/articles/${id}/read`, { method: "POST" }),
  markArticleUnread: (id: string): Promise<void> => fetchAPI(`/app/feeds/articles/${id}/unread`, { method: "POST" }),
  favoriteArticle: (id: string): Promise<void> => fetchAPI(`/app/feeds/articles/${id}/favorite`, { method: "POST" }),
  unfavoriteArticle: (id: string): Promise<void> => fetchAPI(`/app/feeds/articles/${id}/unfavorite`, { method: "POST" }),

  // Inbox (Read Later) & Someday
  getInbox: (): Promise<InboxItemData[]> => fetchAPI("/app/inbox"),
  addToInbox: (payload: { url?: string | null; title?: string | null; description?: string | null; thumbnailUrl?: string | null; articleId?: string | null }): Promise<InboxItemData> =>
    fetchAPI("/app/inbox", {
      method: "POST",
      body: JSON.stringify({
        url: payload.url,
        title: payload.title,
        description: payload.description,
        thumbnail_url: payload.thumbnailUrl,
        article_id: payload.articleId,
      }),
    }),
  deleteInboxItem: (id: string): Promise<void> => fetchAPI(`/app/inbox/${id}`, { method: "DELETE" }),
  snoozeItem: (id: string): Promise<InboxItemData> => fetchAPI(`/app/inbox/${id}/snooze`, { method: "POST" }),
  archiveInboxItem: (id: string): Promise<void> => fetchAPI(`/app/inbox/${id}/archive`, { method: "POST" }),
  unarchiveItem: (id: string): Promise<void> => fetchAPI(`/app/inbox/${id}/unarchive`, { method: "POST" }),
  getArchivedItems: (q?: string): Promise<InboxItemData[]> =>
    fetchAPI(`/app/inbox/archived${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  getSomeday: (): Promise<InboxItemData[]> => fetchAPI("/app/someday"),
  deleteSomedayItem: (id: string): Promise<void> => fetchAPI(`/app/someday/${id}`, { method: "DELETE" }),
  unsnoozeItem: (id: string): Promise<InboxItemData> => fetchAPI(`/app/someday/${id}/unsnooze`, { method: "POST" }),

  // Bookmarks
  getBookmarks: (params: { bookmarkType?: "resource" | "content"; categoryId?: string; tagId?: string; isPinned?: boolean; isFavorited?: boolean } = {}): Promise<BookmarkData[]> => {
    const urlParams = new URLSearchParams();
    if (params.bookmarkType) urlParams.set("bookmark_type", params.bookmarkType);
    if (params.categoryId) urlParams.set("category_id", params.categoryId);
    if (params.tagId) urlParams.set("tag_id", params.tagId);
    if (params.isPinned !== undefined) urlParams.set("is_pinned", String(params.isPinned));
    if (params.isFavorited !== undefined) urlParams.set("is_favorited", String(params.isFavorited));
    return fetchAPI(`/app/bookmarks?${urlParams.toString()}`);
  },
  createBookmark: (payload: { url: string; title?: string | null; description?: string | null; thumbnailUrl?: string | null; note?: string | null; bookmarkType: "resource" | "content"; categoryId?: string | null; tagIds?: string[] }): Promise<BookmarkData> =>
    fetchAPI("/app/bookmarks", {
      method: "POST",
      body: JSON.stringify({
        url: payload.url,
        title: payload.title,
        description: payload.description,
        thumbnail_url: payload.thumbnailUrl,
        note: payload.note,
        bookmark_type: payload.bookmarkType,
        category_id: payload.categoryId,
        tag_ids: payload.tagIds || [],
      }),
    }),
  updateBookmark: (id: string, payload: { title?: string | null; description?: string | null; thumbnailUrl?: string | null; note?: string | null; bookmarkType?: "resource" | "content"; categoryId?: string | null; tagIds?: string[] }): Promise<BookmarkData> =>
    fetchAPI(`/app/bookmarks/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        thumbnail_url: payload.thumbnailUrl,
        note: payload.note,
        bookmark_type: payload.bookmarkType,
        category_id: payload.categoryId,
        tag_ids: payload.tagIds,
      }),
    }),
  deleteBookmark: (id: string): Promise<void> => fetchAPI(`/app/bookmarks/${id}`, { method: "DELETE" }),
  pinBookmark: (id: string): Promise<void> => fetchAPI(`/app/bookmarks/${id}/pin`, { method: "POST" }),
  unpinBookmark: (id: string): Promise<void> => fetchAPI(`/app/bookmarks/${id}/unpin`, { method: "POST" }),
  favoriteBookmark: (id: string): Promise<void> => fetchAPI(`/app/bookmarks/${id}/favorite`, { method: "POST" }),
  unfavoriteBookmark: (id: string): Promise<void> => fetchAPI(`/app/bookmarks/${id}/unfavorite`, { method: "POST" }),
};
