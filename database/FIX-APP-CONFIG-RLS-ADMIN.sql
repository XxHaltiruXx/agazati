-- ====================================
-- app_config Tábla RLS Policy Javítás
-- ====================================
-- 
-- Admin userek számára teljes hozzáférés (SELECT, INSERT, UPDATE, DELETE)
-- az app_config táblához, hogy törölhessék a Google Drive token-t.
--

-- 1. Ellenőrizzük a jelenlegi policy-ket
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'app_config'
ORDER BY policyname;

-- 2. Admin DELETE policy létrehozása (ha még nincs)
CREATE POLICY IF NOT EXISTS "Admin users can delete app_config"
ON app_config
FOR DELETE
TO authenticated
USING (
  -- Csak admin userek törölhetnek
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. Admin UPDATE policy létrehozása (ha még nincs)
CREATE POLICY IF NOT EXISTS "Admin users can update app_config"
ON app_config
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. Admin INSERT policy létrehozása (ha még nincs)
CREATE POLICY IF NOT EXISTS "Admin users can insert app_config"
ON app_config
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Admin SELECT policy létrehozása (ha még nincs)
CREATE POLICY IF NOT EXISTS "Admin users can select app_config"
ON app_config
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 6. Ellenőrzés - Most már látszódnak az új policy-k
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'app_config'
ORDER BY cmd, policyname;

-- ====================================
-- TESZTELÉS
-- ====================================
-- 
-- Most már működnie kell a kijelentkezés gombnak!
-- Vagy futtasd le manuálisan:
-- 
-- DELETE FROM app_config WHERE key = 'google_drive_refresh_token';
-- 
-- ====================================
