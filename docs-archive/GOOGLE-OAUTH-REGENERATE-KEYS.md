# 🔄 Google OAuth Kulcsok Regenerálása - AZONNALI ÚTMUTATÓ

## ⚠️ KRITIKUS: Ez AZONNAL szükséges!

Az alábbi API kulcsok nyilvánosságra kerültek a GitHub-on:
- Google OAuth Client ID
- Google OAuth Client Secret

**Ezek már használhatatlanok!** Új kulcsokat kell generálni.

---

## 📋 Lépésről-lépésre Útmutató

### 1. Google Cloud Console Megnyitása

1. Nyisd meg: https://console.cloud.google.com
2. Bejelentkezés a Google fiókkal
3. Válaszd ki az **"agazati"** projektet (ha nem automatikus)

### 2. Credentials Oldal

1. Menj az **APIs & Services** → **Credentials**
   - URL: https://console.cloud.google.com/apis/credentials

2. Keresd meg az OAuth 2.0 Client (Web application)

### 3. Kulcsok Regenerálása

#### Option A: Új Client Létrehozása (Ajánlott)

1. Kattints: **+ Create Credentials** → **OAuth Client ID**
2. Válaszd: **Web application**
3. Add meg az **Authorized Redirect URIs**:
   ```
   https://your-domain.com/auth-callback.html
   http://localhost:5000/auth-callback.html  (dev)
   ```
4. Kattints: **Create**
5. Másold ki az új értékeket:
   - **Client ID**
   - **Client Secret**

#### Option B: Meglévő Kulcs Regenerálása

1. Keresd meg a meglévő OAuth 2.0 Client-et
2. Kattints rá
3. Kattints: **Regenerate Secret**
4. Másold ki az új **Client Secret**-et

### 4. Supabase `app_config` Frissítése

1. Nyisd meg: https://supabase.com/dashboard
2. Válaszd ki az **"agazati"** projektet
3. Menj az **SQL Editor**-ba
4. Futtasd le ezt az SQL-t:

```sql
UPDATE app_config
SET value = jsonb_set(
  value,
  '{CLIENT_ID}',
  to_jsonb('NEW-CLIENT-ID-HERE.apps.googleusercontent.com'::text)
)
WHERE key = 'google_drive_config';

UPDATE app_config
SET value = jsonb_set(
  value,
  '{CLIENT_SECRET}',
  to_jsonb('NEW-CLIENT-SECRET-HERE'::text)
)
WHERE key = 'google_drive_config';
```

### 5. Test

1. Nyisd meg az admin panelt: `secret/admin/index.html`
2. Kattints: **Google Drive** → **Sign In with Google**
3. Ellenőrizz, hogy működik-e
4. Próbálj meg egy fájlt feltölteni

---

## 🔐 Biztonsági Megjegyzések

### Már Fixelve:
- ✅ SQL fájl placeholder értékeket tartalmaz
- ✅ `.gitignore` az SQL fájlokat védi
- ✅ Git history megtisztítva

### Még Szükséges:
- [ ] **GitHub Force Push** - Kövesd a SECURITY-INCIDENT-REPORT.md-t
- [ ] **Deployment Refresh** - Új kulcsokkal
- [ ] **Testing** - Google Drive funkciók

---

## 📚 Kapcsolódó Dokumentáció

- [SECURITY-INCIDENT-REPORT.md](./SECURITY-INCIDENT-REPORT.md) - Teljes incident report
- [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) - Biztonsági audit
- [GOOGLE-DRIVE-OAUTH2-SETUP.md](./GOOGLE-DRIVE-OAUTH2-SETUP.md) - OAuth beállítás

---

## ✅ Checklist

- [ ] Google Cloud Console: Új kulcsok generálva
- [ ] Supabase: `app_config` frissítve
- [ ] GitHub: Force push (ha szükséges)
- [ ] Deploy: Újraindítva
- [ ] Test: Google Drive funkciók működnek
- [ ] Dokumentáció: Frissítve

---

**Köszönjük, hogy segítettél a biztonsági probléma megoldásában!** 🛡️
