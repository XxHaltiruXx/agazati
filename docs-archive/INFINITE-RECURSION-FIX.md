# 🚨 VÉGTELEN REKURZIÓ HIBA JAVÍTÁSA

## A Probléma

```
infinite recursion detected in policy for relation "user_roles"
```

Az RLS policy végtelen loop-ot okoz, mert önmagát hívja.

## ✅ EGYETLEN LÉPÉS AMI KELL

### Supabase Dashboard → SQL Editor → Futtasd le:

Másold be a **teljes** `supabase-set-admin.sql` fájl tartalmát és futtasd le.

**VAGY** csak ezt az egy scriptet:

```sql
-- 1. Töröljük a hibás policy-ket
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- 2. Új policy - metadata alapján (NINCS REKURZIÓ)
CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL
    USING ((auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true')
    WITH CHECK ((auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true');

-- 3. Admin jog beállítása
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb 
WHERE email = 'xxhaltiruxx@gmail.com';

-- 4. User_roles bejegyzés létrehozása
INSERT INTO public.user_roles (user_id, is_admin, created_at, updated_at)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com'),
    true, NOW(), NOW()
)
ON CONFLICT (user_id) DO UPDATE SET is_admin = true, updated_at = NOW();
```

## 🔍 Ellenőrzés

```sql
-- Metadata ellenőrzése
SELECT email, raw_user_meta_data->>'is_admin' as is_admin 
FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com';
```

**Eredmény**: `is_admin = true` ✅

## 🎉 KÉSZ!

1. **Frissítsd az oldalt** (F5)
2. **Jelentkezz be újra**
3. **Ellenőrizd** a console log-ot:

```
📋 User metadata is_admin: true
👤 User: xxhaltiruxx@gmail.com | Admin: true (metadata: true, database: true)
```

## ✅ MOST MÁR MŰKÖDIK:

- ✅ Secret menü látható
- ✅ Infosharer szerkeszthető
- ✅ Admin panel elérhető
- ✅ Release manager működik
- ✅ **NINCS 500-as hiba!**

---

## 🧠 Mi volt a probléma?

A régi RLS policy:
```sql
-- EZ VÉGTELEN LOOP-OT OKOZOTT:
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles  -- ← ITT: önmagát hívja!
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );
```

Az új policy:
```sql
-- EZ JÓ: metadata-t használ (nincs rekurzió)
CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL
    USING ((auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true');
```

---

## ❓ Továbbra sem működik?

- Ellenőrizd hogy a `public.user_roles` tábla létezik-e
- Töröld a cache-t (Ctrl+Shift+R)
- Próbálj inkognitó módban
- Nézd meg a console log-ot hogy `is_admin: true` látható-e
