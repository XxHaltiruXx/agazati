# 🔐 Google & GitHub OAuth Beállítása

## 📋 Tartalom
1. [Google OAuth Beállítása](#google-oauth)
2. [GitHub OAuth Beállítása](#github-oauth)
3. [Supabase Konfiguráció](#supabase-config)
4. [Tesztelés](#testing)

---

## 🔵 Google OAuth Beállítása {#google-oauth}

### 1. Google Cloud Console - OAuth Credentials Létrehozása

#### A) Menj a Google Cloud Console-ra:
👉 [https://console.cloud.google.com](https://console.cloud.google.com)

#### B) Válassz vagy Hozz Létre Projektet:
- Kattints a felső menüben a projekt névre
- "New Project" vagy válaszd ki a meglévő projektet
- Nevezd el pl. "Agazati OAuth"

#### C) API-k Engedélyezése:
1. Bal oldali menü → **"APIs & Services"** → **"Library"**
2. Keresd meg: **"Google+ API"** vagy **"Google People API"**
3. Kattints **"Enable"**

#### D) OAuth Consent Screen Beállítása:
1. **"APIs & Services"** → **"OAuth consent screen"**
2. Válaszd: **"External"** (ha nem G Suite/Workspace van)
3. Töltsd ki:
   - **App name**: `Agazati`
   - **User support email**: `xxhaltiruxx@gmail.com`
   - **Developer contact email**: `xxhaltiruxx@gmail.com`
4. **"Save and Continue"**

#### E) Scopes Hozzáadása:
1. **"Add or Remove Scopes"**
2. Válaszd ki:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
3. **"Save and Continue"**

#### F) Test Users (opcionális fejlesztés közben):
1. Add hozzá a saját email címedet: `xxhaltiruxx@gmail.com`
2. **"Save and Continue"**

#### G) OAuth 2.0 Client ID Létrehozása:
1. **"APIs & Services"** → **"Credentials"**
2. **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `Agazati Web Client`
5. **Authorized JavaScript origins**:
   ```
   https://xxhaltiruxx.github.io
   http://localhost:5500
   http://127.0.0.1:5500
   ```

6. **Authorized redirect URIs** (FONTOS!):
   ```
   https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback
   https://xxhaltiruxx.github.io/agazati/auth-callback.html
   http://localhost:5500/auth-callback.html
   ```

7. **"Create"**

#### H) Client ID és Secret Másolása:
- **Client ID**: `xxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxx`
- ⚠️ **Mentsd el ezeket!** Később kell!

---

## 🐙 GitHub OAuth Beállítása {#github-oauth}

### 1. GitHub OAuth App Létrehozása

#### A) Menj a GitHub Settings-re:
👉 [https://github.com/settings/developers](https://github.com/settings/developers)

#### B) Új OAuth App Létrehozása:
1. **"OAuth Apps"** → **"New OAuth App"**
2. Töltsd ki:

**Application name:**
```
Agazati
```

**Homepage URL:**
```
https://xxhaltiruxx.github.io/agazati
```

**Application description** (opcionális):
```
Agazati oktatási platform - HTML, CSS, Python tananyagok
```

**Authorization callback URL** (FONTOS!):
```
https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback
```

3. **"Register application"**

#### C) Client ID és Secret Generálása:
- **Client ID**: Automatikusan generálva (látható)
- **Client Secret**: Kattints **"Generate a new client secret"**
- ⚠️ **Mentsd el ezt is!** Csak egyszer látható!

---

## ⚙️ Supabase Konfiguráció {#supabase-config}

### 1. Menj a Supabase Dashboard-ra:
👉 [https://supabase.com/dashboard](https://supabase.com/dashboard)

### 2. Válaszd ki a projektet:
- **Project**: `ccpuoqrbmldunshaxpes`

### 3. Google Provider Beállítása:

#### A) Authentication → Providers → Google
1. **"Authentication"** → **"Providers"**
2. Keresd meg: **"Google"**
3. Kattints a **"Enable"** gombra
4. Töltsd ki:

**Client ID:**
```
[A Google Cloud Console-ból másolt Client ID]
```

**Client Secret:**
```
[A Google Cloud Console-ból másolt Client Secret]
```

**Authorized Client IDs** (opcionális):
```
[Hagyd üresen]
```

5. **"Save"**

### 4. GitHub Provider Beállítása:

#### B) Authentication → Providers → GitHub
1. Keresd meg: **"GitHub"**
2. Kattints a **"Enable"** gombra
3. Töltsd ki:

**Client ID:**
```
[A GitHub Settings-ből másolt Client ID]
```

**Client Secret:**
```
[A GitHub Settings-ből másolt Client Secret]
```

4. **"Save"**

---

## 🔗 Redirect URL Ellenőrzése

### A Supabase automatikusan használja ezt a redirect URL-t:
```
https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback
```

### Ezt már beállítottad:
- ✅ Google Cloud Console → Authorized redirect URIs
- ✅ GitHub OAuth App → Authorization callback URL

### Ha lokálisan tesztelsz:
A `auth-callback.html` fájl kezeli a callback-et és átirányítja a megfelelő oldalra.

---

## 🧪 Tesztelés {#testing}

### 1. Próbáld ki a Google bejelentkezést:

1. Menj a főoldalra: [https://xxhaltiruxx.github.io/agazati](https://xxhaltiruxx.github.io/agazati)
2. Kattints a **sidebar** alján a **"Bejelentkezés"** gombra
3. A modal ablakban kattints a **"Google"** gombra
4. Jelentkezz be a Google fiókoddal
5. Engedélyezd az alkalmazást
6. Automatikusan vissza kell irányítania az oldalra

### 2. Próbáld ki a GitHub bejelentkezést:

1. Ugyanaz mint a Google-nél
2. De a **"GitHub"** gombra kattints
3. Engedélyezd a GitHub app-ot

### 3. Ellenőrizd a Console Log-ot:

```javascript
✅ Supabase client inicializálva session persistence-szel
🔄 Auth state change: SIGNED_IN
🔄 Loading user profile for: xxhaltiruxx@gmail.com
📋 User metadata is_admin: true
👤 User: xxhaltiruxx@gmail.com | Admin: true
```

---

## ❌ Gyakori Hibák és Megoldások

### 1. "redirect_uri_mismatch" hiba (Google)

**Probléma**: A redirect URI nem egyezik.

**Megoldás**:
- Ellenőrizd hogy a Google Cloud Console-ban pontosan ezt adtad-e meg:
  ```
  https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback
  ```
- Nincs extra szóköz, nincs trailing slash (/)

### 2. "The redirect_uri MUST match the registered callback URL" (GitHub)

**Probléma**: A GitHub callback URL nem egyezik.

**Megoldás**:
- Ellenőrizd a GitHub OAuth App beállításainál:
  ```
  https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback
  ```

### 3. "Access blocked: This app's request is invalid"

**Probléma**: A Google OAuth Consent Screen nincs megfelelően beállítva.

**Megoldás**:
- Menj vissza az OAuth Consent Screen-re
- Add hozzá a saját email címedet a Test Users-hez (fejlesztés alatt)
- VAGY tedd publikussá az app-ot (ha készen van)

### 4. Provider nem jelenik meg a modal-ban

**Probléma**: A provider nincs engedélyezve a Supabase-ben.

**Megoldás**:
- Supabase Dashboard → Authentication → Providers
- Ellenőrizd hogy a Google és GitHub **"Enabled"** státuszban van

---

## 📋 Összefoglaló Checklist

### Google OAuth:
- [ ] Google Cloud Project létrehozva
- [ ] OAuth Consent Screen beállítva
- [ ] OAuth Client ID létrehozva
- [ ] Redirect URIs beállítva
- [ ] Client ID és Secret bemásolva Supabase-be
- [ ] Provider engedélyezve Supabase-ben

### GitHub OAuth:
- [ ] GitHub OAuth App létrehozva
- [ ] Callback URL beállítva
- [ ] Client ID és Secret bemásolva Supabase-be
- [ ] Provider engedélyezve Supabase-ben

### Tesztelés:
- [ ] Google bejelentkezés működik
- [ ] GitHub bejelentkezés működik
- [ ] Session megmarad frissítés után
- [ ] Admin jogok mentődnek (ha be van állítva)

---

## 🎉 KÉSZ!

Most már működik a Google és GitHub bejelentkezés! 🚀

Ha bármilyen probléma van, nézd meg a console log-ot és ellenőrizd hogy:
1. A redirect URL-ek pontosan egyeznek
2. A Client ID és Secret helyesek
3. A provider-ek engedélyezve vannak
