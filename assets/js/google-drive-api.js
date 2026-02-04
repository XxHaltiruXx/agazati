// ====================================
// GOOGLE DRIVE API INTEGRÁCIÓ - OAuth2
// ====================================

/**
 * Google Drive API modul az Infosharer alkalmazáshoz
 * KÖZPONTI Google Drive mappát használ OAuth2 REFRESH TOKEN-nel
 * Admin egyszer bejelentkezik, ezután automatikus token frissítés
 * 
 * KONFIGURÁCIÓ: A refresh token Supabase-ben van tárolva, nem a kódban!
 */

import { loadGoogleDriveConfig, saveGoogleDriveConfig } from './google-drive-config-manager.js';
import { getSupabaseClient } from './supabase-client.js';

// Globális változók
let GOOGLE_CONFIG = null; // Supabase-ből töltődik be
let accessToken = null;
let tokenExpiryTime = null;
let supabaseClient = null; // Supabase client referencia

// ====================================
// INICIALIZÁLÁS
// ====================================

/**
 * Supabase client beállítása (ezt az infosharer.js hívja meg)
 */
function setSupabaseClient(supabase) {
  supabaseClient = supabase;
  console.log('✓ Supabase client beállítva a Google Drive API számára');
}

/**
 * Google API library inicializálása
 * A konfiguráció Supabase-ből töltődik be
 */
async function initializeGoogleDrive(supabase = null) {
  if (supabase) {
    setSupabaseClient(supabase);
  }

  // Ha nincs még beállítva, használjuk a megosztott singleton klienst
  if (!supabaseClient) {
    supabaseClient = await getSupabaseClient();
  }

  if (!supabaseClient) {
    throw new Error('Supabase client nincs beállítva!');
  }

  // Konfiguráció betöltése Supabase-ből
  try {
    GOOGLE_CONFIG = await loadGoogleDriveConfig(supabaseClient);
    if (GOOGLE_CONFIG) {
      console.log('✓ Google Drive konfiguráció betöltve Supabase-ből');
    } else {
      console.warn('⚠️ Google Drive konfiguráció nem található Supabase-ben');
      return null;
    }
  } catch (error) {
    console.error('❌ Google Drive konfiguráció betöltési hiba:', error);
    return null; // Ne dobjunk hibát, kezelje a hívó (UI jelzi a hiányt)
  }

  // Ha van refresh token, szerezzünk access token-t
  if (GOOGLE_CONFIG.REFRESH_TOKEN) {
    try {
      await refreshAccessToken();
      console.log('✓ Google Drive API inicializálva OAuth2-vel');
    } catch (error) {
      console.error('❌ OAuth2 token frissítési hiba:', error);
      console.warn('⚠️ Admin bejelentkezés szükséges!');
    }
  } else {
    console.warn('⚠️ Nincs refresh token - admin bejelentkezés szükséges!');
  }
}

// ====================================
// AUTENTIKÁCIÓ - OAUTH2
// ====================================

/**
 * OAuth2 bejelentkezési popup (admin használja egyszer)
 * @param {boolean} forceConsent - Ha true, mindig kéri újra az engedélyeket
 */
async function signInWithOAuth2(forceConsent = false) {
  if (!GOOGLE_CONFIG) {
    throw new Error('Google Drive konfiguráció nincs betöltve!');
  }

  // Base path meghatározása (GitHub Pages vagy alkönyvtár esetén)
  const basePath = (() => {
    const pathname = window.location.pathname;
    if (pathname.includes('/agazati/')) {
      return '/agazati/';
    }
    return '/';
  })();
  
  const redirectUri = `${window.location.origin}${basePath}auth-callback.html`;
  console.log('🔗 OAuth redirect URI:', redirectUri);
  
  // Scope-ok: Drive API + UserInfo (email lekéréséhez)
  // FONTOS: 'drive' scope kell (nem csak 'drive.readonly') hogy MINDEN fájlt lásson,
  // még azokat is, amiket nem ez az app töltött fel!
  const defaultScopes = [
    'https://www.googleapis.com/auth/drive',  // Teljes hozzáférés (látja az összes fájlt)
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  const scopes = GOOGLE_CONFIG.SCOPES || defaultScopes;
  const scope = Array.isArray(scopes) ? scopes.join(' ') : scopes;
  
  // Prompt: consent = mindig kéri az engedélyeket, select_account = fiók választó
  const prompt = forceConsent ? 'consent' : 'select_account';
  console.log(`🔐 OAuth prompt mode: ${prompt}${forceConsent ? ' (FORCE RE-AUTH)' : ''}`);
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CONFIG.CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` +
    `&prompt=${prompt}`;

  // Popup ablak
  const width = 500;
  const height = 600;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  const popup = window.open(
    authUrl,
    'Google OAuth2',
    `width=${width},height=${height},left=${left},top=${top}`
  );

  if (!popup) {
    throw new Error('Popup blokkolva! Engedélyezd a popup-okat ezen az oldalon.');
  }

  // Várunk az auth code-ra
  return new Promise((resolve, reject) => {
    // 2 perces timeout
    const timeout = setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      if (popup && !popup.closed) {
        popup.close();
      }
      reject(new Error('Bejelentkezés időtúllépés (2 perc)'));
    }, 120000);

    const messageHandler = async (event) => {
      if (event.data.type === 'GOOGLE_AUTH_CODE') {
        clearTimeout(timeout);
        window.removeEventListener('message', messageHandler);
        
        if (popup && !popup.closed) {
          popup.close();
        }

        try {
          // Auth code → Refresh token
          await exchangeCodeForTokens(event.data.code);
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    };

    window.addEventListener('message', messageHandler);
  });
}

/**
 * Authorization code cseréje access + refresh token-re
 */
async function exchangeCodeForTokens(code) {
  // Base path meghatározása (ugyanaz mint a signInWithOAuth2-ben)
  const basePath = (() => {
    const pathname = window.location.pathname;
    if (pathname.includes('/agazati/')) {
      return '/agazati/';
    }
    return '/';
  })();
  
  const redirectUri = `${window.location.origin}${basePath}auth-callback.html`;
  console.log('🔄 Token exchange redirect URI:', redirectUri);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code: code,
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    throw new Error(`Token exchange hiba: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiryTime = Date.now() + (data.expires_in * 1000);

  // Refresh token mentése Supabase-be
  if (data.refresh_token) {
    GOOGLE_CONFIG.REFRESH_TOKEN = data.refresh_token;
    await saveGoogleDriveConfig(supabaseClient, GOOGLE_CONFIG);
    console.log('✓ Refresh token mentve Supabase-be');
  }

  console.log('✓ OAuth2 autentikáció sikeres');
}

/**
 * Access token frissítése refresh token-nel
 */
async function refreshAccessToken() {
  if (!GOOGLE_CONFIG.REFRESH_TOKEN) {
    throw new Error('Nincs refresh token - bejelentkezés szükséges!');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      refresh_token: GOOGLE_CONFIG.REFRESH_TOKEN,
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw new Error(`Token refresh hiba: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiryTime = Date.now() + (data.expires_in * 1000);
  
  console.log('✓ Access token frissítve');
  return accessToken;
}

/**
 * Token ellenőrzés és frissítés ha lejárt
 */
async function ensureValidToken() {
  if (!accessToken || !tokenExpiryTime || Date.now() >= tokenExpiryTime - 60000) {
    console.log('🔄 Token lejárt vagy nincs, frissítés...');
    await refreshAccessToken();
  }
}

async function signInToGoogleDrive() {
  await ensureValidToken();
  return accessToken;
}

function signOutFromGoogleDrive() {
  console.log('ℹ️ API Key mód - nincs kijelentkezés');
}

function isGoogleDriveAuthenticated() {
  return accessToken !== null && GOOGLE_CONFIG !== null;
}

// ====================================
// FÁJL MŰVELETEK
// ====================================

async function uploadFileToGoogleDrive(file, fileName, progressCallback = null) {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  // Token ellenőrzés és frissítés
  await ensureValidToken();

  try {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: fileName,
      mimeType: file.type || 'application/octet-stream',
      parents: [GOOGLE_CONFIG.FOLDER_ID]
    };

    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const contentType = file.type || 'application/octet-stream';
          const base64Data = btoa(
            new Uint8Array(e.target.result)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', true);
          xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
          xhr.setRequestHeader('Content-Type', 'multipart/related; boundary=' + boundary);

          if (progressCallback) {
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                progressCallback((event.loaded / event.total) * 100);
              }
            });
          }

          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
              const response = JSON.parse(xhr.responseText);
              console.log('✓ Fájl feltöltve:', response.id);
              resolve(response);
            } else {
              console.error('❌ Feltöltési hiba részletek:', {
                status: xhr.status,
                statusText: xhr.statusText,
                response: xhr.responseText
              });
              reject(new Error(`Feltöltési hiba: ${xhr.status} - ${xhr.responseText}`));
            }
          };

          xhr.onerror = () => reject(new Error('Hálózati hiba'));
          xhr.send(multipartRequestBody);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Fájl olvasási hiba'));
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error('Feltöltési hiba:', error);
    throw error;
  }
}

/**
 * Chunked feltöltés Google Drive-ra (MB-onként)
 * Erőforrás-takarékos feltöltés nagy fájlokhoz
 * @param {File} file - A feltöltendő fájl
 * @param {string} fileName - A fájl neve
 * @param {Function} progressCallback - Progress callback (0-100%)
 * @param {number} chunkSize - Chunk méret bytes-ban (alapértelmezett: 1MB)
 */
async function uploadFileToGoogleDriveChunked(file, fileName, progressCallback = null, chunkSize = 1024 * 1024) {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  // Token ellenőrzés
  await ensureValidToken();

  try {
    const totalChunks = Math.ceil(file.size / chunkSize);
    console.log(`[GD] Chunked upload start: ${fileName} (${totalChunks} chunk, ${(file.size / (1024*1024)).toFixed(1)}MB)`);

    // 1. Fájl metaadatok - Google Drive fájl létrehozása
    const metadata = {
      name: fileName,
      mimeType: file.type || 'application/octet-stream',
      parents: [GOOGLE_CONFIG.FOLDER_ID]
    };

    const createFileResponse = await fetch('https://www.googleapis.com/drive/v3/files?uploadType=media', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!createFileResponse.ok) {
      throw new Error(`Fájl létrehozási hiba: ${createFileResponse.status}`);
    }

    const fileData = await createFileResponse.json();
    const fileId = fileData.id;
    console.log(`[GD] Fájl létrehozva: ${fileId}`);

    // 2. Chunkokra bontás és feltöltés
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      // Progress callback
      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      if (progressCallback) {
        progressCallback(progress);
      }

      console.log(`[GD] Chunk feltöltés: ${chunkIndex + 1}/${totalChunks} (${progress}%)`);

      // Chunk feltöltése
      const uploadResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': file.type || 'application/octet-stream',
            'Content-Range': `bytes ${start}-${end - 1}/${file.size}`
          },
          body: chunk
        }
      );

      if (!uploadResponse.ok && uploadResponse.status !== 200 && uploadResponse.status !== 201) {
        // 308 = Resume Incomplete, 200/201 = Success
        if (uploadResponse.status !== 308) {
          throw new Error(`Chunk feltöltési hiba: ${uploadResponse.status}`);
        }
      }
    }

    // 3. Végleges fájl adatok lekérése
    const finalResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType,createdTime`,
      {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      }
    );

    if (!finalResponse.ok) {
      throw new Error(`Fájl adat lekérési hiba: ${finalResponse.status}`);
    }

    const result = await finalResponse.json();
    console.log(`[GD] Chunked upload befejezve: ${fileId} (${totalChunks} chunk)`);

    return {
      ...result,
      chunks: totalChunks,
      chunkSize: chunkSize
    };
  } catch (error) {
    console.error('Chunked feltöltési hiba:', error);
    throw error;
  }
}

async function downloadFileFromGoogleDrive(fileId) {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  // Token ellenőrzés és frissítés
  await ensureValidToken();

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Letöltési hiba: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Letöltési hiba:', error);
    throw error;
  }
}

async function deleteFileFromGoogleDrive(fileId) {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  // Token ellenőrzés és frissítés
  await ensureValidToken();

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Törlési hiba: ${response.status}`);
    }

    console.log('✓ Fájl törölve:', fileId);
  } catch (error) {
    console.error('Törlési hiba:', error);
    throw error;
  }
}

async function getFileMetadata(fileId) {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  await ensureValidToken();

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webContentLink,webViewLink`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Metadata hiba: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Metadata hiba:', error);
    throw error;
  }
}

async function listFilesInGoogleDrive() {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  // Token ellenőrzés és frissítés
  await ensureValidToken();

  try {
    const query = encodeURIComponent(`'${GOOGLE_CONFIG.FOLDER_ID}' in parents and trashed=false`);
    let allFiles = [];
    let pageToken = null;
    
    // Pagináció - több oldal betöltése ha szükséges
    do {
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime)&pageSize=1000&orderBy=name${pageToken ? `&pageToken=${pageToken}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`List hiba: ${response.status}`);
      }

      const data = await response.json();
      const files = data.files || [];
      allFiles = allFiles.concat(files);
      
      console.log(`✓ ${files.length} fájl betöltve (összesen: ${allFiles.length})`);
      
      // Következő oldal token
      pageToken = data.nextPageToken;
    } while (pageToken);
    
    console.log(`✓ Végső eredmény: ${allFiles.length} fájl listázva`);
    return allFiles;
  } catch (error) {
    console.error('Listázási hiba:', error);
    throw error;
  }
}

async function renameFile(fileId, newName) {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  await ensureValidToken();

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newName
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Átnevezési hiba: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✓ Fájl átnevezve: ${data.name}`);
    return data;
  } catch (error) {
    console.error('Átnevezési hiba:', error);
    throw error;
  }
}

async function createPublicLink(fileId) {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  await ensureValidToken();

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });

    if (!response.ok) {
      throw new Error(`Permission hiba: ${response.status}`);
    }

    const metadata = await getFileMetadata(fileId);
    return metadata.webContentLink || metadata.webViewLink;
  } catch (error) {
    console.error('Publikus link hiba:', error);
    throw error;
  }
}

function getDirectDownloadLink(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Ellenőrzi és beállítja a publikus hozzáférést ha még nincs beállítva
 * @param {string} fileId - A fájl ID-ja
 * @returns {Promise<boolean>} - Sikeres volt-e
 */
async function ensurePublicAccess(fileId) {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  await ensureValidToken();

  try {
    // Ellenőrizzük a meglévő jogosultságokat
    const permissionsResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (permissionsResponse.ok) {
      const permissions = await permissionsResponse.json();
      // Ellenőrizzük hogy van-e már "anyone" jogosultság
      const hasPublicAccess = permissions.permissions?.some(
        p => p.type === 'anyone' && p.role === 'reader'
      );
      
      if (hasPublicAccess) {
        return true; // Már publikus
      }
    }

    // Ha nincs publikus hozzáférés, beállítjuk
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Publikus hozzáférés beállítása sikertelen:', error);
    return false;
  }
}

// ====================================
// USER INFO LEKÉRÉSE
// ====================================

/**
 * Bejelentkezett Google felhasználó információinak lekérése
 */
async function getUserInfo() {
  try {
    // Ellenőrizzük, hogy van-e GOOGLE_CONFIG
    if (!GOOGLE_CONFIG || !GOOGLE_CONFIG.REFRESH_TOKEN) {
      console.warn('⚠️ Nincs Google Drive konfiguráció vagy refresh token');
      return null;
    }
    
    // Frissítjük a tokent ha szükséges
    await refreshAccessToken();
    
    if (!accessToken) {
      console.warn('⚠️ Nincs érvényes access token');
      return null;
    }
    
    // Google UserInfo API hívás
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Ha 401 Unauthorized, lehet hogy új bejelentkezés kell
      if (response.status === 401) {
        console.warn('⚠️ Unauthorized - új bejelentkezés szükséges');
        return null;
      }
      throw new Error(`UserInfo lekérés sikertelen: ${response.status}`);
    }
    
    const userInfo = await response.json();
    // userInfo tartalmazza: email, name, picture, id, stb.
    console.log('✓ User info sikeresen lekérve:', userInfo.email);
    return userInfo;
    
  } catch (error) {
    console.error('❌ Google UserInfo lekérési hiba:', error);
    return null;
  }
}

/**
 * Fájl keresése az ÖSSZES Google Drive fájl között név alapján
 * (Diagnosztikai célra - megkeresi, hogy a fájl melyik mappában van)
 * @param {string} fileName - A keresett fájl neve
 * @param {boolean} includeTrashed - Keresés a törölt fájlok között is
 * @returns {Promise<Array>} - Találatok tömbje (fájl + parent mappa információkkal)
 */
async function searchFileByName(fileName, includeTrashed = false) {
  if (!isGoogleDriveAuthenticated()) {
    throw new Error('Google Drive nem inicializálva');
  }

  await ensureValidToken();

  try {
    // Keresés: fájlnév TARTALMAZZA a keresett stringet
    const trashedCondition = includeTrashed ? '' : ' and trashed=false';
    const query = encodeURIComponent(`name contains '${fileName}'${trashedCondition}`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,parents,createdTime,modifiedTime,trashed)&pageSize=100`;
    
    console.log(`🔍 Keresés: "${fileName}" (töröltek: ${includeTrashed ? 'IGEN' : 'NEM'})`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Keresési hiba: ${response.status}`);
    }

    const data = await response.json();
    console.log(`🔍 "${fileName}" keresési eredmény: ${data.files.length} találat`);
    
    if (data.files.length === 0) {
      console.warn(`⚠️ Nem található "${fileName}" nevű fájl a Google Drive-on!`);
      return [];
    }
    
    // Minden találathoz lekérjük a szülő mappa nevét
    const filesWithParentInfo = await Promise.all(
      data.files.map(async (file) => {
        if (file.parents && file.parents.length > 0) {
          try {
            const parentId = file.parents[0];
            const parentUrl = `https://www.googleapis.com/drive/v3/files/${parentId}?fields=id,name`;
            const parentResponse = await fetch(parentUrl, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (parentResponse.ok) {
              const parentData = await parentResponse.json();
              return {
                ...file,
                parentName: parentData.name,
                parentId: parentData.id
              };
            }
          } catch (e) {
            console.warn(`⚠️ Nem sikerült lekérni a szülő mappát: ${file.parents[0]}`);
          }
        }
        return file;
      })
    );
    
    filesWithParentInfo.forEach(file => {
      console.log(`  📄 ${file.name}`);
      console.log(`     ID: ${file.id}`);
      console.log(`     Mappa: ${file.parentName || 'Ismeretlen'} (${file.parentId || file.parents?.[0] || 'N/A'})`);
      console.log(`     Törölve: ${file.trashed ? '🗑️ IGEN' : '✅ NEM'}`);
      console.log(`     Létrehozva: ${new Date(file.createdTime).toLocaleString('hu-HU')}`);
    });
    
    return filesWithParentInfo;
  } catch (error) {
    console.error('Keresési hiba:', error);
    throw error;
  }
}

// ====================================
// EXPORT
// ====================================

export {
  initializeGoogleDrive,
  setSupabaseClient,
  signInToGoogleDrive,
  signInWithOAuth2,
  signOutFromGoogleDrive,
  isGoogleDriveAuthenticated,
  uploadFileToGoogleDrive,
  uploadFileToGoogleDriveChunked,
  downloadFileFromGoogleDrive,
  deleteFileFromGoogleDrive,
  getFileMetadata,
  listFilesInGoogleDrive,
  renameFile,
  createPublicLink,
  getDirectDownloadLink,
  ensurePublicAccess,
  getUserInfo,
  searchFileByName
};

// Config getter (debugging)
export function getConfig() {
  return GOOGLE_CONFIG;
}
