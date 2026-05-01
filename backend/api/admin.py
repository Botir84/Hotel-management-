from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Room, CheckIn, Payment
from .models import SecurityAlert
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from .models import Profile

# 1. Xonalar uchun chiroyli ko'rinish
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'number', 'status') # Admin panelda qaysi ustunlar ko'rinsin
    list_editable = ('status',) # Ro'yxatning o'zida statusni o'zgartirish imkoniyati
    search_fields = ('number',)

# 2. Check-inlar uchun
@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    # 'amount_paid' va 'created_at' o'rniga modelda bor maydonlarni qo'yamiz
    list_display = ('guest_name', 'room', 'check_in_date', 'check_out_date', 'receptionist')
    list_filter = ('check_in_date', 'room') # 'created_at' o'rniga 'check_in_date'
    search_fields = ('guest_name', 'guest_id_number')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('check_in', 'amount', 'method', 'processed_by', 'created_at')
    list_filter = ('method', 'created_at')


@admin.register(SecurityAlert)
class SecurityAlertAdmin(admin.ModelAdmin):
    # Ro'yxatda ko'rinadigan ustunlar
    list_display = ('id', 'status_emoji', 'get_status_display', 'detected_at', 'has_video')
    
    # O'ng tomonda filter qo'shish (holati va vaqti bo'yicha)
    list_filter = ('status', 'detected_at')
    
    # Qidiruv maydoni
    search_fields = ('id', 'status')
    
    # Faqat o'qish uchun (admin panelda tasodifan o'zgartirib yubormaslik uchun)
    readonly_fields = ('detected_at',)

    # Statusga qarab rangli emoji yoki belgi qo'shish (interfeys chiroyli chiqishi uchun)
    def status_emoji(self, obj):
        emojis = {
            'pending': '⏳',
            'verified': '✅',
            'theft': '🚨',
        }
        return emojis.get(obj.status, '❓')
    status_emoji.short_description = 'Holat'

    # Video bor-yo'qligini tekshirish
    def has_video(self, obj):
        return bool(obj.video_clip)
    has_video.boolean = True
    has_video.short_description = 'Video bor'

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profil ma\'lumotlari'
    fk_name = 'user'

# 2. Standart UserAdmin klassini kengaytiramiz
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline, )
    
    # Ro'yxat sahifasida qo'shimcha ustunlarni ko'rsatish
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_phone', 'get_avatar_preview')
    
    def get_phone(self, obj):
        return obj.profile.phone if hasattr(obj, 'profile') else "-"
    get_phone.short_description = 'Telefon'

    def get_avatar_preview(self, obj):
        if hasattr(obj, 'profile') and obj.profile.avatar:
            return format_html('<img src="{}" style="width: 30px; height: 30px; border-radius: 50%;" />', obj.profile.avatar.url)
        return "-"
    get_avatar_preview.short_description = 'Rasm'

# 3. Eski User adminni o'chirib, yangisini ro'yxatdan o'tkazamiz
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# 4. Agar Profilni alohida bo'lim sifatida ham ko'rmoqchi bo'lsangiz:
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'avatar_tag')
    search_fields = ('user__username', 'phone')

    def avatar_tag(self, obj):
        if obj.avatar:
            return format_html('<img src="{}" style="width: 45px; height: 45px; border-radius: 5px;" />', obj.avatar.url)
        return "Rasm yo'q"
    avatar_tag.short_description = 'Profil rasmi'