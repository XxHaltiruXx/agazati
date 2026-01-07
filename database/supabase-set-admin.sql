-- ====================================
-- ADMIN FELHASZNÁLÓ BEÁLLÍTÁSA - TELJES MEGOLDÁS
-- ====================================
-- Ez a script megoldja a végtelen rekurziós hibát és beállítja az admin jogot

-- ==========================================
-- 1. RLS POLICY-K JAVÍTÁSA (végtelen rekurzió megszüntetése)
-- ==========================================

-- Töröljük az összes régi policy-t
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Mindenki láthatja a saját szerepét
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Mindenki létrehozhatja a saját szerepét
CREATE POLICY "Users can insert their own role" ON public.user_roles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin felhasználók kezelhetik az összes szerepet (METADATA alapján - NINCS REKURZIÓ)
CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL
    USING (
        (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
    )
    WITH CHECK (
        (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
    );

-- ==========================================
-- 2. ADMIN JOG BEÁLLÍTÁSA USER METADATA-BAN
-- ==========================================

UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb 
WHERE email = 'xxhaltiruxx@gmail.com';

-- ==========================================
-- 3. ADMIN BEJEGYZÉS A USER_ROLES TÁBLÁBAN
-- ==========================================

INSERT INTO public.user_roles (user_id, is_admin, created_at, updated_at)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com'),
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET is_admin = true, updated_at = NOW();

-- ==========================================
-- 4. ELLENŐRZÉS
-- ==========================================

-- User metadata ellenőrzése
SELECT 
    email,
    raw_user_meta_data->>'is_admin' as metadata_admin,
    raw_user_meta_data
FROM auth.users
WHERE email = 'xxhaltiruxx@gmail.com';

-- User roles tábla ellenőrzése
SELECT 
    ur.user_id,
    ur.is_admin as database_admin,
    au.email,
    ur.created_at,
    ur.updated_at
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'xxhaltiruxx@gmail.com';
