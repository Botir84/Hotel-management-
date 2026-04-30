from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

# 1. Profil va Rollar
class Profile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('kassir', 'Kassir'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='kassir')
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

# Signal: Foydalanuvchi yaratilganda avtomatik profil ham yaratiladi
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


# Xonalar jadvali
class Room(models.Model):
    number = models.CharField(max_length=10)
    status = models.CharField(max_length=20, default='available')
    chategory = models.CharField(max_length=100)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2, default=25.00)
    

    def __str__(self):
        return self.number

class CheckIn(models.Model):
    guest_name = models.CharField(max_length=100)
    guest_id_number = models.CharField(max_length=50, blank=True, null=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    receptionist = models.ForeignKey(User, on_delete=models.CASCADE)
    check_in_date = models.DateTimeField(default=timezone.now)
    check_out_date = models.DateTimeField()
    actual_check_out = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.guest_name} (Room {self.room.number})"



class Payment(models.Model):
    # Har bir to'lov aniq bir CheckIn'ga tegishli bo'ladi
    check_in = models.ForeignKey(CheckIn, related_name='payments', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('transfer', 'Transfer'),
    ]
    method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    
    # To'lovni qabul qilgan xodim
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.check_in.guest_name} - {self.amount} ({self.method})"


#AI Section
class SecurityAlert(models.Model):
    ALERT_TYPES = (
        ('pending', 'Tekshirilmoqda'),       # 5 daqiqalik kutish vaqti
        ('verified', 'Tasdiqlandi'),         # To'lov topildi
        ('theft', 'O\'g\'rilik aniqlandi'),  # To'lov topilmadi
    )
    
    #detected_at avtomatik ravishda yaratilgan vaqtni oladi
    detected_at = models.DateTimeField(default=timezone.now)
    
    # Holatni saqlash uchun
    status = models.CharField(
        max_length=20, 
        choices=ALERT_TYPES, 
        default='pending'
    )
    
    # Isbot sifatida video parcha saqlash uchun (ixtiyoriy)
    video_clip = models.FileField(
        upload_to='security_alerts/%Y/%m/%d/', 
        null=True, 
        blank=True
    )

    class Meta:
        verbose_name = "Xavfsizlik Ogohlantirishi"
        verbose_name_plural = "Xavfsizlik Ogohlantirishlari"
        ordering = ['-detected_at'] # Eng yangilari tepada turadi

    def __str__(self):
        return f"Ogohlantirish {self.id} - {self.get_status_display()} ({self.detected_at.strftime('%H:%M')})"