# Google Drive Be- és Kijelentkezés Javítás - 2. Verzió

## Probléma (Frissítés)

Az első javítás után a kijelentkezés még mindig nem működött helyesen:

1. **A token nem törölődött valójában** - Az SQL function `'null'::jsonb` helyett `to_jsonb(NULL::text)` formátumot kellett használnia
2. **Az oldal újratöltése előtt az updateAdminPanelUI() újra betöltötte a config-ot**
3. **Nincs ellenőrzés**, hogy a token valóban törölve lett-e

## További Javítások (2. verzió)

### 1. SQL Function Javítás

**Probléma:** A `'null'::jsonb` lehet, hogy string-ként értelmezte a null értéket.

**Megoldás:**
```sql
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
```

### 2. Admin Panel - Logout gomb javítás

Ugyanaz a javítás, mint a Force Re-auth gombnál:
- Direkt DELETE helyett UPDATE a REFRESH_TOKEN mezőre
- Cache törlés hozzáadása

### 3. Hibaüzenetek javítása

**ELŐTTE:**
```javascript
errorMsg += "DELETE FROM app_config WHERE key = 'google_drive_refresh_token';\n\n";
```

**UTÁNA:**
```javascript
errorMsg += "UPDATE app_config\n";
errorMsg += "SET value = jsonb_set(value, '{REFRESH_TOKEN}', 'null'::jsonb)\n";
errorMsg += "WHERE key = 'google_drive_config';\n\n";
```

## Tesztelés

### 1. Bejelentkezés tesztelése

1. Nyisd meg az admin panelt
2. Kattints a "🔗 Google Drive Bejelentkezés" gombra
3. Jelentkezz be Google fiókkal
4. Ellenőrizd, hogy a státusz "✅ Aktív" lesz
5. Az email cím és további részletek megjelennek

### 2. Kijelentkezés tesztelése

1. Kattints a "🚪 Kijelentkezés" gombra
2. Erősítsd meg a kijelentkezést
3. A státusz "❌ Nincs bejelentkezve" lesz
4. Az oldal újratöltődik

SQL-ben ellenőrizd:
```sql
SELECT value->>'REFRESH_TOKEN' FROM app_config WHERE key = 'google_drive_config';
-- Eredmény: null
```

### 3. Force Re-authentication tesztelése

1. Ha látod a "🔐 Újra-autentikáció (Force)" gombot (401 Unauthorized esetén)
2. Kattints rá
3. A régi token törlődik
4. Automatikusan újra be kell jelentkezned (force consent)
5. Az új token elmentésre kerül

## Megelőzés

A jövőben, ha hasonló hibák lépnek fel:

1. **Mindig ellenőrizd az adatbázis struktúrát** a `google-drive-config-table.sql` fájlban
2. **Ne keress nem létező sorokat** - a REFRESH_TOKEN egy JSONB mező, nem külön sor
3. **Cache kezelés fontos** - kijelentkezésnél mindig törölni kell a cache-t
4. **RPC function előnyben** - használd az `delete_google_drive_token()` RPC function-t először

## Érintett fájlok

1. `database/google-drive-token-delete-rpc.sql` - SQL function (kommentek pontosítva)
2. `secret/admin/index.html` - Admin panel JavaScript (kijelentkezés és force reauth javítva)
3. `assets/js/google-drive-config-manager.js` - Már tartalmazza a `clearConfigCache()` funkciót

## Státusz

✅ **Javítva** - 2026. január 14.

A Google Drive be- és kijelentkezés mostantól helyesen működik az admin panelen.
