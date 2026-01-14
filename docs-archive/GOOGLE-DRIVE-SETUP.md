# Google Drive Integráció Beállítása - Infosharer

## Áttekintés

Az Infosharer Google Drive integrációja egy **központi Google Drive mappát** használ, ahova csak az **admin jogosultsággal rendelkező felhasználók** tölthetnek fel fájlokat. A fájlok letöltése mindenkinek elérhető.

### Fő jellemzők:
- ✅ Központi Google Drive tárhely
- ✅ Csak adminok tölthetnek fel
- ✅ Mindenki letölthet
- ✅ Service Account alapú autentikáció (nincs felhasználói bejelentkezés)
- ✅ 15 GB ingyenes tárhely (## 12. Költségek

### Ingyenes kvóta

Google Drive API ingyenes kvóta:
- **Tárhely**: 15 GB ingyenes (Google Drive alapértelmezett)
- **API hívások**: 1,000,000 kérés/nap (általában elegendő)

### Fizetős terv

Ha több tárhelyre van szükséged:
- **Google One**: 100 GB - $1.99/hó
- **Google Workspace Business Standard**: 2 TB - $12/felhasználó/hó

## 13. További információkapértelmezett)

## 1. Google Cloud Project létrehozása

### 1.1 Google Cloud Console megnyitása

1. Menj a [Google Cloud Console](https://console.cloud.google.com/) oldalra
2. Jelentkezz be a Google fiókoddal
3. Kattints a "Select a project" gombra a felső menüsorban
4. Kattints a "New Project" gombra

### 1.2 Projekt létrehozása

1. **Project name**: `Infosharer` (vagy tetszőleges név)
2. **Organization**: Hagyd üresen (ha nincs szervezeted)
3. **Location**: Hagyd üresen vagy válassz szervezetet
4. Kattints a **Create** gombra

⏳ Várj néhány másodpercet, amíg a projekt létrejön.

## 2. Google Drive API engedélyezése

### 2.1 API Library megnyitása

1. A bal oldali menüben kattints a **"APIs & Services"** > **"Library"** menüpontra
2. Keresd meg: **"Google Drive API"**
3. Kattints rá
4. Kattints az **"Enable"** gombra

✅ Az API most engedélyezve van a projektedben.

## 3. Service Account létrehozása

A Service Account egy speciális Google fiók, amit az alkalmazásod használ a Google Drive eléréséhez.

### 3.1 Service Account létrehozása

1. Menj a **"APIs & Services"** > **"Credentials"** menüpontra
2. Kattints a **"Create Credentials"** gombra
3. Válaszd a **"Service account"** opciót

### 3.2 Service Account részletei

1. **Service account name**: `infosharer-storage`
2. **Service account ID**: `infosharer-storage` (automatikusan kitöltődik)
3. **Service account description**: `Service account for Infosharer file storage`
4. Kattints a **"Create and Continue"** gombra

### 3.3 Jogosultságok beállítása

1. **Select a role**: Válaszd a **"Basic"** > **"Owner"** opciót
   - Alternatíva: **"Editor"** is elég
2. Kattints a **"Continue"** gombra
3. **Grant users access to this service account**: Hagyd üresen
4. Kattints a **"Done"** gombra

### 3.4 Service Account Key generálása

1. A Credentials oldalon keresd meg az újonnan létrehozott Service Account-ot
2. Kattints a Service Account nevére
3. Menj a **"Keys"** fülre
4. Kattints az **"Add Key"** > **"Create new key"** gombra
5. Válaszd a **JSON** formátumot
6. Kattints a **"Create"** gombra

📥 Egy JSON fájl letöltődik a gépedre. **EZ MÉG NEM A VÉGSŐ MEGOLDÁS!**

⚠️ **FIGYELEM**: Ez a fájl tartalmazza a private key-t! Ne oszd meg senkivel és ne töltsd fel publikus helyre!

## 4. Google Drive mappa létrehozása és megosztása

### 4.1 Mappa létrehozása

1. Menj a [Google Drive](https://drive.google.com/) oldalra
2. Kattints a **"New"** > **"Folder"** gombra
3. Nevezd el: **"Infosharer Storage"**
4. Kattints a **"Create"** gombra

### 4.2 Mappa ID lekérése

1. Nyisd meg az újonnan létrehozott mappát
2. Nézd meg az URL-t a böngésző címsorában:
   ```
   https://drive.google.com/drive/folders/1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P
                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                          Ez a Mappa ID
   ```
3. Másold ki a Mappa ID-t (a hosszú karakterlánc az URL végén)

### 4.3 Mappa megosztása a Service Account-tal

Ez a **legfontosabb lépés**!

1. Kattints jobb gombbal a mappára
2. Válaszd a **"Share"** opciót
3. A "Add people and groups" mezőbe írd be a **Service Account email címét**
   - Ez a JSON fájlban a `client_email` mező
   - Pl.: `infosharer-storage@your-project.iam.gserviceaccount.com`
4. Válaszd a **"Editor"** jogosultságot a legördülő menüből
5. **FONTOS**: Vedd ki a pipát a **"Notify people"** checkbox-ból
   - A Service Account nem kap emailt, nem is szükséges
6. Kattints a **"Share"** gombra

✅ Most a Service Account hozzáfér a mappához!

## 5. OAuth 2.0 Client ID létrehozása

Az OAuth Client ID szükséges az admin bejelentkezéshez és a refresh token megszerzéséhez.

### 5.1 OAuth Client ID létrehozása

1. Menj a **"APIs & Services"** > **"Credentials"** menüpontra
2. Kattints a **"Create Credentials"** gombra
3. Válaszd az **"OAuth client ID"** opciót
4. Ha először használod, be kell állítanod az **OAuth consent screen**-t:
   - Kattints a **"Configure Consent Screen"** gombra
   - Válaszd az **"External"** opciót
   - **App name**: `Infosharer`
   - **User support email**: A te email címed
   - **Developer contact information**: A te email címed
   - Kattints a **"Save and Continue"** gombra
   - **Scopes**: Hagyd üresen (később beállítjuk)
   - **Test users**: Add hozzá a saját email címedet
   - Kattints a **"Save and Continue"** gombra

### 5.2 OAuth Client ID konfigurálása

1. Visszatérve a Credentials oldalra, kattints újra a **"Create Credentials"** > **"OAuth client ID"** gombra
2. **Application type**: Válaszd a **"Web application"** opciót
3. **Name**: `Infosharer Web Client`
4. **Authorized JavaScript origins**: Add hozzá a következőket:
   - `http://localhost:5500` (ha local development)
   - `http://127.0.0.1:5500` (ha local development)
   - `https://yourusername.github.io` (GitHub Pages)
   - A te éles domain-ed (pl. `https://yourdomain.com`)
5. **Authorized redirect URIs**: **EZ A LEGFONTOSABB!** Add hozzá:
   
   **Local development:**
   - `http://localhost:5500/auth-callback.html`
   - `http://127.0.0.1:5500/auth-callback.html`
   
   **GitHub Pages (ha az /agazati/ alkönyvtárban van):**
   - `https://yourusername.github.io/agazati/auth-callback.html`
   
   **Saját domain:**
   - `https://yourdomain.com/auth-callback.html`
   - `https://yourdomain.com/agazati/auth-callback.html` (ha alkönyvtárban van)

6. Kattints a **"Create"** gombra

⚠️ **FONTOS**: 
- A redirect URI-nak **pontosan** meg kell egyeznie azzal, amit az alkalmazás használ!
- GitHub Pages esetén ne feledd az `/agazati/` részt!
- Az alkalmazás automatikusan észleli a base path-et és hozzáadja a redirect URI-hez

📝 Másold ki a **Client ID**-t és a **Client secret**-et, szükséged lesz rájuk később.

### 5.3 API Key létrehozása (publikus hozzáféréshez - opcionális)

Az API Key a publikus fájlok letöltéséhez hasznos lehet.

1. Menj a **"APIs & Services"** > **"Credentials"** menüpontra
2. Kattints a **"Create Credentials"** gombra
3. Válaszd az **"API key"** opciót
4. Egy új API key létrejön

### 5.4 API Key korlátozása (ajánlott)

1. Kattints az **"Edit API key"** gombra (ceruza ikon)
2. **API restrictions**: Válaszd a **"Restrict key"** opciót
3. Válaszd ki a **"Google Drive API"**-t a listából
4. Kattints a **"Save"** gombra

📝 Másold ki az API Key-t, szükséged lesz rá később.

## 6. Supabase konfiguráció beállítása

A Google Drive OAuth konfigurációt a Supabase adatbázisban tároljuk.

### 6.1 Konfiguráció SQL tábla létrehozása

1. Nyisd meg a Supabase Dashboard-ot
2. Menj a **SQL Editor** menüpontra
3. Futtasd le a következő SQL scriptet: `database/google-drive-config-table.sql`

### 6.2 OAuth konfiguráció beszúrása

Futtasd le ezt az SQL parancsot a Supabase SQL Editor-ban:

```sql
INSERT INTO app_config (key, value) VALUES
  ('google_drive_client_id', 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com'),
  ('google_drive_client_secret', 'YOUR_CLIENT_SECRET_HERE')
ON CONFLICT (key) DO UPDATE 
  SET value = EXCLUDED.value;
```

⚠️ **FONTOS**: Cseréld ki a `YOUR_CLIENT_ID_HERE` és `YOUR_CLIENT_SECRET_HERE` értékeket az 5.2 lépésben kapott valódi értékekre!

### 6.3 Redirect URI ellenőrzése

Az alkalmazás automatikusan a következő redirect URI-t használja:
```
{your_domain}/auth-callback.html
```

Például:
- Local: `http://localhost:5500/auth-callback.html`
- Éles: `https://yourdomain.com/auth-callback.html`
- GitHub Pages: `https://username.github.io/agazati/auth-callback.html`

⚠️ **Ez a redirect URI-nak pontosan meg kell egyeznie azzal, amit az 5.2 lépésben beállítottál a Google Cloud Console-ban!**

## 7. Admin bejelentkezés és tesztelés

### 7.1 Admin bejelentkezés

1. Nyisd meg az Infosharer admin oldalt: `/secret/admin/`
2. Jelentkezz be admin jogosultsággal
3. A **Google Drive Kezelés** panelban láthatod a következő információkat:
   - **Storage Provider**: Melyik tárolót használja az alkalmazás (Supabase vagy Google Drive)
   - **Authentikációs Státusz**: Be van-e jelentkezve valaki a Google Drive-ba
   
4. Kattints a **🔗 Google Drive Bejelentkezés** gombra
5. Egy popup ablak nyílik meg, ahol be kell jelentkezned a Google fiókodba
6. Engedélyezd az alkalmazás számára a Google Drive hozzáférést
7. A popup bezárul és a részletes információk megjelennek:
   - **📧 Bejelentkezett fiók**: A Google email cím
   - **🗂️ Mappa ID**: A központi Google Drive mappa azonosítója
   - **🔑 Client ID**: Az OAuth Client ID
   - **⏰ Bejelentkezés ideje**: Mikor történt az utolsó bejelentkezés
   - **🔐 Token lejárat**: Automatikus frissítés (♾️)
   - **📊 Jogosultságok**: Milyen hozzáférési jogok vannak beállítva

### 7.2 Google Drive kezelési funkciók

Az admin panelen elérhető funkciók:

- **🔗 Google Drive Bejelentkezés**: Normál bejelentkezés vagy újabb bejelentkezés (select_account)
- **🔐 Újra-autentikáció (Force)**: ⚠️ **NARANCS GOMB** - Csak akkor jelenik meg, ha 401 Unauthorized hiba van!
  - Automatikusan törli a régi token-t
  - Force consent: MINDIG újra kéri MINDEN jogosultságot
  - Használd ezt új scope-ok hozzáadása után
- **🚪 Kijelentkezés**: A refresh token törlése az adatbázisból
- **♻️ Frissítés**: Az információk frissítése
- **🔄 Provider váltás**: Útmutatás a storage provider váltásához

⚠️ **FONTOS - 401 Unauthorized hiba**:

Ha a **"📧 Bejelentkezett fiók"** mező ezt mutatja:
```
⚠️ Nincs adat (401 Unauthorized)
```

Akkor megjelenik a **narancs "🔐 Újra-autentikáció (Force)"** gomb. **Kattints rá!** Ez:
1. Törli a régi refresh token-t
2. `prompt=consent` módban újra bejelentkeztet
3. A Google újra kéri MINDEN jogosultságot (drive.file + userinfo.email)

**Ne a sima "� Bejelentkezés" gombot használd!** Az nem kéri újra a scope-okat!

📝 Részletes útmutató: `docs-archive/GOOGLE-DRIVE-REAUTH.md`

✅ Most már az admin felhasználók feltölthetnek fájlokat a Google Drive-ra!

### 7.2 Storage Provider váltás

Ha át szeretnél váltani Google Drive-ra:

1. Nyisd meg: `assets/js/storage-adapter.js`
2. Módosítsd a `STORAGE_PROVIDER` konstanst:
   ```javascript
   const STORAGE_PROVIDER = 'googledrive';
   ```
3. Töltsd újra az oldalt

## 8. ⚠️ FONTOS: redirect_uri_mismatch hiba javítása

Ha a **"Error 400: redirect_uri_mismatch"** vagy a **"Nem jelentkezhet be ebbe az alkalmazásba"** hibát kapod:

### 8.1 Ellenőrizd a redirect URI-t

1. Nyisd meg a böngésző konzolját (F12)
2. Keresd meg ezt a sort: `🔗 OAuth redirect URI: ...`
3. Másold ki a teljes URI-t
4. Menj a [Google Cloud Console](https://console.cloud.google.com/) oldalra
5. **APIs & Services** > **Credentials**
6. Kattints az OAuth Client ID-ra
7. **Authorized redirect URIs** részben add hozzá a PONTOS URI-t

### 8.2 Példa redirect URI-k különböző környezetekhez

**Local development (VS Code Live Server):**
```
http://localhost:5500/auth-callback.html
http://127.0.0.1:5500/auth-callback.html
```

**GitHub Pages (amikor a projekt az /agazati/ alkönyvtárban van):**
```
https://yourusername.github.io/agazati/auth-callback.html
```
⚠️ **Ne feledd az `/agazati/` részt!**

**Saját domain (root):**
```
https://yourdomain.com/auth-callback.html
```

**Saját domain (alkönyvtárban):**
```
https://yourdomain.com/agazati/auth-callback.html
```

### 8.3 Felhasználóváltás

Ha már van egy Google felhasználó bejelentkezve, de másik fiókkal szeretnél belépni:

Az alkalmazás mostantól automatikusan **account chooser**-t mutat (`prompt=select_account`), így:
- Kiválaszthatod a már bejelentkezett fiókot
- Vagy bejelentkezhetsz egy másik Google fiókkal
- Vagy új fiókot adhatsz hozzá

### 8.4 Ellenőrzés után

1. Mentsd el a változtatásokat a Google Cloud Console-ban
2. Várj **1-2 percet**, hogy a változások életbe lépjenek
3. Próbáld újra a bejelentkezést
4. Most már működnie kell! ✅

## 9. ⚠️ BIZTONSÁGI FIGYELMEZTETÉS

### Private Key védelme

A Service Account **private key-t SOHA ne tárold a frontend kódban**! Ez biztonsági kockázat.

### Javasolt megoldás: Backend API

Éles környezetben használj egy **backend API-t** a fájl feltöltéshez:

#### Backend példa (Node.js + Express):

```javascript
// server.js
const express = require('express');
const { google } = require('googleapis');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Service Account konfiguráció
const serviceAccount = require('./service-account-key.json');

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Fájl feltöltés endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const fileMetadata = {
      name: req.body.fileName,
      parents: ['YOUR_FOLDER_ID_HERE']
    };
    
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path)
    };
    
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, size, createdTime, mimeType'
    });
    
    // Töröljük az ideiglenes fájlt
    fs.unlinkSync(req.file.path);
    
    res.json(response.data);
  } catch (error) {
    console.error('Feltöltési hiba:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fájl törlés endpoint
app.delete('/api/delete/:fileId', async (req, res) => {
  try {
    await drive.files.delete({
      fileId: req.params.fileId
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Backend API fut a 3000-es porton');
});
```

#### Frontend módosítás (infosharer.js):

```javascript
// Feltöltés backend API-n keresztül
async function uploadFileToGoogleDrive(file, fileName) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);
  
  const response = await fetch('http://your-backend.com/api/upload', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Feltöltési hiba');
  }
  
  return await response.json();
}
```

## 9. ⚠️ BIZTONSÁGI FIGYELMEZTETÉS

### OAuth biztonság

Az OAuth Client Secret biztonságosan van tárolva a Supabase adatbázisban. **SOHA ne tedd a frontend kódba!**

### Refresh Token tárolása

A refresh token automatikusan a Supabase `app_config` táblába kerül mentésre az első bejelentkezéskor. Ez biztonságos, mivel:
- A `app_config` tábla RLS (Row Level Security) védett
- Csak admin felhasználók férhetnek hozzá
- A token titkosítva van az adatbázisban

### Javasolt éles környezet védelem

Éles környezetben (production) további biztonsági intézkedések:

1. **HTTPS használata kötelező** - a HTTP-t tiltsd le
2. **API Key korlátozása** - csak meghatározott domain-ekről engedélyezd
3. **Rate limiting** - korlátozd a feltöltések számát
4. **File type validation** - csak engedélyezett fájltípusok feltöltése

## 10. Tesztelés

### 8.1 Ellenőrzési lista

- [ ] Google Cloud Project létrehozva
- [ ] Google Drive API engedélyezve
- [ ] Service Account létrehozva
- [ ] Service Account key letöltve
- [ ] Google Drive mappa létrehozva
- [ ] Mappa megosztva a Service Account-tal (EDITOR jogosultsággal)
- [ ] API Key létrehozva és korlátozva
- [ ] Konfigurációs fájlok frissítve
- [ ] Storage provider átállítva `'googledrive'`-ra

### 8.2 Tesztelés lépései

1. Nyisd meg az Infosharer oldalt
2. Jelentkezz be admin jogosultsággal
3. Próbálj meg feltölteni egy fájlt
4. Ellenőrizd, hogy a fájl megjelenik-e a Google Drive mappában
5. Próbáld meg letölteni a fájlt
6. Tesztelj egy fájl törlést

## 10. Tesztelés

### 10.1 Ellenőrzési lista

- [ ] Google Cloud Project létrehozva
- [ ] Google Drive API engedélyezve
- [ ] Service Account létrehozva
- [ ] Service Account key letöltve (már nem használt, de hasznos lehet)
- [ ] OAuth Client ID létrehozva
- [ ] **Redirect URI-k beállítva a Google Cloud Console-ban**
- [ ] Google Drive mappa létrehozva
- [ ] Mappa megosztva a Service Account-tal (EDITOR jogosultsággal)
- [ ] Supabase `app_config` tábla létrehozva
- [ ] OAuth Client ID és Secret beállítva Supabase-ben
- [ ] Admin bejelentkezés Google Drive-ba sikeres

### 10.2 Tesztelés lépései

1. Nyisd meg az Infosharer admin oldalt (`/secret/admin/`)
2. Jelentkezz be admin jogosultsággal
3. Ellenőrizd a **Google Drive Kezelés** panelt
4. Kattints a **🔗 Google Drive Bejelentkezés** gombra
5. Engedélyezd a hozzáférést a popup ablakban
6. Ellenőrizd, hogy a státusz **✅ Bejelentkezve** legyen
7. Menj az Infosharer főoldalra
8. Próbálj meg feltölteni egy fájlt (admin jogosultsággal)
9. Ellenőrizd, hogy a fájl megjelenik-e a Google Drive mappában
10. Próbáld meg letölteni a fájlt
11. Tesztelj egy fájl törlést

## 11. Hibaelhárítás

### "Error 400: redirect_uri_mismatch" hiba

**Ok**: A redirect URI nem egyezik a Google Cloud Console-ban beállítottal.

**Megoldás**: 
- Ellenőrizd az 5.2 lépést
- Add hozzá a PONTOS redirect URI-t a Google Cloud Console-ban
- Például: `http://localhost:5500/auth-callback.html`
- Várj 1-2 percet és próbáld újra

📝 Részletes útmutató: `docs-archive/REDIRECT-URI-FIX.md`

### "Error 401: Unauthorized" a getUserInfo hívásnál

**Ok**: A meglévő refresh token nem tartalmazza az új scope-okat (pl. `userinfo.email`).

**Megoldás**: Újra-autentikáció szükséges!
1. Töröld a refresh token-t:
   ```sql
   DELETE FROM app_config WHERE key = 'google_drive_refresh_token';
   ```
2. Jelentkezz be újra az admin panelen
3. A Google kérni fogja az új scope-ok engedélyezését

📝 Részletes útmutató: `docs-archive/GOOGLE-DRIVE-REAUTH.md`

### "Google Drive nem inicializálva" hiba

**Ok**: Az OAuth konfiguráció hiányzik a Supabase-ből.

**Megoldás**: 
- Ellenőrizd, hogy lefuttattad-e a 6.1 lépést (SQL tábla létrehozása)
- Ellenőrizd, hogy beszúrtad-e a Client ID-t és Secret-et (6.2 lépés)
- Nézd meg a böngésző konzolt további részletekért

### "Permission denied" hiba feltöltésnél

**Ok**: A Service Account nem fér hozzá a mappához vagy nem vagy bejelentkezve admin-ként.

**Megoldás**:
- Ellenőrizd, hogy megosztottad-e a mappát a Service Account email címével (4.3 lépés)
- Ellenőrizd, hogy EDITOR jogot adtál-e
- Várj néhány percet, míg a jogosultságok életbe lépnek
- Ellenőrizd, hogy admin jogosultsággal vagy-e bejelentkezve

### "Popup blokkolva" hiba

**Ok**: A böngésző blokkolta a popup ablakot.

**Megoldás**:
- Engedélyezd a popup ablakokat ezen az oldalon
- Próbáld újra

### Fájlok nem jelennek meg

**Ok**: A listázás nem a megfelelő mappából történik.

**Megoldás**:
- Ellenőrizd a FOLDER_ID-t (4.2 lépés)
- Nézd meg a Google Drive mappát, hogy ott vannak-e a fájlok
- Ellenőrizd a böngésző konzolt

## 12. Költségek

### Ingyenes kvóta

Google Drive API ingyenes kvóta:
- **Tárhely**: 15 GB ingyenes (Google Drive alapértelmezett)
- **API hívások**: 1,000,000 kérés/nap (általában elegendő)

### Fizetős terv

Ha több tárhelyre van szükséged:
- **Google One**: 100 GB - $1.99/hó
- **Google Workspace Business Standard**: 2 TB - $12/felhasználó/hó

## 11. További információk

### Dokumentáció

- [Google Drive API dokumentáció](https://developers.google.com/drive/api/v3/about-sdk)
- [Service Account dokumentáció](https://cloud.google.com/iam/docs/service-accounts)
- [Google Drive API Node.js példák](https://github.com/googleapis/google-api-nodejs-client)

### Support

Ha problémád van, ellenőrizd:
1. A böngésző konzolt (F12)
2. A Google Cloud Console audit logokat
3. A Service Account jogosultságait

---

**Létrehozva**: 2026.01.10  
**Verzió**: 1.0  
**Szerző**: Infosharer Development Team
