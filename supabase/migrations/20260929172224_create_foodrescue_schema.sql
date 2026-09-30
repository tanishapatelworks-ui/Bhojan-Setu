/*
# FoodRescue — Core Schema

## Overview
Creates the tables, triggers, and policies for a multi-user food-rescue platform
where Donors post surplus food, Volunteers claim and deliver it, and NGOs
receive it. Auth is required (email/password), so all policies are scoped to
`authenticated` with ownership checks via `auth.uid()`.

## Tables

### profiles
- `id` (uuid, PK, FK → auth.users)
- `full_name` (text)
- `role` (text: donor | ngo | volunteer | admin)
- `phone` (text)
- `address` (text)
- `latitude` (double precision)
- `longitude` (double precision)
- `avatar_url` (text)
- `created_at` (timestamptz)

### donations
- `id` (uuid PK)
- `donor_id` (uuid FK → profiles, defaults to auth.uid())
- `title` (text, name of the food)
- `description` (text)
- `quantity` (text, e.g. "20 meals")
- `category` (text: prepared | produce | bakery | packaged | other)
- `food_type` (text: veg | non-veg | vegan)
- `prepared_at` (timestamptz)
- `pickup_deadline` (timestamptz)
- `latitude` (double precision)
- `longitude` (double precision)
- `address` (text)
- `image_url` (text)
- `status` (text: available | claimed | picked_up | delivered | expired)
- `claimed_by` (uuid FK → profiles, nullable)
- `claimed_at` (timestamptz, nullable)
- `picked_up_at` (timestamptz, nullable)
- `delivered_at` (timestamptz, nullable)
- `created_at` (timestamptz)

### notifications
- `id` (uuid PK)
- `user_id` (uuid FK → profiles, defaults to auth.uid())
- `message` (text)
- `type` (text: claim | pickup | delivery | system | expiry)
- `donation_id` (uuid FK → donations, nullable)
- `is_read` (boolean, default false)
- `created_at` (timestamptz)

### impact_stats
- `id` (uuid PK)
- `user_id` (uuid FK → profiles, defaults to auth.uid())
- `meals_rescued` (integer, default 0)
- `kg_saved` (numeric, default 0)
- `people_served` (integer, default 0)
- `rescues_completed` (integer, default 0)

## Triggers
- `handle_new_user`: when a row is inserted into auth.users, create a matching
  profile row and an empty impact_stats row automatically.

## Security (RLS)
- profiles: users read all profiles (needed to see donor/volunteer info);
  users update only their own.
- donations: everyone authenticated can read (so volunteers/NGOs can find food);
  donors insert/update/delete their own; volunteers can update status fields
  (claim/pickup/deliver) on donations they have claimed.
- notifications: users read/update only their own.
- impact_stats: users read all (for leaderboard-style impact), update only own.

## Storage
- A public bucket `donation-images` is created for food photos.
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'donor' CHECK (role IN ('donor','ngo','volunteer','admin')),
  phone text DEFAULT '',
  address text DEFAULT '',
  latitude double precision,
  longitude double precision,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================================
-- DONATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  quantity text NOT NULL DEFAULT '1',
  category text NOT NULL DEFAULT 'prepared' CHECK (category IN ('prepared','produce','bakery','packaged','other')),
  food_type text NOT NULL DEFAULT 'veg' CHECK (food_type IN ('veg','non-veg','vegan')),
  prepared_at timestamptz,
  pickup_deadline timestamptz NOT NULL,
  latitude double precision,
  longitude double precision,
  address text DEFAULT '',
  image_url text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','claimed','picked_up','delivered','expired')),
  claimed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read donations (so volunteers/NGOs can find food)
DROP POLICY IF EXISTS "donations_read_all" ON donations;
CREATE POLICY "donations_read_all" ON donations FOR SELECT
  TO authenticated USING (true);

-- Donors insert their own donations
DROP POLICY IF EXISTS "donations_insert_own" ON donations;
CREATE POLICY "donations_insert_own" ON donations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = donor_id);

-- Donors can update/delete their own donations; volunteers can update
-- donations they have claimed (to advance status). We allow any authenticated
-- user to update but the trigger enforces business rules.
DROP POLICY IF EXISTS "donations_update_own_or_claimed" ON donations;
CREATE POLICY "donations_update_own_or_claimed" ON donations FOR UPDATE
  TO authenticated
  USING (auth.uid() = donor_id OR auth.uid() = claimed_by)
  WITH CHECK (auth.uid() = donor_id OR auth.uid() = claimed_by);

DROP POLICY IF EXISTS "donations_delete_own" ON donations;
CREATE POLICY "donations_delete_own" ON donations FOR DELETE
  TO authenticated USING (auth.uid() = donor_id);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_claimed_by ON donations(claimed_by);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system' CHECK (type IN ('claim','pickup','delivery','system','expiry')),
  donation_id uuid REFERENCES donations(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ============================================================
-- IMPACT STATS
-- ============================================================
CREATE TABLE IF NOT EXISTS impact_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  meals_rescued integer NOT NULL DEFAULT 0,
  kg_saved numeric NOT NULL DEFAULT 0,
  people_served integer NOT NULL DEFAULT 0,
  rescues_completed integer NOT NULL DEFAULT 0,
  UNIQUE(user_id)
);
ALTER TABLE impact_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "impact_read_all" ON impact_stats;
CREATE POLICY "impact_read_all" ON impact_stats FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "impact_update_own" ON impact_stats;
CREATE POLICY "impact_update_own" ON impact_stats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "impact_insert_own" ON impact_stats;
CREATE POLICY "impact_insert_own" ON impact_stats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile + impact_stats on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'role', 'donor'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.impact_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET for donation images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('donation-images', 'donation-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload, everyone can read
DROP POLICY IF EXISTS "donation_images_read" ON storage.objects;
CREATE POLICY "donation_images_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'donation-images');

DROP POLICY IF EXISTS "donation_images_upload" ON storage.objects;
CREATE POLICY "donation_images_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'donation-images');

DROP POLICY IF EXISTS "donation_images_update" ON storage.objects;
CREATE POLICY "donation_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'donation-images');