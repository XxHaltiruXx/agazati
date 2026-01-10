# ADMIN & JELSZÓ FUNKCIÓK JAVÍTÁSA

## 🔧 Javított Funkciók

### 1. Admin Hozzáadása/Eltávolítása Gomb ✅

**Probléma:** Az admin jog módosítás csak a `user_roles` táblát frissítette, de nem a user metadata-ját, amit az auth rendszer használ.

**Megoldás:**
- [supabase-auth.js](e:\HDD\újminden\dolgok\Cmd\Html\agazati\assets\js\supabase-auth.js#L271) - `setUserAdmin()` metódus kibővítve
- Most egy `set_user_admin_metadata()` database function-t hív
- Ez frissíti a `auth.users` tábla `raw_user_meta_data` mezőjét

**SQL Script:** [set-admin-metadata-function.sql](e:\HDD\újminden\dolgok\Cmd\Html\agazati\set-admin-metadata-function.sql)

**Lépések:**
1. **Futtasd le az SQL scriptet:**
   - Supabase Dashboard → SQL Editor
   - Másold be: `set-admin-metadata-function.sql`
   - Run

2. **Tesztelés:**
   - Admin panel → Válassz egy usert
   - Kattints "Admin hozzáadása" gombra
   - Sikeres üzenet után a user újra be kell jelentkezzen

### 2. Jelszó Visszaállítás 📧

**Probléma:** Lehet hogy nem működött vagy nem küldött emailt.

**Javítások:**
- Részletesebb logging a consoleon
- Jobb hibaüzenetek
- Redirect URL logging

**Ellenőrizendő a Supabase Dashboard-on:**

1. **Email Provider Beállítva:**
   - Settings → Authentication → Email
   - "Enable email confirmations" be kell legyen kapcsolva
   
2. **Email Templates:**
   - Settings → Authentication → Email Templates
   - "Magic Link" template ellenőrzése
   - "Reset Password" template ellenőrzése

3. **SMTP Beállítások (opcionális):**
   - Ha custom SMTP-t akarsz: Settings → Project Settings → Email
   - Alapértelmezett Supabase email működnie kéne

**Használat:**
1. Auth modal → "Elfelejtetted a jelszavad?"
2. Email cím megadása
3. Ellenőrizd a konzolt:
   ```
   🔄 Jelszó visszaállítás indítása: user@example.com
   📧 Redirect URL: https://...
   ✅ Jelszó visszaállító email elküldve
   ```
4. Ellenőrizd az emailt (és SPAM mappát!)

## 🐛 Debug

### Admin Gomb Hibák

**Error: "function public.set_user_admin_metadata does not exist"**
- **Megoldás:** Futtasd le a `set-admin-metadata-function.sql` scriptet

**Error: "Unauthorized: Only admins can set admin roles"**
- **Megoldás:** Győződj meg hogy te admin vagy (user_metadata.is_admin = true)

### Jelszó Visszaállítás Hibák

**Nem érkezik email:**
1. Ellenőrizd a SPAM mappát
2. Supabase Dashboard → Authentication → Users → Refresh
3. Nézd meg a Logs-ot: Dashboard → Logs → Auth logs
4. Ellenőrizd: Settings → Authentication → Email → "Confirm email" enabled

**"Invalid email"**
- Ellenőrizd hogy valid email formátum-e
- Ne legyen whitespace az elején/végén

## 📋 Összefoglaló

1. **Futtasd le:** `set-admin-metadata-function.sql`
2. **Futtasd le (ha még nem tetted):** `supabase-create-profiles-table.sql`
3. **Tesztelés:**
   - Admin panel → Frissítés gomb
   - User admin jog módosítása
   - Jelszó visszaállítás kipróbálása
   
4. **Várható eredmény:**
   - Admin jog módosítása működik
   - User újra bejelentkezés után látja az admin funkciókat
   - Jelszó visszaállító email megérkezik
