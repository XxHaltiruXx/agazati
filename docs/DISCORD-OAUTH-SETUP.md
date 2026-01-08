# Discord OAuth Beállítási Útmutató

## 📋 Áttekintés

Ez az útmutató bemutatja, hogyan kell beállítani a Discord OAuth authentikációt a Supabase projektben.

## 🎯 Lépések

### 1. Discord Developer Application létrehozása

1. Menj a [Discord Developer Portal](https://discord.com/developers/applications)-ra
2. Kattints a **"New Application"** gombra
3. Add meg az alkalmazás nevét (pl. "Agazati")
4. Fogadd el a feltételeket

### 2. OAuth2 Beállítások

1. A bal oldali menüben válaszd az **"OAuth2"** menüpontot
2. Másold ki a **Client ID**-t és **Client Secret**-et (később szükség lesz rájuk)

### 3. Redirect URL hozzáadása

Az **"OAuth2"** → **"Redirects"** résznél add hozzá a következő URL-eket:

**Lokális fejlesztéshez:**
```
http://localhost:5500/auth-callback.html
http://127.0.0.1:5500/auth-callback.html
```

**GitHub Pages production:**
```
https://xxhaltiruxx.github.io/agazati/auth-callback.html
```

**Supabase callback URL (automatikusan hozzáadva):**
```
https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback
```

### 4. Supabase Konfiguráció

1. Menj a [Supabase Dashboard](https://app.supabase.com/)-ra
2. Válaszd ki a projektedet: `ccpuoqrbmldunshaxpes`
3. Menj az **"Authentication"** → **"Providers"** menüpontba
4. Keress rá a **"Discord"**-ra
5. Kapcsold **BE** a Discord provider-t
6. Másold be a Discord Developer Portal-ból:
   - **Client ID** (Application ID)
   - **Client Secret**
7. A **"Redirect URL"** mező automatikusan ki lesz töltve:
   ```
   https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback
   ```
8. Kattints a **"Save"** gombra

### 5. Site URL konfiguráció

A Supabase **"Authentication"** → **"URL Configuration"** részben:

**Site URL:**
```
https://xxhaltiruxx.github.io/agazati/
```

**Redirect URLs (engedélyezett visszatérési URL-ek):**
```
http://localhost:5500/auth-callback.html
http://127.0.0.1:5500/auth-callback.html
https://xxhaltiruxx.github.io/agazati/auth-callback.html
```

## 🔧 Kód implementáció

### HTML (auth-modal.html)

Discord gomb mindkét formban (bejelentkezés és regisztráció):

```html
<button id="discordBtn" class="social-btn discord">
  <svg width="18" height="18" viewBox="0 0 71 55" fill="currentColor">
    <!-- Discord logo SVG -->
  </svg>
  Discord-dal
</button>
```

### CSS (auth-modal.css)

```css
.social-btn.discord {
  background: rgba(88, 101, 242, 0.1);
  border-color: rgba(88, 101, 242, 0.3);
  color: #5865F2;
}

.social-btn.discord:hover {
  background: rgba(88, 101, 242, 0.2);
  border-color: rgba(88, 101, 242, 0.5);
}
```

### JavaScript (supabase-auth.js)

**Discord OAuth metódus:**
```javascript
async signInWithDiscord() {
  const { data, error } = await this.sb.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: SUPABASE_CONFIG.REDIRECT_URL
    }
  });

  if (error) throw error;
  return data;
}
```

**Event listener:**
```javascript
this.discordBtn?.addEventListener("click", () => this.handleDiscordLogin());
this.discordRegisterBtn?.addEventListener("click", () => this.handleDiscordLogin());
```

## ✅ Tesztelés

1. Nyisd meg az oldalt: `http://localhost:5500/` vagy `https://xxhaltiruxx.github.io/agazati/`
2. Kattints a **"Bejelentkezés"** vagy **"Regisztráció"** fülre
3. Kattints a **"Discord-dal"** gombra
4. Engedélyezd az alkalmazásnak a Discord fiókod használatát
5. Automatikusan vissza kell irányítania az `auth-callback.html`-re
6. Onnan pedig az `index.html`-re (főoldalra)

## 🐛 Gyakori hibák

### "Invalid redirect URL"
- Ellenőrizd hogy az összes redirect URL be van-e állítva mindkét helyen (Discord Developer Portal ÉS Supabase)

### "OAuth provider not configured"
- Ellenőrizd hogy a Discord provider engedélyezve van-e a Supabase-ben
- Ellenőrizd hogy a Client ID és Secret helyesen van-e beállítva

### Nem irányít vissza az oldalra
- Ellenőrizd az `auth-callback.html` fájlt
- Nézd meg a böngésző konzolt hibaüzenetekért
- Ellenőrizd hogy a `REDIRECT_URL` helyesen van-e beállítva

## 📝 Megjegyzések

- A Discord OAuth **email cím hozzáférést** kér alapértelmezetten
- A felhasználó neve és profilképe is elérhető lesz
- Az első bejelentkezésnél automatikusan létrejön a `user_roles` bejegyzés
- Az admin jog kézzel állítható be az adatbázisban vagy admin felületen

## 🔗 Hasznos linkek

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Supabase Discord Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-discord)
- [Discord OAuth2 Docs](https://discord.com/developers/docs/topics/oauth2)
