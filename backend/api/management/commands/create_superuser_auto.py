from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@sofahotel.com',
                password='admin123456'
            )
            self.stdout.write('✅ Superuser yaratildi!')
        else:
            self.stdout.write('⚠️ Superuser allaqachon bor!')