# Felhasználói Jogosultságkezelő Rendszer

## Áttekintés

Az új jogosultságkezelő rendszer teljes kontrollt biztosít minden felhasználó számára elérhető funkciók felett.

## Funkciók

### 1. Admin Panel - Jogosultságkezelés

**Elérés:** `secret/admin/index.html`

Az admin panel új "Jogosultságkezelés" szekciója lehetővé teszi:
- Minden felhasználó jogosultságainak megtekintését
- 5 különböző jogosultság típus módosítását checkboxokkal
- Valós idejű frissítést az adatbázisban

**Jogosultság típusok:**
1. **Infosharer** (`can_view_infosharer`)
   - Infosharer oldal elérése
   - Alapértelmezett: `true`

2. **Admin Panel** (`can_view_admin_panel`)
   - Admin panel elérése
   - Alapértelmezett: `false`

3. **Admin Kezelés** (`can_manage_admins`)
   - Más felhasználók admin jogainak kezelése
   - Alapértelmezett: `false`

4. **Google Drive** (`can_manage_google_drive`)
   - Google Drive fájlok kezelése
   - Alapértelmezett: `false`

5. **Releases** (`can_manage_releases`)
   - Release-ek kezelése
   - Alapértelmezett: `false`

**Biztonsági funkciók:**
- Saját jogosultságaidat NEM módosíthatod (disabled checkbox)
- Saját sorod ki van emelve lila háttérrel
- A módosítások azonnal mentődnek az adatbázisba

### 2. Mások Szövegdobozai Böngésző

**Elérés:** `secret/infosharer/index.html` > "Mások szövegdobozai" gomb

Új funkció az Infoshareren:
- Megtekintheted más felhasználók privát szövegdobozait
- Kereshetsz email vagy szöveg alapján
- Másolhatod bármelyik felhasználó szövegét
- Csak olvasható nézet (nem szerkeszthető)

**Funkciók:**
- Keresés: Email vagy szöveg alapján szűrhető
- Másolás: Egy kattintással a vágólapra
- Időbélyeg: Láthatod, mikor frissítette utoljára a felhasználó
- Preview: Az első 150 karakter megjelenik

## Használat

### Jogosultságok Módosítása

1. Lépj be az admin panelbe
2. Görgess a "Jogosultságkezelés" szekcióhoz
3. Kattints a checkboxokra a jogosultságok be/kikapcsolásához
4. A módosítások automatikusan mentődnek

### Mások Szövegdobozainak Böngészése

1. Lépj be az Infosharerre
2. Kattints a "Mások szövegdobozai" gombra
3. Keress email vagy szöveg alapján
4. Kattints a "Másolás" gombra a szöveg másolásához

## Technikai Részletek

### Adatbázis

**Tábla:** `user_permissions`
- `user_id` (UUID, PRIMARY KEY)
- `can_view_infosharer` (BOOLEAN, DEFAULT true)
- `can_view_admin_panel` (BOOLEAN, DEFAULT false)
- `can_manage_admins` (BOOLEAN, DEFAULT false)
- `can_manage_google_drive` (BOOLEAN, DEFAULT false)
- `can_manage_releases` (BOOLEAN, DEFAULT false)

**RLS Policies:**
- Minden felhasználó olvashatja a saját jogosultságait
- Csak admin felhasználók módosíthatják bárki jogosultságait

### JavaScript Modulok

**Admin Panel:**
- `loadPermissions()` - Jogosultságok betöltése
- `updatePermission(userId, key, value)` - Jogosultság módosítása
- `renderPermissionCheckbox()` - Checkbox HTML generálása

**Infosharer:**
- `openBrowseOthersModal()` - Modal megnyitása
- `loadOthersTexts()` - Szövegdobozok betöltése
- `filterOthersTexts()` - Keresés szűrő
- `copyOthersText(userId)` - Szöveg másolása

## Fájlok

### Új/Módosított Fájlok

1. **secret/admin/index.html**
   - Új "Jogosultságkezelés" szekció
   - Jogosultságkezelő JavaScript kód

2. **secret/infosharer/index.html**
   - "Mások szövegdobozai" gomb
   - Browse modal HTML

3. **assets/js/infosharer.js**
   - `openBrowseOthersModal()` függvény
   - `loadOthersTexts()` függvény
   - Keresés és másolás funkciók

4. **database/user-permissions-table.sql**
   - `user_permissions` tábla létrehozása
   - RLS policies

5. **assets/js/supabase-auth.js**
   - `getUserPermissions()` getter
   - `canViewInfosharer()` getter
   - `canViewAdminPanel()` getter
   - `canManageAdmins()` getter
   - `canManageGoogleDrive()` getter
   - `canManageReleases()` getter

## Példák

### Jogosultság Lekérése

```javascript
const auth = window.getAuth();
const permissions = await auth.getUserPermissions();

if (permissions.can_view_admin_panel) {
  // Megjelenítjük az admin panel linket
}
```

### Jogosultság Módosítása

```javascript
await updatePermission(userId, 'can_view_admin_panel', true);
```

### Szövegdobozok Böngészése

```javascript
// Modal megnyitása
window.openBrowseOthersModal();

// Szöveg másolása
window.copyOthersText(userId);
```

## Hibakezelés

### Admin Panel
- Betöltési hiba esetén hibaüzenet jelenik meg
- Timeout esetén "Auth timeout" üzenet
- Supabase hiba esetén a részletes hiba jelenik meg

### Infosharer Böngésző
- Nincs bejelentkezve: "Nincs bejelentkezve" hiba
- Nincs találat: "Nincs találat a keresésre" üzenet
- Üres lista: "Nincsenek más felhasználók szövegdobozai"

## Jövőbeli Fejlesztések

- Email értesítések jogosultság változáskor
- Részletes audit log a jogosultság módosításokról
- Csoport alapú jogosultságok
- Egyedi jogosultság típusok hozzáadása
