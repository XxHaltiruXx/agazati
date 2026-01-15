-- ====================================
-- Google Drive TELJES HOZZÁFÉRÉS Scope
-- ====================================
-- 
-- Ez a script frissíti a Google Drive scope-okat,
-- hogy MINDEN fájlt lásson a mappában (nem csak az app által feltöltötteket).
--
-- FONTOS: A 'drive' scope teljes hozzáférést ad, míg a 'drive.readonly'
-- csak az app által létrehozott vagy megosztott fájlokat látja.
--

-- 1. Frissítjük a google_drive_config táblában a SCOPES mezőt
UPDATE app_config
SET value = jsonb_set(
  value,
  '{SCOPES}',
  '["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/userinfo.email"]'::jsonb
),
updated_at = NOW()
WHERE key = 'google_drive_config';

-- 2. Töröljük a régi refresh token-t (új bejelentkezés szükséges az új scope-okhoz)
UPDATE app_config
SET value = jsonb_set(value, '{REFRESH_TOKEN}', 'null'::jsonb),
    updated_at = NOW()
WHERE key = 'google_drive_config';

-- 3. Ellenőrzés
SELECT 
  key,
  value->'SCOPES' as scopes,
  value->'REFRESH_TOKEN' as refresh_token
FROM app_config 
WHERE key = 'google_drive_config';

-- ====================================
-- KÖVETKEZŐ LÉPÉSEK
-- ====================================
-- 
-- 1. Futtasd le ezt a scriptet a Supabase Dashboard SQL Editor-ban
-- 
-- 2. Töltsd újra az admin oldalt (Ctrl+F5)
-- 
-- 3. Jelentkezz be újra a Google Drive-ba:
--    - Kattints a "🔗 Google Drive Bejelentkezés" gombra
--    - Vagy használd a "🔐 Újra-autentikáció (Force)" gombot
-- 
-- 4. Az engedélykérő képernyőn megjelenik:
--    ✅ "Tekintsd meg, szerkeszd, hozz létre és töröld az összes Google Drive-fájlt"
--    ✅ "E-mail-cím megtekintése"
-- 
-- 5. Engedélyezd mindkét jogosultságot
-- 
-- 6. Most már látnia kell MINDEN fájlt a mappában!
-- 
-- ====================================

-- DEBUG: Ha nem működik, ellenőrizd:
SELECT key, value FROM app_config WHERE key = 'google_drive_config';

-- Ha a REFRESH_TOKEN még mindig létezik, töröld manuálisan:
-- UPDATE app_config
-- SET value = jsonb_set(value, '{REFRESH_TOKEN}', 'null'::jsonb)
-- WHERE key = 'google_drive_config';
