-- ====================================
-- QUICK FIX: Jogosultságok Kezelése
-- ====================================
-- 
-- Futtasd le ezt a scriptet a Supabase SQL Editor-ban.
-- Ez megoldja az RLS hibákat és biztosítja, hogy a jogosultságok működjenek.
--

-- 1. Töröljük a régi, hibás policies-t (ha vannak)
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admin managers can update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can insert own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can insert any permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update any permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can delete permissions" ON user_permissions;

-- 2. Ellenőrizzük, hogy a user_permissions tábla RLS-e engedélyezve van
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- 3. Új policy-k - egyszerű és működő
-- SELECT - Saját + Admin
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

-- INSERT - Saját + Admin
CREATE POLICY "Users can insert own permissions"
ON user_permissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert any permissions"
ON user_permissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- UPDATE - CSAK Admin (NEM self-reference!)
CREATE POLICY "Admins can update any permissions"
ON user_permissions FOR UPDATE
USING (
  -- Aki módosítja
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
)
WITH CHECK (
  -- Aki módosítja
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- DELETE - CSAK Admin
CREATE POLICY "Admins can delete permissions"
ON user_permissions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- 4. Ellenőrzés - Melyik policies vannak?
SELECT 
    policyname, 
    cmd,
    qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'user_permissions'
ORDER BY cmd, policyname;

-- ✅ KÉSZ! Most már működnie kell a jogosultságok módosítása.
