export type Role = 'admin' | 'kassir'; // 'receptionist' ni 'kassir'ga o'zgartirdik

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  avatar_initials: string;
  created_at: string;
  updated_at: string;
}

export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'maintenance';
export type RoomType = 'standard' | 'deluxe' | 'suite';

export interface Room {
  id: number;
  room_number: string;
  type: RoomType;
  status: RoomStatus;
  floor: number;
  price_per_night: number;
  updated_at: string;
}

export type PaymentMethod = 'cash' | 'card';

export interface Reservation {
  id: string;
  room_id: number;
  guest_name: string;
  guest_id_number: string;
  check_in_date: string;
  check_out_date: string;
  payment_method: PaymentMethod;
  total_amount: number;
  notes?: string;
  created_by: string;
  created_at: string;
  room?: Room;
  profile?: Profile;
}

export type AlertStatus = 'pending' | 'resolved' | 'flagged';

export interface CashDetectionAlert {
  id: string;
  detected_at: string;
  receptionist_id: string;
  status: AlertStatus;
  resolved_at?: string;
  reservation_id?: string;
  expires_at: string;
  profile?: Profile;
}

export interface Incident {
  id: string;
  alert_id: string;
  receptionist_id: string;
  flagged_at: string;
  video_url: string;
  investigated: boolean;
  notes?: string;
  severity: 'low' | 'medium' | 'high';
  profile?: Profile;
  alert?: CashDetectionAlert;
}

// types.ts ichida:
export type Page = 'dashboard' | 'revenue' | 'employees' | 'security' | 'profile';

export interface NavItem {
  id: Page;
  label: string;
  icon: string;
  adminOnly?: boolean;
}
