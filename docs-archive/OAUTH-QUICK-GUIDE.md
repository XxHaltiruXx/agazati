# 🚀 OAuth Gyors Útmutató

## Google OAuth (5 lépés)

### 1. Google Cloud Console
👉 https://console.cloud.google.com
- Új projekt: "Agazati OAuth"
- OAuth consent screen → External → App name: "Agazati"

### 2. Credentials létrehozása
- APIs & Services → Credentials → Create Credentials → OAuth client ID
- Web application

### 3. Redirect URIs
```
https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback
https://xxhaltiruxx.github.io/agazati/auth-callback.html
```

### 4. Client ID & Secret másolása
- Mentsd el mindkettőt!

### 5. Supabase beállítás
- Dashboard → Authentication → Providers → Google → Enable
- Illeszd be a Client ID-t és Secret-et → Save

---

## GitHub OAuth (4 lépés)

### 1. GitHub Settings
👉 https://github.com/settings/developers
- OAuth Apps → New OAuth App

### 2. App adatok
- Name: `Agazati`
- Homepage: `https://xxhaltiruxx.github.io/agazati`
- Callback URL: `https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback`

### 3. Client Secret generálása
- "Generate a new client secret" → Mentsd el!

### 4. Supabase beállítás
- Dashboard → Authentication → Providers → GitHub → Enable
- Illeszd be a Client ID-t és Secret-et → Save

---

## ✅ Kész!

**Tesztelés:**
1. Főoldal → Bejelentkezés gomb
2. Google vagy GitHub gomb
3. Engedélyezd az app-ot
4. Automatikus visszairányítás

**Ha nem működik:**
- Ellenőrizd a redirect URL-eket (PONTOSAN kell egyezniük)
- Nézd meg a console log-ot
- Supabase-ben a provider-ek "Enabled" státuszban vannak-e

Részletes útmutató: [OAUTH-PROVIDERS-SETUP.md](OAUTH-PROVIDERS-SETUP.md)
