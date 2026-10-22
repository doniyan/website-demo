/**
 * SDN 2 Karangmangu - Authentication & Session Manager
 *
 * Mode REMOTE (produksi): login diverifikasi SERVER (Apps Script). Browser hanya menyimpan
 *   token sesi sementara (maks. 6 jam). Tidak ada kata sandi di kode JavaScript.
 * Mode LOKAL (demo tanpa backend): memakai akun demo di bawah. JANGAN dipakai untuk produksi.
 */

const AUTH_CONFIG = {
  SESSION_KEY: "sdn2_admin_auth",
  ROLE: "Super Administrator",
  // Hanya berlaku bila USE_REMOTE=false (demo lokal)
  DEMO_USER: "admin",
  DEMO_PASS: "admin123"
};

const Auth = {
  /**
   * Melakukan proses login
   */
  async login(username, password, rememberMe = true) {
    let sessionData;

    if (_remoteOn()) {
      try {
        const r = await _remote("login", { username: username.trim(), password: password });
        sessionData = {
          username: r.username,
          role: r.role || AUTH_CONFIG.ROLE,
          school: SCHOOL_CONFIG.nama.sekolah,
          token: r.token,
          expiresAt: r.expiresAt,
          loggedInAt: new Date().toISOString()
        };
      } catch (err) {
        return { success: false, message: err.message };
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
      if (username.trim() !== AUTH_CONFIG.DEMO_USER || password !== AUTH_CONFIG.DEMO_PASS) {
        return { success: false, message: "Nama pengguna atau kata sandi tidak cocok (MODE DEMO: backend belum tersambung, periksa backend.useRemote dan backend.gasUrl di school.config.js)." };
      }
      sessionData = {
        username: username.trim(),
        role: AUTH_CONFIG.ROLE,
        school: SCHOOL_CONFIG.nama.sekolah,
        loggedInAt: new Date().toISOString()
      };
    }

    // "Ingat saya" = sesi bertahan setelah browser ditutup (tetap kedaluwarsa sesuai expiresAt)
    const storage = rememberMe ? localStorage : sessionStorage;
    const other = rememberMe ? sessionStorage : localStorage;
    storage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(sessionData));
    other.removeItem(AUTH_CONFIG.SESSION_KEY);
    return { success: true, user: sessionData };
  },

  /**
   * Mendapatkan sesi pengguna yang sedang login (null bila tidak ada / sudah kedaluwarsa)
   */
  getUser() {
    try {
      const raw = localStorage.getItem(AUTH_CONFIG.SESSION_KEY) || sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (user.expiresAt && Date.now() > user.expiresAt) {
        localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        return null;
      }
      return user;
    } catch (e) {
      return null;
    }
  },

  /**
   * Memeriksa apakah admin sedang terautentikasi
   */
  isAuthenticated() {
    return this.getUser() !== null;
  },

  /**
   * Mengakhiri sesi login (logout) - token juga dicabut di server
   */
  logout() {
    const user = this.getUser();
    if (_remoteOn() && user && user.token) {
      try {
        fetch(API_CONFIG.GAS_URL, {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ action: "logout", token: user.token })
        }).catch(() => {});
      } catch (e) { /* abaikan */ }
    }
    localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    window.location.href = "admin-login.html";
  },

  /**
   * Memproteksi halaman dashboard CMS.
   * Catatan: ini hanya pengaman tampilan. Keamanan data yang sebenarnya ditegakkan SERVER (token).
   */
  protectDashboard() {
    if (!this.isAuthenticated()) {
      window.location.href = "admin-login.html";
    }
  },

  /**
   * Mencegah admin yang sudah login kembali melihat halaman login
   */
  redirectIfLoggedIn() {
    if (this.isAuthenticated()) {
      window.location.href = "admin-dashboard.html";
    }
  }
};
