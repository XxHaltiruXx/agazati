# 🎉 Google Drive OAuth2 Integráció - Setup Útmutató

## ✅ Amit megcsináltam:

1. ✅ **SQL frissítve** - OAuth2 CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN mezőkkel
2. ✅ **google-drive-api.js** - OAuth2 autentikáció implementálva
3. ✅ **google-drive-config-manager.js** - Config validáció frissítve
4. ✅ **auth-callback.html** - OAuth2 redirect handler

---

## 📋 Amit NEKED kell megcsinálni:

### 1. **Google Cloud Console - OAuth2 Credentials létrehozása**

#### 1.1 Menj a Google Cloud Console-ba:
https://console.cloud.google.com/apis/credentials?project=agazati-483617

#### 1.2 Hozz létre OAuth 2.0 Client ID-t:
- Kattints: **+ CREATE CREDENTIALS** → **OAuth client ID**
- Application type: **Web application**
- Name: `Infosharer Web Client`

#### 1.3 Authorized redirect URIs:
Adj hozzá **2 redirect URI-t**:
```
http://localhost:5500/auth-callback.html
https://YOUR_DOMAIN.com/auth-callback.html
```
(Cseréld le `YOUR_DOMAIN.com`-ot az éles domain-edre!)

#### 1.4 Másold ki:
- **Client ID** (pl: `123456789-abc.apps.googleusercontent.com`)
- **Client secret** (pl: `GOCSPX-xyz...`)

---

### 2. **Supabase SQL futtatása**

Futtasd le az SQL script-et, majd UPDATE-eld a config-ot:

```sql
-- 1. Futtasd le a teljes google-drive-config-table.sql-t

-- 2. UPDATE-eld a Client ID-t és Secret-et:
UPDATE app_config
SET value = jsonb_set(
  jsonb_set(
    value,
    '{CLIENT_ID}',
    '"YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"'
  ),
  '{CLIENT_SECRET}',
  '"YOUR_CLIENT_SECRET_HERE"'
)
WHERE key = 'google_drive_config';

-- 3. Ellenőrizd:
SELECT * FROM app_config WHERE key = 'google_drive_config';
```

---

### 3. **Admin Bejelentkezési Gomb hozzáadása**

Az Infosharer admin felületéhez adj hozzá egy gombot:

#### 3.1 HTML (valahol az admin szekcióban):
```html
<button id="googleDriveAuthBtn" class="btn btn-primary">
  🔗 Google Drive Bejelentkezés
</button>
<span id="googleDriveStatus"></span>
```

#### 3.2 JavaScript (infosharer.js-ben vagy külön admin.js-ben):
```javascript
import { signInWithOAuth2 } from './google-drive-api.js';

// Google Drive auth gomb
const authBtn = document.getElementById('googleDriveAuthBtn');
const statusSpan = document.getElementById('googleDriveStatus');

if (authBtn) {
  authBtn.addEventListener('click', async () => {
    try {
      statusSpan.textContent = '⏳ Bejelentkezés...';
      await signInWithOAuth2();
      statusSpan.textContent = '✓ Sikeres!';
      alert('Google Drive bejelentkezés sikeres! A refresh token elmentve.');
    } catch (error) {
      statusSpan.textContent = '❌ Hiba!';
      alert('Hiba: ' + error.message);
    }
  });
}
```

---

### 4. **Első bejelentkezés (admin csinálja egyszer)**

1. Admin belép az Infosharer-be
2. Kattint a **"🔗 Google Drive Bejelentkezés"** gombra
3. Popup ablak nyílik → Google bejelentkezés
4. **Engedélyezés**: "Infosharer hozzáférhet a Drive-odhoz?" → **Engedélyezem**
5. Popup bezárul
6. ✅ **Refresh token mentve Supabase-be!**

---

### 5. **Tesztelés**

1. Frissítsd az oldalt
2. Próbálj meg fájlt feltölteni
3. ✅ Működnie kell!

---

## 🔍 Debugging

### Console log üzenetek:
- ✓ Google Drive konfiguráció betöltve Supabase-ből
- ✓ OAuth2 autentikáció sikeres
- ✓ Refresh token mentve Supabase-be
- ✓ Access token frissítve

### Ha nem működik:

1. **Nincs refresh token**:
   - Ellenőrizd: `SELECT value->>'REFRESH_TOKEN' FROM app_config WHERE key = 'google_drive_config';`
   - Ha NULL: Admin kattintson a "Google Drive Bejelentkezés" gombra

2. **403 hiba**:
   - Scope probléma: Ellenőrizd az OAuth consent screen-t
   - Vagy a Drive mappa nem osztott meg

3. **Popup blokkolt**:
   - Engedélyezd a popup-okat a site-ra

---

## 📁 Fájlok:

- ✅ `database/google-drive-config-table.sql` - Frissítve OAuth2-re
- ✅ `assets/js/google-drive-api.js` - OAuth2 autentikáció
- ✅ `assets/js/google-drive-config-manager.js` - Config validáció
- ✅ `auth-callback.html` - OAuth2 redirect handler

---

## 🎯 Összefoglaló:

1. **Google Cloud Console** → OAuth2 Client ID + Secret
2. **Supabase SQL** → Config UPDATE
3. **Admin gomb** → Bejelentkezés egyszer
4. **Működik!** → Mindenki használhatja

---

**Kérdés? Hiba?** Írj bátran! 🚀
