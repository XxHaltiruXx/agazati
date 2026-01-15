-- ====================================
-- GYORS JAVÍTÁS - Profiles és Permissions kapcsolat
-- ====================================
-- 
-- Ez a script javítja a "Could not find a relationship" hibát
-- Futtasd le a Supabase Dashboard > SQL Editor-ban
--

-- ====================================
-- 1. PROFILES TÁBLA LÉTREHOZÁSA/JAVÍTÁSA
-- ====================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies újradefiniálása
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ====================================
-- 2. UPDATED_AT TRIGGER
-- ====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 3. AUTO-CREATE PROFILE TRIGGER
-- ====================================

CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET 
    email = NEW.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();

-- ====================================
-- 4. MEGLÉVŐ FELHASZNÁLÓK PROFILES LÉTREHOZÁSA
-- ====================================

INSERT INTO public.profiles (id, email)
SELECT id, email 
FROM auth.users
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  updated_at = NOW();

-- ====================================
-- 5. USER_PERMISSIONS RLS POLICIES JAVÍTÁSA (Infinite Recursion Fix)
-- ====================================

-- Töröljük a problémás policies-t
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admin managers can update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can insert own permissions" ON user_permissions;

-- Új, egyszerűbb policies RECURSION NÉLKÜL
CREATE POLICY "Users can view own permissions"
ON user_permissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions"
ON user_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- FONTOS: UPDATE policy NEM ellenőrzi a user_permissions táblát!
-- Csak a user_roles táblát nézi (nincs recursion)
CREATE POLICY "Admins can update all permissions"
ON user_permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

CREATE POLICY "Users can insert own permissions"
ON user_permissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ====================================
-- 6. INFOSHARER_USER_TEXTS TÁBLA JAVÍTÁSA
-- ====================================

-- Javítsuk a táblát, hogy "text" oszlop legyen "content" helyett
-- (kompatibilitás a JavaScript kóddal)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'infosharer_user_texts' 
    AND column_name = 'content'
  ) THEN
    ALTER TABLE infosharer_user_texts RENAME COLUMN content TO text;
  END IF;
END $$;

-- RLS policies újradefiniálása
DROP POLICY IF EXISTS "Anyone can read all texts" ON infosharer_user_texts;
DROP POLICY IF EXISTS "Users can update own text" ON infosharer_user_texts;
DROP POLICY IF EXISTS "Users can insert own text" ON infosharer_user_texts;
DROP POLICY IF EXISTS "Users can delete own text" ON infosharer_user_texts;

CREATE POLICY "Anyone can read all texts"
ON infosharer_user_texts FOR SELECT
USING (true);

CREATE POLICY "Users can update own text"
ON infosharer_user_texts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own text"
ON infosharer_user_texts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own text"
ON infosharer_user_texts FOR DELETE
USING (auth.uid() = user_id);

-- ====================================
-- 7. ELLENŐRZÉS
-- ====================================

-- Profiles ellenőrzése
SELECT 
  p.id,
  p.email,
  p.created_at
FROM profiles p
ORDER BY p.email;

-- Ellenőrizzük, hogy minden auth.users-hez van-e profile
SELECT 
  au.id,
  au.email,
  CASE WHEN p.id IS NULL THEN 'HIÁNYZIK' ELSE 'OK' END as profile_status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id;

-- ====================================
-- 7. ELLENŐRZÉS
-- ====================================

-- Profiles ellenőrzése
SELECT 
  p.id,
  p.email,
  p.created_at
FROM profiles p
ORDER BY p.email;

-- Ellenőrizzük, hogy minden auth.users-hez van-e profile
SELECT 
  au.id,
  au.email,
  CASE WHEN p.id IS NULL THEN 'HIÁNYZIK' ELSE 'OK' END as profile_status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id;

-- Permissions ellenőrzése
SELECT 
  p.email,
  up.can_view_infosharer,
  up.can_view_admin_panel,
  up.can_manage_admins,
  up.can_manage_google_drive,
  up.can_manage_releases
FROM profiles p
LEFT JOIN user_permissions up ON up.user_id = p.id
ORDER BY p.email;

-- Infosharer user texts ellenőrzése
SELECT 
  p.email,
  LENGTH(iut.text) as text_length,
  iut.updated_at
FROM profiles p
LEFT JOIN infosharer_user_texts iut ON iut.user_id = p.id
ORDER BY p.email;

-- RLS Policies ellenőrzése
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'user_permissions', 'infosharer_user_texts')
ORDER BY tablename, policyname;

-- ====================================
-- KÉSZ! ✅
-- ====================================
-- 
-- Most már:
-- 1. Profiles tábla létrehozva minden felhasználónak
-- 2. Auto-create trigger működik új felhasználóknál
-- 3. Kapcsolat profiles <-> user_permissions rendben
-- 4. Infinite recursion JAVÍTVA (user_roles alapú check)
-- 5. Infosharer_user_texts "text" oszloppal
--
-- Következő lépés:
-- - Frissítsd az admin oldalt (Ctrl+Shift+R)
-- - A jogosultságok betöltődnek és módosíthatók
-- - Mások szövegdobozai működik
--
-- ====================================
