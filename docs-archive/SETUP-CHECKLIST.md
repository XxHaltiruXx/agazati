# 🚀 Agazati - Telepítési Checklist

Kövesd ezt a lépéseket a projekt sikeres telepítéséhez.

## ⚙️ Előfeltételek

- [ ] Node.js 16+ telepítve
- [ ] Git telepítve
- [ ] Supabase fiók ([supabase.com](https://supabase.com))
- [ ] Google Console projekt (Google Drive API-hoz)

---

## 📋 1. Projekt Előkészítése

### 1.1 Repository Klónozása

```bash
git clone https://github.com/XxHaltiruXx/agazati.git
cd agazati
```

### 1.2 Szokott Fájlok Másolása

```bash
# Másolj .env.example -> .env.local
cp .env.example .env.local
```

### 1.3 .env.local Kitöltése

Szerkeszd az `.env.local` fájlt és add meg az értékeket:

```bash
# Nyisd meg és töltsd ki:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
# Stb...
```

---

## 🗄️ 2. Supabase Beállítása

### 2.1 Adatbázis Inicializálása

1. Nyisd meg az **Supabase Dashboard** → **SQL Editor**
2. Futtasd le sorrendben ezeket:

```bash
# 1. Profil tábla
→ docs/database/supabase-create-profiles-table.sql

# 2. Setup
→ docs/database/supabase-setup-step-by-step.sql

# 3. RLS Politikák
→ docs/database/MINIMAL-POLICIES.sql

# 4. Admin beállítás
→ docs/database/set-admin-metadata-function.sql
→ docs/database/ADD-ADMIN-POLICIES-SAFE.sql
```

### 2.2 Admin Felhasználó Létrehozása

1. Supabase Dashboard → **Authentication** → **Users**
2. Kattints: **Add user**
3.Add meg az admin emailt és jelszót
4. Futtasd az admin SQL-t:

```sql
-- Nyisd meg az SQL Editor-t és futtasd:
-- docs-archive/SUPABASE-SETUP.md, majd az admin SQL
```

---

## 🌐 3. Google Drive Integráció (Opcionális)

### 3.1 Google Console Projekt Létrehozása

1. Menj ide: [console.cloud.google.com](https://console.cloud.google.com)
2. Hozz létre egy új projektet
3. Engedélyezd a **Google Drive API**-t
4. Menj a **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Válaszd a **Web application** típust
6. Add meg az **Authorized redirect URIs**:
   ```
   https://your-domain.com/auth-callback.html
   http://localhost:5000/auth-callback.html  (fejlesztéshez)
   ```

### 3.2 Google Drive Konfiguráció Supabase-ben

1. Másold ki a Google Console-ból:
   - Client ID
   - Client Secret
   - (Eltárold a Supabase-ben később)

2. Hozz létre egy **Google Drive mappát** a fájloknak
3. Másold ki a **Folder ID**-t az URL-ből:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
   ```

4. Supabase App Config:
   - Nyisd meg az **Admin Panel** (secret/admin/)
   - Lépj az **Google Drive** szekciót
   - Add meg az adatokat

---

## 🧪 4. Teszt

### 4.1 Helyi Szerver

```bash
# Indítsd el a helyi szerveret (pl. VS Code Live Server)
# vagy:
python -m http.server 5000
```

### 4.2 Teszt Lépések

- [ ] Regisztrálj egy felhasználót
- [ ] Jelentkezz be
- [ ] Tesztelj egy óraanyagot
- [ ] Töltsd fel az Infosharer-be egy fájlt
- [ ] Ellenőrizd a Google Drive mappát

---

## 🚀 5. Deployment

### 5.1 Environment Variables Beállítása

A **GitHub/Vercel/Netlify** deployment-nél:

1. Add meg a titkos értékeket az **Environment Variables**-ben:
   ```
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   GOOGLE_DRIVE_CLIENT_ID=...
   GOOGLE_DRIVE_CLIENT_SECRET=...
   GOOGLE_DRIVE_FOLDER_ID=...
   ```

2. **SOHA ne** commitolj `.env` vagy `.env.local` fájlokat
3. Használj `.env.example` sablon-t

### 5.2 GitHub Pages (Ha GitHub Pages-re deployosol)

```bash
git push origin main
# A GitHub Actions automatikusan deployol
```

---

## 🔒 6. Biztonsági Ellenőrzés

- [ ] Ellenőrizd a `.gitignore`-t: `cat .gitignore | grep -E "\.env|credentials|secret"`
- [ ] Nincs-e API key a kommentekben?
- [ ] Olvasd el a `docs-archive/SECURITY-AUDIT.md`-t
- [ ] Ellenőrizd a Supabase RLS politikákat: `docs/database/CHECK-POLICIES.sql`

---

## 🆘 7. Problémamegoldás

### 7.1 "406 Error" a Google Drive-ról

```bash
# Lásd: docs-archive/GOOGLE-DRIVE-OAUTH2-SETUP.md
# Ellenőrizd a callback URL-t
```

### 7.2 Auth Problémák

```bash
# Lásd: docs-archive/AUTH-FIX-README.md
# vagy futtatás: docs/database/FIX-RLS-POLICIES-SIMPLE.sql
```

### 7.3 Supabase Kapcsolati Problémák

```bash
# Ellenőrizd az .env.local értékeket
# Újraindítsd a szervért
```

---

## 📚 Dokumentáció

- **Google Drive**: `docs-archive/GOOGLE-DRIVE-QUICKSTART.md`
- **Auth**: `docs-archive/AUTH-FIX-README.md`
- **Biztonsági audit**: `docs-archive/SECURITY-AUDIT.md`
- **Adatbázis**: `docs/INDEX.md`

---

## ✅ Véglegesítés

- [ ] Összes lépés teljesítve
- [ ] Teszt-fájlok feltöltve és letöltve
- [ ] Admin panel működik
- [ ] Nem maradt `.env` vagy API key a kódban
- [ ] README.md frissítve saját projekteddel

🎉 **Gratulálunk! Az Agazati projekt működik!**

---

## 📞 Segítség

Ha problémád van, keress az alábbi helyeken:

1. `docs-archive/` - Összes útmutató
2. `docs/INDEX.md` - Adatbázis SQL
3. GitHub Issues: https://github.com/XxHaltiruXx/agazati/issues
