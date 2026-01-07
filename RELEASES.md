# GitHub Releases Verziókezelés

## Áttekintés

Ez az alkalmazás automatikusan ellenőrzi, hogy van-e új verzió elérhető a GitHub Releases oldalon. Ha új verzió jelenik meg, a felhasználók értesítést kapnak az oldal jobb felső sarkában.

## Működés

### Automatikus Ellenőrzés

- Az alkalmazás **24 óránként** ellenőrzi a GitHub Releases API-t
- Az első ellenőrzés az oldal betöltésekor történik
- Az eredmények cachelve vannak a böngésző localStorage-ában

### Verzió Összehasonlítás

A rendszer szemantikus verziókezelést (Semantic Versioning) használ:
- Formátum: `MAJOR.MINOR.PATCH` (pl. `1.4.3`)
- A `v` prefix automatikusan eltávolításra kerül (pl. `v1.5.0` → `1.5.0`)
- A verziók számszerűen kerülnek összehasonlításra

### Értesítés

Ha új verzió érhető el:
- Megjelenik egy értesítés az oldal jobb felső sarkában
- Az értesítés tartalmazza az új verzió számát
- Egy "Részletek" link a GitHub Release oldalra mutat
- Az értesítés 10 másodperc után automatikusan eltűnik
- Manuálisan is bezárható az × gombbal

## Új Release Létrehozása GitHub-on

### 1. Lépés: Navigálj a Repository-hoz

Menj a GitHub repository főoldalára: `https://github.com/XxHaltiruXx/agazati`

### 2. Lépés: Releases Oldal

1. Kattints a jobb oldali sidebar "Releases" linkjére
2. Vagy menj közvetlenül: `https://github.com/XxHaltiruXx/agazati/releases`

### 3. Lépés: Új Release Létrehozása

1. Kattints a **"Draft a new release"** gombra
2. Töltsd ki az űrlapot:

#### Tag verzió
- **Tag verzió:** `v1.5.0` (mindig növekvő számok!)
- Formátum: `vMAJOR.MINOR.PATCH`
- Példák: `v1.4.4`, `v1.5.0`, `v2.0.0`

#### Release Cím
- **Title:** `Version 1.5.0` vagy `Verzió 1.5.0 - Új funkciók`

#### Leírás (Description)
Markdown formátumban írd le a változásokat:

```markdown
## 🎉 Új funkciók
- Automatikus verzióellenőrzés
- GitHub Releases integráció
- Verzió értesítések

## 🐛 Hibajavítások
- Footer megjelenítési problémák
- Cache kezelés javítása

## 🔧 Fejlesztések
- Teljesítmény optimalizálás
- Kód refaktorálás
```

#### Opciók
- ✅ **Set as the latest release** - Ha ez a legújabb stabil verzió
- ⬜ **Set as a pre-release** - Ha ez béta/teszt verzió

3. Kattints a **"Publish release"** gombra

### 4. Lépés: Kód Frissítése

**FONTOS:** Ne felejtsd el frissíteni a `footer.js` fájlban az `APP_VERSION` konstanst!

```javascript
const APP_VERSION = "1.5.0"; // Frissítsd az új verzióra
```

Commit és push:
```bash
git add assets/js/footer.js
git commit -m "Update version to 1.5.0"
git push origin main
```

## Verzió Számozási Útmutató

### MAJOR (1.x.x)
Nagy változások, amelyek nem kompatibilisek az előző verzióval:
- Teljes újratervezés
- API változások
- Új framework vagy technológia

### MINOR (x.1.x)
Új funkciók, visszafelé kompatibilisen:
- Új oldalak vagy szekciók
- Új funkciók hozzáadása
- Jelentős fejlesztések

### PATCH (x.x.1)
Hibajavítások és apró fejlesztések:
- Bug fix-ek
- Stílus javítások
- Teljesítmény optimalizálás
- Dokumentáció frissítés

## Példa Release Timeline

```
v1.0.0 - Kezdeti kiadás
v1.1.0 - Új quiz funkció
v1.1.1 - Quiz bug javítások
v1.2.0 - HTML runner hozzáadása
v1.3.0 - Teljes footer újratervezés
v1.4.0 - Responsive fejlesztések
v1.4.1 - CSS hibajavítások
v1.4.2 - Commit tracking hozzáadása
v1.4.3 - Jelenlegi verzió
v1.5.0 - GitHub Releases integráció ⬅️ Következő
```

## Hasznos GitHub CLI Parancsok

Ha használod a GitHub CLI-t (`gh`):

```bash
# Új release létrehozása
gh release create v1.5.0 --title "Version 1.5.0" --notes "Release notes here"

# Latest release megtekintése
gh release view --web

# Összes release listázása
gh release list
```

## Troubleshooting

### "Még nincs release a repository-ban"
- Ellenőrizd, hogy létrehoztál-e már release-t a GitHub-on
- Várj pár percet, amíg a GitHub API frissül

### Nem jelenik meg az értesítés
- Töröld a böngésző cache-ét és localStorage-ét
- Ellenőrizd a böngésző konzolt (F12) hibákért
- Győződj meg róla, hogy az új release verziószáma nagyobb a jelenlegi `APP_VERSION`-nál

### 404 hiba a GitHub API-tól
- Ellenőrizd a repository nevét és tulajdonosát a `footer.js`-ben
- Győződj meg róla, hogy a repository publikus

## localStorage Kulcsok

Az alkalmazás az alábbi kulcsokat használja:
- `agazati_latestVersion` - Legutóbbi verzió a GitHub-ról
- `agazati_versionCheckTs` - Utolsó ellenőrzés időbélyege
- `agazati_lastCommitISO` - Utolsó commit dátuma
- `agazati_lastCommitFormatted` - Formázott commit dátum
- `agazati_lastCheckTs` - Commit ellenőrzés időbélyege
- `agazati_skipUntilTs` - Ellenőrzés kihagyása időbélyegig

## További Információk

- [GitHub Releases Dokumentáció](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)
- [GitHub REST API - Releases](https://docs.github.com/en/rest/releases)
