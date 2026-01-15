-- ====================================
-- SUPER ADMIN BEÁLLÍTÁSA
-- User Permissions System
-- ====================================
-- 
-- Ez a script beállítja az első super admin felhasználót,
-- aki teljes hozzáféréssel rendelkezik minden funkcióhoz.
--

-- ====================================
-- 1. SUPER ADMIN JOGOSULTSÁGOK BEÁLLÍTÁSA
-- ====================================

-- Cseréld le az email címet a saját super admin email-edre!
UPDATE user_permissions
SET 
  can_view_infosharer = TRUE,        -- Infosharer láthatóság
  can_view_admin_panel = TRUE,       -- Admin panel hozzáférés
  can_manage_admins = TRUE,          -- Admin jogok kezelése (KRITIKUS!)
  can_manage_google_drive = TRUE,    -- Google Drive kezelés
  can_manage_releases = TRUE,        -- Releases Manager
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com'
);

-- ====================================
-- 2. ADMIN STATUS BEÁLLÍTÁSA (user_roles tábla)
-- ====================================

-- Győződj meg róla, hogy az is_admin flag is be van állítva
UPDATE user_roles
SET 
  is_admin = TRUE,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com'
);

-- ====================================
-- 3. ELLENŐRZÉS
-- ====================================

-- Super admin ellenőrzése
SELECT 
  au.email,
  ur.is_admin,
  up.can_view_infosharer,
  up.can_view_admin_panel,
  up.can_manage_admins,
  up.can_manage_google_drive,
  up.can_manage_releases
FROM auth.users au
LEFT JOIN user_roles ur ON ur.user_id = au.id
LEFT JOIN user_permissions up ON up.user_id = au.id
WHERE au.email = 'xxhaltiruxx@gmail.com';

-- Várt eredmény:
-- email                    | is_admin | can_view_infosharer | can_view_admin_panel | can_manage_admins | can_manage_google_drive | can_manage_releases
-- -------------------------|----------|---------------------|----------------------|-------------------|-------------------------|--------------------
-- xxhaltiruxx@gmail.com    | true     | true                | true                 | true              | true                    | true

-- ====================================
-- 4. TÖBB SUPER ADMIN HOZZÁADÁSA (OPCIONÁLIS)
-- ====================================
-- 
-- Ha több super admin felhasználót szeretnél, ismételd meg a fenti lépéseket
-- más email címekkel.
--
-- Példa:
--
-- UPDATE user_permissions
-- SET 
--   can_view_infosharer = TRUE,
--   can_view_admin_panel = TRUE,
--   can_manage_admins = TRUE,
--   can_manage_google_drive = TRUE,
--   can_manage_releases = TRUE,
--   updated_at = NOW()
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'masodik.admin@example.com'
-- );
--
-- UPDATE user_roles
-- SET 
--   is_admin = TRUE,
--   updated_at = NOW()
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'masodik.admin@example.com'
-- );

-- ====================================
-- 5. NORMÁL ADMIN BEÁLLÍTÁSA (Csak Admin Panel Hozzáférés)
-- ====================================
--
-- Ha olyan adminokat szeretnél, akik CSAK az admin panelt látják,
-- de nem tudnak más adminokat kezelni:
--
-- UPDATE user_permissions
-- SET 
--   can_view_infosharer = TRUE,
--   can_view_admin_panel = TRUE,
--   can_manage_admins = FALSE,        -- NEM TUDO MÁS ADMINOKAT KEZELNI
--   can_manage_google_drive = FALSE,
--   can_manage_releases = FALSE,
--   updated_at = NOW()
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'normal.admin@example.com'
-- );

-- ====================================
-- 6. RELEASES MANAGER JOGOSULTSÁG (Csak Releases)
-- ====================================
--
-- Ha olyan felhasználót szeretnél, aki CSAK a Releases Manager-t látja:
--
-- UPDATE user_permissions
-- SET 
--   can_view_infosharer = TRUE,
--   can_view_admin_panel = FALSE,     -- Nincs admin panel hozzáférés
--   can_manage_admins = FALSE,
--   can_manage_google_drive = FALSE,
--   can_manage_releases = TRUE,       -- CSAK Releases Manager
--   updated_at = NOW()
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'releases.manager@example.com'
-- );

-- ====================================
-- 7. ÖSSZES USER JOGOSULTSÁG LISTÁZÁSA
-- ====================================

SELECT 
  au.email,
  ur.is_admin,
  up.can_view_infosharer as infosharer,
  up.can_view_admin_panel as admin_panel,
  up.can_manage_admins as manage_admins,
  up.can_manage_google_drive as google_drive,
  up.can_manage_releases as releases
FROM auth.users au
LEFT JOIN user_roles ur ON ur.user_id = au.id
LEFT JOIN user_permissions up ON up.user_id = au.id
ORDER BY ur.is_admin DESC, au.email;

-- ====================================
-- MEGJEGYZÉSEK
-- ====================================
--
-- 1. can_manage_admins = TRUE
--    Ez a LEGFONTOSABB jogosultság!
--    Csak olyan felhasználóknak add meg, akikben 100%-ig megbízol.
--    Ezzel a joggal bárki jogosultságait módosíthatja.
--
-- 2. can_view_admin_panel = TRUE
--    Ez engedélyezi az admin panel láthatóságát.
--    Minden más admin funkció ettől függetlenül szabályozható.
--
-- 3. can_view_infosharer = TRUE
--    Ez az alapértelmezett minden felhasználónak.
--    Csak akkor állítsd FALSE-ra, ha teljesen ki szeretnéd tiltani valakit.
--
-- 4. Jogosultságok hierarchiája:
--    Super Admin (mindent kezel)
--      ↓
--    Admin (csak admin panel)
--      ↓
--    Releases Manager (csak releases)
--      ↓
--    Normál User (csak infosharer)
--
-- ====================================
