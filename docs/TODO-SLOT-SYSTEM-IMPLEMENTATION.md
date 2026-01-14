# TODO: Infosharer Fejlesztések - 2026.01.14

## 1. ✅ Toggle Switch → Pipa (Checkbox) - KÉSZ
- [x] Admin panel: Kapcsoló helyett checkbox stílus
- [x] Zöld pipa ha BE
- [x] Üres checkbox ha KI
- [x] CSS stílus frissítése

## 2. 🔄 Automatikus Slot Számozás - SCOPE HIBA
- [x] Google Drive-ra manuálisan feltöltött fájlok slot számot kapnak
- [x] Következő szabad slot automatikus kiválasztása
- [x] Infosharer feltöltés továbbra is ugyanúgy működik
- [x] Slot átszámozás ha fájlt rejtenek el
- [ ] **Google Drive scope frissítése: `drive.readonly` → `drive.file`**
- [ ] **Force Re-auth az admin panelen**

### ⚠️ Scope Hiba Javítás Szükséges

**Hiba:** `403 Forbidden - Request had insufficient authentication scopes`

**Megoldás:**
1. SQL futtatása Supabase-ben: `database/FIX-GOOGLE-DRIVE-SCOPES.sql`
2. Force Re-auth gomb az admin panelen
3. Részletek: `docs/GOOGLE-DRIVE-SCOPE-FIX-INSTRUCTIONS.md`

## 3. ✅ Dinamikus Slot Átszámozás - IMPLEMENTÁLVA
- [x] Ha slot_2 KI → slot_3 lesz slot_2, slot_4 lesz slot_3, stb.
- [x] Ha slot_2 újra BE → következő szabad slot-ot kapja (pl. slot_3)
- [x] Rejtett fájlok nem kapnak slot számot
- [x] Admin panel mutatja a jelenlegi slot számot
- [ ] **Tesztelés scope javítás után**

## 4. ✅ Dinamikus Kapacitás Számítás - KÉSZ
- [x] Max kapacitás: 15 GB (Google Drive free tier)
- [x] Rejtett fájlok levonása a kapacitásból
- [x] Csak látható fájlok számítanak a használt tárhelybe
- [x] UI frissítése: "X GB / Y GB (Z GB rejtett)"

## 5. ✅ Fájl Letöltés Slot Szám Nélkül - KÉSZ
- [x] Letöltésnél slot_X_ prefix eltávolítása
- [x] Eredeti fájlnév visszaállítása
- [x] Infosharer és Admin panel letöltéseknél is

## 6. 🔄 Keresősáv Implementálása - FOLYAMATBAN
- [x] Infosharer oldal: Keresés fájlnév alapján
- [x] Real-time szűrés (nincs keresés gomb)
- [x] Highlight a találatokra
- [ ] Admin panel: Keresés fájlnév alapján

---

## 🐛 Felfedezett Hibák

### Hiba #1: Google Drive Scope 403 Forbidden
**Státusz:** ⚠️ SCOPE FRISSÍTÉS SZÜKSÉGES

**Probléma:**
```
Error: 403 - Request had insufficient authentication scopes
```

**Megoldás:**
1. SQL futtatása: `database/FIX-GOOGLE-DRIVE-SCOPES.sql`
2. Force Re-auth az admin panelen
3. Részletek: `docs/GOOGLE-DRIVE-SCOPE-FIX-INSTRUCTIONS.md`

### Hiba #2: Nem minden fájl látszik az Admin Panelben
**Státusz:** 🔍 VIZSGÁLAT ALATT

**Probléma:**
- Google Drive mappában 3 fájl van
- Admin panel csak 2-t mutat

**Lehetséges okok:**
1. `explorer_reset.bat` másik mappában van (nem az Infosharer Storage mappában)
2. Mappa ID konfiguráció nem megfelelő

**Debug:**
- Hozzáadva console.log a fájlok listázásához
- Ellenőrizd a browser console-t: `📂 Google Drive fájlok:`

---

## 🎯 Következő Lépések

### Prioritás 1: Scope Javítás
1. **SQL futtatása Supabase-ben**
2. **Force Re-auth**
3. **Tesztelés**: Slot átszámozás működik-e

### Prioritás 2: Fájl Láthatóság Debug
1. **Console log ellenőrzése**: Hány fájlt lát a rendszer?
2. **Mappa ID ellenőrzése**: Minden fájl a megfelelő mappában van?
3. **Auto Slot gomb használata**: `🎰 Auto Slot` gomb az admin panelen

### Prioritás 3: Admin Panel Keresősáv
1. Keresősáv hozzáadása az admin panelhez
2. Ugyanaz a funkcionalitás mint az Infoshareren

---

## Megoldási Sorr end

1. **Toggle → Pipa** (15 perc)
2. **Automatikus slot számozás** (30 perc)
3. **Dinamikus átszámozás** (45 perc)
4. **Kapacitás számítás** (20 perc)
5. **Letöltés javítás** (15 perc)
6. **Keresősáv** (30 perc)

**Összes idő:** ~2.5 óra

---

Kezdem az implementálást...
