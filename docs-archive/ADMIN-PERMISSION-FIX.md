# 🔧 Admin Jogosultság Fix

## ❌ Problémák

1. **Infosharer** - Admin jogosultság nem működik megfelelően
2. **Sidebar (nav.js)** - Secret menü megjelenik minden bejelentkezett usernek, nem csak adminoknak

## ✅ Javítások

### 1. Nav.js - Secret Menü Csak Adminoknak

**Probléma:** A Secret menü megjelent minden bejelentkezett usernek.

**Javítás:**

#### A) `getNavStructure` - Admin paraméter hozzáadása
```javascript
// ELŐTTE:
const getNavStructure = (isLoggedIn = false) => {
  // ...
  if (isLoggedIn) {  // ← Csak login ellenőrzés
    baseStructure["Titkos"] = { ... };
  }
}

// UTÁNA:
const getNavStructure = (isLoggedIn = false, isAdmin = false) => {
  // ...
  if (isLoggedIn && isAdmin) {  // ← Login ÉS admin ellenőrzés
    baseStructure["Titkos"] = { 
      icon: "assets/images/sidesecret.svg",
      items: [
        { title: "Infosharer", link: "secret/infosharer/" },
        { title: "Release Manager", link: "secret/releases/" },
        { title: "Admin Panel", link: "secret/admin/" }  // ← ÚJ
      ]
    };
  }
}
```

#### B) `checkLoginState` - Admin status visszaadása
```javascript
// ELŐTTE:
function checkLoginState() {
  if (globalAuth) {
    return globalAuth.isAuthenticated();  // ← Csak boolean
  }
  return false;
}

// UTÁNA:
function checkLoginState() {
  if (globalAuth) {
    return {
      isLoggedIn: globalAuth.isAuthenticated(),
      isAdmin: globalAuth.isAdminUser()  // ← Admin status is
    };
  }
  return { isLoggedIn: false, isAdmin: false };
}
```

#### C) Nav építés - Admin status használata
```javascript
// ELŐTTE:
const isLoggedIn = checkLoginState();
const navStructure = getNavStructure(isLoggedIn);

// UTÁNA:
const loginState = checkLoginState();
const navStructure = getNavStructure(loginState.isLoggedIn, loginState.isAdmin);
```

#### D) `rebuildNav()` - Nav újraépítés bejelentkezés után
```javascript
// ÚJ FÜGGVÉNY
window.rebuildNav = function() {
  // Nav teljes újraépítése
  // - Törli a régi menüket
  // - Újraépíti admin status alapján
  // - Automatikusan megnyitja a Titkos menüt
};
```

### 2. Infosharer.js - Admin Jogosultság Ellenőrzés

**Probléma:** Admin jogosultság nem töltődik be megfelelően bejelentkezés után.

**Javítás:**

#### A) Auth callback bővítése
```javascript
// ELŐTTE:
onSuccess: () => {
  if (globalAuth.isAdminUser()) {
    canEdit = true;
    // ...
  }
}

// UTÁNA:
onSuccess: async () => {
  console.log('🔐 Bejelentkezés sikeres!');
  
  // Várunk hogy a user_roles betöltődjön
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // User profile újratöltése
  await globalAuth.loadUserProfile(globalAuth.getCurrentUser());
  
  if (globalAuth.isAdminUser()) {
    console.log('✅ Admin jogosultság megvan!');
    canEdit = true;
    // ...
    
    // Nav frissítése
    if (window.rebuildNav) {
      window.rebuildNav();
    }
    
    setStatus('success', '✅ Admin jogosultság aktiválva!');
  } else {
    setStatus('error', '❌ Nincs admin jogosultságod!');
  }
}
```

### 3. Supabase-auth.js - Debug Logging

**Javítás:** Részletes logging az admin status betöltéshez

```javascript
async loadUserProfile(user) {
  console.log('🔄 Loading user profile for:', user.email);
  
  const { data, error } = await this.sb
    .from('user_roles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  console.log('User roles query result:', { data, error });

  if (data && !error) {
    this.isAdmin = data.is_admin === true;
    console.log('✅ Admin status from database:', this.isAdmin);
  } else {
    console.log('⚠️ Fallback to metadata');
    if (error) {
      console.error('❌ Error loading user_roles:', error);
    }
  }
  
  console.log('👤 User:', user.email, '| Admin:', this.isAdmin);
}
```

## 🧪 Tesztelés

### 1. User Roles Ellenőrzés (SQL)

```sql
-- Nézd meg ki admin
SELECT 
  u.email,
  ur.is_admin
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;
```

**Ha nincs admin user:**
```sql
-- Adj admin jogot
UPDATE user_roles 
SET is_admin = TRUE 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

### 2. Nav Teszt (Secret Menü)

#### A) Nem-Admin User:
```
1. Jelentkezz be (nem-admin)
2. Nézd a sidebar-t
3. Elvárt: ❌ NINCS "Titkos" menü
```

#### B) Admin User:
```
1. Jelentkezz be (admin)
2. Nézd a sidebar-t
3. Elvárt: ✅ VAN "Titkos" menü
   - Infosharer
   - Release Manager
   - Admin Panel
```

### 3. Infosharer Teszt

#### A) Nem-Admin User:
```
1. Menj: secret/infosharer/
2. Kattints: "Írás engedélyezése"
3. Jelentkezz be (nem-admin)
4. Elvárt: ❌ "Nincs jogosultságod szerkesztéshez!"
5. Szövegmező: ReadOnly marad
```

#### B) Admin User:
```
1. Menj: secret/infosharer/
2. Kattints: "Írás engedélyezése"
3. Jelentkezz be (admin)
4. Elvárt: ✅ "Admin jogosultság aktiválva!"
5. Szövegmező: Szerkeszthető
6. "Mentés" gomb: Aktív
7. Sidebar: "Titkos" menü megjelenik (rebuildNav miatt)
```

### 4. Browser Console Check

**F12 → Console:**
```javascript
// Admin status ellenőrzés
const auth = window.getAuth();
console.log('Authenticated:', auth.isAuthenticated());
console.log('Admin:', auth.isAdminUser());
console.log('User:', auth.getUserEmail());
```

**Elvárt kimenet (admin):**
```
Authenticated: true
Admin: true
User: your-email@example.com
```

**Elvárt kimenet (nem-admin):**
```
Authenticated: true
Admin: false
User: non-admin@example.com
```

## 🔍 Debug - Ha Nem Működik

### 1. User Roles Tábla Hiányzik

```sql
-- Ellenőrizd
SELECT * FROM user_roles;

-- Ha üres vagy hiba:
-- Futtasd le: supabase-migration.sql
```

### 2. Admin Flag Nincs Beállítva

```sql
-- Ellenőrizd
SELECT 
  u.email, 
  ur.is_admin 
FROM auth.users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
WHERE u.email = 'your-email@example.com';

-- Ha is_admin = false vagy NULL:
UPDATE user_roles 
SET is_admin = TRUE 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

### 3. Console Errors

**F12 → Console → Keress hibákat:**

```
❌ "relation user_roles does not exist"
→ Futtasd le: supabase-migration.sql

❌ "Permission denied for table user_roles"
→ RLS policy probléma, nézd: supabase-migration.sql

✅ "Loading user profile for: ..."
→ OK, user profile töltődik

✅ "Admin status from database: true"
→ OK, admin jog megvan

❌ "Admin status from database: false"
→ user_roles táblában is_admin = FALSE
```

### 4. Nav Nem Frissül

**Ha bejelentkezés után a nav nem frissül:**

```javascript
// Browser Console-ban:
window.rebuildNav();
// Ez manuálisan újraépíti a nav-ot
```

## 📊 Workflow

### Sikeres Admin Bejelentkezés:
```
1. User kattint: "Írás engedélyezése"
2. Auth modal megnyílik
3. User bejelentkezik
4. onSuccess callback fut:
   a. Vár 500ms (user_roles betöltés)
   b. loadUserProfile újratöltés
   c. isAdminUser() ellenőrzés
   ✅ d. Ha admin:
      - canEdit = true
      - UI frissítés
      - window.rebuildNav() ← Nav frissül!
      - Success üzenet
   ❌ e. Ha NEM admin:
      - Error üzenet
      - ReadOnly marad
```

### Nav Építés:
```
1. Oldal betöltődik
2. checkLoginState() fut
   → { isLoggedIn: true/false, isAdmin: true/false }
3. getNavStructure(isLoggedIn, isAdmin) fut
   ✅ Ha isLoggedIn && isAdmin:
      → "Titkos" menü hozzáadva
   ❌ Ha !isLoggedIn || !isAdmin:
      → "Titkos" menü NEM jelenik meg
4. Nav renderelés
```

## 📁 Módosított Fájlok

- ✅ `assets/js/nav.js` - Admin ellenőrzés, rebuildNav()
- ✅ `assets/js/infosharer.js` - Admin callback javítás, rebuildNav hívás
- ✅ `assets/js/supabase-auth.js` - Debug logging loadUserProfile-ban

## ✅ Ellenőrző Checklist

- [ ] user_roles tábla létezik (SQL ellenőrzés)
- [ ] Van legalább 1 admin user (is_admin = TRUE)
- [ ] Nem-admin user bejelentkezik → Nincs "Titkos" menü
- [ ] Admin user bejelentkezik → Van "Titkos" menü
- [ ] Infosharer: Nem-admin → ReadOnly marad
- [ ] Infosharer: Admin → Szerkeszthető lesz
- [ ] Console: Nincs error üzenet
- [ ] Console: "Admin status from database: true" (admin usernek)

---

**Javítva:** 2026-01-07  
**Verzió:** 3.0  
**Készítő:** GitHub Copilot 🤖

