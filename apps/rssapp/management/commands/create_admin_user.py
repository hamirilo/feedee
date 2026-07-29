import os
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Ensure default admin user exists."

    def handle(self, *args, **options):
        admin_username = getattr(settings, "ADMIN_USERNAME", os.environ.get("ADMIN_USERNAME", "admin"))
        admin_password = getattr(settings, "ADMIN_PASSWORD", os.environ.get("ADMIN_PASSWORD", "admin-password"))
        admin_email = f"{admin_username}@example.com"

        user, created = User.objects.get_or_create(
            username=admin_username,
            defaults={
                "email": admin_email,
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            user.set_password(admin_password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully created admin user '{admin_username}'"))
        else:
            self.stdout.write(f"Admin user '{admin_username}' already exists.")
