# 📋 TODO: User Permission System Implementation

## Áttekintés

Új jogosultsági rendszer bevezetése, ahol minden usernek van saját Infosharer szövegdoboza, és részletes admin jogosultságkezelés.

## 🎯 Követelmények

### 1. Infosharer - Saját Szövegdobozok
- ✅ Minden usernek saját szövegdoboza van (`infosharer_user_texts` tábla)
- ✅ Csak a tulajdonos tudja szerkeszteni
- ✅ Mindenki tud másolni bárki szövegéből
- ✅ Publikus megosztás link alapján (látható mindenkinek, de nem szerkeszthető)

### 2. Infosharer - Publikus Láthatóság
- ✅ Link ismeretével bárki eléri az Infosharer oldalt
- ✅ Nem bejelentkezett userek: csak olvashatnak, másolhatnak, fájlokat tölthetnek le
- ✅ Nem tudnak szöveget szerkeszteni vagy fájlt feltölteni

### 3. Admin Panel - Részletes Jogosultságkezelés

#### Új `user_permissions` tábla mezői:
- `user_id` (UUID) - Foreign key → auth.users
- `can_view_infosharer` (boolean) - Infosharer láthatóság [alapértelmezett: TRUE]
- `can_view_admin_panel` (boolean) - Admin panel láthatóság [alapértelmezett: FALSE]
- `can_manage_admins` (boolean) - Admin jogok kezelése más usereknél [alapértelmezett: FALSE]
- `can_manage_google_drive` (boolean) - Google Drive bejelentkezés kezelése [alapértelmezett: FALSE]
- `can_manage_releases` (boolean) - Releases Manager láthatóság [alapértelmezett: FALSE]
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Admin Panel UI - "Jogok" Szekció
- Lista minden userről
- User neve, email, státusz
- Toggle switchek minden jogosultsághoz
- Real-time mentés Supabase-be

---

## 📝 Feladatok Sorrendje

### FÁZIS 1: Adatbázis Struktúra

#### ✅ TODO-1: `infosharer_user_texts` tábla létrehozása
**Fájl:** `database/infosharer-user-texts-table.sql`

```sql
-- Minden user saját szövegdoboza
CREATE TABLE IF NOT EXISTS infosharer_user_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_infosharer_user_texts_user_id ON infosharer_user_texts(user_id);

-- RLS engedélyezése
ALTER TABLE infosharer_user_texts ENABLE ROW LEVEL SECURITY;

-- Policy: Mindenki láthatja az összes szöveget (olvasás)
CREATE POLICY "Anyone can read all texts"
ON infosharer_user_texts FOR SELECT
USING (true);

-- Policy: Csak a tulajdonos módosíthatja
CREATE POLICY "Users can update own text"
ON infosharer_user_texts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Csak a tulajdonos hozhatja létre
CREATE POLICY "Users can insert own text"
ON infosharer_user_texts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Auto-create text box minden új usernek
CREATE OR REPLACE FUNCTION create_user_text_box()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO infosharer_user_texts (user_id, content)
  VALUES (NEW.id, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_text_box
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_text_box();

-- Updated_at trigger
CREATE TRIGGER update_infosharer_user_texts_updated_at
BEFORE UPDATE ON infosharer_user_texts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### ✅ TODO-2: `user_permissions` tábla létrehozása
**Fájl:** `database/user-permissions-table.sql`

```sql
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Jogosultságok
  can_view_infosharer BOOLEAN DEFAULT TRUE,
  can_view_admin_panel BOOLEAN DEFAULT FALSE,
  can_manage_admins BOOLEAN DEFAULT FALSE,
  can_manage_google_drive BOOLEAN DEFAULT FALSE,
  can_manage_releases BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);

-- RLS engedélyezése
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Mindenki láthatja a saját jogait
CREATE POLICY "Users can view own permissions"
ON user_permissions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Adminok láthatják az összes jogot
CREATE POLICY "Admins can view all permissions"
ON user_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- Policy: can_manage_admins joggal rendelkezők módosíthatnak
CREATE POLICY "Managers can update permissions"
ON user_permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid() AND can_manage_admins = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid() AND can_manage_admins = TRUE
  )
);

-- Auto-create permissions minden új usernek
CREATE OR REPLACE FUNCTION create_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_permissions (
    user_id,
    can_view_infosharer,
    can_view_admin_panel,
    can_manage_admins,
    can_manage_google_drive,
    can_manage_releases
  ) VALUES (
    NEW.id,
    TRUE,   -- Alapértelmezett: mindenki látja az Infosharer-t
    FALSE,
    FALSE,
    FALSE,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_permissions
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_permissions();

-- Updated_at trigger
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON user_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### FÁZIS 2: Backend - Supabase Auth Frissítés

#### ✅ TODO-3: Auth modul frissítése
**Fájl:** `assets/js/supabase-auth.js`

**Módosítások:**
1. `loadUserProfile()` - lekéri a `user_permissions` táblát is
2. Új metódusok:
   - `getUserPermissions()` - visszaadja az aktuális user jogait
   - `canViewInfosharer()` - boolean
   - `canViewAdminPanel()` - boolean
   - `canManageAdmins()` - boolean
   - `canManageGoogleDrive()` - boolean
   - `canManageReleases()` - boolean

```javascript
async loadUserProfile(user) {
  if (!user) {
    this.userProfile = null;
    return;
  }
  
  try {
    // User roles lekérése
    const { data: roleData, error: roleError } = await this.supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // User permissions lekérése
    const { data: permData, error: permError } = await this.supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    this.userProfile = {
      id: user.id,
      email: user.email,
      is_admin: roleData?.is_admin || false,
      permissions: permData || {
        can_view_infosharer: true,
        can_view_admin_panel: false,
        can_manage_admins: false,
        can_manage_google_drive: false,
        can_manage_releases: false
      }
    };
  } catch (err) {
    console.error('Profile load error:', err);
  }
}

getUserPermissions() {
  return this.userProfile?.permissions || null;
}

canViewInfosharer() {
  return this.userProfile?.permissions?.can_view_infosharer ?? true;
}

canViewAdminPanel() {
  return this.userProfile?.permissions?.can_view_admin_panel ?? false;
}

canManageAdmins() {
  return this.userProfile?.permissions?.can_manage_admins ?? false;
}

canManageGoogleDrive() {
  return this.userProfile?.permissions?.can_manage_google_drive ?? false;
}

canManageReleases() {
  return this.userProfile?.permissions?.can_manage_releases ?? false;
}
```

---

### FÁZIS 3: Infosharer - User Szövegdoboz Rendszer

#### ✅ TODO-4: Infosharer.js átírása user alapú szövegkezelésre
**Fájl:** `assets/js/infosharer.js`

**Módosítások:**

1. **Globális szöveg megszüntetése** - a régi `TABLE = "infosharer", ID = 1` helyett
2. **User alapú lekérés:**
   - Ha bejelentkezve: saját `user_id` szövege töltődik be
   - Ha nincs bejelentkezve: csak olvasás (publikus mód)

3. **UI változások:**
   - "Írás engedélyezése" gomb → "Bejelentkezés szerkesztéshez"
   - Kijelző státusz:
     - ✅ Bejelentkezve (Szerkeszthető)
     - 👁️ Publikus (Csak olvasható)

4. **Kód változtatások:**

```javascript
// ÚJ: User text lekérése vagy publikus szöveg
async function loadUserText() {
  const currentUser = globalAuth?.getCurrentUser();
  
  if (!currentUser) {
    // Publikus mód - csak olvasás, nincs szöveg
    ta.value = 'Jelentkezz be, hogy saját szöveget készíts!';
    ta.readOnly = true;
    canEdit = false;
    setStatus('Publikus mód - Csak olvasható');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('infosharer_user_texts')
      .select('content')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    
    if (error) throw error;
    
    ta.value = data?.content || '';
    canEdit = true;
    ta.readOnly = false;
    setStatus('Szerkeszthető ✏️');
  } catch (err) {
    console.error('Load error:', err);
    setStatus('Betöltési hiba!');
  }
}

// ÚJ: User text mentése
async function saveUserText(text) {
  const currentUser = globalAuth?.getCurrentUser();
  if (!currentUser) return;
  
  try {
    const { error } = await supabase
      .from('infosharer_user_texts')
      .upsert({
        user_id: currentUser.id,
        content: text
      }, { onConflict: 'user_id' });
    
    if (error) throw error;
    setStatus('Mentve ✅');
  } catch (err) {
    console.error('Save error:', err);
    setStatus('Mentési hiba!');
  }
}

// Real-time subscription frissítése
function subscribeRealtime() {
  const currentUser = globalAuth?.getCurrentUser();
  if (!currentUser) return;
  
  channelRef = supabase
    .channel('user-text-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'infosharer_user_texts',
        filter: `user_id=eq.${currentUser.id}`
      },
      (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const newContent = payload.new?.content || '';
          if (newContent !== ta.value && document.activeElement !== ta) {
            ta.value = newContent;
          }
        }
      }
    )
    .subscribe();
}
```

#### ✅ TODO-5: Publikus hozzáférés védelme
**Fájl:** `assets/js/infosharer.js`

- Fájl feltöltés gomb elrejtése nem bejelentkezett usereknek
- Csak letöltés és másolás engedélyezése

```javascript
function updateUIForPublicMode() {
  const isLoggedIn = globalAuth?.getCurrentUser() != null;
  
  // Szerkesztési gombok elrejtése
  if (!isLoggedIn) {
    saveBtn.style.display = 'none';
    
    // Feltöltés gombok elrejtése minden slot-nál
    document.querySelectorAll('.upload-btn').forEach(btn => {
      btn.style.display = 'none';
    });
    
    // Törlés gombok elrejtése
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.style.display = 'none';
    });
  }
}
```

---

### FÁZIS 4: Admin Panel - Jogosultságkezelés UI

#### ✅ TODO-6: Admin Panel - "Jogok" szekció hozzáadása
**Fájl:** `secret/admin/index.html`

**Új HTML szekció:**

```html
<!-- Új szekció a User Management után -->
<section id="permissionsSection" class="section-card" style="display: none;">
  <h2>👮 Jogosultságkezelés</h2>
  <p class="text-muted">Állítsd be, hogy az egyes felhasználók mit láthatnak és mit kezelhetnek.</p>
  
  <div id="permissionsLoading" class="text-center">
    <div class="spinner-border text-primary" role="status"></div>
    <p>Jogosultságok betöltése...</p>
  </div>
  
  <div id="permissionsList" style="display: none;">
    <!-- Dinamikusan generált user jogosultság lista -->
  </div>
</section>
```

**Új JavaScript funkciók:**

```javascript
// Jogosultságok betöltése
async function loadPermissions() {
  try {
    const { data: users, error } = await supabase
      .from('user_permissions')
      .select(`
        *,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    renderPermissionsList(users);
  } catch (err) {
    console.error('Permissions load error:', err);
  }
}

// Lista renderelése
function renderPermissionsList(users) {
  const container = document.getElementById('permissionsList');
  container.innerHTML = '';
  
  users.forEach(user => {
    const card = createPermissionCard(user);
    container.appendChild(card);
  });
  
  document.getElementById('permissionsLoading').style.display = 'none';
  container.style.display = 'block';
}

// Jogosultság kártya
function createPermissionCard(user) {
  const card = document.createElement('div');
  card.className = 'card mb-3';
  card.innerHTML = `
    <div class="card-body">
      <h5 class="card-title">${user.profiles.email}</h5>
      
      <div class="row">
        <div class="col-md-6">
          <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" 
              id="perm_infosharer_${user.user_id}"
              ${user.can_view_infosharer ? 'checked' : ''}
              onchange="updatePermission('${user.user_id}', 'can_view_infosharer', this.checked)">
            <label class="form-check-label" for="perm_infosharer_${user.user_id}">
              📂 Infosharer láthatóság
            </label>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" 
              id="perm_admin_${user.user_id}"
              ${user.can_view_admin_panel ? 'checked' : ''}
              onchange="updatePermission('${user.user_id}', 'can_view_admin_panel', this.checked)">
            <label class="form-check-label" for="perm_admin_${user.user_id}">
              🔧 Admin panel láthatóság
            </label>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" 
              id="perm_manage_admins_${user.user_id}"
              ${user.can_manage_admins ? 'checked' : ''}
              onchange="updatePermission('${user.user_id}', 'can_manage_admins', this.checked)">
            <label class="form-check-label" for="perm_manage_admins_${user.user_id}">
              👑 Admin jogok kezelése
            </label>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" 
              id="perm_gdrive_${user.user_id}"
              ${user.can_manage_google_drive ? 'checked' : ''}
              onchange="updatePermission('${user.user_id}', 'can_manage_google_drive', this.checked)">
            <label class="form-check-label" for="perm_gdrive_${user.user_id}">
              🔗 Google Drive kezelés
            </label>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" 
              id="perm_releases_${user.user_id}"
              ${user.can_manage_releases ? 'checked' : ''}
              onchange="updatePermission('${user.user_id}', 'can_manage_releases', this.checked)">
            <label class="form-check-label" for="perm_releases_${user.user_id}">
              🚀 Releases Manager
            </label>
          </div>
        </div>
      </div>
    </div>
  `;
  return card;
}

// Jogosultság frissítése
async function updatePermission(userId, permissionKey, value) {
  try {
    const { error } = await supabase
      .from('user_permissions')
      .update({ [permissionKey]: value })
      .eq('user_id', userId);
    
    if (error) throw error;
    
    showToast('Jogosultság frissítve!', 'success');
  } catch (err) {
    console.error('Permission update error:', err);
    showToast('Hiba történt!', 'error');
  }
}
```

#### ✅ TODO-7: Nav.js frissítése - Admin panel láthatóság ellenőrzése
**Fájl:** `assets/js/nav.js`

```javascript
// Admin panel link megjelenítése csak akkor, ha van jogosultság
async function updateAdminLink() {
  const user = globalAuth?.getCurrentUser();
  if (!user) {
    // Nincs bejelentkezve -> admin link elrejtése
    hideAdminLink();
    return;
  }
  
  const permissions = globalAuth?.getUserPermissions();
  if (permissions?.can_view_admin_panel) {
    showAdminLink();
  } else {
    hideAdminLink();
  }
}

function showAdminLink() {
  const adminLink = document.querySelector('a[href*="secret/admin"]');
  if (adminLink) adminLink.style.display = 'block';
}

function hideAdminLink() {
  const adminLink = document.querySelector('a[href*="secret/admin"]');
  if (adminLink) adminLink.style.display = 'none';
}
```

---

### FÁZIS 5: Admin Panel - További Modulok Védelme

#### ✅ TODO-8: Google Drive kezelés védelem
**Fájl:** `secret/admin/index.html` (Google Drive szekció)

```javascript
async function initGoogleDriveSection() {
  const user = globalAuth?.getCurrentUser();
  const permissions = globalAuth?.getUserPermissions();
  
  if (!permissions?.can_manage_google_drive) {
    document.getElementById('googleDriveSection').innerHTML = `
      <div class="alert alert-warning">
        ⚠️ Nincs jogosultságod a Google Drive kezeléséhez.
      </div>
    `;
    return;
  }
  
  // Normál betöltés...
}
```

#### ✅ TODO-9: Releases Manager védelem
**Fájl:** `secret/releases/index.html`

```javascript
// Oldal betöltéskor jogosultság ellenőrzése
window.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  
  const user = globalAuth?.getCurrentUser();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }
  
  const permissions = globalAuth?.getUserPermissions();
  if (!permissions?.can_manage_releases) {
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger">
          ❌ Nincs jogosultságod a Releases Manager eléréséhez.
        </div>
        <a href="/index.html" class="btn btn-primary">Vissza a főoldalra</a>
      </div>
    `;
    return;
  }
  
  // Normál betöltés...
});
```

---

### FÁZIS 6: Tesztelés & Dokumentáció

#### ✅ TODO-10: SQL migration futtatása Supabase-en
1. Futtasd le: `database/infosharer-user-texts-table.sql`
2. Futtasd le: `database/user-permissions-table.sql`
3. Ellenőrizd: `SELECT * FROM infosharer_user_texts;`
4. Ellenőrizd: `SELECT * FROM user_permissions;`

#### ✅ TODO-11: Első admin user jogosultságainak beállítása

```sql
-- Super admin létrehozása (minden jog)
UPDATE user_permissions
SET 
  can_view_infosharer = TRUE,
  can_view_admin_panel = TRUE,
  can_manage_admins = TRUE,
  can_manage_google_drive = TRUE,
  can_manage_releases = TRUE
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'xxhaltiruxx@gmail.com');
```

#### ✅ TODO-12: Manuális tesztelés
- [ ] Új user regisztráció → automatikusan kap text box-ot és permissions-t
- [ ] Infosharer: saját szöveg szerkesztése működik
- [ ] Infosharer: publikus látogatók csak olvashatnak
- [ ] Admin panel: "Jogok" szekció látható
- [ ] Jogosultságok módosítása real-time működik
- [ ] Nav.js: Admin link csak jogosultaknak látszik
- [ ] Google Drive: csak jogosultak kezelhetik
- [ ] Releases Manager: csak jogosultak látják

#### ✅ TODO-13: Dokumentáció frissítése
**Új fájl:** `docs/USER-PERMISSIONS-GUIDE.md`

Tartalom:
- Rendszer áttekintése
- Jogosultságok típusai
- Admin panel használata
- SQL példák

---

## 🚀 Telepítési Sorrend

1. **Adatbázis migráció** (TODO-1, TODO-2)
2. **Auth modul frissítés** (TODO-3)
3. **Infosharer átírás** (TODO-4, TODO-5)
4. **Admin panel új szekció** (TODO-6)
5. **Navigáció frissítés** (TODO-7)
6. **Modul védelmek** (TODO-8, TODO-9)
7. **Tesztelés** (TODO-10 → TODO-13)

---

## ⚠️ Breaking Changes

- A régi `infosharer` tábla (`id=1`) már nem használt
- Minden user saját szöveget kap
- Régi közös szöveg migráció szükséges (ha van)

---

## 📌 Megjegyzések

- RLS policy-k gondosan tesztelve legyenek
- Real-time subscription user alapú legyen
- Admin jogok hierarchikus ellenőrzése
- Publikus hozzáférés ne engedjen módosítást

---

**Készítette:** GitHub Copilot  
**Dátum:** 2026-01-15  
**Verzió:** 1.0
