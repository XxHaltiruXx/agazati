# Jogosultságok Kezelésének Javítása - Teljes Útmutató

## 🔴 A Probléma
- Minden jogosultságod van (`can_view_admin_panel: true`, stb.)
- DE csak az Infosharert látod a menüben
- Más menüpontok (Admin Panel, Release Manager) nem jelenik meg

## ✅ Megoldás

### 1. Lépés: RLS Policy Javítása (Kritikus!)

Nyisd meg a **Supabase Dashboard** → **SQL Editor**-t és futtasd le:

```sql
-- Másold be teljes tartalmat az alábbi fájlból:
-- database/FIX-PERMISSIONS-RLS-PROPER.sql
```

Ez javítja az RLS hibákat a `user_permissions` táblán.

---

### 2. Lépés: Tesztelés (Browser Console-ban)

Nyisd meg az oldalt, majd nyomj **F12** (Developer Tools) → **Console** fülre.

Másold be az alábbi debug scriptet:

```javascript
(async function debugPermissions() {
  // 1. Ellenőrizd a jogosultságok betöltődését
  const auth = window.getAuth?.();
  if (auth) {
    console.log('📋 Jelenlegi jogosultságok:', auth.getUserPermissions());
    
    // 2. Frissítsd a jogosultságokat
    await auth.refreshPermissions?.();
    console.log('✅ Frissítve:', auth.getUserPermissions());
    
    // 3. Építsd újra a navigációt
    await window.rebuildNavigation?.();
    console.log('✅ Navigáció újraépítve!');
  }
})();
```

### 3. Lépés: Ellenőrzés

Ha a console-ban látod ezeket, akkor OK:
```
✅ Permissions betöltve: {
  can_view_admin_panel: true,
  can_manage_releases: true,
  ...
}
```

---

## 🔧 Ha még mindig nem működik

### Lehetséges okok:

1. **`user_permissions` tábla RLS-e blokkol**
   - Megoldás: Futtasd le a `FIX-PERMISSIONS-RLS-PROPER.sql` scriptet

2. **Nincs `user_permissions` bejegyzés az adatbázisban**
   - Ellenőrzés a Supabase Console-ban:
   ```sql
   SELECT * FROM user_permissions WHERE user_id = 'SAJÁT_USER_ID';
   ```
   - Ha üres: A trigger kellene, hogy hozza létre

3. **Trigger nem jó**
   - Ellenőrzés:
   ```sql
   SELECT * FROM pg_proc WHERE proname LIKE '%permission%';
   ```

---

## 🚀 Gyors Javítás (Ha semmilyen nem működik)

Lépj be az admin panelba és **manuálisan szerkeszd meg a saját jogosultságaidat**:

1. Menj a **secret/admin/users** részre
2. Keress meg magad
3. Kattints az edit gombra
4. Módosítsd a jogosultságokat
5. Mentés

Ezután azonnal frissül a menü! 🎉

---

## 📊 Hibaelhárítási Lépéssor

```
1. ✓ RLS Policy javítva? 
   → database/FIX-PERMISSIONS-RLS-PROPER.sql futtatva?

2. ✓ user_permissions bejegyzés létezik?
   → SELECT * FROM user_permissions;

3. ✓ Admin panel módosít tudja az adatokat?
   → Próbálj meg manuálisan módosítani

4. ✓ Navigáció frissül-e?
   → Debug script futtatva a console-ban?

5. ✓ Page refresh?
   → Ctrl+F5 (hard refresh)
```

---

## 📝 Megjegyzések

- A jogosultságok **5 másodpercenként frissülnek** automatikusan (polling)
- Manuális frissítéshez: press `Ctrl+Shift+R` az oldalon
- Debug mód: Nyit a **Browser Console**-t - ott van minden log

---

## ❓ Kérdések?

Ha még mindig nem működik, add meg:
- A Supabase Console log-okat
- A Browser Console output-ot
- Az Adatbázis tábla szerkezet ellenőrzéseit

Akkor tudom pontosabban diagnosztizálni! 🔍
