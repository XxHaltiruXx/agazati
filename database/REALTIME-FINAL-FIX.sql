-- ============================================================
-- SUPABASE REALTIME - TELJES KONFIGURÁCIÓ USER_ROLES TÁBLÁHOZ
-- ============================================================
-- Futtasd le ezt PONTOSAN EBBEN A SORRENDBEN a Supabase Dashboard → SQL Editor-ban!

-- ============================================================
-- 1. REPLICA IDENTITY BEÁLLÍTÁSA (ez a leggyakoribb hiányzó elem!)
-- ============================================================
-- A "mismatch" hiba gyakran azért van, mert a táblának nincs megfelelő replica identity
-- Ez megmondja a Realtime-nak, hogy hogyan követhesse a változásokat

ALTER TABLE public.user_roles REPLICA IDENTITY FULL;

-- VAGY ha van primary key (ami valószínű):
-- ALTER TABLE public.user_roles REPLICA IDENTITY DEFAULT;

-- Ellenőrzés - nézd meg mi van beállítva:
SELECT relname, relreplident 
FROM pg_class 
WHERE relname = 'user_roles';
-- Ha 'f' = FULL, 'd' = DEFAULT (primary key), 'n' = NOTHING

-- ============================================================
-- 2. PUBLICATION ÚJRAKONFIGURÁLÁSA
-- ============================================================
-- Biztosítjuk hogy a user_roles tábla a publication-ben van

-- Először nézzük meg mi van most:
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Ha a user_roles NINCS benne, add hozzá:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- Ha MÁR BENNE VAN (ami most a helyzet), frissítsük:
DO $$ 
BEGIN
    -- Próbáljuk eltávolítani és visszaadni
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
        RAISE NOTICE '✅ Publication frissítve';
    EXCEPTION WHEN OTHERS THEN
        -- Ha nem sikerült eltávolítani (mert nincs benne), csak adjuk hozzá
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
            RAISE NOTICE '✅ Publication létrehozva';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE '✅ Publication már létezik';
        END;
    END;
END $$;

-- ============================================================
-- 3. RLS POLICY-K ELLENŐRZÉSE
-- ============================================================
-- Realtime CSAK azokat a változásokat küldi el, amiket a user láthat

-- Ellenőrizzük a meglévő policy-kat:
SELECT 
    policyname, 
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;

-- FONTOS: Kell SELECT policy authenticated user-eknek!
-- Ha nincs, add hozzá:

-- Policy 1: User láthatja saját role-ját
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Admin láthatja az összes role-t
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND is_admin = true
    )
);

-- Policy 3: Admin frissítheti a role-okat
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
CREATE POLICY "Admins can update all roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND is_admin = true
    )
);

-- ============================================================
-- 4. ELLENŐRZÉS
-- ============================================================

-- Nézd meg hogy minden rendben van-e:
SELECT 
    '✅ Replica Identity' as check_type,
    CASE 
        WHEN relreplident IN ('d', 'f') THEN '✅ Beállítva: ' || relreplident::text
        ELSE '❌ Nincs beállítva: ' || relreplident::text
    END as status
FROM pg_class 
WHERE relname = 'user_roles'

UNION ALL

SELECT 
    '✅ Publication' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ user_roles benne van'
        ELSE '❌ user_roles NINCS benne'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'user_roles'

UNION ALL

SELECT 
    '✅ SELECT Policy' as check_type,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ ' || COUNT(*)::text || ' SELECT policy van'
        ELSE '❌ NINCS SELECT policy'
    END as status
FROM pg_policies 
WHERE tablename = 'user_roles' 
AND cmd = 'SELECT';

-- ============================================================
-- 5. KÖVETKEZŐ LÉPÉSEK
-- ============================================================

-- SQL futtatása után:
-- 1. Supabase Dashboard → Project Settings → API
-- 2. Realtime section → **Restart** gomb (FONTOS!)
-- 3. Várj 2-3 percet
-- 4. Frissítsd a weboldalad (Ctrl+Shift+R)
-- 5. Nézd a console-t:
--    - Ha "✅ Realtime subscription aktív!" → MŰKÖDIK! 🎉
--    - Ha "mismatch" → ellenőrizd a console-t és jelezd

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================

-- Ha még mindig "mismatch" hibát kapsz:
-- 1. Ellenőrizd hogy a Realtime be van-e kapcsolva:
--    Dashboard → Project Settings → API → Realtime: Enabled

-- 2. Nézd meg a teljes channel konfigurációt a JavaScript-ben:
--    Biztosítsd hogy event: 'UPDATE' (nem '*')

-- 3. Ellenőrizd a Supabase JS verziódat:
--    npm list @supabase/supabase-js
--    Minimum v2.38.0 ajánlott

-- 4. Ha semmi nem segít, kapcsold ki a realtime-ot és használd csak a polling-ot
--    (ami most is fut 10 másodperces intervallummal)
