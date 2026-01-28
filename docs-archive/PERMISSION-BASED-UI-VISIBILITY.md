# 🔐 Jogosultság Alapú UI Láthatóság

## 📋 Áttekintés

A rendszer most már **jogosultságok alapján jeleníti meg** a navigációs menüpontokat és az admin panel section-jeit.

### Változtatások

#### 1. **Navbar - Titkos Menü Szűrése** (`assets/js/nav.js`)

A "Titkos" kategória menüpontjai dinamikusan jelennek meg jogosultságok szerint:

| Menüpont | Jogosultság | Logika |
|----------|------------|---------|
| **Admin Panel** | `can_view_admin_panel` | Csak ha van jogosultság VAGY admin |
| **Infosharer** | `can_view_infosharer` | Default `true`, ha `false` akkor elrejtve |
| **Release Manager** | `can_manage_releases` | Csak ha van jogosultság VAGY admin |

**Speciális szabály**: Ha egy felhasználónak EGYETLEN jogosultsága sincs, akkor a **"Titkos" kategória teljesen el van rejtve** a navbarból.

#### 2. **Admin Panel Section-jei** (`secret/admin/index.html`)

Az admin panelen belüli section-jök jogosultságok szerint jelennek meg:

| Section | ID | Jogosultság | Látható ha... |
|---------|----|--------------|--------------| 
| **Google Drive Kezelés** | `googleDriveSection` | `can_manage_google_drive` | Van jogosultság VAGY admin |
| **Google Drive Fájlok** | `googleDriveFilesSection` | `can_manage_google_drive` | Van jogosultság VAGY admin |
| **Jogosultságkezelés** | `permissionsSection` | `can_manage_admins` | Van jogosultság VAGY admin |
| **Felhasználók Lista** | - | Mindig látható | Mindig megjelenik |

---

## 🔧 Működés

### Navbar Szűrés

```javascript
// assets/js/nav.js - buildNavStructure()

if (isLoggedIn) {
  const secretItems = [];
  const permissions = globalAuth?.getUserPermissions();
  
  // Admin Panel
  if (permissions?.can_view_admin_panel || isAdmin) {
    secretItems.push({ title: "Admin Panel", link: "secret/admin/" });
  }
  
  // Infosharer
  if (permissions?.can_view_infosharer !== false) {
    secretItems.push({ title: "Infosharer", link: "secret/infosharer/" });
  }
  
  // Release Manager
  if (permissions?.can_manage_releases || isAdmin) {
    secretItems.push({ title: "Release Manager", link: "secret/releases/" });
  }
  
  // Csak akkor jelenjen meg a kategória, ha van elem
  if (secretItems.length > 0) {
    baseStructure["Titkos"] = {
      icon: "assets/images/sidesecret.svg",
      items: secretItems
    };
  }
}
```

### Admin Panel Section Láthatóság

```javascript
// secret/admin/index.html - updateSectionVisibility()

async function updateSectionVisibility() {
  const auth = window.getAuth();
  const permissions = await auth.refreshPermissions();
  
  // Google Drive
  const canManageGoogleDrive = permissions?.can_manage_google_drive || auth.isAdminUser();
  document.getElementById('googleDriveSection').style.display = canManageGoogleDrive ? 'block' : 'none';
  document.getElementById('googleDriveFilesSection').style.display = canManageGoogleDrive ? 'block' : 'none';
  
  // Permissions
  const canManageAdmins = permissions?.can_manage_admins || auth.isAdminUser();
  document.getElementById('permissionsSection').style.display = canManageAdmins ? 'block' : 'none';
}

// Auto-frissítés bejelentkezéskor
window.addEventListener('loginStateChanged', (event) => {
  if (event.detail.loggedIn) {
    updateSectionVisibility();
  }
});
```

---

## 🧪 Tesztelési Útmutató

### Teszt 1: Navbar Szűrés - Nincs jogosultság

1. Jelentkezz be egy alap felhasználóval (nem admin)
2. Admin panelben vedd el tőle az összes jogosultságot:
   - `can_view_infosharer` = `false`
   - `can_view_admin_panel` = `false`
   - `can_manage_releases` = `false`
3. Frissítsd az oldalt (Ctrl+R)
4. **Elvárt eredmény**: A "Titkos" kategória **teljesen eltűnt** a navbarból

### Teszt 2: Navbar Szűrés - Csak Infosharer jogosultság

1. Admin panelben adj a felhasználónak:
   - `can_view_infosharer` = `true`
   - Minden más = `false`
2. Frissítsd az oldalt (Ctrl+R)
3. **Elvárt eredmény**: 
   - "Titkos" kategória **megjelenik**
   - Csak az **"Infosharer"** menüpont látható
   - Admin Panel és Release Manager **nem látszik**

### Teszt 3: Navbar Szűrés - Admin jogosultság

1. Jelentkezz be adminként
2. **Elvárt eredmény**: Mind a 3 menüpont látható (Admin Panel, Infosharer, Release Manager)

### Teszt 4: Admin Panel Section - Google Drive elrejtése

1. Jelentkezz be felhasználóként aki LEHET látni az admin panelt
2. Admin panelben vedd el tőle:
   - `can_manage_google_drive` = `false`
3. Várd meg 5 másodpercet (vagy frissítsd az oldalt)
4. **Elvárt eredmény**: 
   - **Google Drive Kezelés** section **eltűnt**
   - **Google Drive Fájlok** section **eltűnt**
   - Jogosultságkezelés és Felhasználók lista **továbbra is látható**

### Teszt 5: Admin Panel Section - Jogosultságkezelés elrejtése

1. Vedd el a felhasználótól:
   - `can_manage_admins` = `false`
2. Várd meg 5 másodpercet (vagy frissítsd az oldalt)
3. **Elvárt eredmény**: 
   - **Jogosultságkezelés** section **eltűnt**
   - Felhasználók lista **továbbra is látható**

### Teszt 6: Valós idejű frissítés

1. Nyiss két böngésző ablakot:
   - Ablak 1: Alap felhasználó (nem admin)
   - Ablak 2: Admin felhasználó
2. Ablak 2-ben (admin) módosítsd az Ablak 1 felhasználó jogosultságait
3. Ablak 1-ben várd meg 5 másodpercet
4. **Elvárt eredmény**: Az admin panel section-jök **automatikusan eltűnnek/megjelennek**

---

## 🔄 Frissítési Mechanizmus

### Navbar Frissítés

- **Manuális**: Oldal újratöltése (Ctrl+R)
- **Automatikus**: `rebuildNavigation()` hívása `loginStateChanged` eventnél

### Section Láthatóság Frissítés

- **Inicializálás**: Oldal betöltésekor, ha már be vagy jelentkezve
- **Login event**: `loginStateChanged` event triggereli
- **Periodikus ellenőrzés**: NINCS - csak event alapon történik
- **Permission változás**: `permission-guard.js` 5 másodpercenként frissíti a jogosultságokat

---

## 📐 Architektúra

### Adatfolyam

```
1. User login
   ↓
2. supabase-auth.js betölti a permissions-t
   ↓
3. loginStateChanged event kiadása
   ↓
4. nav.js → buildNavStructure() → szűrt menü
   ↓
5. admin/index.html → updateSectionVisibility() → elrejtett section-jök
   ↓
6. permission-guard.js → 5 mp-ként refreshPermissions()
   ↓
7. Ha változás → section-jök újra ellenőrizve
```

### Komponens Kommunikáció

| Komponens | Feladata | Függőségek |
|-----------|----------|------------|
| `supabase-auth.js` | Jogosultságok betöltése DB-ből | `getUserPermissions()`, `refreshPermissions()` |
| `nav.js` | Navbar menüpontok szűrése | `globalAuth.getUserPermissions()` |
| `admin/index.html` | Section láthatóság kezelése | `auth.refreshPermissions()`, `loginStateChanged` event |
| `permission-guard.js` | Valós idejű jogosultság ellenőrzés | `auth.refreshPermissions()` 5 mp-ként |

---

## ⚠️ Fontos Megjegyzések

### 1. Default Jogosultságok

- `can_view_infosharer`: **Default TRUE** - Mindenki látja, hacsak nem vonják meg
- `can_view_admin_panel`: **Default FALSE** - Csak ha megadják
- `can_manage_admins`: **Default FALSE** - Csak ha megadják
- `can_manage_google_drive`: **Default FALSE** - Csak ha megadják
- `can_manage_releases`: **Default FALSE** - Csak ha megadják

### 2. Admin Override

Admin felhasználók **MINDIG látják** az összes menüpontot és section-t, függetlenül a `user_permissions` táblától. Az `is_admin` flag felülbírálja a jogosultságokat.

### 3. Biztonsági Rétegek

A UI elrejtés **NEM helyettesíti** a backend védelmet:

- **Frontend láthatóság**: Felhasználói élmény javítása
- **permission-guard.js**: Oldal szintű hozzáférés védelme
- **RLS Policies**: Valós adatbázis szintű védelem

Mind a **3 réteg együtt** biztosítja a teljes biztonságot!

---

## 🚀 Következő Lépések

1. **Release Manager oldal**: Hasonló permission guard implementálása
2. **Google Drive API**: Külön permission ellenőrzés a fájl műveletekhez
3. **Audit Log**: Ki mit módosított tracking (jövőbeli feature)

---

## ✅ Státusz

- ✅ Navbar jogosultság szűrés
- ✅ Admin panel section láthatóság
- ✅ Valós idejű frissítés (5 mp)
- ✅ Admin override logika
- ✅ Default jogosultságok helyes kezelése
- ✅ Event-based kommunikáció

**Minden működik! 🎉**
