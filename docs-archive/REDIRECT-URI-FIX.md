# redirect_uri_mismatch Hiba Javítása

## Mi a probléma?

Amikor az admin panelben megpróbálsz bejelentkezni a Google Drive-ba, ezeket a hibákat kaphatod:

```
Error 400: redirect_uri_mismatch
```

vagy

```
Nem jelentkezhet be ebbe az alkalmazásba, mert az app nem felel meg 
az OAuth 2.0-s verziójára vonatkozó Google-irányelveknek.

Request details: redirect_uri=https://xxhaltiruxx.github.io/auth-callback.html
```

Ez azt jelenti, hogy a Google Cloud Console-ban **nincs beállítva** vagy **rosszul van beállítva** a redirect URI.

## ⚠️ Gyakori hiba: Hiányzó /agazati/ rész

A leggyakoribb hiba, hogy **hiányzik az alkönyvtár neve** a redirect URI-ból!

**Helytelen:**
```
https://yourusername.github.io/auth-callback.html  ❌
```

**Helyes (ha a projekt az /agazati/ mappában van):**
```
https://yourusername.github.io/agazati/auth-callback.html  ✅
```

## Gyors megoldás

### 1. Nézd meg, milyen redirect URI-t használ az alkalmazás

1. Nyisd meg az admin panelt: `http://localhost:5500/secret/admin/` (vagy az éles URL-ed)
2. Nyisd meg a böngésző konzolt (F12)
3. Kattints a **🔗 Google Drive Bejelentkezés** gombra
4. A konzolban keresd meg ezt a sort:
   ```
   🔗 OAuth redirect URI: https://yourusername.github.io/agazati/auth-callback.html
   ```
5. Másold ki a teljes URI-t

**Példa kimenet:**
```
🔗 OAuth redirect URI: https://xxhaltiruxx.github.io/agazati/auth-callback.html
```
**Fontos:** Látható, hogy a `/agazati/` rész is benne van!

### 2. Állítsd be a Google Cloud Console-ban

1. Menj a [Google Cloud Console](https://console.cloud.google.com/) oldalra
2. Válaszd ki a projektedet
3. **APIs & Services** > **Credentials**
4. Kattints az **OAuth 2.0 Client ID**-ra (amit az Infosharer-hez hoztál létre)
5. Görgess le az **Authorized redirect URIs** részhez
6. Kattints az **+ ADD URI** gombra
7. Írd be a **PONTOS** redirect URI-t, amit az 1. lépésben láttál

**Példák különböző környezetekhez**:

#### Local development (VS Code Live Server):
```
http://localhost:5500/auth-callback.html
http://127.0.0.1:5500/auth-callback.html
```

#### GitHub Pages (ha az /agazati/ alkönyvtárban van):
```
https://yourusername.github.io/agazati/auth-callback.html
```
⚠️ **NE FELEDD:** Az `/agazati/` rész elengedhetetlen!

**Példa a te esetedben:**
```
https://xxhaltiruxx.github.io/agazati/auth-callback.html
```

#### Saját domain:
```
https://yourdomain.com/auth-callback.html
```

#### Ha a projekt egy alkönyvtárban van:
```
https://yourdomain.com/agazati/auth-callback.html
```

8. Kattints a **SAVE** gombra

### 3. Várj és próbáld újra

1. Várj **1-2 percet**, hogy a Google szerverek frissüljenek
2. Menj vissza az admin panelre
3. Kattints újra a **🔗 Google Drive Bejelentkezés** gombra
4. Most már működnie kell! ✅

## ⚠️ Fontos tudnivalók

### A redirect URI-nak PONTOSAN kell egyeznie

- **Protokoll**: `http://` ≠ `https://`
- **Port**: `http://localhost:5500` ≠ `http://localhost:3000`
- **Alkönyvtár**: `https://user.github.io/auth-callback.html` ≠ `https://user.github.io/agazati/auth-callback.html`
- **Végső slash**: `http://localhost:5500/auth-callback.html` ✅ (helyes)
- **Végső slash**: `http://localhost:5500/auth-callback.html/` ❌ (helytelen)
- **Case-sensitive**: Kis- és nagybetű számít!

### Automatikus base path észlelés

Az alkalmazás **automatikusan észleli** a base path-et:
- Ha a path tartalmazza az `/agazati/` részt, akkor hozzáadja a redirect URI-hez
- Így GitHub Pages és local development is működik
- A konzolban mindig látod, hogy milyen URI-t használ

### Felhasználóváltás

Ha már be vagy jelentkezve egy Google fiókkal, de másik fiókot szeretnél használni:

✅ **Az alkalmazás mostantól támogatja a felhasználóváltást!**

Amikor rákattintasz a **🔗 Google Drive Bejelentkezés** gombra:
- Megjelenik a Google account chooser
- Kiválaszthatod a már bejelentkezett fiókot
- **VAGY** bejelentkezhetsz egy másik Google fiókkal
- **VAGY** új fiókot adhatsz hozzá

Ez a `prompt=select_account` paraméterrel működik, amit az OAuth URL tartalmaz.

### Többszörös környezetek

Ha több környezetben is használod az alkalmazást (pl. local + éles), add hozzá **mind a redirect URI-ket** a Google Cloud Console-ban:

```
http://localhost:5500/auth-callback.html
http://127.0.0.1:5500/auth-callback.html
https://yourdomain.com/auth-callback.html
https://username.github.io/agazati/auth-callback.html
```

Így mindegyik környezetben működni fog!

## Ellenőrzés

A sikeres bejelentkezés után:

1. Az admin panelben a státusz **✅ Bejelentkezve** lesz
2. A böngésző konzolban nem lesz hiba
3. A Google Drive mappába feltölthetsz fájlokat

---

**Létrehozva**: 2026.01.14  
**Szerző**: Infosharer Development Team
