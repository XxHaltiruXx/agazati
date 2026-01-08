-- ============================================================
-- TELJES RLS POLICY RESET - VÉGTELEN REKURZIÓ KIJAVÍTÁSA
-- ============================================================

-- 1. KAPCSOLJUK KI AZ RLS-T TELJESEN (IDEIGLENES)
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. TÖRÖLJÜK AZ ÖSSZES POLICY-T
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_roles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
        RAISE NOTICE 'Törölve: %', pol.policyname;
    END LOOP;
END $$;

-- 3. ELLENŐRZÉS - ÜRES LISTA KELL LEGYEN
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- 4. KAPCSOLJUK VISSZA AZ RLS-T
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. LÉTREHOZZUK AZ ÚJ POLICY-KAT (METADATA ALAPÚ - NEM REKURZÍV)

-- Policy 1: User láthatja saját role-ját (EGYSZERŰ, NEM REKURZÍV)
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: User beszúrhatja saját role-ját regisztrációkor (EGYSZERŰ, NEM REKURZÍV)
CREATE POLICY "Users can insert own role" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admin láthatja MINDEN role-t (METADATA - NEM TÁBLÁZAT QUERY!)
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
    COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
        false
    ) = true
);

-- Policy 4: Admin frissítheti MINDEN role-t (METADATA - NEM TÁBLÁZAT QUERY!)
CREATE POLICY "Admins can update all roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (
    COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
        false
    ) = true
)
WITH CHECK (
    COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
        false
    ) = true
);

-- 6. VÉGSŐ ELLENŐRZÉS
SELECT 
    policyname, 
    cmd,
    qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

-- Várható: 4 policy
-- ✅ "Admins can update all roles" - UPDATE
-- ✅ "Admins can view all roles" - SELECT  
-- ✅ "Users can insert own role" - INSERT
-- ✅ "Users can view own role" - SELECT

-- FONTOS: 
-- - Egyik policy sem tartalmaz subquery-t a user_roles táblára!
-- - Csak auth.uid() és auth.jwt() metadata használat
-- - Nincs EXISTS (SELECT ... FROM user_roles ...) típusú rekurzív logika
