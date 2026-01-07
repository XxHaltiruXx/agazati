# 🔧 Supabase Auth - Gyors Hibaelhárítás

## ❌ Probléma: Nem jön email

### 1️⃣ Első lépések (5 perc)

#### Ellenőrizd a Supabase Dashboard-ot:

```
1. Menj ide: https://app.supabase.com/project/rtguezsjtkxjwhipuaqe
2. Authentication → Setti**Gyors status check:

```javascript
// Másold be a browser console-ba:
const sb = supabase.createClient(
  'https://ccpuoqrbmldunshaxpes.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcHVvcXJibWxkdW5zaGF4cGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE2MDUsImV4cCI6MjA3ODA4NzYwNX0.QpVCmzF96Fp5hdgFyR0VkT9RV6qKiLkA8Yv_LArSk5I'
);

// Session ellenőrzészd meg ezeket:
```

**✅ Email Provider Enabled:**
- Authentication → Settings → Auth Providers
- Email: ✅ ENABLED

**✅ Email Confirmation Beállítás:**
Két opció van:

**A) Fejlesztéshez (Gyors teszt):**
- ❌ **DISABLE** "Enable email confirmations"
- Most azonnal be tudsz lépni regisztráció után
- Nem kell emailre várni

**B) Production-höz (Biztonságos):**
- ✅ **ENABLE** "Enable email confirmations"  
- Email megerősítés KELL
- **SMTP-t be kell állítani!** (lásd lent)

### 2️⃣ SMTP Beállítás (10 perc) - KRITIKUS!

Ha az **"Enable email confirmations"** BE van kapcsolva, akkor **MUSZÁJ custom SMTP-t használni!**

A Supabase alapértelmezett SMTP-je:
- ❌ Limitált (4 email/óra)
- ❌ Gyakran spam-be kerül
- ❌ Lassú

#### Gmail SMTP beállítása:

**1. Gmail App Password generálása:**
```
1. Menj ide: https://myaccount.google.com/security
2. 2-Step Verification → BE kell kapcsolni először
3. App passwords → Generate
4. Válaszd: Mail, Windows Computer
5. Másold ki a 16 karakteres jelszót (pl: "abcd efgh ijkl mnop")
```

**2. Supabase Dashboard:**
```
1. Authentication → Settings → SMTP Settings
2. Enable Custom SMTP: ✅ BE
3. Töltsd ki:
   - Host: smtp.gmail.com
   - Port Number: 587
   - Username: your-email@gmail.com
   - Password: [16 karakteres app password]
   - Sender email: your-email@gmail.com
   - Sender name: Agazati
4. SAVE
```

**3. Tesztelés:**
- Regisztrálj egy új email címmel
- Email 5-10 másodpercen belül meg kell érkezzen
- Ha nem jön, nézd a SPAM mappát

### 3️⃣ Rate Limit Probléma

Ha túl sokszor próbálkoztál:
```
ERROR: "Email rate limit exceeded"
```

**Megoldás:**
- ⏰ Várj 1 órát
- Vagy használj másik email címet
- Vagy kapcsold KI az email confirmationt fejlesztéshez

### 4️⃣ Redirect URL Probléma

**Ellenőrizd a Redirect URL-t:**

```
1. Authentication → URL Configuration
2. Site URL: https://xxhaltiruxx.github.io/agazati
3. Redirect URLs: 
   - https://xxhaltiruxx.github.io/agazati/auth-callback.html
   - http://localhost:5500/auth-callback.html (ha lokálisan tesztelsz)
```

**⚠️ FONTOS:** Mind a kettőt add hozzá ha lokálisan is tesztelsz!

### 5️⃣ Debug Mode

**Browser Console:**
```javascript
1. Nyisd meg a DevTools-t (F12)
2. Console tab
3. Regisztrálj egy fiókot
4. Nézd meg a log-okat:

✅ Jó:
Sign up response: {
  user: "test@example.com",
  session: "No session (email confirmation required)",
  confirmationSentAt: "2026-01-07T12:34:56.789Z"  ← Ez kell!
}

❌ Rossz:
Sign up response: {
  user: "test@example.com",
  session: null,
  confirmationSentAt: null  ← Email NEM lett küldve!
}
```

**Supabase Logs:**
```
1. Menj a Dashboard → Logs → Auth Logs
2. Keresd az `auth.user.signup` eseményt
3. Nézd a részleteket:
   ✅ "email_sent": true
   ❌ "email_failed": true
```

## 🚀 Gyors Fix (Teszteléshez)

Ha gyorsan tesztelni szeretnél authentication-t **EMAIL NÉLKÜL**:

### SQL módszer:

```sql
-- Futtasd le a Supabase SQL Editor-ban:
-- Ez KIKAPCSOLJA az email confirmation-t

-- 1. Jelenlegi beállítás lekérdezése
SELECT * FROM auth.config;

-- 2. Email confirmation KIKAPCSOLÁSA (csak fejlesztéshez!)
UPDATE auth.config 
SET value = 'false' 
WHERE key = 'email_enable_confirmations';
```

### Dashboard módszer:

```
1. Authentication → Settings
2. ❌ DISABLE "Enable email confirmations"
3. Regisztrálj → Azonnal be tudsz lépni
```

**⚠️ NE FELEDD:** Kapcsold vissza production-re deploy előtt!

## 📧 Manual Email Confirmation

Ha regisztráltál de nem jött email, és BE szeretnél lépni:

```sql
-- Futtasd le a Supabase SQL Editor-ban:
-- CSERÉLD LE az email címet!

UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'your-email@example.com';
```

Most be tudsz lépni anélkül, hogy emailt erősítenéd meg.

## 🎯 Recommended Setup

### Fejlesztéshez:
```yaml
Email Provider: ✅ Enabled
Email Confirmation: ❌ Disabled  # Gyors teszt
Custom SMTP: ✅ Gmail (opcionális)
Rate Limit: Magasabb
Site URL: http://localhost:5500
Redirect URLs: 
  - http://localhost:5500/auth-callback.html
```

### Production-höz:
```yaml
Email Provider: ✅ Enabled
Email Confirmation: ✅ Enabled  # Biztonság
Custom SMTP: ✅ Gmail vagy SendGrid (MUSZÁJ!)
Rate Limit: Alapértelmezett (4/óra)
Site URL: https://xxhaltiruxx.github.io/agazati
Redirect URLs: 
  - https://xxhaltiruxx.github.io/agazati/auth-callback.html
```

## 🧪 Teszt Checklist

Minden tesztelés előtt ellenőrizd:

- [ ] Email provider engedélyezve
- [ ] Email confirmation BE vagy KI (tudod melyik)
- [ ] Ha BE: Custom SMTP beállítva (Gmail)
- [ ] Redirect URLs helyesek
- [ ] Rate limit nem érted el
- [ ] Browser console nyitva (F12)
- [ ] SPAM mappa készen áll

## 🆘 Ha Még Mindig Nem Működik

### 1. Supabase Support
```
Dashboard → Support → New Ticket
Írj nekik az email problémáról
Általában 24 órán belül válaszolnak
```

### 2. Email Provider Változtatás

Ha a Gmail SMTP sem működik, próbáld a SendGrid-et:

**SendGrid Free Tier:**
- 100 email/nap ingyenes
- Jobb deliverability
- Regisztráció: https://sendgrid.com

```
SMTP Settings:
- Host: smtp.sendgrid.net
- Port: 587
- Username: apikey
- Password: [SendGrid API Key]
- Sender: noreply@yourdomain.com
```

### 3. Teljes Reset

Ha semmi sem segít, reset-eld a projektet:

```sql
-- ⚠️ FIGYELEM: Ez TÖRLI az összes felhasználót!
DELETE FROM auth.users;
DELETE FROM user_roles;

-- Majd próbáld újra a regisztrációt
```

## 📊 Status Ellenőrzés

### Gyors status check:

```javascript
// Másold be a browser console-ba:
const sb = supabase.createClient(
  'https://rtguezsjtkxjwhipuaqe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z3VlenNqdGt4andoaXB1YXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTY5OTgsImV4cCI6MjA4MzMzMjk5OH0.96ZPMeVMKOEt2nOfflI_pm9-ILLKp-S6x20MGu-9pV8'
);

// Session ellenőrzés
sb.auth.getSession().then(({data}) => {
  console.log('Session:', data.session ? '✅ Van' : '❌ Nincs');
  console.log('User:', data.session?.user?.email || '❌ Nincs');
});
```

---

**Utolsó frissítés:** 2026-01-07  
**Készítő:** GitHub Copilot 🤖

