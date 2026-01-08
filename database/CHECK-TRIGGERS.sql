-- Ellenőrizzük hogy vannak-e triggerek vagy funkciók a user_roles táblán
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_roles';

-- Nézzük meg az összes funkciót is
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%user_role%'
   OR routine_definition LIKE '%user_roles%';
