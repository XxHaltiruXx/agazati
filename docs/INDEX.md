# 📊 Adatbázis Dokumentáció

Ez a mappa az Infosharer projekt **SQL scriptjeit és adatbázis dokumentációját** tartalmazza.

## 🗄️ Adatbázis Scriptjei

### 🚀 Telepítés & Inicializálás
- `supabase-create-profiles-table.sql` - Profil tábla létrehozása
- `supabase-setup-step-by-step.sql` - Lépésről-lépésre beállítás
- `supabase-migration.sql` - Teljes migráció

### 🔐 Row-Level Security (RLS) & Jogok
- `MINIMAL-POLICIES.sql` - Minimális RLS politikák
- `FIX-RLS-POLICIES-SIMPLE.sql` - Egyszerűsített RLS javítás
- `FIX-RLS-INFINITE-RECURSION.sql` - RLS végtelen rekurzió javítása

### 👨‍💼 Admin Kezelés
- `set-admin-metadata-function.sql` - Admin metadata függvény
- `ADD-ADMIN-POLICIES-SAFE.sql` - Biztonságos admin politikák
- `ADMIN-QUICK-FIX.sql` - Admin gyors javítás
- `supabase-set-admin.sql` - Admin beállítás

### 🔍 Debuggolás & Vizsgálat
- `CHECK-POLICIES.sql` - RLS politikák ellenőrzése
- `CHECK-FUNCTION-CODE.sql` - Függvény kód ellenőrzése
- `CHECK-TRIGGERS.sql` - Triggerek ellenőrzése
- `supabase-debug-user-roles.sql` - User role debuggolás

### 📱 Valósidejű Funkciók
- `REALTIME-FIX-COMPLETE.sql` - Valósidejű javítás
- `REALTIME-FINAL-FIX.sql` - Végleges valósidejű javítás
- `enable-realtime-user-roles.sql` - User role valósidejű engedélyezése

### 🆘 Vészhelyzeti Javítások
- `FORCE-RESET-POLICIES.sql` - Politikák kényszerített alaphelyzete
- `INFINITE-RECURSION-FIX.sql` - Végtelen rekurzió javítása

## 📝 Futtatási Sorrend (Új Telepítéshez)

```
1. supabase-create-profiles-table.sql
2. supabase-setup-step-by-step.sql
3. MINIMAL-POLICIES.sql
4. set-admin-metadata-function.sql
5. ADD-ADMIN-POLICIES-SAFE.sql
```

## 🔒 Biztonsági Megjegyzések

- **RLS KRITIKUS**: Mindig ellenőrizd a politikákat `CHECK-POLICIES.sql`-lel
- **Admin Hozzáférés**: Csak megbízható felhasználók számára
- **Triggerek**: Ellenőrizd `CHECK-TRIGGERS.sql`-lel

## 🆘 Problémamegoldás

**Ha RLS problémád van:**
```sql
-- Ellenőrzöd az aktív politikákat:
SELECT * FROM pg_policies;

-- Futtatsd:
-- 1. CHECK-POLICIES.sql
-- 2. FIX-RLS-POLICIES-SIMPLE.sql
```

**Ha admin problémád van:**
```sql
-- Ellenőrzöd az admin statuszt:
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'admin@email.com';

-- Állítsd be:
-- ADMIN-QUICK-FIX.sql
```

## 📖 Dokumentáció

Az összes terv és beállítási útmutató a `../docs-archive/` mappában található.

Lásd: `../docs-archive/SUPABASE-SETUP.md`
