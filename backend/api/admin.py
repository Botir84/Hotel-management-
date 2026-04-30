from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Room, CheckIn, Payment
from .models import SecurityAlert

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