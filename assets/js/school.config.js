/**
 * ============================================================================
 *  KONFIGURASI SEKOLAH  —  satu-satunya file yang diubah untuk sekolah baru
 * ============================================================================
 *
 *  Cara memasang untuk sekolah lain:
 *    1. Ubah nilai di file ini (backend, identitas, alamat, kontak, kepala sekolah, dst).
 *    2. Jalankan sekali dari folder project:   node tools/setup-sekolah.js
 *       Skrip itu menyamakan teks yang tertulis langsung di halaman HTML
 *       (judul, footer, meta, alamat, dll) dengan nilai baru di file ini.
 *    3. Ganti logo di assets/images/logo/ lalu unggah project ke hosting.
 *
 *  Kode JavaScript (api.js, data.js, auth.js, dst) membaca file ini langsung,
 *  jadi tidak perlu diubah.
 *
 *  Catatan: isi berita, guru, galeri, dll dikelola lewat panel admin (Google
 *  Sheets), bukan di file ini.
 * ============================================================================
 */
const SCHOOL_CONFIG = (() => {
  // ── 1. BACKEND (Google Apps Script + Google Sheets) ──────────────────────
  const backend = {
    gasUrl: "https://script.google.com/macros/s/AKfycbyN61F-m4-FsOSdEHtxY8CGQfgBY2HpDzCUcvSgw5bDqT2g3MOUFuMF7cLTI8B9mJaCFw/exec",
    useRemote: true // false = mode demo lokal (data hanya di browser)
  };

  // ── 2. NAMA SEKOLAH ──────────────────────────────────────────────────────
  const nama = {
    sekolah: "SDN 2 Karangmangu",          // nama singkat (navbar, judul halaman)
    resmi: "SD Negeri 2 Karangmangu"       // nama resmi (ditulis kapital otomatis di tempat tertentu)
  };

  // ── 3. WILAYAH & ALAMAT ──────────────────────────────────────────────────
  const wilayah = { desa: "Karangmangu", kecamatan: "Kroya", kabupaten: "Cilacap" };
  const alamat = {
    baris: "Jl. Raya Karangmangu RT 03 / RW 02, Kec. Kroya, Kab. Cilacap, Jawa Tengah",
    kodePos: "53282",
    singkat: "Jl. Raya Karangmangu, Kec. Kroya, Kab. Cilacap, Jawa Tengah" // versi footer
  };

  // ── 4. KONTAK ────────────────────────────────────────────────────────────
  const kontak = {
    domain: "sdn2karangmangu.sch.id",      // email jadi kontak@<domain> dan tu.admin@<domain>
    telepon: "(0282) 555-1234",
    whatsapp: "6281234567890",            // format internasional tanpa +, untuk tautan wa.me
    whatsappTampil: "+62 812-3456-7890"    // format yang ditampilkan di halaman Kontak
  };

  // ── 5. KEPALA SEKOLAH ────────────────────────────────────────────────────
  const kepsek = { nama: "Drs. H. Bambang Subagyo, M.Pd.", nip: "19680415 199303 1 004" };

  const tahunFooter = 2025;

  // ── 6. DATA SITUS (dipakai sebagai nilai bawaan siteConfig) ──────────────
  const site = {
    namaSekolah: nama.sekolah,
    namaResmi: nama.resmi.toUpperCase(),
    npsn: "20300642",
    akreditasi: "A (Unggul)",
    skAkreditasi: "No. 1347/BAN-SM/SK/2021",
    tagline: "Cerdas, Berkarakter & Berprestasi",
    slogan: "Membimbing dengan Hati, Menuntun Potensi Setiap Anak Menuju Gemilang Prestasi",
    alamat: alamat.baris + " " + alamat.kodePos,
    telepon: kontak.telepon,
    whatsapp: kontak.whatsapp,
    email: "kontak@" + kontak.domain,
    emailTu: "tu.admin@" + kontak.domain,
    logo: "assets/images/logo/logo.svg",
    kepalaSekolah: kepsek.nama,
    nipKepalaSekolah: kepsek.nip,
    sambutan: "Puji syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa. Selamat datang di portal resmi " + nama.sekolah + ". Kami meyakini bahwa pendidikan dasar bukan sekadar transfer ilmu pengetahuan kognitif, melainkan peletakan pondasi karakter, budi pekerti, serta ketahanan moral generasi bangsa. Melalui Kurikulum Merdeka dan lingkungan belajar yang asri serta menyenangkan, kami bersama dewan guru yang berdedikasi berkomitmen menghadirkan pengalaman belajar yang memerdekakan potensi alami anak.",
    visi: "Terwujudnya Insan Pembelajar yang Beriman, Cerdas, Berakhlak Mulia, Berprestasi, dan Berwawasan Lingkungan Global.",
    misi: ["Menanamkan nilai-nilai keimanan, ketaqwaan, dan budi pekerti luhur melalui pembiasaan ibadah rutin serta doa bersama.", "Melaksanakan pembelajaran aktif, inovatif, kreatif, dan berdiferensiasi berbasis Kurikulum Merdeka.", "Mengembangkan potensi bakat, minat olahraga, seni budaya, serta kompetensi sains dan teknologi anak didik.", "Menciptakan lingkungan sekolah yang ramah anak, bersih, hijau, tertib, dan berbudaya lingkungan hidup (Adiwiyata).", "Membangun kolaborasi harmonis dan transparan dengan wali murid, komite, dinas terkait, serta dunia usaha/industri."],
    stats: { "siswa": 348, "guru": 24, "rombel": 12, "prestasi": 45 },
    jamLayanan: { "seninKamis": "07.00 - 13.30 WIB", "jumat": "07.00 - 11.00 WIB", "sabtu": "07.00 - 12.30 WIB", "minggu": "Tutup" },
    sosmed: { "facebook": "https://facebook.com", "youtube": "https://youtube.com", "instagram": "https://instagram.com" },
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15822.456789123!2d109.245!3d-7.625!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwMzcnMzAuMCJTIDEwOcKwMTQnNDIuMCJF!5e0!3m2!1sid!2sid!4v1600000000000!5m2!1sid!2sid",
    footerCopyright: "© " + tahunFooter + " " + nama.sekolah + ". Hak Cipta Dilindungi Undang-Undang."
  };

  return { backend, nama, wilayah, alamat, kontak, kepsek, tahunFooter, site };
})();

// Dipakai oleh tools/setup-sekolah.js (Node); diabaikan di browser.
if (typeof module !== "undefined" && module.exports) module.exports = SCHOOL_CONFIG;
