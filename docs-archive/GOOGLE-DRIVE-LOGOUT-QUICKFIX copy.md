# 🚨 GYORS JAVÍTÁS: Google Drive Kijelentkezés

## Mi a probléma?

A Google Drive kijelentkezés gomb nem törli helyesen a refresh token-t.

## ⚡ Gyors Megoldás (5 perc)

### 1️⃣ Supabase SQL Editor

```sql
CREATE OR REPLACE FUNCTION delete_google_drive_token()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_config 
  SET value = jsonb_set(value, '{REFRESH_TOKEN}', to_jsonb(NULL::text), true),
      updated_at = NOW()
  WHERE key = 'google_drive_config';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'google_drive_config sor nem található!';
  END IF;
  
  RAISE NOTICE 'Token törölve';
END;
$$;

REVOKE ALL ON FUNCTION delete_google_drive_token() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_google_drive_token() TO authenticated;
```

Kattints **RUN** ✅

### 2️⃣ Git Pull / Frissítés

```bash
git pull origin main
```

VAGY töltsd újra az oldalt az admin panelen: **Ctrl+F5**

### 3️⃣ Teszt

1. Admin panel → Google Drive szekció
2. "🚪 Kijelentkezés" gomb
3. Confirm → Oldal újratöltődik
4. ✅ Státusz: **❌ Nincs bejelentkezve**

## 🔍 Ellenőrzés

Console (F12):
```
✓ Token törölve RPC-vel
✓ Token ellenőrizve - sikeresen törölve (null)
✓ Config cache törölve
```

SQL:
```sql
SELECT value->>'REFRESH_TOKEN' FROM app_config WHERE key = 'google_drive_config';
-- Eredmény: (null)
```

## ❌ Ha nem működik

### Manuális token törlés:

```sql
UPDATE app_config
SET value = jsonb_set(value, '{REFRESH_TOKEN}', to_jsonb(NULL::text))
WHERE key = 'google_drive_config';
```

### Cache törlés böngészőben:

1. F12 → Application (Chrome) / Storage (Firefox)
2. Clear site data
3. Ctrl+F5 (hard reload)

## 📚 Részletes Dokumentáció

- `database/README-GOOGLE-DRIVE-LOGOUT-FIX.md` - Részletes telepítési útmutató
- `docs-archive/GOOGLE-DRIVE-LOGIN-LOGOUT-FIX.md` - Technikai részletek

---

**Javítva:** 2026-01-14 ✅
