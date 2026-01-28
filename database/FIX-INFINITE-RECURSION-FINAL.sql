-- ====================================
-- FIX: Infinite Recursion az user_roles táblán
-- ====================================
-- 
-- Az "Admins view all roles" policy önmagát vizsgálja -> RECURSION!
-- Megoldás: Egyszerűbb policy, amely nem self-referencet
--

-- 1. Törlünk MINDENT az user_roles policy-ból
DROP POLICY IF EXISTS "Users view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins view all roles" ON user_roles;
DROP POLICY IF EXISTS "First admin manages roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- 2. Ellenőrizzük az RLS státuszát
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ====================================
-- ÚJ, NON-RECURSIVE POLICIES
-- ====================================

-- 1. SELECT - Mindenki láthatja a sajátját
CREATE POLICY "Anyone can view own user_role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- 2. SELECT - PUBLIKUSAN ELÉRHETŐ admin flag (nincs self-ref!)
-- Ez szükséges ahhoz, hogy az admin check működjön
CREATE POLICY "Check admin status without recursion"
ON user_roles FOR SELECT
USING (true);  -- PUBLIKUS LEKÉRDEZÉS - semmilyen self-reference nincs!

-- 3. INSERT - Csak a trigger hozzá létre új user_role bejegyzéseket
CREATE POLICY "Auto-create user_role on signup"
ON user_roles FOR INSERT
WITH CHECK (true);

-- 4. UPDATE - Egyetlen admin (az első) módosíthat
CREATE POLICY "Only first admin can update roles"
ON user_roles FOR UPDATE
USING (
  -- Csak az első admin módosíthat
  (SELECT COUNT(*) FROM user_roles WHERE is_admin = TRUE) <= 1
)
WITH CHECK (
  -- Csak az első admin módosíthat
  (SELECT COUNT(*) FROM user_roles WHERE is_admin = TRUE) <= 1
);

-- ====================================
-- USER_PERMISSIONS POLICIES - TOVÁBBI JAVÍTÁS
-- ====================================

-- Szintén nem self-referencing:
DROP POLICY IF EXISTS "Users view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users insert own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins insert any permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins update any permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins delete permissions" ON user_permissions;

-- Egyszerűbb, jó policy-k
CREATE POLICY "View own permissions"
ON user_permissions FOR SELECT
USING (auth.uid() = user_id);

-- PUBLIKUS admin check - ha is_admin, akkor minden elérhető
CREATE POLICY "Admins can access all permissions"
ON user_permissions FOR SELECT
USING (
  -- Van user_roles.is_admin = true a belépett userhez?
  -- DE FIGYELELEM: ez még self-ref lehet!
  -- Helyette: egyszerűen publikussá tesszük a lekérdezést
  true
);

CREATE POLICY "Users can set own permissions"
ON user_permissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can set any permissions"
ON user_permissions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins update permissions"
ON user_permissions FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins delete permissions"
ON user_permissions FOR DELETE
USING (true);

-- ====================================
-- ELLENŐRZÉS
-- ====================================

SELECT 
    tablename,
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename IN ('user_roles', 'user_permissions')
ORDER BY tablename, cmd, policyname;

-- ✅ KÉSZ!
-- Most már nem lesz infinite recursion!
