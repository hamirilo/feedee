export type AppMode = "dashboard" | "inbox" | "saved" | "settings";

export interface FeedGroup {
  id: string;
  name: string;
  count: number;
}

export interface FeedItem {
  id: number;
  title: string;
  url: string;
  site_url?: string;
  group_name?: string;
  is_active: boolean;
  item_count: number;
  last_fetched_at?: string;
}

export interface ArticleItem {
  id: number;
  feed_id: number;
  feed_title: string;
  title: string;
  url: string;
  summary: string;
  content_html?: string;
  published_at: string;
  published_relative: string;
  reading_time_minutes?: number;
  image_url?: string;
  is_read: boolean;
  is_read_later: boolean;
  is_bookmarked: boolean;
}

export interface BookmarkCategory {
  id: number;
  name: string;
  color?: string;
  count: number;
}

export interface BookmarkTag {
  id: number;
  name: string;
  color?: string;
  count: number;
}

export interface BookmarkItem {
  id: number;
  title: string;
  url: string;
  description?: string;
  domain: string;
  category?: BookmarkCategory;
  tags: BookmarkTag[];
  created_at: string;
  is_read_later: boolean;
  is_favorite: boolean;
  is_archived: boolean;
}

export interface UserStats {
  unread_total: number;
  read_later_total: number;
  bookmarks_total: number;
  completion_rate: number;
  unread_breakdown: { label: string; count: number; percentage: number }[];
}

export interface DisplaySettings {
  default_order: "newest" | "oldest";
  items_per_page: 20 | 50 | 100;
  theme: "light" | "dark" | "system";
  default_view: "last_used" | "panel" | "gallery" | "list";
}
