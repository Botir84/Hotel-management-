import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    // Diqqat: Bu yerda 'Content-Type'ni qat'iy belgilamaymiz, 
    // chunki axios FormData yuborilganda uni avtomat o'zi belgilaydi.
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
    (config) => {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            try {
                const userData = JSON.parse(userJson);
                const token = userData.access;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                console.error("Tokenni o'qishda xatolik", e);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// --- BARCHA XIZMATLAR (Full API Services) ---

export const authService = {
    login: (credentials: any) => api.post('/login/', credentials),
};

// Profil bilan ishlash xizmati
export const profileService = {
    // Profil ma'lumotlarini olish
    getProfile: () => api.get('/profile/'),

    // Profilni yangilash (Rasm yuklash uchun FormData qabul qiladi)
    updateProfile: (data: FormData) => api.patch('/profile/', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};

export const roomService = {
    getRooms: () => api.get('/rooms/'),
    updateRoomStatus: (id: number, status: string) => api.patch(`/rooms/${id}/`, { status }),
};

export const checkInService = {
    create: (data: any) => api.post('/checkins/', data),
    getCheckIns: () => api.get('/checkins/'),
};

export const paymentService = {
    getPayments: () => api.get('/payments/'),
    getPaymentDetails: (id: number) => api.get(`/payments/${id}/`),
};

// Xavfsizlik bo'limi (AI Section) uchun xizmatlar
export const securityService = {
    getAlerts: () => api.get('/security-alerts/'),
    updateAlertStatus: (id: number, status: string) => api.patch(`/security-alerts/${id}/`, { status }),
};

export default api;