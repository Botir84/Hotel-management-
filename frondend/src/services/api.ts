import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR: Har bir so'rovga tokenni avtomat qo'shadi
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

// RESPONSE INTERCEPTOR: Token o'lsa avtomat logout qiladi
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

export const roomService = {
    getRooms: () => api.get('/rooms/'),
    updateRoomStatus: (id: number, status: string) => api.patch(`/rooms/${id}/`, { status }),
};

export const checkInService = {
    create: (data: any) => api.post('/checkins/', data),
    getCheckIns: () => api.get('/checkins/'),
};

export const paymentService = {
    getPayments: () => api.get('/payments/'), // Backenddagi urlga mos
    getPaymentDetails: (id: number) => api.get(`/payments/${id}/`),
};

export default api;