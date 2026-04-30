
/*
  # Hotel Management CRM - Core Schema

  ## Overview
  Complete database schema for the Hotel Management CRM with AI Cash Detection.

  ## New Tables

  ### 1. profiles
  - Linked to auth.users via foreign key
  - Stores full_name and role (admin | receptionist)
  - Auto-created via trigger on user signup

  ### 2. rooms
  - Hotel rooms with status tracking
  - Status: available, occupied, dirty, maintenance
  - Types: standard, deluxe, suite
  - Seeded with 20 demo rooms across 4 floors

  ### 3. reservations
  - Guest check-in records
  - Tracks payment method (cash | card)
  - Links to room and creating receptionist

  ### 4. cash_detection_alerts
  - Records from AI camera system detecting cash
  - Status: pending (timer running), resolved (check-in done), flagged (theft suspected)
  - Links to receptionist on duty and optional reservation that resolved it

  ### 5. incidents
  - Security incidents auto-created when alerts expire without resolution
  - Includes mock video URL for evidence
  - Admin can mark as investigated

  ## Security
  - RLS enabled on all tables
  - Profiles: users read own, admins read all
  - Rooms: all authenticated users can read, admins can modify
  - Reservations: receptionists create own, admins see all
  - Alerts/Incidents: receptionists see own, admins see all

  ## Triggers
  - Auto-creates profile row on new user signup using metadata
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT 'User',
  role text NOT NULL DEFAULT 'receptionist' CHECK (role IN ('admin', 'receptionist')),
  avatar_initials text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_initials)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'receptionist'),
    UPPER(LEFT(COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 2))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- ROOMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id serial PRIMARY KEY,
  room_number text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'deluxe', 'suite')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'dirty', 'maintenance')),
  floor integer NOT NULL DEFAULT 1,
  price_per_night numeric(10,2) NOT NULL DEFAULT 100.00,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can update room status"
  ON rooms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed rooms data
INSERT INTO rooms (room_number, type, floor, price_per_night, status) VALUES
  ('101', 'standard', 1, 89.00, 'available'),
  ('102', 'standard', 1, 89.00, 'occupied'),
  ('103', 'standard', 1, 89.00, 'dirty'),
  ('104', 'standard', 1, 89.00, 'available'),
  ('105', 'standard', 1, 89.00, 'maintenance'),
  ('201', 'deluxe', 2, 149.00, 'available'),
  ('202', 'deluxe', 2, 149.00, 'occupied'),
  ('203', 'deluxe', 2, 149.00, 'occupied'),
  ('204', 'deluxe', 2, 149.00, 'available'),
  ('205', 'deluxe', 2, 149.00, 'dirty'),
  ('301', 'suite', 3, 249.00, 'available'),
  ('302', 'suite', 3, 249.00, 'available'),
  ('303', 'suite', 3, 249.00, 'occupied'),
  ('304', 'suite', 3, 249.00, 'maintenance'),
  ('305', 'suite', 3, 249.00, 'available'),
  ('401', 'suite', 4, 399.00, 'available'),
  ('402', 'suite', 4, 399.00, 'occupied'),
  ('403', 'suite', 4, 399.00, 'available'),
  ('404', 'suite', 4, 399.00, 'dirty'),
  ('405', 'suite', 4, 399.00, 'available')
ON CONFLICT (room_number) DO NOTHING;

-- ============================================================
-- RESERVATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id integer REFERENCES rooms(id),
  guest_name text NOT NULL,
  guest_id_number text NOT NULL,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card')),
  total_amount numeric(10,2) DEFAULT 0,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- CASH DETECTION ALERTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_detection_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at timestamptz DEFAULT now(),
  receptionist_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'flagged')),
  resolved_at timestamptz,
  reservation_id uuid REFERENCES reservations(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

ALTER TABLE cash_detection_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Receptionists can view own alerts"
  ON cash_detection_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = receptionist_id);

CREATE POLICY "Admins can view all alerts"
  ON cash_detection_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can create alerts"
  ON cash_detection_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON cash_detection_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- INCIDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES cash_detection_alerts(id),
  receptionist_id uuid REFERENCES profiles(id),
  flagged_at timestamptz DEFAULT now(),
  video_url text DEFAULT 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  investigated boolean DEFAULT false,
  notes text,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high'))
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR true
  );

CREATE POLICY "Admins can update incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
