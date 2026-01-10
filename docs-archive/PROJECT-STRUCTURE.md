# 🗂️ Agazati Projekt Struktúra

## 📊 Teljes Projekt Térképe

```
agazati/
├── 🎓 TANÍTÁSI TARTALOM
│   ├── html/                    # HTML tananyag
│   ├── css/                     # CSS tananyag
│   ├── python/                  # Python tananyag
│   ├── math/                    # Matematika tananyag
│   └── network/                 # Hálózatok tananyag
│
├── 💻 ALKALMAZÁS KÓDJA
│   ├── index.html               # Főoldal
│   ├── auth-callback.html       # OAuth callback
│   ├── 404.html                 # Hibakezelés
│   ├── assets/
│   │   ├── js/                  # JavaScript modulok
│   │   │   ├── supabase-client.js         # Singleton Supabase
│   │   │   ├── google-drive-api.js        # Google Drive OAuth
│   │   │   ├── storage-adapter.js         # Tárolási absztrakció
│   │   │   ├── infosharer.js              # Fájlmegosztás
│   │   │   ├── supabase-auth.js           # Autentikáció
│   │   │   └── ...
│   │   ├── css/                 # Stíluslapok
│   │   ├── images/              # Képek
│   │   ├── fonts/               # Betűtípusok
│   │   └── components/          # HTML komponensek
│   │
│   └── secret/                  # ADMIN SZEKCIÓ
│       ├── admin/               # Admin panel (felhasználókezelés)
│       ├── infosharer/          # Fájlmegosztás (admin)
│       └── releases/            # Release kezelés
│
├── 🔐 BIZTONSÁGI & KONFIGURÁCIÓS FÁJLOK
│   ├── .env.example             # ✅ Szokott fájl (commitolható)
│   ├── .env.local               # ❌ TITKOS (gitignore-ban)
│   ├── .gitignore               # Git biztonsági lista
│   └── LICENSE                  # MIT Licenc
│
├── 📚 DOKUMENTÁCIÓ
│   ├── docs/
│   │   ├── INDEX.md             # 🔗 Adatbázis dokumentáció index
│   │   └── (SQL fájlok: supabase-create-*.sql, stb)
│   │
│   └── docs-archive/            # 📖 ÖSSZES DOKUMENTÁCIÓ
│       ├── README.md                           # Archívum index
│       ├── SETUP-CHECKLIST.md                  # 🚀 Telepítési útmutató
│       ├── SECURITY-AUDIT.md                   # 🔐 Biztonsági audit
│       ├── GOOGLE-DRIVE-*.md                   # Google Drive útmutatók (6 fájl)
│       ├── SUPABASE-*.md                       # Supabase útmutatók (6 fájl)
│       ├── AUTH-*.md                           # Autentikáció útmutatók (3 fájl)
│       ├── OAUTH-*.md                          # OAuth útmutatók (2 fájl)
│       ├── ADMIN-*.md                          # Admin útmutatók (4 fájl)
│       ├── *-FIX*.md                           # Hibajavítás útmutatók (6 fájl)
│       └── ...
│
├── 🗄️ ADATBÁZIS
│   └── database/
│       ├── supabase-setup-*.sql                # Setup SQL-ek
│       ├── *-RLS*.sql                          # Row-Level Security SQL
│       ├── ADMIN-*.sql                         # Admin SQL-ek
│       ├── CHECK-*.sql                         # Ellenőrzési SQL
│       ├── REALTIME-*.sql                      # Valósidejű SQL
│       └── ...
│
├── 📄 ROOT DOKUMENTÁCIÓ
│   ├── README.md                # 🎯 Projekt főoldala
│   └── sitemap.xml              # XML sitemap (SEO)
│
└── 🔧 FEJLESZTŐI ESZKÖZÖK
    └── scripts/
        └── remove-comments.cjs  # Komment eltávolítási script
```

---

## 📋 Fájl Kategóriák

### 🎓 Tanítási Tartalom (Commitolható)
```
html/          - HTML tananyag
css/           - CSS tananyag
python/        - Python tananyag
math/          - Matematika tananyag
network/       - Hálózatok tananyag
```

### 💻 Alkalmazás Kódja (Commitolható)
```
assets/        - CSS, JS, képek
index.html     - Főoldal
auth-callback.html - OAuth callback
secret/        - Admin szekciók (RLS-sel védett)
```

### 🔐 TITKOS FÁJLOK (NE COMMITOLD!)
```
❌ .env
❌ .env.local
❌ .env.production
❌ credentials.json
❌ service-account*.json
❌ secrets/
```

Ezek **gitignore-ban** vannak: `cat .gitignore`

### 📚 Dokumentáció (Commitolható)
```
docs/              - 🔗 Adatbázis index & SQL
docs-archive/      - 📖 Összes útmutató (31 fájl)
.env.example       - 📋 Szokott fájl (sablon)
.gitignore         - 🔐 Biztonsági lista
```

### 🔧 Fejlesztői (Commitolható)
```
scripts/           - Automatizációs scriptjei
database/          - SQL fájlok
LICENSE            - MIT Licenc
```

---

## 📖 Dokumentáció Útmutató

### 🚀 Kezdőknek: SETUP-CHECKLIST.md
```bash
Lásd: docs-archive/SETUP-CHECKLIST.md
```

Sorrendben:
1. Repository klónozása
2. .env.local beállítása
3. Supabase inicializálása
4. Google Drive (opcionális)
5. Teszt
6. Deployment

### 🔐 Biztonsági Ellenőrzés: SECURITY-AUDIT.md
```bash
Lásd: docs-archive/SECURITY-AUDIT.md
```

Verifikálja:
- API kulcsok helye
- RLS politikák
- Credential védelem
- Best practices

### 🗄️ Adatbázis SQL: INDEX.md
```bash
Lásd: docs/INDEX.md
```

Az összes `.sql` script futtatásának sorrendje

### 📱 Integrációk
- **Google Drive**: `docs-archive/GOOGLE-DRIVE-QUICKSTART.md`
- **OAuth**: `docs-archive/OAUTH-QUICK-GUIDE.md`
- **Supabase**: `docs-archive/SUPABASE-SETUP.md`

---

## 🔗 Gyorsnavigáció

| Cél | Hely |
|-----|------|
| 📚 **Új fejlesztő** | → `docs-archive/SETUP-CHECKLIST.md` |
| 🚨 **Probléma** | → `docs-archive/` (keress `.md`-ben) |
| 🔒 **Biztonság** | → `docs-archive/SECURITY-AUDIT.md` |
| 🗄️ **Adatbázis** | → `docs/INDEX.md` |
| 🌐 **Google Drive** | → `docs-archive/GOOGLE-DRIVE-QUICKSTART.md` |
| 🔑 **Auth/OAuth** | → `docs-archive/AUTH-FIX-README.md` |
| 📦 **Verziók** | → `docs-archive/RELEASES.md` |

---

## ✅ Biztonsági Ellenőrzés Checklist

- [ ] `.env` és `.env.local` **NEM** vannak commitolva
- [ ] `.gitignore` megvédi az összes credential-t
- [ ] `docs-archive/SECURITY-AUDIT.md` elolvasva
- [ ] Supabase **RLS politikák** aktívak
- [ ] Google Drive **OAuth** megfelelően beállítva
- [ ] Admin **jelszava** erős

---

## 🎯 Projekt Filozófiája

```
1. BIZTONSÁG: Titkos adatok nem a kódban
2. SZERVEZETTSÉG: Dokumentáció archívumba
3. TISZTASÁG: Git csak szükséges fájlok
4. ÁTLÁTHATÓSÁG: Minden .md-ben dokumentált
5. TELJESSÉG: Semmi sem hiányzik a deploy-hoz
```

---

## 📞 Gyorsreferencia

**Bejelentkezés nem működik?**
```bash
→ docs-archive/AUTH-FIX-README.md
→ docs/INDEX.md (SQL check-policies)
```

**Google Drive 406 Error?**
```bash
→ docs-archive/GOOGLE-DRIVE-OAUTH2-SETUP.md
→ Ellenőrizd az admin session-t
```

**Adatbázis problémák?**
```bash
→ docs/INDEX.md
→ docs-archive/SUPABASE-SETUP.md
```

**Hiányzik valami?**
```bash
→ Keress az docs-archive/ mappában
→ Lásd: docs-archive/README.md
```

---

🎉 **Gratulálunk!** Az Agazati projekt teljes mértékben dokumentált és szervezett.
