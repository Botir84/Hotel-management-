from django.shortcuts import render
from rest_framework import viewsets, status, permissions, generics
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Room, CheckIn, Payment
from .serializers import (
    RoomSerializer, CheckInSerializer,  MyTokenObtainPairSerializer, PaymentSerializer, SecurityAlertSerializer
)
from django.db import transaction
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from datetime import timedelta
from .models import CheckIn, SecurityAlert
from rest_framework.permissions import AllowAny

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .serializers import UserProfileSerializer

from rest_framework import generics, status, parsers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    # Rasm va JSON ma'lumotlarni bir vaqtda qabul qilish uchun
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_object(self):
        return self.request.user

    # MUHIM: Serializer ichida request'dan foydalanish uchun context uzatamiz
    # Bu rasm URL'ini to'liq (http://...) qilib beradi va 404 xatosini yo'qotadi
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Parolni yangilash mantiqi
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if current_password and new_password:
            if not user.check_password(current_password):
                return Response(
                    {"detail": "Eski parol noto'g'ri."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(new_password)
            user.save()

        # MUHIM: partial=True qo'shish 400 xatolarini (required fields) oldini oladi
        partial = kwargs.pop('partial', True) 
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)
    
# 1. Login API
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# 2. Xonalar API
class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('number')
    serializer_class = RoomSerializer

    # Bo'sh xonalarni tezkor olish uchun qo'shimcha endpoint: /api/rooms/available/
    @action(detail=False, methods=['get'])
    def available(self, request):
        available_rooms = self.queryset.filter(status='available')
        serializer = self.get_serializer(available_rooms, many=True)
        return Response(serializer.data)



class CheckInViewSet(viewsets.ModelViewSet):
    queryset = CheckIn.objects.all().order_by('-id')        
    serializer_class = CheckInSerializer

    def perform_create(self, serializer):
        # Yangi Check-in yaratishda receptionistni avtomatik biriktiramiz
        serializer.save(receptionist=self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        # 1. Eski ma'lumotlarni olish
        instance = self.get_object()
        old_room = instance.room
        
        # 2. Yangilangan ma'lumotlarni saqlash
        # (Bu yerda serializer.save() chaqirilganda validated_data ichidagi yangi xona olinadi)
        updated_instance = serializer.save()
        new_room = updated_instance.room

        # 3. Agar xona o'zgargan bo'lsa (Room Change logic)
        if old_room != new_room:
            # Eski xonani 'dirty' (tozalash kerak) holatiga o'tkazamiz
            old_room.status = 'dirty'
            old_room.save()
            
            # Yangi xonani 'occupied' (band) holatiga o'tkazamiz
            new_room.status = 'occupied'
            new_room.save()

        # 4. Vaqtni uzaytirishda qo'shimcha to'lov mantiqi
        # Agar frontenddan payment_amount kelsa, yangi Payment ob'ekti yaratamiz
        payment_amount = self.request.data.get('payment_amount')
        payment_method = self.request.data.get('payment_method', 'cash')

        if payment_amount and float(payment_amount) > 0:
            Payment.objects.create(
                check_in=updated_instance,
                amount=payment_amount,
                method=payment_method,
                processed_by=self.request.user
            )

    def update(self, request, *args, **kwargs):
        # Standard update metodini chaqiramiz (u perform_update ni ishlatadi)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # To'lovni qabul qilgan xodimni avtomatik biriktiramiz
        serializer.save(processed_by=self.request.user)

#API for checking money

from django.utils import timezone

class SecurityAlertAPI(APIView): # Nomini umumiyroq qildik
    permission_classes = [AllowAny] 
    
    # 1. GET: React frontend alertlar ro'yxatini olishi uchun
    def get(self, request):
        alerts = SecurityAlert.objects.all()[:30] # Serializeringizga qarab -detected_at tartibida keladi
        serializer = SecurityAlertSerializer(alerts, many=True)
        return Response(serializer.data)

    # 2. POST: AI Camera alert yaratishi uchun (Sizda bor edi)
    def post(self, request):
        alert = SecurityAlert.objects.create(
            status='pending',
            detected_at=timezone.now() 
        )
        return Response({
            "message": "Alert yaratildi",
            "id": alert.id,
            "detected_at": timezone.localtime(alert.detected_at).strftime('%Y-%m-%d %H:%M:%S')
        }, status=status.HTTP_201_CREATED)

class CheckPaymentSecurity(APIView):
    permission_classes = [AllowAny] 

    def get(self, request):
        # 1. Faqat tekshirilayotgan alertlarni olamiz
        pending_alerts = SecurityAlert.objects.filter(status='pending')
        
        now = timezone.now()
        updated_count = 0

        for alert in pending_alerts:
            # 2. Besh daqiqalik 'haqiqat oynasi'
            five_minutes_later = alert.detected_at + timedelta(minutes=5)
            
            # 3. Endi CheckIn emas, Payment modelidan qidiramiz
            # Eslatma: Agar Payment modelida 'created_at' bo'lmasa, 
            # uni o'zingizdagi vaqt maydoni (masalan, 'date') bilan almashtiring
            recent_payment = Payment.objects.filter(
                created_at__gte=alert.detected_at,
                created_at__lte=five_minutes_later
            ).first() # Birinchi topilgan to'lovni olamiz
            
            if recent_payment:
                # To'lov topildi!
                alert.status = 'verified'
                # Agar xohlasangiz, qaysi to'lov ekanligini isbot uchun saqlab qo'yish ham mumkin
                # alert.notes = f"To'lov ID: {recent_payment.id}, Maqsad: {recent_payment.payment_purpose}"
                alert.save()
                updated_count += 1
                
            elif now > five_minutes_later:
                # 5 daqiqa o'tdi, to'lov yo'q -> O'G'RILIK
                alert.status = 'theft'
                alert.save()
                
                # Bu yerda Telegramga xabar: "Kassada pul ko'rindi, lekin to'lov urilmadi!"
                updated_count += 1
        
        return Response({
            "status": "Security scan completed",
            "processed_alerts": updated_count
        })
    

