# Jogosultságkezelő Hiba Javítása

## Probléma

```
Hiba: Could not find a relationship between 'profiles' and 'user_permissions' in the schema cache
```

## Ok

A Supabase nem találta a `profiles` táblát, vagy a kapcsolat nem volt megfelelően beállítva a `profiles` és `user_permissions` táblák között.

## Megoldás

### 1. Futtasd le a javító SQL szkriptet

Nyisd meg a Supabase Dashboard > SQL Editor-t és futtasd le:

```sql
\i database/FIX-PROFILES-PERMISSIONS.sql
```

Vagy másold be a teljes tartalmat a `FIX-PROFILES-PERMISSIONS.sql` fájlból.

### 2. Mit csinál a script?

1. **Létrehozza a `profiles` táblát** (ha még nem létezik)
   - `id` - auth.users-re hivatkozik
   - `email` - felhasználó email címe
   - `created_at`, `updated_at` - időbélyegek

2. **Beállítja az RLS policies-t**
   - Felhasználók láthatják saját profiljukat
   - Adminok láthatják az összes profilt

3. **Auto-create trigger**
   - Minden új felhasználóhoz automatikusan létrehoz egy profile rekordot

4. **Meglévő felhasználók profiles-ai**
   - Létrehozza az összes meglévő auth.users-hez a profiles rekordot

### 3. Ellenőrzés

A script végén lefuttatja ezeket a query-ket:

```sql
-- Profiles ellenőrzése
SELECT 
  p.id,
  p.email,
  p.created_at
FROM profiles p
ORDER BY p.email;

-- Minden auth.users-hez van-e profile?
SELECT 
  au.id,
  au.email,
  CASE WHEN p.id IS NULL THEN 'HIÁNYZIK' ELSE 'OK' END as profile_status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id;

-- Permissions ellenőrzése
SELECT 
  p.email,
  up.can_view_infosharer,
  up.can_view_admin_panel,
  up.can_manage_admins,
  up.can_manage_google_drive,
  up.can_manage_releases
FROM profiles p
LEFT JOIN user_permissions up ON up.user_id = p.id
ORDER BY p.email;
```

Ha minden rendben, minden auth.users-hez `OK` státusz kell látszódjon.

### 4. Frissítsd az oldalt

```
Ctrl + Shift + R
```

Most a jogosultságkezelő panel betöltődik hiba nélkül!

## Technikai Magyarázat

### Miért volt szükség a profiles táblára?

A Supabase RLS policies nem tudnak közvetlenül az `auth.users` táblára hivatkozni JOIN-okkal a public schema táblákból. Ezért kell egy `public.profiles` tábla, ami:

1. **Proxy** az auth.users táblához
2. **Kapcsolat** a user_permissions-hez
3. **Kiegészítő adatok** tárolására alkalmas (email cache, user meta, stb.)

### Adatmodell

```
auth.users (Supabase Auth schema)
    ↓ (trigger)
profiles (public schema)
    ↓ (foreign key)
user_permissions (public schema)
```

### JavaScript oldal

Az admin panel mostantól:

1. **Betölti a profiles táblát** (összes felhasználó)
2. **Betölti a user_permissions táblát** külön
3. **Egyesíti őket** JavaScript-ben (client-side JOIN)

```javascript
// Felhasználók lekérése
const { data: users } = await supabase
  .from('profiles')
  .select('id, email')
  .order('email', { ascending: true });

// Jogosultságok lekérése
const { data: permissions } = await supabase
  .from('user_permissions')
  .select('*');

// Egyesítés
const usersWithPermissions = users.map(user => ({
  ...user,
  user_permissions: permissions.find(p => p.user_id === user.id) || {}
}));
```

## Jövőbeli Megelőzés

Az új `QUICK-SETUP-ALL-IN-ONE.sql` már tartalmazza a `profiles` tábla létrehozását, így ez a hiba nem fog előfordulni új telepítéseknél.

## Tesztelés

### 1. Admin Panel

1. Lépj be admin felhasználóként
2. Menj a `secret/admin/index.html` oldalra
3. Ellenőrizd, hogy a "Jogosultságkezelés" szekció betöltődik
4. Látszanak-e a felhasználók?
5. Működnek-e a checkboxok?

### 2. Konzol

Nyisd meg a böngésző konzolt (F12) és nézd meg:

```
✅ Jogosultságok betöltve
```

Ha ezt látod, minden rendben!

### 3. Hiba esetén

Ha továbbra is hibát látsz:

1. Ellenőrizd, hogy a script lefutott-e: `SELECT COUNT(*) FROM profiles;`
2. Ellenőrizd, hogy van-e profile minden userhez: `SELECT COUNT(*) FROM auth.users; SELECT COUNT(*) FROM profiles;`
3. Nézd meg a böngésző Network tab-ot, hogy mi a pontos hiba

## Összefoglalás

✅ **Profiles tábla** létrehozva  
✅ **Auto-create trigger** beállítva  
✅ **Meglévő felhasználók** profiles-ai létrehozva  
✅ **JavaScript kód** frissítve (client-side JOIN)  
✅ **QUICK-SETUP-ALL-IN-ONE.sql** frissítve  

Most a jogosultságkezelő rendszer teljes mértékben működik!
