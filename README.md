# Product Intelligence Center Frontend

Dashboard frontend bergaya executive untuk melihat informasi produk yang sudah diproduksi, quality check, serta traceability produk.

## Rekomendasi stack

Untuk implementasi produksi, rekomendasi terbaik adalah React + TypeScript + Vite karena kebutuhan aplikasi ini akan berkembang menjadi banyak state, integrasi API, role access, report, dan detail traceability bertingkat. Versi di folder ini dibuat sebagai static SPA tanpa dependency agar bisa langsung dicoba dan mudah dipindahkan ke React.

## Cara menjalankan

Buka `index.html` langsung di browser.

Demo login:

- Username: `admin`
- Password: `admin123`

## Fitur

- Login page dengan validasi field, panjang password, dan kredensial.
- Dashboard sebagai halaman awal dengan ringkasan produksi, chart, dan daftar maksimal 5 produk terakhir per page.
- Roll Production List sebagai halaman list-only untuk Jumbo Roll dan Slit Roll yang terproduksi.
- Kode produk mengikuti format 6 karakter: `JR`/`SR` + 3 kode alfanumerik + `I` untuk input slitting atau `O` untuk produk final.
- Batch produk menggunakan 10 digit angka.
- Jumbo Roll diset sebagai input slitting; Slit Roll dapat menjadi input slitting lanjutan jika kode berakhiran `I`, dan menjadi produk final jika berakhiran `O`.
- Line chart produksi dengan pilihan periode harian, mingguan, bulanan, kuartal, semester, dan tahunan.
- Filter produk saat titik periode pada chart dipilih.
- Toggle tampilan list atau card.
- Detail produk berisi karakteristik, status QC, detail QC dengan hover assessment, histori posisi, dan material pembentuk.
- Histori Jumbo Roll dapat menampilkan beberapa Slit Roll hasil slitting dari parent roll yang sama.
- Traceability report dengan search bar dan traceability preview inline.
- Traceability report dibatasi 10 produk per page.
- Session login tersimpan di browser agar refresh tidak logout.
- Transisi antar halaman menampilkan loading modal minimal 1 detik.
- Sidebar mengikuti tinggi jendela browser, logout berada di bagian bawah sidebar, dan konten page memakai scrollbar sendiri.
- Export report ke CSV.
- Modal dialog untuk notifikasi aplikasi.

## Struktur source

- `app.js`: entrypoint aplikasi dan fungsi render utama.
- `src/config.js`: konfigurasi sumber data aktif, saat ini `mock`.
- `src/data-sources/mockData.js`: kredensial demo dan data produk untuk mode mock.
- `src/data-sources/mockDataSource.js`: adapter data lokal dari `mockData.js`.
- `src/data-sources/apiDataSource.js`: adapter contoh untuk mengambil data dari backend API.
- `src/data-sources/apiDataSource.example.js`: contoh frontend API client yang masih full comment untuk referensi integrasi backend.
- `src/repositories/productRepository.js`: pintu akses data produk untuk UI.
- `src/repositories/authRepository.js`: pintu akses login untuk UI.
- `src/state.js`: state aktif aplikasi.
- `src/ui.js`: helper visual seperti icon, badge, dan label.
- `src/views.js`: template/render untuk login, dashboard, roll production list, detail, dan report.
- `src/events.js`: event handler login, filter, navigasi, detail, dan export CSV.
