/**
 * SDN 2 Karangmangu - Central Admin CMS Controller
 * Mengendalikan operasional Dashboard, CRUD semua modul (Berita, Pengumuman, Guru,
 * Agenda, Galeri, Prestasi, PPDB, Pesan, Pengaturan), serta ekspor/impor cadangan.
 */

/**
 * Escape HTML: wajib untuk data dari formulir publik (PPDB & buku tamu)
 * agar tidak bisa menyisipkan skrip ke dashboard admin (XSS).
 */
function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let currentTab = "dashboard";
let currentSearchQuery = "";
let currentCategoryFilter = "ALL";
let selectedRowIds = new Set();
let pendingDelete = { endpoint: "", id: "", title: "" };

document.addEventListener("DOMContentLoaded", () => {
  // 1. Proteksi Otentikasi
  if (typeof Auth !== "undefined") {
    Auth.protectDashboard();
    const user = Auth.getUser();
    if (user && document.getElementById("admin-display-name")) {
      document.getElementById("admin-display-name").textContent = user.username;
    }
  }

  // 2. Real-time Clock
  updateAdminClock();
  setInterval(updateAdminClock, 1000);

  // 3. Muat Statistik Awal & Buka Tab Dashboard
  refreshDashboardStats();
  switchAdminTab("dashboard");

  // 4. Tombol Logout
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Apakah Anda yakin ingin keluar dari sesi CMS Admin SDN 2 Karangmangu?")) {
        Auth.logout();
      }
    });
  }

  // 5. Sidebar Toggle untuk Tablet & Mobile
  const sidebarToggle = document.getElementById("sidebar-toggle-btn");
  const sidebar = document.getElementById("admin-sidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");
    });
  }
});

function updateAdminClock() {
  const el = document.getElementById("live-clock");
  if (!el) return;
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta"
  };
  el.textContent = new Intl.DateTimeFormat("id-ID", options).format(now) + " WIB";
}

/**
 * Pindah Tab Modul CMS
 */
function switchAdminTab(tabKey) {
  currentTab = tabKey;
  selectedRowIds.clear();
  currentSearchQuery = "";
  currentCategoryFilter = "ALL";
  updateBatchBar();

  // Highlight Nav Item Aktif
  document.querySelectorAll("[data-admin-tab]").forEach(btn => {
    if (btn.getAttribute("data-admin-tab") === tabKey) {
      btn.classList.add("bg-primary-container", "text-on-primary", "font-bold");
      btn.classList.remove("text-on-surface-variant", "hover:bg-surface-container-high");
    } else {
      btn.classList.remove("bg-primary-container", "text-on-primary", "font-bold");
      btn.classList.add("text-on-surface-variant", "hover:bg-surface-container-high");
    }
  });

  // Breadcrumb
  const breadcrumb = document.getElementById("active-breadcrumb-label");
  const titles = {
    dashboard: "Dashboard Ringkasan",
    news: "Kelola Berita & Publikasi",
    announcements: "Kelola Pengumuman Resmi",
    teachers: "Direktori Guru & Staf",
    agenda: "Kalender & Agenda Acara",
    gallery: "Dokumentasi & Galeri Foto",
    achievements: "Katalog Prestasi Siswa",
    ppdb: "Penerimaan Siswa Baru (PPDB)",
    messages: "Pesan & Buku Tamu",
    settings: "Pengaturan Website & Cadangan"
  };
  if (breadcrumb) breadcrumb.textContent = titles[tabKey] || tabKey;

  // Toggle container views
  const viewDashboard = document.getElementById("view-dashboard-summary");
  const viewTableCrud = document.getElementById("view-table-crud");
  const viewSettings = document.getElementById("view-settings-module");
  const viewPPDB = document.getElementById("view-ppdb-module");

  if (viewDashboard) viewDashboard.classList.add("hidden");
  if (viewTableCrud) viewTableCrud.classList.add("hidden");
  if (viewSettings) viewSettings.classList.add("hidden");
  if (viewPPDB) viewPPDB.classList.add("hidden");

  if (tabKey === "dashboard") {
    if (viewDashboard) viewDashboard.classList.remove("hidden");
    refreshDashboardStats();
    renderRecentActivities();
  } else if (tabKey === "settings") {
    if (viewSettings) viewSettings.classList.remove("hidden");
    loadSettingsIntoForm();
  } else if (tabKey === "ppdb") {
    if (viewPPDB) viewPPDB.classList.remove("hidden");
    loadPPDBConfigAndRegistrations();
  } else {
    if (viewTableCrud) viewTableCrud.classList.remove("hidden");
    setupCrudTableForTab(tabKey);
  }
}

/**
 * Muat Metrik Statistik Dashboard
 */
async function refreshDashboardStats() {
  const news = await API.get("news");
  const announcements = await API.get("announcements");
  const teachers = await API.get("teachers");
  const agenda = await API.get("agenda");
  const gallery = await API.get("gallery");
  const achievements = await API.get("achievements");
  const ppdbRegs = await API.get("ppdbRegistrations");
  const messages = await API.get("messages");

  setCount("stat-news", news.length);
  setCount("stat-announcements", announcements.length);
  setCount("stat-teachers", teachers.length);
  setCount("stat-agenda", agenda.length);
  setCount("stat-gallery", gallery.length);
  setCount("stat-achievements", achievements.length);
  setCount("stat-ppdb-regs", ppdbRegs.length);
  setCount("stat-messages", messages.length);
}

function setCount(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/**
 * Render Aktivitas Terbaru pada Dashboard
 */
async function renderRecentActivities() {
  const container = document.getElementById("recent-activities-list");
  if (!container) return;

  const news = await API.get("news");
  const regs = await API.get("ppdbRegistrations");
  const messages = await API.get("messages");

  const combined = [];

  news.slice(0, 3).forEach(n => {
    combined.push({
      type: "Berita",
      icon: "newspaper",
      color: "bg-primary-fixed text-primary",
      title: n.title,
      time: n.date,
      sub: `Kategori: ${n.category}`
    });
  });

  regs.slice(0, 2).forEach(r => {
    combined.push({
      type: "PPDB",
      icon: "how_to_reg",
      color: "bg-tertiary-fixed text-on-tertiary-fixed",
      title: `Pendaftaran Baru: ${esc(r.namaAnak)}`,
      time: r.tanggalDaftar || "Baru saja",
      sub: `Status: ${esc(r.status)}`
    });
  });

  messages.slice(0, 2).forEach(m => {
    combined.push({
      type: "Pesan",
      icon: "mail",
      color: "bg-secondary-fixed text-secondary",
      title: `Pesan dari ${esc(m.nama)}`,
      time: m.tanggal || "Baru saja",
      sub: m.subjek
    });
  });

  if (combined.length === 0) {
    container.innerHTML = `<p class="text-on-surface-variant font-body-sm py-4">Belum ada aktivitas tercatat.</p>`;
    return;
  }

  container.innerHTML = combined.map(item => `
    <div class="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
      <div class="w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="font-label-md text-label-md text-on-surface font-semibold truncate">${item.title}</span>
          <span class="font-body-sm text-[11px] text-on-surface-variant shrink-0">${item.time}</span>
        </div>
        <p class="font-body-sm text-[12px] text-on-surface-variant truncate">${item.sub}</p>
      </div>
    </div>
  `).join("");
}

// Konfigurasi schema per tab
const TAB_SCHEMAS = {
  news: {
    title: "Kelola Berita & Artikel",
    addBtnText: "+ Tambah Berita Baru",
    categories: ["Pendidikan", "Prestasi", "Kegiatan", "Kesiswaan", "Pengumuman"],
    columns: ["Cover", "Judul Berita", "Kategori", "Penulis", "Tanggal", "Status", "Aksi"],
    fields: [
      { name: "title", label: "Judul Berita", type: "text", required: true },
      { name: "category", label: "Kategori", type: "select", options: ["Pendidikan", "Prestasi", "Kegiatan", "Kesiswaan", "Pengumuman"] },
      { name: "author", label: "Penulis", type: "text", default: "Humas Sekolah" },
      { name: "date", label: "Tanggal Publikasi", type: "date", required: true },
      { name: "image", label: "Gambar Cover", type: "image" },
      { name: "summary", label: "Ringkasan Singkat (Lead)", type: "textarea", rows: 2 },
      { name: "content", label: "Isi Berita Lengkap", type: "textarea", rows: 5, required: true },
      { name: "status", label: "Publikasikan Langsung", type: "checkbox", default: true }
    ]
  },
  announcements: {
    title: "Kelola Pengumuman Resmi",
    addBtnText: "+ Tambah Pengumuman",
    categories: ["PPDB", "Tata Tertib", "Libur Nasional", "Akademik", "Umum"],
    columns: ["Ikon", "Judul Pengumuman", "Kategori", "Tanggal", "Tautan/Lampiran", "Status", "Aksi"],
    fields: [
      { name: "title", label: "Judul Pengumuman", type: "text", required: true },
      { name: "category", label: "Kategori Pengumuman", type: "select", options: ["PPDB", "Tata Tertib", "Libur Nasional", "Akademik", "Umum"] },
      { name: "date", label: "Tanggal Pengumuman", type: "date", required: true },
      { name: "link", label: "Tautan Lampiran / Halaman Terkait", type: "text", placeholder: "ppdb.html atau URL Google Drive" },
      { name: "content", label: "Isi Rinci Pengumuman", type: "textarea", rows: 4, required: true },
      { name: "status", label: "Tayangkan di Portal", type: "checkbox", default: true }
    ]
  },
  teachers: {
    title: "Direktori Guru & Staf",
    addBtnText: "+ Tambah Pendidik / Staf",
    categories: ["guru-kelas", "guru-mapel", "tendik"],
    categoryLabels: { "guru-kelas": "Guru Kelas", "guru-mapel": "Guru Mapel", "tendik": "Tenaga Didik / TU" },
    columns: ["Foto", "Nama & NIP", "Kategori", "Jabatan / Tugas", "Email", "Aksi"],
    fields: [
      { name: "name", label: "Nama Lengkap & Gelar", type: "text", required: true },
      { name: "nip", label: "NIP / Nomor Pegawai", type: "text", required: true },
      { name: "category", label: "Kategori", type: "select", options: [
        { val: "guru-kelas", label: "Guru Kelas (1 - 6)" },
        { val: "guru-mapel", label: "Guru Mapel (Agama, PJOK, Seni)" },
        { val: "tendik", label: "Tenaga Kependidikan / TU" }
      ]},
      { name: "role", label: "Jabatan Utama", type: "text", placeholder: "Contoh: Wali Kelas 3A / Koord. Kurikulum", required: true },
      { name: "subject", label: "Mata Pelajaran / Bidang Tugas", type: "text", required: true },
      { name: "status", label: "Status Kepegawaian", type: "text", placeholder: "PNS / PPPK / Honorer" },
      { name: "email", label: "Alamat Email", type: "email", placeholder: "guru@" + SCHOOL_CONFIG.kontak.domain },
      { name: "photo", label: "Foto Profil", type: "image", maxSize: 600 },
      { name: "motto", label: "Kutipan / Motto Pendidik", type: "textarea", rows: 2 }
    ]
  },
  agenda: {
    title: "Kalender & Agenda Acara",
    addBtnText: "+ Tambah Agenda",
    categories: ["Ujian", "Upacara", "Akademik", "Kesiswaan", "Rapat Komite"],
    columns: ["Waktu", "Nama Kegiatan", "Kategori", "Lokasi", "Status", "Aksi"],
    fields: [
      { name: "title", label: "Nama Agenda / Kegiatan", type: "text", required: true },
      { name: "category", label: "Kategori Acara", type: "select", options: ["Ujian", "Upacara", "Akademik", "Kesiswaan", "Rapat Komite", "Pentas Seni"] },
      { name: "date", label: "Tanggal Pelaksanaan", type: "date", required: true },
      { name: "time", label: "Waktu Pelaksanaan", type: "text", placeholder: "07.30 - 11.30 WIB" },
      { name: "location", label: "Lokasi / Ruangan", type: "text", placeholder: "Lapangan Sekolah / Aula" },
      { name: "description", label: "Deskripsi Acara", type: "textarea", rows: 3 },
      { name: "status", label: "Status Aktif", type: "checkbox", default: true }
    ]
  },
  gallery: {
    title: "Dokumentasi & Galeri Foto",
    addBtnText: "+ Tambah Foto Galeri",
    categories: ["Kepramukaan", "Kesehatan", "Seni & Budaya", "STEM", "Kegiatan Belajar"],
    columns: ["Foto", "Judul Dokumentasi", "Kategori", "Tanggal", "Aksi"],
    fields: [
      { name: "title", label: "Judul Foto / Kegiatan", type: "text", required: true },
      { name: "category", label: "Kategori Album", type: "select", options: ["Kepramukaan", "Kesehatan", "Seni & Budaya", "STEM", "Kegiatan Belajar", "Lingkungan"] },
      { name: "date", label: "Tanggal Dokumentasi", type: "date", required: true },
      { name: "image", label: "Gambar Dokumentasi", type: "image", required: true },
      { name: "description", label: "Keterangan Foto", type: "textarea", rows: 3 }
    ]
  },
  achievements: {
    title: "Katalog Prestasi Siswa",
    addBtnText: "+ Tambah Prestasi",
    categories: ["Sains & Matematika", "Kelembagaan", "Lingkungan Hidup", "Olahraga", "Seni Budaya"],
    columns: ["Foto", "Nama Prestasi", "Peraih / Tim", "Tingkat", "Tahun", "Aksi"],
    fields: [
      { name: "title", label: "Nama Prestasi / Juara", type: "text", required: true },
      { name: "winner", label: "Siswa / Tim Peraih", type: "text", required: true },
      { name: "category", label: "Bidang Prestasi", type: "select", options: ["Sains & Matematika", "Kelembagaan", "Lingkungan Hidup", "Olahraga", "Seni Budaya", "Keagamaan"] },
      { name: "level", label: "Tingkat Kejuaraan", type: "text", placeholder: "Kecamatan / Kabupaten / Provinsi" },
      { name: "year", label: "Tahun Raihan", type: "text", placeholder: "2025" },
      { name: "image", label: "Foto Dokumentasi / Tropi", type: "image" },
      { name: "description", label: "Keterangan Lengkap", type: "textarea", rows: 3 }
    ]
  },
  messages: {
    title: "Pesan Masuk & Buku Tamu",
    categories: [],
    columns: ["Pengirim", "Subjek", "Tanggal", "Isi Pesan", "Aksi"]
  }
};

/**
 * Setup Tabel CRUD Dinamis
 */
function setupCrudTableForTab(tabKey) {
  const schema = TAB_SCHEMAS[tabKey];
  if (!schema) return;

  const headerTitle = document.getElementById("crud-table-title");
  const addBtn = document.getElementById("btn-add-entity");
  const filterCat = document.getElementById("crud-category-filter");
  const searchInput = document.getElementById("crud-search-input");

  if (headerTitle) headerTitle.textContent = schema.title;
  if (addBtn) {
    if (schema.addBtnText) {
      addBtn.textContent = schema.addBtnText;
      addBtn.classList.remove("hidden");
    } else {
      addBtn.classList.add("hidden");
    }
  }

  // Isi Filter Kategori
  if (filterCat) {
    if (schema.categories && schema.categories.length > 0) {
      filterCat.classList.remove("hidden");
      let opts = `<option value="ALL">Semua Kategori</option>`;
      schema.categories.forEach(cat => {
        const label = schema.categoryLabels?.[cat] || cat;
        opts += `<option value="${cat}">${label}</option>`;
      });
      filterCat.innerHTML = opts;
    } else {
      filterCat.classList.add("hidden");
    }
  }

  if (searchInput) searchInput.value = "";

  renderCrudTable();
}

/**
 * Render Tabel Data
 */
async function renderCrudTable() {
  const tbody = document.getElementById("crud-table-tbody");
  const empty = document.getElementById("crud-empty-state");
  const paginationInfo = document.getElementById("crud-pagination-info");
  const selectAll = document.getElementById("select-all-checkbox");

  if (!tbody) return;
  tbody.innerHTML = "";
  if (selectAll) selectAll.checked = false;

  const items = await API.get(currentTab);
  const q = currentSearchQuery.toLowerCase();

  const filtered = items.filter(it => {
    const matchCat = currentCategoryFilter === "ALL" || it.category === currentCategoryFilter;
    const textSearch = (it.title || it.name || it.subjek || "") + " " + (it.content || it.description || it.pesan || "");
    const matchQ = textSearch.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  if (paginationInfo) {
    paginationInfo.textContent = `Menampilkan ${filtered.length} dari total ${items.length} data`;
  }

  if (filtered.length === 0) {
    if (empty) empty.classList.remove("hidden");
    return;
  } else {
    if (empty) empty.classList.add("hidden");
  }

  filtered.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-surface-container-low transition-colors group";

    const isChecked = selectedRowIds.has(item.id);

    // Dynamic Row Construction
    if (currentTab === "news") {
      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input type="checkbox" onchange="toggleSelectRow('${item.id}', this)" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-primary focus:ring-primary">
        </td>
        <td class="py-3 px-4">
          <img src="${item.image || 'https://via.placeholder.com/80x50'}" class="w-14 h-10 object-cover rounded-lg bg-surface-container">
        </td>
        <td class="py-3 px-4 max-w-sm">
          <div class="font-label-lg font-bold text-on-surface truncate">${item.title}</div>
          <div class="font-body-sm text-[12px] text-on-surface-variant line-clamp-1">${item.summary || item.content}</div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm">${item.category}</span>
        </td>
        <td class="py-3 px-4 whitespace-nowrap font-body-sm text-on-surface-variant">${item.author || '-'}</td>
        <td class="py-3 px-4 whitespace-nowrap font-body-sm text-on-surface-variant">${item.date}</td>
        <td class="py-3 px-4 text-center whitespace-nowrap">
          <button onclick="toggleEntityStatus('${item.id}')" class="px-2.5 py-1 rounded-full text-[11px] font-bold ${item.status ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-high text-on-surface-variant'}">
            ${item.status ? 'Terbit' : 'Draft'}
          </button>
        </td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openEditModal('${item.id}')" title="Edit" class="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button onclick="confirmDeleteEntity('${item.id}', '${item.title.replace(/'/g, "\\'")}')" title="Hapus" class="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      `;
    } else if (currentTab === "announcements") {
      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input type="checkbox" onchange="toggleSelectRow('${item.id}', this)" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-primary focus:ring-primary">
        </td>
        <td class="py-3 px-4">
          <div class="w-9 h-9 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-[18px]">campaign</span>
          </div>
        </td>
        <td class="py-3 px-4 max-w-sm">
          <div class="font-label-lg font-bold text-on-surface truncate">${item.title}</div>
          <div class="font-body-sm text-[12px] text-on-surface-variant line-clamp-1">${item.content}</div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm">${item.category}</span>
        </td>
        <td class="py-3 px-4 whitespace-nowrap font-body-sm text-on-surface-variant">${item.date}</td>
        <td class="py-3 px-4 text-center whitespace-nowrap">
          <button onclick="toggleEntityStatus('${item.id}')" class="px-2.5 py-1 rounded-full text-[11px] font-bold ${item.status ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-high text-on-surface-variant'}">
            ${item.status ? 'Tayang' : 'Draft'}
          </button>
        </td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openEditModal('${item.id}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button onclick="confirmDeleteEntity('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      `;
    } else if (currentTab === "teachers") {
      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input type="checkbox" onchange="toggleSelectRow('${item.id}', this)" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-primary focus:ring-primary">
        </td>
        <td class="py-3 px-4">
          <img src="${item.photo || 'https://via.placeholder.com/60'}" class="w-10 h-10 object-cover rounded-full bg-surface-container">
        </td>
        <td class="py-3 px-4">
          <div class="font-label-lg font-bold text-on-surface">${item.name}</div>
          <div class="font-body-sm text-[12px] text-on-surface-variant">NIP: ${item.nip || '-'}</div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm">${item.category}</span>
        </td>
        <td class="py-3 px-4 font-body-sm text-on-surface-variant">${item.role}</td>
        <td class="py-3 px-4 font-body-sm text-on-surface-variant">${item.email || '-'}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openEditModal('${item.id}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button onclick="confirmDeleteEntity('${item.id}', '${item.name.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      `;
    } else if (currentTab === "agenda") {
      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input type="checkbox" onchange="toggleSelectRow('${item.id}', this)" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-primary focus:ring-primary">
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="font-bold text-primary">${item.date}</div>
          <div class="text-[11px] text-on-surface-variant">${item.time || ''}</div>
        </td>
        <td class="py-3 px-4 max-w-sm">
          <div class="font-label-lg font-bold text-on-surface">${item.title}</div>
          <div class="font-body-sm text-[12px] text-on-surface-variant line-clamp-1">${item.description || '-'}</div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm">${item.category}</span>
        </td>
        <td class="py-3 px-4 font-body-sm text-on-surface-variant">${item.location || '-'}</td>
        <td class="py-3 px-4 text-center whitespace-nowrap">
          <button onclick="toggleEntityStatus('${item.id}')" class="px-2.5 py-1 rounded-full text-[11px] font-bold ${item.status ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-high text-on-surface-variant'}">
            ${item.status ? 'Aktif' : 'Selesai'}
          </button>
        </td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openEditModal('${item.id}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button onclick="confirmDeleteEntity('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      `;
    } else if (currentTab === "gallery") {
      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input type="checkbox" onchange="toggleSelectRow('${item.id}', this)" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-primary focus:ring-primary">
        </td>
        <td class="py-3 px-4">
          <img src="${item.image || 'https://via.placeholder.com/80'}" class="w-14 h-10 object-cover rounded-lg bg-surface-container">
        </td>
        <td class="py-3 px-4">
          <div class="font-label-lg font-bold text-on-surface">${item.title}</div>
          <div class="font-body-sm text-[12px] text-on-surface-variant line-clamp-1">${item.description || '-'}</div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm">${item.category}</span>
        </td>
        <td class="py-3 px-4 font-body-sm text-on-surface-variant whitespace-nowrap">${item.date}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openEditModal('${item.id}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button onclick="confirmDeleteEntity('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      `;
    } else if (currentTab === "achievements") {
      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input type="checkbox" onchange="toggleSelectRow('${item.id}', this)" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-primary focus:ring-primary">
        </td>
        <td class="py-3 px-4">
          <img src="${item.image || 'https://via.placeholder.com/80'}" class="w-14 h-10 object-cover rounded-lg bg-surface-container">
        </td>
        <td class="py-3 px-4">
          <div class="font-label-lg font-bold text-on-surface">${item.title}</div>
          <div class="font-body-sm text-[12px] text-on-surface-variant">${item.description || '-'}</div>
        </td>
        <td class="py-3 px-4 font-label-md text-on-surface font-semibold">${item.winner}</td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full bg-surface-container text-secondary font-label-sm">${item.level || '-'}</span>
        </td>
        <td class="py-3 px-4 font-body-sm text-on-surface-variant">${item.year}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openEditModal('${item.id}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button onclick="confirmDeleteEntity('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      `;
    } else if (currentTab === "messages") {
      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input type="checkbox" onchange="toggleSelectRow('${item.id}', this)" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-primary focus:ring-primary">
        </td>
        <td class="py-3 px-4">
          <div class="font-label-lg font-bold text-on-surface">${esc(item.nama)}</div>
          <div class="font-body-sm text-[12px] text-on-surface-variant">${esc(item.email || '-')} • ${esc(item.telepon || '-')}</div>
        </td>
        <td class="py-3 px-4 font-semibold text-primary">${esc(item.subjek)}</td>
        <td class="py-3 px-4 font-body-sm text-on-surface-variant whitespace-nowrap">${item.tanggal || '-'}</td>
        <td class="py-3 px-4 font-body-sm text-on-surface max-w-sm">${esc(item.pesan)}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            ${item.telepon ? `
              <a href="https://wa.me/${item.telepon.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(item.nama)},%20menanggapi%20pesan%20Anda%20ke%20SDN%202%20Karangmangu..." target="_blank" title="Balas via WhatsApp" class="p-1.5 rounded-lg text-[#25D366] hover:bg-emerald-50">
                <span class="material-symbols-outlined text-[18px]">chat</span>
              </a>
            ` : ''}
            <button data-title="Pesan dari ${esc(item.nama)}" onclick="confirmDeleteEntity('${esc(item.id)}', this.dataset.title)" class="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      `;
    }

    tbody.appendChild(tr);
  });
}

function handleCrudSearch(val) {
  currentSearchQuery = val;
  renderCrudTable();
}

function handleCrudCategory(val) {
  currentCategoryFilter = val;
  renderCrudTable();
}

/**
 * Pilihan Batch
 */
function toggleSelectAll(master) {
  API.get(currentTab).then(items => {
    if (master.checked) {
      items.forEach(i => selectedRowIds.add(i.id));
    } else {
      selectedRowIds.clear();
    }
    updateBatchBar();
    renderCrudTable();
  });
}

function toggleSelectRow(id, cb) {
  if (cb.checked) {
    selectedRowIds.add(id);
  } else {
    selectedRowIds.delete(id);
  }
  updateBatchBar();
}

function updateBatchBar() {
  const bar = document.getElementById("batch-action-bar");
  const countEl = document.getElementById("batch-count-label");
  if (!bar || !countEl) return;

  const count = selectedRowIds.size;
  if (count > 0) {
    bar.classList.remove("hidden");
    bar.classList.add("flex");
    countEl.textContent = `${count} dipilih`;
  } else {
    bar.classList.add("hidden");
    bar.classList.remove("flex");
  }
}

async function deleteSelectedBatch() {
  if (selectedRowIds.size === 0) return;
  if (confirm(`Yakin ingin menghapus ${selectedRowIds.size} data yang dipilih secara permanen?`)) {
    for (const id of selectedRowIds) {
      await API.delete(currentTab, id);
    }
    selectedRowIds.clear();
    updateBatchBar();
    renderCrudTable();
    refreshDashboardStats();
    Components.showToast("Sukses", "Data terpilih telah berhasil dihapus.");
  }
}

/**
 * Toggle Status Entitas (Draft/Publish)
 */
async function toggleEntityStatus(id) {
  const items = await API.get(currentTab);
  const it = items.find(i => i.id === id);
  if (it) {
    it.status = !it.status;
    await API.put(currentTab, it);
    renderCrudTable();
    Components.showToast("Status Diperbarui", `Status '${it.title || it.name}' diubah menjadi: ${it.status ? 'Aktif' : 'Non-aktif'}`);
  }
}

/**
 * Modal Form Universal CRUD
 */
function openCreateModal() {
  const schema = TAB_SCHEMAS[currentTab];
  if (!schema) return;

  document.getElementById("modal-entity-title").textContent = schema.addBtnText;
  buildFormFields(schema.fields, null);

  const modal = document.getElementById("modal-universal-form");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

async function openEditModal(id) {
  const schema = TAB_SCHEMAS[currentTab];
  if (!schema) return;

  const items = await API.get(currentTab);
  const it = items.find(i => i.id === id);
  if (!it) return;

  document.getElementById("modal-entity-title").textContent = `Edit ${schema.title}`;
  buildFormFields(schema.fields, it);

  const modal = document.getElementById("modal-universal-form");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeFormModal() {
  const modal = document.getElementById("modal-universal-form");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

/* ============================================================
 * UNGGAH FOTO (field bertipe "image")
 * - Foto dikecilkan & dikompres di browser sebelum dikirim.
 * - Mode remote: diunggah ke Google Drive lewat GAS, kolom diisi URL hasil unggah.
 * - Mode lokal (demo): disimpan sebagai data URL kecil di browser.
 * ============================================================ */
const IMG_MAX_INPUT_BYTES = 15 * 1024 * 1024;   // batas file asli yang dipilih
const IMG_MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024; // batas setelah kompres (server menolak > 2 MB)
let pendingImageUploads = 0;

function setSubmitLocked(locked) {
  pendingImageUploads = Math.max(0, pendingImageUploads + (locked ? 1 : -1));
  const btn = document.querySelector("#universal-crud-form button[type='submit']");
  if (!btn) return;
  btn.disabled = pendingImageUploads > 0;
  btn.classList.toggle("opacity-60", btn.disabled);
  btn.classList.toggle("cursor-not-allowed", btn.disabled);
}

/** Mengecilkan gambar ke sisi terpanjang maxSize dan mengubahnya ke JPEG. */
function compressImage(file, opts) {
  const maxSize = (opts && opts.maxSize) || 1280;
  let quality = (opts && opts.quality) || 0.82;
  const limit = (opts && opts.limitBytes) || IMG_MAX_UPLOAD_BYTES;
  return new Promise((resolve, reject) => {
    const objUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      let w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return reject(new Error("Gambar tidak valid."));
      const scale = Math.min(1, maxSize / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";           // PNG transparan -> latar putih (JPEG tidak mendukung transparansi)
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      const bytesOf = (u) => Math.round((u.length - u.indexOf(",") - 1) * 0.75);
      while (bytesOf(dataUrl) > limit && quality > 0.45) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      resolve({ dataUrl, mime: "image/jpeg", width: w, height: h, bytes: bytesOf(dataUrl) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error("File tidak dapat dibaca sebagai gambar."));
    };
    img.src = objUrl;
  });
}

function buildImageField(wrap, f, val) {
  const INPUT_CLS = "w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface border border-surface-container focus:ring-2 focus:ring-primary";
  const BTN_CLS = "inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md";

  const row = document.createElement("div");
  row.className = "flex items-center gap-3";

  const prev = document.createElement("img");
  prev.alt = "Pratinjau gambar";
  prev.className = "w-20 h-14 object-cover rounded-lg bg-surface-container border border-surface-container shrink-0";
  const showPreview = (u) => {
    if (u) { prev.src = u; prev.classList.remove("hidden"); }
    else { prev.removeAttribute("src"); prev.classList.add("hidden"); }
  };

  const btns = document.createElement("div");
  btns.className = "flex flex-wrap items-center gap-2";

  const pick = document.createElement("button");
  pick.type = "button";                      // penting: bukan submit
  pick.className = BTN_CLS;
  pick.innerHTML = '<span class="material-symbols-outlined text-[18px]">upload</span> Unggah foto';

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = BTN_CLS;
  clear.textContent = "Hapus";

  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/*";
  file.className = "hidden";

  btns.appendChild(pick);
  btns.appendChild(clear);
  btns.appendChild(file);
  row.appendChild(prev);
  row.appendChild(btns);
  wrap.appendChild(row);

  const status = document.createElement("p");
  status.className = "font-body-sm text-on-surface-variant";
  status.setAttribute("role", "status");
  status.textContent = (typeof API !== "undefined" && API.isRemote && !API.isRemote())
    ? "Mode demo: foto hanya tersimpan di browser ini."
    : "Pilih foto dari perangkat, atau tempel alamat gambar di bawah.";
  wrap.appendChild(status);

  // Kolom teks (id yang sama dengan field lain, jadi handleModalSubmit membacanya apa adanya)
  const inp = document.createElement("input");
  inp.type = "text";
  inp.id = `form-field-${f.name}`;
  inp.className = INPUT_CLS;
  inp.value = val;
  inp.required = !!f.required;
  inp.placeholder = "atau tempel alamat gambar (https://...)";
  wrap.appendChild(inp);

  showPreview(val);
  inp.addEventListener("input", () => showPreview(inp.value.trim()));
  pick.addEventListener("click", () => file.click());
  clear.addEventListener("click", () => {
    inp.value = "";
    showPreview("");
    status.textContent = "Gambar dihapus dari isian ini.";
  });

  file.addEventListener("change", async () => {
    const chosen = file.files && file.files[0];
    file.value = "";
    if (!chosen) return;
    if (!chosen.type.startsWith("image/")) {
      Components.showToast("Bukan Gambar", "Pilih file gambar (JPG, PNG, atau WebP).", "error");
      return;
    }
    if (chosen.size > IMG_MAX_INPUT_BYTES) {
      Components.showToast("File Terlalu Besar", "Ukuran foto maksimal 15 MB sebelum dikompres.", "error");
      return;
    }

    const remote = API.isRemote();
    setSubmitLocked(true);
    pick.disabled = true;
    try {
      status.textContent = "Memproses foto…";
      const img = await compressImage(chosen, {
        maxSize: remote ? (f.maxSize || 1280) : 640,
        quality: remote ? 0.82 : 0.7,
        limitBytes: remote ? IMG_MAX_UPLOAD_BYTES : 150 * 1024
      });
      showPreview(img.dataUrl);

      status.textContent = remote ? `Mengunggah (${Math.round(img.bytes / 1024)} KB)…` : "Menyimpan…";
      const res = await API.uploadImage({ filename: chosen.name, mime: img.mime, dataUrl: img.dataUrl });
      inp.value = res.url;
      status.textContent = remote
        ? `Foto terunggah (${img.width}×${img.height}, ${Math.round(img.bytes / 1024)} KB). Klik "Simpan Perubahan" untuk menerapkan.`
        : "Foto disimpan di browser (mode demo).";
    } catch (err) {
      status.textContent = "Gagal mengunggah foto.";
      Components.showToast("Gagal Mengunggah", (err && err.message) || "Terjadi kesalahan saat mengunggah foto.", "error");
    } finally {
      pick.disabled = false;
      setSubmitLocked(false);
    }
  });
}

function buildFormFields(fields, data) {
  const container = document.getElementById("modal-fields-container");
  container.innerHTML = "";

  // Hidden ID
  const hiddenId = document.createElement("input");
  hiddenId.type = "hidden";
  hiddenId.id = "form-field-id";
  hiddenId.value = data ? data.id : "";
  container.appendChild(hiddenId);

  fields.forEach(f => {
    const wrap = document.createElement("div");
    wrap.className = "flex flex-col gap-1";

    const label = document.createElement("label");
    label.className = "font-label-md text-on-surface font-semibold";
    label.innerHTML = `${f.label} ${f.required ? '<span class="text-error">*</span>' : ''}`;
    wrap.appendChild(label);

    const val = data ? (data[f.name] !== undefined ? data[f.name] : "") : (f.default !== undefined ? f.default : "");

    if (f.type === "select") {
      const select = document.createElement("select");
      select.id = `form-field-${f.name}`;
      select.className = "w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface border border-surface-container focus:ring-2 focus:ring-primary";
      select.required = !!f.required;

      f.options.forEach(opt => {
        const o = document.createElement("option");
        if (typeof opt === "object") {
          o.value = opt.val;
          o.textContent = opt.label;
        } else {
          o.value = opt;
          o.textContent = opt;
        }
        if (o.value === val) o.selected = true;
        select.appendChild(o);
      });
      wrap.appendChild(select);
    } else if (f.type === "textarea") {
      const ta = document.createElement("textarea");
      ta.id = `form-field-${f.name}`;
      ta.rows = f.rows || 3;
      ta.className = "w-full p-3 rounded-xl bg-surface-container-low text-on-surface border border-surface-container focus:ring-2 focus:ring-primary";
      ta.value = val;
      ta.required = !!f.required;
      if (f.placeholder) ta.placeholder = f.placeholder;
      wrap.appendChild(ta);
    } else if (f.type === "checkbox") {
      const cbWrap = document.createElement("label");
      cbWrap.className = "inline-flex items-center gap-2 cursor-pointer mt-1";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = `form-field-${f.name}`;
      cb.className = "w-4 h-4 rounded text-primary focus:ring-primary";
      cb.checked = val === true;
      cbWrap.appendChild(cb);
      const span = document.createElement("span");
      span.className = "font-body-sm text-on-surface";
      span.textContent = "Ya, aktifkan opsi ini";
      cbWrap.appendChild(span);
      wrap.appendChild(cbWrap);
    } else if (f.type === "image") {
      buildImageField(wrap, f, val);
    } else {
      const inp = document.createElement("input");
      inp.type = f.type || "text";
      inp.id = `form-field-${f.name}`;
      inp.className = "w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface border border-surface-container focus:ring-2 focus:ring-primary";
      inp.value = val;
      inp.required = !!f.required;
      if (f.placeholder) inp.placeholder = f.placeholder;
      wrap.appendChild(inp);
    }

    container.appendChild(wrap);
  });
}

async function handleModalSubmit(e) {
  e.preventDefault();
  const schema = TAB_SCHEMAS[currentTab];
  if (!schema) return;

  const id = document.getElementById("form-field-id").value;
  const payload = { id: id || undefined };

  schema.fields.forEach(f => {
    const el = document.getElementById(`form-field-${f.name}`);
    if (el) {
      if (f.type === "checkbox") {
        payload[f.name] = el.checked;
      } else {
        payload[f.name] = el.value.trim();
      }
    }
  });

  if (id) {
    await API.put(currentTab, payload);
    Components.showToast("Data Diperbarui", "Perubahan data berhasil disimpan.");
  } else {
    await API.post(currentTab, payload);
    Components.showToast("Data Ditambahkan", "Entri baru berhasil dipublikasikan.");
  }

  closeFormModal();
  renderCrudTable();
  refreshDashboardStats();
}

/**
 * Konfirmasi Hapus Data Universal
 */
function confirmDeleteEntity(id, title) {
  pendingDelete = { endpoint: currentTab, id, title };
  document.getElementById("delete-modal-msg").textContent = `Apakah Anda yakin ingin menghapus '${title}'? Tindakan ini tidak dapat dibatalkan.`;
  const m = document.getElementById("modal-delete-confirm");
  m.classList.remove("hidden");
  m.classList.add("flex");
}

function closeDeleteConfirmModal() {
  const m = document.getElementById("modal-delete-confirm");
  m.classList.add("hidden");
  m.classList.remove("flex");
  pendingDelete = { endpoint: "", id: "", title: "" };
}

async function executeConfirmedDelete() {
  if (!pendingDelete.id) return;
  await API.delete(pendingDelete.endpoint, pendingDelete.id);
  selectedRowIds.delete(pendingDelete.id);
  closeDeleteConfirmModal();
  updateBatchBar();
  renderCrudTable();
  refreshDashboardStats();
  Components.showToast("Dihapus", "Data berhasil dihapus dari sistem.");
}

/**
 * Modul PPDB Pengaturan & Pendaftar
 */
async function loadPPDBConfigAndRegistrations() {
  const ppdbConfig = await API.get("ppdb");
  const regs = await API.get("ppdbRegistrations");

  // Isi form config PPDB
  const fStatus = document.getElementById("ppdb-cfg-status");
  const fTahun = document.getElementById("ppdb-cfg-tahun");
  const fKuota = document.getElementById("ppdb-cfg-kuota");
  const fSyarat = document.getElementById("ppdb-cfg-syarat");
  const fKontak = document.getElementById("ppdb-cfg-kontak");

  if (fStatus) fStatus.checked = !!ppdbConfig.statusBuka;
  if (fTahun) fTahun.value = ppdbConfig.tahunAjaran || "2025/2026";
  if (fKuota) fKuota.value = ppdbConfig.kuota || 60;
  if (fSyarat) fSyarat.value = Array.isArray(ppdbConfig.syarat) ? ppdbConfig.syarat.join("\n") : "";
  if (fKontak) fKontak.value = ppdbConfig.kontakPanitia?.telepon || "";

  // Render Tabel Pendaftar PPDB
  const tbody = document.getElementById("ppdb-registrations-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (regs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-on-surface-variant font-body-sm">Belum ada pendaftaran calon siswa masuk.</td></tr>`;
    return;
  }

  regs.forEach(r => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-surface-container-low transition-colors";
    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold text-primary">${esc(r.id)}</td>
      <td class="py-3 px-4">
        <div class="font-label-lg font-bold text-on-surface">${esc(r.namaAnak)}</div>
        <div class="font-body-sm text-[12px] text-on-surface-variant">NIK: ${esc(r.nik)} • ${esc(r.jenisKelamin)}</div>
      </td>
      <td class="py-3 px-4 font-body-sm text-on-surface">${esc(r.tempatLahir)}, ${esc(r.tanggalLahir)}</td>
      <td class="py-3 px-4">
        <div class="font-body-sm font-semibold">${esc(r.namaOrtu)}</div>
        <div class="text-[12px] text-on-surface-variant">${esc(r.teleponOrtu)}</div>
      </td>
      <td class="py-3 px-4 whitespace-nowrap">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${r.status === 'Terverifikasi' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${esc(r.status)}
        </span>
      </td>
      <td class="py-3 px-4 whitespace-nowrap text-right">
        <div class="flex items-center justify-end gap-1">
          <button onclick="toggleVerifyPPDB('${esc(r.id)}')" title="Ubah Status Verifikasi" class="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-sm font-semibold">
            ${r.status === 'Terverifikasi' ? 'Batal Verif' : 'Verifikasi'}
          </button>
          <a href="https://wa.me/${r.teleponOrtu.replace(/[^0-9]/g, '')}?text=Halo%20Bapak/Ibu%20${encodeURIComponent(r.namaOrtu)},%20panitia%20PPDB%20SDN%202%20Karangmangu%20menginformasikan..." target="_blank" title="WhatsApp Wali" class="p-1.5 rounded-lg text-[#25D366] hover:bg-emerald-50">
            <span class="material-symbols-outlined text-[18px]">chat</span>
          </a>
          <button onclick="deletePPDBRegistration('${esc(r.id)}')" title="Hapus Berkas" class="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function savePPDBConfig(e) {
  e.preventDefault();
  const current = await API.get("ppdb");
  current.statusBuka = document.getElementById("ppdb-cfg-status").checked;
  current.tahunAjaran = document.getElementById("ppdb-cfg-tahun").value.trim();
  current.kuota = parseInt(document.getElementById("ppdb-cfg-kuota").value) || 60;
  current.syarat = document.getElementById("ppdb-cfg-syarat").value.split("\n").map(s => s.trim()).filter(Boolean);
  if (!current.kontakPanitia) current.kontakPanitia = {};
  current.kontakPanitia.telepon = document.getElementById("ppdb-cfg-kontak").value.trim();

  await API.put("ppdb", current);
  Components.showToast("PPDB Diperbarui", "Pengaturan PPDB berhasil disimpan.");
}

async function toggleVerifyPPDB(id) {
  const regs = await API.get("ppdbRegistrations");
  const r = regs.find(item => item.id === id);
  if (r) {
    r.status = r.status === "Terverifikasi" ? "Menunggu Verifikasi" : "Terverifikasi";
    await API.put("ppdbRegistrations", r);
    loadPPDBConfigAndRegistrations();
    Components.showToast("Verifikasi Diperbarui", `Status calon siswa ${r.namaAnak}: ${r.status}`);
  }
}

async function deletePPDBRegistration(id) {
  if (confirm("Hapus data pendaftaran calon siswa ini?")) {
    await API.delete("ppdbRegistrations", id);
    loadPPDBConfigAndRegistrations();
    refreshDashboardStats();
    Components.showToast("Pendaftar Dihapus", "Data pendaftaran calon siswa dibersihkan.");
  }
}

/**
 * Modul Pengaturan Website & Backup
 */
async function loadSettingsIntoForm() {
  const config = await API.get("siteConfig");

  document.getElementById("cfg-nama-sekolah").value = config.namaSekolah || "";
  document.getElementById("cfg-tagline").value = config.tagline || "";
  document.getElementById("cfg-telepon").value = config.telepon || "";
  document.getElementById("cfg-whatsapp").value = config.whatsapp || "";
  document.getElementById("cfg-email").value = config.email || "";
  document.getElementById("cfg-alamat").value = config.alamat || "";
  document.getElementById("cfg-kepsek").value = config.kepalaSekolah || "";
  document.getElementById("cfg-nip-kepsek").value = config.nipKepalaSekolah || "";
  document.getElementById("cfg-sambutan").value = config.sambutan || "";
  document.getElementById("cfg-visi").value = config.visi || "";
  document.getElementById("cfg-misi").value = Array.isArray(config.misi) ? config.misi.join("\n") : "";
}

async function saveGeneralSettings(e) {
  e.preventDefault();
  const current = await API.get("siteConfig");

  current.namaSekolah = document.getElementById("cfg-nama-sekolah").value.trim();
  current.tagline = document.getElementById("cfg-tagline").value.trim();
  current.telepon = document.getElementById("cfg-telepon").value.trim();
  current.whatsapp = document.getElementById("cfg-whatsapp").value.trim();
  current.email = document.getElementById("cfg-email").value.trim();
  current.alamat = document.getElementById("cfg-alamat").value.trim();
  current.kepalaSekolah = document.getElementById("cfg-kepsek").value.trim();
  current.nipKepalaSekolah = document.getElementById("cfg-nip-kepsek").value.trim();
  current.sambutan = document.getElementById("cfg-sambutan").value.trim();
  current.visi = document.getElementById("cfg-visi").value.trim();
  current.misi = document.getElementById("cfg-misi").value.split("\n").map(m => m.trim()).filter(Boolean);

  await API.put("siteConfig", current);
  Components.showToast("Identitas Tersimpan", "Konfigurasi umum SDN 2 Karangmangu telah diperbarui.");
}

/**
 * Ekspor & Impor Cadangan JSON
 */
async function exportFullBackupJSON() {
  const backup = await API.exportAll();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const dl = document.createElement("a");
  dl.setAttribute("href", dataStr);
  dl.setAttribute("download", `SDN2_Karangmangu_Cadangan_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(dl);
  dl.click();
  dl.remove();
  Components.showToast("Cadangan Terunduh", "File cadangan JSON berhasil diunduh.");
}

async function handleImportBackupJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const json = JSON.parse(e.target.result);
      await API.importAll(json);
      refreshDashboardStats();
      if (currentTab === "settings") loadSettingsIntoForm();
      Components.showToast("Impor Berhasil", "Basis data telah berhasil dipulihkan dari file JSON.");
    } catch (err) {
      Components.showToast("Gagal Membaca File", "File bukan format JSON cadangan yang sah.", "error");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

async function resetAllDataToDefault() {
  if (confirm("PERINGATAN: Semua perubahan data kustom akan digantikan dengan data master awal SDN 2 Karangmangu. Lanjutkan reset?")) {
    await API.resetToDefault();
    refreshDashboardStats();
    if (currentTab === "settings") loadSettingsIntoForm();
    Components.showToast("Data Direset", "Basis data dikembalikan ke setelan awal pabrik.");
  }
}
