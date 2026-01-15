-- ====================================
-- INFOSHARER USER TEXTS TABLE
-- ====================================
-- 
-- Minden felhasználónak saját PRIVÁT szövegdoboza van.
-- Csak a tulajdonos szerkesztheti, de mindenki olvashatja.
-- 
-- FONTOS: Ez a RÉGI közös szövegdoboz (infosharer tábla, id=1) MELLETT működik!
-- A közös szövegdoboz megmarad - azt bárki szerkesztheti bejelentkezés után.
--

-- 1. Tábla létrehozása
CREATE TABLE IF NOT EXISTS infosharer_user_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index létrehozása
CREATE INDEX IF NOT EXISTS idx_infosharer_user_texts_user_id 
ON infosharer_user_texts(user_id);

-- 3. RLS engedélyezése
ALTER TABLE infosharer_user_texts ENABLE ROW LEVEL SECURITY;

-- 4. Töröljük a régi policy-kat (ha vannak)
DROP POLICY IF EXISTS "Anyone can read all texts" ON infosharer_user_texts;
DROP POLICY IF EXISTS "Users can update own text" ON infosharer_user_texts;
DROP POLICY IF EXISTS "Users can insert own text" ON infosharer_user_texts;
DROP POLICY IF EXISTS "Users can delete own text" ON infosharer_user_texts;

-- 5. RLS Policy-k

-- Policy: Mindenki olvashatja az összes szöveget (publikus hozzáférés)
CREATE POLICY "Anyone can read all texts"
ON infosharer_user_texts FOR SELECT
USING (true);

-- Policy: Csak a tulajdonos módosíthatja a saját szövegét
CREATE POLICY "Users can update own text"
ON infosharer_user_texts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Csak a tulajdonos hozhatja létre a saját szövegét
CREATE POLICY "Users can insert own text"
ON infosharer_user_texts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Csak a tulajdonos törölheti a saját szövegét
CREATE POLICY "Users can delete own text"
ON infosharer_user_texts FOR DELETE
USING (auth.uid() = user_id);

-- 6. Trigger: updated_at automatikus frissítése
DROP TRIGGER IF EXISTS update_infosharer_user_texts_updated_at ON infosharer_user_texts;

CREATE TRIGGER update_infosharer_user_texts_updated_at
BEFORE UPDATE ON infosharer_user_texts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Function: Automatikus text box létrehozása új user regisztrációkor
CREATE OR REPLACE FUNCTION create_user_text_box()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.infosharer_user_texts (user_id, content)
  VALUES (NEW.id, '')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger: Új user létrehozásakor automatikusan hozzunk létre text box-ot
DROP TRIGGER IF EXISTS on_user_created_text_box ON auth.users;

CREATE TRIGGER on_user_created_text_box
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_text_box();

-- ====================================
-- ELLENŐRZÉS
-- ====================================

-- Összes user text box
SELECT 
  ut.user_id,
  au.email,
  LENGTH(ut.content) as content_length,
  ut.created_at,
  ut.updated_at
FROM infosharer_user_texts ut
LEFT JOIN auth.users au ON ut.user_id = au.id
ORDER BY ut.created_at DESC;

-- Policy-k ellenőrzése
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'infosharer_user_texts'
ORDER BY policyname;

-- ====================================
-- HASZNÁLAT
-- ====================================
--
-- Az Infosharer oldal user-specifikus szöveget tölt be:
-- 
-- const { data, error } = await supabase
--   .from('infosharer_user_texts')
--   .select('content')
--   .eq('user_id', currentUser.id)
--   .maybeSingle();
--
-- Mentés:
--
-- await supabase
--   .from('infosharer_user_texts')
--   .upsert({
--     user_id: currentUser.id,
--     content: newText
--   }, { onConflict: 'user_id' });
--
-- ====================================
