-- ====================================
-- GOOGLE DRIVE KONFIGURÁCIÓ TÁBLA
-- ====================================

-- Ez a tábla tárolja a Google Drive API kulcsokat
-- Csak admin felhasználók férhetnek hozzá (RLS policy-vel védve)

-- 1. Tábla létrehozása
CREATE TABLE IF NOT EXISTS app_config (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security) engedélyezése
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- 2.1 Töröljük a régi policy-kat ha léteznek
DROP POLICY IF EXISTS "Adminok olvashatják a konfigurációt" ON app_config;
DROP POLICY IF EXISTS "Adminok módosíthatják a konfigurációt" ON app_config;

-- 3. Policy: Csak adminok olvashatnak
CREATE POLICY "Adminok olvashatják a konfigurációt"
ON app_config
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.is_admin = true
  )
);

-- 4. Policy: Csak adminok írhatnak
CREATE POLICY "Adminok módosíthatják a konfigurációt"
ON app_config
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.is_admin = true
  )
);

-- 5. Indexek teljesítmény növeléshez
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

-- 6. Trigger az updated_at automatikus frissítéséhez
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Töröljük a régi triggert ha létezik
DROP TRIGGER IF EXISTS update_app_config_updated_at ON app_config;

CREATE TRIGGER update_app_config_updated_at
    BEFORE UPDATE ON app_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- GOOGLE DRIVE KONFIGURÁCIÓ BESZÚRÁSA
-- ====================================

-- FONTOS: Töltsd ki a saját értékeiddel!
-- Az értékeket a Google Cloud Console-ból kell beszerezni

INSERT INTO app_config (key, value, description)
VALUES (
  'google_drive_config',
  jsonb_build_object(
    'FOLDER_ID', 'your-folder-id-here',
    'CLIENT_ID', 'your-client-id-here.apps.googleusercontent.com',
    'CLIENT_SECRET', 'your-client-secret-here',
    'REFRESH_TOKEN', null,
    'SCOPES', jsonb_build_array('https://www.googleapis.com/auth/drive.file')
  ),
  'Google Drive API konfiguráció OAuth2-vel az Infosharer fájltároláshoz'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ====================================
-- KONFIGURÁCIÓ ELLENŐRZÉSE
-- ====================================

-- Ellenőrizd, hogy sikeresen beszúródott-e:
SELECT * FROM app_config WHERE key = 'google_drive_config';

-- ====================================
-- KONFIGURÁCIÓ FRISSÍTÉSE
-- ====================================

-- Ha később módosítani szeretnéd a konfigurációt:

-- Teljes konfiguráció frissítése:
/*
UPDATE app_config
SET value = jsonb_build_object(
    'API_KEY', 'ÚJ_API_KEY',
    'FOLDER_ID', 'ÚJ_FOLDER_ID',
    'DISCOVERY_DOCS', jsonb_build_array('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest')
)
WHERE key = 'google_drive_config';
*/

-- Csak egy mező frissítése (pl. API_KEY):
/*
UPDATE app_config
SET value = jsonb_set(value, '{API_KEY}', '"ÚJ_API_KEY"')
WHERE key = 'google_drive_config';
*/

-- Csak egy mező frissítése (pl. FOLDER_ID):
/*
UPDATE app_config
SET value = jsonb_set(value, '{FOLDER_ID}', '"ÚJ_FOLDER_ID"')
WHERE key = 'google_drive_config';
*/

-- ====================================
-- BIZTONSÁGI MEGJEGYZÉSEK
-- ====================================

/*
1. Az app_config tábla RLS-sel védett
2. Csak admin jogosultsággal rendelkező felhasználók férhetnek hozzá
3. Az API Key publikus kulcs, de a FOLDER_ID érzékeny adat
4. Ne ossz meg Supabase adminisztrációs jogokat illetéktelen felhasználókkal
5. A Google Drive mappa megosztási beállításait is ellenőrizd

FONTOS: Service Account private key-t NE tárold itt!
A jelenlegi megoldás API Key-t használ, ami csak olvasási jogot ad.
Feltöltéshez a frontend közvetlenül hívja meg a Google Drive API-t.
*/

-- ====================================
-- TOVÁBBI KONFIGURÁCIÓK
-- ====================================

-- Más alkalmazás konfigurációk is hozzáadhatók ugyanebbe a táblába:

-- Példa: Email értesítési beállítások
/*
INSERT INTO app_config (key, value, description)
VALUES (
  'email_settings',
  jsonb_build_object(
    'smtp_host', 'smtp.example.com',
    'smtp_port', 587,
    'from_email', 'noreply@example.com'
  ),
  'Email küldési beállítások'
)
ON CONFLICT (key) DO NOTHING;
*/

-- Példa: Fájl feltöltési limitek
/*
INSERT INTO app_config (key, value, description)
VALUES (
  'upload_limits',
  jsonb_build_object(
    'max_file_size_mb', 50,
    'max_storage_mb', 15360,
    'allowed_extensions', jsonb_build_array('pdf', 'jpg', 'png', 'docx', 'xlsx')
  ),
  'Fájl feltöltési limitek és engedélyezett típusok'
)
ON CONFLICT (key) DO NOTHING;
*/
