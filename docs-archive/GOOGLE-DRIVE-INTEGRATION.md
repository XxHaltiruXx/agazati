# Infosharer - Google Drive Integráció

## Gyors áttekintés

Az Infosharer mostantól támogatja a **Google Drive** tárolást is a Supabase mellett!

### Főbb jellemzők:

- 🔐 **Központi tárhely**: Egy közös Google Drive mappa az összes fájlhoz
- 👥 **Admin-only feltöltés**: Csak admin jogosultsággal rendelkezők tölthetnek fel
- 📥 **Publikus letöltés**: Mindenki letöltheti a fájlokat
- 💾 **15 GB ingyenes**: Google Drive alapértelmezett ingyenes tárhely
- 🔄 **Könnyű váltás**: Egyszerűen válthatsz Supabase és Google Drive között

## Használat

### 1. Storage Provider kiválasztása

A `assets/js/storage-adapter.js` fájlban:

```javascript
// Válaszd ki a storage provider-t:
const STORAGE_PROVIDER = 'googledrive';  // vagy 'supabase'
```

### 2. Google Drive beállítása

Ha Google Drive-ot választasz, kövesd a részletes útmutatót:

📖 **[Google Drive Setup Guide](./docs/GOOGLE-DRIVE-SETUP.md)**

### 3. Gyors konfiguráció

A `assets/js/google-drive-api.js` fájlban állítsd be:

```javascript
const GOOGLE_CONFIG = {
  API_KEY: 'YOUR_API_KEY_HERE',              // Google Cloud Console
  FOLDER_ID: 'YOUR_FOLDER_ID_HERE',          // Google Drive mappa ID
  SERVICE_ACCOUNT_EMAIL: 'your-sa@...iam.gserviceaccount.com',
  SERVICE_ACCOUNT_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----...'
};
```

⚠️ **Biztonsági figyelmeztetés**: Éles környezetben használj backend API-t a private key védelmére!

## Storage Provider összehasonlítás

| Funkció | Supabase Storage | Google Drive |
|---------|------------------|--------------|
| **Ingyenes tárhely** | 1 GB | 15 GB |
| **Max fájlméret** | 50 MB | Korlátlan |
| **Autentikáció** | Supabase Auth | Service Account |
| **Beállítás** | Egyszerű | Közepes |
| **Költség** | $0.021/GB/hó | Ingyenes (15 GB-ig) |
| **API limit** | 2.5 millió kérés/hó | 1 millió kérés/nap |

## Váltás Supabase és Google Drive között

### Supabase -> Google Drive

1. Állítsd át a `STORAGE_PROVIDER`-t `'googledrive'`-ra
2. Konfiguráld a Google Drive API-t
3. A meglévő fájlokat manuálisan át kell másolni

### Google Drive -> Supabase

1. Állítsd át a `STORAGE_PROVIDER`-t `'supabase'`-ra
2. A meglévő fájlokat manuálisan át kell másolni

## Biztonsági javaslatok

### ✅ Ajánlott (Éles környezet)

1. **Backend API használata**: A private key tárolása szerver oldalon
2. **HTTPS**: Mindig használj HTTPS-t
3. **API Key korlátozás**: Korlátozd az API Key-t csak a Google Drive API-ra
4. **Rate limiting**: Állíts be rate limiting-et a backend API-n

### ❌ Kerülendő

1. Private key tárolása a frontend kódban
2. API Key megosztása publikus repo-ban
3. Service Account full access jogosultság

## Architektúra

```
┌─────────────────┐
│   Infosharer    │
│   Frontend      │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐ ┌─────▼──────────┐
│ Storage Adapter │ │  Supabase Auth │
└────────┬────────┘ │   (jogosultság)│
         │          └────────────────┘
         │
    ┌────┴─────┐
    │          │
┌───▼───┐  ┌──▼─────────┐
│Supabase│  │Google Drive│
│Storage │  │    API     │
└────────┘  └────────────┘
```

## Fejlesztés

### Storage Adapter bővítése

Új storage provider hozzáadása:

```javascript
// storage-adapter.js
class StorageAdapter {
  async uploadFile(file, fileName, progressCallback) {
    if (this.provider === 'supabase') {
      // Supabase logika
    } else if (this.provider === 'googledrive') {
      // Google Drive logika
    } else if (this.provider === 'your-new-provider') {
      // Új provider logika
    }
  }
}
```

## Hibaelhárítás

### Gyakori hibák

**"Google Drive nem inicializálva"**
- Ellenőrizd az API Key-t
- Ellenőrizd a FOLDER_ID-t

**"Permission denied"**
- A Service Account nincs megosztva a mappával
- Várj néhány percet a jogosultság életbelépésére

**CORS hiba**
- Használj backend API-t
- Vagy használj proxy szervert

## Dokumentáció

- 📖 [Google Drive Setup útmutató](./docs/GOOGLE-DRIVE-SETUP.md)
- 📖 [Supabase Setup útmutató](./docs/SUPABASE-SETUP.md)
- 📖 [Storage Adapter API dokumentáció](./docs/STORAGE-ADAPTER-API.md)

## Changelog

### v2.0.0 - Google Drive Support
- ✨ Google Drive integráció hozzáadva
- ✨ Storage Adapter réteg implementálva
- ✨ Service Account autentikáció
- 🔧 Központi tárhely konfiguráció

### v1.5.0 - Supabase Storage
- ✨ Supabase Storage alapértelmezett
- ✨ 50 MB fájlméret limit
- ✨ Realtime szinkronizáció

## Licenc

MIT License - lásd a [LICENSE](./LICENSE) fájlt.

## Support

Ha kérdésed van vagy segítségre van szükséged:
1. Nézd meg a dokumentációt
2. Ellenőrizd a böngésző konzolt
3. Nyiss egy issue-t a GitHub repo-ban

---

**Készítette**: Infosharer Development Team  
**Utolsó frissítés**: 2026.01.10
