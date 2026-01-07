-- ====================================
-- SUPABASE SQL MIGRÁCIÓ
-- User Roles Tábla Létrehozása
-- ====================================

-- User roles tábla létrehozása
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index létrehozása a gyorsabb kereséshez
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_admin ON user_roles(is_admin);

-- Row Level Security (RLS) engedélyezése
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Mindenki láthatja a saját adatait
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admin felhasználók láthatnak minden rekordot
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- Policy: Admin felhasználók módosíthatják az összes rekordot
CREATE POLICY "Admins can update all roles"
ON user_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- Policy: Új felhasználó regisztrálásakor automatikusan létrehozunk egy rekordot
CREATE POLICY "Users can insert own role on signup"
ON user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger function: updated_at automatikus frissítése
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: updated_at frissítése minden módosításkor
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function: Új user létrehozásakor automatikusan hozzunk létre egy user_role rekordot
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, is_admin)
  VALUES (NEW.id, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auth.users táblában új user létrehozásakor
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- ====================================
-- KEZDETI ADMIN FELHASZNÁLÓ LÉTREHOZÁSA (OPCIONÁLIS)
-- ====================================
-- Cseréld le az email címet a saját admin email címedre
-- Ez a sor csak akkor fut le, ha van már egy regisztrált felhasználó ezzel az email címmel

-- Példa:
-- INSERT INTO user_roles (user_id, is_admin)
-- SELECT id, TRUE FROM auth.users WHERE email = 'admin@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET is_admin = TRUE;

-- ====================================
-- KÉSZ!
-- ====================================
-- Most már használhatod a user_roles táblát az admin jogosultságok kezeléséhez.
-- Az első admin felhasználót manuálisan kell létrehoznod a Supabase Dashboard-on keresztül,
-- vagy az SQL Editor-ban az alábbi paranccsal:
-- 
-- UPDATE user_roles SET is_admin = TRUE WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
