-- ====================================
-- PROFILES TÁBLA LÉTREHOZÁSA
-- ====================================
-- Ez a tábla tárolja a felhasználók publikus adatait
-- amit az admin panel is el tud érni

-- 1. Profiles tábla létrehozása
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS engedélyezése
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Mindenki láthatja az összes profilt (email-t)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);

-- 4. RLS Policy: Csak saját profil frissíthető
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 5. RLS Policy: Profil automatikusan létrehozható regisztráció után
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 6. Trigger function: Automatikus profil létrehozása új user-hez
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger: Auth.users táblában új user esetén
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Meglévő userek profiljainak létrehozása
INSERT INTO public.profiles (id, email, created_at)
SELECT 
    id, 
    email,
    created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- KÉSZ!
-- ====================================
-- Most már a profiles táblát használhatjuk az admin panelben
-- és látszani fog a felhasználók email címe!
