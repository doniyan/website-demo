/**
 * SDN 2 Karangmangu - Global Application Script
 * Menangani inisialisasi interaksi, animasi counter, countdown agenda,
 * sinkronisasi dinamis WhatsApp/Telepon, dan tombol back-to-top.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi Mobile Navigation
  if (typeof Components !== 'undefined' && Components.initMobileMenu) {
    Components.initMobileMenu();
  }

  // Sinkronisasi Data Konfigurasi ke Komponen Publik
  syncPublicSchoolData();

  // Inisialisasi Animasi Counter
  initStatCounters();

  // Inisialisasi Countdown Timer Agenda
  initAgendaCountdown();

  // Inisialisasi Tombol Scroll Kembali ke Atas
  initBackToTopButton();

  // Inisialisasi Ticker Berita Berjalan
  syncTickerWithLatestNews();
});

/**
 * Sinkronisasi data identitas sekolah ke tautan WhatsApp dan footer
 */
function syncPublicSchoolData() {
  if (typeof loadSiteConfig !== 'function') return;
  const config = loadSiteConfig();

  // Sinkronisasi link WhatsApp
  if (config.whatsapp) {
    const cleanWa = config.whatsapp.replace(/[^0-9]/g, '');
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
      link.href = `https://wa.me/${cleanWa}?text=Halo%20Admin%20${encodeURIComponent(config.namaSekolah)},%20saya%20ingin%20bertanya%20seputar%20informasi%20sekolah.`;
    });
  }

  // Sinkronisasi link telepon
  if (config.telepon) {
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      link.href = `tel:${config.telepon.replace(/[^0-9+]/g, '')}`;
    });
  }

  // Sinkronisasi nama sekolah pada elemen teks dengan class data-school-name
  document.querySelectorAll('.data-school-name').forEach(el => {
    el.textContent = config.namaSekolah;
  });
}

/**
 * Animasi angka counter saat elemen terlihat (IntersectionObserver)
 */
function initStatCounters() {
  const counters = document.querySelectorAll('.counter');
  if (counters.length === 0) return;

  const speed = 35;
  let hasRun = false;

  const runAnimation = () => {
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target') || 0;
      let count = 0;
      const step = Math.ceil(target / speed) || 1;

      const update = () => {
        count += step;
        if (count < target) {
          counter.innerText = count;
          setTimeout(update, 25);
        } else {
          counter.innerText = target;
        }
      };
      update();
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasRun) {
        runAnimation();
        hasRun = true;
      }
    });
  }, { threshold: 0.2 });

  counters.forEach(c => observer.observe(c));
}

/**
 * Hitung mundur agenda terdekat
 */
function initAgendaCountdown() {
  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins = document.getElementById('cd-mins');
  const elSecs = document.getElementById('cd-secs');

  if (!elDays || !elHours || !elMins || !elSecs) return;

  // Tanggal target: ASAJ Kelas 6 (12 Mei 2025) atau agenda pertama di data
  let targetDate = new Date("2025-05-12T08:00:00").getTime();
  if (typeof loadAgenda === 'function') {
    const agendas = loadAgenda();
    if (agendas && agendas.length > 0 && agendas[0].date) {
      const parsed = new Date(`${agendas[0].date}T08:00:00`).getTime();
      if (!isNaN(parsed) && parsed > Date.now()) {
        targetDate = parsed;
      }
    }
  }

  const update = () => {
    const now = Date.now();
    const distance = targetDate - now;

    if (distance > 0) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((distance % (1000 * 60)) / 1000);

      elDays.innerText = String(days).padStart(2, '0');
      elHours.innerText = String(hours).padStart(2, '0');
      elMins.innerText = String(mins).padStart(2, '0');
      elSecs.innerText = String(secs).padStart(2, '0');
    }
  };

  setInterval(update, 1000);
  update();
}

/**
 * Tombol Kembali ke Atas (Back-to-Top)
 */
function initBackToTopButton() {
  const btn = document.getElementById('btn-back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      btn.classList.remove('opacity-0', 'pointer-events-none');
      btn.classList.add('opacity-100');
    } else {
      btn.classList.add('opacity-0', 'pointer-events-none');
      btn.classList.remove('opacity-100');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Ticker warta berita berjalan
 */
function syncTickerWithLatestNews() {
  const ticker = document.getElementById('ticker-content');
  if (!ticker || typeof loadNews !== 'function') return;

  const newsList = loadNews();
  const annList = typeof loadAnnouncements === 'function' ? loadAnnouncements() : [];

  if (newsList.length === 0 && annList.length === 0) return;

  const items = [];
  annList.filter(a => a.status).slice(0, 2).forEach(a => {
    items.push(`
      <span class="inline-flex items-center gap-space-xs mx-4 text-on-primary font-medium">
        <span class="material-symbols-outlined text-[14px] text-secondary-container">campaign</span>
        ${a.title}
      </span>
    `);
  });

  newsList.filter(n => n.status).slice(0, 3).forEach(n => {
    items.push(`
      <span class="inline-flex items-center gap-space-xs mx-4 text-on-primary font-medium">
        <span class="material-symbols-outlined text-[14px] text-tertiary-fixed">verified</span>
        ${n.title}
      </span>
    `);
  });

  if (items.length > 0) {
    ticker.innerHTML = items.join('<span class="opacity-40">|</span>');
  }
}

/**
 * Helper format tanggal Indonesia
 */
function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
  } catch (e) {
    return dateStr;
  }
}
