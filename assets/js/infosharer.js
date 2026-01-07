// ====================================
// KONSTANSOK ÉS KONFIGURÁCIÓ
// ====================================

const SUPABASE_URL = "https://ccpuoqrbmldunshaxpes.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcHVvcXJibWxkdW5zaGF4cGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE2MDUsImV4cCI6MjA3ODA4NzYwNX0.QpVCmzF96Fp5hdgFyR0VkT9RV6qKiLkA8Yv_LArSk5I";
const TABLE = "infosharer";
const ID = 1;
const BUCKET_NAME = "infosharer-uploads";
const MAX_STORAGE_BYTES = 50 * 1024 * 1024; // 50 MB összesen
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per file

// Supabase kliens importálása dinamikusan
let supabase;
let globalAuth = null; // Auth instance from supabase-auth.js

async function initSupabase() {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm");
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
function calculateStorageUsage() {
  totalStorageUsed = 0;
  Object.values(slotMappings).forEach(fileData => {
    if (fileData && fileData.metadata && fileData.metadata.size) {
      totalStorageUsed += fileData.metadata.size;
    }
  });
  return totalStorageUsed;
}

// Tárhelyhasználat frissítése a modal-ban
function updateStorageDisplay() {
  const storageBar = document.getElementById('storageBar');
  const storageText = document.getElementById('storageText');
  const freeSpace = document.getElementById('freeSpace');
  
  if (!storageBar || !storageText || !freeSpace) return;
  
  const usedMB = (totalStorageUsed / (1024 * 1024)).toFixed(2);
  const totalMB = (MAX_STORAGE_BYTES / (1024 * 1024)).toFixed(0);
  const freeMB = ((MAX_STORAGE_BYTES - totalStorageUsed) / (1024 * 1024)).toFixed(2);
  const percentage = (totalStorageUsed / MAX_STORAGE_BYTES) * 100;
  
  storageBar.style.width = `${percentage}%`;
  storageText.textContent = `${usedMB} MB / ${totalMB} MB`;
  freeSpace.textContent = `${freeMB} MB`;
  
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
    // Először ellenőrizzük, hogy létezik-e a fájl
    const { data: fileExists, error: checkError } = await supabase.storage
      .from(BUCKET_NAME)
      .list("", {
        search: fileName
      });
    
    if (checkError) {
      console.error("Fájl ellenőrzési hiba:", checkError);
      throw checkError;
    }
    
    if (!fileExists || fileExists.length === 0) {
      throw new Error("A fájl nem található a tárolóban");
    }
    
    // Ha létezik, generálunk egy signed URL-t a megadott érvényességgel
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, expirySeconds);
    
    if (signedError) {
      console.error("Signed URL generálási hiba:", signedError);
      throw signedError;
    }
    
    // A signed URL-t emberi olvasható formába csomagoljuk
    const downloadUrl = signedUrlData.signedUrl;
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
    const customLink = `${baseUrl}?file=${shortCode}`;
    
    return {
      url: downloadUrl,
      customLink: customLink,
      displayName: displayName,
      expiryText: expiryText,
      shortCode: shortCode
    };
  } catch (err) {
    console.error('Download link generálási hiba:', err);
    throw err;
  }
}

// Slot-hoz tartozó fájl letöltése
async function downloadFile(fileName, originalName) {
  try {
    // Először ellenőrizzük, hogy létezik-e a fájl
    const { data: fileExists, error: checkError } = await supabase.storage
      .from(BUCKET_NAME)
      .list("", {
        search: fileName
      });
    
    if (checkError) {
      console.error("Fájl ellenőrzési hiba:", checkError);
      throw checkError;
    }
    
    if (!fileExists || fileExists.length === 0) {
      alert("A fájl nem található");
      return;
    }
    
    // Ha létezik, folytatjuk a letöltést
    // Blob letöltés - ez mindig letölti, nem nyitja meg
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(fileName);
    
    if (error) {
      console.error("Letöltési hiba:", error);
      throw error;
    }
    
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
    console.error("Blob letöltési hiba, alternatív módszer:", err);
    
    // Alternatív módszer: signed URL letöltése
    try {
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(fileName, 60);
      
      if (signedError) throw signedError;
      
      const a = document.createElement("a");
      a.href = signedUrlData.signedUrl;
      a.download = originalName || fileName.replace(/^slot\d+_/, "");
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    } catch (signedErr) {
      console.error("Signed URL letöltési hiba, public URL próba:", signedErr);
      
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
      
      const a = document.createElement("a");
      a.href = publicUrlData.publicUrl;
      a.download = originalName || fileName.replace(/^slot\d+_/, "");
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    }
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
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list("");
    
    if (error) {
      console.error("Fájllista hiba:", error);
      setFilesStatus("error", "Hiba a fájlok betöltésekor");
      return;
    }
    
    // Reseteljük a slot leképezéseket
    slotMappings = {};
    
    // Fájlok hozzárendelése a slotokhoz a fájlnév alapján
    if (data && data.length > 0) {
      data.forEach((file) => {
        const match = file.name.match(/slot(\d+)_(.+)/);
        if (match) {
          const slotNum = parseInt(match[1]);
          const originalName = match[2];
          slotMappings[slotNum] = {
            fileName: file.name,
            originalName: originalName,
            metadata: file.metadata,
            created_at: file.created_at
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
        
        // Kép URL lekérése
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileData.fileName);
        
        img.src = publicUrlData.publicUrl;
        img.alt = fileData.originalName;
        
        // Betöltési spinner
        const loadingSpinner = document.createElement("div");
        loadingSpinner.style.cssText = `
          position: absolute;
          font-size: 2rem;
        `;
        loadingSpinner.textContent = "⏳";
        imgPreview.appendChild(loadingSpinner);
        
        img.onload = () => {
          loadingSpinner.remove();
        };
        
        img.onerror = () => {
          loadingSpinner.textContent = "🖼️";
          loadingSpinner.style.fontSize = "3rem";
        };
        
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
      
      // Kattintható kártya - Info modal megnyitása
      if (isFilled) {
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
      const usedMB = (totalStorageUsed / (1024 * 1024)).toFixed(2);
      const totalMB = (MAX_STORAGE_BYTES / (1024 * 1024)).toFixed(0);
      setFilesStatus("success", `${filledSlots} slot • ${usedMB}/${totalMB} MB használva`);
      
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
    dropZoneContent.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 10px;">📁</div>
      <div style="color: var(--text); font-weight: 500; margin-bottom: 8px;">
        Kattints vagy húzd ide a fájlt
      </div>
      <div style="color: var(--muted); font-size: 0.9rem;">
        Maximális fájlméret: 50 MB
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
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileData.fileName);
    previewImage.src = publicUrlData.publicUrl;
    previewImage.alt = fileData.originalName;
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
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([existingFileData.fileName]);
    }
    
    // Feltöltés
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(slotFileName, file, {
        cacheControl: "3600",
        upsert: true,
      });
    
    uploadProgressBar.style.width = "90%";
    
    if (error) {
      console.error("Feltöltési hiba:", error);
      uploadProgressText.textContent = "Hiba a feltöltés során";
      uploadProgressText.style.color = "var(--error)";
      uploadProgressBar.style.background = "var(--error)";
      throw error;
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
    // Töröljük a fájlt
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileToDelete]);
    
    if (error) {
      console.error("Törlési hiba:", error);
      alert("Hiba a törlés során: " + error.message);
      return;
    }
    
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
    // Lekérjük az összes fájlt
    const { data: allFiles, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list("");
    
    if (listError) {
      console.error("Fájllista lekérési hiba:", listError);
      return;
    }
    
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
        
        // Letöltjük a fájlt
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from(BUCKET_NAME)
          .download(oldFileName);
        
        if (downloadError) {
          console.error("Fájl letöltési hiba átnevezéskor:", downloadError);
          continue;
        }
        
        // Feltöltjük az új névvel
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(newFileName, fileBlob, {
            cacheControl: "3600",
            upsert: true
          });
        
        if (uploadError) {
          console.error("Fájl feltöltési hiba átnevezéskor:", uploadError);
          continue;
        }
        
        // Töröljük a régit
        await supabase.storage
          .from(BUCKET_NAME)
          .remove([oldFileName]);
      }
    }
  } catch (err) {
    console.error("Átrendezési hiba:", err);
  }
}

// ====================================
// ESEMÉNYKEZELŐK
// ====================================

function setupEventListeners() {
  // Auth Modal inicializálás (SupabaseAuthModal from supabase-auth.js)
  const authModal = new window.SupabaseAuthModal(globalAuth);
  authModal.init({
    onSuccess: async () => {
      // Sikeres bejelentkezés után
      console.log('🔐 Bejelentkezés sikeres!');
      console.log('Admin user:', globalAuth.isAdminUser());
      console.log('Authenticated:', globalAuth.isAuthenticated());
      
      // Várjunk egy kicsit hogy a user_roles betöltődjön
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Admin ellenőrzés újra
      await globalAuth.loadUserProfile(globalAuth.getCurrentUser());
      
      console.log('Admin user (újra):', globalAuth.isAdminUser());
      
      // Admin ellenőrzés
      if (globalAuth.isAdminUser()) {
        console.log('✅ Admin jogosultság megvan!');
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
        console.log('❌ Nincs admin jog!');
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
      console.warn("unsubscribe error", e);
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
  
  // Supabase Auth inicializálása
  globalAuth = await window.initSupabaseAuth();
  
  // DOM elemek inicializálása
  initDOMElements();
  
  // Alapértelmezett beállítások - modal rejtve van CSS-ben, nem kell inline
  ta.readOnly = true;
  saveBtn.disabled = true;
  
  // Ellenőrizzük az authentikációt és admin jogot
  if (globalAuth.isAuthenticated() && globalAuth.isAdminUser()) {
    canEdit = true;
    ta.readOnly = false;
    saveBtn.disabled = false;
    mainBtns.style.display = "none";
    authBtns.style.display = "flex";
  }
  
  // Eseménykezelők beállítása
  setupEventListeners();
  
  // Slotok betöltése
  updateSlots();
  
  // URL paraméter ellenőrzése - egyedi link alapján automatikus letöltés
  const urlParams = new URLSearchParams(window.location.search);
  const fileCode = urlParams.get('file');
  if (fileCode) {
    const slotMatch = fileCode.match(/^S(\d+)-/);
    if (slotMatch) {
      const targetSlot = parseInt(slotMatch[1]);
      setTimeout(async () => {
        const fileData = slotMappings[targetSlot];
        if (fileData) {
          setFilesStatus('loading', `Letöltés indul: ${fileData.originalName}...`);
          await downloadFile(fileData.fileName, fileData.originalName);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setFilesStatus('error', `A fájl nem található (Slot ${targetSlot}). Lehet, hogy törölve lett.`);
        }
      }, 1000);
    }
  }
  
  // Realtime előfizetések indítása
  subscribeFileRealtime();
  
  // Tárhelyhasználat frissítése a főoldalon
  setInterval(() => {
    const totalStorageDisplay = document.getElementById('totalStorageDisplay');
    const totalStorageBar = document.getElementById('totalStorageBar');
    
    if (totalStorageDisplay && totalStorageBar) {
      const usedMB = (totalStorageUsed / (1024 * 1024)).toFixed(2);
      const totalMB = (MAX_STORAGE_BYTES / (1024 * 1024)).toFixed(0);
      const percentage = (totalStorageUsed / MAX_STORAGE_BYTES) * 100;
      
      totalStorageDisplay.textContent = `${usedMB} MB / ${totalMB} MB`;
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
// INDÍTÁS
// ====================================

// DOMContentLoaded eseményre várunk
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // Ha a DOM már betöltődött, azonnal indítunk
  initialize();
}
