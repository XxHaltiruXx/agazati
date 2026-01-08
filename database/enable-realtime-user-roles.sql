-- ====================================
-- REALTIME ENGEDÉLYEZÉSE A USER_ROLES TÁBLÁN
-- ====================================
-- Ez a script engedélyezi a Supabase Realtime-ot a user_roles táblán
-- hogy a kliensek real-time értesítéseket kapjanak az admin jogosultság változásokról

-- FONTOS: Futtasd le ezt a scriptet a Supabase Dashboard → SQL Editor-ban!

-- 1. Először ellenőrizzük, hogy a user_roles tábla létezik-e
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_roles';

-- 2. User_roles tábla hozzáadása a realtime publication-höz
-- Ha már benne van, ez nem fog hibát adni
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;

-- 3. Ellenőrzés - nézd meg hogy a user_roles tábla benne van-e
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'user_roles';

-- Ha az előző query eredménye üres, próbáld ezt:
-- DROP PUBLICATION IF EXISTS supabase_realtime;
-- CREATE PUBLICATION supabase_realtime FOR TABLE user_roles;

-- ====================================
-- ELLENŐRZÉS ÉS TROUBLESHOOTING
-- ====================================

-- Ellenőrizd a Realtime beállításokat:
-- 1. Supabase Dashboard → Project Settings → API
-- 2. Realtime: Enabled legyen
-- 3. Realtime Authorization: anon vagy authenticated

-- Ellenőrizd az RLS policy-kat:
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- A user_roles táblának SELECT policy-val kell rendelkeznie hogy a Realtime működjön!

-- ====================================
-- HA TOVÁBBRA IS HIBA VAN
-- ====================================
-- Próbáld újraindítani a Realtime-ot a projektben:
-- 1. Supabase Dashboard → Project Settings → API
-- 2. Realtime section-nél kattints a Restart gombra
-- 3. Várj 1-2 percet
-- 4. Frissítsd az oldalt

-- Vagy próbáld meg így:
-- ALTER PUBLICATION supabase_realtime DROP TABLE user_roles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;

-- ====================================
-- HASZNÁLAT
-- ====================================
-- Futtasd le ezt a scriptet a Supabase Dashboard → SQL Editor-ban
-- 
-- Ezután a JavaScript kód automatikusan fogja tudni használni a Realtime API-t:
-- 
-- this.realtimeChannel = this.sb
--   .channel('user_roles_changes')
--   .on('postgres_changes', { 
--     event: '*', 
--     schema: 'public', 
--     table: 'user_roles' 
--   }, (payload) => {
--     // Real-time változások kezelése
--   })
--   .subscribe();

-- ====================================
-- TROUBLESHOOTING
-- ====================================
-- Ha nem működik a realtime:
-- 1. Ellenőrizd hogy a Supabase projekt Realtime be van-e kapcsolva (Project Settings → API)
-- 2. Ellenőrizd hogy a user_roles táblán vannak-e megfelelő RLS policy-k
-- 3. A realtime csak azokat a változásokat küldi el, amiket a current user láthat az RLS policy-k szerint
