# 🐛 PERMISSION RENDSZER DEBUG ÚTMUTATÓ

## 📋 Gyors Tesztelés

### 1. Konzolban ellenőrzés

Nyisd meg a böngésző konzolt (F12) és futtasd ezeket a parancsokat:

```javascript
// Aktuális felhasználó
const auth = window.getAuth();
const user = auth.getCurrentUser();
console.log('👤 User:', user);

// Cached permissions
const permissions = auth.getUserPermissions();
console.log('📦 Cached permissions:', permissions);

// Friss permissions az adatbázisból
const freshPermissions = await auth.refreshPermissions();
console.log('🔄 Fresh permissions:', freshPermissions);

// Navbar újraépítése
await window.rebuildNavigation();

// Section láthatóság frissítése
if (window.updateSectionVisibility) {
  await window.updateSectionVisibility();
}
```

### 2. Ellenőrzési lista

✅ **Permissions tábla az adatbázisban**
```sql
SELECT 
  au.email,
  up.can_view_infosharer,
  up.can_view_admin_panel,
  up.can_manage_admins,
  up.can_manage_google_drive,
  up.can_manage_releases
FROM auth.users au
LEFT JOIN user_permissions up ON up.user_id = au.id
ORDER BY au.email;
```

✅ **Frontend state**
- Nézd meg a console log-okat
- Keress "🔍 Permissions:" üzenetet
- Keress "🔍 Nav permissions:" üzenetet
- Keress "✅ Section láthatóság frissítve" üzenetet

---

## 🔧 Gyakori Problémák

### Probléma 1: "Nincs jogom, de látom a section-t"

**Ok:** Cached permissions, vagy logika hibás

**Megoldás:**
```javascript
// 1. Frissítsd a permissions-t
await auth.refreshPermissions();

// 2. Frissítsd a section láthatóságot
await window.updateSectionVisibility();

// 3. Ellenőrizd a logikát
const permissions = auth.getUserPermissions();
console.log('Google Drive jog:', permissions?.can_manage_google_drive === true);
console.log('Admin kezelés jog:', permissions?.can_manage_admins === true);
```

### Probléma 2: "Van jogom, de nem látom a navbar menüpontot"

**Ok:** Navbar nem frissült, vagy permissions cache-elve van

**Megoldás:**
```javascript
// 1. Frissítsd a permissions-t
await auth.refreshPermissions();

// 2. Építsd újra a navbar-t
await window.rebuildNavigation();

// 3. Ellenőrizd
const permissions = auth.getUserPermissions();
console.log('Admin Panel jog:', permissions?.can_view_admin_panel === true);
console.log('Release Manager jog:', permissions?.can_manage_releases === true);
```

### Probléma 3: "Módosítottam a jogot, de nem frissült"

**Ok:** A változás még nem propagálódott

**Megoldás:**
```javascript
// Várj 1 másodpercet, majd:
await auth.refreshPermissions();
await window.updateSectionVisibility();
await window.rebuildNavigation();
```

---

## 🎯 Tesztelési Forgatókönyvek

### Teszt 1: Google Drive jogosultság elvétele

```
1. Admin panelben vedd el a `can_manage_google_drive` jogot valakitől
2. Várj 5 másodpercet VAGY frissítsd manuálisan:
   await window.updateSectionVisibility()
3. Ellenőrizd:
   - Google Drive Kezelés section eltűnik
   - Google Drive Fájlok section eltűnik
```

### Teszt 2: Admin Panel jogosultság elvétele

```
1. Admin panelben vedd el a `can_view_admin_panel` jogot valakitől
2. Az a user jelentkezzen be
3. Ellenőrizd:
   - Navbar-ban nincs "Admin Panel" menüpont
   - Ha megpróbálja elérni a linket: átirányítás a főoldalra
```

### Teszt 3: Saját jog módosítás tiltása

```
1. Admin panelben keresd meg a saját sorodat
2. Ellenőrizd:
   - Checkboxok helyett "-" jelenik meg
   - Kék háttér és "Te" badge
3. Konzolban próbáld:
   const myId = auth.getCurrentUser().id;
   await updatePermission(myId, 'can_view_admin_panel', false);
4. Elvárt: Error: "Nem módosíthatod a saját jogaidat!"
```

---

## 📊 Logika Ellenőrzés

### Navbar logika (`assets/js/nav.js`)

```javascript
// Admin Panel menüpont
if (permissions?.can_view_admin_panel === true) {
  // Megjelenik
}

// Infosharer menüpont
if (permissions?.can_view_infosharer !== false) {
  // Megjelenik (default: true)
}

// Release Manager menüpont
if (permissions?.can_manage_releases === true) {
  // Megjelenik
}
```

### Section láthatóság logika (`secret/admin/index.html`)

```javascript
// Google Drive sections
const canManageGoogleDrive = permissions?.can_manage_google_drive === true;
googleDriveSection.style.display = canManageGoogleDrive ? 'block' : 'none';

// Permissions section
const canManageAdmins = permissions?.can_manage_admins === true;
permissionsSection.style.display = canManageAdmins ? 'block' : 'none';
```

---

## 🔄 Frissítési Mechanizmusok

### Automatikus frissítés

1. **loginStateChanged event** → navbar + section frissítés
2. **5 másodperces interval** → section frissítés (admin panel)
3. **5 másodperces interval** → permission ellenőrzés (permission-guard.js)

### Manuális frissítés

```javascript
// Teljes permission refresh
await auth.refreshPermissions();
await window.updateSectionVisibility();
await window.rebuildNavigation();
```

---

## ✅ Ellenőrzési Checklist

Amikor módosítasz egy jogosultságot:

- [ ] Adatbázisban frissült? (SQL query)
- [ ] `refreshPermissions()` meghívódott?
- [ ] Console log mutatja az új értéket?
- [ ] Navbar frissült? (menüpont megjelent/eltűnt)
- [ ] Section frissült? (elrejtve/megjelenítve)
- [ ] 5 másodperc alatt automatikusan frissül?

---

## 🚨 Sürgős Fix

Ha semmi sem működik:

```javascript
// 1. Hard refresh
location.reload(true);

// 2. Cache törlés
localStorage.clear();
sessionStorage.clear();

// 3. Újra bejelentkezés
await auth.signOut();
// Jelentkezz be újra

// 4. SQL ellenőrzés
-- Futtasd le a Supabase Dashboard-on:
SELECT * FROM user_permissions WHERE user_id = 'YOUR_USER_ID';
```

---

## 📞 Debug Script

Másold be a konzolba ezt a scriptet teljes diagnózishoz:

```javascript
(async function debugPermissions() {
  console.log('🔍 === PERMISSION DEBUG ===');
  
  const auth = window.getAuth();
  if (!auth) {
    console.error('❌ Auth nem található!');
    return;
  }
  
  const user = auth.getCurrentUser();
  console.log('👤 User:', user);
  
  const cachedPerms = auth.getUserPermissions();
  console.log('📦 Cached permissions:', cachedPerms);
  
  const freshPerms = await auth.refreshPermissions();
  console.log('🔄 Fresh permissions:', freshPerms);
  
  console.log('\n🔐 Jogosultság ellenőrzés:');
  console.log('  - can_view_infosharer:', freshPerms?.can_view_infosharer);
  console.log('  - can_view_admin_panel:', freshPerms?.can_view_admin_panel);
  console.log('  - can_manage_admins:', freshPerms?.can_manage_admins);
  console.log('  - can_manage_google_drive:', freshPerms?.can_manage_google_drive);
  console.log('  - can_manage_releases:', freshPerms?.can_manage_releases);
  
  console.log('\n🎯 Section láthatóság:');
  const googleDriveSection = document.getElementById('googleDriveSection');
  const permissionsSection = document.getElementById('permissionsSection');
  
  if (googleDriveSection) {
    console.log('  - Google Drive section:', googleDriveSection.style.display);
  }
  if (permissionsSection) {
    console.log('  - Permissions section:', permissionsSection.style.display);
  }
  
  console.log('\n🔄 UI frissítés...');
  if (window.updateSectionVisibility) {
    await window.updateSectionVisibility();
  }
  await window.rebuildNavigation();
  
  console.log('✅ Debug kész!');
})();
```

---

**Ha továbbra is problémák vannak, küldd el a console log-okat!** 📋
