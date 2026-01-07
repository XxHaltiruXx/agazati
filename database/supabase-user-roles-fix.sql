-- ====================================
-- USER ROLES TÁBLA RLS POLICY JAVÍTÁS
-- ====================================
-- Ez a script javítja a user_roles tábla RLS policy-jét
-- hogy a felhasználók lekérdezhessék a saját szerepüket

-- 1. Engedélyezzük az RLS-t a user_roles táblán (ha még nincs)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Töröljük a régi policy-ket (ha vannak)
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;

-- 3. Policy: A felhasználók láthatják a saját szerepüket
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Policy: Az adminok láthatják az összes szerepet
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 5. Policy: Az adminok frissíthetik az összes szerepet
CREATE POLICY "Admins can update all roles" ON user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 6. Policy: A felhasználók létrehozhatják a saját szerepüket (első bejelentkezéskor)
CREATE POLICY "Users can insert their own role" ON user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. Policy: Az adminok létrehozhatnak új szerepeket
CREATE POLICY "Admins can insert roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ====================================
-- ELLENŐRZÉS
-- ====================================
-- Ellenőrizzük hogy van-e admin felhasználó
SELECT user_id, is_admin, created_at 
FROM user_roles 
WHERE is_admin = true;

-- Ha nincs admin, adj hozzá egyet (cseréld le az UUID-t a saját user_id-dre)
-- SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com';
-- Majd:
-- INSERT INTO user_roles (user_id, is_admin, created_at, updated_at)
-- VALUES ('YOUR_USER_ID_HERE', true, NOW(), NOW())
-- ON CONFLICT (user_id) DO UPDATE SET is_admin = true, updated_at = NOW();
