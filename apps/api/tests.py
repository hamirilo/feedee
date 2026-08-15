import json

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from apps.rssapp.models import Article, Feed

User = get_user_model()


class NinjaAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = "testuser"
        self.password = "password123"
        self.user = User.objects.create_user(username=self.username, password=self.password)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_login_and_authenticated_endpoints(self):
        # 1. Login
        login_res = self.client.post(
            "/app/auth/login",
            data=json.dumps({"username": self.username, "password": self.password}),
            content_type="application/json",
        )
        self.assertEqual(login_res.status_code, 200)
        data = login_res.json()
        self.assertIn("access_token", data)
        token = data["access_token"]
        auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

        # 2. Categories
        cat_res = self.client.post(
            "/app/categories",
            data=json.dumps({"name": "Tech", "color": "#3B82F6", "scope": "rss"}),
            content_type="application/json",
            **auth_headers,
        )
        self.assertEqual(cat_res.status_code, 201)
        cat_id = cat_res.json()["id"]

        get_cats_res = self.client.get("/app/categories", **auth_headers)
        self.assertEqual(get_cats_res.status_code, 200)
        self.assertEqual(len(get_cats_res.json()), 1)

        # 3. Feeds
        feed_res = self.client.post(
            "/app/feeds",
            data=json.dumps(
                {
                    "url": "https://news.ycombinator.com/rss",
                    "display_name": "Hacker News",
                    "category_id": cat_id,
                }
            ),
            content_type="application/json",
            **auth_headers,
        )
        self.assertEqual(feed_res.status_code, 201)

        get_feeds_res = self.client.get("/app/feeds", **auth_headers)
        self.assertEqual(get_feeds_res.status_code, 200)
        self.assertEqual(len(get_feeds_res.json()), 1)

        feed = Feed.objects.get(id=feed_res.json()["id"])
        article = Article.objects.create(
            feed=feed,
            url="https://example.com/feed-article",
            link="https://example.com/feed-article",
            normalized_link="https://example.com/feed-article",
            title="Feed article",
        )
        articles_res = self.client.get("/app/feeds/articles", **auth_headers)
        self.assertEqual(articles_res.status_code, 200)
        self.assertEqual(articles_res.json()[0]["id"], str(article.id))

        favorite_article_res = self.client.post(f"/app/feeds/articles/{article.id}/favorite", **auth_headers)
        self.assertEqual(favorite_article_res.status_code, 200)
        favorite_articles_res = self.client.get("/app/feeds/articles?is_favorited=true", **auth_headers)
        self.assertEqual(len(favorite_articles_res.json()), 1)

        # 4. Inbox
        inbox_res = self.client.post(
            "/app/inbox",
            data=json.dumps({"url": "https://example.com/article1", "title": "Test Article"}),
            content_type="application/json",
            **auth_headers,
        )
        self.assertEqual(inbox_res.status_code, 201)
        inbox_id = inbox_res.json()["id"]

        get_inbox_res = self.client.get("/app/inbox", **auth_headers)
        self.assertEqual(get_inbox_res.status_code, 200)
        self.assertEqual(len(get_inbox_res.json()), 1)

        archive_res = self.client.post(f"/app/inbox/{inbox_id}/archive", **auth_headers)
        self.assertEqual(archive_res.status_code, 200)
        archived_res = self.client.get("/app/inbox/archived", **auth_headers)
        self.assertEqual(archived_res.status_code, 200)
        self.assertEqual(archived_res.json()[0]["id"], inbox_id)
        unarchive_res = self.client.post(f"/app/inbox/{inbox_id}/unarchive", **auth_headers)
        self.assertEqual(unarchive_res.status_code, 200)
        snooze_res = self.client.post(f"/app/inbox/{inbox_id}/snooze", **auth_headers)
        self.assertEqual(snooze_res.status_code, 200)
        someday_id = snooze_res.json()["id"]
        unsnooze_res = self.client.post(f"/app/someday/{someday_id}/unsnooze", **auth_headers)
        self.assertEqual(unsnooze_res.status_code, 200)

        # 5. Bookmarks
        bm_res = self.client.post(
            "/app/bookmarks",
            data=json.dumps(
                {
                    "url": "https://example.com/bookmark1",
                    "title": "Test Bookmark",
                    "bookmark_type": "content",
                }
            ),
            content_type="application/json",
            **auth_headers,
        )
        self.assertEqual(bm_res.status_code, 201)
        bookmark_id = bm_res.json()["id"]

        get_bm_res = self.client.get("/app/bookmarks", **auth_headers)
        self.assertEqual(get_bm_res.status_code, 200)
        self.assertEqual(len(get_bm_res.json()), 1)

        pin_res = self.client.post(f"/app/bookmarks/{bookmark_id}/pin", **auth_headers)
        favorite_res = self.client.post(f"/app/bookmarks/{bookmark_id}/favorite", **auth_headers)
        self.assertEqual(pin_res.status_code, 200)
        self.assertEqual(favorite_res.status_code, 200)
        filtered_bm_res = self.client.get("/app/bookmarks?is_pinned=true&is_favorited=true", **auth_headers)
        self.assertEqual(len(filtered_bm_res.json()), 1)

    def test_worker_endpoints(self):
        worker_token = getattr(settings, "WORKER_API_TOKEN", "change-me-to-a-random-token")
        worker_headers = {"HTTP_AUTHORIZATION": f"Bearer {worker_token}"}

        res = self.client.get("/app/worker/feeds", **worker_headers)
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)
