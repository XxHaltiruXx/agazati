-- ====================================
-- GYORS ADMIN BEÁLLÍTÁS - User Metadata
-- ====================================
-- Ez a módszer MINDIG működik, mert közvetlenül az auth.users táblát módosítja

-- 1. ELŐSZÖR: Ellenőrizd hogy létezik-e a user_roles tábla
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_roles';

-- Ha a fenti query NEM ad vissza eredményt, akkor a tábla nem létezik!
-- Ebben az esetben HOZD LÉTRE:

-- 2. User_roles tábla létrehozása (ha nem létezik)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- 3. RLS engedélyezése
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy-k törlése (ha vannak)
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- 5. Új RLS Policy-k
-- Mindenki láthatja a saját szerepét
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Mindenki létrehozhatja a saját szerepét (első bejelentkezéskor)
CREATE POLICY "Users can insert their own role" ON public.user_roles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. Admin felhasználó hozzáadása a user_roles táblához
INSERT INTO public.user_roles (user_id, is_admin, created_at, updated_at)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com'),
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET is_admin = true, updated_at = NOW();

-- 7. ALTERNATÍV MÓDSZER: User Metadata (ha a fenti nem működik)
-- Ez KÖZVETLENÜL az auth.users táblát módosítja
UPDATE auth.users
SET raw_user_meta_data = 
    CASE 
        WHEN raw_user_meta_data IS NULL THEN '{"is_admin": true}'::jsonb
        ELSE raw_user_meta_data || '{"is_admin": true}'::jsonb
    END
WHERE email = 'xxhaltiruxx@gmail.com';

-- 8. ELLENŐRZÉS
-- Nézd meg a user_roles táblát
SELECT 
    ur.user_id,
    ur.is_admin,
    au.email,
    ur.created_at,
    ur.updated_at
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'xxhaltiruxx@gmail.com';

-- Nézd meg a user metadata-t
SELECT 
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'is_admin' as is_admin_from_metadata
FROM auth.users
WHERE email = 'xxhaltiruxx@gmail.com';
