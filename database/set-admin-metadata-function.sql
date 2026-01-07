-- ====================================
-- ADMIN METADATA FRISSÍTŐ FUNKCIÓ
-- ====================================
-- Ez a funkció lehetővé teszi adminoknak hogy más userek
-- admin metadata-ját frissítsék (ami szükséges az auth működéshez)

-- 1. Funkció létrehozása
CREATE OR REPLACE FUNCTION public.set_user_admin_metadata(
    target_user_id UUID,
    admin_status BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_admin BOOLEAN;
    result JSON;
BEGIN
    -- Ellenőrizzük hogy a hívó user admin-e
    SELECT (
        COALESCE(
            (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
            false
        )
    ) INTO current_user_admin;
    
    IF NOT current_user_admin THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can set admin roles';
    END IF;
    
    -- Frissítjük a user metadata-ját az auth.users táblában
    UPDATE auth.users
    SET 
        raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('is_admin', admin_status),
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Ellenőrizzük hogy sikeres volt-e
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', target_user_id;
    END IF;
    
    -- Visszaadjuk a sikeres eredményt
    result := json_build_object(
        'success', true,
        'user_id', target_user_id,
        'is_admin', admin_status,
        'message', 'Admin status successfully updated'
    );
    
    RETURN result;
END;
$$;

-- 2. Jogosultságok beállítása
-- Csak autentikált userek hívhatják meg
REVOKE ALL ON FUNCTION public.set_user_admin_metadata FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_admin_metadata TO authenticated;

-- ====================================
-- HASZNÁLAT
-- ====================================
-- SELECT public.set_user_admin_metadata(
--     'user-uuid-here'::uuid,
--     true  -- vagy false
-- );

-- ====================================
-- MEGJEGYZÉS
-- ====================================
-- Ez a funkció SECURITY DEFINER módban fut, ami azt jelenti
-- hogy a funkció tulajdonosának jogosultságaival fut.
-- Mivel az auth.users táblát csak a postgres user módosíthatja,
-- ez lehetővé teszi az admin metadata frissítését.
