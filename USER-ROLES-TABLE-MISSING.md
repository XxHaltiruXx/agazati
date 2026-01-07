# ⚠️ USER ROLES TÁBLA HIÁNYZIK!

## ❌ Hiba
```
Error: relation "user_roles" does not exist
```

## ✅ Megoldás

A `user_roles` táblát még nem hoztad létre a Supabase-ben!

### 🚀 Gyors Fix (5 perc)

#### 1. Nyisd meg a Supabase Dashboard-ot
```
https://app.supabase.com/project/rtguezsjtkxjwhipuaqe
```

#### 2. Menj az SQL Editor-ba
```
Bal oldali menü → SQL Editor
```

#### 3. Futtasd le az SQL-t

**Két lehetőséged van:**

**A) Teljes Script (Ajánlott)**
```
1. Nyisd meg: supabase-migration.sql
2. Másold ki a TELJES tartalmat
3. Illeszd be az SQL Editor-ba
4. Kattints: RUN
5. Várj ~2 másodpercet
6. ✅ Kész!
```

**B) Lépésről-Lépésre (Ha problémád van)**
```
1. Nyisd meg: supabase-setup-step-by-step.sql
2. Másold ki az 1. LÉPÉST
3. Illeszd be az SQL Editor-ba
4. Kattints: RUN
5. Várj a sikerüzenetre
6. Ismételd meg a 2-10. lépéssel
7. ✅ Kész!
```

### 📋 Ellenőrzés

**Futtasd le ezt az SQL Editor-ban:**
```sql
-- Ez megmondja hogy létezik-e a tábla
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
) AS table_exists;
```

**Eredmény:**
- ✅ `true` - Tábla létezik, minden OK!
- ❌ `false` - Még nincs létrehozva, futtasd le az SQL-t!

### 🧪 Teszt

**Miután létrehoztad a táblát:**
```sql
-- 1. Nézd meg a user-eket
SELECT * FROM auth.users;

-- 2. Nézd meg a role-okat (most már működnie kell!)
SELECT * FROM user_roles;

-- 3. Ha a role-ok üresek, töltsd fel őket:
INSERT INTO user_roles (user_id, is_admin)
SELECT id, FALSE 
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Ellenőrizd újra:
SELECT 
  u.email,
  ur.is_admin,
  ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id;
```

### 🎯 Mit Csinál Ez?

Az SQL script:
1. ✅ Létrehozza a `user_roles` táblát
2. ✅ Beállítja a Row Level Security-t
3. ✅ Létrehoz trigger-eket
4. ✅ Automatikusan hozzáad role-t minden új user-hez
5. ✅ Feltölti a meglévő user-ek role-jait

### 📊 Elvárt Eredmény

**Tábla létrehozás után:**
```sql
SELECT COUNT(*) FROM auth.users;    -- Pl: 1
SELECT COUNT(*) FROM user_roles;    -- Pl: 1 (ugyanannyi!)
```

**Ha a számok NEM egyeznek:**
```sql
-- Futtasd le ezt:
INSERT INTO user_roles (user_id, is_admin)
SELECT id, FALSE 
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- Most már egyezniük kell!
```

### 🎉 Sikeres Létrehozás Után

**1. Menj vissza a test-auth.html oldalra**
```
Refresh (F5)
```

**2. Kattints: "👑 User Roles Tábla"**
```
Elvárt eredmény:
✅ User roles tábla OK!
Talált rekordok: 1 (vagy több)
```

**3. Ellenőrizd a user-t:**
```sql
-- SQL Editor-ban:
SELECT 
  u.email,
  ur.is_admin
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'bankutim13@ganziskola.hu';
```

**Eredmény:**
```
email: bankutim13@ganziskola.hu
is_admin: false
```

### 🔑 Admin Jog Hozzáadása (Opcionális)

**Ha admin jogot szeretnél:**
```sql
UPDATE user_roles 
SET is_admin = TRUE 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'bankutim13@ganziskola.hu'
);
```

**Ellenőrzés:**
```sql
SELECT 
  u.email,
  ur.is_admin
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'bankutim13@ganziskola.hu';
```

**Most:**
```
email: bankutim13@ganziskola.hu
is_admin: true  ← ✅ Admin vagy!
```

## 📁 Fájlok

- ✅ `supabase-migration.sql` - Teljes migráció (egyetlen script)
- ✅ `supabase-setup-step-by-step.sql` - Lépésről-lépésre (11 lépés)
- ✅ `supabase-debug-user-roles.sql` - Debug script (csak ellenőrzéshez)

## 🎓 Megjegyzés

⚠️ **MINDIG először a táblát kell létrehozni!**

A `supabase-migration.sql` fájl tartalma **kötelező** hogy lefusson, különben:
- ❌ Nem lesz user_roles tábla
- ❌ Nem tudsz admin jogot ellenőrizni
- ❌ A secret oldalak nem működnek

**Futtatás után minden automatikus lesz!** 🎉

---

**Készítve:** 2026-01-07  
**Készítő:** GitHub Copilot 🤖

