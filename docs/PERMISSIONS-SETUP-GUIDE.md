# Jogosultságkezelő Rendszer - Telepítési Útmutató

## Gyors Áttekintés

Ez a dokumentáció leírja, hogyan kell telepíteni és aktiválni az új jogosultságkezelő rendszert.

## Előfeltételek

- PostgreSQL adatbázis (Supabase)
- Működő authentication rendszer
- Admin jogosultság az adatbázishoz

## Telepítési Lépések

### 1. Adatbázis Migráció

Futtasd az alábbi SQL parancsokat a Supabase SQL Editor-ban:

```sql
-- 1. user_permissions tábla létrehozása
\i database/user-permissions-table.sql

-- VAGY használd a teljes migrációt:
\i database/QUICK-SETUP-ALL-IN-ONE.sql
```

A `QUICK-SETUP-ALL-IN-ONE.sql` tartalmazza:
- `infosharer_user_texts` tábla
- `user_permissions` tábla
- Super admin felhasználó beállítása
- Minden RLS policy
- Auto-create triggerek

### 2. Ellenőrzés

Futtasd az alábbi query-t, hogy ellenőrizd a telepítést:

```sql
-- Táblák ellenőrzése
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_permissions', 'infosharer_user_texts');

-- Policies ellenőrzése
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_permissions', 'infosharer_user_texts');
```

### 3. Frontend Fájlok

Győződj meg róla, hogy az alábbi fájlok frissítve vannak:

#### Admin Panel
- `secret/admin/index.html` - Jogosultságkezelő szekció
- JavaScript kód a jogosultságok kezeléséhez

#### Infosharer
- `secret/infosharer/index.html` - "Mások szövegdobozai" gomb és modal
- `assets/js/infosharer.js` - Browse funkciók

#### Auth Modul
- `assets/js/supabase-auth.js` - Permission getterek

### 4. Tesztelés

#### Admin Panel Tesztelés

1. Lépj be admin felhasználóként
2. Menj a `secret/admin/index.html` oldalra
3. Görgess a "Jogosultságkezelés" szekcióhoz
4. Ellenőrizd, hogy látod-e a felhasználók listáját
5. Próbálj módosítani egy jogosultságot (nem a sajátod)
6. Frissítsd az oldalt és ellenőrizd, hogy a módosítás megmaradt

#### Infosharer Böngésző Tesztelés

1. Lépj be egy felhasználóként
2. Menj az Infosharerre
3. Válts "Saját privát szöveg" módba
4. Írj be valamit
5. Kattints a "Mások szövegdobozai" gombra
6. Ellenőrizd, hogy látod-e más felhasználók szövegeit (ha vannak)
7. Próbáld ki a keresést
8. Másold ki egy szöveget

### 5. Super Admin Beállítása

Ha még nem állítottad be a super admin felhasználót:

```sql
-- Super admin beállítása (helyettesítsd be a saját email-ed)
\i database/setup-super-admin.sql
```

Vagy manuálisan:

```sql
-- 1. Felhasználó ID lekérése
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. User role beállítása
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID-HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 3. Teljes jogosultságok hozzáadása
INSERT INTO public.user_permissions (
  user_id,
  can_view_infosharer,
  can_view_admin_panel,
  can_manage_admins,
  can_manage_google_drive,
  can_manage_releases
)
VALUES (
  'YOUR-USER-ID-HERE',
  true,
  true,
  true,
  true,
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  can_view_infosharer = true,
  can_view_admin_panel = true,
  can_manage_admins = true,
  can_manage_google_drive = true,
  can_manage_releases = true;
```

## Hibaelhárítás

### Hiba: "user_permissions tábla nem létezik"

**Megoldás:**
```sql
-- Futtasd a user-permissions-table.sql fájlt
\i database/user-permissions-table.sql
```

### Hiba: "Nincs jogosultságom olvasni a user_permissions táblát"

**Megoldás:**
```sql
-- Ellenőrizd az RLS policies-t
SELECT * FROM pg_policies WHERE tablename = 'user_permissions';

-- Ha hiányoznak, futtasd újra:
\i database/user-permissions-table.sql
```

### Hiba: "profiles tábla nem létezik"

**Megoldás:**
```sql
-- Hozd létre a profiles táblát
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Hiba: "Saját jogosultságaim nem látszanak"

**Megoldás:**
```sql
-- Ellenőrizd, hogy létezik-e a rekord
SELECT * FROM user_permissions WHERE user_id = auth.uid();

-- Ha nem létezik, hozd létre
INSERT INTO user_permissions (user_id)
VALUES (auth.uid())
ON CONFLICT (user_id) DO NOTHING;
```

### Hiba: "Modal nem nyílik meg"

**Megoldás:**
- Ellenőrizd, hogy betöltődött-e a Bootstrap JS
- Ellenőrizd a böngésző konzolban, hogy van-e JavaScript hiba
- Győződj meg róla, hogy az `infosharer.js` betöltődött

## Funkciók Engedélyezése/Letiltása

### Infosharer Elérés Letiltása

```sql
UPDATE user_permissions
SET can_view_infosharer = false
WHERE user_id = 'TARGET-USER-ID';
```

### Admin Panel Elérés Engedélyezése

```sql
UPDATE user_permissions
SET can_view_admin_panel = true
WHERE user_id = 'TARGET-USER-ID';
```

### Minden Jogosultság Megadása

```sql
UPDATE user_permissions
SET 
  can_view_infosharer = true,
  can_view_admin_panel = true,
  can_manage_admins = true,
  can_manage_google_drive = true,
  can_manage_releases = true
WHERE user_id = 'TARGET-USER-ID';
```

## Következő Lépések

1. **Felhasználói Jogosultságok Beállítása**
   - Menj az admin panelre
   - Állítsd be minden felhasználó jogosultságait

2. **Tesztelés Különböző Felhasználókkal**
   - Lépj be különböző felhasználókkal
   - Ellenőrizd, hogy a jogosultságok megfelelően működnek

3. **Navigációs Linkek Frissítése**
   - Ellenőrizd, hogy csak azok a linkek látszanak, amikhez van jogosultság

## Támogatás

Ha bármilyen problémád van a telepítéssel, ellenőrizd:
1. Supabase SQL Editor-ban a hibaüzeneteket
2. Böngésző konzolt JavaScript hibákért
3. Network tab-ot Supabase API hibákért

## Verzió

- Létrehozva: 2024
- Utolsó frissítés: 2024
- Verzió: 1.0
