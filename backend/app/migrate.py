import logging
import os
import sqlite3

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bookmark import Bookmark, BookmarkType, BookmarkUserState
from app.models.common import Category, CategoryScope
from app.models.feed import Feed, Subscription
from app.models.user import User
from app.utils.security import get_password_hash

logger = logging.getLogger("uvicorn.error")

async def run_migration(session: AsyncSession):
    sqlite_path = "/app/db.sqlite3"
    if not os.path.exists(sqlite_path):
        logger.info("SQLite database for migration not found. Skipping.")
        return

    logger.info("Starting migration from SQLite to PostgreSQL...")
    
    # 1. Connect to SQLite
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
        # --- Migrate Users ---
        cur.execute("SELECT id, username, email, is_superuser, is_active FROM auth_user")
        sqlite_users = cur.fetchall()
        
        user_id_map = {} # sqlite_user_id -> pg_user_uuid
        
        for u in sqlite_users:
            # Check if user already exists in PG
            stmt = select(User).where(User.username == u["username"])
            res = await session.execute(stmt)
            pg_user = res.scalar_one_or_none()
            
            if not pg_user:
                # Create user
                password_hash = get_password_hash("password") # Default password for migrated users
                pg_user = User(
                    username=u["username"],
                    email=u["email"],
                    hashed_password=password_hash,
                    is_active=bool(u["is_active"]),
                    is_superuser=bool(u["is_superuser"])
                )
                session.add(pg_user)
                await session.flush()
                logger.info(f"Migrated user: {u['username']}")
            else:
                logger.info(f"User {u['username']} already exists, mapping to existing UUID")
            
            user_id_map[u["id"]] = pg_user.id

        # --- Migrate Categories ---
        cur.execute("SELECT id, name, color, content_type, display_order, user_id FROM rssapp_category")
        sqlite_categories = cur.fetchall()
        
        category_id_map = {} # sqlite_category_id -> pg_category_uuid
        
        for c in sqlite_categories:
            pg_user_uuid = user_id_map.get(c["user_id"])
            if not pg_user_uuid:
                continue
                
            # Check if category already exists (for same user and name)
            stmt = select(Category).where(
                Category.user_id == pg_user_uuid,
                Category.name == c["name"]
            )
            res = await session.execute(stmt)
            pg_cat = res.scalar_one_or_none()
            
            if not pg_cat:
                # Map content_type
                scope = CategoryScope.RSS
                if c["content_type"] == "bookmark":
                    scope = CategoryScope.BOOKMARK
                
                pg_cat = Category(
                    user_id=pg_user_uuid,
                    name=c["name"],
                    color=c["color"] or "#6b7280",
                    scope=scope
                )
                session.add(pg_cat)
                await session.flush()
                logger.info(f"Migrated category: {c['name']}")
            else:
                logger.info(f"Category {c['name']} already exists, mapping to existing UUID")
                
            category_id_map[c["id"]] = pg_cat.id

        # --- Migrate Feeds and Subscriptions ---
        cur.execute("SELECT id, name, url, display_order, is_active, category_v2_id FROM rssapp_feed")
        sqlite_feeds = cur.fetchall()
        
        for f in sqlite_feeds:
            # 1. Create global Feed if not exists
            stmt = select(Feed).where(Feed.url == f["url"])
            res = await session.execute(stmt)
            pg_feed = res.scalar_one_or_none()
            
            if not pg_feed:
                pg_feed = Feed(
                    url=f["url"],
                    title=f["name"],
                    is_active=bool(f["is_active"]),
                )
                session.add(pg_feed)
                await session.flush()
                logger.info(f"Migrated feed master: {f['url']}")
            
            # 2. Find associated user via category_v2_id
            cat_id = f["category_v2_id"]
            if cat_id:
                # Find pg_user_uuid from category
                cur.execute("SELECT user_id FROM rssapp_category WHERE id = ?", (cat_id,))
                cat_row = cur.fetchone()
                if cat_row:
                    pg_user_uuid = user_id_map.get(cat_row["user_id"])
                    pg_cat_uuid = category_id_map.get(cat_id)
                else:
                    pg_user_uuid = None
                    pg_cat_uuid = None
            else:
                # Default to admin user if no category
                stmt = select(User).where(User.username == "admin")
                res = await session.execute(stmt)
                admin_user = res.scalar_one_or_none()
                pg_user_uuid = admin_user.id if admin_user else None
                pg_cat_uuid = None

            if pg_user_uuid:
                # Check if subscription already exists
                stmt = select(Subscription).where(
                    Subscription.user_id == pg_user_uuid,
                    Subscription.feed_id == pg_feed.id
                )
                res = await session.execute(stmt)
                pg_sub = res.scalar_one_or_none()
                
                if not pg_sub:
                    pg_sub = Subscription(
                        user_id=pg_user_uuid,
                        feed_id=pg_feed.id,
                        category_id=pg_cat_uuid,
                        display_name=f["name"],
                        order=f["display_order"] or 0
                    )
                    session.add(pg_sub)
                    logger.info(f"Created subscription for user {pg_user_uuid} to {f['url']}")

        # --- Migrate Bookmarks ---
        cur.execute("SELECT id, url, title, description, thumbnail_url, category_v2_id, user_id FROM rssapp_bookmark")
        sqlite_bookmarks = cur.fetchall()
        
        for b in sqlite_bookmarks:
            pg_user_uuid = user_id_map.get(b["user_id"])
            if not pg_user_uuid:
                continue
                
            pg_cat_uuid = category_id_map.get(b["category_v2_id"]) if b["category_v2_id"] else None
            
            # Check if bookmark already exists for this user and url
            stmt = select(Bookmark).where(
                Bookmark.user_id == pg_user_uuid,
                Bookmark.url == b["url"]
            )
            res = await session.execute(stmt)
            pg_bm = res.scalar_one_or_none()
            
            if not pg_bm:
                pg_bm = Bookmark(
                    user_id=pg_user_uuid,
                    category_id=pg_cat_uuid,
                    bookmark_type=BookmarkType.CONTENT,
                    url=b["url"],
                    title=b["title"],
                    description=b["description"],
                    thumbnail_url=b["thumbnail_url"]
                )
                session.add(pg_bm)
                await session.flush()
                
                # Add default user state
                state = BookmarkUserState(
                    user_id=pg_user_uuid,
                    bookmark_id=pg_bm.id,
                    is_pinned=False,
                    is_favorited=False
                )
                session.add(state)
                logger.info(f"Migrated bookmark: {b['url']}")

        await session.commit()
        logger.info("Migration completed successfully!")
        
        # Rename SQLite file to prevent running migration again
        conn.close()
        os.rename(sqlite_path, sqlite_path + ".imported")
        logger.info("SQLite database file renamed to db.sqlite3.imported")
        
    except Exception as e:
        logger.error(f"Error during migration: {e}")
        await session.rollback()
        conn.close()
        raise e
