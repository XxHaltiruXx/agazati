// ====================================
// STORAGE ADAPTER RÉTEG
// ====================================

/**
 * Storage adapter az Infosharer-hez
 * Egységes interfész a különböző storage szolgáltatókhoz (Supabase, Google Drive)
 */

import * as GoogleDrive from './google-drive-api.js';
import { getSupabaseClient } from './supabase-client.js';

// ====================================
// KONFIGURÁCIÓ
// ====================================

// STORAGE PROVIDER: 'supabase' vagy 'googledrive'
const STORAGE_PROVIDER = 'googledrive'; // <-- Változtasd meg ezt a beállítást!

// Storage limitek provider szerint
const STORAGE_LIMITS = {
  supabase: {
    maxFileSize: 50 * 1024 * 1024, // 50 MB per file
    maxTotalStorage: 50 * 1024 * 1024, // 50 MB total
    name: 'Supabase'
  },
  googledrive: {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5 GB per file (API limit)
    maxTotalStorage: 15 * 1024 * 1024 * 1024, // 15 GB total (free tier)
    name: 'Google Drive'
  }
};

// Supabase konfiguráció (ha STORAGE_PROVIDER === 'supabase')
const SUPABASE_CONFIG = {
  url: "https://ccpuoqrbmldunshaxpes.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcHVvcXJibWxkdW5zaGF4cGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE2MDUsImV4cCI6MjA3ODA4NzYwNX0.QpVCmzF96Fp5hdgFyR0VkT9RV6qKiLkA8Yv_LArSk5I",
  bucketName: "infosharer-uploads"
};

// ====================================
// ADAPTER INTERFÉSZ
// ====================================

/**
 * Storage adapter osztály
 * Egységes interfészt biztosít a különböző storage szolgáltatókhoz
 */
class StorageAdapter {
  constructor(provider = STORAGE_PROVIDER) {
    this.provider = provider;
    this.actualProvider = provider; // Ténylegesen használt provider (fallback esetén változhat)
    this.supabase = null;
    this.fileIdMap = {}; // filename -> Google Drive fileId mapping
    this.initialized = false;
  }

  /**
   * Aktuális storage limitek lekérése
   */
  getLimits() {
    return STORAGE_LIMITS[this.actualProvider] || STORAGE_LIMITS.supabase;
  }

  /**
   * Provider név lekérése
   */
  getProviderName() {
    return this.getLimits().name;
  }

  /**
   * Adapter inicializálása
   */
  async initialize() {
    if (this.initialized) return;

    // Megosztott Supabase kliens használata (singleton)
    this.supabase = await getSupabaseClient();

    if (this.provider === 'supabase') {
      // Supabase inicializálás
      this.actualProvider = 'supabase';
      console.log('✓ Supabase Storage adapter inicializálva');
    } else if (this.provider === 'googledrive') {
      // Google Drive inicializálás próba
      try {
        await GoogleDrive.initializeGoogleDrive(this.supabase);
        this.actualProvider = 'googledrive';
        console.log('✓ Google Drive Storage adapter inicializálva (konfig Supabase-ből)');
        
        // Betöltjük a fájl ID map-et a localStorage-ból
        const savedMap = localStorage.getItem('infosharer_gdrive_filemap');
        if (savedMap) {
          try {
            this.fileIdMap = JSON.parse(savedMap);
          } catch (e) {
            console.error('FileIdMap betöltési hiba:', e);
            this.fileIdMap = {};
          }
        }
      } catch (error) {
        console.warn('⚠️ Google Drive inicializálás sikertelen, fallback Supabase-re:', error.message);
        this.actualProvider = 'supabase';
        console.log('✓ Fallback: Supabase Storage adapter aktiválva');
      }
    }

    this.initialized = true;
  }

  /**
   * Bejelentkezés a storage szolgáltatóba
   * Google Drive esetén Service Account-ot használ, így nincs interaktív bejelentkezés
   */
  async signIn() {
    if (this.provider === 'googledrive') {
      await GoogleDrive.signInToGoogleDrive();
      console.log('✓ Google Drive Service Account autentikáció aktív');
    }
    // Supabase esetén nincs külön storage bejelentkezés (a Supabase Auth kezeli)
  }

  /**
   * Kijelentkezés a storage szolgáltatóból
   * Google Drive Service Account esetén nem releváns
   */
  async signOut() {
    if (this.provider === 'googledrive') {
      // Service Account esetén nincs kijelentkezés
      console.log('ℹ️ Google Drive Service Account mód - nincs kijelentkezés');
    }
  }

  /**
   * Ellenőrzi, hogy be van-e jelentkezve
   * Google Drive Service Account esetén mindig true (ha inicializálva van)
   */
  isAuthenticated() {
    if (this.provider === 'googledrive') {
      return GoogleDrive.isGoogleDriveAuthenticated();
    }
    return true; // Supabase esetén mindig igaz (RLS kezeli a jogosultságokat)
  }

  /**
   * Fájl feltöltése
   * @param {File} file - A feltöltendő fájl
   * @param {string} fileName - A fájl neve a storage-ban
   * @param {Function} progressCallback - Progress callback (optional)
   * @returns {Promise<object>} - Fájl metadata
   */
  async uploadFile(file, fileName, progressCallback = null) {
    if (this.provider === 'supabase') {
      // Supabase feltöltés
      const { data, error } = await this.supabase.storage
        .from(SUPABASE_CONFIG.bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      return {
        fileName: fileName,
        path: data.path,
        size: file.size,
        mimeType: file.type,
        created_at: new Date().toISOString()
      };
    } else if (this.provider === 'googledrive') {
      // Google Drive feltöltés
      const result = await GoogleDrive.uploadFileToGoogleDrive(file, fileName, progressCallback);
      
      // Mentjük a fileId-t a fileName-hez
      this.fileIdMap[fileName] = result.id;
      this.saveFileIdMap();

      return {
        fileName: fileName,
        fileId: result.id,
        path: result.id,
        size: parseInt(result.size || file.size),
        mimeType: result.mimeType || file.type,
        created_at: result.createdTime || new Date().toISOString()
      };
    }
  }

  /**
   * Fájl letöltése
   * @param {string} fileName - A fájl neve
   * @returns {Promise<Blob>} - A fájl tartalma Blob-ként
   */
  async downloadFile(fileName) {
    if (this.provider === 'supabase') {
      // Supabase letöltés
      const { data, error } = await this.supabase.storage
        .from(SUPABASE_CONFIG.bucketName)
        .download(fileName);

      if (error) throw error;
      return data;
    } else if (this.provider === 'googledrive') {
      // Google Drive letöltés
      const fileId = this.fileIdMap[fileName];
      if (!fileId) {
        throw new Error(`Fájl nem található: ${fileName}`);
      }
      return await GoogleDrive.downloadFileFromGoogleDrive(fileId);
    }
  }

  /**
   * Fájl törlése
   * @param {string} fileName - A törlendő fájl neve
   */
  async deleteFile(fileName) {
    if (this.provider === 'supabase') {
      // Supabase törlés
      const { error } = await this.supabase.storage
        .from(SUPABASE_CONFIG.bucketName)
        .remove([fileName]);

      if (error) throw error;
    } else if (this.provider === 'googledrive') {
      // Google Drive törlés
      const fileId = this.fileIdMap[fileName];
      if (!fileId) {
        console.warn(`Fájl nem található a mapben: ${fileName}`);
        return;
      }
      
      await GoogleDrive.deleteFileFromGoogleDrive(fileId);
      
      // Töröljük a mapből
      delete this.fileIdMap[fileName];
      this.saveFileIdMap();
    }
  }

  /**
   * Összes fájl listázása
   * @returns {Promise<Array>} - Fájlok listája
   */
  async listFiles() {
    if (this.provider === 'supabase') {
      // Supabase lista
      const { data, error } = await this.supabase.storage
        .from(SUPABASE_CONFIG.bucketName)
        .list("");

      if (error) throw error;
      return data || [];
    } else if (this.provider === 'googledrive') {
      // Google Drive lista
      const files = await GoogleDrive.listFilesInGoogleDrive();
      
      // Frissítjük a fileIdMap-et
      files.forEach(file => {
        this.fileIdMap[file.name] = file.id;
      });
      this.saveFileIdMap();

      return files.map(file => ({
        name: file.name,
        id: file.id,
        size: parseInt(file.size || 0),
        created_at: file.createdTime,
        updated_at: file.modifiedTime
      }));
    }
  }

  /**
   * Publikus URL generálása egy fájlhoz
   * @param {string} fileName - A fájl neve
   * @returns {Promise<string>} - Publikus URL
   */
  async getPublicUrl(fileName) {
    if (this.provider === 'supabase') {
      // Supabase publikus URL
      const { data } = this.supabase.storage
        .from(SUPABASE_CONFIG.bucketName)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } else if (this.provider === 'googledrive') {
      // Google Drive publikus URL (képek előnézetéhez)
      const fileId = this.fileIdMap[fileName];
      if (!fileId) {
        throw new Error(`Fájl nem található: ${fileName}`);
      }
      
      // Először ellenőrizzük hogy publikus-e már a fájl
      try {
        await GoogleDrive.ensurePublicAccess(fileId);
      } catch (err) {
        console.warn('Publikus hozzáférés beállítása nem sikerült:', err);
      }
      
      // Thumbnail URL képekhez (előnézeti kép)
      // Ez működik publikus és privát fájlokhoz is ha van hozzáférés
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }

  /**
   * Letöltési URL generálása (signed URL)
   * @param {string} fileName - A fájl neve
   * @param {number} expiresIn - Lejárati idő másodpercekben (opcionális)
   * @returns {Promise<string>} - Signed URL
   */
  async getDownloadUrl(fileName, expiresIn = 3600) {
    if (this.provider === 'supabase') {
      // Supabase signed URL
      const { data, error } = await this.supabase.storage
        .from(SUPABASE_CONFIG.bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } else if (this.provider === 'googledrive') {
      // Google Drive közvetlen letöltési URL
      const fileId = this.fileIdMap[fileName];
      if (!fileId) {
        throw new Error(`Fájl nem található: ${fileName}`);
      }
      
      return GoogleDrive.getDirectDownloadLink(fileId);
    }
  }

  /**
   * FileIdMap mentése localStorage-ba (csak Google Drive esetén)
   */
  saveFileIdMap() {
    if (this.provider === 'googledrive') {
      try {
        localStorage.setItem('infosharer_gdrive_filemap', JSON.stringify(this.fileIdMap));
      } catch (e) {
        console.error('FileIdMap mentési hiba:', e);
      }
    }
  }

  /**
   * Fájl ellenőrzése (létezik-e)
   * @param {string} fileName - A fájl neve
   * @returns {Promise<boolean>} - true ha létezik
   */
  async fileExists(fileName) {
    try {
      if (this.provider === 'supabase') {
        const { data, error } = await this.supabase.storage
          .from(SUPABASE_CONFIG.bucketName)
          .list("", {
            search: fileName
          });

        if (error) return false;
        return data && data.length > 0;
      } else if (this.provider === 'googledrive') {
        const fileId = this.fileIdMap[fileName];
        if (!fileId) return false;

        try {
          await GoogleDrive.getFileMetadata(fileId);
          return true;
        } catch (e) {
          // Ha hiba van, a fájl nem létezik
          delete this.fileIdMap[fileName];
          this.saveFileIdMap();
          return false;
        }
      }
    } catch (e) {
      return false;
    }
  }

  /**
   * Fájl átnevezése/áthelyezése
   * @param {string} oldFileName - Régi fájlnév
   * @param {string} newFileName - Új fájlnév
   */
  async moveFile(oldFileName, newFileName) {
    if (this.provider === 'supabase') {
      // Supabase move
      const { error } = await this.supabase.storage
        .from(SUPABASE_CONFIG.bucketName)
        .move(oldFileName, newFileName);

      if (error) throw error;
    } else if (this.provider === 'googledrive') {
      // Google Drive esetén átnevezés
      // Letöltjük, feltöltjük új névvel, töröljük a régit
      const fileBlob = await this.downloadFile(oldFileName);
      
      // Létrehozunk egy új File objektumot
      const file = new File([fileBlob], newFileName, { type: fileBlob.type });
      
      // Feltöltjük az új fájlt
      await this.uploadFile(file, newFileName);
      
      // Töröljük a régit
      await this.deleteFile(oldFileName);
    }
  }
}

// ====================================
// EXPORT
// ====================================

// Singleton instance
const storageAdapter = new StorageAdapter(STORAGE_PROVIDER);

export default storageAdapter;
export { StorageAdapter, STORAGE_PROVIDER, STORAGE_LIMITS };
