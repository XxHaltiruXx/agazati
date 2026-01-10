# Infosharer Google Drive Integráció - Gyors Összefoglaló

## ✅ Elkészült

Az Infosharer most már támogatja a **Google Drive**-ot mint storage backend-et!

## 🎯 Főbb változások

### 1. Új fájlok létrehozva:
- `assets/js/google-drive-api.js` - Google Drive API kezelés
- `assets/js/storage-adapter.js` - Egységes storage interfész
- `assets/js/google-drive-config.example.js` - Konfigurációs példa
- `docs/GOOGLE-DRIVE-SETUP.md` - Részletes beállítási útmutató
- `docs/GOOGLE-DRIVE-INTEGRATION.md` - Integráció dokumentáció

### 2. Módosított fájlok:
- `assets/js/infosharer.js` - Storage adapter használat
- `secret/infosharer/index.html` - Google API scripts betöltése

## 🔐 Központi tárhely koncepció

**Hogyan működik:**
- Van **EGY** központi Google Drive mappa
- A mappát **megosztod** egy Service Account-tal
- A Service Account **szerver oldalról** kezeli a fájlokat
- Csak **admin felhasználók** tölthetnek fel (az infosharer.js `canEdit` változója alapján)
- **Mindenki letölthet**, de feltölteni csak adminok tudnak

## 🚀 Használat (3 egyszerű lépés)

### 1. Konfiguráció beállítása

Válaszd ki a storage provider-t a `storage-adapter.js`-ben:

```javascript
const STORAGE_PROVIDER = 'googledrive'; // vagy 'supabase'
```

### 2. Google Drive beállítása

Kövesd a részletes útmutatót: **[docs/GOOGLE-DRIVE-SETUP.md](./GOOGLE-DRIVE-SETUP.md)**

Röviden:
1. Google Cloud Project létrehozása
2. Drive API engedélyezése
3. Service Account létrehozása
4. Google Drive mappa megosztása a Service Account-tal
5. API Key és config beállítása

### 3. Konfigurációs értékek beírása

A `google-drive-api.js`-ben:
```javascript
const GOOGLE_CONFIG = {
  API_KEY: 'YOUR_API_KEY',
  FOLDER_ID: 'YOUR_FOLDER_ID',
  SERVICE_ACCOUNT_EMAIL: 'your-sa@project.iam.gserviceaccount.com',
  SERVICE_ACCOUNT_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----...'
};
```

## ⚠️ Fontos biztonsági megjegyzés

**SOHA ne tárold a Service Account private key-t a frontend kódban éles környezetben!**

Javasolt megoldás:
- Használj **backend API**-t a fájl feltöltéshez
- A private key maradjon a **szerveren**
- A frontend csak a backend API-t hívja meg

Példa backend: lásd `docs/GOOGLE-DRIVE-SETUP.md` 7. fejezet

## 📊 Supabase vs Google Drive

| Szempont | Supabase | Google Drive |
|----------|----------|--------------|
| Ingyenes tárhely | 1 GB | 15 GB |
| Max fájlméret | 50 MB | Korlátlan |
| Beállítás | Egyszerű | Közepes |
| Biztonsági megfontolás | RLS rules | Service Account jogok |
| Adminisztrálás | Csak admin jog | Service Account + admin jog |

## 🎨 Architektúra

```
         Infosharer Frontend
                 |
        Storage Adapter (absztrakt réteg)
                 |
        +--------+--------+
        |                 |
   Supabase        Google Drive
    Storage          API (Service Account)
        |                 |
   PostgreSQL      Központi Google Drive Mappa
    + Storage       (megosztva Service Account-tal)
```

## 🔄 Váltás storage provider-ek között

**Egyszerű!** Csak egy sor kódot kell módosítani:

```javascript
// storage-adapter.js
const STORAGE_PROVIDER = 'googledrive'; // vagy 'supabase'
```

## ✨ Előnyök

### Google Drive előnyei:
- ✅ 15 GB ingyenes tárhely
- ✅ Ismerős felület (Google Drive web UI)
- ✅ Korlátlan fájlméret
- ✅ Jó integráció más Google szolgáltatásokkal

### Supabase előnyei:
- ✅ Egyszerűbb beállítás
- ✅ Beépített RLS (Row Level Security)
- ✅ Real-time szinkronizáció
- ✅ PostgreSQL integráció

## 📝 TODO

- [ ] Backend API implementálása (ajánlott éles környezetben)
- [ ] Rate limiting a feltöltéseknél
- [ ] Thumbnail generálás képekhez
- [ ] Fájl verziókezelés
- [ ] Mappa szerkezet támogatás

## 🐛 Hibaelhárítás

**"Google Drive nem inicializálva"**
→ Ellenőrizd az API_KEY-t és FOLDER_ID-t

**"Permission denied"**
→ Oszd meg a mappát a Service Account-tal (Editor jog)

**"CORS hiba"**
→ Használj backend API-t

Bővebben: `docs/GOOGLE-DRIVE-SETUP.md` 9. fejezet

## 📚 Dokumentáció

- **[Részletes setup útmutató](./GOOGLE-DRIVE-SETUP.md)** - Lépésről lépésre
- **[Integráció dokumentáció](./GOOGLE-DRIVE-INTEGRATION.md)** - Áttekintés
- **[Konfigurációs példa](../assets/js/google-drive-config.example.js)** - Kód példák

## 🎉 Kész vagy!

Most már használhatod az Infosharer-t Google Drive-val!

**Következő lépések:**
1. Kövesd a setup útmutatót
2. Állítsd be a konfigurációt
3. Teszteld az alkalmazást
4. (Opcionális) Implementálj backend API-t

---

**Készült**: 2026.01.10  
**Verzió**: 2.0.0  
**Fejlesztő**: Infosharer Development Team
