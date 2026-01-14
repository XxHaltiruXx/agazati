// ====================================
// KONSTANSOK ÉS KONFIGURÁCIÓ
// ====================================

// Storage Adapter import
import storageAdapter from './storage-adapter.js';
import { getSupabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-client.js';

const TABLE = "infosharer";
const ID = 1;
const BUCKET_NAME = "infosharer-uploads";

// Storage limitek - dinamikusan a storage adapter-től
let MAX_STORAGE_BYTES = 50 * 1024 * 1024; // Alapértelmezett
let MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // Alapértelmezett

// Cache a publikus URL-ekhez (hogy ne kelljen minden 3 másodpercben API hívást csinálni)
const publicUrlCache = new Map();

// Supabase kliens - megosztott példány használata
let supabase;
let globalAuth = null; // Auth instance from supabase-auth.js

async function initSupabase() {
  // Megosztott Supabase kliens használata (singleton)
  supabase = await getSupabaseClient();
  
  // Storage Adapter inicializálása
  await storageAdapter.initialize();
  
  // Storage limitek beállítása a használt provider alapján
  const limits = storageAdapter.getLimits();
  MAX_STORAGE_BYTES = limits.maxTotalStorage;
  MAX_FILE_SIZE_BYTES = limits.maxFileSize;
  
  // Dinamikus méret formázás a konzol kiíráshoz
  const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} kB`;
    } else {
      return `${bytes} B`;
    }
  };
  
  console.log(`📊 Storage limitek (${storageAdapter.getProviderName()}): ${formatSize(MAX_FILE_SIZE_BYTES)}/file, ${formatSize(MAX_STORAGE_BYTES)} összesen`);
}

// ====================================
// GLOBÁLIS VÁLTOZÓK
// ====================================

let canEdit = false;
let channelRef = null;
let currentSlot = null;
let currentFileInfoSlot = null;
let fileToDelete = null;
let fileChannel = null;
let slotMappings = {};
let totalStorageUsed = 0; // Bytes

// ====================================
// DOM ELEMEK
// ====================================

let ta, openPw;
let saveBtn, statusEl, copyBtn, copyBtn2, authBtns, mainBtns;
let logoutBtn;
let slotContainer, filesStatus;
let uploadModal, deleteModal, fileInfoModal;
let fileUploadInput, modalSlotTitle, selectedFileName, selectedFileSize;
let fileInfo, uploadProgress, uploadProgressBar, uploadProgressText;
let confirmUpload, deleteFileName, confirmDelete;

function initDOMElements() {
  // Szövegszerkesztő elemek
  ta = document.getElementById("shared");
  openPw = document.getElementById("openPw");
  saveBtn = document.getElementById("saveBtn");
  statusEl = document.getElementById("status");
  copyBtn = document.getElementById("copyBtn");
  copyBtn2 = document.getElementById("copyBtn2");
  authBtns = document.getElementById("authBtns");
  mainBtns = document.querySelector(".mainBtns");
  logoutBtn = document.getElementById("logoutBtn");

  // Fájlkezelés elemei
  slotContainer = document.getElementById("slotContainer");
  filesStatus = document.getElementById("filesStatus");
  uploadModal = new bootstrap.Modal(document.getElementById("uploadModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  fileInfoModal = new bootstrap.Modal(document.getElementById("fileInfoModal"));
  fileUploadInput = document.getElementById("fileUploadInput");
  modalSlotTitle = document.getElementById("modalSlotTitle");
  selectedFileName = document.getElementById("selectedFileName");
  selectedFileSize = document.getElementById("selectedFileSize");
  fileInfo = document.getElementById("fileInfo");
  uploadProgress = document.getElementById("uploadProgress");
  uploadProgressBar = document.getElementById("uploadProgressBar");
  uploadProgressText = document.getElementById("uploadProgressText");
  confirmUpload = document.getElementById("confirmUpload");
  deleteFileName = document.getElementById("deleteFileName");
  confirmDelete = document.getElementById("confirmDelete");
  
  // Keresősáv inicializálása
  initializeSearchBar();
}

// Keresősáv inicializálása
function initializeSearchBar() {
  const slotContainer = document.getElementById('slotContainer');
  if (!slotContainer || !slotContainer.parentElement) return;
  
  // Ellenőrizzük, hogy már létezik-e
  if (document.getElementById('infosharerSearchBar')) return;
  
  // Keresősáv létrehozása
  const searchContainer = document.createElement('div');
  searchContainer.id = 'infosharerSearchBar';
  searchContainer.style.cssText = `
    margin: 1.5rem auto;
    max-width: 600px;
    position: relative;
  `;
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.id = 'fileSearchInput';
  searchInput.placeholder = '🔍 Keresés fájlnév alapján...';
  searchInput.style.cssText = `
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 1rem;
    border: 2px solid rgba(127, 90, 240, 0.3);
    border-radius: 8px;
    background: rgba(127, 90, 240, 0.05);
    color: var(--text);
    font-size: 1rem;
    transition: all 0.3s ease;
  `;
  
  const clearButton = document.createElement('button');
  clearButton.innerHTML = '✕';
  clearButton.style.cssText = `
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--muted);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    display: none;
    transition: color 0.2s;
  `;
  clearButton.title = 'Törlés';
  
  // Focus/Blur effektek
  searchInput.addEventListener('focus', () => {
    searchInput.style.borderColor = 'var(--accent)';
    searchInput.style.boxShadow = '0 0 0 3px rgba(127, 90, 240, 0.1)';
  });
  
  searchInput.addEventListener('blur', () => {
    searchInput.style.borderColor = 'rgba(127, 90, 240, 0.3)';
    searchInput.style.boxShadow = 'none';
  });
  
  // Real-time keresés
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    filterSlots(query);
    
    // Clear gomb megjelenítése/elrejtése
    clearButton.style.display = query ? 'block' : 'none';
  });
  
  // Clear gomb esemény
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    clearButton.style.display = 'none';
    filterSlots('');
    searchInput.focus();
  });
  
  clearButton.addEventListener('mouseenter', () => {
    clearButton.style.color = 'var(--accent)';
  });
  
  clearButton.addEventListener('mouseleave', () => {
    clearButton.style.color = 'var(--muted)';
  });
  
  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(clearButton);
  
  // Beszúrás a slotContainer elé
  slotContainer.parentElement.insertBefore(searchContainer, slotContainer);
}

// Slot szűrés keresési lekérdezés alapján
function filterSlots(query) {
  const slotContainer = document.getElementById('slotContainer');
  if (!slotContainer) return;
  
  const slots = slotContainer.querySelectorAll('.col');
  let visibleCount = 0;
  
  slots.forEach(slot => {
    const card = slot.querySelector('.card');
    if (!card) return;
    
    // Fájlnév kinyerése
    const fileNameElement = card.querySelector('[style*="word-break"]');
    const fileName = fileNameElement ? fileNameElement.textContent.toLowerCase() : '';
    
    // Szűrés
    if (!query || fileName.includes(query)) {
      slot.style.display = '';
      visibleCount++;
      
      // Highlight a találatokra
      if (query && fileNameElement) {
        highlightText(fileNameElement, query);
      } else if (fileNameElement) {
        // Eredeti szöveg visszaállítása
        fileNameElement.innerHTML = fileNameElement.textContent;
      }
    } else {
      slot.style.display = 'none';
    }
  });
  
  // Találatok száma
  updateSearchResults(visibleCount, slots.length, query);
}

// Szöveg kiemelése
function highlightText(element, query) {
  const text = element.textContent;
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(query);
  
  if (index === -1) {
    element.innerHTML = text;
    return;
  }
  
  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);
  
  element.innerHTML = `${before}<span style="background: var(--accent); color: white; padding: 2px 4px; border-radius: 3px; font-weight: 600;">${match}</span>${after}`;
}

// Keresési eredmények frissítése
function updateSearchResults(visibleCount, totalCount, query) {
  const filesStatus = document.getElementById('filesStatus');
  if (!filesStatus || !query) return;
  
  if (visibleCount === 0) {
    setFilesStatus('error', `🔍 Nincs találat: "${query}"`);
  } else if (visibleCount < totalCount) {
    setFilesStatus('success', `🔍 ${visibleCount} / ${totalCount} fájl találat`);
  }
}

// ====================================
// SEGÉDFÜGGVÉNYEK
// ====================================

// SHA-256 hash függvény (már nem használt, de megtartjuk backward compatibilityért)
async function sha256hex(str) {
  const enc = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Fájl ikon alapján a kiterjesztés alapján
function getFileIcon(filename) {
  if (!filename) return "📁";
  const ext = filename.split(".").pop().toLowerCase();
  const icons = {
    pdf: "📕", doc: "📘", docx: "📘", xls: "📗", xlsx: "📗",
    ppt: "📓", pptx: "📓", txt: "📄", zip: "📦", rar: "📦",
    "7z": "📦", tar: "📦", gz: "📦", jpg: "🖼️", jpeg: "🖼️",
    png: "🖼️", gif: "🖼️", bmp: "🖼️", svg: "🖼️", webp: "🖼️",
    mp3: "🎵", wav: "🎵", ogg: "🎵", flac: "🎵", mp4: "🎬",
    avi: "🎬", mov: "🎬", mkv: "🎬", wmv: "🎬", flv: "🎬",
    exe: "⚙️", html: "🌐", htm: "🌐", css: "🎨", js: "📜",
    py: "🐍", java: "☕", cpp: "⚡", c: "⚡", json: "📋",
    xml: "📄", sql: "🗄️", psd: "🎨", ai: "✏️", sketch: "✏️",
    md: "📝", csv: "📊", rtf: "📄", dmg: "💿", iso: "💿",
  };
  return icons[ext] || "📁";
}

// Fájlméret formázása
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Egyedi rövid kód generálása
function generateShortCode(slotNumber, fileName) {
  const filePrefix = fileName.replace(/^slot\d+_/, '').substring(0, 3).toUpperCase();
  const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `S${slotNumber}-${filePrefix}${randomChars}`;
}

// ====================================
// ÁLLAPOTKEZELÉS
// ====================================

// Kapcsolat állapota
function setStatusFromState(state) {
  let s = (state || "").toString().toLowerCase();
  if (s === "closed" || s === "megszakadt" || s === "closedconnection") {
    statusEl.textContent = "Kapcsolat: megszakadt";
  } else if (s === "timed_out") {
    statusEl.textContent = "Kapcsolat: időtúllépés";
  } else if (s === "channel_error") {
    statusEl.textContent = "Kapcsolat: csatorna hiba";
  } else {
    statusEl.textContent = "Kapcsolat: élő";
  }
}

// Fájlok állapota
function setFilesStatus(state, message = "") {
  if (!filesStatus) return;
  
  let text = "";
  let color = "";
  
  switch (state) {
    case "loading":
      text = "⏳ Betöltés...";
      color = "var(--muted)";
      break;
    case "success":
      text = message || "✓ Sikeres";
      color = "var(--success)";
      break;
    case "error":
      text = message || "✗ Hiba történt";
      color = "var(--error)";
      break;
    default:
      text = message;
      color = "var(--text)";
  }
  
  filesStatus.textContent = text;
  filesStatus.style.color = color;
}

// Tárhelyhasználat számítása
async function calculateStorageUsage() {
  try {
    const usage = await storageAdapter.getStorageUsage();
    totalStorageUsed = usage.visibleUsed; // Csak a látható fájlok számítanak
    return usage;
  } catch (error) {
    console.error('Tárhelyhasználat számítási hiba:', error);
    // Fallback: számoljuk össze a slotMappings-ből
    totalStorageUsed = 0;
    Object.values(slotMappings).forEach(fileData => {
      if (fileData && fileData.metadata && fileData.metadata.size) {
        totalStorageUsed += fileData.metadata.size;
      }
    });
    return {
      visibleUsed: totalStorageUsed,
      hiddenUsed: 0,
      totalUsed: totalStorageUsed,
      maxCapacity: MAX_STORAGE_BYTES,
      availableForVisible: MAX_STORAGE_BYTES - totalStorageUsed,
      visibleFiles: Object.keys(slotMappings).length,
      hiddenFiles: 0
    };
  }
}

// Tárhelyhasználat frissítése a modal-ban
async function updateStorageDisplay() {
  const storageBar = document.getElementById('storageBar');
  const storageText = document.getElementById('storageText');
  const freeSpace = document.getElementById('freeSpace');
  
  if (!storageBar || !storageText || !freeSpace) return;
  
  // Dinamikus méretváltás: kB, MB vagy GB
  const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) {
      // GB
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (bytes >= 1024 * 1024) {
      // MB
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      // kB
      return `${(bytes / 1024).toFixed(2)} kB`;
    } else {
      // B
      return `${bytes} B`;
    }
  };

  // Lekérjük a részletes tárhely információkat
  const usage = await calculateStorageUsage();
  
  const usedDisplay = formatSize(usage.visibleUsed);
  const totalDisplay = formatSize(usage.maxCapacity);
  const freeDisplay = formatSize(usage.availableForVisible);
  const hiddenDisplay = formatSize(usage.hiddenUsed);
  
  const percentage = (usage.visibleUsed / usage.maxCapacity) * 100;
  
  storageBar.style.width = `${percentage}%`;
  
  // Frissített szöveg rejtett fájlok megjelenítésével
  if (usage.hiddenUsed > 0) {
    storageText.textContent = `${usedDisplay} / ${totalDisplay} (${hiddenDisplay} rejtett)`;
  } else {
    storageText.textContent = `${usedDisplay} / ${totalDisplay}`;
  }
  
  freeSpace.textContent = freeDisplay;
  
  // Színváltás a használat alapján
  if (percentage > 90) {
    storageBar.style.background = 'var(--error)';
    freeSpace.style.color = 'var(--error)';
  } else if (percentage > 70) {
    storageBar.style.background = 'orange';
    freeSpace.style.color = 'orange';
  } else {
    storageBar.style.background = 'linear-gradient(90deg, var(--accent), var(--accent-light))';
    freeSpace.style.color = 'var(--success)';
  }
}

// ====================================
// SZÖVEGSZERKESZTŐ FUNKCIÓK
// ====================================

// Szöveg betöltése
async function load() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("content")
      .eq("id", ID)
      .maybeSingle();
    
    if (error) {
      console.error("Betöltési hiba:", error);
      return;
    }
    
    const newContent = (data && data.content) || "";
    if (newContent !== ta.value) ta.value = newContent;
  } catch (err) {
    console.error("Load hiba:", err);
  }
}

// Szöveg mentése
async function upsert(text) {
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ id: ID, content: text }, { onConflict: "id" });
    
    if (error) {
      console.error("Mentési hiba:", error);
      alert("Mentés sikertelen: " + error.message);
    }
  } catch (err) {
    console.error("Upsert hiba:", err);
    alert("Mentés sikertelen");
  }
}

// Real-time előfizetés a szöveghez
function subscribeRealtime() {
  try {
    channelRef = supabase
      .channel("infosharer-text-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLE,
          filter: `id=eq.${ID}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const newContent = payload.new?.content || "";
            if (newContent !== ta.value && document.activeElement !== ta) {
              ta.value = newContent;
            }
          }
        }
      )
      .subscribe((status) => {
        setStatusFromState(status);
      });
    
    channelRef.on("error", (err) => {
      setStatusFromState("megszakadt");
    });
  } catch (err) {
    setStatusFromState("megszakadt");
  }
}

// ====================================
// FÁJLLETÖLTÉSI FUNKCIÓK
// ====================================

// Letöltési link generálása megosztáshoz
async function getDownloadLink(fileName, originalName, expirySeconds = 86400, slotNumber = 0) {
  try {
    // Először ellenőrizzük, hogy létezik-e a fájl a storage adapter-rel
    const fileExists = await storageAdapter.fileExists(fileName);
    
    if (!fileExists) {
      throw new Error("A fájl nem található a tárolóban");
    }
    
    // Ha Google Drive-ot használunk, publikus linket generálunk MOST
    let publicUrl = null;
    if (storageAdapter.actualProvider === 'googledrive') {
      // Google Drive fájlt publikussá tesszük és közvetlen letöltési linket kapunk
      const GoogleDrive = await import('./google-drive-api.js');
      const fileId = storageAdapter.fileIdMap[fileName];
      
      if (fileId) {
        publicUrl = await GoogleDrive.createPublicLink(fileId);
        console.log('✅ Google Drive publikus link létrehozva:', publicUrl);
      }
    }
    
    // Fallback: Ha nincs publikus URL, használjuk a storage adapter download URL-jét
    const downloadUrl = publicUrl || await storageAdapter.getDownloadUrl(fileName, expirySeconds);
    
    // A download URL-t emberi olvasható formába csomagoljuk
    const displayName = originalName || fileName.replace(/^slot\d+_/, '');
    
    // Érvényesség szövege
    let expiryText = '';
    if (expirySeconds < 3600) {
      expiryText = `${Math.floor(expirySeconds / 60)} percig`;
    } else if (expirySeconds < 86400) {
      expiryText = `${Math.floor(expirySeconds / 3600)} óráig`;
    } else {
      expiryText = `${Math.floor(expirySeconds / 86400)} napig`;
    }
    
    // Egyedi rövid kód generálása
    const shortCode = generateShortCode(slotNumber, fileName);
    const baseUrl = window.location.origin + window.location.pathname;
    // Ha van publikus URL (Google Drive), tegyük bele a linkbe is, hogy más böngészőből is működjön
    const publicUrlParam = publicUrl ? `&publicUrl=${encodeURIComponent(publicUrl)}` : '';
    const customLink = `${baseUrl}?file=${shortCode}${publicUrlParam}`;
    
    // Tárolni kell a publikus URL-t a shortCode-hoz (localStorage)
    if (publicUrl) {
      const publicLinks = JSON.parse(localStorage.getItem('infosharer_public_links') || '{}');
      publicLinks[shortCode] = {
        url: publicUrl,
        fileName: fileName,
        originalName: displayName,
        createdAt: Date.now(),
        expirySeconds: expirySeconds
      };
      localStorage.setItem('infosharer_public_links', JSON.stringify(publicLinks));
    }
    
    return {
      url: downloadUrl,
      customLink: customLink,
      displayName: displayName,
      expiryText: expiryText,
      shortCode: shortCode,
      publicUrl: publicUrl
    };
  } catch (err) {
    console.error('Download link generálási hiba:', err);
    throw err;
  }
}

// Slot-hoz tartozó fájl letöltése
async function downloadFile(fileName, originalName) {
  try {
    // Először ellenőrizzük, hogy létezik-e a fájl a storage adapter-rel
    const fileExists = await storageAdapter.fileExists(fileName);
    
    if (!fileExists) {
      alert("A fájl nem található");
      return;
    }
    
    // Ha létezik, folytatjuk a letöltést
    // Blob letöltés a storage adapter-rel
    const data = await storageAdapter.downloadFile(fileName);
    
    // Blob URL létrehozása
    const url = URL.createObjectURL(data);
    
    // Létrehozunk egy láthatatlan linket
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName || fileName.replace(/^slot\d+_/, "");
    a.style.display = "none";
    document.body.appendChild(a);
    
    // Kattintás a linkre
    a.click();
    
    // Takarítás
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    // Sikeres letöltés visszajelzés
    setFilesStatus("success", "✓ Fájl letöltése elkezdődött");
  } catch (err) {
    console.error("Letöltési hiba:", err);
    alert("Hiba a fájl letöltése során: " + (err.message || "Ismeretlen hiba"));
    setFilesStatus("error", "✗ Letöltési hiba");
  }
}

// ====================================
// SLOT KEZELÉS ÉS FRISSÍTÉS
// ====================================

// Real-time előfizetés a fájlokhoz (polling)
function subscribeFileRealtime() {
  setInterval(async () => {
    try {
      await updateSlots(true);
    } catch (err) {
      console.error("Fájl polling hiba:", err);
    }
  }, 3000);
}

// Slotok létrehozása és frissítése
async function updateSlots(silent = false) {
  try {
    if (!silent) {
      setFilesStatus("loading");
    }
    
    // Auth állapot ellenőrzése
    const isAuthenticated = globalAuth && globalAuth.isAuthenticated();
    
    // Használjuk a storage adapter-t a fájlok listázásához
    const allFiles = await storageAdapter.listFiles();
    
    // Reseteljük a slot leképezéseket
    slotMappings = {};
    
    // Fájlok hozzárendelése a slotokhoz a fájlnév alapján
    if (allFiles && allFiles.length > 0) {
      allFiles.forEach((file) => {
        const match = file.name.match(/slot(\d+)_(.+)/);
        if (match) {
          const slotNum = parseInt(match[1]);
          const originalName = match[2];
          slotMappings[slotNum] = {
            fileName: file.name,
            originalName: originalName,
            metadata: { 
              size: file.size || 0
            },
            created_at: file.created_at || file.createdTime
          };
        }
      });
    }
    
    // Tárhelyhasználat számítása
    calculateStorageUsage();
    
    slotContainer.innerHTML = "";
    
    // Slot számok rendezése
    const slotNumbers = Object.keys(slotMappings).map(n => parseInt(n)).sort((a, b) => a - b);
    const maxSlotNum = slotNumbers.length > 0 ? Math.max(...slotNumbers) : 0;
    
    // Létrehozzuk a slotokat
    const slotsToCreate = canEdit ? maxSlotNum + 1 : maxSlotNum;
    
    for (let i = 1; i <= slotsToCreate; i++) {
      const fileData = slotMappings[i];
      const isFilled = fileData ? true : false;
      
      const col = document.createElement("div");
      col.className = "col-md-3 col-sm-6 mb-4";
      
      const card = document.createElement("div");
      card.className = "card h-100";
      card.style.cssText = `
        background: var(--bg-mid);
        border: 2px solid ${isFilled ? "var(--accent)" : "var(--muted)"};
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
      `;
      
      if (isFilled) {
        card.style.boxShadow = "0 4px 15px rgba(127, 90, 240, 0.2)";
      }
      
      const cardBody = document.createElement("div");
      cardBody.className = "card-body d-flex flex-column";
      
      // Fájl ikon vagy kép előnézet
      const iconContainer = document.createElement("div");
      iconContainer.className = "text-center mb-3";
      iconContainer.style.cssText = "font-size: 3.5rem; position: relative;";
      
      // Ellenőrizzük, hogy kép-e
      const isImage = fileData && fileData.originalName && /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileData.originalName);
      
      if (isFilled && isImage) {
        // Kép előnézet
        const imgPreview = document.createElement("div");
        imgPreview.style.cssText = `
          width: 100%;
          height: 150px;
          border-radius: 8px;
          overflow: hidden;
          background: #16162a;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        `;
        
        const img = document.createElement("img");
        img.style.cssText = `
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
        `;
        
        // Betöltési spinner
        const loadingSpinner = document.createElement("div");
        loadingSpinner.style.cssText = `
          position: absolute;
          font-size: 2rem;
        `;
        loadingSpinner.textContent = "⏳";
        imgPreview.appendChild(loadingSpinner);
        
        // Ellenőrizzük a cache-t először
        const cacheKey = fileData.fileName;
        if (publicUrlCache.has(cacheKey)) {
          // Van cache-elt URL
          img.src = publicUrlCache.get(cacheKey);
          img.alt = fileData.originalName;
          loadingSpinner.remove(); // Azonnal eltávolítjuk a spinner-t
          
          img.onerror = () => {
            loadingSpinner.textContent = "🖼️";
            imgPreview.appendChild(loadingSpinner);
          };
        } else {
          // Nincs cache, töltsd le
          storageAdapter.getPublicUrl(fileData.fileName).then(publicUrl => {
            publicUrlCache.set(cacheKey, publicUrl); // Cache-eljük
            img.src = publicUrl;
            img.alt = fileData.originalName;
            
            img.onload = () => {
              loadingSpinner.remove();
            };
            
            img.onerror = () => {
              loadingSpinner.textContent = "🖼️";
            };
          }).catch(err => {
            console.error('Kép betöltési hiba:', err);
            loadingSpinner.textContent = getFileIcon(fileData.originalName);
          });
        }
        
        imgPreview.appendChild(img);
        iconContainer.appendChild(imgPreview);
      } else {
        // Normál fájl ikon
        const fileIcon = document.createElement("div");
        fileIcon.textContent = getFileIcon(fileData?.originalName || "");
        fileIcon.style.cssText = "display: inline-block;";
        iconContainer.appendChild(fileIcon);
      }
      
      // Slot cím
      const slotTitle = document.createElement("h5");
      slotTitle.className = "card-title text-center mb-3";
      slotTitle.style.cssText = "color: var(--text); font-weight: bold;";
      slotTitle.textContent = `Slot ${i}`;
      
      // Fájl információk
      const fileInfoContainer = document.createElement("div");
      fileInfoContainer.className = "mb-3 flex-grow-1";
      
      if (isFilled) {
        const fileName = document.createElement("div");
        fileName.className = "text-center mb-2";
        fileName.style.cssText = "color: var(--accent-light); font-weight: 500; word-break: break-all;";
        const displayName = fileData.originalName.length > 25
          ? fileData.originalName.substring(0, 22) + "..."
          : fileData.originalName;
        fileName.textContent = displayName;
        fileName.title = fileData.originalName;
        
        const fileExt = document.createElement("div");
        fileExt.className = "text-center mb-1";
        fileExt.style.cssText = "color: var(--muted); font-size: 0.9rem;";
        const ext = fileData.originalName.split(".").pop().toUpperCase();
        fileExt.textContent = `.${ext}`;
        
        const fileSize = document.createElement("div");
        fileSize.className = "text-center";
        fileSize.style.cssText = "color: var(--muted); font-size: 0.85rem;";
        const sizeInBytes = fileData.metadata?.size || 0;
        fileSize.textContent = formatFileSize(sizeInBytes);
        
        const fileDate = document.createElement("div");
        fileDate.className = "text-center mt-1";
        fileDate.style.cssText = "color: #666; font-size: 0.8rem;";
        const uploadDate = fileData.created_at ? new Date(fileData.created_at) : new Date();
        fileDate.textContent = uploadDate.toLocaleDateString("hu-HU");
        
        fileInfoContainer.appendChild(fileName);
        fileInfoContainer.appendChild(fileExt);
        fileInfoContainer.appendChild(fileSize);
        fileInfoContainer.appendChild(fileDate);
      } else {
        const emptyText = document.createElement("div");
        emptyText.className = "text-center";
        emptyText.style.cssText = "color: var(--muted); font-style: italic; padding: 20px 0;";
        emptyText.textContent = "Üres slot";
        fileInfoContainer.appendChild(emptyText);
      }
      
      // Kattintható kártya
      if (isFilled) {
        // Betöltött slot - Info modal megnyitása
        card.style.cursor = "pointer";
        card.onclick = (e) => {
          if (e.target.tagName === 'BUTTON') return;
          openFileInfoModal(i, fileData, isImage);
        };
        
        // Hover effekt
        card.onmouseenter = () => {
          card.style.transform = "translateY(-5px)";
          card.style.boxShadow = "0 8px 25px rgba(127, 90, 240, 0.4)";
        };
        card.onmouseleave = () => {
          card.style.transform = "translateY(0)";
          card.style.boxShadow = "0 4px 15px rgba(127, 90, 240, 0.2)";
        };
      } else if (isAuthenticated) {
        // Üres slot + bejelentkezve - Feltöltés modal megnyitása
        card.style.cursor = "pointer";
        card.onclick = (e) => {
          if (e.target.tagName === 'BUTTON') return;
          openUploadModal(i);
        };
        
        // Hover effekt
        card.onmouseenter = () => {
          card.style.transform = "translateY(-5px)";
          card.style.boxShadow = "0 8px 25px rgba(127, 90, 240, 0.3)";
        };
        card.onmouseleave = () => {
          card.style.transform = "translateY(0)";
          card.style.boxShadow = "0 4px 15px rgba(127, 90, 240, 0.2)";
        };
      }
      
      // Gombok
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "d-grid gap-2";
      
      // Üres slot - Feltöltés gomb (csak bejelentkezve)
      if (!isFilled && canEdit) {
        const uploadBtn = document.createElement("button");
        uploadBtn.className = "btn";
        uploadBtn.style.cssText = `
          background: var(--accent);
          color: white;
          border: none;
          font-weight: 500;
        `;
        uploadBtn.innerHTML = 'Feltöltés';
        uploadBtn.onclick = (e) => {
          e.stopPropagation();
          openUploadModal(i);
        };
        buttonContainer.appendChild(uploadBtn);
      } else if (!isFilled) {
        const infoText = document.createElement("div");
        infoText.className = "text-center";
        infoText.style.cssText = "color: var(--muted); font-size: 0.85rem; padding: 10px;";
        infoText.textContent = "Jelentkezz be a feltöltéshez";
        buttonContainer.appendChild(infoText);
      }
      
      if (isFilled) {
        const clickInfo = document.createElement("div");
        clickInfo.className = "text-center mt-2";
        clickInfo.style.cssText = "color: var(--accent-light); font-size: 0.85rem; font-style: italic;";
        clickInfo.innerHTML = "Kattints a részletekért";
        buttonContainer.appendChild(clickInfo);
      }
      
      // Gombok betöltött slotoknál
      if (isFilled) {
        const buttonColumn = document.createElement("div");
        buttonColumn.className = "d-flex flex-column gap-2 mt-2";
        buttonColumn.style.cssText = "width: 100%;";
        
        // Letöltés gomb
        const downloadBtn = document.createElement("button");
        downloadBtn.className = "btn w-100";
        downloadBtn.style.cssText = `
          background: var(--accent);
          color: white;
          border: none;
          font-weight: 500;
        `;
        downloadBtn.textContent = "Letöltés";
        downloadBtn.onclick = async (e) => {
          e.stopPropagation();
          await downloadFile(fileData.fileName, fileData.originalName);
        };
        buttonColumn.appendChild(downloadBtn);
        
        // Csere gomb (csak bejelentkezve)
        if (canEdit) {
          const replaceBtn = document.createElement("button");
          replaceBtn.className = "btn w-100";
          replaceBtn.style.cssText = `
            background: transparent;
            color: var(--muted);
            border: 1px solid var(--muted);
            font-weight: 500;
          `;
          replaceBtn.textContent = "Csere";
          replaceBtn.onclick = (e) => {
            e.stopPropagation();
            openUploadModal(i, fileData.originalName);
          };
          buttonColumn.appendChild(replaceBtn);
        }
        
        buttonContainer.appendChild(buttonColumn);
      }
      
      // Összeállítás
      cardBody.appendChild(iconContainer);
      cardBody.appendChild(slotTitle);
      cardBody.appendChild(fileInfoContainer);
      if (buttonContainer.children.length > 0) {
        cardBody.appendChild(buttonContainer);
      }
      
      card.appendChild(cardBody);
      col.appendChild(card);
      slotContainer.appendChild(col);
    }
    
    if (!silent) {
      const filledSlots = Object.keys(slotMappings).length;
      
      // Frissített tárhely info
      const usage = await calculateStorageUsage();
      const usedGB = (usage.visibleUsed / (1024 * 1024 * 1024)).toFixed(2);
      const totalGB = (usage.maxCapacity / (1024 * 1024 * 1024)).toFixed(0);
      const hiddenGB = (usage.hiddenUsed / (1024 * 1024 * 1024)).toFixed(2);
      
      let statusText = `${filledSlots} slot • ${usedGB}/${totalGB} GB használva`;
      if (usage.hiddenUsed > 0) {
        statusText += ` (${hiddenGB} GB rejtett)`;
      }
      
      setFilesStatus("success", statusText);
      
      setTimeout(() => {
        setFilesStatus("success", "");
      }, 3000);
    }
  } catch (err) {
    console.error("Slot frissítési hiba:", err);
    if (!silent) {
      setFilesStatus("error", "Hiba a slotok frissítésekor");
    }
  }
}

// ====================================
// MODAL KEZELÉS
// ====================================

// Feltöltés modal megnyitása
function openUploadModal(slotNumber, existingFileName = null) {
  currentSlot = slotNumber;
  modalSlotTitle.textContent = `Slot ${slotNumber}`;
  fileUploadInput.value = "";
  fileInfo.style.display = "none";
  uploadProgress.style.display = "none";
  uploadProgressBar.style.width = "0%";
  uploadProgressBar.style.background = "var(--accent)";
  uploadProgressText.textContent = "Feltöltés...";
  uploadProgressText.style.color = "var(--muted)";
  
  // Drop zone reset
  const dropZone = document.getElementById('dropZone');
  const dropZoneContent = document.getElementById('dropZoneContent');
  if (dropZone && dropZoneContent) {
    dropZone.style.borderColor = 'var(--accent)';
    dropZone.style.background = 'rgba(127, 90, 240, 0.05)';
    const maxSizeGB = MAX_FILE_SIZE_BYTES / (1024 * 1024 * 1024);
    const maxSizeDisplay = maxSizeGB >= 1 ? `${maxSizeGB.toFixed(1)} GB` : `${(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB`;
    dropZoneContent.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 10px;">📁</div>
      <div style="color: var(--text); font-weight: 500; margin-bottom: 8px;">
        Kattints vagy húzd ide a fájlt
      </div>
      <div style="color: var(--muted); font-size: 0.9rem;">
        Maximális fájlméret: ${maxSizeDisplay}
      </div>
    `;
  }
  
  // Tárhelyhasználat frissítése
  updateStorageDisplay();
  
  // Ha van meglévő fájl, tájékoztatjuk a felhasználót
  if (existingFileName) {
    selectedFileName.textContent = `A meglévő fájl (${existingFileName}) felül lesz írva.`;
    selectedFileSize.textContent = "";
    fileInfo.style.display = "block";
  }
  
  uploadModal.show();
}

// Fájl info modal megnyitása
function openFileInfoModal(slotNumber, fileData, isImage) {
  currentFileInfoSlot = slotNumber;
  
  // Modal cím
  document.getElementById('infoModalSlotTitle').textContent = `Slot ${slotNumber}`;
  
  // Fájl információk
  document.getElementById('infoFileName').textContent = fileData.originalName;
  const sizeInBytes = fileData.metadata?.size || 0;
  document.getElementById('infoFileSize').textContent = formatFileSize(sizeInBytes);
  const uploadDate = fileData.created_at ? new Date(fileData.created_at) : new Date();
  document.getElementById('infoFileDate').textContent = uploadDate.toLocaleString('hu-HU');
  
  // Előnézet kezelése
  const previewSection = document.getElementById('filePreviewSection');
  const previewImage = document.getElementById('filePreviewImage');
  const iconSection = document.getElementById('fileIconSection');
  const iconLarge = document.getElementById('fileIconLarge');
  
  if (isImage) {
    previewSection.style.display = 'block';
    previewImage.style.display = 'block';
    iconSection.style.display = 'none';
    
    // Ellenőrizzük a cache-t először
    const cacheKey = fileData.fileName;
    if (publicUrlCache.has(cacheKey)) {
      // Van cache-elt URL, használjuk azt
      previewImage.src = publicUrlCache.get(cacheKey);
      previewImage.alt = fileData.originalName;
    } else {
      // Nincs cache, töltsd le és mentsd el
      storageAdapter.getPublicUrl(fileData.fileName).then(publicUrl => {
        publicUrlCache.set(cacheKey, publicUrl); // Cache-eljük
        previewImage.src = publicUrl;
        previewImage.alt = fileData.originalName;
      }).catch(err => {
        console.error('Kép előnézet hiba:', err);
        // Ha hiba van, fallback az ikonos nézethez
        previewSection.style.display = 'none';
        previewImage.style.display = 'none';
        iconSection.style.display = 'block';
        iconLarge.textContent = getFileIcon(fileData.originalName);
      });
    }
  } else {
    previewSection.style.display = 'none';
    previewImage.style.display = 'none';
    iconSection.style.display = 'block';
    iconLarge.textContent = getFileIcon(fileData.originalName);
  }
  
  // Link generáló rész elrejtése alapból
  const generatedLinkSection = document.getElementById('generatedLinkSection');
  generatedLinkSection.style.display = 'none';
  
  // Download gomb eseménykezelő
  const downloadBtn = document.getElementById('infoDownloadBtn');
  downloadBtn.onclick = () => {
    downloadFile(fileData.fileName, fileData.originalName);
  };
  
  // Delete gomb eseménykezelő - csak szerkesztési joggal
  const deleteBtn = document.getElementById('infoDeleteBtn');
  if (canEdit) {
    deleteBtn.style.display = 'inline-block';
    deleteBtn.onclick = () => {
      fileInfoModal.hide();
      fileToDelete = fileData.fileName;
      currentSlot = slotNumber;
      document.getElementById('deleteFileName').textContent = fileData.originalName;
      deleteModal.show();
    };
  } else {
    deleteBtn.style.display = 'none';
  }
  
  // Link generálás gomb eseménykezelő
  const generateLinkBtn = document.getElementById('generateLinkBtn');
  generateLinkBtn.onclick = async () => {
    const expirySelect = document.getElementById('linkExpirySelect');
    const expirySeconds = parseInt(expirySelect.value);
    
    generateLinkBtn.disabled = true;
    generateLinkBtn.textContent = 'Generálás...';
    
    try {
      const linkData = await getDownloadLink(fileData.fileName, fileData.originalName, expirySeconds, slotNumber);
      
      // Link megjelenítése
      document.getElementById('generatedLinkDisplay').textContent = linkData.customLink;
      document.getElementById('linkExpiryText').textContent = linkData.expiryText;
      generatedLinkSection.style.display = 'block';
      
      // Automatikus másolás a vágólapra
      try {
        await navigator.clipboard.writeText(linkData.customLink);
        generateLinkBtn.textContent = '✓ Link másolva vágólapra!';
        generateLinkBtn.style.background = 'var(--success)';
      } catch (clipboardErr) {
        console.error('Vágólapra másolás hiba:', clipboardErr);
        generateLinkBtn.textContent = '✓ Link generálva (másolás manuálisan)';
      }
      
      setTimeout(() => {
        generateLinkBtn.textContent = '🔗 Link generálása';
        generateLinkBtn.style.background = 'var(--accent)';
        generateLinkBtn.disabled = false;
      }, 3000);
    } catch (err) {
      console.error('Link generálási hiba:', err);
      alert('Hiba a link generálása során: ' + (err.message || 'Ismeretlen hiba'));
      generateLinkBtn.textContent = '🔗 Link generálása';
      generateLinkBtn.disabled = false;
    }
  };
  
  // Modal megnyitása
  fileInfoModal.show();
}

// Fájl megjelenítése a drop zone-ban
function displaySelectedFile(file) {
  const dropZone = document.getElementById('dropZone');
  const dropZoneContent = document.getElementById('dropZoneContent');
  
  if (!file) {
    fileInfo.style.display = "none";
    return;
  }
  
  // Ellenőrizzük a fájlméretet
  if (file.size > MAX_FILE_SIZE_BYTES) {
    alert(`A fájl túl nagy! Maximum ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB lehet.`);
    fileUploadInput.value = "";
    return;
  }
  
  // Ellenőrizzük, hogy van-e elég hely
  const existingFileSize = slotMappings[currentSlot] ? slotMappings[currentSlot].metadata.size : 0;
  const newStorageUsed = totalStorageUsed - existingFileSize + file.size;
  
  if (newStorageUsed > MAX_STORAGE_BYTES) {
    const needMB = ((newStorageUsed - MAX_STORAGE_BYTES) / (1024 * 1024)).toFixed(2);
    alert(`Nincs elég hely! Szükséges további ${needMB} MB. Törölj néhány fájlt.`);
    fileUploadInput.value = "";
    return;
  }
  
  // Drop zone tartalmának frissítése
  const fileIcon = getFileIcon(file.name);
  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);
  
  if (isImage) {
    // Kép előnézet a drop zone-ban
    const reader = new FileReader();
    reader.onload = function(e) {
      dropZoneContent.innerHTML = `
        <div style="margin-bottom: 10px;">
          <img src="${e.target.result}" alt="Preview" style="
            max-width: 100%;
            max-height: 200px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          "/>
        </div>
        <div style="color: var(--accent-light); font-weight: 500; margin-bottom: 4px; word-break: break-all;">
          ${file.name}
        </div>
        <div style="color: var(--muted); font-size: 0.9rem;">
          ${formatFileSize(file.size)}
        </div>
      `;
    };
    reader.readAsDataURL(file);
  } else {
    // Normál fájl ikon
    dropZoneContent.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 10px;">${fileIcon}</div>
      <div style="color: var(--accent-light); font-weight: 500; margin-bottom: 4px; word-break: break-all;">
        ${file.name}
      </div>
      <div style="color: var(--muted); font-size: 0.9rem;">
        ${formatFileSize(file.size)}
      </div>
    `;
  }
  
  dropZone.style.borderColor = 'var(--success)';
  dropZone.style.background = 'rgba(127, 90, 240, 0.15)';
  
  // Megjelenítjük a fájl információt
  selectedFileName.textContent = file.name;
  selectedFileSize.textContent = `Méret: ${formatFileSize(file.size)}`;
  fileInfo.style.display = "block";
}

// ====================================
// FÁJL MŰVELETEK (FELTÖLTÉS, TÖRLÉS)
// ====================================

// Fájl feltöltés
async function handleFileUpload() {
  const file = fileUploadInput.files[0];
  if (!file) {
    alert("Válassz ki egy fájlt!");
    return;
  }
  
  // Ellenőrizzük a fájlméretet
  if (file.size > MAX_FILE_SIZE_BYTES) {
    alert(`A fájl túl nagy! Maximum ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB lehet.`);
    return;
  }
  
  // Ellenőrizzük a tárhelyet
  const existingFileSize = slotMappings[currentSlot] ? slotMappings[currentSlot].metadata.size : 0;
  const newStorageUsed = totalStorageUsed - existingFileSize + file.size;
  
  if (newStorageUsed > MAX_STORAGE_BYTES) {
    const needMB = ((newStorageUsed - MAX_STORAGE_BYTES) / (1024 * 1024)).toFixed(2);
    alert(`Nincs elég hely! Szükséges további ${needMB} MB. Törölj néhány fájlt.`);
    return;
  }
  
  // Feltöltés indítása
  uploadProgress.style.display = "block";
  uploadProgressBar.style.width = "30%";
  uploadProgressBar.style.background = "var(--accent)";
  uploadProgressText.textContent = "Feltöltés...";
  uploadProgressText.style.color = "var(--muted)";
  confirmUpload.disabled = true;
  
  try {
    // Fájlnév tisztítása
    const safeName = file.name
      .replace(/\s+/g, '_')
      .replace(/[^\w\.-]/g, '_')
      .replace(/_+/g, '_');
    
    // Egyedi fájlnév generálása
    const slotFileName = `slot${currentSlot}_${safeName}`;
    
    // Ellenőrizzük, hogy van-e már fájl ebben a slotban
    const existingFileData = slotMappings[currentSlot];
    
    uploadProgressBar.style.width = "60%";
    
    // Ha van meglévő fájl ebben a slotban, töröljük
    if (existingFileData && existingFileData.fileName) {
      publicUrlCache.delete(existingFileData.fileName); // Töröljük a cache-ből
      await storageAdapter.deleteFile(existingFileData.fileName);
    }
    
    // Feltöltés a storage adapter-rel (progress callback)
    const progressCallback = (percent) => {
      const progress = 60 + (percent * 0.3); // 60-90% közötti progress
      uploadProgressBar.style.width = `${progress}%`;
    };
    
    const uploadResult = await storageAdapter.uploadFile(file, slotFileName, progressCallback);
    
    uploadProgressBar.style.width = "90%";
    
    if (!uploadResult) {
      console.error("Feltöltési hiba: nincs eredmény");
      uploadProgressText.textContent = "Hiba a feltöltés során";
      uploadProgressText.style.color = "var(--error)";
      uploadProgressBar.style.background = "var(--error)";
      throw new Error("Feltöltés sikertelen");
    }
    
    // Sikeres feltöltés
    uploadProgressText.textContent = "Feltöltés sikeres!";
    uploadProgressText.style.color = "var(--success)";
    uploadProgressBar.style.width = "100%";
    uploadProgressBar.style.background = "var(--success)";
    
    setTimeout(() => {
      uploadModal.hide();
      updateSlots();
      confirmUpload.disabled = false;
      fileUploadInput.value = "";
      uploadProgress.style.display = "none";
      uploadProgressBar.style.width = "0%";
      uploadProgressBar.style.background = "var(--accent)";
      uploadProgressText.textContent = "Feltöltés...";
      uploadProgressText.style.color = "var(--muted)";
    }, 1000);
  } catch (err) {
    console.error("Feltöltési hiba:", err);
    alert("Feltöltés sikertelen: " + (err.message || "Ismeretlen hiba"));
    confirmUpload.disabled = false;
    
    setTimeout(() => {
      uploadProgress.style.display = "none";
      uploadProgressBar.style.width = "0%";
      uploadProgressBar.style.background = "var(--accent)";
      uploadProgressText.textContent = "Feltöltés...";
      uploadProgressText.style.color = "var(--muted)";
    }, 2000);
  }
}

// Fájl törlése és átrendezés
async function handleFileDelete() {
  if (!fileToDelete) return;
  
  try {
    // Töröljük a cache-ből az URL-t
    publicUrlCache.delete(fileToDelete);
    
    // Töröljük a fájlt a storage adapter-rel
    await storageAdapter.deleteFile(fileToDelete);
    
    // Átrendezzük a fájlokat
    await reorderSlots(currentSlot);
    
    // Frissítjük a megjelenítést
    updateSlots();
  } catch (err) {
    console.error("Törlési hiba:", err);
    alert("Hiba a törlés során");
  } finally {
    deleteModal.hide();
    fileToDelete = null;
    currentSlot = null;
  }
}

// Slot átrendezés funkció
async function reorderSlots(deletedSlotNum) {
  try {
    // Lekérjük az összes fájlt a storage adapter-rel
    const allFiles = await storageAdapter.listFiles();
    
    // Rendezzük slot szám szerint
    const filesBySlot = {};
    allFiles.forEach((file) => {
      const match = file.name.match(/slot(\d+)_(.+)/);
      if (match) {
        const slotNum = parseInt(match[1]);
        filesBySlot[slotNum] = {
          fileName: file.name,
          originalName: match[2]
        };
      }
    });
    
    // Megkeressük a törölt slot utáni slotokat és átnevezzük őket
    const slotNumbers = Object.keys(filesBySlot).map(n => parseInt(n)).sort((a, b) => a - b);
    
    for (let i = 0; i < slotNumbers.length; i++) {
      const currentSlotNum = slotNumbers[i];
      
      // Ha a slot nagyobb mint a törölt slot, eggyel csökkentjük
      if (currentSlotNum > deletedSlotNum) {
        const newSlotNum = currentSlotNum - 1;
        const fileData = filesBySlot[currentSlotNum];
        const oldFileName = fileData.fileName;
        const newFileName = `slot${newSlotNum}_${fileData.originalName}`;
        
        // Storage adapter moveFile metódus használata
        await storageAdapter.moveFile(oldFileName, newFileName);
      }
    }
  } catch (err) {
    console.error("Átrendezési hiba:", err);
  }
}

// ====================================
// ESEMÉNYKEZELŐK
// ====================================

async function setupEventListeners() {
  // Várunk amíg a SupabaseAuthModal betöltődik
  // console.log('⏳ Várakozás a SupabaseAuthModal betöltésére...');
  let attempts = 0;
  while (!window.SupabaseAuthModal && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.SupabaseAuthModal) {
    console.error('❌ SupabaseAuthModal nem töltődött be!');
    return;
  }
  
  // console.log('✅ SupabaseAuthModal betöltve');
  
  // Auth Modal inicializálás (SupabaseAuthModal from supabase-auth.js)
  const authModal = new window.SupabaseAuthModal(globalAuth);
  authModal.init({
    onSuccess: async () => {
      // Sikeres bejelentkezés után
      // console.log('🔐 Bejelentkezés sikeres!');
      // console.log('Admin user:', globalAuth.isAdminUser());
      // console.log('Authenticated:', globalAuth.isAuthenticated());
      
      // Várjunk egy kicsit hogy a user_roles betöltődjön
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Admin ellenőrzés újra
      await globalAuth.loadUserProfile(globalAuth.getCurrentUser());
      
      // console.log('Admin user (újra):', globalAuth.isAdminUser());
      
      // Admin ellenőrzés
      if (globalAuth.isAdminUser()) {
        // console.log('✅ Admin jogosultság megvan!');
        canEdit = true;
        ta.readOnly = false;
        saveBtn.disabled = false;
        mainBtns.style.display = "none";
        authBtns.style.display = "flex";
        
        // Slot-ok frissítése
        await updateSlots();
        
        // Navigáció frissítése (ha létezik a függvény)
        if (window.rebuildNav && typeof window.rebuildNav === 'function') {
          window.rebuildNav();
        }
        
        // Success üzenet
        setStatus('success', '✅ Admin jogosultság aktiválva! Szerkesztés engedélyezve.');
      } else {
        // console.log('❌ Nincs admin jog!');
        setStatus('error', '❌ Nincs jogosultságod szerkesztéshez! Csak admin felhasználók szerkeszthetnek.');
      }
    },
    onCancel: () => {
      // Mégse gomb
    }
  });
  
  // Írás engedélyezése gomb
  openPw.addEventListener("click", () => {
    authModal.open();
  });
  
  // Mentés gomb
  saveBtn.addEventListener("click", async () => {
    if (!canEdit) {
      alert("Előbb engedélyezd az írást jelszóval.");
      return;
    }
    saveBtn.textContent = "Mentés...";
    saveBtn.disabled = true;
    await upsert(ta.value);
    saveBtn.textContent = "Mentve";
    setTimeout(() => {
      saveBtn.textContent = "Mentés";
      saveBtn.disabled = false;
    }, 900);
  });
  
  // Másolás gombok
  const handleCopy = async (button) => {
    try {
      await navigator.clipboard.writeText(ta.value);
      const old = button.textContent;
      button.textContent = "Másolva";
      setTimeout(() => {
        button.textContent = old;
      }, 900);
    } catch (err) {
      alert("Másolás sikertelen");
    }
  };
  
  copyBtn.addEventListener("click", () => handleCopy(copyBtn));
  copyBtn2.addEventListener("click", () => handleCopy(copyBtn2));
  
  // DEBUG: Textarea click esemény - jelzi ha valaki próbál írni de readonly
  ta.addEventListener("click", () => {
    if (ta.readOnly && globalAuth && globalAuth.isAuthenticated() && globalAuth.isAdminUser()) {
      console.error('🐛 [DEBUG] TEXTAREA READONLY BUG! Admin vagy de a textarea readonly!');
      console.error('🐛 [DEBUG] Állapot:', {
        readOnly: ta.readOnly,
        canEdit: canEdit,
        saveBtnDisabled: saveBtn.disabled,
        isAdmin: globalAuth.isAdminUser(),
        isAuthenticated: globalAuth.isAuthenticated()
      });
      
      // Automatikus javítás
      // console.warn('🔧 [DEBUG] Automatikus javítás...');
      canEdit = true;
      ta.readOnly = false;
      saveBtn.disabled = false;
      mainBtns.style.display = "none";
      authBtns.style.display = "flex";
      // console.log('✅ [DEBUG] Javítva!');
    }
  });
  
  // Kijelentkezés
  logoutBtn.addEventListener("click", async function () {
    // Supabase logout
    await globalAuth.signOut();
    
    canEdit = false;
    ta.readOnly = true;
    saveBtn.disabled = true;
    authBtns.style.display = "none";
    mainBtns.style.display = "flex";
    
    try {
      if (channelRef && typeof channelRef.unsubscribe === "function") {
        channelRef.unsubscribe();
      }
    } catch (e) {
      // console.warn("unsubscribe error", e);
    }
    channelRef = null;
    setStatusFromState("élő");
    statusEl.textContent = "Kapcsolat: -";
    
    updateSlots();
  });
  
  // Fájl feltöltés események
  fileUploadInput.addEventListener("change", function () {
    const file = this.files[0];
    displaySelectedFile(file);
  });
  
  confirmUpload.addEventListener("click", handleFileUpload);
  confirmDelete.addEventListener("click", handleFileDelete);
  
  // Drag & Drop események
  const dropZone = document.getElementById('dropZone');
  
  if (dropZone) {
    dropZone.addEventListener('click', () => {
      fileUploadInput.click();
    });
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.style.borderColor = 'var(--accent-light)';
        dropZone.style.background = 'rgba(127, 90, 240, 0.2)';
        dropZone.style.transform = 'scale(1.02)';
      });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.style.borderColor = 'var(--accent)';
        dropZone.style.background = 'rgba(127, 90, 240, 0.05)';
        dropZone.style.transform = 'scale(1)';
      });
    });
    
    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileUploadInput.files = dataTransfer.files;
        displaySelectedFile(file);
      }
    });
  }
}

// ====================================
// INICIALIZÁLÁS
// ====================================

async function initialize() {
  // Auth Modal HTML betöltése
  const authModalContainer = document.getElementById('authModalContainer');
  if (authModalContainer) {
    const response = await fetch('assets/components/auth-modal.html');
    const html = await response.text();
    authModalContainer.innerHTML = html;
  }

  // Supabase inicializálása
  await initSupabase();
  
  // Supabase Auth - ellenőrizzük hogy már inicializálva van-e (nav.js betölti)
  // console.log('🔍 [Infosharer Init] 1. Auth ellenőrzése kezdődik', {
    // getAuthExists: !!window.getAuth,
    // initAuthExists: !!window.initSupabaseAuth
  // });
  
  if (window.getAuth) {
    globalAuth = window.getAuth();
    // console.log('🔍 [Infosharer Init] 2. Auth már betöltve (nav.js-ből)', {
      // hasAuth: !!globalAuth,
      // hasSupabase: !!globalAuth?.sb,
      // profileLoaded: globalAuth?.profileLoaded,
      // isAuthenticated: globalAuth?.isAuthenticated(),
      // isAdmin: globalAuth?.isAdminUser()
    // });
  }
  
  // Ha még nincs inicializálva (pl. nav.js előtt töltődött be), inicializáljuk most
  if (!globalAuth && window.initSupabaseAuth) {
    // console.log('🔍 [Infosharer Init] 3. Auth inicializálása...');
    globalAuth = await window.initSupabaseAuth();
    // console.log('🔍 [Infosharer Init] 4. Auth inicializálva', {
      // hasAuth: !!globalAuth,
      // profileLoaded: globalAuth?.profileLoaded
    // });
  }
  
  // VÁRJUK MEG A PROFIL BETÖLTÉSÉT!
  // Ez kritikus hogy ne állítsuk be a readonly módot túl korán
  if (globalAuth) {
    // console.log('⏳ [Infosharer Init] 5. Várakozás a profil betöltésére...', {
      // profileLoaded: globalAuth.profileLoaded,
      // isAuthenticated: globalAuth.isAuthenticated(),
      // isAdmin: globalAuth.isAdminUser()
    // });
    
    let attempts = 0;
    while (!globalAuth.profileLoaded && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 50));
      attempts++;
      
      // Log minden 20. kísérlet után (1 másodperc)
      if (attempts % 20 === 0) {
        // console.log(`⏳ [Infosharer Init] Várakozás... ${attempts * 50}ms`, {
          // profileLoaded: globalAuth.profileLoaded
        // });
      }
    }
    
    if (globalAuth.profileLoaded) {
      // console.log('✅ [Infosharer Init] 6. Profil betöltve!', {
        // isAuthenticated: globalAuth.isAuthenticated(),
        // isAdmin: globalAuth.isAdminUser(),
        // currentUser: globalAuth.currentUser?.email
      // });
    } else {
      // console.warn('⚠️ [Infosharer Init] 6. Profil betöltés timeout!');
    }
  } else {
    // console.warn('⚠️ [Infosharer Init] Nincs globalAuth!');
  }
  
  // DOM elemek inicializálása
  initDOMElements();
  
  // console.log('🔍 [Infosharer Init] 7. DOM elemek inicializálva');
  
  // Alapértelmezett beállítások - modal rejtve van CSS-ben, nem kell inline
  ta.readOnly = true;
  saveBtn.disabled = true;
  
  // console.log('🔍 [Infosharer Init] 8. Alapértelmezett readonly beállítva');
  
  // Ellenőrizzük az authentikációt és admin jogot
  const isAuthenticated = globalAuth && globalAuth.isAuthenticated();
  const isAdmin = globalAuth && globalAuth.isAdminUser();
  
  // console.log('🔍 [Infosharer Init] 9. Admin jogok ellenőrzése:', {
    // hasGlobalAuth: !!globalAuth,
    // isAuthenticated: isAuthenticated,
    // isAdmin: isAdmin,
    // willEnableEdit: isAuthenticated && isAdmin
  // });
  
  if (isAuthenticated && isAdmin) {
    // console.log('✅ [Infosharer Init] 10. Admin felhasználó - szerkesztési mód ENGEDÉLYEZVE');
    canEdit = true;
    ta.readOnly = false;
    saveBtn.disabled = false;
    mainBtns.style.display = "none";
    authBtns.style.display = "flex";
    
    // console.log('✅ [Infosharer Init] Textarea readonly állapot:', ta.readOnly);
  } else {
    // console.log('ℹ️ [Infosharer Init] 10. Csak olvasási mód (nincs admin jog vagy nincs bejelentkezve)');
    // console.log('ℹ️ [Infosharer Init] Részletek:', {
      // isAuthenticated,
      // isAdmin,
      // canEdit: false
    // });
  }
  
  // Eseménykezelők beállítása
  await setupEventListeners();
  
  // Login state változás figyelése
  window.addEventListener('loginStateChanged', async (event) => {
    // console.log('🔄 [Infosharer Event] Login state changed', event.detail);
    
    if (event.detail.loggedIn && event.detail.isAdmin) {
      // Admin bejelentkezett
      // console.log('✅ [Infosharer Event] Admin aktiválás...');
      canEdit = true;
      ta.readOnly = false;
      saveBtn.disabled = false;
      mainBtns.style.display = "none";
      authBtns.style.display = "flex";
      await updateSlots();
      setStatus('success', '✅ Admin jogosultság aktiválva!');
      // console.log('✅ [Infosharer Event] Admin mód beállítva, textarea readonly:', ta.readOnly);
    } else if (!event.detail.loggedIn) {
      // Kijelentkezés
      // console.log('ℹ️ [Infosharer Event] Kijelentkezés...');
      canEdit = false;
      ta.readOnly = true;
      saveBtn.disabled = true;
      mainBtns.style.display = "flex";
      authBtns.style.display = "none";
      await updateSlots();
      setStatus('info', 'Csak olvasási mód');
      // console.log('ℹ️ [Infosharer Event] Readonly mód beállítva');
    }
  });
  
  // Slotok betöltése
  updateSlots();
  
  // VÉGSŐ ÖSSZEFOGLALÓ LOG
  // console.log('═══════════════════════════════════════════════════════');
  // console.log('🏁 [Infosharer Init] INICIALIZÁLÁS BEFEJEZVE');
  // console.log('═══════════════════════════════════════════════════════');
  // console.log('Végső állapot:', {
    // canEdit: canEdit,
    // textareaReadOnly: ta.readOnly,
    // saveBtnDisabled: saveBtn.disabled,
    // isAuthenticated: globalAuth?.isAuthenticated(),
    // isAdmin: globalAuth?.isAdminUser(),
    // profileLoaded: globalAuth?.profileLoaded,
    // currentUser: globalAuth?.currentUser?.email
  // });
  // console.log('═══════════════════════════════════════════════════════');
  
  // EXTRA VÉDELEM: Dupla ellenőrzés hogy admin esetén biztosan írható legyen
  // Ez 500ms késleltetéssel újra ellenőrzi és javítja ha kell
  setTimeout(() => {
    if (globalAuth && globalAuth.isAuthenticated() && globalAuth.isAdminUser()) {
      if (ta.readOnly || saveBtn.disabled || !canEdit) {
        // console.warn('⚠️ [Infosharer] ASYNC FIX: Admin vagy de readonly mód! Javítás...');
        canEdit = true;
        ta.readOnly = false;
        saveBtn.disabled = false;
        mainBtns.style.display = "none";
        authBtns.style.display = "flex";
        // console.log('✅ [Infosharer] ASYNC FIX alkalmazva');
      }
    }
  }, 500);
  
  // Realtime előfizetések indítása
  subscribeFileRealtime();
  
  // Tárhelyhasználat frissítése a főoldalon
  setInterval(() => {
    const totalStorageDisplay = document.getElementById('totalStorageDisplay');
    const totalStorageBar = document.getElementById('totalStorageBar');
    
    if (totalStorageDisplay && totalStorageBar) {
      // Dinamikus méretváltás: kB, MB vagy GB
      const formatSize = (bytes) => {
        if (bytes >= 1024 * 1024 * 1024) {
          // GB
          return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        } else if (bytes >= 1024 * 1024) {
          // MB
          return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        } else if (bytes >= 1024) {
          // kB
          return `${(bytes / 1024).toFixed(2)} kB`;
        } else {
          // B
          return `${bytes} B`;
        }
      };
      
      const usedDisplay = formatSize(totalStorageUsed);
      const totalDisplay = formatSize(MAX_STORAGE_BYTES);
      const percentage = (totalStorageUsed / MAX_STORAGE_BYTES) * 100;
      
      totalStorageDisplay.textContent = `${usedDisplay} / ${totalDisplay}`;
      totalStorageBar.style.width = `${percentage}%`;
      
      if (percentage > 90) {
        totalStorageBar.style.background = 'var(--error)';
      } else if (percentage > 70) {
        totalStorageBar.style.background = 'orange';
      } else {
        totalStorageBar.style.background = 'linear-gradient(90deg, var(--accent), var(--accent-light))';
      }
    }
  }, 1000);
  
  // Szövegszerkesztő inicializálása
  await load();
  subscribeRealtime();
  
  // Automatikus frissítés
  const REFRESH_INTERVAL = 1000;
  setInterval(async () => {
    try {
      if (canEdit && document.activeElement === ta) return;
      await load();
      const t = new Date();
      const hh = t.getHours().toString().padStart(2, "0");
      const mm = t.getMinutes().toString().padStart(2, "0");
      const ss = t.getSeconds().toString().padStart(2, "0");
      const stamp = hh + ":" + mm + ":" + ss;
      const currentState = statusEl.dataset.state || "ismeretlen";
      statusEl.textContent = "Kapcsolat: frissítve " + stamp;
      if (currentState) {
        statusEl.dataset.state = currentState;
      }
    } catch (e) {
      console.error(e);
    }
  }, REFRESH_INTERVAL);
}

// ====================================
// PUBLIKUS FÁJL LETÖLTÉS (BEJELENTKEZÉS NÉLKÜL)
// ====================================

/**
 * Publikus fájl letöltés URL paraméter alapján
 * Ez a függvény futhat BEJELENTKEZÉS NÉLKÜL is
 */
async function handlePublicFileDownload() {
  const urlParams = new URLSearchParams(window.location.search);
  const fileCode = urlParams.get('file');
  
  if (!fileCode) return false; // Nincs file paraméter
  
  // Slot szám kinyerése a kódból (pl. S1-xxx)
  const slotMatch = fileCode.match(/^S(\d+)-/);
  if (!slotMatch) {
    alert('❌ Érvénytelen fájl link!');
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }
  
  const targetSlot = parseInt(slotMatch[1]);
  
  // Overlay létrehozása
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(11, 9, 26, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    color: var(--text);
  `;
  
  overlay.innerHTML = `
    <div style="text-align: center; max-width: 500px; padding: 2rem;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">⏳</div>
      <h2 style="color: var(--accent-light); margin-bottom: 1rem;">Fájl betöltése...</h2>
      <p id="downloadStatus" style="color: var(--muted); margin-bottom: 2rem;">
        Slot ${targetSlot} fájljának lekérése...
      </p>
      <div style="width: 100%; height: 4px; background: rgba(127, 90, 240, 0.2); border-radius: 2px; overflow: hidden;">
        <div id="downloadProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-light)); transition: width 0.3s;"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const statusEl = document.getElementById('downloadStatus');
  const progressBar = document.getElementById('downloadProgressBar');
  
  try {
    // ELSŐKÉNT: Ellenőrizzük a localStorage-ban tárolt publikus linkeket
    statusEl.textContent = 'Link ellenőrzése...';
    progressBar.style.width = '20%';
    
    const publicLinks = JSON.parse(localStorage.getItem('infosharer_public_links') || '{}');
    const linkData = publicLinks[fileCode];
    
    if (linkData && linkData.url) {
      // Van publikus Google Drive link - ellenőrizzük hogy lejárt-e
      if (linkData.expirySeconds && linkData.createdAt) {
        const expiryMs = linkData.createdAt + (linkData.expirySeconds * 1000);
        if (Date.now() > expiryMs) {
          statusEl.textContent = '⚠️ A link lejárt';
          progressBar.style.width = '100%';
          progressBar.style.background = 'orange';
          setTimeout(() => {
            overlay.remove();
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 3000);
          return true;
        }
      }
      
      // Link érvényes - közvetlen átirányítás a Google Drive-ra
      statusEl.textContent = `Letöltés: ${linkData.originalName}`;
      progressBar.style.width = '100%';
      progressBar.style.background = 'var(--success)';
      
      setTimeout(() => {
        window.location.href = linkData.url;
      }, 500);
      
      return true; // Publikus link használva
    }

    // Ha a linkben érkezett publikus URL (másik böngészőből), közvetlenül arra irányítunk
    const urlFromParam = urlParams.get('publicUrl');
    if (urlFromParam) {
      statusEl.textContent = 'Átirányítás...';
      progressBar.style.width = '100%';
      progressBar.style.background = 'var(--success)';
      setTimeout(() => {
        window.location.href = decodeURIComponent(urlFromParam);
      }, 300);
      return true;
    }
    
    // NINCS publikus link - fallback Supabase-re
    statusEl.textContent = 'Fájl betöltése Supabase-ből...';
    progressBar.style.width = '30%';
    
    // Supabase inicializálása
    if (!supabase) {
      supabase = await getSupabaseClient();
    }
    
    // Publikus letöltéshez MINDIG Supabase-t használunk (Google Drive-hoz refresh token kellene)
    const publicStorageAdapter = new (await import('./storage-adapter.js')).StorageAdapter('supabase');
    await publicStorageAdapter.initialize();
    
    statusEl.textContent = 'Fájlok keresése...';
    progressBar.style.width = '50%';
    
    // Fájlok listázása
    const allFiles = await publicStorageAdapter.listFiles();
    
    // Slot mapping
    let fileData = null;
    if (allFiles && allFiles.length > 0) {
      allFiles.forEach((file) => {
        const match = file.name.match(/slot(\d+)_(.+)/);
        if (match) {
          const slotNum = parseInt(match[1]);
          if (slotNum === targetSlot) {
            fileData = {
              fileName: file.name,
              originalName: match[2],
              size: file.size || 0
            };
          }
        }
      });
    }
    
    if (!fileData) {
      statusEl.textContent = `❌ A fájl nem található (Slot ${targetSlot})`;
      progressBar.style.width = '100%';
      progressBar.style.background = 'var(--error)';
      setTimeout(() => {
        overlay.remove();
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 3000);
      return true;
    }
    
    // Supabase letöltés
    statusEl.textContent = `Letöltés: ${fileData.originalName}`;
    progressBar.style.width = '70%';
    
    const blob = await publicStorageAdapter.downloadFile(fileData.fileName);
    progressBar.style.width = '90%';
    
    // Blob URL
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileData.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Siker
    statusEl.textContent = `✅ Sikeres letöltés`;
    progressBar.style.width = '100%';
    progressBar.style.background = 'var(--success)';
    
    setTimeout(() => {
      overlay.remove();
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 2000);
    
  } catch (error) {
    console.error('Publikus letöltés hiba:', error);
    statusEl.textContent = `❌ Letöltési hiba: ${error.message}`;
    progressBar.style.width = '100%';
    progressBar.style.background = 'var(--error)';
    
    setTimeout(() => {
      overlay.remove();
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 4000);
  }
  
  return true; // Jelezzük hogy kezeltük a publikus linketet
}

// ====================================
// INDÍTÁS
// ====================================

// Először ellenőrizzük a publikus file download-ot (BEJELENTKEZÉS NÉLKÜL)
handlePublicFileDownload().then(isPublicDownload => {
  if (isPublicDownload) {
    // Ha publikus letöltés volt, ne folytassuk a normál inicializálást
    console.log('📥 Publikus fájl letöltés mód');
    return;
  }
  
  // Normál inicializálás
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
});

