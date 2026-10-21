/**
 * SDN 2 Karangmangu - Reusable Vanilla JS UI Components
 * Menyediakan komponen konsisten: Navbar, Footer, Breadcrumb, Toast, Dialog, Mobile Menu.
 */

const Components = {
  /**
   * Render Navbar Resmi
   * @param {string} activePage - 'beranda' | 'profil' | 'guru' | 'berita' | 'pengumuman' | 'agenda' | 'galeri' | 'prestasi' | 'ppdb' | 'kontak'
   */
  renderNavbar(activePage = 'beranda') {
    const config = typeof loadSiteConfig === 'function' ? loadSiteConfig() : SCHOOL_CONFIG.site;

    const logoSrc = config.logo || "assets/images/logo/logo.svg";

    const navItems = [
      { key: 'beranda', label: 'Beranda', href: 'index.html' },
      { key: 'profil', label: 'Profil', href: 'profil.html' },
      { key: 'guru', label: 'Guru & Staf', href: 'guru.html' },
      { key: 'berita', label: 'Berita', href: 'berita.html' },
      { key: 'pengumuman', label: 'Pengumuman', href: 'pengumuman.html' },
      { key: 'agenda', label: 'Agenda', href: 'agenda.html' },
      { key: 'galeri', label: 'Galeri', href: 'galeri.html' },
      { key: 'prestasi', label: 'Prestasi', href: 'prestasi.html' },
      { key: 'ppdb', label: 'PPDB', href: 'ppdb.html' },
      { key: 'kontak', label: 'Kontak', href: 'kontak.html' }
    ];

    const desktopLinksHtml = navItems.map(item => {
      const isActive = item.key === activePage;
      if (isActive) {
        return `<a href="${item.href}" aria-current="page" class="transition-colors py-1 text-primary font-bold border-b-2 border-primary text-[14px] xl:text-label-lg whitespace-nowrap">${item.label}</a>`;
      }
      return `<a href="${item.href}" class="font-label-md text-[14px] xl:text-label-lg text-on-surface-variant hover:text-primary transition-colors py-1 whitespace-nowrap">${item.label}</a>`;
    }).join('');

    const mobileLinksHtml = navItems.map(item => {
      const isActive = item.key === activePage;
      const activeClass = isActive ? "bg-primary text-on-primary font-bold" : "text-on-surface-variant hover:bg-surface-container";
      return `<a href="${item.href}" class="flex items-center gap-3 px-4 py-3 rounded-xl font-label-lg transition-colors ${activeClass}">
        <span>${item.label}</span>
      </a>`;
    }).join('');

    return `
    <header class="site-header fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-b border-surface-container">
      <div class="h-20 max-w-[1280px] mx-auto px-4 sm:px-gutter flex items-center justify-between gap-space-sm xl:gap-space-md">
        <!-- Logo Brand -->
        <a href="index.html" class="flex items-center gap-space-sm min-w-0">
          <img alt="Logo SDN 2 Karangmangu" class="h-10 w-auto object-contain shrink-0" src="${logoSrc}" onerror="this.onerror=null; this.src='assets/images/logo/logo.svg';">
          <div class="flex flex-col min-w-0">
            <span class="font-headline-sm text-[15px] sm:text-[16px] xl:text-headline-sm text-primary tracking-tight font-bold leading-tight truncate">${config.namaSekolah}</span>
            <span class="font-label-sm text-[10px] sm:text-[11px] xl:text-label-sm text-on-surface-variant truncate">${config.tagline}</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        <nav class="hidden xl:flex items-center gap-3 xl:gap-space-md overflow-x-auto py-space-xs">
          ${desktopLinksHtml}
        </nav>

        <!-- Right Quick Actions -->
        <div class="flex items-center gap-space-xs sm:gap-space-sm shrink-0">
          <a href="admin-login.html" class="hidden sm:inline-flex items-center gap-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-3 xl:px-space-md py-2 xl:py-space-sm rounded-lg transition-all shadow-sm">
            <span class="material-symbols-outlined text-[18px]">lock</span>
            <span class="hidden md:inline">Portal Admin CMS</span>
            <span class="md:hidden">CMS</span>
          </a>

          <!-- Mobile Hamburger Button -->
          <button id="mobile-menu-toggle-btn" aria-label="Buka Menu Navigasi" aria-controls="mobile-nav-drawer" aria-expanded="false" class="xl:hidden w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-primary transition-colors">
            <span class="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </div>
      </div>

    </header>

  <!-- Mobile Drawer (di luar <header>: backdrop-blur pada header membuat elemen fixed terpotong setinggi header) -->
  <div id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Menu navigasi" class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm hidden transition-opacity duration-300 xl:hidden">
        <div class="fixed top-0 right-0 bottom-0 w-80 max-w-[88%] overscroll-contain bg-surface-container-lowest shadow-2xl p-space-md flex flex-col justify-between overflow-y-auto">
          <div>
            <div class="flex items-center justify-between pb-space-sm border-b border-surface-container">
              <div class="flex items-center gap-2">
                <img src="${logoSrc}" alt="Logo" class="h-8 w-auto" onerror="this.onerror=null; this.src='assets/images/logo/logo.svg';">
                <span class="font-headline-sm text-headline-sm text-primary font-bold">Menu Navigasi</span>
              </div>
              <button id="mobile-menu-close-btn" class="w-9 h-9 rounded-lg hover:bg-surface-container text-on-surface-variant flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <nav class="flex flex-col gap-1 py-space-md">
              ${mobileLinksHtml}
            </nav>
          </div>

          <div class="pt-space-md border-t border-surface-container">
            <a href="admin-login.html" class="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-label-lg py-3 rounded-xl shadow-sm">
              <span class="material-symbols-outlined text-[18px]">lock</span>
              <span>Masuk Portal Admin CMS</span>
            </a>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render Footer Resmi
   */
  renderFooter() {
    const config = typeof loadSiteConfig === 'function' ? loadSiteConfig() : SCHOOL_CONFIG.site;

    return `
    <footer class="w-full bg-surface-container text-on-surface py-space-xl shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      <div class="max-w-[1280px] mx-auto px-gutter grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
        <!-- Kolom 1: Profil Sekolah -->
        <div class="space-y-space-sm">
          <div class="flex items-center gap-space-xs">
            <img alt="Logo SDN 2 Karangmangu" class="h-8 w-auto object-contain" src="${config.logo}">
            <span class="font-headline-sm text-headline-sm text-primary font-bold">${config.namaSekolah}</span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Lembaga pendidikan dasar yang berdedikasi membentuk generasi pembelajar berprestasi, berakhlak mulia, dan berwawasan global sesuai profil Pelajar Pancasila.
          </p>
          <div class="flex items-center gap-space-xs pt-space-xs">
            <a href="${config.sosmed?.facebook || '#'}" target="_blank" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors">
              <span class="material-symbols-outlined text-[18px]">public</span>
            </a>
            <a href="mailto:${config.email}" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors">
              <span class="material-symbols-outlined text-[18px]">mail</span>
            </a>
            <a href="tel:${config.telepon}" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors">
              <span class="material-symbols-outlined text-[18px]">call</span>
            </a>
          </div>
        </div>

        <!-- Kolom 2: Tautan Cepat -->
        <div class="space-y-space-sm">
          <h4 class="font-headline-sm text-headline-sm text-on-surface font-bold">Tautan Cepat</h4>
          <ul class="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <li><a class="hover:text-primary transition-colors" href="profil.html">Profil &amp; Sejarah</a></li>
            <li><a class="hover:text-primary transition-colors" href="guru.html">Direktori Guru &amp; Staf</a></li>
            <li><a class="hover:text-primary transition-colors" href="ppdb.html">Pendaftaran Siswa Baru (PPDB)</a></li>
            <li><a class="hover:text-primary transition-colors" href="berita.html">Warta &amp; Publikasi Sekolah</a></li>
            <li><a class="hover:text-primary transition-colors" href="agenda.html">Kalender Akademik</a></li>
            <li><a class="hover:text-primary transition-colors" href="prestasi.html">Galeri Prestasi Siswa</a></li>
          </ul>
        </div>

        <!-- Kolom 3: Jam Layanan -->
        <div class="space-y-space-sm">
          <h4 class="font-headline-sm text-headline-sm text-on-surface">Jam Layanan &amp; Belajar</h4>
          <div class="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <div class="flex justify-between py-1 border-b border-surface-container-high/40">
              <span class="font-label-md text-label-md text-on-surface">Senin - Kamis:</span>
              <span>07.00 - 13.30 WIB</span>
            </div>
            <div class="flex justify-between py-1 border-b border-surface-container-high/40">
              <span class="font-label-md text-label-md text-on-surface">Jumat:</span>
              <span>07.00 - 11.00 WIB</span>
            </div>
            <div class="flex justify-between py-1 border-b border-surface-container-high/40">
              <span class="font-label-md text-label-md text-on-surface">Sabtu:</span>
              <span>07.00 - 12.30 WIB</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="font-label-md text-label-md text-on-surface">Minggu &amp; Libur:</span>
              <span class="text-error font-semibold">Tutup</span>
            </div>
          </div>
        </div>

        <!-- Kolom 4: Kontak & Lokasi -->
        <div class="space-y-space-sm">
          <h4 class="font-headline-sm text-headline-sm text-on-surface">Kontak &amp; Lokasi</h4>
          <address class="not-italic font-body-sm text-body-sm text-on-surface-variant space-y-space-xs">
            <p class="flex items-start gap-space-xs">
              <span class="material-symbols-outlined text-[18px] text-primary shrink-0">location_on</span>
              <span>${config.alamat}</span>
            </p>
            <p class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-[18px] text-primary shrink-0">call</span>
              <span>${config.telepon}</span>
            </p>
            <p class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-[18px] text-primary shrink-0">mail</span>
              <span>${config.email}</span>
            </p>
          </address>
        </div>
      </div>

      <!-- Copyright bar -->
      <div class="mt-space-xl pt-space-md bg-surface-container-high/50 text-center font-body-sm text-body-sm text-on-surface-variant">
        <div class="max-w-[1280px] mx-auto px-gutter flex flex-col sm:flex-row items-center justify-between gap-space-xs">
          <p>© 2025 ${config.namaSekolah}. Hak Cipta Dilindungi Undang-Undang.</p>
          <div class="flex items-center gap-3">
            <span class="text-label-sm font-label-sm">Kurikulum Merdeka • Kemendikbudristek RI</span>
            <a href="admin-login.html" class="text-label-sm text-primary hover:underline flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">lock</span>
              <span>Login Admin</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
    `;
  },

  /**
   * Breadcrumb reusable
   * @param {Array<{label: string, href?: string}>} items
   */
  renderBreadcrumb(items = []) {
    const list = items.map((it, idx) => {
      const isLast = idx === items.length - 1;
      if (isLast || !it.href) {
        return `<span class="text-primary font-semibold">${it.label}</span>`;
      }
      return `
        <a href="${it.href}" class="hover:text-primary transition-colors flex items-center gap-1">
          ${idx === 0 ? '<span class="material-symbols-outlined text-[16px]">home</span>' : ''}
          <span>${it.label}</span>
        </a>
        <span class="text-outline-variant">/</span>
      `;
    }).join('');

    return `
      <nav class="flex items-center flex-wrap gap-space-xs text-on-surface-variant font-label-md text-label-md mb-space-md">
        ${list}
      </nav>
    `;
  },

  /**
   * Toast notification reusable
   */
  showToast(title, message, type = 'success') {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.className = 'fixed top-24 right-6 z-50 transform translate-y-[-120%] opacity-0 transition-all duration-300 pointer-events-none flex items-center gap-space-sm px-space-md py-space-sm rounded-xl shadow-xl bg-surface-container-lowest text-on-surface border border-surface-container';
      document.body.appendChild(toast);
    }

    let icon = 'check_circle';
    let iconClass = 'bg-tertiary-fixed text-on-tertiary-fixed';
    if (type === 'error') {
      icon = 'error';
      iconClass = 'bg-error-container text-error';
    } else if (type === 'info') {
      icon = 'info';
      iconClass = 'bg-primary-fixed text-primary';
    }

    toast.innerHTML = `
      <div class="w-8 h-8 rounded-lg ${iconClass} flex items-center justify-center">
        <span class="material-symbols-outlined text-[20px]">${icon}</span>
      </div>
      <div class="flex flex-col">
        <span class="font-label-lg text-label-lg font-bold">${title}</span>
        <span class="font-body-sm text-body-sm text-on-surface-variant">${message}</span>
      </div>
    `;

    toast.classList.remove('translate-y-[-120%]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.add('translate-y-[-120%]', 'opacity-0');
      toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3500);
  },

  /**
   * Empty state reusable
   */
  renderEmptyState(icon = 'folder_open', title = 'Tidak ada data', desc = 'Belum ada data pada kategori ini.', actionHtml = '') {
    return `
      <div class="flex flex-col items-center justify-center py-16 text-center gap-space-sm">
        <div class="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline">
          <span class="material-symbols-outlined text-[32px]">${icon}</span>
        </div>
        <div class="flex flex-col max-w-sm">
          <span class="font-headline-sm text-headline-sm text-on-surface font-semibold">${title}</span>
          <span class="font-body-sm text-body-sm text-on-surface-variant mt-1">${desc}</span>
        </div>
        ${actionHtml ? `<div class="mt-2">${actionHtml}</div>` : ''}
      </div>
    `;
  },

  /**
   * Mengaktifkan menu hamburger (mobile/tablet < 1280px).
   * - Buka/tutup lewat tombol, tombol X, klik area gelap, atau tombol Escape
   * - Scroll halaman dikunci saat menu terbuka
   * - Menutup otomatis saat layar dilebarkan ke desktop / saat memilih tautan
   * - Status ARIA (aria-expanded) ikut diperbarui
   */
  initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle-btn');
    const closeBtn = document.getElementById('mobile-menu-close-btn');
    const drawer = document.getElementById('mobile-nav-drawer');
    if (!drawer || drawer.dataset.bound === '1') return; // cegah pendaftaran ganda
    drawer.dataset.bound = '1';

    const isOpen = () => !drawer.classList.contains('hidden');

    const open = () => {
      drawer.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
      if (closeBtn) closeBtn.focus();
    };

    const close = (returnFocus = true) => {
      if (!isOpen()) return;
      drawer.classList.add('hidden');
      document.body.style.overflow = '';
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', 'false');
        if (returnFocus) toggleBtn.focus();
      }
    };

    if (toggleBtn) toggleBtn.addEventListener('click', () => (isOpen() ? close() : open()));
    if (closeBtn) closeBtn.addEventListener('click', () => close());
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer || e.target.closest('a')) close(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // Layar dilebarkan ke desktop (>= 1280px): menu samping otomatis tertutup
    if (window.matchMedia) {
      const desktop = window.matchMedia('(min-width: 1280px)');
      const onChange = (e) => { if (e.matches) close(false); };
      if (desktop.addEventListener) desktop.addEventListener('change', onChange);
      else if (desktop.addListener) desktop.addListener(onChange);
    }
  }
};
