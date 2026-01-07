# Supabase Authentication Integráció

## Áttekintés

Ez a projekt Supabase alapú authentikációt használ regisztrációval, bejelentkezéssel és admin role kezeléssel.

## 🚀 Gyors Kezdés

### 1. Supabase Projekt Beállítása

1. Menj a [Supabase Dashboard](https://app.supabase.com)-ra
2. Lépj be a projektedbe
3. Futtasd le a `supabase-migration.sql` fájl tartalmát az SQL Editor-ban
4. Ez létrehozza a `user_roles` táblát és a szükséges policy-ket

### 2. Első Admin Felhasználó Létrehozása

Miután regisztráltál az első felhasználóval, állítsd be admin-nak:

```sql
UPDATE user_roles 
SET is_admin = TRUE 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

Ezt az SQL Editor-ban futtathatod le a Supabase Dashboard-on.

## 📁 Fájlok

### Új Fájlok

- `assets/js/supabase-auth.js` - Supabase auth modul (regisztráció, bejelentkezés, admin kezelés)
- `assets/components/auth-modal.html` - Frissített auth modal (regisztráció + bejelentkezés)
- `assets/css/auth-modal.css` - Frissített modal stílusok
- `auth-callback.html` - OAuth redirect callback oldal
- `secret/admin/index.html` - Admin kezelő felület
- `supabase-migration.sql` - Adatbázis migráció

### Frissített Fájlok

- `secret/releases/index.html` - Supabase auth használat
- `secret/infosharer/index.html` - Supabase auth használat
- `assets/js/infosharer.js` - Supabase auth integráció

## 🔐 Authentikáció

### Bejelentkezési Módok

1. **Email + Jelszó** - Hagyományos regisztráció és bejelentkezés
2. **Google OAuth** - Google fiókkal történő bejelentkezés
3. **GitHub OAuth** - GitHub fiókkal történő bejelentkezés

### Jelszó Követelmények

- Minimum 6 karakter hosszú

### Jelszó Visszaállítás

A "Elfelejtetted a jelszavad?" link használatával.

## 👑 Admin Role Kezelés

### Admin Jogok

Admin felhasználók:
- Hozzáférhetnek a `secret/` alatti admin oldalakhoz
- Szerkeszthetik az Infosharer tartalmat
- Kezelhetik a GitHub Releases-t
- Admin jogot adhatnak más felhasználóknak

### Admin Felhasználó Hozzáadása

1. Lépj be admin fiókkal
2. Menj a `secret/admin/index.html` oldalra
3. Kattints a "✅ Admin hozzáadása" gombra a kívánt felhasználónál

### Admin Eltávolítása

1. Lépj be admin fiókkal
2. Menj a `secret/admin/index.html` oldalra
3. Kattints a "❌ Admin eltávolítása" gombra

**Megjegyzés:** Saját magadat nem tudod admin-ból eltávolítani.

## 🗄️ Adatbázis Struktúra

### `user_roles` Tábla

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Row Level Security (RLS)

- Minden felhasználó láthatja a saját role-ját
- Admin felhasználók láthatnak és módosíthatnak minden rekordot
- Új felhasználók automatikusan kapnak egy `is_admin = FALSE` rekordot

## 🔧 Konfiguráció

### Supabase Credentials

A credentials a következő fájlokban vannak:

- `assets/js/supabase-auth.js` - Auth Supabase projekt
- `assets/js/infosharer.js` - Infosharer Supabase projekt (külön)
- `auth-callback.html` - Callback URL

### Redirect URL Beállítása

Supabase Dashboard > Authentication > URL Configuration:

```
Site URL: https://xxhaltiruxx.github.io/agazati
Redirect URLs: https://xxhaltiruxx.github.io/agazati/auth-callback.html
```

## 📱 OAuth Providers Engedélyezése

### Google OAuth

1. Supabase Dashboard > Authentication > Providers > Google
2. Engedélyezd a Google provider-t
3. Add meg a Google OAuth Client ID-t és Secret-et

### GitHub OAuth

1. Supabase Dashboard > Authentication > Providers > GitHub
2. Engedélyezd a GitHub provider-t
3. Add meg a GitHub OAuth Client ID-t és Secret-et

## 🧪 Tesztelés

### Regisztráció Tesztelése

1. Nyisd meg bármelyik secret oldalt (pl. `secret/releases/`)
2. Kattints a "Bejelentkezés" gombra
3. Válaszd a "Regisztráció" tabot
4. Regisztrálj egy új fiókkal
5. Ellenőrizd az email fiókodat a megerősítő linkért

### Bejelentkezés Tesztelése

1. Nyisd meg bármelyik secret oldalt
2. Kattints a "Bejelentkezés" gombra
3. Jelentkezz be email + jelszó vagy OAuth-tal

### Admin Tesztelése

1. Állíts be egy felhasználót admin-nak az SQL Editor-ban
2. Jelentkezz be
3. Ellenőrizd hogy hozzáférsz az admin oldalakhoz
4. Próbáld meg módosítani más felhasználók jogosultságait

## 🐛 Hibakeresés

### "Unauthorized" Hiba

- Ellenőrizd hogy a felhasználó admin-e
- Ellenőrizd az RLS policy-ket a Supabase Dashboard-on

### OAuth Nem Működik

- Ellenőrizd a Redirect URL-t
- Ellenőrizd az OAuth provider beállításokat
- Nézd meg a browser konzolt

### Email Nem Érkezik Meg

- Ellenőrizd a spam mappát
- Ellenőrizd az email template-eket a Supabase Dashboard-on
- Ellenőrizd az email provider beállításokat

## 🔄 Migráció Régi Rendszerről

A régi jelszó alapú auth rendszer még elérhető a `assets/js/auth.js` fájlban backward compatibility céljából. Az új oldalak mind a Supabase auth-ot használják.

## 📚 További Információk

- [Supabase Auth Dokumentáció](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth Providers](https://supabase.com/docs/guides/auth/social-login)

## 📝 Changelog

### 2026-01-07
- ✅ Supabase auth integráció
- ✅ Regisztráció és bejelentkezés
- ✅ OAuth support (Google, GitHub)
- ✅ Admin role kezelés
- ✅ User roles tábla és RLS
- ✅ Admin manager felület
- ✅ Jelszó visszaállítás
- ✅ Auth callback oldal

---

Made with ❤️ for Agazati
