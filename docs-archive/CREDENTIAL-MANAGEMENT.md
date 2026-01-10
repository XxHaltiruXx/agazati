# 🔐 Credential Kezelési Útmutató

## 📋 Áttekintés

Ez a dokumentum leírja, hogyan kell **biztonsággal kezelni az API kulcsokat, OAuth credential-eket és egyéb titkos adatokat** az Agazati projektben.

---

## ✅ JÓ Gyakorlatok

### 1. 🏗️ Supabase `app_config` Használata

**MINDEN Google Drive credential-t a Supabase-ben tárolunk:**

```sql
-- NE használj hardcoded értékeket!
INSERT INTO app_config (key, value)
VALUES (
  'google_drive_config',
  jsonb_build_object(
    'CLIENT_ID', '<VALÓDI_CLIENT_ID>',
    'CLIENT_SECRET', '<VALÓDI_CLIENT_SECRET>',
    'FOLDER_ID', '<VALÓDI_FOLDER_ID>'
  )
);
```

✅ **Előnyök:**
- RLS védelemmel (csak admin hozzáférés)
- Supabase által titkosítva
- Nem kerül a Git repository-ba
- Egyszerű frissítés admin panel-ből

### 2. 📝 Placeholder Értékek SQL Fájlokban

**MINDIG placeholder-eket használj az SQL fájlokban:**

```sql
-- ✅ JÓ (Placeholder)
'CLIENT_ID', 'your-client-id-here.apps.googleusercontent.com',
'CLIENT_SECRET', 'your-client-secret-here',
'FOLDER_ID', 'your-folder-id-here'

-- ❌ ROSSZ (Valódi érték)
'CLIENT_ID', '1234567890-abc123xyz.apps.googleusercontent.com',
'CLIENT_SECRET', 'GOCSPX-abc123xyz456',
'FOLDER_ID', '1aBcDeFgHiJkLmNoPqRsTuVwXyZ'
```

### 3. 🔄 .env Fájlok Kezelése

**Lokális fejlesztéshez használd az `.env.local` fájlt:**

```bash
# 1. Másolj a sablon-ból
cp .env.example .env.local

# 2. Töltsd ki az értékeket
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
GOOGLE_DRIVE_CLIENT_ID=...
```

✅ **Biztosítsd:**
- `.env.local` a `.gitignore`-ban van
- SOHA ne commitold az `.env*` fájlokat (kivéve `.env.example`)
- Használj különböző értékeket fejlesztés és production között

### 4. 🛡️ GitHub Secrets

**Production deployment-hez GitHub Secrets-et használj:**

1. GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Add meg:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GOOGLE_DRIVE_CLIENT_ID`
   - stb.

```yaml
# .github/workflows/deploy.yml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## ❌ KERÜLENDŐ Gyakorlatok

### 🚫 1. Hardcoded Credential-ek

```javascript
// ❌ ROSSZ - NE csinálj ilyet!
const CLIENT_ID = '1234567890-abc123xyz.apps.googleusercontent.com';
const CLIENT_SECRET = 'GOCSPX-abc123xyz456';

// ✅ JÓ - Environment variable-ból olvasd
const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
```

### 🚫 2. Commit-olt .env Fájlok

```bash
# ❌ ROSSZ
git add .env.local
git commit -m "Add config"

# ✅ JÓ
# .env.local automatikusan a .gitignore-ban van!
git status
# On branch main
# nothing to commit, working tree clean
```

### 🚫 3. SQL Fájlokban Valódi Értékek

```sql
-- ❌ ROSSZ - Valódi CLIENT_ID az SQL-ben
'CLIENT_ID', '1234567890-abc123xyz.apps.googleusercontent.com'

-- ✅ JÓ - Placeholder az SQL-ben, valódi érték a Supabase-ben
'CLIENT_ID', 'your-client-id-here.apps.googleusercontent.com'
```

---

## 🔄 Credential Rotáció

### Mikor kell kulcsokat cserélni?

1. **Azonnal:**
   - Credential kifele került (pl. GitHub push)
   - Biztonsági breach gyanúja
   - Illetéktelen hozzáférés

2. **Rendszeresen (minden 3-6 hónapban):**
   - Google OAuth Client Secret
   - API kulcsok
   - Access token-ek

### Hogyan rotálj kulcsokat?

#### 1. Google OAuth Credential

```
1. Google Cloud Console:
   https://console.cloud.google.com/apis/credentials

2. Válaszd ki az OAuth 2.0 Client ID-t

3. Kattints a "Regenerate Secret"-re
   (Csak a SECRET változik, CLIENT_ID marad)

4. Másold az új CLIENT_SECRET-et

5. Frissítsd a Supabase app_config-ban:
```

```sql
UPDATE app_config
SET value = jsonb_set(
  value,
  '{CLIENT_SECRET}',
  '"ÚJ_CLIENT_SECRET_IDE"'
)
WHERE key = 'google_drive_config';
```

```
6. Teszteld a Google Drive integrációt
```

#### 2. Supabase API Key Rotáció

```
1. Supabase Dashboard → Project Settings → API

2. Generálj új ANON_KEY-t (ritka)

3. Frissítsd:
   - .env.local (fejlesztés)
   - GitHub Secrets (production)
   - assets/js/supabase-client.js (ha hardcoded)
```

---

## 🛡️ Biztonsági Checklist

### Commit Előtt

- [ ] `git status` - Nincs `.env*` fájl
- [ ] `git diff` - Nincs API key a változásokban
- [ ] SQL fájlok csak placeholder értékeket tartalmaznak
- [ ] Kommentek nem tartalmaznak credential-eket

### Push Előtt

- [ ] GitHub Secret Scanning enabled
- [ ] Force push CSAK ha szükséges (credential leak)
- [ ] `.gitignore` frissítve
- [ ] Team tagok értesítve (ha force push)

### Deployment Előtt

- [ ] Environment variables beállítva
- [ ] GitHub Secrets frissítve
- [ ] Supabase RLS politikák aktívak
- [ ] Google Drive OAuth callback URL helyes

---

## 📚 Credential Tárolási Hierarhia

```
1. PRODUCTION:
   ├── Supabase app_config (RLS védett)
   ├── GitHub Secrets (CI/CD)
   └── Environment Variables (szerver)

2. DEVELOPMENT:
   ├── .env.local (gitignore-ban)
   └── Supabase app_config (teszteléshez)

3. DOCUMENTATION:
   ├── .env.example (placeholder-ek)
   └── SQL fájlok (placeholder-ek)
```

---

## 🚨 Mi Történjen Credential Leak Esetén?

### 1. Azonnali Lépések (5 percen belül)

```bash
# 1. STOP - Ne pusholj tovább!
# 2. Ellenőrizd a kárt
git log --all --full-history -- path/to/leaked/file

# 3. Ha még nem ment fel GitHub-ra:
git reset HEAD~1  # Töröld az utolsó commitot
# Javítsd a fájlt
git add .
git commit -m "Fix: Remove leaked credentials"
```

### 2. Ha Már Fent Van GitHub-on

```bash
# 1. Regeneráld AZONNAL a kulcsokat
# 2. Force push
git push --force-with-lease origin main

# 3. GitHub Support értesítése (nagy leak esetén)
```

### 3. Dokumentáció

```bash
# Készíts incident reportot
docs-archive/SECURITY-INCIDENT-YYYY-MM-DD.md
```

---

## 📖 További Információk

### Dokumentáció
- [SECURITY-AUDIT.md](SECURITY-AUDIT.md) - Biztonsági audit
- [SECURITY-INCIDENT-REPORT.md](SECURITY-INCIDENT-REPORT.md) - Legutóbbi incident
- [.env.example](../.env.example) - Environment variable sablon

### Külső Források
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/best-practices)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Összefoglalás

### ✅ MINDIG
- Használj Supabase `app_config`-ot credential tárolásra
- Placeholder-eket használj SQL fájlokban
- `.env.local` a gitignore-ban
- GitHub Secrets production-hoz
- Rotáld a kulcsokat rendszeresen

### ❌ SOHA
- Ne commitolj `.env*` fájlokat (kivéve `.env.example`)
- Ne hardkódolj API kulcsokat
- Ne pusholj valódi credential-eket
- Ne oszd meg a Supabase admin jogokat

---

🔐 **A biztonság a te felelősséged!** 🔐
