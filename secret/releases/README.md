# 🚀 Release Manager

Professzionális GitHub Releases kezelő és verzióellenőrző admin felület.

## 📍 Elérhetőség

⚠️ **Védett oldal** - Bejelentkezés szükséges!

## 🔐 Bejelentkezés

- **Biztonságos:** SHA-256 hash-elt jelszó
- **Emlékezz rám** funkció elérhető
- **Site-wide login:** Szinkronizálva más admin oldalakkal
- localStorage + site-wide auth rendszer

## ✨ Funkciók

### 📊 Verzió Információk

#### Jelenlegi Verzió
- Mutatja az oldalon futó aktuális verziót
- Automatikusan betölti az `APP_VERSION` konstansból

#### Legújabb Release
- Lekéri a GitHub Releases API-ból
- Megjeleníti a verziószámot és publikálás dátumát
- Direct link a release oldalra

#### Státusz
- **Naprakész** - Ha a telepített verzió a legfrissebb
- **Frissítés elérhető** - Ha új verzió jelent meg
- **Nincs adat** - Ha még nincs release

### ⚡ Gyors Verziók

Három előre definiált verzió típus egy kattintással:

#### 🔧 PATCH (x.x.+1)
- Hibajavítások
- Apró fejlesztések
- Például: `1.4.3` → `1.4.4`

#### ✨ MINOR (x.+1.0)
- Új funkciók (visszafelé kompatibilis)
- Jelentős fejlesztések
- Például: `1.4.3` → `1.5.0`

#### 🎯 MAJOR (+1.0.0)
- Breaking changes
- Teljes újratervezés
- Például: `1.4.3` → `2.0.0`

### 🎨 Custom Verzió

- Egyedi verziószám megadása
- Validáció: `MAJOR.MINOR.PATCH` formátum
- Hibás formátum esetén figyelmeztetés

### 🎯 Kiválasztott Verzió

Verzió kiválasztása után megjelenik:

- **Nagy méretű verzió kijelzés**
- **Másolás gomb** - Vágólapra másolja a verziószámot
- **Release Létrehozása gomb** - GitHub-ra navigál előre kitöltött űrlappal

#### Részletes Útmutató

1. GitHub Release létrehozása
2. Tag beállítása (pl. `v1.5.0`)
3. Title megadása (pl. `Version 1.5.0`)
4. Leírás (changelog)
5. Kód frissítés (`APP_VERSION` konstans)

### 🗄️ Cache Kezelés

#### Megjelenített Információk:
- **Cached verzió** - localStorage-ban tárolt legújabb verzió
- **Utolsó ellenőrzés** - Timestamp az utolsó API hívásról
- **Commit dátum** - Utolsó commit dátuma

#### Műveletek:
- **👁️ Cache Megtekintése** - Konzolban megjeleníti az összes cache kulcsot
- **🗑️ Cache Törlése** - Töröl minden verzió és commit cache-t
- **🔔 Értesítés Tesztelése** - Próbaértesítés megjelenítése

## 🎨 Design

### Színséma
- **Accent:** `#7f5af0` (lila)
- **Accent Light:** `#a693ff` (világos lila)
- **Background Dark:** `#0a0a14`
- **Background Mid:** `#111122`
- **Text:** `#e4e4ff`
- **Muted:** `#888ab8`
- **Success:** `#45f0a0` (zöld)
- **Warning:** `#ffc107` (sárga)

### Komponensek
- **Info Cards** - Hover animációval
- **Version Buttons** - Gradient háttér, hover effect
- **Status Badges** - Színes státusz jelzők
- **Section Cards** - Keretezett szekciók
- **Release Guide** - Lépésről-lépésre útmutató

### Responsive
- Desktop: 3 oszlopos grid
- Tablet: 2 oszlopos
- Mobil: 1 oszlopos stack

## 🔧 Használt Technológiák

- **HTML5** - Szemantikus struktúra
- **CSS3** - Modern stílusok, animációk
- **JavaScript (ES6+)** - Modul rendszer, async/await
- **Bootstrap 5.3.3** - Grid system
- **GitHub API** - Releases endpoint
- **LocalStorage** - Perzisztens auth
- **SessionStorage** - Munkamenet auth

## 📁 Használt CSS Fájlok

Az oldal az alábbi CSS fájlokat használja:
- `assets/css/base.css` - Alap stílusok
- `assets/css/main.css` - Fő stílusok
- `assets/css/nav.css` - Navigáció
- `assets/css/utilities.css` - Segéd osztályok
- `assets/css/footer.css` - Footer + verzió értesítések
- `assets/css/infosharer.css` - Modális, gombok, színek

## 🔑 localStorage Kulcsok

| Kulcs | Leírás |
|-------|--------|
| `__agazati_login_state` | Site-wide login állapot (szinkronizálva más admin oldalakkal) |
| `__agazati_login_expiry` | Login lejárat timestamp (24 óra) |
| `releases_remember_token` | Remember me token (hash + expiry, 365 nap) |
| `agazati_latestVersion` | Cached legújabb verzió |
| `agazati_versionCheckTs` | Utolsó verzió ellenőrzés timestamp |
| `agazati_lastCommitISO` | Utolsó commit ISO dátum |
| `agazati_lastCommitFormatted` | Formázott commit dátum |

## 🚀 Workflow

### Új Release Kiadása

1. **Bejelentkezés** a Release Manager-be
2. **Verzió választás**:
   - Gyors gomb (PATCH/MINOR/MAJOR), vagy
   - Custom verzió megadása
3. **Másolás** - Verziószám vágólapra
4. **GitHub navigáció** - "Release Létrehozása" gomb
5. **Release kitöltése**:
   - Tag: `v1.5.0`
   - Title: `Version 1.5.0`
   - Description: Changelog
6. **Publish release**
7. **Kód frissítés**:
   ```javascript
   const APP_VERSION = "1.5.0";
   ```
8. **Commit & Push**
9. **Ellenőrzés** - Frissítés gomb a Manager-ben

### Verzió Tesztelése

1. **Cache törlése** az oldalon
2. **Értesítés tesztelése** gombbal
3. **Frissítés** gomb - Új adatok lekérése
4. **Státusz ellenőrzése**

## 🐛 Hibakezelés

### Nincs Release
- Megjelenik: "Nincs release"
- Útmutató: "Hozz létre egy release-t a GitHub-on"

### API Hiba
- Megjelenik: "Hiba" státusz
- Konzol error log
- Cached adatok használata (ha van)

### Érvénytelen Verzió
- Alert figyelmeztetés
- Formátum példa megjelenítése

## 📱 Reszponzivitás

### Desktop (>768px)
- 3 oszlopos info cards
- Inline version buttons
- Side-by-side actions

### Tablet (480-768px)
- 2 oszlopos layout
- Wrapped buttons
- Kompakt spacing

### Mobil (<480px)
- 1 oszlopos stack
- Full-width gombok
- Touch-friendly méretezés

## 🎯 Jövőbeli Fejlesztések

- [ ] Release notes automatikus generálás
- [ ] Verzió összehasonlítás (diff)
- [ ] Release history timeline
- [ ] Draft release mentés
- [ ] Automatikus changelog GitHubról
- [ ] Több repository támogatás
- [ ] Release statisztikák
- [ ] Email értesítések

## 📝 Megjegyzések

- Védett admin felület
- Sidebar-ban jelenik meg bejelentkezés után
- Integráció a főoldal footer.js-sel
- GitHub token NEM szükséges (public API)
- Rate limit: 60 request/óra (nem autentikált)

## 🔗 Kapcsolódó Fájlok

- `assets/js/footer.js` - Verzióellenőrzés logika
- `assets/css/footer.css` - Értesítés stílusok
- `RELEASES.md` - Release létrehozási útmutató
- `VERSION-IMPLEMENTATION.md` - Technikai dokumentáció

---

**Készítette:** GitHub Copilot  
**Verzió:** 1.0.0  
**Utolsó frissítés:** 2026. január 7.
