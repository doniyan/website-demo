/**
 * SDN 2 Karangmangu - Central API Abstraction Layer
 * Dua mode:
 *  - LOKAL  (USE_REMOTE:false) : data di localStorage, untuk pengembangan/demo.
 *  - REMOTE (USE_REMOTE:true)  : data di Google Sheets lewat Google Apps Script (gas/Code.gs).
 *
 * Pada mode REMOTE:
 *  - Halaman publik membaca data lewat "bundle" yang di-cache ke localStorage (halaman tetap cepat).
 *  - Admin membaca/menulis lewat token sesi hasil login server.
 *  - Tidak ada fallback diam-diam ke localStorage (supaya data tidak "tersimpan" hanya di browser).
 */

const API_CONFIG = {
  // Diatur di assets/js/school.config.js (bagian BACKEND)
  GAS_URL: SCHOOL_CONFIG.backend.gasUrl,
  USE_REMOTE: SCHOOL_CONFIG.backend.useRemote
};

const _PUBLIC_EP = ["siteConfig", "teachers", "news", "announcements", "agenda", "gallery", "achievements", "ppdb"];
const _CONFIG_EP = ["siteConfig", "ppdb"];

function _remoteOn() {
  return !!(API_CONFIG.USE_REMOTE && API_CONFIG.GAS_URL);
}

// Petunjuk diagnosis: buka Console (F12) untuk melihat mode yang sedang dipakai halaman ini.
if (typeof console !== "undefined" && console.info) {
  console.info("[CMS] mode:", _remoteOn() ? "SERVER (…" + String(API_CONFIG.GAS_URL).slice(-10) + ")" : "DEMO LOKAL (tanpa backend)");
}

function _apiError(message, code) {
  const e = new Error(message);
  e.isApiError = true;
  e.code = code;
  return e;
}

function _token() {
  try {
    if (typeof Auth === "undefined") return null;
    const u = Auth.getUser();
    return u && u.token ? u.token : null;
  } catch (e) {
    return null;
  }
}

/** Panggilan POST ke GAS (form-urlencoded = "simple request", tanpa preflight CORS). */
async function _remote(action, params) {
  const body = new URLSearchParams(Object.assign({ action: action }, params || {}));
  const token = _token();
  if (token && action !== "login") body.set("token", token);

  let res;
  try {
    res = await fetch(API_CONFIG.GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body
    });
  } catch (e) {
    throw _apiError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
  }
  return _unwrap(res, action);
}

async function _remoteGetPublic(endpoint) {
  let res;
  try {
    res = await fetch(`${API_CONFIG.GAS_URL}?action=get&endpoint=${encodeURIComponent(endpoint)}`);
  } catch (e) {
    throw _apiError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
  }
  return _unwrap(res, "get");
}

async function _unwrap(res, action) {
  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw _apiError("Respons server tidak valid.");
  }
  if (!json.success) {
    if (json.code === 401 && action !== "login" && typeof Auth !== "undefined") Auth.logout();
    throw _apiError(json.error || "Permintaan ditolak server.", json.code);
  }
  return json.data;
}

const API = {
  /**
   * Mengambil data berdasarkan endpoint
   * @param {string} endpoint - 'siteConfig' | 'teachers' | 'news' | 'announcements' | 'agenda' | 'gallery' | 'achievements' | 'ppdb' | 'ppdbRegistrations' | 'messages'
   */
  async get(endpoint) {
    if (_remoteOn()) {
      let data;
      if (_token()) data = await _remote("get", { endpoint: endpoint });
      else if (_PUBLIC_EP.includes(endpoint)) data = await _remoteGetPublic(endpoint);
      else throw _apiError("Silakan masuk sebagai admin terlebih dahulu.", 401);

      if (data === null || data === undefined) {
        // Server belum berisi data (belum di-seed): pakai data bawaan agar UI tidak error
        if (typeof DEFAULT_DATA !== "undefined" && DEFAULT_DATA[endpoint] !== undefined) {
          return JSON.parse(JSON.stringify(DEFAULT_DATA[endpoint]));
        }
        return [];
      }
      return data;
    }

    // ---- Mode lokal ----
    const map = {
      siteConfig: () => loadSiteConfig(),
      teachers: () => loadTeachers(),
      news: () => loadNews(),
      announcements: () => loadAnnouncements(),
      agenda: () => loadAgenda(),
      gallery: () => loadGallery(),
      achievements: () => loadAchievements(),
      ppdb: () => loadPPDB(),
      ppdbRegistrations: () => loadPPDBRegistrations(),
      messages: () => loadMessages()
    };
    if (map[endpoint]) return map[endpoint]();
    const raw = localStorage.getItem(`sdn2_${endpoint}`);
    return raw ? JSON.parse(raw) : [];
  },

  /** Menambahkan entri baru. Mengembalikan entri tersimpan (termasuk id dari server). */
  async post(endpoint, data) {
    if (_remoteOn()) {
      if (_CONFIG_EP.includes(endpoint)) return _remote("put", { endpoint: endpoint, data: JSON.stringify(data) });
      return _remote("post", { endpoint: endpoint, data: JSON.stringify(data) });
    }

    if (endpoint === "siteConfig" || endpoint === "ppdb") {
      localStorage.setItem(`sdn2_${endpoint}`, JSON.stringify(data));
      return data;
    }
    const items = await this.get(endpoint);
    const newItem = {
      id: data.id || `${endpoint.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
      ...data
    };
    items.unshift(newItem);
    localStorage.setItem(`sdn2_${endpoint}`, JSON.stringify(items));
    return newItem;
  },

  /** Memperbarui entri berdasarkan ID */
  async put(endpoint, data) {
    if (_remoteOn()) {
      return _remote("put", { endpoint: endpoint, data: JSON.stringify(data) });
    }

    if (endpoint === "siteConfig" || endpoint === "ppdb") {
      localStorage.setItem(`sdn2_${endpoint}`, JSON.stringify(data));
      return data;
    }
    let items = await this.get(endpoint);
    const index = items.findIndex(item => item.id === data.id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(`sdn2_${endpoint}`, JSON.stringify(items));
      return items[index];
    }
    items.unshift(data);
    localStorage.setItem(`sdn2_${endpoint}`, JSON.stringify(items));
    return data;
  },

  /** Menghapus entri berdasarkan ID */
  async delete(endpoint, id) {
    if (_remoteOn()) {
      await _remote("delete", { endpoint: endpoint, id: id });
      return true;
    }

    let items = await this.get(endpoint);
    if (Array.isArray(items)) {
      items = items.filter(item => item.id !== id);
      localStorage.setItem(`sdn2_${endpoint}`, JSON.stringify(items));
      return true;
    }
    return false;
  },

  /** Ekspor seluruh data untuk cadangan (backup JSON) */
  async exportAll() {
    return {
      exportDate: new Date().toISOString(),
      school: SCHOOL_CONFIG.nama.sekolah,
      data: {
        siteConfig: await this.get("siteConfig"),
        teachers: await this.get("teachers"),
        news: await this.get("news"),
        announcements: await this.get("announcements"),
        agenda: await this.get("agenda"),
        gallery: await this.get("gallery"),
        achievements: await this.get("achievements"),
        ppdb: await this.get("ppdb"),
        ppdbRegistrations: await this.get("ppdbRegistrations"),
        messages: await this.get("messages")
      }
    };
  },

  /** True jika data disimpan di server (Google Sheets), false jika mode demo lokal. */
  isRemote() {
    return _remoteOn();
  },

  /**
   * Mengunggah gambar (sudah dikompres di browser).
   * Remote: dikirim ke Google Drive lewat GAS, mengembalikan { id, url }.
   * Lokal : mengembalikan data URL (hanya untuk demo, tersimpan di browser).
   * @param {{filename:string, mime:string, dataUrl:string}} img
   */
  async uploadImage(img) {
    if (_remoteOn()) {
      const base64 = String(img.dataUrl || "").split(",")[1] || "";
      if (!base64) throw _apiError("Data gambar kosong.");
      const data = await _remote("uploadImage", { filename: img.filename || "foto", mime: img.mime, data: base64 });
      if (!data || !data.url) throw _apiError("Server tidak mengembalikan alamat gambar.");
      return data;
    }
    return { url: img.dataUrl, local: true };
  },

  /** Impor data dari file backup JSON (menimpa data yang ada di backup) */
  async importAll(backupData) {
    if (!backupData || !backupData.data) {
      throw new Error("Format cadangan data tidak valid.");
    }
    if (_remoteOn()) {
      await _remote("import", { data: JSON.stringify(backupData.data) });
      return true;
    }
    for (const key of Object.keys(backupData.data)) {
      localStorage.setItem(`sdn2_${key}`, JSON.stringify(backupData.data[key]));
    }
    return true;
  },

  /**
   * Reset ke data bawaan.
   * Mode remote: hanya konten situs yang di-reset; data pendaftar PPDB & pesan TIDAK disentuh.
   */
  async resetToDefault() {
    if (_remoteOn()) {
      const payload = {};
      _PUBLIC_EP.forEach(k => { payload[k] = DEFAULT_DATA[k]; });
      await _remote("import", { data: JSON.stringify(payload) });
      return true;
    }
    for (const key in DEFAULT_DATA) {
      localStorage.setItem(`sdn2_${key}`, JSON.stringify(DEFAULT_DATA[key]));
    }
    return true;
  }
};

/* ---------------------------------------------------------------------------
 * Mode REMOTE: tampilkan error server sebagai toast (mis. kuota penuh, sesi habis)
 * ------------------------------------------------------------------------- */
if (_remoteOn()) {
  window.addEventListener("unhandledrejection", function (ev) {
    const r = ev.reason;
    if (r && r.isApiError && typeof Components !== "undefined" && Components.showToast) {
      Components.showToast("Terjadi Kendala", r.message, "error");
    }
  });
}

/* ---------------------------------------------------------------------------
 * Mode REMOTE (halaman publik): sinkronkan "bundle" server ke localStorage.
 * Halaman publik membaca localStorage secara sinkron (loadNews(), dst.), jadi
 * bila versi data di server berubah, halaman dimuat ulang SATU kali.
 * ------------------------------------------------------------------------- */
(function autoSyncPublicData() {
  if (!_remoteOn()) return;
  if (/\/admin/i.test(location.pathname)) return; // jangan ganggu panel admin

  const VKEY = "sdn2_data_version";
  const GUARD = "sdn2_sync_guard";
  let prev = null;
  try { prev = localStorage.getItem(VKEY); } catch (e) { return; } // localStorage tidak tersedia

  // Kunjungan pertama: sembunyikan halaman sebentar agar data contoh tidak sempat tampil
  const reveal = () => { document.documentElement.style.visibility = ""; };
  if (prev === null) {
    document.documentElement.style.visibility = "hidden";
    setTimeout(reveal, 4000);
  }

  fetch(`${API_CONFIG.GAS_URL}?action=bundle`)
    .then(r => r.json())
    .then(j => {
      if (!j || !j.success) return reveal();
      const version = String(j.data.version);
      if (version === prev) return reveal();

      let wrote = false;
      _PUBLIC_EP.forEach(k => {
        const v = j.data.data[k];
        if (v !== null && v !== undefined) { localStorage.setItem(`sdn2_${k}`, JSON.stringify(v)); wrote = true; }
      });
      localStorage.setItem(VKEY, version);

      // Muat ulang hanya bila ada data baru, dan cegah loop: maksimal sekali per versi per tab
      if (wrote && localStorage.getItem(VKEY) === version && sessionStorage.getItem(GUARD) !== version) {
        sessionStorage.setItem(GUARD, version);
        location.reload();
      } else {
        reveal();
      }
    })
    .catch(reveal);
})();
