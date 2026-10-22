/**
 * SDN 2 Karangmangu - Data Master & Default Schema
 * Berfungsi sebagai sumber data sentral untuk frontend dan CMS.
 * Mendukung persistensi localStorage dan siap diintegrasikan dengan Google Sheets.
 */

/**
 * Tautan internal ditulis relatif ("ppdb.html"), bukan "/ppdb.html".
 * Awalan "/" berarti "akar domain" sehingga rusak di GitHub Pages situs proyek
 * (doniyan.github.io/nama-repo/) dan saat file dibuka langsung dari komputer.
 * Data lama yang masih berisi "/ppdb.html" (mis. di Google Sheets) ikut diperbaiki di sini.
 */
function resolveInternalLink(url) {
  const u = String(url || "").trim();
  return /^\/(?!\/)/.test(u) ? u.slice(1) : u;
}

const DEFAULT_DATA = {
  siteConfig: SCHOOL_CONFIG.site,

  teachers: [
    {
      id: "T01",
      name: "Drs. H. Bambang Subagyo, M.Pd.",
      nip: "19680415 199303 1 004",
      status: "PNS / Pembina Tk. I",
      category: "guru-kelas",
      role: "Kepala Sekolah",
      subject: "Manajerial & Supervisi Akademik",
      motto: "Mendidik dengan hati, meneladankan integritas, dan membangun keunggulan berkarakter.",
      email: "kepsek@sdn2karangmangu.sch.id",
      photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-znBPXSyRrzTUe3Afn9CRg2e7cO8NJenHGlkRi2YXqrtTkOhhaZQEg9vXbJJVLougY5Cxzeb3tX-dVPyRY48UYej2GkNsRPNNR4d3iVYqm9yTFwx_1WvNnRHKZcQBm1mzKzXjpWhcYlqBWJPtemQzJ5-1OYjtOEVmyGk3Pn6wYG_qWJpPnetplrfD6zveX6pds-z-TyvBsUc0rW550EFXiWYQyq9D6b1oNJCrRdH2lCSn4q8GxEL2"
    },
    {
      id: "T02",
      name: "Endang Purwanti, S.Pd., Gr.",
      nip: "19830419 200801 2 011",
      status: "PNS / Guru Ahli Madya",
      category: "guru-kelas",
      role: "Wali Kelas 1A & Koordinator Kurikulum",
      subject: "Guru Kelas Fase A (Literasi & Numerasi)",
      motto: "Setiap anak adalah bibit unggul yang bertumbuh dengan cara unik dan penuh keajaiban.",
      email: "endang.p@sdn2karangmangu.sch.id",
      photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCi8L62S4XU9OqUCVg9qjnGTScnLorOYKRGekQLsk7qUK4ojIyRBFlRLN-VWEZFLOBbt3VTo7Y6eRm8fgWD7iIzk91JZzxIvUqkqrU-D7N5AjPo4N4mrY0MS1v7rs1ZBoCVUyEAgK9iY8gos-qUjiRi15yCE9qv5iF6zMtVLx0boziaQvszDUjqY5Zd4WSwkOHeMTIEzJ6Dtil5PA7Uj9f-BP6wsPBvDV6NHvL4yLdHpiVY9Pos9Ka"
    },
    {
      id: "T03",
      name: "Agus Wahyudi, S.Pd.",
      nip: "19790915 200604 1 013",
      status: "PNS / Guru Ahli Muda",
      category: "guru-kelas",
      role: "Wali Kelas 6B & Koordinator Kesiswaan",
      subject: "Guru Kelas Fase C (Tematik Terpadu & Sains)",
      motto: "Kunci keberhasilan belajar adalah disiplin yang dibalut rasa saling menghargai.",
      email: "agus.w@sdn2karangmangu.sch.id",
      photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvnKfxjN4V0jRtgMy_IuvmHPwqlqUhAuTwscSyTt6vMHcuAHqhAH26zDJOVJngpRyGP_yA23zBZJgBk9c8RoC7VRNUonaEC2FIGOIfF-WlS_jyfV13g7vjCFVDZBMrQY_xSVoljwvUtdSgNoPiuDkpBojjncB5UbbYlEC1e5xHceLfDDIKG5KhJHs8_Qq2-hW741vMh86j5ul4gy6Yn4j8548GGJU3QMiD75Q2V2a3RPJrxm3MgNyc"
    },
    {
      id: "T04",
      name: "Siti Nur Aisyah, S.Pd.I.",
      nip: "19860214 201101 2 009",
      status: "PNS / Sertifikasi Guru",
      category: "guru-mapel",
      role: "Guru Pendidikan Agama Islam & Budi Pekerti",
      subject: "Pendidikan Agama Islam (Kelas 1 - 6)",
      motto: "Menanamkan kecintaan pada nilai tauhid dan akhlakul karimah sejak usia dini.",
      email: "aisyah.pai@sdn2karangmangu.sch.id",
      photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh2J9meK3yQmfz7zPkHWjDOmQWZO-ZZWrbr25BQhXu30iAOWK2pdBf7T599OHWPSq8eqo1jdC-jBsSA_kIjsaPcRfQLoOpfEik2-NSKd5tAv2cC85xhQ8EfjfdqG_u9TVkbiRBTmO6u8j0y9JJn7U6I-Q6o39Ji9zX2MbuZMvaNlQpbPGMNq3rMcmqfBce5vypMP1ZKoAJUHuPRW_3yEFHrSrNy9nBgLLV5HLL6DJWicl7Ims4TDDQ"
    },
    {
      id: "T05",
      name: "Rudi Hartono, S.Pd.Jas.",
      nip: "19910822 201903 1 007",
      status: "PPPK Guru",
      category: "guru-mapel",
      role: "Guru PJOK & Pembina Pramuka",
      subject: "Pendidikan Jasmani, Olahraga & Kesehatan",
      motto: "Jiwa yang tangguh mekar di dalam tubuh yang sehat, sportivitas adalah kehormatan.",
      email: "rudi.pjok@sdn2karangmangu.sch.id",
      photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUHgr8R57cmhxZxJbjPcRcxrIG7lBv84jrsitccqrWbA8bY70_X_ZkdZqR5JiSStzqCsGH9u3FwiJgXlov5z49GGL0oQtKp4eYd19yI-hc6lnZuwSNwL0ZGDt5-8vaDc_SXnMcrzxcgq5VYMMiTY7pbz_Iat4QMmVMoMHrmmbQK9Bd51K-xXlkxhXs--LVCzuTR4nhsqOjlkqP5muDNnBC1JD4-ln23SDf9IDKyseb3mFwQkwCSYN0"
    },
    {
      id: "T06",
      name: "Dewi Lestari, S.Pd.",
      nip: "19881105 201402 2 003",
      status: "PNS / Guru Ahli Muda",
      category: "guru-kelas",
      role: "Wali Kelas 3A",
      subject: "Guru Kelas Fase B (Tematik & Bahasa)",
      motto: "Belajar menyenangkan mengubah rasa ingin tahu murid menjadi prestasi membanggakan.",
      email: "dewi.lestari@sdn2karangmangu.sch.id",
      photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUex5_VvtBRM-muNHL33907qW2QNYT8RXwKEyufNFSaskD2jhYbCr-7cuClMG1soYIPVMzGPVZaxF3FfxD1Ep5GoRYF2goTcp7qXavdaD3R0krXgPMLbVQFhOLn6neY3UIFuAulWD-3Fpi8_7_B4QloPa1UxcRRhJEL52MZPe9rQP9CViZ7HH5jmO9w6Nh7m-98TgGFQ1nsej0fvC5hdxITFYsXh8mSeiPMPo_FmcKGX3WCgTVXNtp"
    },
    {
      id: "T07",
      name: "Tri Mulyono, S.Kom.",
      nip: "19940110 202221 1 002",
      status: "PPPK Tenaga Teknis",
      category: "tendik",
      role: "Kepala Tata Usaha & Operator Dapodik",
      subject: "Administrasi Sekolah & Sistem Informasi",
      motto: "Akurasi data adalah fondasi utama keterbukaan layanan pendidikan berintegritas.",
      email: "tu.admin@sdn2karangmangu.sch.id",
      photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuA_5dqoOpzVYaleDHpa3oTw4Ab9VbE1zWw8NcxY_yukOS2Ixvx0aDVFcWNfD2V5gBa8eqBp9aWe6YOkmPp-Sw_WBXQyKW9YSjnNmkBxVFgTeESuZyMIcR-twwIgVdIL2IADWOsFwpX2SsHUDAAi06e4Ajozpd-ZX_Wfa8bbXnRJ0_Pxqz0CpRUx85_yF-1bJcAN9z8v0dIk8kYwsTS6i4FvzcKcqqzGScWIHMlfIzIPaI2JjdO0xPDU"
    },
    {
      id: "T08",
      name: "Ratna Wulandari, S.I.Pust.",
      nip: "19960718 202321 2 018",
      status: "PPPK Tenaga Fungsional",
      category: "tendik",
      role: "Pengelola Perpustakaan Digital",
      subject: "Layanan Sirkulasi & Literasi Digital",
      motto: "Buku adalah jendela imajinasi tanpa batas bagi generasi penerus bangsa.",
      email: "perpus@sdn2karangmangu.sch.id",
      photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5XfsYmFclXx0r1zPmhM9hJt-gGfy9lGl0py5SkkV7YM-i0LHdrViPOlL9kRJd6mW7QyPGQ1FKsLle5v-D4nx8Cq7dQTR01kj42wi1VkQWRuEfALfLeRiakFZPWPuXI_Tqp6gNOib1r4Al9K-2DHZCTyyqrxCgB1EiVOzo6uqk-K4Jm2GA73jEsUwmoBV5OnsruSYOJgqkJqjDaYYmNRMRSiZpY2ov_d2WoR-6-zdmv1zKvOS3SfaB"
    }
  ],

  news: [
    {
      id: "NW-01",
      slug: "implementasi-pembelajaran-berdiferensiasi-p5",
      title: "Implementasi Pembelajaran Berdiferensiasi pada Projek P5 Gaya Hidup Berkelanjutan",
      category: "Pendidikan",
      author: "Humas Sekolah",
      date: "2025-04-28",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh2J9meK3yQmfz7zPkHWjDOmQWZO-ZZWrbr25BQhXu30iAOWK2pdBf7T599OHWPSq8eqo1jdC-jBsSA_kIjsaPcRfQLoOpfEik2-NSKd5tAv2cC85xhQ8EfjfdqG_u9TVkbiRBTmO6u8j0y9JJn7U6I-Q6o39Ji9zX2MbuZMvaNlQpbPGMNq3rMcmqfBce5vypMP1ZKoAJUHuPRW_3yEFHrSrNy9nBgLLV5HLL6DJWicl7Ims4TDDQ",
      summary: "Peserta didik kelas 4 dan 5 antusias memanfaatkan barang bekas untuk pembuatan ecobrick dan pupuk kompos cair ramah lingkungan.",
      content: "SDN 2 Karangmangu menyelenggarakan gelar karya Proyek Penguatan Profil Pelajar Pancasila (P5) dengan tema 'Gaya Hidup Berkelanjutan'. Kegiatan ini melibatkan peserta didik kelas 4 dan 5 dalam mengolah sampah organik dan anorganik di lingkungan sekolah menjadi produk bermanfaat seperti ecobrick, pupuk kompos cair, dan pot tanaman hias ramah lingkungan. Guru pembimbing memberikan pendampingan intensif agar siswa memahami nilai gotong royong dan kepedulian terhadap kelestarian alam.",
      status: true
    },
    {
      id: "NW-02",
      slug: "medali-emas-osn-matematika-kroya",
      title: "Siswa SDN 2 Karangmangu Raih Medali Emas OSN Matematika Tingkat Kecamatan",
      category: "Prestasi",
      author: "Bid. Kesiswaan",
      date: "2025-04-22",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGDTRJssM8EduTY2jNRxC0CQ3cN2NZnypemkFb49q0nX105y1oVNhDupo1eqYeSBlLl5b2pMJGvrjHsY4sS-rg4JPtPxncZvIQ24_E0BIlrRxnVKwycibyuorgZw74PdKqTKEUNpBGCMPZL44byoeG7WX330W5Q_4TbhG8Pf3KFo8x-I5XWIFypb7qVryafs6Z-iBotEbOk8bxEqPb-gCUYuN7nIbXa48sRCcIb3TaekyGbmFJB_yG",
      summary: "Ananda Rayhan Pratama (Kelas 5B) berhasil menyisihkan puluhan kontingen lain dan maju mewakili kecamatan ke tingkat kabupaten Cilacap.",
      content: "Prestasi membanggakan kembali ditorehkan oleh siswa SDN 2 Karangmangu dalam ajang Olimpiade Sains Nasional (OSN) tingkat Kecamatan Kroya tahun 2025. Ananda Rayhan Pratama dari kelas 5B berhasil menyabet Juara 1 (Medali Emas) pada cabang Matematika setelah melewati babak penyisihan dan final yang ketat. Kepala Sekolah, Drs. H. Bambang Subagyo, M.Pd., menyampaikan apresiasi tinggi kepada ananda dan dewan guru pembina atas kerja keras dan disiplin latihan yang membuahkan hasil manis.",
      status: true
    },
    {
      id: "NW-03",
      slug: "gelar-seni-budaya-nusantara-2025",
      title: "Gelar Seni & Budaya Nusantara Mengasah Kepekaan Rasa dan Gotong Royong",
      category: "Kegiatan",
      author: "Komite Sekolah",
      date: "2025-04-15",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUex5_VvtBRM-muNHL33907qW2QNYT8RXwKEyufNFSaskD2jhYbCr-7cuClMG1soYIPVMzGPVZaxF3FfxD1Ep5GoRYF2goTcp7qXavdaD3R0krXgPMLbVQFhOLn6neY3UIFuAulWD-3Fpi8_7_B4QloPa1UxcRRhJEL52MZPe9rQP9CViZ7HH5jmO9w6Nh7m-98TgGFQ1nsej0fvC5hdxITFYsXh8mSeiPMPo_FmcKGX3WCgTVXNtp",
      summary: "Peringatan Hari Kartini diwarnai parade pakaian adat Nusantara dan bazar kewirausahaan cilik yang dihadiri seluruh wali murid.",
      content: "Halaman sekolah SDN 2 Karangmangu semarak dengan warna-warni busana adat tradisional dari Sabang sampai Merauke dalam acara Gelar Seni Budaya Nusantara. Siswa-siswi menampilkan beragam pertunjukan tarian daerah Banyumasan, paduan suara lagu wajib nasional, serta pembacaan puisi kebangsaan. Selain itu, bazar makanan sehat tradisional olahan paguyuban orang tua murid turut memeriahkan suasana keakraban antarwarga sekolah.",
      status: true
    }
  ],

  announcements: [
    {
      id: "AN-01",
      title: "Jadwal Verifikasi Berkas Fisik Calon Siswa Baru PPDB 2025/2026",
      category: "PPDB",
      date: "2025-05-01",
      content: "Bagi calon wali murid yang telah mendaftar daring pada portal PPDB SDN 2 Karangmangu, mohon membawa berkas fisik berupa fotokopi Akta Kelahiran, Kartu Keluarga (KK), KTP Orang Tua, dan pas foto 3x4 (2 lembar) ke ruang panitia PPDB pada hari kerja pukul 08.00 - 12.00 WIB.",
      link: "ppdb.html",
      status: true
    },
    {
      id: "AN-02",
      title: "Ketentuan Seragam Batik Identitas & Pramuka Semester Genap",
      category: "Tata Tertib",
      date: "2025-04-25",
      content: "Diberitahukan kepada seluruh peserta didik bahwa mulai pekan depan penggunaan seragam batik sekolah dijadwalkan pada hari Rabu dan Kamis, serta seragam Pramuka lengkap pada hari Jumat dan Sabtu sesuai aturan dinas pendidikan daerah.",
      link: "#",
      status: true
    },
    {
      id: "AN-03",
      title: "Penyesuaian Kegiatan Belajar Mengajar Hari Kenaikan Isa Almasih",
      category: "Libur Nasional",
      date: "2025-04-10",
      content: "Sehubungan dengan hari libur nasional peringatan Kenaikan Isa Almasih, seluruh kegiatan pembelajaran tatap muka ditiadakan pada tanggal merah tersebut dan kembali aktif sesuai jam operasional normal pada hari berikutnya.",
      link: "#",
      status: true
    }
  ],

  agenda: [
    {
      id: "AG-01",
      title: "Asesmen Sumatif Akhir Jenjang (ASAJ Kelas 6)",
      category: "Ujian",
      date: "2025-05-12",
      time: "07.30 - 11.30 WIB",
      location: "Ruang Kelas 6A & 6B",
      description: "Penilaian terstandar untuk peserta didik kelas VI sebagai salah satu indikator penentu kelulusan sekolah dasar.",
      status: true
    },
    {
      id: "AG-02",
      title: "Peringatan Hari Kebangkitan Nasional",
      category: "Upacara",
      date: "2025-05-19",
      time: "07.00 - 08.30 WIB",
      location: "Lapangan Utama SDN 2 Karangmangu",
      description: "Upacara bendera serentak diikuti seluruh dewan guru, staf TU, dan siswa kelas 1 hingga 6 dengan khidmat.",
      status: true
    },
    {
      id: "AG-03",
      title: "Penilaian Akhir Tahun (PAT) Semester Genap",
      category: "Akademik",
      date: "2025-06-02",
      time: "07.30 - 11.00 WIB",
      location: "Semua Ruang Belajar",
      description: "Asesmen akhir semester genap tahun ajaran 2024/2025 untuk kelas 1 sampai kelas 5.",
      status: true
    },
    {
      id: "AG-04",
      title: "Masa Pengenalan Lingkungan Sekolah (MPLS) Siswa Baru",
      category: "Kesiswaan",
      date: "2025-07-14",
      time: "07.00 - 10.30 WIB",
      location: "Gedung Sekolah & Aula Terbuka",
      description: "Orientasi ramah anak bagi siswa baru kelas 1 guna mengenalkan budaya sekolah, dewan guru, dan teman sebaya.",
      status: true
    }
  ],

  gallery: [
    {
      id: "GL-01",
      title: "Latihan Rutin Pramuka Siaga",
      category: "Kepramukaan",
      date: "2025-04-26",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUHgr8R57cmhxZxJbjPcRcxrIG7lBv84jrsitccqrWbA8bY70_X_ZkdZqR5JiSStzqCsGH9u3FwiJgXlov5z49GGL0oQtKp4eYd19yI-hc6lnZuwSNwL0ZGDt5-8vaDc_SXnMcrzxcgq5VYMMiTY7pbz_Iat4QMmVMoMHrmmbQK9Bd51K-xXlkxhXs--LVCzuTR4nhsqOjlkqP5muDNnBC1JD4-ln23SDf9IDKyseb3mFwQkwCSYN0",
      description: "Kegiatan kepramukaan siaga melatih kemandirian, keterampilan tali-temali, dan kekompakan baris-berbaris."
    },
    {
      id: "GL-02",
      title: "Pelatihan Dokter Kecil & UKS",
      category: "Kesehatan",
      date: "2025-04-20",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAACB3sAm-NTClkqCWiFPEMKqrF7wChWOmbpoWjV0velsox8QGJTcCYvL7CYOYEuPbvFHMYKnqsZH3Rgi69q9LXUWRDqMq01B519AqBbJ18jm6IYSIvByIfFPwE56t0HSZYFnC4y0rkrK-B1LqDCtTdUvIc4RnoHhpDU7KwKQbdaiT1eC7Q2h4M0CSz1S_-RSiiyvE1a3TknYpBReJ2jnpJCymGlBwyF5Y5XJZvbdbcpYkiVBH_nQX6",
      description: "Edukasi kesehatan dasar, cuci tangan 6 langkah, dan simulasi penanganan luka ringan bekerja sama dengan Puskesmas."
    },
    {
      id: "GL-03",
      title: "Pentas Tari Tradisional Banyumasan",
      category: "Seni & Budaya",
      date: "2025-04-15",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXB8tZ_lm9Duf_U9YErgsXCPZcHAmQM6V2Iyql_-_Fc0ZaW5eoiAefhgHM0KIPL4HaziQTjVEK0uhfjbxnvF2NVgF1Rxij9br8luq2YOWI9GSOzN19KDk5uaPQJAkX69flcf5nH6fNA3HVyUxXZjn7OGcgdpogbtsVrPFEtOBFSEBqbgIUwhCq_6_d9PPJm12e9mMbISaLFglZlbocPrGY7bm8ni_W-u7lfI66UXesP44a-WXkVOQe",
      description: "Penampilan memukau tari kreasi daerah oleh siswi sanggar tari sekolah di hadapan para orang tua."
    },
    {
      id: "GL-04",
      title: "Klub Robotika & Sains Cilik",
      category: "STEM",
      date: "2025-04-05",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEjNpvHi2XkhotAl4aKlkyYgNzXX0qWvcp-N306miTllp0HK5lgLW5CoqMyZABADSuYswlJP6lNp_cn0JPzoGTvqHmkYLDW3DdBt7F23I_QquLgaMM6gQggObpAHPBiamx2160gypcJoFqvrejQAuYzSVArPms_WboG45h0N2aK_wfJQM_PDNV8llD1tlskS_R1fIwxRn7GYA2UGCwyj-TEW1ayvnRAb0BrEEgwdNzRRm_w2yrApme",
      description: "Eksplorasi sensor cahaya, mini robot penghindar rintangan, dan logika komputasi sederhana untuk siswa fase B dan C."
    }
  ],

  achievements: [
    {
      id: "AC-01",
      title: "Juara 1 OSN Matematika Tingkat Kecamatan",
      winner: "Rayhan Pratama",
      category: "Sains & Matematika",
      level: "Kecamatan Kroya",
      year: "2025",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGDTRJssM8EduTY2jNRxC0CQ3cN2NZnypemkFb49q0nX105y1oVNhDupo1eqYeSBlLl5b2pMJGvrjHsY4sS-rg4JPtPxncZvIQ24_E0BIlrRxnVKwycibyuorgZw74PdKqTKEUNpBGCMPZL44byoeG7WX330W5Q_4TbhG8Pf3KFo8x-I5XWIFypb7qVryafs6Z-iBotEbOk8bxEqPb-gCUYuN7nIbXa48sRCcIb3TaekyGbmFJB_yG",
      description: "Membawa pulang medali emas dan piala bergilir untuk kategori olimpiade matematika sekolah dasar."
    },
    {
      id: "AC-02",
      title: "Juara Umum Sekolah Ramah Anak",
      winner: "Civitas SDN 2 Karangmangu",
      category: "Kelembagaan",
      level: "Kabupaten Cilacap",
      year: "2024",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjk5Piw_T534SXudOiV6KQmn4dvYiaRDRKC4CdTycZPeWA3ydU5E1JvoZVLdmjgNmWsei92xiBz3TeVJD650zp_CyozBATkHBJfCBAn4QV-HklTlq_Hjdon7Nfoq8NxAUkCl0rFvK35n6GDCWv0fRBId04BWnsSE3nHhr_lpKMRCxsw_5zlvju7OP_CVIPFEdkdo_BU7sodhMqU6nqquRvbug-jdf7p2oVIVi4aQZ8bZiezRFGT04X",
      description: "Penghargaan atas komitmen mewujudkan lingkungan belajar aman, anti perundungan, inklusif, dan ramah anak."
    },
    {
      id: "AC-03",
      title: "Juara 1 Sekolah Adiwiyata Berwawasan Lingkungan",
      winner: "Tim Adiwiyata Sekolah",
      category: "Lingkungan Hidup",
      level: "Kecamatan",
      year: "2024",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuByiLyvQeVxCYIZnrTFKQWCuPszmStTwjCj2EoqyM48fSs7UiQtqehTuxXsyClSmWesDWT3X1_xncWKZKnx6OZ3-myvtlUiXLi7l5A-jKfhESPfEpwJ3gVBxiTdB3XitxQvCLVzaU-UzDweg6pzEyPFQ62uj7CDFWRNIv3isJwl2KFA0hchP0RHX6rTJVzIAuAUfd8TTu2qmaFX9yk-WwHAJ9nKqZTY95dAHSsz7X0krxyLzGlCsGvl",
      description: "Keberhasilan pengelolaan taman hidroponik, bank sampah mandiri, dan pengomposan organik di lingkungan sekolah."
    },
    {
      id: "AC-04",
      title: "Medali Emas Lomba Senam Ritmik Beregu",
      winner: "Tim Senam Putri SDN 2",
      category: "Olahraga",
      level: "Kabupaten",
      year: "2024",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwS_wcLajU01PIH4ANt-O9QbA9C103-6PG7T1zZomp-cyAdAQxr_pAzGvMzvLj876r68x9GiXQogICMbRTFdwomAV5LlskAFjXXERmpyVfocIdRiG4Z0YL2-9FoTM1Va9LE0NKOW-eZ5ta7Zf9m526VLDgfLzyaKVxPC3Z_RYqtjMGgCfhWmznAoiZxY-WKJxT4we2t4IMgPHAJwh2g8uv5sOeXP4NFriANHIknPNtHbAzshfd_CCp",
      description: "Torehan prestasi gemilang bidang kebugaran jasmani tingkat kabupaten Cilacap."
    }
  ],

  ppdb: {
    statusBuka: true,
    tahunAjaran: "2025/2026",
    kuota: 60,
    kuotaTerisi: 42,
    tanggalMulai: "2025-05-01",
    tanggalSelesai: "2025-06-30",
    syarat: [
      "Berusia minimal 6 tahun pada tanggal 1 Juli tahun berjalan (diutamakan usia 7 tahun).",
      "Mengisi formulir pendaftaran daring secara lengkap dan benar.",
      "Fotokopi Akta Kelahiran calon peserta didik (2 lembar) & menunjukkan aslinya.",
      "Fotokopi Kartu Keluarga (KK) orang tua/wali murid (2 lembar).",
      "Fotokopi KTP Orang Tua (Ayah & Ibu) (masing-masing 2 lembar).",
      "Pas foto calon siswa ukuran 3x4 berwarna (3 lembar).",
      "Fotokopi Ijazah TK / PAUD (jika ada)."
    ],
    jadwal: [
      { tahap: "Pendaftaran Online", tanggal: "01 Mei – 20 Juni 2025", keterangan: "Melalui portal resmi PPDB website sekolah" },
      { tahap: "Verifikasi Berkas Fisik", tanggal: "21 – 25 Juni 2025", keterangan: "Di kantor panitia PPDB SDN 2 Karangmangu" },
      { tahap: "Pengumuman Hasil Seleksi", tanggal: "28 Juni 2025", keterangan: "Diumumkan online di website & papan info sekolah" },
      { tahap: "Daftar Ulang & Pengambilan Seragam", tanggal: "30 Juni – 04 Juli 2025", keterangan: "Konfirmasi kesediaan & pembagian perlengkapan" },
      { tahap: "Hari Pertama Masuk Sekolah & MPLS", tanggal: "14 Juli 2025", keterangan: "Upacara penyambutan dan pengenalan sekolah" }
    ],
    faqs: [
      {
        q: "Berapa biaya pendaftaran siswa baru di SDN 2 Karangmangu?",
        a: "Biaya pendaftaran dan seluruh proses seleksi PPDB SDN 2 Karangmangu adalah GRATIS (Rp 0), tanpa dipungut biaya apapun."
      },
      {
        q: "Bagaimana jika anak belum berusia genap 7 tahun?",
        a: "Anak berusia 6 tahun per 1 Juli dapat mendaftar. Untuk anak usia minimal 5 tahun 6 bulan dapat dipertimbangkan jika memiliki potensi kecerdasan istimewa disertai rekomendasi psikolog profesional."
      },
      {
        q: "Apakah pendaftar dari luar zonasi diperkenankan mendaftar?",
        a: "Ya, kuota luar zonasi (jalur afirmasi / perpindahan tugas orang tua) dibuka dengan alokasi khusus sesuai aturan Permendikbudristek."
      }
    ],
    kontakPanitia: {
      ketua: "Bapak Rudi Hartono, S.Pd.Jas.",
      telepon: "+62 812-3456-7890",
      waktu: "Pukul 08.00 - 14.00 WIB (Senin - Sabtu)"
    }
  },

  ppdbRegistrations: [
    {
      id: "REG-2025-001",
      namaAnak: "Ahmad Rizky Pratama",
      nik: "3301051205180001",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Cilacap",
      tanggalLahir: "2018-05-12",
      namaOrtu: "Suharyanto",
      teleponOrtu: "081234567891",
      alamat: "RT 02 RW 01 Desa Karangmangu",
      status: "Terverifikasi",
      tanggalDaftar: "2025-05-02"
    },
    {
      id: "REG-2025-002",
      namaAnak: "Nadia Putri Cahyani",
      nik: "3301055508180003",
      jenisKelamin: "Perempuan",
      tempatLahir: "Banyumas",
      tanggalLahir: "2018-08-15",
      namaOrtu: "Budi Santoso",
      teleponOrtu: "082198765432",
      alamat: "RT 04 RW 02 Desa Karangmangu",
      status: "Menunggu Verifikasi",
      tanggalDaftar: "2025-05-03"
    }
  ],

  messages: [
    {
      id: "MSG-01",
      nama: "Ibu Rahayu",
      email: "rahayu.mama@gmail.com",
      telepon: "081399887766",
      subjek: "Konsultasi Pindahan Siswa Kelas 3",
      pesan: "Mohon informasi ketersediaan kuota siswa pindahan untuk kelas 3 semester depan dari Jakarta.",
      tanggal: "2025-05-01",
      status: "Belum Dibaca"
    }
  ]
};

// Storage Keys
const STORAGE_KEYS = {
  CONFIG: "sdn2_siteConfig",
  TEACHERS: "sdn2_teachers",
  NEWS: "sdn2_news",
  ANNOUNCEMENTS: "sdn2_announcements",
  AGENDA: "sdn2_agenda",
  GALLERY: "sdn2_gallery",
  ACHIEVEMENTS: "sdn2_achievements",
  PPDB: "sdn2_ppdb",
  PPDB_REG: "sdn2_ppdbRegistrations",
  MESSAGES: "sdn2_messages"
};

// Inisialisasi Database Lokal
function initDatabase() {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_DATA.siteConfig));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(DEFAULT_DATA.teachers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEWS)) {
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(DEFAULT_DATA.news));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(DEFAULT_DATA.announcements));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AGENDA)) {
      localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(DEFAULT_DATA.agenda));
    }
    if (!localStorage.getItem(STORAGE_KEYS.GALLERY)) {
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(DEFAULT_DATA.gallery));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(DEFAULT_DATA.achievements));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PPDB)) {
      localStorage.setItem(STORAGE_KEYS.PPDB, JSON.stringify(DEFAULT_DATA.ppdb));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PPDB_REG)) {
      localStorage.setItem(STORAGE_KEYS.PPDB_REG, JSON.stringify(DEFAULT_DATA.ppdbRegistrations));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(DEFAULT_DATA.messages));
    }
  } catch (e) {
    console.warn("LocalStorage tidak tersedia atau diblokir:", e);
  }
}

// Global Getter Helpers
function loadSiteConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.siteConfig;
  } catch (e) {
    return DEFAULT_DATA.siteConfig;
  }
}

function loadTeachers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.teachers;
  } catch (e) {
    return DEFAULT_DATA.teachers;
  }
}

function loadNews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NEWS);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.news;
  } catch (e) {
    return DEFAULT_DATA.news;
  }
}

function loadAnnouncements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.announcements;
  } catch (e) {
    return DEFAULT_DATA.announcements;
  }
}

function loadAgenda() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENDA);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.agenda;
  } catch (e) {
    return DEFAULT_DATA.agenda;
  }
}

function loadGallery() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GALLERY);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.gallery;
  } catch (e) {
    return DEFAULT_DATA.gallery;
  }
}

function loadAchievements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.achievements;
  } catch (e) {
    return DEFAULT_DATA.achievements;
  }
}

function loadPPDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PPDB);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.ppdb;
  } catch (e) {
    return DEFAULT_DATA.ppdb;
  }
}

function loadPPDBRegistrations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PPDB_REG);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.ppdbRegistrations;
  } catch (e) {
    return DEFAULT_DATA.ppdbRegistrations;
  }
}

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return raw ? JSON.parse(raw) : DEFAULT_DATA.messages;
  } catch (e) {
    return DEFAULT_DATA.messages;
  }
}

// Jalankan inisialisasi awal
initDatabase();
