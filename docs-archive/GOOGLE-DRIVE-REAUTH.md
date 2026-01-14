# Google Drive Újra-autentikáció (Scope változás)

## Probléma

Ha a **401 Unauthorized** hibát kapod a `getUserInfo` hívásnál, az azt jelenti, hogy a meglévő **refresh token nem tartalmazza az új scope-okat** (pl. `userinfo.email`).

### Tünetek:
- ✅ "Google Drive API inicializálva OAuth2-vel"
- ✅ "Access token frissítve"
- ❌ **"⚠️ Unauthorized - új bejelentkezés szükséges"**
- ❌ Admin panelen: **"⚠️ Nincs adat (401 Unauthorized)"** az email mezőnél
- 🔥 **Narancs "🔐 Újra-autentikáció (Force)" gomb megjelenik**

### Miért történik ez?

A Google OAuth csak akkor adja meg az új jogosultságokat (scope-okat), ha:
1. Teljesen új bejelentkezés történik **ÉS** a régi token törölve van
2. VAGY `prompt=consent` paramétert használsz (Force Re-auth)

## ⚡ GYORS MEGOLDÁS (30 másodperc)

### 🔥 Használd a "Force Re-auth" gombot!

Ha az admin panelen látod a **narancs színű "🔐 Újra-autentikáció (Force)"** gombot:

1. **Kattints rá**
2. Erősítsd meg a popupot
3. A Google újra kérni fogja **MINDEN** jogosultságot:
   - ✅ **Drive olvasás** (drive.readonly) - ÖSSZES fájl olvasása a mappában
   - ✅ **Email cím elérése** (userinfo.email) ← ÚJ!
4. Engedélyezd a hozzáférést
5. Az oldal automatikusan frissül

✅ **KÉSZ!** Az email cím most már megjelenik ÉS az összes fájl látszik a mappában (nem csak az app által feltöltöttek)!

---

## ⚠️ FONTOS: Scope változás!

Az alkalmazás mostantól **`drive.readonly`** scope-ot használ **`drive.file` helyett**:

- ❌ **drive.file** = Csak az alkalmazás által létrehozott fájlokat látja
- ✅ **drive.readonly** = **ÖSSZES** fájlt látja a mappában (manuálisan feltöltöttek is!)

Ezért **kötelező az újra-autentikáció**!

---

## Megoldás 1: Token törlése Supabase-ből (MANUÁLIS)

### 1. lépés: Töröld a régi refresh token-t

Futtasd le ezt az SQL scriptet a Supabase SQL Editor-ban:

```sql
DELETE FROM app_config WHERE key = 'google_drive_refresh_token';
```

VAGY használd az admin panel **"🚪 Kijelentkezés"** gombját.

### 2. lépés: Újra bejelentkezés

1. Menj az admin panelre: `/secret/admin/`
2. Kattints a **"🔗 Google Drive Bejelentkezés"** gombra
3. A Google popup kérni fogja az **új scope-ok engedélyezését**:
   - ✅ **Fájlok kezelése** (drive.file)
   - ✅ **Email cím elérése** (userinfo.email) ← ÚJ!
4. Engedélyezd a hozzáférést
5. Ellenőrizd, hogy a **"📧 Bejelentkezett fiók"** mező kitöltődött-e

✅ Most már működnie kell a `getUserInfo` hívásnak!

## Megoldás 2: Hozzáférés revoke-olása Google-nél (BIZTONSÁGI)

Ha a gyors megoldás nem működik, revoke-old a hozzáférést a Google oldalon:

### 1. lépés: Google fiók hozzáférések oldal

1. Menj a [Google Account - Third-party apps](https://myaccount.google.com/permissions) oldalra
2. Jelentkezz be ugyanazzal a Google fiókkal, amit az admin panelen használsz

### 2. lépés: Infosharer hozzáférés törlése

1. Keresd meg az **"Infosharer"** alkalmazást a listában
2. Kattints rá
3. Kattints a **"Remove Access"** vagy **"Hozzáférés visszavonása"** gombra
4. Erősítsd meg a műveletet

### 3. lépés: Token törlése Supabase-ből

```sql
DELETE FROM app_config WHERE key = 'google_drive_refresh_token';
```

### 4. lépés: Újra bejelentkezés

1. Menj az admin panelre: `/secret/admin/`
2. Kattints a **"🔗 Google Drive Bejelentkezés"** gombra
3. A Google most az **összes scope-ot** kérni fogja újra:
   - ✅ Fájlok kezelése (drive.file)
   - ✅ Email cím elérése (userinfo.email)
4. Engedélyezd a hozzáférést

✅ Most már biztosan működni fog!

## Ellenőrzés

### Böngésző Konzol

Nyisd meg a Developer Tools-t (F12) és nézd meg a konzolt:

#### Sikeres bejelentkezés:
```
✓ Google Drive API inicializálva OAuth2-vel
✓ Google Drive konfiguráció betöltve
✓ Access token frissítve
✓ User info sikeresen lekérve: your.email@gmail.com
```

#### Sikertelen bejelentkezés (régi token):
```
✓ Google Drive API inicializálva OAuth2-vel
✓ Google Drive konfiguráció betöltve
✓ Access token frissítve
❌ Google UserInfo lekérési hiba: Error: UserInfo lekérés sikertelen: 401
```

### Admin Panel

Ellenőrizd, hogy a **Google Drive Kezelés** panelben minden mező ki van-e töltve:

- ✅ **Authentikációs Státusz**: `✅ Aktív`
- ✅ **📧 Bejelentkezett fiók**: `your.email@gmail.com` (nem "Nincs adat")
- ✅ **🗂️ Mappa ID**: `1a2B3c4D5e6F7g8H9...`
- ✅ **🔑 Client ID**: `123456789...`
- ✅ **⏰ Bejelentkezés ideje**: `2026. jan. 14. 10:30`
- ✅ **🔐 Token lejárat**: `♾️ Automatikus frissítés`
- ✅ **📊 Jogosultságok**: `Fájlkezelés, Email hozzáférés`

## Miért van szükség új scope-ra?

A `userinfo.email` scope azért kell, hogy az admin panelen megjelenjen a **bejelentkezett Google fiók email címe**. Ez segít:

1. **Biztonsági ellenőrzésben**: Látod, melyik fiók van bejelentkezve
2. **Multi-account környezetben**: Ha több Google fiókod van, tudod, melyiket használja az alkalmazás
3. **Hibakeresésben**: Ha valami nem működik, látod, melyik fiók jogosultságaival próbálkozik

## Gyakori hibák

### ❌ "A kijelentkezés nem működik"

**Ok**: A logout button kód hibát dob, de nem jelenik meg.

**Megoldás**: Használd az SQL scriptet manuálisan:
```sql
DELETE FROM app_config WHERE key = 'google_drive_refresh_token';
```

### ❌ "Failed to load resource: 406 (Not Acceptable)"

**Ok**: A Supabase query `.single()` metódust használ, de nincs egyetlen rekord sem.

**Megoldás**: Már javítva van! A kód mostantól `.maybeSingle()` metódust használ.

### ❌ "401 Unauthorized" továbbra is

**Ok**: A böngésző cache-elte a régi access token-t.

**Megoldás**:
1. Töröld a böngésző cache-t (Ctrl + Shift + Delete)
2. Töröld a localStorage-t: 
   - F12 → Application → Local Storage → Jobb klikk → Clear
3. Töltsd újra az oldalt (Ctrl + F5)
4. Próbáld újra a bejelentkezést

## Következő lépések

Ha minden működik:

1. ✅ Tesztelj egy fájl feltöltést az Infosharer főoldalon (admin jogosultsággal)
2. ✅ Ellenőrizd, hogy a fájl megjelenik-e a Google Drive mappában
3. ✅ Próbáld meg letölteni a fájlt
4. ✅ Tesztelj egy fájl törlést

---

**Létrehozva**: 2026.01.14  
**Verzió**: 1.0  
**Kapcsolódó dokumentumok**: 
- `GOOGLE-DRIVE-SETUP.md` - Kezdeti beállítás
- `REDIRECT-URI-FIX.md` - redirect_uri_mismatch hiba javítása
- `database/RESET-GOOGLE-DRIVE-TOKEN.sql` - Token törlés SQL script
