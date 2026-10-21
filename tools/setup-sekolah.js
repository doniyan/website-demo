#!/usr/bin/env node
/**
 * setup-sekolah.js
 * ----------------------------------------------------------------------------
 * Menyamakan teks yang tertulis langsung di halaman (HTML) dan data contoh (JS)
 * dengan nilai terbaru di assets/js/school.config.js.
 *
 * Cara kerja: skrip membandingkan nilai di school.config.js (BARU) dengan
 * tools/school-applied.json (nilai yang saat ini tertulis di file), lalu
 * mengganti nilai lama -> baru di semua halaman. Aman dijalankan berulang.
 *
 * Pemakaian (dari folder project):
 *   node tools/setup-sekolah.js              terapkan perubahan
 *   node tools/setup-sekolah.js --cek        lihat apa yang akan berubah (tidak menulis apa pun)
 *   node tools/setup-sekolah.js --periksa    cek bahwa nilai lama memang ditemukan di file
 *   node tools/setup-sekolah.js --catat      anggap file SUDAH sesuai config (hanya untuk awal)
 * ----------------------------------------------------------------------------
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const JS_DIR = path.join(ROOT, "assets", "js");
const APPLIED = path.join(__dirname, "school-applied.json");
const cfg = require(path.join(JS_DIR, "school.config.js"));

const args = new Set(process.argv.slice(2));

/** Daftar nilai yang tertulis langsung di file, dalam bentuk {id: teks}. */
function daftarNilai(c) {
  const out = {};
  const add = (id, v) => { if (typeof v === "string" && v.trim()) out[id] = v; };
  const bentukNama = (id, v) => {          // nama muncul biasa, KAPITAL, dan di dalam URL
    add(id, v);
    add(id + "#KAPITAL", v.toUpperCase());
    add(id + "#URL", encodeURIComponent(v));
  };
  const enc = encodeURIComponent;

  bentukNama("nama.sekolah", c.nama.sekolah);
  bentukNama("nama.resmi", c.nama.resmi);

  add("alamat.baris+kodePos(kurung)", `${c.alamat.baris} (Kode Pos: ${c.alamat.kodePos})`);
  add("alamat.baris+kodePos", `${c.alamat.baris} ${c.alamat.kodePos}`);
  add("alamat.baris", c.alamat.baris);
  add("alamat.singkat", c.alamat.singkat);

  add("site.email", c.site.email);
  add("site.emailTu", c.site.emailTu);
  add("kontak.domain", c.kontak.domain);
  add("kontak.telepon", c.kontak.telepon);
  add("kontak.whatsappTampil", c.kontak.whatsappTampil);
  add("kontak.whatsapp", c.kontak.whatsapp);

  add("kepsek.nama", c.kepsek.nama);
  add("kepsek.nip", c.kepsek.nip);
  add("site.npsn", c.site.npsn);
  add("site.akreditasi", c.site.akreditasi);
  add("site.skAkreditasi", c.site.skAkreditasi);
  add("site.tagline", c.site.tagline);
  add("site.slogan", c.site.slogan);
  add("site.visi", c.site.visi);
  (c.site.misi || []).forEach((m, i) => add(`site.misi[${i}]`, m));
  for (const k of ["seninKamis", "jumat", "sabtu"]) add(`jamLayanan.${k}`, c.site.jamLayanan[k]);
  add("site.logo", c.site.logo);
  add("tahunFooter", `© ${c.tahunFooter}`);

  add("peta.q", [c.wilayah.desa, c.wilayah.kecamatan, c.wilayah.kabupaten].map(enc).join("%20"));
  add("wilayah.desa", c.wilayah.desa);
  add("wilayah.kecamatan", c.wilayah.kecamatan);
  add("wilayah.kabupaten", c.wilayah.kabupaten);
  return out;
}

function fileTarget() {
  const html = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).map((f) => path.join(ROOT, f));
  const js = fs.readdirSync(JS_DIR).filter((f) => f.endsWith(".js") && f !== "school.config.js").map((f) => path.join(JS_DIR, f));
  return html.concat(js);
}
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");
const hitung = (teks, cari) => teks.split(cari).length - 1;

const baru = daftarNilai(cfg);

// ── --catat ────────────────────────────────────────────────────────────────
if (args.has("--catat")) {
  fs.writeFileSync(APPLIED, JSON.stringify(baru, null, 2) + "\n");
  console.log("Dicatat: file dianggap sudah sesuai dengan school.config.js saat ini.");
  process.exit(0);
}

if (!fs.existsSync(APPLIED)) {
  console.error("tools/school-applied.json belum ada. Jika file project SUDAH sesuai config, jalankan dulu:\n  node tools/setup-sekolah.js --catat");
  process.exit(1);
}
const lama = JSON.parse(fs.readFileSync(APPLIED, "utf8"));
const files = fileTarget().map((p) => ({ p, teks: fs.readFileSync(p, "utf8") }));

// ── --periksa ──────────────────────────────────────────────────────────────
if (args.has("--periksa")) {
  let nol = 0;
  for (const [id, v] of Object.entries(lama)) {
    const n = files.reduce((a, f) => a + hitung(f.teks, v), 0);
    if (n === 0) nol++;
    console.log(String(n).padStart(4), "x ", id);
  }
  console.log(nol ? `\n${nol} nilai tidak ditemukan di file (mungkin memang tidak dipakai di halaman).` : "\nSemua nilai tercatat ditemukan di file.");
  process.exit(0);
}

// ── susun pasangan lama -> baru ────────────────────────────────────────────
const pasangan = [];
const dipakai = new Map();   // teks lama -> pasangan yang sudah mengambilnya
for (const [id, nilaiBaru] of Object.entries(baru)) {
  if (!(id in lama)) { console.warn(`Lewati "${id}": belum tercatat di school-applied.json.`); continue; }
  const nilaiLama = lama[id];
  if (dipakai.has(nilaiLama)) {
    const p = dipakai.get(nilaiLama);
    if (p.baru !== nilaiBaru)
      console.warn(`PERINGATAN: "${id}" dan "${p.id}" saat ini tertulis sama persis di file, tetapi nilai barunya berbeda.\n` +
                   `  Semua kemunculan memakai nilai dari "${p.id}". Periksa hasilnya, atau bedakan dulu teks kedua isian itu.`);
    continue;
  }
  if (nilaiLama === nilaiBaru) continue;
  const item = { id, lama: nilaiLama, baru: nilaiBaru };
  dipakai.set(nilaiLama, item);
  pasangan.push(item);
}
if (!pasangan.length) { console.log("Tidak ada perubahan: file sudah sesuai dengan school.config.js."); process.exit(0); }

// terpanjang dulu, supaya "SDN 2 Karangmangu" diganti sebelum kata "Karangmangu" saja
pasangan.sort((a, b) => b.lama.length - a.lama.length);
pasangan.forEach((x, i) => { x.tanda = `\uE000${i}\uE001`; });

function terapkan(teks, hitungan) {
  let t = teks;
  for (const x of pasangan) {            // tahap 1: nilai lama -> penanda (mencegah efek berantai)
    const n = hitung(t, x.lama);
    if (n) { hitungan[x.id] = (hitungan[x.id] || 0) + n; t = t.split(x.lama).join(x.tanda); }
  }
  for (const x of pasangan) t = t.split(x.tanda).join(x.baru);   // tahap 2: penanda -> nilai baru
  return t;
}

const hitungan = {};
const berubah = [];
for (const f of files) {
  const h = {};
  const hasil = terapkan(f.teks, h);
  Object.entries(h).forEach(([k, v]) => { hitungan[k] = (hitungan[k] || 0) + v; });
  if (hasil !== f.teks) berubah.push({ ...f, hasil });
}

console.log(`${pasangan.length} nilai berubah, ${berubah.length} file terpengaruh:\n`);
for (const x of pasangan) console.log(String(hitungan[x.id] || 0).padStart(4), "x ", x.id.padEnd(30), JSON.stringify(x.lama).slice(0, 46), "->", JSON.stringify(x.baru).slice(0, 46));
const tidakAda = pasangan.filter((x) => !hitungan[x.id]).map((x) => x.id);
if (tidakAda.length) console.log(`\nCatatan: nilai lama tidak ditemukan di file untuk: ${tidakAda.join(", ")}`);

if (args.has("--cek")) { console.log("\n(--cek: tidak ada file yang ditulis)"); process.exit(0); }

for (const f of berubah) fs.writeFileSync(f.p, f.hasil);
fs.writeFileSync(APPLIED, JSON.stringify(baru, null, 2) + "\n");
console.log(`\nSelesai. ${berubah.length} file diperbarui:`, berubah.map((f) => rel(f.p)).join(", "));
console.log("Yang TIDAK otomatis: angka statistik (jumlah siswa/guru), tautan sosmed, peta embed, dan isi berita/guru (kelola lewat admin).");
