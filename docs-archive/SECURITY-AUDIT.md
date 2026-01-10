# 🔒 Biztonsági Audit - Agazati Projekt

## Érzékeny Adatok Helyzete

### ✅ BIZTONSÁGBAN (Supabase-ben, RLS-sel védve)
- **Google Drive konfiguráció**: `app_config` tábla, RLS: csak admin
  - FOLDER_ID
  - CLIENT_ID
  - CLIENT_SECRET
  - REFRESH_TOKEN

### ⚠️ PUBLIKUS (szükséges frontend-nek)
- **Supabase URL**: `https://ccpuoqrbmldunshaxpes.supabase.co`
  - Nem titok, minden kliens ismeri
  - RLS-sel védett az összes adat

- **Supabase ANON_KEY**: hardkódolt az összes JS-ben
  - Nem titok, csak olvasási jog, RLS-sel védett
  - Elég a frontend authentikációhoz

### ✅ KÓDBÓL ELTÁVOLÍTOTT
- **Docs** → `docs-archive/` mappába szervezve
- **README-k** → `docs-archive/` mappába szervezve

## Ajánlások

### 1. Deployment-nél
```bash
# Soha ne commitolj:
- Google Drive SERVICE ACCOUNT JSON-t
- Magánkulcsokat
- Database backup-okat
```

### 2. Environment Variables (.gitignore)
```gitignore
# Credentials
*.json
.env*
secrets/
```

### 3. Supabase RLS Politika
```sql
-- app_config tábla: csak admin férhet hozzá
SELECT * FROM app_config; -- RLS: csak is_admin=true
```

### 4. GitHub Actions / CI/CD
Ha van, akkor:
- SUPABASE_ADMIN_KEY → GitHub Secrets
- Soha ne logoljál tokent

## Ellenőrzési Checklist

- [x] Google Drive creds Supabase-ben (RLS-sel)
- [x] Supabase URL publikus (normális)
- [x] Supabase ANON_KEY publikus (csak frontend)
- [x] Dokumentáció archívozva
- [ ] .gitignore frissítése szükséges
- [ ] Production environment ellenőrzése

## Lehetséges Biztonsági Problémák

### Alacsony Kockázat
- Supabase ANON_KEY publikus → Normális, RLS-sel védett
- FOLDER_ID ismert → OK, nem szükséges titok

### Nulla Kockázat Mostanra
- ✅ Google Drive SECRET már nincs leírva sehol
- ✅ Összes cred Supabase app_config-ban van
- ✅ RLS-sel védett admin-csak hozzáférés

## A Jövőben
- Csinálj .env.example fájlt az lokális fejlesztéshez
- Soha nem commit-oland .env-t
- Supabase admin panelből admin key-t sosem copy-paste-elj

---
**Utolsó frissítés**: 2026-01-10  
**Audit Status**: ✅ Elfogadható biztonsági szint
