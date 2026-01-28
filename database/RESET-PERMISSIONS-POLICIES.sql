-- ====================================
-- USER PERMISSIONS RLS FIX - KORRIGÁLT VERZIÓ
-- ====================================
-- 
-- Ez a script megoldja az már meglévő policies problémáját.
-- Az UPDATE policy-kat kidobjuk és újra hozzuk létre.
--

-- FONTOS: Az összes USER_PERMISSIONS policy törlése
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admin managers can update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can insert own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can insert any permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update any permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can delete permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admin managers can update permissions" ON user_permissions;

-- Ellenőrzés: milyen policies maradtak?
SELECT policyname FROM pg_policies WHERE tablename = 'user_permissions';

-- ====================================
-- ÚJ POLICIES LÉTREHOZÁSA
-- ====================================

-- 1. SELECT - Saját jogosultságok
CREATE POLICY "Users view own permissions"
ON user_permissions FOR SELECT
USING (auth.uid() = user_id);

-- 2. SELECT - Admin látja az összes jogosultságot
CREATE POLICY "Admins view all permissions"
ON user_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- 3. INSERT - Saját jogosultság
CREATE POLICY "Users insert own permissions"
ON user_permissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. INSERT - Admin beszúrhat másoknál
CREATE POLICY "Admins insert any permissions"
ON user_permissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- 5. UPDATE - Adminok módosíthatnak (NEM self-reference!)
CREATE POLICY "Admins update any permissions"
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

-- 6. DELETE - Adminok törölhetnek
CREATE POLICY "Admins delete permissions"
ON user_permissions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- ====================================
-- USER_ROLES POLICIES ELLENŐRZÉSE
-- ====================================

-- Töröljük az user_roles policies-t is (ha okoznak problémát)
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Új user_roles policies
CREATE POLICY "Users view own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.is_admin = TRUE
  )
);

-- UPDATE csak az első (legelső) adminnak
CREATE POLICY "First admin manages roles"
ON user_roles FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE is_admin = TRUE 
    ORDER BY created_at ASC 
    LIMIT 1
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE is_admin = TRUE 
    ORDER BY created_at ASC 
    LIMIT 1
  )
);

-- ====================================
-- VÉGSŐ ELLENŐRZÉS
-- ====================================

-- Milyen policies vannak az user_permissions-en?
SELECT 
    policyname, 
    cmd,
    qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'user_permissions'
ORDER BY cmd, policyname;

-- ✅ KÉSZ!
-- Most már működnie kell a jogosultságok módosítása.
