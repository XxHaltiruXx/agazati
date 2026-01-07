# 📧 Supabase Email Probléma Megoldása

## 🔍 Probléma
Nem érkeznek meg az email-ek regisztráció vagy jelszó visszaállítás során.

## ✅ Javítások

### 1. Kód Javítások
A következő javításokat végeztem el a `assets/js/supabase-auth.js` fájlban:

#### a) Redirect URL automatikus felismerése
```javascript
REDIRECT_URL: (() => {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  // Ha a pathname tartalmazza az '/agazati/' mappát, akkor használjuk azt
  if (pathname.includes('/agazati/')) {
    return origin + "/agazati/auth-callback.html";
  }
  // Különben csak az origin-t használjuk
  return origin + "/auth-callback.html";
})()
```

#### b) Email confirmation beállítások
```javascript
async signUpWithEmail(email, password, metadata = {}) {
  const { data, error } = await this.sb.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: SUPABASE_CONFIG.REDIRECT_URL,
      shouldCreateUser: true  // ← ÚJ
    }
  });
  
  // Debug logging ← ÚJ
  console.log('Sign up response:', {
    user: data.user?.email,
    session: data.session ? 'Session created' : 'No session (email confirmation required)',
    confirmationSentAt: data.user?.confirmation_sent_at
  });
}
```

### 2. Supabase Dashboard Beállítások

#### A) Email Authentikáció Engedélyezése

1. Menj a [Supabase Dashboard](https://app.supabase.com)
2. Válaszd ki a projektet: `rtguezsjtkxjwhipuaqe`
3. **Authentication → Settings → Auth Providers**
4. Ellenőrizd hogy az **Email** provider **engedélyezve van**

#### B) Email Confirmation Beállítás

1. **Authentication → Settings → Auth Settings**
2. Keresd meg a **"Confirm email"** opciót
3. Három lehetőség van:

   **A) Email Confirmation Kikapcsolva** (Gyors teszteléshez)
   - ❌ **Enable email confirmations** - KI van kapcsolva
   - Felhasználók azonnal be tudnak jelentkezni regisztráció után
   - ⚠️ **NEM AJÁNLOTT** production környezetben!
   
   **B) Email Confirmation Bekapcsolva** (Ajánlott)
   - ✅ **Enable email confirmations** - BE van kapcsolva
   - Felhasználóknak meg kell erősíteniük az email címüket
   - Email-t kell küldenie a Supabase-nek

   **C) Email Confirmation Bekapcsolva + Auto-Confirm** (Fejlesztéshez)
   - ✅ **Enable email confirmations** - BE
   - ✅ **Enable auto-confirm email** - BE (csak fejlesztéshez!)

#### C) Email Rate Limiting

1. **Authentication → Settings → Rate Limits**
2. Ellenőrizd a rate limiteket:
   - Email send rate: 3-4 per hour (alapértelmezett)
   - Ha túl sokat próbálkoztál, várj 1 órát

#### D) Email Templates

1. **Authentication → Email Templates**
2. Három template van:
   - **Confirm signup** - Regisztráció megerősítése
   - **Magic Link** - Magic link bejelentkezés
   - **Reset Password** - Jelszó visszaállítás

3. Ellenőrizd minden template-ben:
   ```html
   <h2>Confirm your email</h2>
   <p>Follow this link to confirm your email:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
   ```

4. A `{{ .ConfirmationURL }}` kell hogy tartalmazza a helyes redirect URL-t

#### E) SMTP Beállítások (Fontos!)

**Alapértelmezett Supabase SMTP:**
- Supabase saját SMTP szervert használ
- **Napi limit:** 4 email / óra
- **⚠️ Gyakran kerül spam-be!**

**Custom SMTP (Ajánlott):**

1. **Authentication → Settings → SMTP Settings**
2. Kapcsold be a **"Enable Custom SMTP"**
3. Állítsd be:

   **Gmail SMTP példa:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: app-specific-password (nem a Gmail jelszavad!)
   Sender email: your-email@gmail.com
   Sender name: Agazati
   ```

   **Gmail App Password létrehozása:**
   - Google Account → Security
   - 2-Step Verification → App passwords
   - Generate new app password
   - Másold be ide

   **SendGrid SMTP példa:**
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: YOUR_SENDGRID_API_KEY
   Sender email: noreply@yourdomain.com
   Sender name: Agazati
   ```

#### F) Redirect URLs (Kritikus!)

1. **Authentication → URL Configuration**
2. **Site URL:** 
   ```
   https://xxhaltiruxx.github.io/agazati
   ```
   VAGY ha lokálisan teszteled:
   ```
   http://localhost:5500
   ```

3. **Redirect URLs:** (mind a kettőt add hozzá!)
   ```
   https://xxhaltiruxx.github.io/agazati/auth-callback.html
   http://localhost:5500/auth-callback.html
   ```

### 3. Tesztelés

#### A) Browser Console Check
1. Nyisd meg a DevTools-t (F12)
2. Regisztrálj egy új fiókkal
3. Nézd meg a Console-t:
   ```javascript
   Sign up response: {
     user: "test@example.com",
     session: "No session (email confirmation required)",
     confirmationSentAt: "2026-01-07T12:34:56.789Z"
   }
   ```
4. Ha látod a `confirmationSentAt` értéket → Email el lett küldve!

#### B) Supabase Logs
1. **Logs → Auth Logs**
2. Keresd meg az `auth.user.signup` eseményt
3. Ellenőrizd a state-et:
   - `user_created` ✅
   - `email_sent` ✅ (ha ez van, akkor elküldve)
   - `email_failed` ❌ (ha ez van, hiba volt)

#### C) Email Check
1. Ellenőrizd a bejövő leveleket
2. **⚠️ Nézd meg a SPAM mappát!**
3. Az email feladója:
   - Supabase SMTP: `noreply@mail.app.supabase.io`
   - Custom SMTP: `your-email@gmail.com` (ahogy beállítottad)

#### D) Debug Mode
Ha még mindig nem jön email, kapcsold ki az email confirmationt teszteléshez:

1. **Authentication → Settings**
2. ❌ **Disable email confirmations**
3. Regisztrálj újra → Azonnal be tudsz lépni
4. Ha ez működik → Az email küldés a probléma

### 4. Gyakori Problémák & Megoldások

#### 🔴 Probléma: Egyáltalán nem jön email
**Megoldás:**
1. Ellenőrizd a SPAM mappát
2. Rate limit: Várj 1 órát
3. Próbáld meg custom SMTP-vel (Gmail)
4. Ellenőrizd a Supabase Logs-ot

#### 🔴 Probléma: Email link nem működik
**Megoldás:**
1. Ellenőrizd a Redirect URLs beállítást
2. A link tartalmazza a helyes domain-t?
3. A `auth-callback.html` elérhető?

#### 🔴 Probléma: "Email rate limit exceeded"
**Megoldás:**
1. Várj 1 órát
2. Használj másik email címet teszteléshez
3. Kapcsold ki az email confirmationt fejlesztéshez

#### 🔴 Probléma: Email spambe kerül
**Megoldás:**
1. Használj custom SMTP-t (Gmail/SendGrid)
2. SPF/DKIM rekordok beállítása a domain-hez
3. Email template szövegének finomítása

#### 🔴 Probléma: Lokálisan nem működik
**Megoldás:**
1. Add hozzá a lokális URL-t: `http://localhost:5500/auth-callback.html`
2. Vagy használj Live Server-t VS Code-ban
3. HTTPS szükséges lehet OAuth-hoz

### 5. Gyors Teszt (Email Confirmation Nélkül)

Ha gyorsan tesztelni szeretnél:

```sql
-- Futtasd le a Supabase SQL Editor-ban
-- Ez KIKAPCSOLJA az email confirmationt a projekt szinten
ALTER DATABASE postgres SET "app.settings.auth_email_enable_confirmations" TO 'false';
```

VAGY

1. Dashboard → Authentication → Settings
2. ❌ **Disable** "Enable email confirmations"

Most regisztrálhatsz és azonnal beléphetsz, email confirmation nélkül.

⚠️ **Ne feledd visszakapcsolni production-ben!**

### 6. Email Confirmation Manual Approval

Ha az email tényleg nem jön, de be szeretnél lépni:

```sql
-- Futtasd le a Supabase SQL Editor-ban
-- Cseréld le az email címet!
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'your-email@example.com';
```

Ez manuálisan megerősíti az email címet.

## 📊 Ellenőrző Checklist

- [ ] Email provider engedélyezve (Dashboard)
- [ ] Email confirmation BE vagy KI (tudod melyik)
- [ ] SMTP beállítások OK (custom ajánlott)
- [ ] Rate limit nem érted el (max 4/óra)
- [ ] Redirect URLs helyesek (Dashboard)
- [ ] Site URL helyes (Dashboard)
- [ ] Email templates OK
- [ ] SPAM mappa ellenőrizve
- [ ] Browser Console log megnézve
- [ ] Supabase Auth Logs megnézve

## 🎯 Ajánlott Konfiguráció Production-ben

```
✅ Enable email confirmations: BE
✅ Custom SMTP: Gmail vagy SendGrid
✅ Rate limiting: 4/hour (alapértelmezett)
✅ Site URL: https://xxhaltiruxx.github.io/agazati
✅ Redirect URLs: https://xxhaltiruxx.github.io/agazati/auth-callback.html
✅ Email templates: Testreszabva
✅ Sender email: Saját domain email
```

## 🎯 Ajánlott Konfiguráció Fejlesztéshez

```
❌ Enable email confirmations: KI (vagy auto-confirm)
✅ Custom SMTP: Gmail
✅ Site URL: http://localhost:5500
✅ Redirect URLs: http://localhost:5500/auth-callback.html
✅ Rate limiting: Magasabb (10/hour)
```

---

**Javítva:** 2026-01-07  
**Készítő:** GitHub Copilot 🤖

