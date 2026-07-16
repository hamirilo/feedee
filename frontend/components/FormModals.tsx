"use client";

import * as React from "react";
import { CategoryData, TagData } from "@/app/utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FormModalsProps {
  categories: CategoryData[];
  tags: TagData[];

  // Category追加
  showAddCategory: boolean;
  setShowAddCategory: (show: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (val: string) => void;
  newCategoryColor: string;
  setNewCategoryColor: (val: string) => void;
  newCategoryScope: "rss" | "bookmark";
  setNewCategoryScope: (scope: "rss" | "bookmark") => void;
  handleAddCategory: (e: React.FormEvent) => void;

  // Tag追加
  showAddTag: boolean;
  setShowAddTag: (show: boolean) => void;
  newTagName: string;
  setNewTagName: (val: string) => void;
  newTagColor: string;
  setNewTagColor: (val: string) => void;
  handleAddTag: (e: React.FormEvent) => void;

  // Feed追加
  showAddFeed: boolean;
  setShowAddFeed: (show: boolean) => void;
  newFeedUrl: string;
  setNewFeedUrl: (val: string) => void;
  newFeedName: string;
  setNewFeedName: (val: string) => void;
  newFeedCategory: string;
  setNewFeedCategory: (val: string) => void;
  handleAddFeed: (e: React.FormEvent) => void;

  // Bookmark追加
  showAddBookmark: boolean;
  setShowAddBookmark: (show: boolean) => void;
  newBookmarkUrl: string;
  setNewBookmarkUrl: (val: string) => void;
  newBookmarkTitle: string;
  setNewBookmarkTitle: (val: string) => void;
  newBookmarkType: "content" | "resource";
  setNewBookmarkType: (val: "content" | "resource") => void;
  newBookmarkCategory: string;
  setNewBookmarkCategory: (val: string) => void;
  newBookmarkTags: string[];
  setNewBookmarkTags: (val: string[]) => void;
  newBookmarkNote: string;
  setNewBookmarkNote: (val: string) => void;
  promoteSourceId: string | null;
  setPromoteSourceId: (val: string | null) => void;
  promoteSourceType: "inbox" | "someday" | "article" | null;
  setPromoteSourceType: (val: "inbox" | "someday" | "article" | null) => void;
  handleAddBookmark: (e: React.FormEvent) => void;

  // Bookmark編集
  showEditBookmark: boolean;
  setShowEditBookmark: (show: boolean) => void;
  setEditingBookmarkId: (id: string | null) => void;
  editBookmarkTitle: string;
  setEditBookmarkTitle: (val: string) => void;
  editBookmarkType: "content" | "resource";
  setEditBookmarkType: (val: "content" | "resource") => void;
  editBookmarkCategory: string;
  setEditBookmarkCategory: (val: string) => void;
  editBookmarkTags: string[];
  setEditBookmarkTags: (val: string[]) => void;
  editBookmarkNote: string;
  setEditBookmarkNote: (val: string) => void;
  handleEditBookmark: (e: React.FormEvent) => void;

  // Feed編集
  showEditFeed: boolean;
  setShowEditFeed: (show: boolean) => void;
  setEditingFeedId: (id: string | null) => void;
  editFeedDisplayName: string;
  setEditFeedDisplayName: (val: string) => void;
  editFeedCategory: string;
  setEditFeedCategory: (val: string) => void;
  handleEditFeed: (e: React.FormEvent) => void;
}

export function FormModals({
  categories,
  tags,
  showAddCategory,
  setShowAddCategory,
  newCategoryName,
  setNewCategoryName,
  newCategoryColor,
  setNewCategoryColor,
  newCategoryScope,
  setNewCategoryScope,
  handleAddCategory,

  showAddTag,
  setShowAddTag,
  newTagName,
  setNewTagName,
  newTagColor,
  setNewTagColor,
  handleAddTag,

  showAddFeed,
  setShowAddFeed,
  newFeedUrl,
  setNewFeedUrl,
  newFeedName,
  setNewFeedName,
  newFeedCategory,
  setNewFeedCategory,
  handleAddFeed,

  showAddBookmark,
  setShowAddBookmark,
  newBookmarkUrl,
  setNewBookmarkUrl,
  newBookmarkTitle,
  setNewBookmarkTitle,
  newBookmarkType,
  setNewBookmarkType,
  newBookmarkCategory,
  setNewBookmarkCategory,
  newBookmarkTags,
  setNewBookmarkTags,
  newBookmarkNote,
  setNewBookmarkNote,
  promoteSourceId,
  setPromoteSourceId,
  promoteSourceType,
  setPromoteSourceType,
  handleAddBookmark,

  showEditBookmark,
  setShowEditBookmark,
  setEditingBookmarkId,
  editBookmarkTitle,
  setEditBookmarkTitle,
  editBookmarkType,
  setEditBookmarkType,
  editBookmarkCategory,
  setEditBookmarkCategory,
  editBookmarkTags,
  setEditBookmarkTags,
  editBookmarkNote,
  setEditBookmarkNote,
  handleEditBookmark,

  showEditFeed,
  setShowEditFeed,
  setEditingFeedId,
  editFeedDisplayName,
  setEditFeedDisplayName,
  editFeedCategory,
  setEditFeedCategory,
  handleEditFeed,
}: FormModalsProps) {
  const { theme } = useTheme();

  return (
    <>
      {/* FORM MODAL: Add Category */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="max-w-md bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Create New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Category Name
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. Technology, Design"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full"
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
                <Input
                  type="text"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  placeholder="#6b7280"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddCategory(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
              >
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FORM MODAL: Add Tag */}
      <Dialog open={showAddTag} onOpenChange={setShowAddTag}>
        <DialogContent className="max-w-md bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Create New Tag</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTag} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Tag Name
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. javascript, tutorial"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full"
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
                <Input
                  type="text"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  placeholder="#6b7280"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddTag(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
              >
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FORM MODAL: Add Feed */}
      <Dialog open={showAddFeed} onOpenChange={setShowAddFeed}>
        <DialogContent className="max-w-md bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Subscribe to RSS Feed</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFeed} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Feed XML URL
              </label>
              <Input
                type="url"
                required
                placeholder="https://example.com/feed.xml"
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Display Name (Optional)
              </label>
              <Input
                type="text"
                placeholder="My favorite blog"
                value={newFeedName}
                onChange={(e) => setNewFeedName(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddFeed(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
              >
                Subscribe
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FORM MODAL: Add Bookmark */}
      <Dialog open={showAddBookmark} onOpenChange={(open) => {
        if (!open) {
          setShowAddBookmark(false);
          setNewBookmarkUrl("");
          setNewBookmarkTitle("");
          setNewBookmarkCategory("");
          setNewBookmarkNote("");
          setNewBookmarkTags([]);
          setPromoteSourceId(null);
          setPromoteSourceType(null);
        }
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {promoteSourceId ? "ブックマークに昇格" : "Add New Bookmark"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBookmark} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">URL</label>
              <Input
                type="url"
                required
                disabled={!!promoteSourceId}
                placeholder="https://example.com/article"
                value={newBookmarkUrl}
                onChange={(e) => setNewBookmarkUrl(e.target.value)}
                className={
                  promoteSourceId
                    ? "bg-gray-100 dark:bg-gray-900/60 cursor-not-allowed opacity-75"
                    : ""
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Title (Optional)
              </label>
              <Input
                type="text"
                placeholder="Stunning design system"
                value={newBookmarkTitle}
                onChange={(e) => setNewBookmarkTitle(e.target.value)}
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
                      : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-800 dark:bg-gray-955/20 dark:hover:border-gray-700"
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
                      : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-800 dark:bg-gray-955/20 dark:hover:border-gray-700"
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
              <Select value={newBookmarkCategory || "none"} onValueChange={(val) => setNewBookmarkCategory(!val || val === "none" ? "" : val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No Category" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 shadow-xl">
                  <SelectItem value="none">No Category</SelectItem>
                  {categories
                    .filter((c) => c.scope === "bookmark")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
              <Textarea
                placeholder="Why is this valuable? Key insights..."
                value={newBookmarkNote}
                onChange={(e) => setNewBookmarkNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowAddBookmark(false);
                  setNewBookmarkUrl("");
                  setNewBookmarkTitle("");
                  setNewBookmarkCategory("");
                  setNewBookmarkNote("");
                  setNewBookmarkTags([]);
                  setPromoteSourceId(null);
                  setPromoteSourceType(null);
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
              >
                {promoteSourceId ? "昇格する" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FORM MODAL: Edit Bookmark */}
      <Dialog open={showEditBookmark} onOpenChange={(open) => {
        if (!open) {
          setShowEditBookmark(false);
          setEditingBookmarkId(null);
        }
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Edit Bookmark</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBookmark} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Title
              </label>
              <Input
                type="text"
                required
                placeholder="Bookmark title"
                value={editBookmarkTitle}
                onChange={(e) => setEditBookmarkTitle(e.target.value)}
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
              <Select value={editBookmarkCategory || "none"} onValueChange={(val) => setEditBookmarkCategory(!val || val === "none" ? "" : val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No Category" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 shadow-xl">
                  <SelectItem value="none">No Category</SelectItem>
                  {categories
                    .filter((c) => c.scope === "bookmark")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border border-gray-300 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-850/40">
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
              <Textarea
                placeholder="Why is this valuable? Key insights..."
                value={editBookmarkNote}
                onChange={(e) => setEditBookmarkNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowEditBookmark(false);
                  setEditingBookmarkId(null);
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
              >
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FORM MODAL: Edit Feed */}
      <Dialog open={showEditFeed} onOpenChange={(open) => {
        if (!open) {
          setShowEditFeed(false);
          setEditingFeedId(null);
        }
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Edit RSS Feed</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFeed} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Display Name
              </label>
              <Input
                type="text"
                required
                placeholder="Feed display name"
                value={editFeedDisplayName}
                onChange={(e) => setEditFeedDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
              <Select value={editFeedCategory || "none"} onValueChange={(val) => setEditFeedCategory(!val || val === "none" ? "" : val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No Category" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#090e18] border border-gray-200 dark:border-gray-800 shadow-xl">
                  <SelectItem value="none">No Category</SelectItem>
                  {categories
                    .filter((c) => c.scope === "rss")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowEditFeed(false);
                  setEditingFeedId(null);
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
              >
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
