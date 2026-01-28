/**
 * PERMISSIONS DEBUG SCRIPT
 * 
 * Ez a script segít diagnosztizálni a jogosultság-kezelési problémákat.
 * Nyisd meg a böngésző Developer Tools Console-t és másolj-beilleszd ezt a scriptet.
 */

(async function debugPermissions() {
  console.log('========================================');
  console.log('🔍 PERMISSIONS DEBUG - KEZDŐDÖTT');
  console.log('========================================');

  // 1. Ellenőrizd a globalAuth objektumot
  if (window.getAuth && typeof window.getAuth === 'function') {
    const auth = window.getAuth();
    if (auth) {
      console.log('\n✅ globalAuth elérhető');
      console.log('  - isAuthenticated:', auth.isAuthenticated());
      console.log('  - currentUser:', auth.getCurrentUser());
      console.log('  - isAdmin:', auth.isAdmin);
      console.log('  - userPermissions:', auth.getUserPermissions());
      console.log('  - profileLoaded:', auth.profileLoaded);
      
      // 2. Próbáld meg frissíteni a permissions-t
      console.log('\n🔄 Permissions frissítésének próbálása...');
      if (auth.refreshPermissions && typeof auth.refreshPermissions === 'function') {
        try {
          await auth.refreshPermissions();
          console.log('✅ Permissions frissítve!');
          console.log('  - Új permissions:', auth.getUserPermissions());
          
          // 3. Próbáld meg újraépíteni a navigációt
          if (window.rebuildNavigation && typeof window.rebuildNavigation === 'function') {
            console.log('\n🔄 Navigáció újraépítésének próbálása...');
            try {
              await window.rebuildNavigation();
              console.log('✅ Navigáció újraépítve!');
            } catch (err) {
              console.error('❌ Nav rebuild hiba:', err);
            }
          }
        } catch (err) {
          console.error('❌ Permissions frissítés hiba:', err);
        }
      } else {
        console.warn('⚠️ refreshPermissions metódus nem elérhető');
      }
    } else {
      console.error('❌ globalAuth nem érhető el (window.getAuth() null)');
    }
  } else {
    console.error('❌ window.getAuth nem elérhető');
  }

  // 4. Supabase client ellenőrzése
  console.log('\n🔍 Supabase ellenőrzése...');
  if (window.supabase) {
    console.log('✅ Supabase elérhető');
    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        console.log('  - Bejelentkezett felhasználó:', user.email);
        console.log('  - User ID:', user.id);
        
        // Próbáld meg lekérdezni a permissions-t közvetlenül
        console.log('\n🔍 Direktes Supabase lekérdezés: user_permissions...');
        const { data: perms, error: permErr } = await window.supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (perms) {
          console.log('✅ Permissions megtalálva:', perms);
        } else if (!perms && !permErr) {
          console.warn('⚠️ Nincs permissions bejegyzés a user_permissions táblában');
        } else {
          console.error('❌ Permissions lekérdezés hiba:', permErr);
        }
        
        // Ellenőrizd a user_roles-t is
        console.log('\n🔍 Direktes Supabase lekérdezés: user_roles...');
        const { data: roles, error: roleErr } = await window.supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (roles) {
          console.log('✅ User role megtalálva:', roles);
        } else if (!roles && !roleErr) {
          console.warn('⚠️ Nincs user_roles bejegyzés');
        } else {
          console.error('❌ User roles lekérdezés hiba:', roleErr);
        }
      } else {
        console.warn('⚠️ Nincs bejelentkezett felhasználó');
      }
    } catch (err) {
      console.error('❌ Supabase ellenőrzés hiba:', err);
    }
  } else {
    console.error('❌ window.supabase nem érhető el');
  }

  console.log('\n========================================');
  console.log('✅ DEBUG VÉGE');
  console.log('========================================');
})();
