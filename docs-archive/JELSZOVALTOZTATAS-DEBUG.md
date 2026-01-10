# JELSZÓ VISSZAÁLLÍTÁS DEBUGGING

## 🔍 Mit Ellenőrizz a Supabase Dashboard-on

### 1. Email Settings
**Settings → Authentication → Email**

✅ Ellenőrizendő:
- [ ] "Enable email confirmations" **BE van kapcsolva**
- [ ] "Secure email change" beállítások rendben
- [ ] Email rate limit nincs túllépve

### 2. Email Templates
**Settings → Authentication → Email Templates**

✅ "Reset Password" template:
```
Subject: Reset Your Password
Content: 
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

⚠️ **FONTOS:** A `{{ .ConfirmationURL }}` kötelező elem!

### 3. SMTP Beállítások (Opcionális)
**Settings → Project Settings → Email**

Alapértelmezett (Supabase email):
- Sender: `noreply@mail.app.supabase.io`
- Működnie kéne alapból

Custom SMTP (ha be van állítva):
- Host
- Port
- Username
- Password
- Tesztelni: "Send test email" gomb

### 4. Auth Settings
**Settings → Authentication → Providers**

✅ Email provider:
- [ ] **Enabled** (bekapcsolva)
- [ ] "Confirm email" - lehet BE vagy KI (mindkettő működik)
- [ ] "Secure password change" - opcionális

### 5. URL Configuration
**Settings → Authentication → URL Configuration**

✅ Site URL:
```
https://yourdomain.com/agazati/
vagy
http://localhost/agazati/
```

✅ Redirect URLs (whitelist):
```
https://yourdomain.com/agazati/auth-callback.html
http://localhost/agazati/auth-callback.html
```

## 🧪 Tesztelés

### 1. Console Ellenőrzés
Nyisd meg a Browser DevTools (F12) → Console

**Sikeres kimenet:**
```
🔑 Jelszó visszaállítás kérése: user@example.com
🔄 Jelszó visszaállítás indítása: user@example.com
📧 Redirect URL: https://...
✅ Jelszó visszaállító email elküldve: user@example.com
📋 Response data: {...}
```

**Hiba esetén:**
```
❌ Jelszó visszaállítási hiba: {...}
Error details: {...}
```

### 2. Supabase Logs
**Dashboard → Logs → Auth**

Keress ilyen bejegyzéseket:
- "password_recovery"
- "reset_password"
- Email küldés státusz

### 3. Email Ellenőrzés
1. Ellenőrizd a beérkezett levelek mappát
2. **SPAM mappa** - gyakran oda kerül!
3. Várj 5-10 percet
4. Email tartalom:
   - Reset Password link
   - Link formátum: `...auth-callback.html?...token=...`

## 🐛 Gyakori Problémák

### "Nem érkezik email"

**Ok 1: Email confirmations KI van kapcsolva**
- Megoldás: Settings → Authentication → Email → Enable email confirmations

**Ok 2: SPAM mappa**
- Megoldás: Nézd meg a SPAM-et

**Ok 3: Rate limit**
- Hiba: "rate limit exceeded"
- Megoldás: Várj 1 órát

**Ok 4: Email nem létezik**
- Nem dob hibát alapból (biztonsági ok)
- De nem küld emailt sem

**Ok 5: Rossz redirect URL**
- Console-ban látod: `📧 Redirect URL: ...`
- Ellenőrizd hogy ez szerepel-e a whitelist-ben

### "Email link nem működik"

**Ok 1: Token lejárt**
- Token érvényesség: 1 óra
- Megoldás: Új jelszó visszaállítási kérvény

**Ok 2: Rossz redirect URL**
- Link átirányít de nincs kezelés
- Megoldás: Ellenőrizd az `auth-callback.html` fájlt

**Ok 3: Token már felhasználva**
- Egy token csak egyszer használható
- Megoldás: Új kérvény

## 📝 Debug Lépések

1. **Hard Refresh** (Ctrl+Shift+R)
2. **Nyisd meg a Console-t** (F12)
3. **Próbáld ki** a jelszó visszaállítást
4. **Olvasd le** a console üzeneteket
5. **Ellenőrizd** a Supabase Logs-ot
6. **Nézd meg** a SPAM mappát

## ✅ Ha Minden Működik

Console kimenet:
```
🔑 Jelszó visszaállítás kérése: user@example.com
🔄 Jelszó visszaállítás indítása: user@example.com
📧 Redirect URL: https://yourdomain.com/agazati/auth-callback.html
✅ Jelszó visszaállító email elküldve: user@example.com
📋 Response data: {}
✅ Jelszó visszaállító email kérés sikeres: {}
```

Sikeres üzenet az oldalon:
> ✅ Jelszó visszaállító email elküldve!
> 
> 📧 Ellenőrizd az email fiókodat (és a SPAM mappát is).
> 
> 💡 Ha nem érkezik meg 5 percen belül, próbáld újra vagy ellenőrizd hogy a megadott email cím létezik-e.

## 🆘 Ha Még Mindig Nem Működik

Küldd el a következőket:
1. Console hibák (teljes hibaüzenet)
2. Supabase Dashboard → Logs → Auth (screenshot)
3. Email provider beállítások (screenshot)
4. Redirect URL beállítások (screenshot)
