-- ============================================================
-- RLS POLICY-K JAVÍTÁSA - EGYSZERŰ, NEM REKURZÍV VERZIÓ
-- ============================================================

-- PROBLÉMA: A policy-k rekurzív subquery-ket futtatnak → 500 Internal Server Error
-- MEGOLDÁS: Használjuk a user metadata-t (is_admin mező) a policy-kban

-- ============================================================
-- 1. TÖRÖLJÜK AZ ÖSSZES MEGLÉVŐ POLICY-T
-- ============================================================

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- ============================================================
-- 2. LÉTREHOZZUK AZ ÚJ, EGYSZERŰ POLICY-KAT
-- ============================================================

-- Policy 1: Bárki láthatja saját role-ját
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Bárki beszúrhatja saját role-ját (regisztrációkor)
CREATE POLICY "Users can insert own role" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admin láthatja az ÖSSZES role-t (metadata alapján)
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
);

-- Policy 4: Admin frissítheti az ÖSSZES role-t (metadata alapján)
CREATE POLICY "Admins can update all roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
)
WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
);

-- ============================================================
-- 3. ELLENŐRZÉS
-- ============================================================

SELECT 
    policyname, 
    cmd,
    qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

-- Várható eredmény: 4 policy
-- - SELECT: "Users can view own role" (auth.uid() = user_id)
-- - SELECT: "Admins can view all roles" (metadata check)
-- - INSERT: "Users can insert own role" (auth.uid() = user_id)
-- - UPDATE: "Admins can update all roles" (metadata check)
