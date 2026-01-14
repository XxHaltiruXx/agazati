-- ====================================
-- GOOGLE DRIVE FILE VISIBILITY TABLE
-- ====================================
-- 
-- Ez a tábla tárolja, hogy melyik Google Drive fájl
-- látható az Infosharer oldalon és melyik nem.
-- Csak admin felhasználók módosíthatják.
--

-- 1. Tábla létrehozása
CREATE TABLE IF NOT EXISTS google_drive_file_visibility (
  id BIGSERIAL PRIMARY KEY,
  file_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  visible_on_infosharer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexek teljesítmény növeléshez
CREATE INDEX IF NOT EXISTS idx_google_drive_file_visibility_file_id ON google_drive_file_visibility(file_id);
CREATE INDEX IF NOT EXISTS idx_google_drive_file_visibility_visible ON google_drive_file_visibility(visible_on_infosharer);

-- 3. RLS (Row Level Security) engedélyezése
ALTER TABLE google_drive_file_visibility ENABLE ROW LEVEL SECURITY;

-- 4. Töröljük a régi policy-kat ha léteznek
DROP POLICY IF EXISTS "Mindenki olvashatja a látható fájlokat" ON google_drive_file_visibility;
DROP POLICY IF EXISTS "Adminok kezelhetik a láthatóságot" ON google_drive_file_visibility;

-- 5. Policy: Mindenki láthatja, hogy melyik fájl látható
CREATE POLICY "Mindenki olvashatja a látható fájlokat"
ON google_drive_file_visibility
FOR SELECT
TO anon, authenticated
USING (true);

-- 6. Policy: Csak adminok módosíthatják a láthatóságot
CREATE POLICY "Adminok kezelhetik a láthatóságot"
ON google_drive_file_visibility
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

-- 7. Trigger az updated_at automatikus frissítéséhez
CREATE OR REPLACE FUNCTION update_google_drive_file_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_google_drive_file_visibility_updated_at ON google_drive_file_visibility;

CREATE TRIGGER update_google_drive_file_visibility_updated_at
    BEFORE UPDATE ON google_drive_file_visibility
    FOR EACH ROW
    EXECUTE FUNCTION update_google_drive_file_visibility_updated_at();

-- ====================================
-- TESZTELÉS
-- ====================================

-- Példa: Fájl láthatóságának beállítása
-- INSERT INTO google_drive_file_visibility (file_id, file_name, visible_on_infosharer)
-- VALUES ('1abc123...', 'example.pdf', true)
-- ON CONFLICT (file_id) DO UPDATE
-- SET visible_on_infosharer = EXCLUDED.visible_on_infosharer,
--     updated_at = NOW();

-- Látható fájlok lekérdezése
-- SELECT file_id, file_name FROM google_drive_file_visibility WHERE visible_on_infosharer = true;

-- ====================================
-- HASZNÁLAT
-- ====================================
-- 
-- Az admin panel automatikusan kezeli ezt a táblát.
-- 
-- Amikor az admin bekapcsolja a "Látható az Infoshareren" kapcsolót:
-- await supabase
--   .from('google_drive_file_visibility')
--   .upsert({
--     file_id: fileId,
--     file_name: fileName,
--     visible_on_infosharer: true
--   });
-- 
-- Az Infosharer oldal csak azokat a fájlokat mutatja,
-- ahol visible_on_infosharer = true.
-- ====================================
