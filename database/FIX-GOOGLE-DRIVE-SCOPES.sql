-- ====================================
-- GOOGLE DRIVE SCOPES FRISSÍTÉSE
-- ====================================
-- 
-- Ez a script frissíti a Google Drive OAuth scope-okat,
-- hogy tartalmazzon írási, olvasási és userinfo jogokat.
-- Ez szükséges a fájlok kezeléséhez és a felhasználó adataihoz.
--

-- Frissítsd a SCOPES tömböt, hogy tartalmazzon drive scope-ot (teljes hozzáférés)
-- FONTOS: drive.file NEM ELÉG mert csak az app által létrehozott fájlokat látja!
UPDATE app_config
SET value = jsonb_set(
  value,
  '{SCOPES}',
  jsonb_build_array(
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.email'
  ),
  true
),
updated_at = NOW()
WHERE key = 'google_drive_config';

-- Ellenőrzés
SELECT value->'SCOPES' as scopes 
FROM app_config 
WHERE key = 'google_drive_config';

-- Eredmény:
-- ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/userinfo.email"]

-- ====================================
-- SCOPE MAGYARÁZAT
-- ====================================
-- drive: Teljes hozzáférés az ÖSSZES Drive fájlhoz a kiválasztott mappában
--        Ez szükséges a manuálisan feltöltött fájlok látásához és módosításához
-- drive.file: Hozzáférés CSAK azokhoz a fájlokhoz, amiket az app hozott létre
--            NEM ELÉG ha manuálisan töltesz fel fájlokat!
-- drive.readonly: Csak olvasás (nem elég átnevezéshez)
-- ====================================

-- ====================================
-- FONTOS MEGJEGYZÉS
-- ====================================
-- 
-- Miután frissítetted a scope-okat, a felhasználóknak
-- ÚJRA BE KELL JELENTKEZNIÜK (Force Re-auth gomb),
-- hogy az új scope-ok érvénybe lépjenek!
-- 
-- Az admin panelen kattints a "🔐 Újra-autentikáció (Force)" gombra.
-- ====================================
