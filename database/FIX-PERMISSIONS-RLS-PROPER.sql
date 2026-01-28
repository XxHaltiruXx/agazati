-- ====================================
-- USER PERMISSIONS RLS FIX
-- ====================================
-- 
-- Ez a script javítja az RLS policy hibákat a user_permissions táblán.
-- Az UPDATE policy már nem rekurzív, hanem a user_roles táblát vizsgálja.
--

-- 1. ADMIN JOGOSULTSÁG ELLENŐRZÉSE
-- Kétféleképpen lehet admin: user_roles táblán VAGY user_permissions táblán
-- De az UPDATE-nél CSAK user_roles-t használunk, hogy elkerüljük a rekurziót

-- Töröljük a régi, hibás policy-kat
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admin managers can update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can insert own permissions" ON user_permissions;

-- 2. ÚJRADEFINIÁLÁS - helyesen

-- Policy: Mindenki láthatja a saját jogosultságait
CREATE POLICY "Users can view own permissions"
ON user_permissions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admin jogosultsággal rendelkezők láthatják az összes jogot
CREATE POLICY "Admins can view all permissions"
ON user_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- Policy: UPDATE - ADMIN (user_roles-ből nézve) módosíthat
-- FONTOS: NEM használunk user_permissions self-referencet az UPDATE-nél!
CREATE POLICY "Admins can update any permissions"
ON user_permissions FOR UPDATE
USING (
  -- Aki módosítja: adminnak kell lennie (user_roles alapján)
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
)
WITH CHECK (
  -- Aki módosítja: adminnak kell lennie (user_roles alapján)
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- Policy: DELETE - csak adminok
CREATE POLICY "Admins can delete permissions"
ON user_permissions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- Policy: Új user automatikusan létrehozhatja a saját permissions rekordját
CREATE POLICY "Users can insert own permissions"
ON user_permissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Adminok is beszúrhatnak permissions másoknál
CREATE POLICY "Admins can insert any permissions"
ON user_permissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- 3. GYŐZÖDJ MEG HOGY user_roles TÁBLA LÉTEZIK ÉS JÓL VAN KONFIGURÁLVA
-- Ez a tábla az admin státusz forrása!
-- Ha nem létezik, létre kell hozni

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- user_roles policies (ha nincsek)
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.is_admin = TRUE
  )
);

CREATE POLICY "Admins can manage roles"
ON user_roles FOR UPDATE
USING (
  -- Csak az első admin módosíthat (az első admin id-ja)
  auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE is_admin = TRUE 
    ORDER BY created_at ASC 
    LIMIT 1
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE is_admin = TRUE 
    ORDER BY created_at ASC 
    LIMIT 1
  )
);

-- 4. ELLENŐRZÉS
SELECT 
    policyname, 
    cmd,
    qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'user_permissions'
ORDER BY cmd, policyname;

-- 5. ADMIN FELHASZNÁLÓ BEÁLLÍTÁSA
-- Ha szükséges, add meg a saját admin user_id-d itt:
-- UPDATE user_roles SET is_admin = TRUE WHERE user_id = 'YOUR_USER_ID_HERE';
