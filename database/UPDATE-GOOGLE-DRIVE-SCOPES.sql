-- ====================================
-- Google Drive Scope-ok Frissítése
-- ====================================
-- 
-- Ez a script frissíti a Google Drive scope-okat az adatbázisban,
-- hogy az új drive.readonly + userinfo.email scope-okat használja.
--

-- 1. Régi scope törlése (ha létezik)
DELETE FROM app_config WHERE key = 'google_drive_scopes';

-- 2. Új scope-ok beállítása
INSERT INTO app_config (key, value, description, updated_at)
VALUES (
  'google_drive_scopes',
  '["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/userinfo.email"]',
  'Google Drive API scope-ok (drive.readonly = minden fájl olvasása, userinfo.email = email lekérés)',
  NOW()
);

-- 3. Ellenőrzés
SELECT key, value, description FROM app_config WHERE key = 'google_drive_scopes';

-- ====================================
-- KÖVETKEZŐ LÉPÉS
-- ====================================
-- 
-- 1. Töröld a refresh token-t:
--    DELETE FROM app_config WHERE key = 'google_drive_refresh_token';
-- 
-- 2. Töltsd újra az admin oldalt (Ctrl+F5)
-- 
-- 3. Kattints a "🔗 Google Drive Bejelentkezés" gombra
-- 
-- 4. Most már mindkét scope-ot engedélyezned kell:
--    - "Google Drive-on tárolt fájlok megtekintése" (drive.readonly)
--    - "E-mail-cím megtekintése" (userinfo.email)
-- 
-- ====================================
