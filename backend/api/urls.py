from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet, 
    CheckInViewSet, 
    MyTokenObtainPairView, # O'zimizning login view
    PaymentViewSet,
    CheckPaymentSecurity,
    SecurityAlertAPI
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'checkins', CheckInViewSet)
router.register(r'payments', PaymentViewSet)

urlpatterns = [
    # Routerdagi API-lar (rooms, checkins, incidents)
    path('', include(router.urls)),
    
    
    # Login va Token operatsiyalari
    # Diqqat: 'login/' deb yozish kifoya, chunki asosiy urls.py da 'api/' prefiksi bor
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Kamera pulni aniqlaganda birinchi bo'lib shu endpointga POST so'rov yuboradi
    path('security/alerts/', SecurityAlertAPI.as_view(), name='create-security-alert'),
    
    # 5 daqiqalik tekshiruv mantiqini ishga tushirish uchun
    path('security/check/', CheckPaymentSecurity.as_view(), name='verify-security-status'),
]