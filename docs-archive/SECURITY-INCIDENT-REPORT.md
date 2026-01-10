# 🚨 BIZTONSÁGI INCIDENT REPORT

## Dátum
2026. január 10.

## Probléma
GitHub Secret Scanning felismert **Google OAuth Client ID és Client Secret**-et a `database/google-drive-config-table.sql` fájlban.

### Azonosított Titkos Adatok:
- ✅ **Google OAuth Client ID** (90. sor)
- ✅ **Google OAuth Client Secret** (91. sor)

## Megoldás

### ✅ Már Elvégzett Lépések

1. **Fájl Korrekció**
   - [x] `database/google-drive-config-table.sql` - placeholder értékekre cserélve
   - [x] **FOLDER_ID**: `your-folder-id-here`
   - [x] **CLIENT_ID**: `your-client-id-here.apps.googleusercontent.com`
   - [x] **CLIENT_SECRET**: `your-client-secret-here`

2. **Git History Tisztítása**
   - [x] Commit amended - titkos adatok eltávolítva
   - [x] `.gitignore` frissítve - SQL fájlok védelem

3. **.gitignore Frissítés**
   ```
   database/*-config-table.sql
   database/*-credentials*.sql
   ```

### 🔑 Feltétlenül Szükséges Lépések

#### 1. AZONNAL: Google Cloud Console - Kulcsok Regenerálása
```
⚠️ A Google OAuth kulcsok már KOMPROMITTÁLTAK!

1. Menj ide: https://console.cloud.google.com/apis/credentials
2. Válaszd ki az "agazati" projektet
3. Kattints a "Regenerate Secret"-re
4. Másol az új értékeket
5. Frissítsd a Supabase `app_config`-ban
```

#### 2. AZONNAL: GitHub Repository - Force Push
```bash
cd agazati
git push --force-with-lease origin main
```

⚠️ **Figyelem**: Ez felülírja a GitHub históriát, de szükséges a titkos adatok eltávolításához!

#### 3. GitHub - Secret Scanning Ellenőrzés
```
1. Nyisd meg: https://github.com/XxHaltiruXx/agazati/settings/security
2. Kattints a "Secret scanning" →  "Push protection"
3. Ellenőrizd, hogy aktív-e
4. Nézd meg az "Alerts" szekciót
```

---

## 📋 Checklist

### Azonnali Feladatok (Ma!)
- [ ] Google OAuth kulcsok regenerálása
- [ ] GitHub force push (`git push --force-with-lease`)
- [ ] Supabase `app_config` frissítése új kulcsokkal
- [ ] Deploy tesztelése
- [ ] Ellenőrizz, hogy a Google Drive még működik-e

### Szervezési Feladatok
- [ ] Team tagok értesítése
- [ ] Dokumentáció frissítése
- [ ] Incident log mentése
- [ ] Audit log ellenőrzés

---

## 🔒 Jelenlegi Biztonsági Status

| Komponens | Státusz | Lépés |
|-----------|--------|------|
| 🔑 Google OAuth | ⚠️ KOMPROMITTÁLT | Regenerálni kell |
| 📝 SQL fájl | ✅ FIXELVE | Placeholder értékek |
| 🔐 .gitignore | ✅ FRISSÍTVE | Védett SQL fájlok |
| 📚 Dokumentáció | ✅ BIZTONSÁGGAL | SECURITY-AUDIT.md |
| 💾 Git History | ⏳ TISZTÍTÁS ALATT | Force push szükséges |

---

## 📖 Normalizálás Után

1. **SQL Fájlok Kezelése**
   ```sql
   -- database/google-drive-config-table.sql
   -- MINDIG placeholder értékeket tartalmaz
   -- Valódi értékek CSAK Supabase app_config-ban
   ```

2. **Deployment Process**
   - Szokott: `.env.example` → `.env.local` (fejlesztés)
   - Production: Environment variables → GitHub Secrets
   - Soha ne commitolj valós API key-eket!

3. **Prevention**
   - ✅ `.gitignore` - Credential védelem
   - ✅ Secret Scanning - GitHub Push Protection
   - ✅ Documentation - SECURITY-AUDIT.md

---

## 📞 Referenciák

### Dokumentáció
- [SECURITY-AUDIT.md](../docs-archive/SECURITY-AUDIT.md) - Teljes biztonsági audit
- [.env.example](../.env.example) - Environment sablon
- [.gitignore](../.gitignore) - Git biztonsági lista

### GitHub Guidance
- [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Push Protection](https://docs.github.com/en/code-security/secret-scanning/push-protection-custom-patterns)
- [Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

## ✅ Befejezés

**Köszönjük a GitHub Secret Scanning-nek, hogy megvéd a hibáktól!**

Ez a dokumentum az incident lezárásához: [Biztonsági Checklist](#-checklist) teljesítése szükséges.

---

**Prepared:** 2026-01-10
**Status:** 🔴 AKTÍV - AZONNALI LÉPÉSEK SZÜKSÉGESEK
**Priority:** 🔴 KRITIKUS
