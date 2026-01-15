-- ====================================
-- GYORS TELEPÍTÉS - User Permissions System
-- ====================================
-- 
-- Ez a fájl az ÖSSZES szükséges migrációt tartalmazza
-- Futtasd le ezt egyetlen lépésben a Supabase Dashboard > SQL Editor-ban
--

-- ====================================
-- 1. PROFILES TÁBLA (ha még nem létezik)
-- ====================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

-- Updated_at trigger funkció (ha még nem létezik)
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

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();

-- ====================================
-- 2. INFOSHARER USER TEXTS TÁBLA
-- ====================================

CREATE TABLE IF NOT EXISTS infosharer_user_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_infosharer_user_texts_user_id 
ON infosharer_user_texts(user_id);

ALTER TABLE infosharer_user_texts ENABLE ROW LEVEL SECURITY;

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

DROP TRIGGER IF EXISTS update_infosharer_user_texts_updated_at ON infosharer_user_texts;

CREATE TRIGGER update_infosharer_user_texts_updated_at
BEFORE UPDATE ON infosharer_user_texts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_user_text_box()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.infosharer_user_texts (user_id, text)
  VALUES (NEW.id, '')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_text_box ON auth.users;

CREATE TRIGGER on_user_created_text_box
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_text_box();

-- ====================================
-- 3. USER PERMISSIONS TÁBLA
-- ====================================

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  can_view_infosharer BOOLEAN DEFAULT TRUE NOT NULL,
  can_view_admin_panel BOOLEAN DEFAULT FALSE NOT NULL,
  can_manage_admins BOOLEAN DEFAULT FALSE NOT NULL,
  can_manage_google_drive BOOLEAN DEFAULT FALSE NOT NULL,
  can_manage_releases BOOLEAN DEFAULT FALSE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
ON user_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_admin_panel 
ON user_permissions(can_view_admin_panel) 
WHERE can_view_admin_panel = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_permissions_manage_admins 
ON user_permissions(can_manage_admins) 
WHERE can_manage_admins = TRUE;

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admin managers can update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can insert own permissions" ON user_permissions;

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
-- Csak a user_roles táblát nézi (nincs infinite recursion)
-- PLUSZ: Nem lehet saját magad jogait módosítani!
CREATE POLICY "Admins can update all permissions"
ON user_permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
  AND auth.uid() != user_id -- NEM MÓDOSÍTHATJA A SAJÁT JOGAIT!
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
  AND auth.uid() != user_id -- NEM MÓDOSÍTHATJA A SAJÁT JOGAIT!
);

CREATE POLICY "Users can insert own permissions"
ON user_permissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;

CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON user_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_permissions (
    user_id,
    can_view_infosharer,
    can_view_admin_panel,
    can_manage_admins,
    can_manage_google_drive,
    can_manage_releases
  ) VALUES (
    NEW.id,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_permissions ON auth.users;

CREATE TRIGGER on_user_created_permissions
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_permissions();

-- ====================================
-- 4. SUPER ADMIN BEÁLLÍTÁSA
-- ====================================

-- CSERÉLD KI AZ EMAIL CÍMET!
UPDATE user_permissions
SET 
  can_view_infosharer = TRUE,
  can_view_admin_panel = TRUE,
  can_manage_admins = TRUE,
  can_manage_google_drive = TRUE,
  can_manage_releases = TRUE,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com'
);

UPDATE user_roles
SET 
  is_admin = TRUE,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com'
);

-- ====================================
-- 5. ELLENŐRZÉS
-- ====================================

-- Profiles
SELECT 
  p.id,
  p.email,
  p.created_at
FROM profiles p
ORDER BY p.email;

-- Infosharer user texts
SELECT 
  ut.user_id,
  au.email,
  LENGTH(ut.text) as text_length,
  ut.created_at
FROM infosharer_user_texts ut
LEFT JOIN auth.users au ON ut.user_id = au.id
ORDER BY ut.created_at DESC;

-- User permissions
SELECT 
  up.user_id,
  au.email,
  up.can_view_infosharer,
  up.can_view_admin_panel,
  up.can_manage_admins,
  up.can_manage_google_drive,
  up.can_manage_releases
FROM user_permissions up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY au.email;

-- Super admin ellenőrzés
SELECT 
  au.email,
  ur.is_admin,
  up.can_view_infosharer,
  up.can_view_admin_panel,
  up.can_manage_admins,
  up.can_manage_google_drive,
  up.can_manage_releases
FROM auth.users au
LEFT JOIN user_roles ur ON ur.user_id = au.id
LEFT JOIN user_permissions up ON up.user_id = au.id
WHERE au.email = 'xxhaltiruxx@gmail.com';

-- ====================================
-- KÉSZ! ✅
-- ====================================
-- 
-- Most már:
-- 1. Minden user automatikusan kap privát szövegdobozt
-- 2. Minden user automatikusan kap permissions rekordot
-- 3. Super admin beállítva (ha az email cím helyes)
--
-- Következő lépés:
-- - Frissítsd az oldalt (Ctrl+Shift+R)
-- - Jelentkezz be
-- - Teszteld a Közös / Privát szövegdoboz váltást
-- - Ellenőrizd az Admin panel jogosultságokat
--
-- ====================================
