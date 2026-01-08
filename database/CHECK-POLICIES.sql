-- Nézd meg PONTOSAN milyen policy-k vannak most
SELECT 
    policyname, 
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;
