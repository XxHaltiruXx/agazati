# 🔧 Session Persistence & User Roles Fix

## ❌ Problémák

1. **Session nem marad meg refresh után** - Oldal frissítéskor kijelentkezel
2. **User roles táblába nem kerülnek be az adatok** - Database-ben nincs user_role rekord

## ✅ Javítások

### 1. Session Persistence (KÉSZ!)

#### Mit javítottam:

**A) `assets/js/supabase-auth.js`**
```javascript
// ELŐTTE: Nincs session persistence
supabaseClient = supabase.createClient(URL, KEY);

// UTÁNA: Session persistence beállítva
supabaseClient = supabase.createClient(URL, KEY, {
  auth: {
    persistSession: true,        // ← Session megőrzése localStorage-ban
    autoRefreshToken: true,       // ← Token automatikus frissítése
    detectSessionInUrl: true,     // ← Session felismerése URL-ben
    storage: window.localStorage  // ← Explicit localStorage használata
  }
});
```

**B) `test-auth.html`** - Ugyanez
**C) `auth-callback.html`** - Ugyanez

#### Mit csinál ez?
- ✅ **localStorage-ban tárolja a session-t** - Refresh után is be vagy jelentkezve
- ✅ **Token automatikusan frissül** - Nem jársz le
- ✅ **OAuth redirect-et felismeri** - Google/GitHub login működik

### 2. User Roles Tábla Probléma (TESZTELENDŐ!)

#### Lehetséges Okok:

**A) Trigger nem fut le**
- A `on_auth_user_created` trigger nem működik
- Megoldás: Trigger újra létrehozása

**B) RLS Policy blokkolja**
- A Row Level Security policy nem engedi a beszúrást
- Megoldás: Policy javítása

**C) Tábla nem létezik**
- A `user_roles` tábla nincs létrehozva
- Megoldás: Migration futtatása

#### Diagnosztizálás:

**1. Futtasd le ezt a Supabase SQL Editor-ban:**

```sql
-- Ellenőrizd hogy létezik-e a tábla
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
) AS user_roles_table_exists;
```

**Eredmény:**
- ✅ `true` - Tábla létezik
- ❌ `false` - Tábla NEM létezik → Futtasd le a `supabase-migration.sql` fájlt!

**2. Nézd meg a user-eket és role-okat:**

```sql
-- Hány user van?
SELECT COUNT(*) FROM auth.users;

-- Hány role van?
SELECT COUNT(*) FROM user_roles;

-- User-ek és role-ok együtt
SELECT 
  u.email,
  ur.is_admin,
  ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;
```

**Eredmény:**
- Ha `LEFT JOIN` üres role-okat mutat → Trigger nem működik!

**3. Ellenőrizd a trigger-t:**

```sql
-- Trigger létezik?
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Function létezik?
SELECT * FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

#### Gyors Fix:

**Ha a trigger nem működik, futtasd le ezt:**

```sql
-- 1. Töröld a régi trigger-t és function-t
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Hozd létre újra a function-t
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, is_admin)
  VALUES (NEW.id, FALSE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Hozd létre újra a trigger-t
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- 4. Manual fix a meglévő user-eknek
INSERT INTO user_roles (user_id, is_admin)
SELECT id, FALSE 
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;
```

**Ez után minden meglévő user-nek lesz user_role rekordja!**

#### Manual Fix Egy User-nek:

Ha csak egy konkrét user-nek szeretnél role-t adni:

```sql
-- Cseréld le az email címet!
INSERT INTO user_roles (user_id, is_admin)
SELECT id, FALSE 
FROM auth.users 
WHERE email = 'bankutim13@ganziskola.hu'
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
```

## 🧪 Tesztelés

### 1. Session Persistence Teszt

**Lépések:**
1. Frissítsd az oldalt (Ctrl+R vagy F5)
2. Menj a test-auth.html oldalra
3. Kattints: **"👤 Session Ellenőrzése"**

**Elvárt eredmény:**
```
✅ Van aktív session!
User: bankutim13@ganziskola.hu
```

**Ha NEM ez jelenik meg:**
- Töröld a localStorage-t: DevTools → Application → Local Storage → Clear
- Jelentkezz be újra
- Próbáld újra

### 2. User Roles Teszt

**Lépések:**
1. Menj a test-auth.html oldalra
2. Kattints: **"👑 User Roles Tábla"**

**Elvárt eredmény:**
```
✅ User roles tábla OK!
Talált rekordok: 1 (vagy több)
[
  {
    "user_id": "...",
    "is_admin": false,
    "created_at": "..."
  }
]
```

**Ha ÜRES:**
1. Futtasd le a `supabase-debug-user-roles.sql` fájl tartalmát
2. Ellenőrizd a trigger-t
3. Manual fix-szel adj hozzá role-okat
4. Próbáld újra

### 3. Teljes Flow Teszt

**Lépések:**
1. **Bejelentkezés:**
   - test-auth.html → "🔑 Bejelentkezés Teszt"
   - Email: `bankutim13@ganziskola.hu`
   - Jelszó: `Test1234`

2. **Session Check:**
   - "👤 Session Ellenőrzése" → ✅ Van session

3. **User Roles Check:**
   - "👑 User Roles Tábla" → ✅ Van role rekord

4. **Refresh Test:**
   - **F5 (Refresh)**
   - "👤 Session Ellenőrzése" → ✅ **TOVÁBBRA IS van session!**

5. **User Info Check:**
   - "📧 User Info" → ✅ Email megerősítve

**Ha minden ✅ akkor minden működik!**

## 📊 LocalStorage Ellenőrzés

**Browser DevTools (F12):**
```
1. Application tab
2. Storage → Local Storage → http://127.0.0.1:5500 (vagy a te URL-ed)
3. Keresd ezeket:

   sb-ccpuoqrbmldunshaxpes-auth-token
   ↑ Ez tárolja a session-t!
```

**Ha ezt látod:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "...",
  "expires_at": 1736...,
  "user": {
    "id": "...",
    "email": "bankutim13@ganziskola.hu"
  }
}
```

**✅ Session persistence működik!**

## 🎯 Összefoglalás

### Mit Javítottam:
1. ✅ **Session persistence** - Hozzáadtam mindhárom fájlhoz
2. ✅ **Debug SQL script** - `supabase-debug-user-roles.sql`

### Mit NEKED Kell Csinálnod:
1. **Frissítsd az oldalt** (session persistence most már működik)
2. **Futtasd le a debug SQL-t** a Supabase Dashboard-on
3. **Ellenőrizd a trigger-t** és a role-okat
4. **Ha kell, manual fix** a meglévő user-eknek

### Gyors Checklist:
- [ ] Oldal frissítve (F5)
- [ ] test-auth.html megnyitva
- [ ] "👤 Session Ellenőrzése" → ✅ Van session
- [ ] "👑 User Roles Tábla" → ✅ Van role
- [ ] F5 → Session megmaradt ✅

## 🆘 Ha Még Mindig Nem Működik

### Session Persistence:
```javascript
// Browser Console-ban futtasd le:
console.log(localStorage.getItem('sb-ccpuoqrbmldunshaxpes-auth-token'));

// Ha null → Session nincs tárolva
// Ha JSON → Session OK!
```

### User Roles:
```sql
-- SQL Editor-ban:
SELECT * FROM user_roles;

-- Ha üres → Futtasd a manual fix-et
-- Ha van adat → OK!
```

## 📁 Új Fájlok

- ✅ `supabase-debug-user-roles.sql` - SQL debug script

## 📁 Módosított Fájlok

- ✅ `assets/js/supabase-auth.js` - Session persistence
- ✅ `test-auth.html` - Session persistence
- ✅ `auth-callback.html` - Session persistence

---

**Javítva:** 2026-01-07  
**Verzió:** 2.1  
**Készítő:** GitHub Copilot 🤖

