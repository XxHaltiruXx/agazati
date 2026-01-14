-- ====================================
-- Google Drive Refresh Token Törlése
-- ====================================
-- 
-- Használd ezt a scriptet, ha új scope-okkal szeretnél bejelentkezni
-- vagy ha a Google Drive OAuth hibát dob.
--
-- A script után újra be kell jelentkezned az admin panelen.
--

-- 1. Refresh token törlése
DELETE FROM app_config WHERE key = 'google_drive_refresh_token';

-- 2. Ellenőrzés (nem kell adatot visszaadnia)
SELECT * FROM app_config WHERE key = 'google_drive_refresh_token';

-- ====================================
-- KÖVETKEZŐ LÉPÉS: Újra bejelentkezés
-- ====================================
-- 
-- 1. Menj az admin panelre: /secret/admin/
-- 2. Kattints a "🔗 Google Drive Bejelentkezés" gombra
-- 3. A Google kérni fogja az új scope-ok engedélyezését
-- 4. Engedélyezd, majd ellenőrizd a részletes információkat
-- 
-- ====================================
