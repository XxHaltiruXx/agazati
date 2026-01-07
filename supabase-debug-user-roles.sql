-- ====================================
-- SUPABASE USER ROLES DEBUG SCRIPT
-- ====================================
-- Futtasd le ezeket az SQL Editor-ban a problémák diagnosztizálásához

-- 1. ELLENŐRIZD HOGY LÉTEZIK-E A USER_ROLES TÁBLA
-- ====================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
) AS user_roles_table_exists;

-- 2. NÉZD MEG AZ AUTH.USERS TÁBLÁT
-- ====================================
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. NÉZD MEG A USER_ROLES TÁBLÁT
-- ====================================
SELECT * FROM user_roles
ORDER BY created_at DESC;

-- 4. ELLENŐRIZD A TRIGGER-T
-- ====================================
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 5. ELLENŐRIZD A FUNCTION-T
-- ====================================
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 6. MANUAL USER ROLE LÉTREHOZÁS (HA HIÁNYZIK)
-- ====================================
-- Cseréld le az email címet!
-- Ez létrehoz egy user_role rekordot az összes olyan usernek, akinek még nincs

INSERT INTO user_roles (user_id, is_admin)
SELECT id, FALSE 
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- 7. ELLENŐRIZD AZ RLS POLICY-KAT
-- ====================================
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
WHERE tablename = 'user_roles';

-- 8. TESZT: PRÓBÁLD MEG MANUÁLISAN BESZÚRNI
-- ====================================
-- Cseréld le az email címet!
-- Ha ez is hibát dob, akkor az RLS policy-val van gond

DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Keress egy user-t
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'bankutim13@ganziskola.hu' LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Próbáld beszúrni
    INSERT INTO user_roles (user_id, is_admin)
    VALUES (test_user_id, FALSE)
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
    
    RAISE NOTICE 'User role created/updated for user_id: %', test_user_id;
  ELSE
    RAISE NOTICE 'User not found with email: bankutim13@ganziskola.hu';
  END IF;
END $$;

-- 9. NÉZD MEG A VÉGEREDMÉNYT
-- ====================================
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  ur.is_admin,
  ur.created_at as role_created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- ====================================
-- HA A TRIGGER NEM MŰKÖDIK, TÖRÖLD ÉS HOZD LÉTRE ÚJRA
-- ====================================

-- Trigger törlése
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Function törlése
DROP FUNCTION IF EXISTS handle_new_user();

-- Function újra létrehozása
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, is_admin)
  VALUES (NEW.id, FALSE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger újra létrehozása
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- ====================================
-- TESZTELÉS: ÚJ USER LÉTREHOZÁSA
-- ====================================
-- Most regisztrálj egy új usert a weboldalon
-- Majd futtasd le ezt újra:

SELECT 
  u.id,
  u.email,
  ur.is_admin,
  ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'test@example.com'  -- Cseréld le az új user email-jére
LIMIT 1;

-- ====================================
-- VÉGSŐ ELLENŐRZÉS
-- ====================================

-- Hány user van összesen?
SELECT COUNT(*) as total_users FROM auth.users;

-- Hány user_role van összesen?
SELECT COUNT(*) as total_roles FROM user_roles;

-- Ha a kettő nem egyezik, akkor a trigger nem működik megfelelően!

