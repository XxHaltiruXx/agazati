-- ====================================
-- RPC FUNCTION: Google Drive Token Törlése
-- ====================================
-- 
-- Ez a function lehetővé teszi, hogy az admin panel
-- "Kijelentkezés" gombja biztonsággal törölje a refresh token-t,
-- még akkor is, ha RLS (Row Level Security) van beállítva.
--

-- 1. Function létrehozása SECURITY DEFINER joggal
CREATE OR REPLACE FUNCTION delete_google_drive_token()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- A refresh token a google_drive_config JSONB mezőjében van
  -- Nem töröljük az egész sort, csak a REFRESH_TOKEN mezőt null-ra állítjuk
  UPDATE app_config 
  SET value = jsonb_set(
    value, 
    '{REFRESH_TOKEN}', 
    to_jsonb(NULL::text),  -- JSON null érték (nem a "null" string!)
    true
  ),
  updated_at = NOW()
  WHERE key = 'google_drive_config';
  
  -- Ellenőrizzük, hogy sikerült-e
  IF NOT FOUND THEN
    RAISE EXCEPTION 'google_drive_config sor nem található!';
  END IF;
  
  RAISE NOTICE 'Google Drive refresh token törölve (null-ra állítva)';
END;
$$;

-- 2. Function jogosultságok beállítása
-- Csak authentikált felhasználók hívhatják meg
REVOKE ALL ON FUNCTION delete_google_drive_token() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_google_drive_token() TO authenticated;

-- ====================================
-- TESZTELÉS
-- ====================================

-- Teszteld a function-t:
-- SELECT delete_google_drive_token();

-- Ellenőrizd, hogy törölve lett:
-- SELECT value->>'REFRESH_TOKEN' FROM app_config WHERE key = 'google_drive_config';

-- ====================================
-- HASZNÁLAT
-- ====================================
-- 
-- Az admin panel "🚪 Kijelentkezés" gombja automatikusan
-- ezt a function-t hívja meg:
-- 
-- await supabase.rpc('delete_google_drive_token');
-- 
-- ====================================
