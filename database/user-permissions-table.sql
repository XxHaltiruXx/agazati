-- ====================================
-- USER PERMISSIONS TABLE
-- ====================================
-- 
-- Részletes jogosultságkezelés minden felhasználóhoz.
-- Adminok szabályozhatják, hogy ki mit lát és mit kezelhet.
--

-- 1. Tábla létrehozása
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Jogosultságok
  can_view_infosharer BOOLEAN DEFAULT TRUE NOT NULL,
  can_view_admin_panel BOOLEAN DEFAULT FALSE NOT NULL,
  can_manage_admins BOOLEAN DEFAULT FALSE NOT NULL,
  can_manage_google_drive BOOLEAN DEFAULT FALSE NOT NULL,
  can_manage_releases BOOLEAN DEFAULT FALSE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Index létrehozása
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
ON user_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_admin_panel 
ON user_permissions(can_view_admin_panel) 
WHERE can_view_admin_panel = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_permissions_manage_admins 
ON user_permissions(can_manage_admins) 
WHERE can_manage_admins = TRUE;

-- 3. RLS engedélyezése
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Töröljük a régi policy-kat (ha vannak)
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admin managers can update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can insert own permissions" ON user_permissions;

-- 5. RLS Policy-k

-- Policy: Mindenki láthatja a saját jogosultságait
CREATE POLICY "Users can view own permissions"
ON user_permissions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admin jogosultsággal rendelkezők láthatják az összes jogot
-- (Nem rekurzív - user_roles táblát használja)
CREATE POLICY "Admins can view all permissions"
ON user_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.is_admin = TRUE
  )
);

-- Policy: can_manage_admins joggal rendelkezők módosíthatnak bármilyen jogot
CREATE POLICY "Admin managers can update permissions"
ON user_permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.user_id = auth.uid() 
    AND user_permissions.can_manage_admins = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.user_id = auth.uid() 
    AND user_permissions.can_manage_admins = TRUE
  )
);

-- Policy: Új user automatikusan létrehozhatja a saját permissions rekordját
CREATE POLICY "Users can insert own permissions"
ON user_permissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. Trigger: updated_at automatikus frissítése
DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;

CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON user_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Function: Automatikus permissions létrehozása új user regisztrációkor
CREATE OR REPLACE FUNCTION create_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_permissions (
    user_id,
    can_view_infosharer,
    can_view_admin_panel,
    can_manage_admins,
    can_manage_google_drive,
    can_manage_releases
  ) VALUES (
    NEW.id,
    TRUE,   -- Alapértelmezett: mindenki látja az Infosharer-t
    FALSE,  -- Admin panel csak kijelölt usereknek
    FALSE,  -- Admin kezelés csak super adminoknak
    FALSE,  -- Google Drive kezelés csak kijelölteknek
    FALSE   -- Releases Manager csak kijelölteknek
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger: Új user létrehozásakor automatikusan hozzunk létre permissions-t
DROP TRIGGER IF EXISTS on_user_created_permissions ON auth.users;

CREATE TRIGGER on_user_created_permissions
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_permissions();

-- ====================================
-- SUPER ADMIN BEÁLLÍTÁSA
-- ====================================
-- 
-- Az első admin user számára minden jogosultság megadása:
--
-- UPDATE user_permissions
-- SET 
--   can_view_infosharer = TRUE,
--   can_view_admin_panel = TRUE,
--   can_manage_admins = TRUE,
--   can_manage_google_drive = TRUE,
--   can_manage_releases = TRUE,
--   updated_at = NOW()
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com');
--
-- ====================================

-- ====================================
-- ELLENŐRZÉS
-- ====================================

-- Összes user jogosultsága
SELECT 
  up.user_id,
  au.email,
  up.can_view_infosharer,
  up.can_view_admin_panel,
  up.can_manage_admins,
  up.can_manage_google_drive,
  up.can_manage_releases,
  up.created_at,
  up.updated_at
FROM user_permissions up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at DESC;

-- Admin jogosultsággal rendelkezők
SELECT 
  au.email,
  up.can_view_admin_panel,
  up.can_manage_admins,
  up.can_manage_google_drive,
  up.can_manage_releases
FROM user_permissions up
JOIN auth.users au ON up.user_id = au.id
WHERE up.can_view_admin_panel = TRUE
ORDER BY au.email;

-- Policy-k ellenőrzése
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_permissions'
ORDER BY policyname;

-- ====================================
-- HASZNÁLAT
-- ====================================
--
-- Frontend: Jogosultságok lekérdezése
--
-- const { data, error } = await supabase
--   .from('user_permissions')
--   .select('*')
--   .eq('user_id', currentUser.id)
--   .maybeSingle();
--
-- if (data?.can_view_admin_panel) {
--   // Megjelenítjük az admin panel linket
-- }
--
-- Admin panel: Összes user jogosultságának kezelése
--
-- const { data, error } = await supabase
--   .from('user_permissions')
--   .select(`
--     *,
--     profiles!inner(email)
--   `)
--   .order('created_at', { ascending: false });
--
-- Jogosultság frissítése:
--
-- await supabase
--   .from('user_permissions')
--   .update({ can_view_admin_panel: true })
--   .eq('user_id', targetUserId);
--
-- ====================================
