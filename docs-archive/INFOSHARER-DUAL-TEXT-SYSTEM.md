# 📝 Infosharer - Dual Text System

## Áttekintés

Az Infosharer **két szövegdobozt** biztosít:

### 🌍 Közös Szöveg (Shared)
- **Bárki szerkesztheti** aki be van jelentkezve
- Valós idejű szinkronizáció
- Mindenki látja ugyanazt a szöveget
- **Tábla:** `infosharer` (id=1)

### 🔒 Saját Privát Szöveg (Private)
- **Csak a tulajdonos szerkesztheti**
- Minden usernek külön privát szövegdoboza van
- Mások másolhatnak belőle (ha be vannak jelentkezve)
- **Tábla:** `infosharer_user_texts` (user_id alapú)

---

## 🎮 Használat

### Mode Váltás
Az Infosharer oldal tetején két gomb található:

```
┌─────────────────────────────────┐
│  [🌍 Közös szöveg] [🔒 Saját privát szöveg]  │
└─────────────────────────────────┘
```

Kattints a gombra a váltáshoz.

### Közös Szöveg Használata
1. Kattints: **🌍 Közös szöveg**
2. Bejelentkezés után: szerkeszthető
3. Mentés: automatikus
4. Mindenki látja a változásokat valós időben

### Privát Szöveg Használata
1. Kattints: **🔒 Saját privát szöveg**
2. Bejelentkezés szükséges
3. Csak te szerkesztheted
4. Mások másolhatnak belőle (ha be vannak jelentkezve)

---

## 🔧 Technikai Részletek

### Szövegdobozok Struktúrája

#### Közös Szöveg (Shared)
```sql
Table: infosharer
- id: 1 (fix)
- content: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

RLS Policy:
- SELECT: mindenki (true)
- UPDATE: bejelentkezett userek (auth.uid() IS NOT NULL)
- INSERT: bejelentkezett userek
```

#### Privát Szöveg (Private)
```sql
Table: infosharer_user_texts
- id: UUID (auto-generated)
- user_id: UUID (unique) → auth.users
- content: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

RLS Policy:
- SELECT: mindenki (true) - bárki olvashat
- UPDATE: csak tulajdonos (auth.uid() = user_id)
- INSERT: csak tulajdonos (auth.uid() = user_id)
- DELETE: csak tulajdonos (auth.uid() = user_id)

Auto-create Trigger:
- Új user regisztrációkor automatikus üres szövegdoboz létrehozása
```

### JavaScript Működés

#### Mode Váltás
```javascript
// assets/js/infosharer.js

let currentMode = "shared"; // "shared" vagy "private"

function switchMode(mode) {
  currentMode = mode;
  
  // UI frissítés
  updateModeButtons(mode);
  
  // Szöveg újratöltése
  load();
  
  // Real-time újraindítása
  subscribeRealtime();
}
```

#### Betöltés (Load)
```javascript
async function load() {
  const currentUser = globalAuth?.getCurrentUser();
  
  if (currentMode === 'shared') {
    // Közös szöveg betöltése
    const { data } = await supabase
      .from('infosharer')
      .select('content')
      .eq('id', 1)
      .maybeSingle();
    
    // Szerkeszthető ha be van jelentkezve
    if (currentUser) {
      canEdit = true;
      ta.readOnly = false;
    }
  } else {
    // Privát szöveg betöltése
    if (!currentUser) {
      ta.value = 'Bejelentkezés szükséges';
      return;
    }
    
    const { data } = await supabase
      .from('infosharer_user_texts')
      .select('content')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    
    // Mindig szerkeszthető (saját szöveg)
    canEdit = true;
    ta.readOnly = false;
  }
}
```

#### Mentés (Upsert)
```javascript
async function upsert(text) {
  const currentUser = globalAuth?.getCurrentUser();
  
  if (!currentUser) return;
  
  if (currentMode === 'shared') {
    // Közös szöveg mentése
    await supabase
      .from('infosharer')
      .upsert({ id: 1, content: text });
  } else {
    // Privát szöveg mentése
    await supabase
      .from('infosharer_user_texts')
      .upsert({ user_id: currentUser.id, content: text });
  }
}
```

#### Real-time Subscription
```javascript
function subscribeRealtime() {
  const currentUser = globalAuth?.getCurrentUser();
  
  // Régi channel törlése
  if (channelRef) {
    channelRef.unsubscribe();
  }
  
  if (currentMode === 'shared') {
    // Közös szöveg real-time
    channelRef = supabase
      .channel('infosharer-shared')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'infosharer',
        filter: 'id=eq.1'
      }, handleChange)
      .subscribe();
  } else {
    // Privát szöveg real-time
    if (!currentUser) return;
    
    channelRef = supabase
      .channel('infosharer-private')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'infosharer_user_texts',
        filter: `user_id=eq.${currentUser.id}`
      }, handleChange)
      .subscribe();
  }
}
```

---

## 🔒 Biztonsági Megfontolások

### Közös Szöveg
- ✅ Bárki szerkesztheti → Vandalizmus lehetséges
- ⚠️ Nincs verziózás → Régi tartalom visszaállítása NEM lehetséges
- 💡 Megoldás: Admin jogosultság bevezetése (későbbi fejlesztés)

### Privát Szöveg
- ✅ Csak a tulajdonos szerkesztheti
- ✅ RLS policy védi az adatokat
- ✅ Mindenki olvashat → másolás engedélyezett
- ⚠️ Törlés NEM lehetséges (még nincs implementálva)

---

## 🚀 Jövőbeli Fejlesztések

### 1. Admin Jogosultság Ellenőrzés (Közös Szöveg)
```javascript
// Csak adminok szerkesszék a közös szöveget
if (currentMode === 'shared') {
  if (currentUser && globalAuth.isAdminUser()) {
    canEdit = true;
  } else {
    canEdit = false;
    ta.readOnly = true;
  }
}
```

### 2. Verziózás
- Automatikus mentés történelemmel
- Visszaállítás előző verzióra
- Diff megjelenítés

### 3. Privát Szöveg Törlése
```javascript
async function deletePrivateText() {
  const currentUser = globalAuth?.getCurrentUser();
  if (!currentUser) return;
  
  await supabase
    .from('infosharer_user_texts')
    .delete()
    .eq('user_id', currentUser.id);
}
```

### 4. Megosztás Linkkel
```javascript
// Privát szöveg megosztása publikus linkkel
// pl. /infosharer?user=<user_id>
```

---

## 📊 Adatbázis Migráció

### Ellenőrzés
```sql
-- Közös szöveg
SELECT * FROM infosharer WHERE id = 1;

-- Összes privát szöveg
SELECT 
  ut.user_id,
  au.email,
  LENGTH(ut.content) as content_length,
  ut.created_at
FROM infosharer_user_texts ut
LEFT JOIN auth.users au ON ut.user_id = au.id
ORDER BY ut.created_at DESC;
```

### Migráció Régi Rendszerből
Ha volt régi `infosharer_user_texts` tábla ami NEM user alapú volt:

```sql
-- BACKUP!
CREATE TABLE infosharer_user_texts_backup AS 
SELECT * FROM infosharer_user_texts;

-- Tábla újradefiniálása
DROP TABLE infosharer_user_texts;

-- Új tábla létrehozása
-- (futtasd le: database/infosharer-user-texts-table.sql)
```

---

## ✅ Tesztelési Checklist

- [ ] Mode váltás működik (Közös <-> Privát)
- [ ] Közös szöveg: bárki szerkesztheti bejelentkezés után
- [ ] Privát szöveg: csak a tulajdonos szerkesztheti
- [ ] Privát szöveg: nincs bejelentkezve → üzenet jelenik meg
- [ ] Real-time működik mindkét módban
- [ ] Mentés működik mindkét módban
- [ ] Másik userből másolás működik (privát szöveg olvasható)
- [ ] UI gombok jól frissülnek mode váltáskor

---

**Készítette:** GitHub Copilot  
**Dátum:** 2026-01-15  
**Verzió:** 2.0 - Dual Text System  
**Státusz:** ✅ KÉSZ - Közös + Privát szövegdoboz támogatás
