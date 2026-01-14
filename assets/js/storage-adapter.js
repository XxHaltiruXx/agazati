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
      
      // Láthatósági szűrés - csak azokat a fájlokat mutatjuk, amik láthatóak az Infoshareren
      try {
        const { data: visibilityData, error: visError } = await this.supabase
          .from('google_drive_file_visibility')
          .select('file_id, visible_on_infosharer')
          .eq('visible_on_infosharer', true);
        
        if (visError) {
          console.warn('Láthatósági adatok betöltési hiba:', visError);
          // Ha hiba van, minden fájlt megmutatunk (fallback)
          return files.map(file => ({
            name: file.name,
            id: file.id,
            size: parseInt(file.size || 0),
            created_at: file.createdTime,
            updated_at: file.modifiedTime
          }));
        }
        
        // Látható fájlok ID-jainak listája
        const visibleFileIds = new Set(visibilityData.map(v => v.file_id));
        
        // Csak a látható fájlokat szűrjük ki
        const visibleFiles = files.filter(file => visibleFileIds.has(file.id));
        
        console.log(`Látható fájlok: ${visibleFiles.length}/${files.length}`);
        
        return visibleFiles.map(file => ({
          name: file.name,
          id: file.id,
          size: parseInt(file.size || 0),
          created_at: file.createdTime,
          updated_at: file.modifiedTime
        }));
      } catch (error) {
        console.error('Láthatósági szűrés hiba:', error);
        // Fallback: minden fájlt megmutatunk
        return files.map(file => ({
          name: file.name,
          id: file.id,
          size: parseInt(file.size || 0),
          created_at: file.createdTime,
          updated_at: file.modifiedTime
        }));
      }
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

  /**
   * Slot szám kinyerése fájlnévből
   * @param {string} fileName - Fájlnév
   * @returns {number|null} - Slot szám vagy null
   */
  getSlotNumber(fileName) {
    const match = fileName.match(/^slot(\d+)_/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Eredeti fájlnév kinyerése (slot prefix nélkül)
   * @param {string} fileName - Teljes fájlnév
   * @returns {string} - Eredeti fájlnév
   */
  getOriginalFileName(fileName) {
    return fileName.replace(/^slot\d+_/, '');
  }

  /**
   * Következő szabad slot szám megkeresése
   * @returns {Promise<number>} - Következő szabad slot szám
   */
  async getNextAvailableSlot() {
    const allFiles = await this.listAllFiles(); // Minden fájl, láthatósági szűrés nélkül
    const usedSlots = allFiles
      .map(file => this.getSlotNumber(file.name))
      .filter(slot => slot !== null)
      .sort((a, b) => a - b);

    // Keressük meg a legkisebb nem használt slot számot
    let nextSlot = 1;
    for (const slot of usedSlots) {
      if (slot === nextSlot) {
        nextSlot++;
      } else if (slot > nextSlot) {
        break;
      }
    }

    return nextSlot;
  }

  /**
   * Összes fájl listázása (láthatósági szűrés NÉLKÜL)
   * @returns {Promise<Array>} - Minden fájl
   */
  async listAllFiles() {
    if (this.provider === 'supabase') {
      const { data, error } = await this.supabase.storage
        .from(SUPABASE_CONFIG.bucketName)
        .list("");

      if (error) throw error;
      return data || [];
    } else if (this.provider === 'googledrive') {
      const files = await GoogleDrive.listFilesInGoogleDrive();
      
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
   * Automatikus slot számozás - manuálisan feltöltött fájlokhoz
   * @param {string} fileId - Google Drive fájl ID
   * @param {string} fileName - Eredeti fájlnév
   * @returns {Promise<void>}
   */
  async autoAssignSlot(fileId, fileName) {
    // Ha már van slot prefix, nem csinálunk semmit
    if (this.getSlotNumber(fileName) !== null) {
      return;
    }

    const nextSlot = await this.getNextAvailableSlot();
    const newFileName = `slot${nextSlot}_${fileName}`;

    console.log(`🎰 Automatikus slot hozzárendelés: ${fileName} -> ${newFileName}`);

    // Google Drive-on átnevezzük a fájlt
    try {
      await GoogleDrive.renameFile(fileId, newFileName);
      
      // Frissítjük a fileIdMap-et
      delete this.fileIdMap[fileName];
      this.fileIdMap[newFileName] = fileId;
      this.saveFileIdMap();
    } catch (error) {
      console.error('Slot hozzárendelési hiba:', error);
      throw error;
    }
  }

  /**
   * Slotok átszámozása láthatóság alapján
   * Csak a látható fájlok kapnak slot számot, folytonosan 1-től
   * @returns {Promise<void>}
   */
  async renumberSlots() {
    const allFiles = await this.listAllFiles();
    
    // Lekérjük a láthatósági információkat
    const { data: visibilityData, error } = await this.supabase
      .from('google_drive_file_visibility')
      .select('file_id, visible_on_infosharer');
    
    if (error) {
      console.error('Láthatósági adatok betöltési hiba:', error);
      return;
    }

    // Map: fileId -> láthatóság
    const visibilityMap = new Map();
    visibilityData.forEach(v => visibilityMap.set(v.file_id, v.visible_on_infosharer));

    // Szét válogatjuk a fájlokat: látható vs rejtett
    const visibleFiles = [];
    const hiddenFiles = [];

    for (const file of allFiles) {
      const isVisible = visibilityMap.get(file.id);
      const slotNumber = this.getSlotNumber(file.name);
      const originalName = this.getOriginalFileName(file.name);

      if (isVisible) {
        visibleFiles.push({ ...file, slotNumber, originalName });
      } else {
        hiddenFiles.push({ ...file, slotNumber, originalName });
      }
    }

    // Látható fájlokat slot szám szerint rendezünk
    visibleFiles.sort((a, b) => (a.slotNumber || 999) - (b.slotNumber || 999));

    // Átszámozzuk a látható fájlokat folytonosan 1-től
    const renamePromises = [];
    for (let i = 0; i < visibleFiles.length; i++) {
      const file = visibleFiles[i];
      const targetSlot = i + 1;

      if (file.slotNumber !== targetSlot) {
        const newFileName = `slot${targetSlot}_${file.originalName}`;
        console.log(`📝 Átszámozás: ${file.name} -> ${newFileName}`);
        
        renamePromises.push(
          GoogleDrive.renameFile(file.id, newFileName).then(() => {
            delete this.fileIdMap[file.name];
            this.fileIdMap[newFileName] = file.id;
          })
        );
      }
    }

    // Rejtett fájlokról eltávolítjuk a slot prefix-et
    for (const file of hiddenFiles) {
      if (file.slotNumber !== null) {
        const newFileName = file.originalName;
        console.log(`🔒 Slot eltávolítás (rejtett): ${file.name} -> ${newFileName}`);
        
        renamePromises.push(
          GoogleDrive.renameFile(file.id, newFileName).then(() => {
            delete this.fileIdMap[file.name];
            this.fileIdMap[newFileName] = file.id;
          })
        );
      }
    }

    // Végrehajtjuk az összes átnevezést
    await Promise.all(renamePromises);
    this.saveFileIdMap();

    console.log(`✓ Slot átszámozás kész: ${visibleFiles.length} látható, ${hiddenFiles.length} rejtett`);
  }

  /**
   * Tárhelyhasználat számítása (látható + rejtett külön)
   * @returns {Promise<object>} - { visibleUsed, hiddenUsed, totalUsed, maxCapacity }
   */
  async getStorageUsage() {
    const allFiles = await this.listAllFiles();
    const limits = this.getLimits();
    
    // Lekérjük a láthatósági információkat
    const { data: visibilityData, error } = await this.supabase
      .from('google_drive_file_visibility')
      .select('file_id, visible_on_infosharer');
    
    if (error) {
      console.warn('Láthatósági adatok betöltési hiba:', error);
      // Fallback: minden fájl látható
      const totalUsed = allFiles.reduce((sum, file) => sum + (file.size || 0), 0);
      return {
        visibleUsed: totalUsed,
        hiddenUsed: 0,
        totalUsed: totalUsed,
        maxCapacity: limits.maxTotalStorage,
        visibleFiles: allFiles.length,
        hiddenFiles: 0
      };
    }

    // Map: fileId -> láthatóság
    const visibilityMap = new Map();
    visibilityData.forEach(v => visibilityMap.set(v.file_id, v.visible_on_infosharer));

    let visibleUsed = 0;
    let hiddenUsed = 0;
    let visibleCount = 0;
    let hiddenCount = 0;

    for (const file of allFiles) {
      const isVisible = visibilityMap.get(file.id);
      const fileSize = file.size || 0;

      if (isVisible) {
        visibleUsed += fileSize;
        visibleCount++;
      } else {
        hiddenUsed += fileSize;
        hiddenCount++;
      }
    }

    return {
      visibleUsed,
      hiddenUsed,
      totalUsed: visibleUsed + hiddenUsed,
      maxCapacity: limits.maxTotalStorage,
      availableForVisible: limits.maxTotalStorage - visibleUsed, // Csak a látható számít
      visibleFiles: visibleCount,
      hiddenFiles: hiddenCount
    };
  }
}

// ====================================
// EXPORT
// ====================================

// Singleton instance
const storageAdapter = new StorageAdapter(STORAGE_PROVIDER);

export default storageAdapter;
export { StorageAdapter, STORAGE_PROVIDER, STORAGE_LIMITS };
