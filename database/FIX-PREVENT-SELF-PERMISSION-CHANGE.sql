-- ====================================
-- FIX: Megakadályozza, hogy a felhasználók
-- saját magukat jogait módosítsák
-- ====================================

-- DROP és újra CREATE az UPDATE policy
DROP POLICY IF EXISTS "Admins can update all permissions" ON user_permissions;

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

-- Ellenőrzés
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
WHERE tablename = 'user_permissions'
AND policyname = 'Admins can update all permissions';

-- ====================================
-- KÉSZ! ✅
-- ====================================
-- Most már senki sem módosíthatja a saját jogait,
-- még admin sem!
