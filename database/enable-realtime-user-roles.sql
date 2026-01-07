-- ====================================
-- REALTIME ENGEDÉLYEZÉSE A USER_ROLES TÁBLÁN
-- ====================================
-- Ez a script engedélyezi a Supabase Realtime-ot a user_roles táblán
-- hogy a kliensek real-time értesítéseket kapjanak az admin jogosultság változásokról

-- 1. Realtime publication létrehozása (ha még nincs)
-- Ez már alapértelmezetten létezik Supabase-ben, de ha nem, akkor:
-- CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- 2. User_roles tábla hozzáadása a realtime publication-höz
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;

-- 3. Ellenőrzés - nézd meg hogy a user_roles tábla benne van-e
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

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
