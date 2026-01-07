-- ====================================
-- USER_ROLES RLS POLICY JAVÍTÁS
-- ====================================
-- A végtelen rekurzió megszüntetése

-- 1. TÖRÖLJÜK az összes RLS policy-t
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- 2. EGYSZERŰ POLICY: Mindenki láthatja a saját szerepét
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Mindenki létrehozhatja a saját szerepét (első bejelentkezéskor)
CREATE POLICY "Users can insert their own role" ON public.user_roles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. ADMIN POLICY user metadata alapján (NINCS REKURZIÓ)
-- Admin felhasználók módosíthatják bármelyik szerepet
CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL
    USING (
        (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
    )
    WITH CHECK (
        (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
    );

-- 5. Admin felhasználó metadata beállítása
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb 
WHERE email = 'xxhaltiruxx@gmail.com';

-- 6. Admin bejegyzés létrehozása a user_roles táblában
INSERT INTO public.user_roles (user_id, is_admin, created_at, updated_at)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com'),
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET is_admin = true, updated_at = NOW();

-- 7. ELLENŐRZÉS
-- User metadata
SELECT 
    email,
    raw_user_meta_data->>'is_admin' as metadata_admin
FROM auth.users
WHERE email = 'xxhaltiruxx@gmail.com';

-- User roles tábla
SELECT 
    ur.user_id,
    ur.is_admin,
    au.email
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'xxhaltiruxx@gmail.com';
