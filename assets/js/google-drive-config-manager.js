// ====================================
// GOOGLE DRIVE CONFIG MANAGER
// Kulcsok biztonságos tárolása Supabase-ben
// ====================================

/**
 * Ez a modul kezeli a Google Drive API kulcsokat
 * A kulcsok Supabase-ben vannak tárolva, nem a frontend kódban
 * Csak admin felhasználók férhetnek hozzá
 */

// Supabase config tábla neve
const CONFIG_TABLE = 'app_config';
const CONFIG_KEY_GOOGLE_DRIVE = 'google_drive_config';

// Cache a konfigurációnak (ne kérdezzük le minden alkalommal)
let configCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 perc

/**
 * Google Drive konfiguráció betöltése Supabase-ből
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<object>} Google Drive konfiguráció
 */
async function loadGoogleDriveConfig(supabase) {
  try {
    // Ellenőrizzük a cache-t
    if (configCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      console.log('✓ Google Drive konfiguráció cache-ből betöltve');
      return configCache;
    }

    console.log('🔄 Google Drive konfiguráció betöltése Supabase-ből...');

    // Lekérjük a konfigurációt Supabase-ből
    // Egyszerű listázás 1 sorra limitálva – elkerüli a 406-os hibát
    const { data, error } = await supabase
      .from(CONFIG_TABLE)
      .select('value')
      .eq('key', CONFIG_KEY_GOOGLE_DRIVE)
      .limit(1);

    if (error) {
      console.error('❌ Konfiguráció betöltési hiba:', error);
      return null;
    }

    if (!data || data.length === 0 || !data[0].value) {
      console.warn('⚠️ Google Drive konfiguráció nem található (üres tábla)');
      return null;
    }

    // Parse JSON
    const config = typeof data[0].value === 'string' ? JSON.parse(data[0].value) : data[0].value;

    // Validáljuk a konfigurációt (ha nem null)
    validateConfig(config);

    // Cache-eljük
    configCache = config;
    cacheTimestamp = Date.now();

    console.log('✓ Google Drive konfiguráció sikeresen betöltve');
    return config;
  } catch (error) {
    console.error('❌ Google Drive konfiguráció betöltési hiba:', error);
    throw error;
  }
}

/**
 * Konfiguráció validálása
 */
function validateConfig(config) {
  const requiredFields = ['FOLDER_ID', 'CLIENT_ID', 'CLIENT_SECRET'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Hiányzó konfiguráció: ${field}`);
    }
  }

  // Ellenőrizzük, hogy nem maradtak benne placeholder értékek
  if (config.CLIENT_ID.includes('YOUR_') || config.CLIENT_ID === '') {
    throw new Error('CLIENT_ID nincs beállítva');
  }

  if (config.CLIENT_SECRET.includes('YOUR_') || config.CLIENT_SECRET === '') {
    throw new Error('CLIENT_SECRET nincs beállítva');
  }

  if (config.FOLDER_ID.includes('YOUR_') || config.FOLDER_ID === '') {
    throw new Error('FOLDER_ID nincs beállítva');
  }
}

/**
 * Google Drive konfiguráció mentése Supabase-be (csak adminok)
 * @param {object} supabase - Supabase client instance
 * @param {object} config - Google Drive konfiguráció objektum
 */
async function saveGoogleDriveConfig(supabase, config) {
  try {
    console.log('💾 Google Drive konfiguráció mentése Supabase-be...');

    // Validáljuk a konfigurációt mentés előtt
    validateConfig(config);

    // Upsert a konfigurációt
    const { error } = await supabase
      .from(CONFIG_TABLE)
      .upsert({
        key: CONFIG_KEY_GOOGLE_DRIVE,
        value: config,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.error('❌ Konfiguráció mentési hiba:', error);
      throw error;
    }

    // Frissítjük a cache-t
    configCache = config;
    cacheTimestamp = Date.now();

    console.log('✓ Google Drive konfiguráció sikeresen mentve');
    return true;
  } catch (error) {
    console.error('❌ Google Drive konfiguráció mentési hiba:', error);
    throw error;
  }
}

/**
 * Cache törlése (pl. kijelentkezéskor)
 */
function clearConfigCache() {
  configCache = null;
  cacheTimestamp = null;
  console.log('🗑️ Google Drive konfiguráció cache törölve');
}

/**
 * Tesztelési mód konfiguráció
 * CSAK FEJLESZTÉSHEZ! Éles környezetben töröld ezt!
 */
function getTestConfig() {
  console.warn('⚠️ FIGYELEM: Tesztelési konfiguráció használata! Éles környezetben töröld ezt!');
  return {
    FOLDER_ID: 'YOUR_FOLDER_ID_HERE',
    SERVICE_ACCOUNT_JSON: {
      type: 'service_account',
      project_id: 'YOUR_PROJECT_ID',
      private_key: 'YOUR_PRIVATE_KEY',
      client_email: 'YOUR_SERVICE_ACCOUNT_EMAIL',
      token_uri: 'https://oauth2.googleapis.com/token'
    }
  };
}

// ====================================
// EXPORT
// ====================================

export {
  loadGoogleDriveConfig,
  saveGoogleDriveConfig,
  clearConfigCache,
  getTestConfig,
  CONFIG_TABLE,
  CONFIG_KEY_GOOGLE_DRIVE
};
