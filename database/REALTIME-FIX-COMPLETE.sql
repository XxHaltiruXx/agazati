-- ====================================
-- SUPABASE REALTIME TELJES JAVÍTÁS
-- ====================================
-- Ez a script megoldja a "mismatch between server and client bindings" hibát
-- FONTOS: Futtasd le ezt SORBAN a Supabase Dashboard → SQL Editor-ban!

-- ====================================
-- 1. LÉPÉS: ELLENŐRZÉS
-- ====================================

-- user_roles tábla létezik-e?
SELECT 'user_roles tábla:' as info, COUNT(*) as exists
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_roles';

-- RLS be van-e kapcsolva?
SELECT 'RLS status:' as info, relrowsecurity as enabled
FROM pg_class 
WHERE relname = 'user_roles';

-- Milyen policy-k vannak?
SELECT 'Létező policy-k:' as info, policyname
FROM pg_policies 
WHERE tablename = 'user_roles';

-- ====================================
-- 2. LÉPÉS: REALTIME PUBLICATION BEÁLLÍTÁSA
-- ====================================

-- Először próbáljuk eltávolítani a user_roles-t (hibát dob ha nincs benne, de ezt elkapjuk)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE user_roles;
    RAISE NOTICE 'user_roles eltávolítva a publication-ből';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'user_roles nem volt a publication-ben, folytatás...';
    WHEN others THEN
        RAISE NOTICE 'Nem sikerült eltávolítani, de folytatjuk...';
END
$$;

-- Most adjuk hozzá (vagy újra)
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;

-- Ellenőrzés: user_roles benne van-e a publication-ben?
SELECT 
    'Publication check:' as info,
    schemaname, 
    tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'user_roles';

-- Ha az előző query üres eredményt ad, próbáld ezt:
-- Nézd meg melyik oszlopokat publikál
SELECT 
    'Publikált oszlopok:' as info,
    tablename,
    attname as column_name
FROM pg_publication_tables pt
JOIN pg_attribute a ON a.attrelid = (SELECT oid FROM pg_class WHERE relname = pt.tablename)
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'user_roles'
  AND attnum > 0 
  AND NOT attisdropped;

-- ====================================
-- 3. LÉPÉS: RLS POLICY JAVÍTÁS
-- ====================================
-- A Realtime CSAK azokat a változásokat küldi el, amiket a user láthat az RLS szerint!

-- Töröljük az összes régi policy-t
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- 1. Mindenki láthatja a SAJÁT szerepét (FONTOS a Realtime-hoz!)
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Adminok láthatják MINDEN szerepet (FONTOS a Realtime-hoz!)
-- Ez NINCS rekurzió, mert a JWT metadata-t használja
CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT
    USING (
        (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
    );

-- 3. Adminok módosíthatják MINDEN szerepet
CREATE POLICY "Admins can update all roles" ON public.user_roles
    FOR UPDATE
    USING (
        (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
    )
    WITH CHECK (
        (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
    );

-- 4. Mindenki létrehozhatja a SAJÁT szerepét (regisztráció)
CREATE POLICY "Users can insert their own role" ON public.user_roles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. Adminok létrehozhatnak BÁRMILYEN szerepet
CREATE POLICY "Admins can insert roles" ON public.user_roles
    FOR INSERT
    WITH CHECK (
        (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
    );

-- ====================================
-- 4. LÉPÉS: ELLENŐRZÉS
-- ====================================

-- Policy-k ellenőrzése
SELECT 
    'Policy lista:' as info,
    policyname, 
    cmd as operation,
    permissive
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Realtime publication végleges ellenőrzés
SELECT 
    'Realtime publikáció:' as info,
    COUNT(*) as tables_published
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'user_roles';

-- ====================================
-- 5. LÉPÉS: TESZTELÉS
-- ====================================
-- Ha minden OK:
-- 1. Frissítsd az oldalt (F5)
-- 2. Nyisd meg a konzolt
-- 3. Keresd: "✅ Realtime subscription aktív!"
-- 4. Ha látod, akkor működik!
-- 5. Próbáld megváltoztatni egy felhasználó admin státuszát
-- 6. Mindkét félnek kapnia kell értesítést

-- ====================================
-- TROUBLESHOOTING
-- ====================================

-- HA TOVÁBBRA IS "mismatch" HIBÁT KAPSZ:

-- 1. Próbáld újraindítani a Realtime service-t:
--    Supabase Dashboard → Project Settings → API → Realtime section → Restart

-- 2. Ellenőrizd a Supabase Project Settings → API:
--    - Realtime: Enabled
--    - Realtime Authorization: authenticated (ne legyen "none")

-- 3. Ellenőrizd a user_roles tábla szerkezetét:
SELECT 
    'Tábla szerkezet:' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Ha semmi sem működik, próbáld törölni és újralétrehozni a publication-t:
--    (VIGYÁZAT: Ez az ÖSSZES realtime subscription-t érinti!)
-- DROP PUBLICATION IF EXISTS supabase_realtime;
-- CREATE PUBLICATION supabase_realtime FOR TABLE user_roles;

-- 5. Végső megoldás: Változtasd meg a channel nevét a JavaScript-ben
--    Pl.: 'user_roles_changes' helyett 'user_roles_v2'
