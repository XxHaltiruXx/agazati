# Google Drive Integráció Beállítása - Infosharer

## Áttekintés

Az Infosharer Google Drive integrációja egy **központi Google Drive mappát** használ, ahova csak az **admin jogosultsággal rendelkező felhasználók** tölthetnek fel fájlokat. A fájlok letöltése mindenkinek elérhető.

### Fő jellemzők:
- ✅ Központi Google Drive tárhely
- ✅ Csak adminok tölthetnek fel
- ✅ Mindenki letölthet
- ✅ Service Account alapú autentikáció (nincs felhasználói bejelentkezés)
- ✅ 15 GB ingyenes tárhely (Google Drive alapértelmezett)

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

## 5. API Key létrehozása (publikus hozzáféréshez)

Az API Key a publikus fájlok letöltéséhez szükséges.

### 5.1 API Key generálása

1. Menj a **"APIs & Services"** > **"Credentials"** menüpontra
2. Kattints a **"Create Credentials"** gombra
3. Válaszd az **"API key"** opciót
4. Egy új API key létrejön

### 5.2 API Key korlátozása (ajánlott)

1. Kattints az **"Edit API key"** gombra (ceruza ikon)
2. **API restrictions**: Válaszd a **"Restrict key"** opciót
3. Válaszd ki a **"Google Drive API"**-t a listából
4. Kattints a **"Save"** gombra

📝 Másold ki az API Key-t, szükséged lesz rá később.

## 6. Konfigurációs fájlok frissítése

### 6.1 Google Drive API konfiguráció

Nyisd meg: `assets/js/google-drive-api.js`

Frissítsd a következő értékeket:

```javascript
const GOOGLE_CONFIG = {
  // API Key (az 5. lépésben létrehozott)
  API_KEY: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  
  // Mappa ID (a 4.2 lépésben kimásolt)
  FOLDER_ID: '1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P',
  
  // Service Account email (a JSON fájlból: client_email)
  SERVICE_ACCOUNT_EMAIL: 'infosharer-storage@your-project.iam.gserviceaccount.com',
  
  // Service Account Private Key (a JSON fájlból: private_key)
  // FIGYELEM: Ezt ne tedd a frontend kódba! Lásd alább a backend megoldást!
  SERVICE_ACCOUNT_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
  
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};
```

### 6.2 Storage Adapter konfiguráció

Nyisd meg: `assets/js/storage-adapter.js`

Állítsd át a storage provider-t Google Drive-ra:

```javascript
// STORAGE PROVIDER: 'supabase' vagy 'googledrive'
const STORAGE_PROVIDER = 'googledrive';
```

## 7. ⚠️ FONTOS BIZTONSÁGI FIGYELMEZTETÉS

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

## 8. Tesztelés

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

## 9. Hibaelhárítás

### "Google Drive nem inicializálva" hiba

**Ok**: Az API Key vagy mappa ID hibás.

**Megoldás**: 
- Ellenőrizd az API Key-t
- Ellenőrizd a FOLDER_ID-t
- Nézd meg a böngésző konzolt további részletekért

### "Permission denied" hiba feltöltésnél

**Ok**: A Service Account nem fér hozzá a mappához.

**Megoldás**:
- Ellenőrizd, hogy megosztottad-e a mappát a Service Account email címével
- Ellenőrizd, hogy EDITOR jogot adtál-e
- Várj néhány percet, míg a jogosultságok életbe lépnek

### Fájlok nem jelennek meg

**Ok**: A listázás nem a megfelelő mappából történik.

**Megoldás**:
- Ellenőrizd a FOLDER_ID-t
- Nézd meg a Google Drive mappát, hogy ott vannak-e a fájlok
- Ellenőrizd a böngésző konzolt

### CORS hiba

**Ok**: A Google Drive API CORS policy miatt elutasítja a kérést.

**Megoldás**:
- Használj backend API-t (lásd 7. fejezet)
- Vagy használj proxy szervert

## 10. Költségek

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
