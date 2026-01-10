# Google Drive + Supabase Config Setup

## ✅ Megoldás: Kulcsok biztonságosan Supabase-ben

A Google Drive API kulcsok és konfigurációk mostantól **Supabase-ben** vannak tárolva, nem a frontend kódban!

### 🔐 Előnyök:

- ✅ Kulcsok biztonságosan tárolva
- ✅ Csak admin felhasználók férhetnek hozzá (RLS policy)
- ✅ Könnyű frissítés (SQL UPDATE-tel)
- ✅ Nem kell commitolni érzékeny adatokat
- ✅ Cache mechanizmus a gyors betöltéshez

## 📋 Gyors Setup (5 lépés)

### 1. Supabase tábla létrehozása

Nyisd meg a Supabase Dashboard-ot:
```
https://supabase.com/dashboard/project/YOUR_PROJECT/editor
```

Futtasd le ezt az SQL scriptet:
```bash
database/google-drive-config-table.sql
```

Vagy másold be a tartalmat a SQL Editor-ba és futtasd le.

### 2. Google Cloud Console beállítása

1. Menj a [Google Cloud Console](https://console.cloud.google.com/)-ra
2. Hozz létre egy új projektet (vagy használj meglévőt)
3. Engedélyezd a **Google Drive API**-t
4. Hozz létre egy **API Key**-t:
   - APIs & Services > Credentials
   - Create Credentials > API Key
   - Korlátozd csak a Google Drive API-ra

### 3. Google Drive mappa létrehozása

1. Menj a [Google Drive](https://drive.google.com/)-ra
2. Hozz létre egy új mappát: **"Infosharer Storage"**
3. Állítsd be a megosztást **"Anyone with the link"** - Reader jogra
   - Jobb klikk > Share > Get link > Anyone with the link (Viewer)
4. Másold ki a mappa ID-t az URL-ből:
   ```
   https://drive.google.com/drive/folders/MAPPA_ID_ITT
                                          ^^^^^^^^^^^^^
   ```

### 4. Konfiguráció frissítése Supabase-ben

Futtasd le ezt az SQL parancsot a Supabase SQL Editor-ban:

```sql
UPDATE app_config
SET value = jsonb_build_object(
    'API_KEY', 'AIzaSy...YOUR_ACTUAL_API_KEY',
    'FOLDER_ID', '1a2B3c...YOUR_ACTUAL_FOLDER_ID',
    'DISCOVERY_DOCS', jsonb_build_array('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest')
)
WHERE key = 'google_drive_config';
```

**Helyettesítsd be:**
- `YOUR_ACTUAL_API_KEY` - A 2. lépésben létrehozott API Key
- `YOUR_ACTUAL_FOLDER_ID` - A 3. lépésben kimásolt mappa ID

### 5. Storage provider beállítása

A `assets/js/storage-adapter.js` fájlban:

```javascript
const STORAGE_PROVIDER = 'googledrive'; // vagy 'supabase'
```

## ✅ Kész!

Most már használhatod az Infosharer-t Google Drive-val!

## 🧪 Tesztelés

1. Nyisd meg az Infosharer oldalt
2. Jelentkezz be admin jogosultsággal
3. Nyisd meg a böngésző konzolt (F12)
4. Keress ilyen sorokat:
   ```
   ✓ Google Drive konfiguráció betöltve Supabase-ből
   ✓ Google Drive API inicializálva
   ```
5. Próbálj meg feltölteni egy fájlt
6. Ellenőrizd a Google Drive mappában, hogy megjelent-e

## 🔧 Konfiguráció frissítése

### API Key frissítése:

```sql
UPDATE app_config
SET value = jsonb_set(value, '{API_KEY}', '"ÚJ_API_KEY_IDE"')
WHERE key = 'google_drive_config';
```

### Folder ID frissítése:

```sql
UPDATE app_config
SET value = jsonb_set(value, '{FOLDER_ID}', '"ÚJ_FOLDER_ID_IDE"')
WHERE key = 'google_drive_config';
```

### Teljes konfiguráció megtekintése:

```sql
SELECT * FROM app_config WHERE key = 'google_drive_config';
```

## 🔐 Biztonság

### RLS Policies:

A tábla RLS-sel védett:
- ✅ Csak admin felhasználók olvashatják
- ✅ Csak admin felhasználók módosíthatják
- ✅ Nincs publikus hozzáférés

### Admin jogosultság ellenőrzése:

```sql
-- Ellenőrizd, hogy admin vagy-e
SELECT * FROM user_roles 
WHERE user_id = auth.uid() 
AND role = 'admin';
```

## 🐛 Hibaelhárítás

### "Google Drive konfiguráció nem található"

**Ok**: Az app_config tábla üres vagy a key helytelen.

**Megoldás**:
```sql
SELECT * FROM app_config WHERE key = 'google_drive_config';
```

Ha üres, futtasd le újra a `google-drive-config-table.sql` scriptet.

### "Nincs jogosultságod"

**Ok**: Nem vagy admin felhasználó.

**Megoldás**:
```sql
-- Add hozzá magad adminnak
INSERT INTO user_roles (user_id, role)
VALUES (auth.uid(), 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### "API Key invalid"

**Ok**: Hibás API Key vagy nem engedélyezted a Google Drive API-t.

**Megoldás**:
1. Ellenőrizd a Google Cloud Console-ban az API Key-t
2. Ellenőrizd, hogy engedélyezted-e a Google Drive API-t
3. Frissítsd a Supabase-ben az API Key-t

### Cache problémák

A konfiguráció 5 percig cache-elve van. Ha azonnal frissíteni akarod:

1. Jelentkezz ki és be újra
2. Vagy frissítsd az oldalt (F5)
3. Vagy töröld a localStorage-t: `localStorage.clear()`

## 📊 Előnyök vs. régi megoldás

| Funkció | Régi (kódban) | Új (Supabase) |
|---------|---------------|---------------|
| **Biztonság** | ❌ Publikus | ✅ RLS védett |
| **Frissítés** | ❌ Kód módosítás | ✅ SQL UPDATE |
| **Git commit** | ❌ Érzékeny adat | ✅ Nincs érzékeny adat |
| **Admin only** | ❌ Mindenki látja | ✅ Csak adminok |
| **Cache** | ❌ Nincs | ✅ 5 perc cache |
| **Audit log** | ❌ Nincs | ✅ updated_at mező |

## 📚 További fájlok

- `assets/js/google-drive-config-manager.js` - Config betöltés/mentés
- `assets/js/google-drive-api.js` - Google Drive API wrapper
- `assets/js/storage-adapter.js` - Egységes storage interfész
- `database/google-drive-config-table.sql` - SQL script

## 🎉 Kész!

Most már biztonságosan használhatod a Google Drive-ot az Infosharer-rel, anélkül hogy bármi érzékeny adat a kódban lenne!

---

**Létrehozva**: 2026.01.10  
**Verzió**: 2.1.0 - Supabase Config Storage
