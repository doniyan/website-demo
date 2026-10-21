/**
 * ============================================================================
 *  Code.gs — Backend CMS Website Sekolah (Google Apps Script + Google Sheets)
 * ============================================================================
 *  Cocok dengan frontend: assets/js/api.js, auth.js, admin.js
 *
 *  PEMASANGAN (sekali saja)
 *   1. Buat Google Sheet baru (kosong). Buka Extensions > Apps Script.
 *      (Script harus "terikat" ke sheet itu, supaya menu "Admin Sekolah" muncul.)
 *   2. Hapus isi Code.gs bawaan, tempel seluruh file ini. Simpan.
 *   3. Muat ulang Google Sheet. Menu baru "Admin Sekolah" akan muncul:
 *        a. Admin Sekolah > Siapkan lembar data   (membuat semua sheet + judul kolom)
 *        b. Admin Sekolah > Atur akun admin       (isi nama pengguna & kata sandi)
 *      Kata sandi TIDAK disimpan di kode maupun di sheet; hanya hash-nya di
 *      Script Properties.
 *   4. Deploy > New deployment > jenis "Web app"
 *        Execute as : Me
 *        Who has access : Anyone
 *      Setujui izin yang diminta (Sheets, Drive untuk unggah foto).
 *   5. Salin URL "/exec" ke assets/js/school.config.js (backend.gasUrl).
 *   6. Buka panel admin > Pengaturan > "Reset ke Data Bawaan" SEKALI untuk mengisi
 *      konten awal. Sebelum itu, perubahan pada daftar konten ditolak server
 *      (supaya data contoh tidak menimpa data yang belum terisi).
 *
 *  SETIAP KALI MENGUBAH KODE INI: Deploy > Manage deployments > Edit > New version.
 *
 *  MIGRASI dari backend lama: dari panel admin unduh "Cadangan JSON" lebih dulu,
 *  pasang backend ini, lalu impor file cadangan itu.
 *
 *  KEAMANAN (ringkas)
 *   - Semua perubahan konten, pembacaan pendaftar/pesan, impor, dan unggah foto
 *     butuh token admin (sesi maks. 6 jam). Token dikirim lewat body POST.
 *   - Publik hanya boleh: membaca konten terbit, mengirim pendaftaran PPDB, dan
 *     mengirim pesan kontak (divalidasi, dibatasi laju, dan ada jebakan bot).
 *   - Konten berstatus draf TIDAK ikut dikirim ke halaman publik.
 *   - Pendaftar & pesan tidak pernah masuk ke data publik.
 * ============================================================================
 */

var APP = {
  TZ: "Asia/Jakarta",
  SESSION_TTL_SEC: 6 * 60 * 60,        // 21600 detik = batas maksimum CacheService
  PW_ITERATIONS: 2000,
  LOGIN_MAX_FAILS: 8,                  // gagal login berturut-turut sebelum dikunci
  LOGIN_LOCK_SEC: 15 * 60,
  PUBLIC_RATE_MAX: 20,                 // kiriman publik per endpoint per jendela
  PUBLIC_RATE_WINDOW_SEC: 10 * 60,
  CELL_MAX: 45000,                     // batas Google Sheets: 50.000 karakter per sel
  MAX_COLUMNS: 40,
  UPLOAD_FOLDER_NAME: "Foto Website Sekolah",
  UPLOAD_MAX_BYTES: 2 * 1024 * 1024,
  ADMIN_ROLE: "Super Administrator"
};

/** Daftar koleksi (berisi banyak entri). Urutan kolom = urutan di sheet. */
var COLLECTIONS = {
  teachers:     { sheet: "Guru",       idPrefix: "T",   idSep: "",  idPad: 2,
                  columns: ["id", "name", "nip", "status", "category", "role", "subject", "motto", "email", "photo"] },
  news:         { sheet: "Berita",     idPrefix: "NW",  idSep: "-", idPad: 2, hideDraft: true,
                  columns: ["id", "slug", "title", "category", "author", "date", "image", "summary", "content", "status"] },
  announcements:{ sheet: "Pengumuman", idPrefix: "AN",  idSep: "-", idPad: 2, hideDraft: true,
                  columns: ["id", "title", "category", "date", "content", "link", "status"] },
  agenda:       { sheet: "Agenda",     idPrefix: "AG",  idSep: "-", idPad: 2, hideDraft: true,
                  columns: ["id", "title", "category", "date", "time", "location", "description", "status"] },
  gallery:      { sheet: "Galeri",     idPrefix: "GL",  idSep: "-", idPad: 2,
                  columns: ["id", "title", "category", "date", "image", "description"] },
  achievements: { sheet: "Prestasi",   idPrefix: "AC",  idSep: "-", idPad: 2,
                  columns: ["id", "title", "winner", "category", "level", "year", "image", "description"] },
  ppdbRegistrations: { sheet: "PPDB_Pendaftar", idPrefix: "REG", idSep: "-", idPad: 3, publicSubmit: true,
                  columns: ["id", "namaAnak", "nik", "jenisKelamin", "tempatLahir", "tanggalLahir", "namaOrtu", "teleponOrtu", "alamat", "status", "tanggalDaftar"] },
  messages:     { sheet: "Pesan",      idPrefix: "MSG", idSep: "-", idPad: 2, publicSubmit: true,
                  columns: ["id", "nama", "email", "telepon", "subjek", "pesan", "tanggal", "status"] }
};
var COMMON_EXTRA_COLUMNS = ["createdAt", "updatedAt"];

/** Data tunggal (satu objek) disimpan sebagai baris "kunci | nilai JSON" di sheet Pengaturan. */
var OBJECTS = { siteConfig: true, ppdb: true };
var SETTINGS_SHEET = "Pengaturan";

/** Endpoint yang boleh dibaca publik (konten terbit saja). */
var PUBLIC_ENDPOINTS = ["siteConfig", "teachers", "news", "announcements", "agenda", "gallery", "achievements", "ppdb"];

var JSON_PREFIX = "~json:";

/* ============================================================================
 *  PINTU MASUK WEB APP
 * ========================================================================== */

function doGet(e) {
  return handle_(function () {
    var p = (e && e.parameter) || {};
    var action = String(p.action || "");

    if (action === "bundle") return buildBundle_();

    if (action === "get") {
      var ep = String(p.endpoint || "");
      if (PUBLIC_ENDPOINTS.indexOf(ep) === -1) fail_("Silakan masuk sebagai admin terlebih dahulu.", 401);
      return readPublic_(ep);
    }
    return { name: "CMS Website Sekolah", status: "ok" };
  });
}

function doPost(e) {
  return handle_(function () {
    var p = (e && e.parameter) || {};
    var action = String(p.action || "");

    switch (action) {
      case "login":
        return login_(p);
      case "logout":
        return logout_(p);

      // ---- Pengiriman publik (tanpa token) ----
      case "post":
        if (isPublicSubmit_(p.endpoint)) return submitPublic_(String(p.endpoint), p);
        break;
    }

    // ---- Selebihnya khusus admin ----
    var session = requireAdmin_(p.token);

    switch (action) {
      case "get":         return adminGet_(String(p.endpoint || ""));
      case "post":        return adminPost_(String(p.endpoint || ""), p);
      case "put":         return adminPut_(String(p.endpoint || ""), p);
      case "delete":      return adminDelete_(String(p.endpoint || ""), p);
      case "import":      return adminImport_(p);
      case "uploadImage": return uploadImage_(p);
      default:            fail_("Aksi tidak dikenal.", 400);
    }
  });
}

/** Membungkus semua penanganan: hasil sukses/gagal selalu berbentuk JSON {success,data|error,code}. */
function handle_(fn) {
  var body;
  try {
    body = { success: true, data: fn() };
  } catch (err) {
    if (err && err.isApp) {
      body = { success: false, error: err.message, code: err.code || 400 };
    } else {
      console.error(String(err && err.stack ? err.stack : err));
      var busy = String(err && err.message || "").indexOf("Lock timeout") !== -1;
      body = { success: false, error: busy ? "Server sedang sibuk, coba lagi sebentar." : "Terjadi kesalahan pada server. Coba lagi.", code: busy ? 503 : 500 };
    }
  }
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function fail_(message, code) {
  var e = new Error(message);
  e.isApp = true;
  e.code = code || 400;
  throw e;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ============================================================================
 *  MENU DI GOOGLE SHEETS
 * ========================================================================== */

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu("Admin Sekolah")
      .addItem("Siapkan lembar data", "menuSiapkanLembar")
      .addItem("Atur akun admin", "menuAturAkunAdmin")
      .addItem("Cabut semua sesi login", "menuCabutSesi")
      .addToUi();
  } catch (e) { /* bukan konteks Sheets */ }
}

function menuSiapkanLembar() {
  Object.keys(COLLECTIONS).forEach(function (ep) { getCollectionSheet_(ep); });
  getSettingsSheet_();
  SpreadsheetApp.getUi().alert("Lembar data siap. Langkah berikutnya: Admin Sekolah > Atur akun admin.");
}

function menuAturAkunAdmin() {
  var ui = SpreadsheetApp.getUi();
  var u = ui.prompt("Atur akun admin", "Nama pengguna (3-40 karakter: huruf, angka, titik, strip, garis bawah):", ui.ButtonSet.OK_CANCEL);
  if (u.getSelectedButton() !== ui.Button.OK) return;
  var pw = ui.prompt("Atur akun admin", "Kata sandi baru (minimal 10 karakter). Catatan: kolom ini tidak tersamarkan di layar, pastikan tidak ada yang melihat.", ui.ButtonSet.OK_CANCEL);
  if (pw.getSelectedButton() !== ui.Button.OK) return;
  try {
    setAdminAccount_(u.getResponseText(), pw.getResponseText());
    ui.alert("Akun admin tersimpan. Semua sesi login lama dicabut.");
  } catch (err) {
    ui.alert("Gagal: " + (err && err.message ? err.message : err));
  }
}

function menuCabutSesi() {
  revokeAllSessions_();
  SpreadsheetApp.getUi().alert("Semua sesi login dicabut. Admin harus masuk kembali.");
}

/* ============================================================================
 *  AKUN ADMIN & SESI
 * ========================================================================== */

function props_() { return PropertiesService.getScriptProperties(); }

function hex_(bytes) {
  return bytes.map(function (b) { return ("0" + (b & 0xFF).toString(16)).slice(-2); }).join("");
}

function sha256Hex_(text) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8));
}

function hashPassword_(salt, password) {
  var h = salt + ":" + password;
  for (var i = 0; i < APP.PW_ITERATIONS; i++) h = sha256Hex_(h + salt);
  return h;
}

function safeEqual_(a, b) {
  a = String(a); b = String(b);
  var diff = a.length ^ b.length;
  var n = Math.max(a.length, b.length);
  for (var i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

function setAdminAccount_(username, password) {
  username = String(username || "").trim();
  password = String(password || "");
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) throw new Error("Nama pengguna harus 3-40 karakter (huruf, angka, titik, strip, garis bawah).");
  if (password.length < 10) throw new Error("Kata sandi minimal 10 karakter.");
  if (password.toLowerCase() === username.toLowerCase()) throw new Error("Kata sandi tidak boleh sama dengan nama pengguna.");
  var salt = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  var p = props_();
  p.setProperty("ADMIN_USER", username.toLowerCase());
  p.setProperty("ADMIN_SALT", salt);
  p.setProperty("ADMIN_HASH", hashPassword_(salt, password));
  revokeAllSessions_();
}

function sessionEpoch_() { return props_().getProperty("SESSION_EPOCH") || "0"; }

function revokeAllSessions_() {
  props_().setProperty("SESSION_EPOCH", String(Number(sessionEpoch_()) + 1));
}

function login_(p) {
  var cache = CacheService.getScriptCache();
  var all = props_().getProperties();
  if (!all.ADMIN_USER || !all.ADMIN_HASH) {
    fail_("Akun admin belum diatur. Di Google Sheets pilih menu Admin Sekolah > Atur akun admin.", 503);
  }

  var username = String(p.username || "").trim().toLowerCase();
  var password = String(p.password || "");
  var failKey = "fail:" + sha256Hex_(username).slice(0, 24);

  var fails = Number(cache.get(failKey) || 0);
  if (fails >= APP.LOGIN_MAX_FAILS) {
    fail_("Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.", 429);
  }

  var okUser = safeEqual_(username, all.ADMIN_USER);
  var okPass = safeEqual_(hashPassword_(all.ADMIN_SALT, password), all.ADMIN_HASH);
  if (!(okUser && okPass)) {
    cache.put(failKey, String(fails + 1), APP.LOGIN_LOCK_SEC);
    Utilities.sleep(600);
    fail_("Nama pengguna atau kata sandi tidak cocok.", 401);
  }
  cache.remove(failKey);

  var token = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  var expiresAt = Date.now() + APP.SESSION_TTL_SEC * 1000;
  cache.put("sess:" + sha256Hex_(token), JSON.stringify({ u: all.ADMIN_USER, ep: sessionEpoch_(), exp: expiresAt }), APP.SESSION_TTL_SEC);
  return { username: all.ADMIN_USER, role: APP.ADMIN_ROLE, token: token, expiresAt: expiresAt };
}

function logout_(p) {
  if (p.token) CacheService.getScriptCache().remove("sess:" + sha256Hex_(String(p.token)));
  return true;
}

function requireAdmin_(token) {
  var msg = "Sesi berakhir. Silakan masuk kembali.";
  if (!token) fail_(msg, 401);
  var raw = CacheService.getScriptCache().get("sess:" + sha256Hex_(String(token)));
  if (!raw) fail_(msg, 401);
  var s;
  try { s = JSON.parse(raw); } catch (e) { fail_(msg, 401); }
  if (!s || s.ep !== sessionEpoch_() || Date.now() > s.exp) fail_(msg, 401);
  return s;
}

/* ============================================================================
 *  LAPISAN SHEETS
 * ========================================================================== */

function ss_() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  var id = props_().getProperty("SPREADSHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  throw new Error("Spreadsheet tidak ditemukan. Pasang script dari Extensions > Apps Script di dalam Google Sheet.");
}

function textFormat_(sheet, row, col, numRows, numCols) {
  sheet.getRange(row, col, numRows, numCols).setNumberFormat("@");   // mencegah "0812.." jadi angka / NIK jadi notasi ilmiah
}

function ensureCapacity_(sheet, rows, cols) {
  if (sheet.getMaxRows() < rows) sheet.insertRowsAfter(sheet.getMaxRows(), rows - sheet.getMaxRows());
  if (sheet.getMaxColumns() < cols) sheet.insertColumnsAfter(sheet.getMaxColumns(), cols - sheet.getMaxColumns());
}

function getOrCreateSheet_(name, headers) {
  var ss = ss_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    ensureCapacity_(sheet, 2, headers.length);
    textFormat_(sheet, 1, 1, sheet.getMaxRows(), headers.length);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getCollectionSheet_(ep) {
  var c = COLLECTIONS[ep];
  return getOrCreateSheet_(c.sheet, c.columns.concat(COMMON_EXTRA_COLUMNS));
}

function getSettingsSheet_() { return getOrCreateSheet_(SETTINGS_SHEET, ["key", "value"]); }

function headerOf_(sheet) {
  var last = sheet.getLastColumn();
  if (last < 1) return [];
  return sheet.getRange(1, 1, 1, last).getValues()[0].map(String);
}

/** Pastikan semua kunci punya kolom; kolom baru ditambahkan di kanan. Mengembalikan header terbaru. */
function ensureColumns_(sheet, keys) {
  var header = headerOf_(sheet);
  var added = false;
  keys.forEach(function (k) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(k) || k === "__proto__") return;   // abaikan nama kolom aneh
    if (header.indexOf(k) === -1) {
      if (header.length >= APP.MAX_COLUMNS) fail_("Jumlah kolom melebihi batas (" + APP.MAX_COLUMNS + ").", 400);
      header.push(k);
      added = true;
    }
  });
  if (added) {
    ensureCapacity_(sheet, 2, header.length);
    textFormat_(sheet, 1, 1, sheet.getMaxRows(), header.length);
    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight("bold");
  }
  return header;
}

function encodeCell_(key, v) {
  var s;
  if (typeof v === "string") s = v.indexOf(JSON_PREFIX) === 0 ? JSON_PREFIX + JSON.stringify(v) : v;
  else s = JSON_PREFIX + JSON.stringify(v === undefined ? null : v);
  if (s.length > APP.CELL_MAX) fail_('Isi "' + key + '" terlalu panjang (maksimal ' + APP.CELL_MAX + " karakter).", 400);
  return s;
}

function decodeCell_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, APP.TZ, "yyyy-MM-dd");
  if (typeof v === "number") return String(v);
  if (typeof v !== "string") return "";
  if (v.indexOf(JSON_PREFIX) === 0) {
    try { return JSON.parse(v.slice(JSON_PREFIX.length)); } catch (e) { return v; }
  }
  return v;
}

function rowToItem_(header, row) {
  var item = {};
  for (var i = 0; i < header.length; i++) {
    if (header[i] === "") continue;
    if (row[i] === "" || row[i] === null || row[i] === undefined) continue;   // sel kosong = tidak ada nilai
    item[header[i]] = decodeCell_(row[i]);
  }
  return item;
}

function itemToRow_(header, item) {
  return header.map(function (k) {
    return Object.prototype.hasOwnProperty.call(item, k) ? encodeCell_(k, item[k]) : "";
  });
}

function readCollection_(ep) {
  var sheet = getCollectionSheet_(ep);
  var lastRow = sheet.getLastRow();
  var header = headerOf_(sheet);
  if (lastRow < 2 || !header.length) return [];
  var rows = sheet.getRange(2, 1, lastRow - 1, header.length).getValues();
  var items = [];
  rows.forEach(function (r) {
    var item = rowToItem_(header, r);
    if (item.id !== undefined && String(item.id) !== "") items.push(item);
  });
  return items;
}

function findRow_(sheet, header, id) {
  var idCol = header.indexOf("id") + 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2 || idCol < 1) return -1;
  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}

function writeRowAt_(sheet, rowIndex, header, item) {
  ensureCapacity_(sheet, rowIndex, header.length);
  textFormat_(sheet, rowIndex, 1, 1, header.length);
  sheet.getRange(rowIndex, 1, 1, header.length).setValues([itemToRow_(header, item)]);
}

/** Entri baru ditaruh di baris paling atas (terbaru lebih dulu), sama seperti mode lokal. */
function insertTop_(sheet, header, item) {
  if (sheet.getLastRow() >= 2) {
    ensureCapacity_(sheet, sheet.getLastRow() + 1, header.length);
    sheet.insertRowBefore(2);
  }
  writeRowAt_(sheet, 2, header, item);
}

function cleanItem_(obj) {
  var out = {};
  Object.keys(obj).forEach(function (k) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") return;
    out[k] = obj[k];
  });
  return out;
}

function nextId_(cfg, existingIds, prefixOverride) {
  var prefix = prefixOverride !== undefined ? prefixOverride : cfg.idPrefix + cfg.idSep;
  var max = 0;
  existingIds.forEach(function (id) {
    id = String(id);
    if (id.indexOf(prefix) === 0) {
      var tail = id.slice(prefix.length);
      if (/^\d+$/.test(tail)) max = Math.max(max, parseInt(tail, 10));
    }
  });
  var n = String(max + 1);
  while (n.length < cfg.idPad) n = "0" + n;
  return prefix + n;
}

function today_() { return Utilities.formatDate(new Date(), APP.TZ, "yyyy-MM-dd"); }

/* ---- data tunggal (siteConfig, ppdb) ---- */

function readObject_(key) {
  var sheet = getSettingsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === key) {
      try { return JSON.parse(String(rows[i][1])); } catch (e) { return null; }
    }
  }
  return null;
}

function writeObject_(key, obj) {
  var json = JSON.stringify(obj);
  if (json.length > APP.CELL_MAX) fail_("Data " + key + " terlalu besar (maksimal " + APP.CELL_MAX + " karakter).", 400);
  var sheet = getSettingsSheet_();
  var lastRow = sheet.getLastRow();
  var target = -1;
  if (lastRow >= 2) {
    var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) if (String(keys[i][0]) === key) { target = i + 2; break; }
  }
  if (target === -1) target = Math.max(lastRow, 1) + 1;
  ensureCapacity_(sheet, target, 2);
  textFormat_(sheet, target, 1, 1, 2);
  sheet.getRange(target, 1, 1, 2).setValues([[key, json]]);
}

/* ---- penanda "sudah diisi" & versi data ---- */

function isInit_(ep) { return props_().getProperty("INIT_" + ep) === "1"; }
function markInit_(ep) { if (!isInit_(ep)) props_().setProperty("INIT_" + ep, "1"); }
function bumpVersion_() {
  var prev = Number(currentVersion_()) || 0;
  props_().setProperty("DATA_VERSION", String(Math.max(Date.now(), prev + 1)));   // selalu naik, walau dua tulis dalam milidetik yang sama
}
/** Hanya konten yang tampil di halaman publik yang perlu memaksa pengunjung memuat ulang data. */
function bumpIfPublic_(ep) { if (PUBLIC_ENDPOINTS.indexOf(ep) !== -1) bumpVersion_(); }
function currentVersion_() { return props_().getProperty("DATA_VERSION") || "1"; }

/* ============================================================================
 *  PEMBACAAN PUBLIK (bundle)
 * ========================================================================== */

/** Satu endpoint untuk publik: null bila belum diisi; konten draf disaring. */
function readPublic_(ep) {
  if (!isInit_(ep)) return null;
  if (OBJECTS[ep]) return readObject_(ep);
  var cfg = COLLECTIONS[ep];
  var items = readCollection_(ep);
  if (cfg.hideDraft) items = items.filter(function (it) { return !!it.status; });
  return items;
}

function cacheGetChunked_(key) {
  var cache = CacheService.getScriptCache();
  var n = cache.get(key + ":n");
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < Number(n); i++) keys.push(key + ":" + i);
  var got = cache.getAll(keys);
  var out = "";
  for (var j = 0; j < keys.length; j++) {
    if (got[keys[j]] === undefined || got[keys[j]] === null) return null;
    out += got[keys[j]];
  }
  return out;
}

function cachePutChunked_(key, text, ttl) {
  var cache = CacheService.getScriptCache();
  var size = 30000, map = {}, n = Math.ceil(text.length / size);
  for (var i = 0; i < n; i++) map[key + ":" + i] = text.substr(i * size, size);
  map[key + ":n"] = String(n);
  try { cache.putAll(map, ttl); } catch (e) { /* cache hanya optimasi */ }
}

function buildBundle_() {
  var version = currentVersion_();
  var cacheKey = "bundle:" + version;       // versi berubah => kunci berubah => cache lama otomatis tak terpakai
  var cached = cacheGetChunked_(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* lanjut bangun ulang */ }
  }
  var data = {};
  PUBLIC_ENDPOINTS.forEach(function (ep) { data[ep] = readPublic_(ep); });
  var bundle = { version: version, data: data };
  cachePutChunked_(cacheKey, JSON.stringify(bundle), 600);
  return bundle;
}

/* ============================================================================
 *  OPERASI ADMIN
 * ========================================================================== */

function parseJson_(text, maxLen, what) {
  text = String(text || "");
  if (!text) fail_("Data " + what + " kosong.", 400);
  if (text.length > maxLen) fail_("Data " + what + " terlalu besar.", 413);
  try { return JSON.parse(text); } catch (e) { fail_("Format data " + what + " tidak valid.", 400); }
}

function isPlainObject_(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }

function requireKnown_(ep) {
  if (!OBJECTS[ep] && !Object.prototype.hasOwnProperty.call(COLLECTIONS, ep)) fail_("Endpoint tidak dikenal.", 400);
}

function requireSeeded_(ep) {
  // Daftar konten publik yang belum diisi: tolak ubah supaya data contoh tidak "menimpa" server kosong.
  if (!OBJECTS[ep] && PUBLIC_ENDPOINTS.indexOf(ep) !== -1 && !isInit_(ep)) {
    fail_('Data server belum diisi. Buka Pengaturan > "Reset ke Data Bawaan" satu kali, lalu ulangi.', 409);
  }
}

function adminGet_(ep) {
  requireKnown_(ep);
  if (OBJECTS[ep]) return isInit_(ep) ? readObject_(ep) : null;     // null => frontend memakai data bawaan
  var cfg = COLLECTIONS[ep];
  if (PUBLIC_ENDPOINTS.indexOf(ep) !== -1 && !isInit_(ep)) return null;
  return readCollection_(ep);   // admin melihat semua, termasuk draf
}

function adminPost_(ep, p) {
  requireKnown_(ep);
  var data = parseJson_(p.data, 200000, "entri");
  if (!isPlainObject_(data)) fail_("Format data entri tidak valid.", 400);
  if (OBJECTS[ep]) return adminPut_(ep, p);
  requireSeeded_(ep);

  return withLock_(function () {
    var cfg = COLLECTIONS[ep];
    var sheet = getCollectionSheet_(ep);
    var item = cleanItem_(data);
    var header = ensureColumns_(sheet, Object.keys(item).concat(["id", "createdAt"]));
    item.id = nextId_(cfg, readCollection_(ep).map(function (x) { return x.id; }));
    item.createdAt = new Date().toISOString();
    insertTop_(sheet, header, item);
    markInit_(ep);
    bumpIfPublic_(ep);
    return item;
  });
}

function adminPut_(ep, p) {
  requireKnown_(ep);
  var data = parseJson_(p.data, 200000, "entri");
  if (!isPlainObject_(data)) fail_("Format data tidak valid.", 400);
  data = cleanItem_(data);

  return withLock_(function () {
    if (OBJECTS[ep]) {
      if (ep === "ppdb") {
        // kuotaTerisi dihitung server (bertambah saat ada pendaftar); jangan tertimpa tampilan admin yang basi
        var existing = isInit_("ppdb") ? readObject_("ppdb") : null;
        if (existing && existing.kuotaTerisi !== undefined) data.kuotaTerisi = existing.kuotaTerisi;
      }
      writeObject_(ep, data);
      markInit_(ep);
      bumpIfPublic_(ep);
      return data;
    }

    requireSeeded_(ep);
    var cfg = COLLECTIONS[ep];
    var sheet = getCollectionSheet_(ep);
    var id = String(data.id === undefined ? "" : data.id);
    if (!id) fail_("ID entri tidak ada.", 400);

    var header = ensureColumns_(sheet, Object.keys(data).concat(["updatedAt", "createdAt"]));
    var rowIndex = findRow_(sheet, header, id);
    var item;
    if (rowIndex === -1) {
      item = data;
      item.id = id;
      item.createdAt = new Date().toISOString();
      insertTop_(sheet, header, item);
    } else {
      var current = rowToItem_(header, sheet.getRange(rowIndex, 1, 1, header.length).getValues()[0]);
      item = {};
      Object.keys(current).forEach(function (k) { item[k] = current[k]; });
      Object.keys(data).forEach(function (k) { item[k] = data[k]; });
      item.id = id;
      item.updatedAt = new Date().toISOString();
      writeRowAt_(sheet, rowIndex, header, item);
    }
    markInit_(ep);
    bumpIfPublic_(ep);
    return item;
  });
}

function adminDelete_(ep, p) {
  requireKnown_(ep);
  if (OBJECTS[ep]) fail_("Data ini tidak dapat dihapus.", 400);
  var id = String(p.id || "");
  if (!id) fail_("ID entri tidak ada.", 400);
  requireSeeded_(ep);

  return withLock_(function () {
    var sheet = getCollectionSheet_(ep);
    var header = headerOf_(sheet);
    var rowIndex = findRow_(sheet, header, id);
    if (rowIndex === -1) return { deleted: false };
    sheet.deleteRow(rowIndex);

    if (ep === "ppdbRegistrations" && isInit_("ppdb")) {
      var cfg = readObject_("ppdb");
      if (cfg) {
        cfg.kuotaTerisi = Math.max(0, (Number(cfg.kuotaTerisi) || 0) - 1);
        writeObject_("ppdb", cfg);
        bumpVersion_();                 // kuotaTerisi tampil di halaman PPDB publik
      }
    } else {
      bumpIfPublic_(ep);
    }
    return { deleted: true };
  });
}

/** Impor/pemulihan: menimpa isi tiap endpoint yang ada di data. Endpoint yang tidak disertakan tidak disentuh. */
function adminImport_(p) {
  var data = parseJson_(p.data, 8 * 1024 * 1024, "impor");
  if (!isPlainObject_(data)) fail_("Format data impor tidak valid.", 400);

  return withLock_(function () {
    var imported = [], skipped = [];
    Object.keys(data).forEach(function (ep) {
      var v = data[ep];
      if (OBJECTS[ep]) {
        if (isPlainObject_(v)) { writeObject_(ep, cleanItem_(v)); markInit_(ep); imported.push(ep); } else skipped.push(ep);
      } else if (Object.prototype.hasOwnProperty.call(COLLECTIONS, ep)) {
        if (Array.isArray(v)) { replaceCollection_(ep, v); markInit_(ep); imported.push(ep); } else skipped.push(ep);
      } else {
        skipped.push(ep);
      }
    });
    bumpVersion_();
    return { imported: imported, skipped: skipped };
  });
}

function replaceCollection_(ep, list) {
  var cfg = COLLECTIONS[ep];
  var sheet = getCollectionSheet_(ep);

  var items = [], seen = {}, keys = {};
  list.forEach(function (raw) {
    if (!isPlainObject_(raw)) return;
    var item = cleanItem_(raw);
    var id = String(item.id === undefined ? "" : item.id);
    if (!id || seen[id]) {
      id = nextId_(cfg, Object.keys(seen).concat(items.map(function (x) { return x.id; })));
    }
    item.id = id;
    seen[id] = true;
    Object.keys(item).forEach(function (k) { keys[k] = true; });
    items.push(item);
  });

  var header = ensureColumns_(sheet, Object.keys(keys).concat(["id"]));
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) sheet.getRange(2, 1, lastRow - 1, sheet.getMaxColumns()).clearContent();
  if (!items.length) return;

  ensureCapacity_(sheet, items.length + 1, header.length);
  textFormat_(sheet, 2, 1, items.length, header.length);
  sheet.getRange(2, 1, items.length, header.length).setValues(items.map(function (it) { return itemToRow_(header, it); }));
}

/* ============================================================================
 *  PENGIRIMAN PUBLIK: pendaftaran PPDB & pesan kontak
 * ========================================================================== */

function isPublicSubmit_(ep) {
  ep = String(ep || "");
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, ep) && COLLECTIONS[ep].publicSubmit === true;
}

function rateLimit_(ep) {
  var cache = CacheService.getScriptCache();
  var bucket = Math.floor(Date.now() / (APP.PUBLIC_RATE_WINDOW_SEC * 1000));
  var key = "rate:" + ep + ":" + bucket;
  var n = Number(cache.get(key) || 0);
  if (n >= APP.PUBLIC_RATE_MAX) fail_("Terlalu banyak pengiriman saat ini. Coba lagi beberapa menit lagi.", 429);
  cache.put(key, String(n + 1), APP.PUBLIC_RATE_WINDOW_SEC + 60);
}

function str_(v, min, max, label, optional) {
  var s = String(v === undefined || v === null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (!s && optional) return "";
  if (s.length < min) fail_(label + " wajib diisi" + (min > 1 ? " (minimal " + min + " karakter)" : "") + ".", 400);
  if (s.length > max) fail_(label + " terlalu panjang (maksimal " + max + " karakter).", 400);
  return s;
}

function singleLine_(v, min, max, label, optional) {
  return str_(String(v === undefined || v === null ? "" : v).replace(/[\r\n\t]+/g, " "), min, max, label, optional);
}

function validDate_(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  var d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function submitPublic_(ep, p) {
  var data = parseJson_(p.data, 20000, "formulir");
  if (!isPlainObject_(data)) fail_("Format data tidak valid.", 400);

  // Jebakan bot: kolom tersembunyi terisi => pura-pura berhasil, tidak disimpan
  if (String(data._hp || "").trim() !== "") return { id: ep === "messages" ? "MSG-00" : "REG-0000-000" };

  return withLock_(function () {
    rateLimit_(ep);
    return ep === "ppdbRegistrations" ? registerPPDB_(data) : saveMessage_(data);
  });
}

function registerPPDB_(d) {
  var rec = {
    namaAnak: singleLine_(d.namaAnak, 2, 100, "Nama calon siswa"),
    nik: String(d.nik || "").replace(/\s+/g, ""),
    jenisKelamin: String(d.jenisKelamin || ""),
    tempatLahir: singleLine_(d.tempatLahir, 2, 60, "Tempat lahir"),
    tanggalLahir: String(d.tanggalLahir || ""),
    namaOrtu: singleLine_(d.namaOrtu, 2, 100, "Nama orang tua/wali"),
    teleponOrtu: singleLine_(d.teleponOrtu, 1, 20, "Nomor telepon"),
    alamat: str_(d.alamat, 5, 300, "Alamat")
  };
  if (!/^\d{16}$/.test(rec.nik)) fail_("NIK harus 16 digit angka.", 400);
  if (["Laki-laki", "Perempuan"].indexOf(rec.jenisKelamin) === -1) fail_("Pilih jenis kelamin.", 400);
  if (!validDate_(rec.tanggalLahir) || rec.tanggalLahir > today_() || rec.tanggalLahir < "1990-01-01") fail_("Tanggal lahir tidak valid.", 400);
  if (!/^[0-9+\-\s()]{8,20}$/.test(rec.teleponOrtu) || rec.teleponOrtu.replace(/\D/g, "").length < 8) fail_("Nomor telepon tidak valid.", 400);

  var cfg = isInit_("ppdb") ? readObject_("ppdb") : null;
  if (cfg) {
    if (cfg.statusBuka === false) fail_("Pendaftaran PPDB sedang ditutup.", 403);
    var kuota = Number(cfg.kuota) || 0, terisi = Number(cfg.kuotaTerisi) || 0;
    if (kuota > 0 && terisi >= kuota) fail_("Mohon maaf, kuota pendaftaran sudah penuh.", 409);
  }

  var existing = readCollection_("ppdbRegistrations");
  if (existing.some(function (r) { return String(r.nik) === rec.nik; })) {
    fail_("NIK ini sudah terdaftar. Hubungi panitia bila ada kekeliruan data.", 409);
  }

  var year = (cfg && /^\d{4}/.test(String(cfg.tahunAjaran || ""))) ? String(cfg.tahunAjaran).slice(0, 4) : today_().slice(0, 4);
  var c = COLLECTIONS.ppdbRegistrations;
  rec.id = nextId_(c, existing.map(function (r) { return r.id; }), "REG-" + year + "-");
  rec.status = "Menunggu Verifikasi";
  rec.tanggalDaftar = today_();
  rec.createdAt = new Date().toISOString();

  var sheet = getCollectionSheet_("ppdbRegistrations");
  var header = ensureColumns_(sheet, Object.keys(rec));
  insertTop_(sheet, header, rec);
  markInit_("ppdbRegistrations");

  if (cfg) {
    cfg.kuotaTerisi = (Number(cfg.kuotaTerisi) || 0) + 1;
    writeObject_("ppdb", cfg);
  }
  bumpVersion_();
  return { id: rec.id, status: rec.status, tanggalDaftar: rec.tanggalDaftar };   // tidak mengembalikan data pribadi
}

function saveMessage_(d) {
  var rec = {
    nama: singleLine_(d.nama, 2, 100, "Nama"),
    email: singleLine_(d.email, 0, 120, "Email", true),
    telepon: singleLine_(d.telepon, 0, 20, "Telepon", true),
    subjek: singleLine_(d.subjek, 0, 150, "Subjek", true) || "(Tanpa subjek)",
    pesan: str_(d.pesan, 5, 3000, "Pesan")
  };
  if (rec.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rec.email)) fail_("Format email tidak valid.", 400);
  if (rec.telepon && !/^[0-9+\-\s()]{6,20}$/.test(rec.telepon)) fail_("Nomor telepon tidak valid.", 400);

  var c = COLLECTIONS.messages;
  var sheet = getCollectionSheet_("messages");
  rec.id = nextId_(c, readCollection_("messages").map(function (m) { return m.id; }));
  rec.tanggal = today_();
  rec.status = "Belum Dibaca";
  rec.createdAt = new Date().toISOString();

  var header = ensureColumns_(sheet, Object.keys(rec));
  insertTop_(sheet, header, rec);
  markInit_("messages");
  return { id: rec.id };
}

/* ============================================================================
 *  UNGGAH FOTO (Google Drive)
 * ========================================================================== */

var UPLOAD_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Hanya dipanggil dari doPost SETELAH requireAdmin_ lolos. */
function uploadImage_(p) {
  var mime = String((p && p.mime) || "");
  var ext = UPLOAD_TYPES[mime];
  if (!ext) fail_("Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.", 400);

  var b64 = String((p && p.data) || "");
  if (!b64) fail_("Data gambar kosong.", 400);
  if (b64.length > Math.ceil(APP.UPLOAD_MAX_BYTES * 4 / 3) + 8) fail_("Ukuran gambar melebihi batas 2 MB.", 413);

  var bytes = Utilities.base64Decode(b64);
  if (!bytes.length || bytes.length > APP.UPLOAD_MAX_BYTES) fail_("Ukuran gambar melebihi batas 2 MB.", 413);
  if (!matchesMime_(bytes, mime)) fail_("Isi file tidak sesuai dengan format gambar yang dinyatakan.", 400);

  var stamp = Utilities.formatDate(new Date(), APP.TZ, "yyyyMMdd-HHmmss");
  var name = stamp + "-" + safeBaseName_(p.filename) + "." + ext;

  var file = getUploadFolder_().createFile(Utilities.newBlob(bytes, mime, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var id = file.getId();
  return { id: id, name: name, url: "https://lh3.googleusercontent.com/d/" + id };
}

/** Periksa tanda awal file (magic number) agar file lain tidak bisa menyamar sebagai gambar. */
function matchesMime_(b, mime) {
  var x = function (i) { return b[i] & 0xFF; };   // byte di Apps Script bertanda (signed)
  if (mime === "image/jpeg") return b.length > 3 && x(0) === 0xFF && x(1) === 0xD8 && x(2) === 0xFF;
  if (mime === "image/png") return b.length > 8 && x(0) === 0x89 && x(1) === 0x50 && x(2) === 0x4E && x(3) === 0x47;
  if (mime === "image/webp") return b.length > 12 && x(0) === 0x52 && x(1) === 0x49 && x(2) === 0x46 && x(3) === 0x46 &&
                                    x(8) === 0x57 && x(9) === 0x45 && x(10) === 0x42 && x(11) === 0x50;
  return false;
}

function safeBaseName_(filename) {
  var base = String(filename || "foto").replace(/\.[^.]*$/, "");
  base = base.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return base || "foto";
}

function getUploadFolder_() {
  var id = props_().getProperty("UPLOAD_FOLDER_ID");
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* folder terhapus: buat ulang */ }
  }
  var folder = DriveApp.createFolder(APP.UPLOAD_FOLDER_NAME);
  props_().setProperty("UPLOAD_FOLDER_ID", folder.getId());
  return folder;
}
