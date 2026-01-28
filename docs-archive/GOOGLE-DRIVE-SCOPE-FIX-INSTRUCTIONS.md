# Google Drive Scope Javítás - Lépések

## ❌ Hiba
```
Error: Átnevezési hiba: 403 - Request had insufficient authentication scopes.
```

## 🔍 Ok
A jelenlegi scope (`drive.readonly`) csak olvasásra ad jogot. A fájl átnevezéshez írási jog szükséges.

## ✅ Megoldás

### 1. SQL Futtatása Supabase-ben

Nyisd meg a Supabase SQL Editort és futtasd le:

```sql
-- Google Drive scope frissítése drive-ra (teljes hozzáférés)
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
```

**Eredmény:**
```json
["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/userinfo.email"]
```

**MIÉRT drive ÉS NEM drive.file?**
- `drive.file`: Csak az app által létrehozott fájlokat látja ❌
- `drive`: Minden fájlt lát és módosíthat a mappában ✅
- Ha manuálisan töltesz fel fájlokat Drive-ra, CSAK a `drive` scope működik!

### 2. Force Re-auth az Admin Panelen

1. Nyisd meg az Admin Panelt
2. Kattints a **"🔐 Újra-autentikáció (Force)"** gombra
3. Ez törli a refresh token-t és új consent promptot mutat
4. Fogadd el az új jogosultságokat (drive.file scope-ot)

### 3. Teszteld a Slot Átszámozást

1. Kapcsold KI egy fájl láthatóságát
2. A rendszer automatikusan átszámozza a slotokat
3. Most már működnie kell! ✓

---

## 📝 Scope Magyarázat

| Scope | Mit engedélyez | Használat |
|-------|---------------|-----------|
| `drive.readonly` | ❌ Csak olvasás | Nem elég slot átnevezéshez |
| `drive.file` | ⚠️ Írás/olvasás (csak app által létrehozott fájlokhoz) | NEM látja a manuálisan feltöltött fájlokat! |
| `drive` | ✅ Teljes hozzáférés minden fájlhoz a mappában | **SZÜKSÉGES ha manuálisan is feltöltesz fájlokat** |

**Fontos:** Ha manuálisan töltesz fel fájlokat a Google Drive webes felületén, akkor **CSAK** a `drive` scope fogja látni őket. A `drive.file` scope csak azokat a fájlokat éri el, amiket az alkalmazás hozott létre vagy megnyitott.

---

## 🎯 Következő Lépések

A scope javítás után folytathatod a fejlesztést:
1. ✅ Toggle → Checkbox (KÉSZ)
2. ✅ Automatikus slot számozás (KÉSZ - csak scope kellett)
3. ⏳ Dinamikus kapacitás számítás
4. ⏳ Letöltés slot szám nélkül
5. ⏳ Keresősáv implementálása
