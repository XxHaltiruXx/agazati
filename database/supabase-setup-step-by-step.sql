-- ====================================
-- SUPABASE USER ROLES - LÉPÉSRŐL LÉPÉSRE
-- ====================================
-- Futtasd le ezeket EGYENKÉNT a Supabase SQL Editor-ban!
-- Kattints RUN minden egyes lépés után.

-- ====================================
-- 1. LÉPÉS: TÁBLA LÉTREHOZÁSA
-- ====================================
-- Ez létrehozza a user_roles táblát

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 2. LÉPÉS: INDEXEK LÉTREHOZÁSA
-- ====================================
-- Gyorsabb kereséshez

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_admin ON user_roles(is_admin);

-- ====================================
-- 3. LÉPÉS: ROW LEVEL SECURITY BEKAPCSOLÁSA
-- ====================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 4. LÉPÉS: RLS POLICY-K LÉTREHOZÁSA
-- ====================================
-- Először töröljük a régieket, ha léteznek

DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role on signup" ON user_roles;

-- User láthatja a saját role-ját
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Admin láthat minden role-t
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- Admin módosíthat minden role-t
CREATE POLICY "Admins can update all roles"
ON user_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- User létrehozhatja a saját role-ját regisztrációkor
CREATE POLICY "Users can insert own role on signup"
ON user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ====================================
-- 5. LÉPÉS: TRIGGER FUNCTION LÉTREHOZÁSA
-- ====================================
-- Ez frissíti az updated_at mezőt

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 6. LÉPÉS: UPDATED_AT TRIGGER
-- ====================================

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 7. LÉPÉS: HANDLE_NEW_USER FUNCTION
-- ====================================
-- Ez automatikusan létrehoz egy user_role rekordot új user-nek

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, is_admin)
  VALUES (NEW.id, FALSE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- 8. LÉPÉS: USER CREATION TRIGGER
-- ====================================
-- Ez meghívja a handle_new_user function-t minden új user-nél

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- ====================================
-- 9. LÉPÉS: MEGLÉVŐ USER-EK ROLE-JAINAK LÉTREHOZÁSA
-- ====================================
-- Ez hozzáad role-t minden olyan user-hez, akinek még nincs

INSERT INTO user_roles (user_id, is_admin)
SELECT id, FALSE 
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ====================================
-- 10. LÉPÉS: ELLENŐRZÉS
-- ====================================
-- Futtasd le ezt hogy lásd az eredményt

SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  ur.is_admin,
  ur.created_at as role_created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;

-- ====================================
-- 11. LÉPÉS (OPCIONÁLIS): ADMIN JOG HOZZÁADÁSA
-- ====================================
-- Cseréld le az email címet a sajátodra!

-- UPDATE user_roles 
-- SET is_admin = TRUE 
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'bankutim13@ganziskola.hu'
-- );

-- ====================================
-- KÉSZ! ✅
-- ====================================
-- Most már minden működik:
-- ✅ user_roles tábla létezik
-- ✅ RLS policy-k beállítva
-- ✅ Trigger-ek létrehozva
-- ✅ Meglévő user-eknek van role-juk
-- ✅ Új user-eknek automatikusan lesz role-juk

-- Ellenőrizd újra:
SELECT COUNT(*) as user_count FROM auth.users;
SELECT COUNT(*) as role_count FROM user_roles;
-- A kettő számának meg kell egyeznie!

