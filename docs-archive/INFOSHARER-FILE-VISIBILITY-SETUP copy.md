# 🚀 GYORS TELEPÍTÉS: Infosharer Fájl Láthatóság

## 1️⃣ SQL Tábla Létrehozása (2 perc)

### Supabase Dashboard

1. Nyisd meg a projekted
2. SQL Editor → New Query
3. Másold be:

```sql
CREATE TABLE IF NOT EXISTS google_drive_file_visibility (
  id BIGSERIAL PRIMARY KEY,
  file_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  visible_on_infosharer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_drive_file_visibility_file_id ON google_drive_file_visibility(file_id);
CREATE INDEX IF NOT EXISTS idx_google_drive_file_visibility_visible ON google_drive_file_visibility(visible_on_infosharer);

ALTER TABLE google_drive_file_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mindenki olvashatja a látható fájlokat"
ON google_drive_file_visibility FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Adminok kezelhetik a láthatóságot"
ON google_drive_file_visibility FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.is_admin = true
  )
);

CREATE OR REPLACE FUNCTION update_google_drive_file_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_drive_file_visibility_updated_at
    BEFORE UPDATE ON google_drive_file_visibility
    FOR EACH ROW
    EXECUTE FUNCTION update_google_drive_file_visibility_updated_at();
```

4. **RUN** ✅
5. Eredmény: `Success. No rows returned`

## 2️⃣ Oldal Frissítése

```bash
# Hard reload
Ctrl + Shift + R
```

VAGY

```bash
# Git pull
git pull origin main
```

## 3️⃣ Teszt

### Admin Panel
1. Menj a **Google Drive Fájlok** szekcióhoz
2. Látod a fájl kártyákat
3. Minden fájlnál van egy kapcsoló: **"Látható az Infoshareren"**
4. Kapcsold BE egy fájlnál
5. ✅ Sikeres!

### Ellenőrzés SQL-ben

```sql
SELECT file_name, visible_on_infosharer 
FROM google_drive_file_visibility;
```

Eredmény:
```
file_name            | visible_on_infosharer
---------------------+----------------------
example.pdf          | true
document.docx        | false
```

## 4️⃣ Mi Változott?

### Emojik Eltávolítva ✅

**Előtte:**
- 🔗 Google Drive Bejelentkezés
- ⬇️ Letöltés
- 🗑️ Törlés

**Utána:**
- Google Drive Bejelentkezés
- Letöltés
- Törlés

### Új Funkció: Láthatóság Kezelése ✅

Minden fájl kártyán:
```
┌────────────────────────────────┐
│ [PDF] example.pdf              │
│                                │
│ Látható az Infoshareren [ ON ] │
│                                │
│ [Letöltés]  [Törlés]          │
└────────────────────────────────┘
```

## 5️⃣ Használat

### Fájl Láthatóvá Tétele
1. Kapcsoló BE → Látható az Infoshareren
2. Automatikusan mentve az adatbázisba

### Fájl Elrejtése
1. Kapcsoló KI → Nem látható
2. Automatikusan frissítve

### Hibakezelés
- Ha hiba történik → kapcsoló visszaáll az előző állapotra
- Alert üzenet jelzi a hibát

## ❓ Gyakori Problémák

### "permission denied for table google_drive_file_visibility"

**Megoldás:** Nem vagy admin!
```sql
-- Ellenőrizd:
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

### "relation google_drive_file_visibility does not exist"

**Megoldás:** Futtasd le újra az 1️⃣ lépést!

### Toggle switch nem működik

**Megoldás:** Hard reload (Ctrl+Shift+R)

## 📚 Kapcsolódó Fájlok

- `database/google-drive-file-visibility.sql` - Teljes SQL script
- `docs/EMOJI-REMOVAL-MANUAL.md` - Részletes dokumentáció
- `secret/admin/index.html` - Admin panel (frissítve)

---

✅ **Kész!** Most már kezelheted, hogy melyik fájl legyen látható az Infoshareren! 🎉
