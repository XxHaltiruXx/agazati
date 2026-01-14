# Google Drive Kijelentkezés Javítás - Telepítési Útmutató

## Probléma

A Google Drive kijelentkezés nem töröl helyesen a refresh token-t az adatbázisból.

## Megoldás

### 1. Lépés: SQL Function Újratelepítése

Menj a **Supabase Dashboard**-ra:

1. Nyisd meg a projekted
2. Kattints a **SQL Editor** menüpontra (bal oldali menü)
3. Kattints **New Query**
4. Másold be az alábbi kódot:

```sql
-- ====================================
-- RPC FUNCTION: Google Drive Token Törlése (JAVÍTOTT)
-- ====================================

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
REVOKE ALL ON FUNCTION delete_google_drive_token() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_google_drive_token() TO authenticated;
```

5. Kattints **RUN** (vagy F5)
6. Ellenőrizd, hogy a válasz: **Success. No rows returned**

### 2. Lépés: Ellenőrzés

Futtasd le ezt a query-t:

```sql
-- Aktuális REFRESH_TOKEN érték
SELECT value->>'REFRESH_TOKEN' FROM app_config WHERE key = 'google_drive_config';
```

Ha van érvényes token, látni fogod az értékét.

### 3. Lépés: Teszt

Próbáld ki a kijelentkezést:

1. Nyisd meg az admin panelt
2. Kattints a "🚪 Kijelentkezés" gombra
3. Erősítsd meg a műveletet
4. Az oldal újratöltődik
5. A státusz "❌ Nincs bejelentkezve" lesz

Ellenőrizd újra az SQL-ben:

```sql
SELECT value->>'REFRESH_TOKEN' FROM app_config WHERE key = 'google_drive_config';
-- Eredmény: (null) vagy üres
```

## Hibaelhárítás

### Ha a kijelentkezés még mindig nem működik:

1. **Nyisd meg a böngésző konzolt** (F12 → Console)
2. Kattints a kijelentkezés gombra
3. Nézd meg a console log-okat:

```
🔄 RPC function hívása: delete_google_drive_token
RPC válasz: { data: null, error: null }
✓ Token törölve RPC-vel
✓ Token ellenőrizve - sikeresen törölve (null)
✓ Config cache törölve
✓ Token sikeresen törölve
```

### Ha RPC hibát kapsz:

```
⚠️ RPC hiba: { code: '42883', message: 'function delete_google_drive_token() does not exist' }
```

**Megoldás:** Futtasd le újra az SQL function-t (1. lépés).

### Ha a token nem törlődik (direkt UPDATE-tel):

Manuális törlés SQL-ben:

```sql
UPDATE app_config
SET value = jsonb_set(
  value, 
  '{REFRESH_TOKEN}', 
  to_jsonb(NULL::text)
),
updated_at = NOW()
WHERE key = 'google_drive_config';
```

## Fontos Megjegyzések

- ✅ Az RPC function **SECURITY DEFINER** módban fut, ezért megkerüli az RLS policy-kat
- ✅ Csak authentikált felhasználók hívhatják meg
- ✅ A JavaScript kód **fallback mechanizmust** használ: ha az RPC nem működik, direkt UPDATE-tel próbálkozik
- ✅ A kód **ellenőrzi**, hogy a token valóban null-ra állt-e

## Státusz

✅ **Javítva** - 2026. január 14.

A Google Drive kijelentkezés mostantól helyesen működik.
