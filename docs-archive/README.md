# 📚 Dokumentáció Archívum

Ez a mappa az Infosharer projekt **összes dokumentációs fájlját** tartalmazza.

## 📋 Tartalom

### 🔐 Google Drive Integráció
- `GOOGLE-DRIVE-SETUP.md` - Alapvető Google Drive beállítás
- `GOOGLE-DRIVE-OAUTH2-SETUP.md` - OAuth2 autentikáció
- `GOOGLE-DRIVE-INTEGRATION.md` - Teljes integráció leírás
- `GOOGLE-DRIVE-IMPLEMENTATION-SUMMARY.md` - Implementáció összefoglalás
- `GOOGLE-DRIVE-SUPABASE-CONFIG.md` - Supabase konfigurációs útmutató
- `GOOGLE-DRIVE-QUICKSTART.md` - Gyorsstart útmutató

### 🔑 Autentikáció & Szervezet
- `AUTH-FIX-README.md` - Autentikációs problémák megoldása
- `SUPABASE-AUTH-README.md` - Supabase auth dokumentáció
- `SUPABASE-AUTH-FIXES-SUMMARY.md` - Auth javítások összefoglalása
- `OAUTH-PROVIDERS-SETUP.md` - OAuth szolgáltatók beállítása
- `OAUTH-QUICK-GUIDE.md` - OAuth gyorsútmutató
- `DISCORD-OAUTH-SETUP.md` - Discord OAuth

### 🛠️ Hibajavítások & Javítások
- `ADMIN-SETUP-SIMPLE.md` - Admin beállítás
- `ADMIN-PERMISSION-FIX.md` - Admin jogok javítása
- `ADMIN-PASSWORD-FUNCTIONS-FIX.md` - Jelszó függvények javítása
- `ADMIN-ISMERETLEN-NEV-FIX.md` - Admin név problémája
- `INFINITE-RECURSION-FIX.md` - Végtelen rekurzió javítása
- `SESSION-PERSISTENCE-FIX.md` - Szession megőrzés javítása
- `JELSZOVALTOZTATAS-DEBUG.md` - Jelszóváltoztatás debuggolás
- `EMAIL-PROBLEM-SOLVED.md` - Email problémák

### 📦 Supabase Migráció
- `SUPABASE-SETUP.md` - Supabase alapvető beállítás
- `SUPABASE-MIGRATION-COMPLETE.md` - Migrációs útmutató
- `SUPABASE-QUICK-FIX.md` - Gyors javítások
- `SUPABASE-EMAIL-FIX.md` - Email beállítás

### 📝 Verzió & Változások
- `RELEASE_NOTES_v1.5.0.md` - v1.5.0 kiadási megjegyzések
- `RELEASES.md` - Összes kiadási történet
- `CHANGES.md` - Változási napló
- `CREDENTIALS-UPDATED.md` - Credential frissítések

### 🔒 Biztonsági Audit
- `SECURITY-AUDIT.md` - Teljes biztonsági audit

## 🚀 Gyorstalálóhoz

**Első lépésekhez:**
1. Google Drive: `GOOGLE-DRIVE-QUICKSTART.md`
2. OAuth: `OAUTH-QUICK-GUIDE.md`
3. Supabase: `SUPABASE-SETUP.md`

**Problémamegoldáshoz:**
- Admin problémák: `ADMIN-SETUP-SIMPLE.md`
- Autentikáció: `AUTH-FIX-README.md`
- Biztonsági kérdések: `SECURITY-AUDIT.md`

## ⚠️ Fontos

- **Ne commitold az .env fájlokat!** Lásd `.env.example`-t
- **Soha ne commitolj API key-eket!** Ezek Supabase app_config-ban vannak
- **Biztonsági auditot olvasd meg** az első telepítés előtt

## 🔄 Szinkronizálás

A projekt **root README.md**-jét jelenleg fejlesztik.
