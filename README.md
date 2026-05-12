# Product Intelligence Center Frontend

Executive manufacturing frontend untuk melihat production output, QC result, dan traceability produk.

## Rekomendasi stack

Untuk implementasi produksi, rekomendasi terbaik adalah React + TypeScript + Vite karena kebutuhan aplikasi ini akan berkembang menjadi banyak state, integrasi API, role access, report, dan detail traceability bertingkat. Versi di folder ini dibuat sebagai static SPA tanpa dependency agar bisa langsung dicoba dan mudah dipindahkan ke React.

## Cara menjalankan

Buka `index.html` langsung di browser.

Demo login:

- Username: `admin`
- Password: `admin123`
- Username: `executive`
- Password: `exec12345`
- Username: `qa`
- Password: `qa123456`
- Username: `production`
- Password: `prod12345`
- Username: `warehouse`
- Password: `wh123456`

## Fitur

- Login page dengan validasi field, panjang password, dan kredensial.
- Mock data berisi 60 produk Jumbo Roll dan Slit Roll yang tersebar dari Januari sampai April 2026, termasuk skenario joined roll dan multi-stage join.
- Production Dashboard sebagai halaman awal dengan production summary, chart, dan daftar maksimal 5 output terakhir per page.
- Production Output List sebagai halaman list-only untuk Jumbo Roll dan Slit Roll yang terproduksi.
- Kode produk mengikuti format 6 karakter: `JR`/`SR` + 3 kode alfanumerik + `I` untuk Semi-finished Good atau `O` untuk Finish Good.
- Batch produk menggunakan 10 digit angka.
- Jumbo Roll dikategorikan sebagai Semi-finished Good; Slit Roll dapat menjadi Semi-finished Good jika kode berakhiran `I`, dan menjadi Finish Good jika berakhiran `O`.
- Line chart Production Trend dengan pilihan periode harian, mingguan, bulanan, kuartal, semester, dan tahunan.
- Filter produk saat titik periode pada chart dipilih.
- Toggle tampilan list atau card.
- Product Detail berisi product characteristics, QC detail dengan hover assessment, Movement History, dan Material Source.
- Movement History pada Jumbo Roll dapat menampilkan beberapa Slit Roll hasil slitting dari parent roll yang sama.
- Traceability Report dengan search bar dan traceability preview inline.
- Traceability Report dibatasi 10 produk per page.
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
