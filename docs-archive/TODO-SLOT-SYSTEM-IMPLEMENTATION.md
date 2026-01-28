# TODO: Slot System & Visibility Implementation

## Státusz: 🔧 In Progress

## Feladatok

### ✅ TODO #1: Toggle switch CSS javítás
**Státusz:** KÉSZ  
**Probléma:** A toggle switch csúszkája kilógott a háttérből jobb oldalt  
**Megoldás:** Megjegyzés hozzáadva a CSS-hez hogy jelezze a funkciót

---

### 🔧 TODO #2: Slot számozás Google Drive fájloknak
**Státusz:** FOLYAMATBAN  
**Probléma:** Ha Google Drive-ról közvetlenül töltesz fel fájlt (nem Infosharer-en keresztül), nem lesz slot_szám a nevében  
**Megoldás:**
1. Storage adapter upload funkció módosítása
2. Automatikus slot hozzárendelés a következő szabad slot-ra
3. Fájlnév átnevezés `slot{N}_` prefix-szel

**Implementáció:**
- File: `assets/js/storage-adapter.js` - `uploadFile()` metódus
- File: `assets/js/google-drive-api.js` - `uploadFileToGoogleDrive()` metódus
- Új függvény: `getNextAvailableSlot()` és `addSlotPrefixToFileName()`

---

### 🔧 TODO #3: Slot dinamikus újraszámozás
**Státusz:** FOLYAMATBAN  
**Probléma:** Amikor ki/bekapcsolod a láthatóságot, a slot számozás nem frissül dinamikusan  
**Követelmények:**
- Ha kikapcsolod slot_2-t, akkor a slot_3 lesz slot_2
- Ha nincs bekapcsolva, nincs slot_szám a nevében
- Ha visszakapcsolod, a következő elérhető slot számot veszi fel

**Implementáció:**
- Admin panel: `toggleFileVisibility()` funkció módosítása
- Új függvény: `recalculateSlotNumbers()` - újraszámozza a látható fájlokat
- Google Drive API: `renameFile()` funkció hozzáadása

---

### 🔧 TODO #4: Dinamikus kapacitás kezelés
**Státusz:** FOLYAMATBAN  
**Probléma:** Rejtett fájlok is beszámítanak a 15GB limitbe  
**Követelmények:**
- Max capacity: 15GB alapértelmezetten
- Ha rejtett egy fájl (visible_on_infosharer = false), ne számítson bele a limitbe
- Dinamikus méret kalkuláció

**Implementáció:**
- File: `assets/js/infosharer.js` - `calculateStorageUsage()` módosítása
- File: `assets/js/storage-adapter.js` - új `getVisibleFilesSize()` metódus
- Admin panel: storage bar dinamikus frissítése

---

### 🔧 TODO #5: Slot_szám eltávolítása letöltésnél
**Státusz:** FOLYAMATBAN  
**Probléma:** Amikor letölt egy fájlt a felhasználó, a `slot_X_` prefix is benne van a névben  
**Megoldás:**
- Download függvényben a fájlnév tisztítása: `slot\d+_` regex eltávolítása
- Csak a felhasználónak látható név marad

**Implementáció:**
- File: `assets/js/infosharer.js` - download funkciók módosítása
- File: `assets/js/storage-adapter.js` - `downloadFile()` metódus
- Regex: `fileName.replace(/^slot\d+_/, '')`

---

### 🔧 TODO #6: Keresősáv az Infosharer oldalra
**Státusz:** TERVEZÉS  
**Megoldás:**
- HTML: search input hozzáadása
- JavaScript: filter funkció a fájl kártyákra
- Real-time szűrés gépelés közben

**Implementáció:**
- File: `secret/infosharer/index.html` - search bar HTML
- File: `assets/js/infosharer.js` - `filterSlots()` funkció

---

### 🔧 TODO #7: Keresősáv az Admin panelre
**Státusz:** TERVEZÉS  
**Megoldás:**
- HTML: search input hozzáadása a Google Drive fájl listázás fölé
- JavaScript: filter funkció a fájl kártyákra
- Keresés: fájlnév alapján

**Implementáció:**
- File: `secret/admin/index.html` - search bar HTML
- JavaScript inline: `filterDriveFiles()` funkció

---

## Implementációs Sorrend

1. ✅ **Toggle CSS javítás** (KÉSZ)
2. **Slot számozás logika** (Core funkció)
3. **Dinamikus újraszámozás** (Függ #2-től)
4. **Dinamikus kapacitás** (Függ #2-3-tól)
5. **Slot_szám eltávolítása letöltésből** (Egyszerű, független)
6. **Keresősávok** (UI enhancement, független)

---

## Adatbázis Schema Módosítások

### Új mező: `slot_number` a visibility táblában

```sql
ALTER TABLE google_drive_file_visibility
ADD COLUMN slot_number INTEGER DEFAULT NULL;

CREATE INDEX idx_google_drive_slot_number ON google_drive_file_visibility(slot_number);
```

Ez tárolja hogy melyik slot-ban van a fájl (NULL = nincs slot számozva / rejtett).

---

## Technikai Megjegyzések

### Slot Számozás Algoritmus

```javascript
// Következő elérhető slot megkeresése
async function getNextAvailableSlot() {
  const { data: visibleFiles } = await supabase
    .from('google_drive_file_visibility')
    .select('slot_number, file_name')
    .eq('visible_on_infosharer', true)
    .order('slot_number', { ascending: true });
  
  // Keressük meg a hiányzó slot számokat (1-től kezdve)
  const usedSlots = new Set(visibleFiles.map(f => f.slot_number).filter(n => n !== null));
  
  let nextSlot = 1;
  while (usedSlots.has(nextSlot)) {
    nextSlot++;
  }
  
  return nextSlot;
}
```

### Slot Újraszámozás

```javascript
// Újraszámozás láthatóság változásakor
async function recalculateSlotNumbers() {
  const { data: visibleFiles } = await supabase
    .from('google_drive_file_visibility')
    .select('*')
    .eq('visible_on_infosharer', true)
    .order('created_at', { ascending: true });
  
  // Újra számozzuk 1-től
  for (let i = 0; i < visibleFiles.length; i++) {
    const newSlotNumber = i + 1;
    const file = visibleFiles[i];
    
    if (file.slot_number !== newSlotNumber) {
      // Frissítjük az adatbázist
      await supabase
        .from('google_drive_file_visibility')
        .update({ slot_number: newSlotNumber })
        .eq('file_id', file.file_id);
      
      // Google Drive-on is átnevezzük a fájlt
      const oldName = file.file_name;
      const newName = oldName.replace(/^slot\d+_/, `slot${newSlotNumber}_`);
      
      if (oldName !== newName) {
        await GoogleDrive.renameFile(file.file_id, newName);
        
        // Frissítjük a file_name-et is
        await supabase
          .from('google_drive_file_visibility')
          .update({ file_name: newName })
          .eq('file_id', file.file_id);
      }
    }
  }
}
```

### Storage Kapacitás Kalkuláció

```javascript
// Csak a látható fájlok méretét számoljuk
async function calculateVisibleStorageUsage() {
  const { data: visibleFiles } = await supabase
    .from('google_drive_file_visibility')
    .select('file_id')
    .eq('visible_on_infosharer', true);
  
  const visibleFileIds = new Set(visibleFiles.map(f => f.file_id));
  
  const files = await GoogleDrive.listFilesInGoogleDrive();
  
  let totalSize = 0;
  files.forEach(file => {
    if (visibleFileIds.has(file.id)) {
      totalSize += parseInt(file.size || 0);
    }
  });
  
  return totalSize;
}
```

---

## Tesztelési Ellenőrzőlista

- [ ] Új fájl feltöltése Infosharer-en keresztül → automatikus slot_szám
- [ ] Fájl feltöltése közvetlenül Google Drive-ra → automatikus slot hozzárendelés
- [ ] Fájl láthatóság kikapcsolása → slot_szám eltávolítása a névből
- [ ] Fájl láthatóság visszakapcsolása → új slot_szám hozzáadása
- [ ] Középső slot törlése → további slotok újraszámozása
- [ ] Storage kapacitás csak látható fájlokat számolja
- [ ] Letöltés → fájlnév tiszta (nincs slot prefix)
- [ ] Keresősáv működik mindkét oldalon

---

## További Megjegyzések

- **Google Drive API rate limit:** Figyelni kell hogy a rename műveletek ne terhelje túl az API-t
- **Conflict handling:** Mi van ha két admin egyszerre módosít láthatóságot?
- **Cache invalidation:** LocalStorage-ot frissíteni kell slot változásakor
- **Error handling:** Minden async művelethez proper try-catch

---

**Utolsó frissítés:** 2026-01-14  
**Következő lépés:** TODO #2 implementálása
