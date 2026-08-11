import json

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import Client, TestCase

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

        # 4. Inbox
        inbox_res = self.client.post(
            "/app/inbox",
            data=json.dumps({"url": "https://example.com/article1", "title": "Test Article"}),
            content_type="application/json",
            **auth_headers,
        )
        self.assertEqual(inbox_res.status_code, 201)

        get_inbox_res = self.client.get("/app/inbox", **auth_headers)
        self.assertEqual(get_inbox_res.status_code, 200)
        self.assertEqual(len(get_inbox_res.json()), 1)

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

        get_bm_res = self.client.get("/app/bookmarks", **auth_headers)
        self.assertEqual(get_bm_res.status_code, 200)
        self.assertEqual(len(get_bm_res.json()), 1)

    def test_worker_endpoints(self):
        worker_token = getattr(settings, "WORKER_API_TOKEN", "change-me-to-a-random-token")
        worker_headers = {"HTTP_AUTHORIZATION": f"Bearer {worker_token}"}

        res = self.client.get("/app/worker/feeds", **worker_headers)
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)
