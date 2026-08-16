import type React from "react";
import { useState } from "react";
import type { BookmarkCategory, BookmarkTag, DisplaySettings, FeedItem } from "../types";

interface SettingsViewProps {
  section: "feeds" | "categories" | "display" | "account";
  feeds: FeedItem[];
  categories: BookmarkCategory[];
  tags: BookmarkTag[];
  displaySettings: DisplaySettings;
  userEmail?: string;
  onAddFeed: (feed: { title: string; url: string; group_name: string }) => Promise<void>;
  onUpdateFeed: (feed: FeedItem) => Promise<void>;
  onDeleteFeed: (feedId: number) => Promise<void>;
  onUpdateDisplaySettings: (settings: DisplaySettings) => void;
  onAddCategory: (cat: { name: string; color: string }) => Promise<void>;
  onAddTag: (tag: { name: string; color: string }) => Promise<void>;
  onChangePassword: (oldPw: string, newPw: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  section,
  feeds,
  categories,
  tags,
  displaySettings,
  userEmail = "user@example.com",
  onAddFeed,
  onUpdateFeed,
  onDeleteFeed,
  onUpdateDisplaySettings,
  onAddCategory,
  onAddTag,
  onChangePassword,
}) => {
  // New Feed Form State
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newGroup, setNewGroup] = useState("Tech");
  const [isAddingFeed, setIsAddingFeed] = useState(false);

  // Expanded feed for inline edit
  const [editingFeedId, setEditingFeedId] = useState<number | null>(null);
  const [editFeedData, setEditFeedData] = useState<FeedItem | null>(null);

  // New Category / Tag State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#2563eb");
  const [newTagName, setNewTagName] = useState("");

  // Account Password Form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSuccessMsg, setPwSuccessMsg] = useState("");
  const [pwErrorMsg, setPwErrorMsg] = useState("");

  const handleStartEdit = (feed: FeedItem) => {
    if (editingFeedId === feed.id) {
      setEditingFeedId(null);
      setEditFeedData(null);
    } else {
      setEditingFeedId(feed.id);
      setEditFeedData({ ...feed });
    }
  };

  const handleSaveFeed = async () => {
    if (!editFeedData) return;
    await onUpdateFeed(editFeedData);
    setEditingFeedId(null);
    setEditFeedData(null);
  };

  const handleAddFeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setIsAddingFeed(true);
    try {
      await onAddFeed({ title: newTitle || newUrl, url: newUrl, group_name: newGroup });
      setNewTitle("");
      setNewUrl("");
    } finally {
      setIsAddingFeed(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwErrorMsg("新しいパスワードが一致しません");
      return;
    }
    try {
      await onChangePassword(currentPw, newPw);
      setPwSuccessMsg("パスワードを変更しました");
      setPwErrorMsg("");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      setPwErrorMsg((err as Error)?.message || "パスワードの変更に失敗しました");
      setPwSuccessMsg("");
    }
  };

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-6 bg-[var(--color-background)]">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
              {section === "feeds" && "フィード設定"}
              {section === "categories" && "分類・タグ設定"}
              {section === "display" && "表示設定"}
              {section === "account" && "アカウント設定"}
            </h1>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              {section === "feeds" &&
                `${feeds.length} 件の登録フィード（有効 ${feeds.filter((f) => f.is_active).length} / 停止 ${feeds.filter((f) => !f.is_active).length}）`}
              {section === "categories" && `${categories.length} カテゴリ / ${tags.length} タグ`}
              {section === "display" && "テーマ・レイアウト・並び順の設定"}
              {section === "account" && "ログイン情報・セキュリティ設定"}
            </p>
          </div>
        </div>

        {/* ── FEEDS SECTION ─────────────────────────── */}
        {section === "feeds" && (
          <div className="flex flex-col gap-6">
            {/* Quick Add Form */}
            <form
              onSubmit={handleAddFeedSubmit}
              className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] flex flex-wrap md:flex-nowrap items-end gap-3"
            >
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-semibold text-[var(--color-muted-foreground)] mb-1">
                  名前 (任意)
                </label>
                <input
                  type="text"
                  placeholder="例: Publickey"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex-[2] min-w-[200px]">
                <label className="block text-[11px] font-semibold text-[var(--color-muted-foreground)] mb-1">
                  サイト URL または フィード URL{" "}
                  <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://… (トップページ URL でも自動判別)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="w-36">
                <label className="block text-[11px] font-semibold text-[var(--color-muted-foreground)] mb-1">
                  グループ
                </label>
                <select
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className="w-full h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="Tech">Tech</option>
                  <option value="News">News</option>
                  <option value="Design">Design</option>
                  <option value="General">General</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isAddingFeed}
                className="h-9 px-4 rounded-[var(--radius)] text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50 flex-shrink-0"
              >
                {isAddingFeed ? "追加中..." : "追加"}
              </button>
            </form>

            {/* Feeds List with Inline Edit */}
            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-card)] divide-y divide-[var(--color-border)]">
              {feeds.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--color-muted-foreground)]">
                  登録されているフィードがありません
                </div>
              ) : (
                feeds.map((feed) => {
                  const isEditing = editingFeedId === feed.id;
                  return (
                    <div key={feed.id} className={!feed.is_active ? "opacity-60" : ""}>
                      {/* Row Item Header */}
                      <div
                        onClick={() => handleStartEdit(feed)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          isEditing ? "bg-[var(--color-muted)]" : "hover:bg-[var(--color-muted)]/50"
                        }`}
                      >
                        {/* Drag Handle Icon */}
                        <svg
                          className="w-4 h-4 text-[var(--color-muted-foreground)] cursor-grab"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" d="M4 8h16M4 16h16" />
                        </svg>

                        {/* Active Lamp */}
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            feed.is_active
                              ? "bg-[var(--color-success)]"
                              : "bg-[var(--color-border)]"
                          }`}
                        />

                        {/* Feed Name */}
                        <b className="text-xs font-semibold text-[var(--color-foreground)] min-w-[140px] truncate">
                          {feed.title}
                        </b>

                        {/* URL */}
                        <span className="text-[11px] text-[var(--color-muted-foreground)] truncate max-w-md hidden md:inline">
                          {feed.url}
                        </span>

                        {/* Badges & Right Meta */}
                        <div className="ml-auto flex items-center gap-2.5 flex-shrink-0">
                          {feed.group_name && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--color-muted)] text-[10px] font-medium text-[var(--color-secondary-foreground)]">
                              {feed.group_name}
                            </span>
                          )}
                          {!feed.is_active && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-semibold">
                              停止中
                            </span>
                          )}
                          <span className="text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                            {feed.item_count} 件
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-[var(--color-muted-foreground)] transition-transform ${
                              isEditing ? "rotate-90" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Inline Edit Accordion */}
                      {isEditing && editFeedData && (
                        <div className="px-4 pb-4 pt-2 bg-[var(--color-muted)] border-t border-[var(--color-border)] flex flex-col gap-3">
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-[var(--color-muted-foreground)] mb-1">
                                名前
                              </label>
                              <input
                                type="text"
                                value={editFeedData.title}
                                onChange={(e) =>
                                  setEditFeedData({ ...editFeedData, title: e.target.value })
                                }
                                className="w-full h-8 px-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-[var(--color-muted-foreground)] mb-1">
                                グループ
                              </label>
                              <input
                                type="text"
                                value={editFeedData.group_name || ""}
                                onChange={(e) =>
                                  setEditFeedData({ ...editFeedData, group_name: e.target.value })
                                }
                                className="w-full h-8 px-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-[var(--color-muted-foreground)] mb-1">
                              URL
                            </label>
                            <input
                              type="url"
                              value={editFeedData.url}
                              onChange={(e) =>
                                setEditFeedData({ ...editFeedData, url: e.target.value })
                              }
                              className="w-full h-8 px-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editFeedData.is_active}
                                onChange={(e) =>
                                  setEditFeedData({ ...editFeedData, is_active: e.target.checked })
                                }
                                className="rounded text-[var(--color-primary)]"
                              />
                              <span>フィードの巡回を有効にする</span>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onDeleteFeed(feed.id)}
                                className="px-2.5 py-1 text-xs text-[var(--color-danger)] hover:underline cursor-pointer"
                              >
                                削除
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingFeedId(null)}
                                className="px-3 py-1 rounded-[var(--radius)] text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-card)] cursor-pointer"
                              >
                                取消
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveFeed}
                                className="px-3.5 py-1 rounded-[var(--radius)] text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 cursor-pointer shadow-xs"
                              >
                                保存
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display overview card */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col gap-3">
                <div className="text-xs font-bold text-[var(--color-foreground)]">表示のきほん</div>
                <div className="flex flex-col gap-2 text-xs text-[var(--color-secondary-foreground)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">既定の並び</span>
                    <b>{displaySettings.default_order === "newest" ? "新しい順" : "古い順"}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">1 ページの件数</span>
                    <b>{displaySettings.items_per_page} 件</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">テーマ</span>
                    <b>
                      {displaySettings.theme === "light"
                        ? "ライト"
                        : displaySettings.theme === "dark"
                          ? "ダーク"
                          : "端末連動"}
                    </b>
                  </div>
                </div>
              </div>

              {/* Classification overview card */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[var(--color-foreground)]">分類・タグ</div>
                  <span className="text-[11px] text-[var(--color-muted-foreground)]">
                    {categories.length} カテゴリ / {tags.length} タグ
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {categories.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: c.color || "var(--color-primary)" }}
                      />
                      <span>{c.name}</span>
                      <span className="ml-auto text-[11px] text-[var(--color-muted-foreground)]">
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CATEGORIES & TAGS SECTION ──────────────── */}
        {section === "categories" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categories */}
            <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[var(--color-foreground)]">カテゴリ管理</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCategoryName) return;
                  await onAddCategory({ name: newCategoryName, color: newCategoryColor });
                  setNewCategoryName("");
                }}
                className="flex gap-2"
              >
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  placeholder="カテゴリ名"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
                />
                <button
                  type="submit"
                  className="px-3.5 rounded-[var(--radius)] text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 cursor-pointer shadow-xs"
                >
                  追加
                </button>
              </form>

              <div className="divide-y divide-[var(--color-border)]">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2.5 py-2.5 text-xs">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color || "var(--color-primary)" }}
                    />
                    <span className="font-medium text-[var(--color-foreground)]">{cat.name}</span>
                    <span className="ml-auto text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                      {cat.count} 件
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[var(--color-foreground)]">タグ管理</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newTagName) return;
                  await onAddTag({ name: newTagName, color: "#64748b" });
                  setNewTagName("");
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="タグ名 (例: go, react)"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
                />
                <button
                  type="submit"
                  className="px-3.5 rounded-[var(--radius)] text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 cursor-pointer shadow-xs"
                >
                  追加
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--color-border)] text-xs text-[var(--color-secondary-foreground)] bg-[var(--color-muted)]"
                  >
                    <span>#{tag.name}</span>
                    <span className="text-[10px] opacity-70">({tag.count})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DISPLAY SECTION ───────────────────────── */}
        {section === "display" && (
          <div className="max-w-xl p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-foreground)] mb-1.5">
                テーマ
              </label>
              <div className="flex p-1 rounded-[var(--radius)] bg-[var(--color-muted)] gap-1">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onUpdateDisplaySettings({ ...displaySettings, theme: t })}
                    className={`flex-1 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
                      displaySettings.theme === t
                        ? "bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs font-semibold"
                        : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    {t === "light" ? "ライト" : t === "dark" ? "ダーク" : "端末連動"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-foreground)] mb-1.5">
                既定の並び順
              </label>
              <select
                value={displaySettings.default_order}
                onChange={(e) =>
                  onUpdateDisplaySettings({
                    ...displaySettings,
                    default_order: e.target.value as "newest" | "oldest",
                  })
                }
                className="w-full h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
              >
                <option value="newest">新しい順</option>
                <option value="oldest">古い順</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-foreground)] mb-1.5">
                1 ページの表示件数
              </label>
              <select
                value={displaySettings.items_per_page}
                onChange={(e) =>
                  onUpdateDisplaySettings({
                    ...displaySettings,
                    items_per_page: Number(e.target.value) as 20 | 50 | 100,
                  })
                }
                className="w-full h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
              >
                <option value="20">20 件</option>
                <option value="50">50 件</option>
                <option value="100">100 件</option>
              </select>
            </div>
          </div>
        )}

        {/* ── ACCOUNT SECTION ───────────────────────── */}
        {section === "account" && (
          <div className="max-w-xl p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col gap-6">
            <div>
              <div className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-1">
                ログインアカウント
              </div>
              <div className="text-sm font-bold text-[var(--color-foreground)]">{userEmail}</div>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-4 pt-4 border-t border-[var(--color-border)]"
            >
              <h2 className="text-sm font-bold text-[var(--color-foreground)]">パスワード変更</h2>

              {pwSuccessMsg && (
                <div className="p-3 rounded-[var(--radius)] bg-[var(--color-success)]/10 text-[var(--color-success)] text-xs font-medium">
                  {pwSuccessMsg}
                </div>
              )}
              {pwErrorMsg && (
                <div className="p-3 rounded-[var(--radius)] bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-xs font-medium">
                  {pwErrorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--color-foreground)] mb-1">
                  現在のパスワード
                </label>
                <input
                  type="password"
                  required
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-foreground)] mb-1">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  required
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-foreground)] mb-1">
                  新しいパスワード (確認)
                </label>
                <input
                  type="password"
                  required
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
                />
              </div>

              <button
                type="submit"
                className="h-9 px-4 rounded-[var(--radius)] text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 cursor-pointer shadow-xs self-start"
              >
                パスワードを更新
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
