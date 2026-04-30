from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Room, CheckIn, Payment, SecurityAlert

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role')

    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'first_name', 'last_name']

# --- LOGIN ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = 'admin' if user.is_superuser else 'receptionist'
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = 'admin' if self.user.is_superuser else 'receptionist'
        data['username'] = self.user.username
        data['id'] = self.user.id
        return data

# --- ROOM ---
class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    # Bog'langan modellardan kerakli maydonlarni "readonly" qilib olamiz
    guest_name = serializers.CharField(source='check_in.guest_name', read_only=True)
    room_number = serializers.CharField(source='check_in.room.number', read_only=True)
    cashier_name = serializers.CharField(source='processed_by.username', read_only=True)
    # Agar get_full_name ishlamasa, username ni ishlating:
    # cashier_name = serializers.CharField(source='processed_by.username', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'check_in', 'guest_name', 'room_number', 
            'amount', 'method', 'processed_by', 'cashier_name', 'created_at'
        ]

class CheckInSerializer(serializers.ModelSerializer):
    receptionist_name = serializers.CharField(source='receptionist.username', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    
    # ✅ MUHIM: RoomDetailsModal'da to'lovlarni ko'rsatish uchun
    payments = PaymentSerializer(many=True, read_only=True)
    
    # Frontenddan keladigan virtual maydonlar (Check-in paytida to'lov olish uchun)
    payment_amount = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True)
    payment_method = serializers.ChoiceField(choices=['cash', 'card', 'transfer'], write_only=True)

    class Meta:
        model = CheckIn
        fields = [
            'id', 'guest_name', 'guest_id_number', 'room', 'room_number', 
            'check_in_date', 'check_out_date', 'receptionist', 'receptionist_name', 
            'notes', 'payment_amount', 'payment_method', 'payments'
        ]

    def create(self, validated_data):
        # Virtual maydonlarni ajratib olamiz
        payment_amount = validated_data.pop('payment_amount')
        payment_method = validated_data.pop('payment_method')

        with transaction.atomic():
            # 1. Check-in yaratish
            checkin = CheckIn.objects.create(**validated_data)
            
            # 2. Xonani 'occupied' holatiga o'tkazish
            room = validated_data['room']
            room.status = 'occupied'
            room.save()

            # 3. To'lovni yaratish va Check-in bilan bog'lash
            Payment.objects.create(
                check_in=checkin, # Foreign key orqali bog'lanadi
                amount=payment_amount,
                method=payment_method,
                processed_by=validated_data['receptionist']
            )

            return checkin
        


class SecurityAlertSerializer(serializers.ModelSerializer):
    # Statusning o'zbekcha nomini ham yuborish (ixtiyoriy, lekin foydali)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # Vaqtni tushunarli formatda yuborish
    created_at = serializers.DateTimeField(source='detected_at', format="%Y-%m-%d %H:%M:%S")

    class Meta:
        model = SecurityAlert
        fields = ['id', 'created_at', 'status', 'status_display', 'video_clip']