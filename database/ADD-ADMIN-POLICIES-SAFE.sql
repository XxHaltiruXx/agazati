-- ============================================================
-- ADMIN POLICY-K - SECURITY DEFINER FUNKCIÓVAL (NEM REKURZÍV)
-- ============================================================

-- PROBLÉMA: A metadata-based policy végtelen rekurziót okozott
-- MEGOLDÁS: Security definer funkció ami MEGKERÜLI az RLS-t

-- ============================================================
-- 1. SECURITY DEFINER FUNKCIÓ AZ ADMIN ELLENŐRZÉSHEZ
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_to_check uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Ez megkerüli az RLS policy-kat!
SET search_path = public
AS $$
BEGIN
    -- Közvetlenül az adatbázisból olvassuk
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = user_id_to_check 
        AND is_admin = true
    );
END;
$$;

-- ============================================================
-- 2. ADMIN POLICY-K A SECURITY DEFINER FUNKCIÓVAL
-- ============================================================

-- Először töröljük ha léteznek
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;

-- Admin láthatja az ÖSSZES role-t (funkció hívás - nem közvetlen query!)
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
    public.is_user_admin(auth.uid())
);

-- Admin frissítheti az ÖSSZES role-t (funkció hívás - nem közvetlen query!)
CREATE POLICY "Admins can update all roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (
    public.is_user_admin(auth.uid())
)
WITH CHECK (
    public.is_user_admin(auth.uid())
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

-- Várható: 4 policy
-- ✅ INSERT: "Users can insert own role"
-- ✅ SELECT: "Admins can view all roles" - is_user_admin(auth.uid())
-- ✅ SELECT: "Users can view own role"
-- ✅ UPDATE: "Admins can update all roles" - is_user_admin(auth.uid())

-- ============================================================
-- MIÉRT NEM LESZ REKURZÍV?
-- ============================================================
-- SECURITY DEFINER funkció:
-- - MEGKERÜLI az RLS policy-kat
-- - KÖZVETLENÜL lekérdezi a táblát
-- - NINCS végtelen loop!
