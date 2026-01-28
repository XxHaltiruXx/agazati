# 🚨 GYORS JAVÍTÁS: 401 Unauthorized + Fájlok Betöltése

## Mi a probléma?

1. ❌ **401 Unauthorized** - `getUserInfo` API hívás sikertelen
2. ❌ **Fájlok nem töltődnek be** - `downloadBtn is not defined` hiba

## ⚡ Gyors Megoldás (3 perc)

### 1️⃣ Supabase SQL Editor - Scope-ok javítása

Futtasd le ezt a query-t:

```sql
UPDATE app_config
SET value = jsonb_set(
  value,
  '{SCOPES}',
  jsonb_build_array(
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
  ),
  true
),
updated_at = NOW()
WHERE key = 'google_drive_config';
```

**Kattints RUN** ✅

Ellenőrzés:
```sql
SELECT value->'SCOPES' as scopes 
FROM app_config 
WHERE key = 'google_drive_config';
```

Eredmény:
```json
["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/userinfo.email"]
```

### 2️⃣ Admin Panel - Force Re-auth

1. Nyisd meg az admin panelt
2. Google Drive szekció
3. Kattints: **"🔐 Újra-autentikáció (Force)"**
4. Erősítsd meg
5. Jelentkezz be újra Google fiókkal
6. ✅ Az új scope-ok érvénybe lépnek

### 3️⃣ Ellenőrzés

Console (F12):
```
✓ Google Drive konfiguráció betöltve
✓ Access token frissítve
✓ User info sikeresen lekérve: your-email@gmail.com  ← EZ KELL!
✓ 2 fájl listázva
```

Admin panel:
- ✅ Státusz: **✅ Aktív**
- ✅ Email: **your-email@gmail.com**
- ✅ Fájlok listázva: **2 fájl**
- ✅ Letöltés és törlés gombok működnek

## 🔍 Mi változott?

### 1. Scope-ok frissítése

**ELŐTTE:**
```json
["https://www.googleapis.com/auth/drive.file"]
```

**UTÁNA:**
```json
[
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email"
]
```

### 2. Fájl kártya gomb javítása

**ELŐTTE:**
```javascript
// Letöltés gomb      const downloadBtn = ...
```

**UTÁNA:**
```javascript
// Letöltés gomb
const downloadBtn = card.querySelector('.download-btn');
```

## ❓ Gyakori Kérdések

### Miért kell Force Re-auth?

A Google OAuth2 **csak az első bejelentkezéskor kéri újra a scope-okat**. Ha új scope-ot adsz hozzá (pl. `userinfo.email`), akkor **törölni kell a régi refresh token-t** és **újra be kell jelentkezni** force consent módban.

### Mi a különbség a scope-ok között?

- **`drive.readonly`** - Minden fájl olvasása a Drive mappában (nem csak az app által létrehozottak)
- **`drive.file`** - Csak az app által létrehozott/megnyitott fájlok elérése
- **`userinfo.email`** - Bejelentkezett felhasználó email címe

### Mit csinál a Force Re-auth?

1. Törli a régi refresh token-t
2. Újra megnyitja a Google OAuth2 popup-ot
3. **MINDIG** kéri az összes scope-ot (consent prompt)
4. Menti az új refresh token-t az új scope-okkal

## 📚 Kapcsolódó Fájlok

- `database/FIX-GOOGLE-DRIVE-SCOPES.sql` - Scope frissítő script
- `database/google-drive-config-table.sql` - Alapértelmezett scope-ok frissítve
- `secret/admin/index.html` - Fájl kártya gomb javítva

---

**Javítva:** 2026-01-14 ✅
