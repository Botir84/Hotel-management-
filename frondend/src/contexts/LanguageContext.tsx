import { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================
// TARJIMALAR
// ============================================================
export const translations = {
    uz: {
        //Profil
        user_label: "foydalanuvchi",
        account_active: "Hisob faol",
        edit_profile: "Profilni tahrirlash",
        personal_info: "Shaxsiy ma'lumotlar",
        edit_info_hint: "Ma'lumotlaringizni tahrirlang",
        account_info: "Hisob ma'lumotlaringiz",
        email_address: "Email manzili",
        phone_number: "Telefon raqami",
        not_linked: "Biriktirilmagan",
        biography: "Biografiya",
        no_biography: "Biografiya kiritilmagan.",
        first_name: "Ism",
        last_name: "Familiya",
        bio_placeholder: "O'zingiz haqingizda...",
        profile_save_error: "Saqlashda xatolik yuz berdi.",


        //RoomDetail
        room_label: "Xona",
        room_service: "Xona Xizmati",
        room_service_note: "Mehmonlarimizga premium xizmat ko'rsatish bizning asosiy maqsadimiz.",
        room_details: "Xona Tafsilotlari",
        late_alert: "Kechikish",
        late_checkout: "KECH CHIQISH",
        penalty: "Jarima",
        checkout_confirm: "Chiqishni tasdiqlang",
        guest_name: "Mehmon ismi",
        active: "Faol",
        total_paid: "Jami to'langan",
        payment_label: "To'lov",
        no_payments: "To'lovlar topilmadi",
        extend_stay: "Qolishni uzaytirish (12:00 gacha)",
        extra_duration: "Qo'shimcha muddat",
        additional_charge: "Qo'shimcha to'lov",
        change_room: "Xona almashtirish",
        stay_current_room: "Hozirgi xonada qolish",
        edit: "Tahrirlash",
        save_update: "Saqlash",


        // Sidebar
        nav_reception: 'Qabul',
        nav_revenue: 'Moliya',
        nav_rooms: 'Xonalar',
        nav_security: 'Xavfsizlik',
        nav_profile: 'Profil',
        nav_management: 'Boshqaruv',
        theme_light: 'Kunduzgi rejim',
        theme_dark: 'Tungi rejim',
        language: 'Til',
        my_profile: 'Mening profilim',
        logout: 'Chiqish',

        // Dashboard
        dashboard_title: 'Boshqaruv Paneli',
        dashboard_subtitle: 'Xonalar va Bandlik Monitoringi',

        // MetricsCards
        daily_revenue: 'Kunlik Tushum',
        available_rooms: "Bo'sh Xonalar",
        occupied_rooms: 'Band Xonalar',
        cleaning_rooms: 'Tozalanmoqda',
        today: 'Bugun',
        cleaning: 'Tozalash',

        //Check in
        payment_cash: "Naqd",
        payment_card: "Karta",



        //RoomCard
        book: "Band qilish",
        bad: "Yotoq",

        // RoomsManagePage
        rooms_title: 'Xonalar Boshqaruvi',
        rooms_subtitle: 'ta xona',
        rooms_available: "ta bo'sh",
        rooms_list: "Xonalar ro'yxati",
        new_room: 'Yangi xona',
        refresh: 'Yangilash',
        search_room: 'Xona raqami yoki kategoriya...',
        all: 'Barchasi',
        available: "Bo'sh",
        occupied: 'Band',
        dirty: 'Tozalanmoqda',
        sensor_connected: 'Sensor ulangan',
        room_number: 'Raqam *',
        price: 'Narx ($)',
        category: 'Kategoriya',
        size: 'Hajm (m²)',
        status: 'Holat',
        tuya_id: 'Tuya Device ID',
        cancel: 'Bekor',
        add: "Qo'shish",
        save: 'Saqlash',
        delete: "O'chirish",
        delete_confirm: "Bu xona va uning barcha ma'lumotlari o'chib ketadi. Qaytarib bo'lmaydi.",
        delete_title: "Xonani o'chirish",
        edit_room: 'Xonani tahrirlash',
        add_room: 'Yangi xona',
        enter_data: "Ma'lumotlarni kiriting",
        not_found: 'Xona topilmadi',
        loading: 'Yuklanmoqda...',
        door_open: 'Ochiq',
        door_closed: 'Yopiq',
        no_sensor: "Sensor yo'q",
        total_rooms: 'Jami xona',

        // RevenuePage
        revenue_title: 'Moliya Paneli',
        revenue_subtitle: 'Tranzaksiyalar va daromadlar boshqaruvi',
        revenue_date: 'Sana:',
        daily_income: 'kunlik tushum',
        this_month: 'Shu oy',
        this_year: 'Shu yil',
        total: 'Jami',
        payment_history: "To'lovlar tarixi",
        by_date: "Sana bo'yicha",
        guest_room: 'Mehmon & Xona',
        employee: 'Xodim',
        method: 'Metod',
        amount_time: 'Summa & Vaqt',
        no_data: "Ma'lumot topilmadi",
        unknown: "Noma'lum",
        cashier: 'Kassir',
        room_suffix: '-xona',

        // CheckInModal
        checkin_title: 'Check-in Details',
        full_name: 'To\'liq ism',
        passport_id: 'Pasport / ID',
        selected_room: 'Tanlangan xona',
        choose_room: "Bo'sh xona tanlang",
        checkin_label: 'Kirish',
        checkout_label: 'Chiqish',
        total_amount: 'Jami summa',
        confirm_reg: 'Ro\'yxatdan o\'tkazish',
        guest_reg: 'Mehmon Ro\'yxatga Olish',
        reception: 'Qabul',
        night: 'Kecha',
        nights: 'Kecha',
    },

    ru: {
        //Profil
        user_label: "пользователь",
        account_active: "Аккаунт активен",
        edit_profile: "Редактировать",
        personal_info: "Личные данные",
        edit_info_hint: "Редактируйте данные",
        account_info: "Данные аккаунта",
        email_address: "Адрес эл. почты",
        phone_number: "Номер телефона",
        not_linked: "Не привязан",
        biography: "Биография",
        no_biography: "Биография не добавлена.",
        first_name: "Имя",
        last_name: "Фамилия",
        bio_placeholder: "О себе...",
        profile_save_error: "Ошибка при сохранении.",

        room_label: "Номер",
        room_service: "Сервис",
        room_service_note: "Обеспечение премиального сервиса — наш главный приоритет.",
        room_details: "Детали номера",
        late_alert: "Опоздание",
        late_checkout: "ПОЗДНИЙ ВЫЕЗД",
        penalty: "Штраф",
        checkout_confirm: "Подтвердите выезд",
        guest_name: "Имя гостя",
        active: "Активен",
        total_paid: "Итого уплачено",
        payment_label: "Платёж",
        no_payments: "Платежи не найдены",
        extend_stay: "Продление (до 12:00)",
        extra_duration: "Доп. период",
        additional_charge: "Доп. плата",
        change_room: "Смена номера",
        stay_current_room: "Остаться в текущем номере",
        edit: "Редактировать",
        save_update: "Сохранить",


        nav_reception: 'Приём',
        nav_revenue: 'Финансы',
        nav_rooms: 'Номера',
        nav_security: 'Безопасность',
        nav_profile: 'Профиль',
        nav_management: 'Управление',
        theme_light: 'Светлая тема',
        theme_dark: 'Тёмная тема',
        language: 'Язык',
        my_profile: 'Мой профиль',
        logout: 'Выйти',

        dashboard_title: 'Панель управления',
        dashboard_subtitle: 'Мониторинг номеров и заполняемости',

        daily_revenue: 'Дневной доход',
        available_rooms: 'Свободные номера',
        occupied_rooms: 'Занятые номера',
        cleaning_rooms: 'На уборке',
        today: 'Сегодня',
        cleaning: 'Уборка',

        book: "Забронировать",
        bad: "Кровать",

        payment_cash: "Наличные",
        payment_card: "Карта",

        rooms_title: 'Управление номерами',
        rooms_subtitle: 'номеров',
        rooms_available: 'свободно',
        rooms_list: 'Список номеров',
        new_room: 'Новый номер',
        refresh: 'Обновить',
        search_room: 'Номер или категория...',
        all: 'Все',
        available: 'Свободен',
        occupied: 'Занят',
        dirty: 'На уборке',
        sensor_connected: 'Датчик подключён',
        room_number: 'Номер *',
        price: 'Цена ($)',
        category: 'Категория',
        size: 'Площадь (m²)',
        status: 'Статус',
        tuya_id: 'Tuya Device ID',
        cancel: 'Отмена',
        add: 'Добавить',
        save: 'Сохранить',
        delete: 'Удалить',
        delete_confirm: 'Номер и все его данные будут удалены. Это действие необратимо.',
        delete_title: 'Удалить номер',
        edit_room: 'Редактировать номер',
        add_room: 'Новый номер',
        enter_data: 'Введите данные',
        not_found: 'Номер не найден',
        loading: 'Загрузка...',
        door_open: 'Открыта',
        door_closed: 'Закрыта',
        no_sensor: 'Нет датчика',
        total_rooms: 'Всего номеров',

        revenue_title: 'Финансовая панель',
        revenue_subtitle: 'Управление транзакциями и доходами',
        revenue_date: 'Дата:',
        daily_income: 'дневной доход',
        this_month: 'Этот месяц',
        this_year: 'Этот год',
        total: 'Итого',
        payment_history: 'История платежей',
        by_date: 'По дате',
        guest_room: 'Гость & Номер',
        employee: 'Сотрудник',
        method: 'Метод',
        amount_time: 'Сумма & Время',
        no_data: 'Данные не найдены',
        unknown: 'Неизвестно',
        cashier: 'Кассир',
        room_suffix: '-номер',

        checkin_title: 'Детали заселения',
        full_name: 'Полное имя',
        passport_id: 'Паспорт / ID',
        selected_room: 'Выбранный номер',
        choose_room: 'Выберите свободный номер',
        checkin_label: 'Заезд',
        checkout_label: 'Выезд',
        total_amount: 'Итоговая сумма',
        confirm_reg: 'Подтвердить',
        guest_reg: 'Регистрация гостя',
        reception: 'Приём',
        night: 'Ночь',
        nights: 'Ночей',
    },

    en: {
        //Profil
        user_label: "user",
        account_active: "Account active",
        edit_profile: "Edit Profile",
        personal_info: "Personal Info",
        edit_info_hint: "Edit your information",
        account_info: "Your account details",
        email_address: "Email Address",
        phone_number: "Phone Number",
        not_linked: "Not linked",
        biography: "Biography",
        no_biography: "No biography provided yet.",
        first_name: "First name",
        last_name: "Last name",
        bio_placeholder: "About yourself...",
        profile_save_error: "An error occurred while saving.",

        room_label: "Room",
        room_service: "Room Service",
        room_service_note: "Providing premium service for our guests is our top priority.",
        room_details: "Room Details",
        late_alert: "Late Alert",
        late_checkout: "LATE CHECKOUT",
        penalty: "Penalty",
        checkout_confirm: "Confirm checkout for Room",
        guest_name: "Guest Name",
        active: "Active",
        total_paid: "Total Paid",
        payment_label: "Payment",
        no_payments: "No payments found",
        extend_stay: "Extend Stay (Until 12:00 PM)",
        extra_duration: "Extra Duration",
        additional_charge: "Additional Charge",
        change_room: "Change Room (Transfer)",
        stay_current_room: "Stay in Current Room",
        edit: "Edit",
        save_update: "Save & Update",


        nav_reception: 'Reception',
        nav_revenue: 'Revenue',
        nav_rooms: 'Rooms',
        nav_security: 'Security',
        nav_profile: 'Profile',
        nav_management: 'Management',
        theme_light: 'Light mode',
        theme_dark: 'Dark mode',
        language: 'Language',
        my_profile: 'My profile',
        logout: 'Sign out',

        dashboard_title: 'Dashboard',
        dashboard_subtitle: 'Rooms & Occupancy Monitoring',

        daily_revenue: 'Daily Revenue',
        available_rooms: 'Available Rooms',
        occupied_rooms: 'Occupied Rooms',
        cleaning_rooms: 'Cleaning',
        today: 'Today',
        cleaning: 'Cleaning',

        book: "Book",
        bad: "Bed",

        payment_cash: "Cash",
        payment_card: "Card",

        rooms_title: 'Rooms Management',
        rooms_subtitle: 'rooms',
        rooms_available: 'available',
        rooms_list: 'Rooms list',
        new_room: 'New room',
        refresh: 'Refresh',
        search_room: 'Room number or category...',
        all: 'All',
        available: 'Available',
        occupied: 'Occupied',
        dirty: 'Cleaning',
        sensor_connected: 'Sensor connected',
        room_number: 'Number *',
        price: 'Price ($)',
        category: 'Category',
        size: 'Size (m²)',
        status: 'Status',
        tuya_id: 'Tuya Device ID',
        cancel: 'Cancel',
        add: 'Add',
        save: 'Save',
        delete: 'Delete',
        delete_confirm: 'This room and all its data will be deleted. This action cannot be undone.',
        delete_title: 'Delete room',
        edit_room: 'Edit room',
        add_room: 'New room',
        enter_data: 'Enter details',
        not_found: 'Room not found',
        loading: 'Loading...',
        door_open: 'Open',
        door_closed: 'Closed',
        no_sensor: 'No sensor',
        total_rooms: 'Total rooms',

        revenue_title: 'Revenue Dashboard',
        revenue_subtitle: 'Transactions and revenue management',
        revenue_date: 'Date:',
        daily_income: 'daily revenue',
        this_month: 'This month',
        this_year: 'This year',
        total: 'Total',
        payment_history: 'Payment history',
        by_date: 'By date',
        guest_room: 'Guest & Room',
        employee: 'Employee',
        method: 'Method',
        amount_time: 'Amount & Time',
        no_data: 'No data found',
        unknown: 'Unknown',
        cashier: 'Cashier',
        room_suffix: ' room',

        checkin_title: 'Check-in Details',
        full_name: 'Full name',
        passport_id: 'Passport / ID',
        selected_room: 'Selected room',
        choose_room: 'Choose an available room',
        checkin_label: 'Check-in',
        checkout_label: 'Check-out',
        total_amount: 'Total amount',
        confirm_reg: 'Confirm registration',
        guest_reg: 'Guest Registration',
        reception: 'Reception',
        night: 'Night',
        nights: 'Nights',
    },
} as const;

export type Lang = keyof typeof translations;
export type TranslationKey = keyof typeof translations.uz;

// ============================================================
// CONTEXT
// ============================================================
interface LangContextType {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType>({
    lang: 'uz',
    setLang: () => { },
    t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const stored = (localStorage.getItem('lang') as Lang) || 'uz';
    const [lang, setLangState] = useState<Lang>(stored);

    const setLang = (l: Lang) => {
        setLangState(l);
        localStorage.setItem('lang', l);
    };

    const t = (key: TranslationKey): string =>
        (translations[lang] as any)[key] ?? (translations.uz as any)[key] ?? key;

    return (
        <LangContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LangContext.Provider>
    );
}

export const useLang = () => useContext(LangContext);