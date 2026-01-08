-- Nézzük meg a trigger funkció kódját
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- És nézzük meg van-e más funkció is ami user_roles-szal kapcsolatos
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname LIKE '%user%'
   OR proname LIKE '%admin%'
   OR proname LIKE '%role%';
