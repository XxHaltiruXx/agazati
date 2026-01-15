-- ====================================
-- Google Drive Fájl Láthatóság Ellenőrzése
-- ====================================

-- 1. Összes fájl láthatósági állapota
SELECT 
  file_id,
  file_name,
  visible_on_infosharer,
  created_at,
  updated_at
FROM google_drive_file_visibility
ORDER BY file_name;

-- 2. Csak a látható fájlok
SELECT 
  file_id,
  file_name
FROM google_drive_file_visibility
WHERE visible_on_infosharer = true
ORDER BY file_name;

-- 3. Hány fájl van összesen vs. látható
SELECT 
  COUNT(*) as osszes_fajl,
  SUM(CASE WHEN visible_on_infosharer = true THEN 1 ELSE 0 END) as lathato_fajlok
FROM google_drive_file_visibility;

-- ====================================
-- GYORS JAVÍTÁS
-- ====================================
-- Ha az új fájlok (explorer_reset.bat, stb.) nincsenek még az adatbázisban,
-- akkor az admin panelen kapcsold BE a láthatóságot minden fájlnál.
--
-- Vagy futtasd le ezt a scriptet (csak ha ismered a file ID-kat):
--
-- INSERT INTO google_drive_file_visibility (file_id, file_name, visible_on_infosharer)
-- VALUES 
--   ('FILE_ID_1', 'explorer_reset.bat', true),
--   ('FILE_ID_2', 'slot1_4441_MCdiamondpickaxe.png', true),
--   ('FILE_ID_3', 'slot2_remove-comments.cjs', true)
-- ON CONFLICT (file_id) DO UPDATE
-- SET visible_on_infosharer = EXCLUDED.visible_on_infosharer,
--     updated_at = NOW();
-- ====================================
