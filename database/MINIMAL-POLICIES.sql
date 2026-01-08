-- IDEIGLENES MEGOLDÁS - CSAK USER_ID ALAPÚ POLICY-K
-- Töröljük az admin metadata policy-kat ami problémát okozhat

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;

-- Maradjon csak a két egyszerű
-- 1. "Users can view own role" - SELECT - auth.uid() = user_id ✅
-- 2. "Users can insert own role" - INSERT - auth.uid() = user_id ✅

-- Ellenőrzés
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_roles';

-- Most csak 2 policy marad - teszteléshez!
