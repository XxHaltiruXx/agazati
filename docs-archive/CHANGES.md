# Fejlesztési Napló és Változtatások

Ez a dokumentum tartalmazza a projekt fejlesztési folyamatát, technikai döntéseket és végrehajtott változtatásokat.

---

## Verzió 1.5.0 - Admin Fejlesztések (2026.01.07)

### Új funkciók
- **Supabase Dashboard Link**: Admin felhasználók számára megjelenik a Supabase projekt link a footer kapcsolatok között
- **Release Manager UI Fejlesztés**: Custom verzió input mező és gomb elrendezésének javítása

### Technikai változások
- Footer.js: `checkAdminAndShowSupabaseLink()` függvény bevezetése admin jogosultság ellenőrzésre
- Release Manager: Grid layout és flexbox optimalizálás
- Admin-only funkciók elkülönítése a sima felhasználói élménytől

---

## Supabase Auth Rendszer

### Bejelentkezési rendszer átállítása
- Átállás Firebase-ről Supabase-re
- OAuth integráció: Google és GitHub bejelentkezés
- Email/jelszó alapú autentikáció
- Jelszó-visszaállítási funkció

### Session kezelés
- Globális auth inicializálás minden oldalon (nav.js)
- localStorage alapú session persistence
- Automatikus session újratöltés oldalbetöltéskor
- Logout funkció hibakezelés fejlesztése

### Admin jogosultságok
- User metadata alapú admin jogosultság kezelés
- `is_admin` metadata mező használata
- Admin panel hozzáférés-vezérlés
- RLS policies metadata alapú ellenőrzéssel

---

## Adatbázis Struktúra

### user_roles tábla
```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### profiles tábla
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies
- `user_roles` tábla: Metadata alapú admin ellenőrzés
- `profiles` tábla: Publikus olvasás, admin írás
- Rekurzió elkerülése: `security_invoker = true` használata

---

## OAuth Konfiguráció

### Google OAuth
1. Google Cloud Console: OAuth 2.0 Client ID létrehozása
2. Authorized redirect URIs: `https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback`
3. Supabase Dashboard: Google provider engedélyezése
4. Client ID és Secret beállítása

### GitHub OAuth
1. GitHub Settings → Developer settings → OAuth Apps
2. Authorization callback URL: `https://ccpuoqrbmldunshaxpes.supabase.co/auth/v1/callback`
3. Supabase Dashboard: GitHub provider engedélyezése
4. Client ID és Secret beállítása

---

## Jelszó-visszaállítás

### Implementáció
- Email alapú reset link küldés
- `auth-callback.html` kezelése: `type=recovery` detektálás
- Manuális password update form megjelenítése
- Token alapú session inicializálás

### Problémák és megoldások
- **Probléma**: Reset link automatikusan bejelentkezteti a felhasználót
- **Megoldás**: `detectSessionInUrl` feltételes beállítása, `type=recovery` esetén false

---

## Admin Panel Fejlesztések

### User Management
- Felhasználók listázása email alapján (profiles táblából)
- Admin jogosultság módosítás
- User metadata kezelés RPC függvénnyel

### Problémák és megoldások
- **Probléma**: "Ismeretlen" felhasználónevek - admin API nem elérhető client-side
- **Megoldás**: `profiles` tábla létrehozása publikus email tárolásra

- **Probléma**: Admin módosítás duplicate key error
- **Megoldás**: `upsert()` helyett `update().eq('user_id')` használata

---

## Release Manager

### Funkciók
- GitHub Releases API integráció
- Automatikus verzió ellenőrzés (24 óránként)
- Semantic Versioning (MAJOR.MINOR.PATCH)
- Verzió értesítések felhasználóknak
- Admin verzió kezelő felület

### UI Komponensek
- Verzió információ kártyák
- Gyors verzió gombok (PATCH, MINOR, MAJOR)
- Custom verzió input
- GitHub release link generálás

---

## Frontend Fejlesztések

### Navigáció
- Globális auth betöltés nav.js-ben
- Search input autocomplete kikapcsolása
- Responsive sidenav működés

### Footer
- Commit tracking és verzió megjelenítés
- Conditional link rendering admin felhasználóknak
- Social links (GitHub, Trello, Email)
- Supabase Dashboard link (admin only)

### Auth Modal
- OAuth gombok bejelentkezéshez és regisztrációhoz
- Jelszó megjelenítés/elrejtés toggle
- Elfelejtett jelszó funkció
- Form validáció

---

## Biztonság

### RLS Policies
- Row Level Security minden táblára
- Admin ellenőrzés metadata alapján
- Publikus hozzáférés korlátozása

### Session kezelés
- HTTP-only cookie használata
- Automatikus token refresh
- Secure session storage

### OAuth
- Redirect URI validáció
- State parameter használata CSRF elleni védelemhez
- Token biztonságos tárolása

---

## Teljesítmény Optimalizálás

### Caching
- localStorage verzió cache (24 óra)
- Commit date cache (4 óra)
- API hívások minimalizálása

### Lazy Loading
- Auth komponensek dinamikus betöltése
- Conditional feature loading admin jogosultság alapján

---

## Hibajavítások

### Auth problémák
- ✅ Session persistence oldalbetöltéskor
- ✅ Logout 403 Forbidden error
- ✅ OAuth redirect loop
- ✅ Password reset form megjelenítés

### UI/UX javítások
- ✅ Release Manager custom verzió layout
- ✅ Admin panel user display
- ✅ Footer responsive működés
- ✅ Search autocomplete kikapcsolás

### Adatbázis
- ✅ RLS infinite recursion fix
- ✅ Duplicate key error admin módosításnál
- ✅ Profiles tábla szinkronizálás

---

## Technológiai Stack

### Backend
- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security (RLS)
- PostgreSQL Functions & Triggers

### Frontend
- Vanilla JavaScript (ES6+)
- Bootstrap 5.3.3
- Custom CSS (CSS Variables)

### API Integráció
- Supabase JavaScript Client v2
- GitHub REST API
- OAuth 2.0 providers

---

## Fejlesztői Jegyzetek

### SQL Scripts futtatása
1. Profiles tábla létrehozása
2. User roles tábla konfigurálása
3. RLS policies beállítása
4. Admin metadata RPC függvény létrehozása

### OAuth konfigurálás
1. Google Cloud Console setup
2. GitHub OAuth App létrehozás
3. Supabase Dashboard provider engedélyezés
4. Redirect URI-k ellenőrzése

### Tesztelés
- Auth flow tesztelés (login, logout, reset)
- Admin funkciók tesztelése
- OAuth provider tesztelés
- Release notification tesztelés

---

## Következő Lépések

### Tervezett funkciók
- User profile szerkesztés
- Avatar feltöltés
- Activity log admin panelbe
- Email értesítések testreszabása

### Optimalizálás
- Képek lazy loading
- Service Worker cache
- PWA támogatás
- Dark mode továbbfejlesztés

---

## Kapcsolat és Support

- **GitHub Repository**: https://github.com/XxHaltiruXx/agazati
- **Issues**: https://github.com/XxHaltiruXx/agazati/issues
- **Email**: agazati.info@gmail.com
- **Trello Board**: https://trello.com/b/p69OnOBH/ágazati

---

*Utolsó frissítés: 2026.01.07*
