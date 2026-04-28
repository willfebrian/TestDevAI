(function registerViews(window) {
  const { products } = window.RollTraceData;
  const state = window.RollTraceState;
  const { icon, productBadge, qcBadge, productFlowBadge, labelize, getProductionDate, parseDate, formatDateLabel, formatMonthYear, formatLastLocation } = window.RollTraceUi;

  const dashboardPageSize = 5;
  const reportPageSize = 10;

  const chartPeriods = [
    { key: "daily", label: "Harian" },
    { key: "weekly", label: "Mingguan" },
    { key: "monthly", label: "Bulanan" },
    { key: "quarterly", label: "Kuartal" },
    { key: "semester", label: "Semester" },
    { key: "yearly", label: "Tahunan" },
  ];

  function filteredProducts({ includeSelectedPeriod = true } = {}) {
    const q = state.query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesType = state.type === "All" || product.type === state.type;
      const matchesPeriod = !includeSelectedPeriod || productMatchesSelectedPeriod(product);
      const matchesQuery = [product.batch, product.code, product.name, product.productionTime]
        .join(" ")
        .toLowerCase()
        .includes(q);

      return matchesType && matchesPeriod && matchesQuery;
    });
  }

  function renderLogin() {
    return `
      <section class="login-shell">
        <div class="login-visual">
          <p class="eyebrow">Product Intelligence Platform</p>
          <h1>Product Intelligence Center</h1>
          <p>Ringkasan produk yang sudah diproduksi, status quality check, asal material, dan posisi terakhir produk untuk review manajemen.</p>
        </div>
        <div class="login-panel">
          <form class="login-card" id="loginForm" novalidate>
            <div class="brand-row">
              <div class="brand-mark">PIC</div>
              <div>
                <strong>Product Intelligence Center</strong><br />
                <small class="muted">Production Intelligence</small>
              </div>
            </div>
            <h2>Masuk ke executive view</h2>
            <p class="helper">Gunakan akun terotorisasi untuk melihat performa produksi, quality status, dan traceability roll.</p>
            <div class="field">
              <label for="username">Username</label>
              <div class="input-wrap">
                <input id="username" name="username" autocomplete="username" placeholder="contoh: admin" />
                <span class="field-icon">@</span>
              </div>
              <span class="error-text" id="usernameError"></span>
            </div>
            <div class="field">
              <label for="password">Password</label>
              <div class="input-wrap">
                <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Minimal 8 karakter" />
                <span class="field-icon">*</span>
              </div>
              <span class="error-text" id="passwordError"></span>
            </div>
            <button class="login-submit" type="submit">Login</button>
            <p class="demo-note">Demo login: <strong>admin</strong> / <strong>admin123</strong></p>
          </form>
        </div>
      </section>
    `;
  }

  function renderApp() {
    const pageTitle = state.selectedProductId
      ? "Detail Produk"
      : state.page === "report"
        ? "Executive Traceability Report"
        : state.page === "production"
          ? "Roll Production List"
          : "Dashboard";
    const subtitle = state.selectedProductId
      ? "Informasi karakteristik, QC, material pembentuk, dan posisi produk."
      : state.page === "report"
        ? "Ringkasan riwayat posisi, asal material, dan status quality untuk review lintas fungsi."
        : state.page === "production"
          ? "Daftar Jumbo Roll dan Slit Roll yang sudah terproduksi."
          : "Ringkasan produksi dan 5 produk terakhir yang diproduksi per page.";

    return `
      <section class="app-shell">
        <aside class="sidebar">
          <button class="brand-row brand-home" data-page="dashboard" type="button" title="Ke Dashboard">
            <div class="brand-mark">PIC</div>
            <div>
              <strong>Product Intelligence Center</strong><br />
              <small>${state.username || "admin"}</small>
            </div>
          </button>
          <nav class="nav-stack">
            <button class="nav-btn ${state.page === "production" ? "active" : ""}" data-page="production">${icon("list")} Roll Production List</button>
            <button class="nav-btn ${state.page === "report" ? "active" : ""}" data-page="report">${icon("report")} Traceability Report</button>
          </nav>
          <div class="sidebar-footer">
            <div>Plant Jakarta - Intelligence View<br />Updated 2026-04-28 15:10</div>
            <button class="nav-btn logout-sidebar" id="logoutBtn" title="Logout">${icon("logout")} Logout</button>
          </div>
        </aside>
        <div class="main-area">
          <header class="topbar">
            <div>
              <h1>${pageTitle}</h1>
              <p>${subtitle}</p>
            </div>
          </header>
          <div class="content">
            ${state.selectedProductId ? renderDetail() : state.page === "report" ? renderReport() : state.page === "production" ? renderProductionList() : renderDashboard()}
          </div>
        </div>
      </section>
    `;
  }

  function renderDashboard() {
    const filteredItems = filteredProducts();
    const orderedItems = getLatestProducts(filteredItems);
    const totalPages = Math.max(1, Math.ceil(orderedItems.length / dashboardPageSize));
    const currentPage = Math.min(state.dashboardPage, totalPages);
    const items = paginateItems(orderedItems, currentPage, dashboardPageSize);
    const scopedProducts = state.selectedPeriod
      ? products.filter((product) => productMatchesSelectedPeriod(product))
      : products;
    const pass = scopedProducts.filter((product) => product.qcStatus === "PASS").length;
    const fail = scopedProducts.filter((product) => product.qcStatus === "FAIL").length;

    return `
      <section>
        <div class="metrics">
          <div class="metric"><span>Total Produk</span><strong>${scopedProducts.length}</strong></div>
          <div class="metric"><span>Jumbo Roll</span><strong>${scopedProducts.filter((p) => p.type === "Jumbo Roll").length}</strong></div>
          <div class="metric"><span>QC PASS</span><strong>${pass}</strong></div>
          <div class="metric"><span>QC FAIL</span><strong>${fail}</strong></div>
        </div>
        ${renderProductionChart()}
        <div class="toolbar">
          <div class="filters">
            <input class="search" id="searchInput" value="${state.query}" placeholder="Cari batch, kode produk, atau nama produk" />
            <select class="select" id="typeFilter">
              <option value="All" ${state.type === "All" ? "selected" : ""}>Semua tipe</option>
              <option value="Jumbo Roll" ${state.type === "Jumbo Roll" ? "selected" : ""}>Jumbo Roll</option>
              <option value="Slit Roll" ${state.type === "Slit Roll" ? "selected" : ""}>Slit Roll</option>
            </select>
            ${
              state.selectedPeriod
                ? `<button class="date-filter-chip" id="clearPeriodFilter" type="button">${state.selectedPeriod.label} <span>Reset</span></button>`
                : ""
            }
          </div>
          <div class="view-toggle" aria-label="Ubah tampilan">
            <button class="icon-btn ${state.view === "list" ? "active" : ""}" data-view="list" title="Tampilan list">${icon("list")}</button>
            <button class="icon-btn ${state.view === "card" ? "active" : ""}" data-view="card" title="Tampilan card">${icon("grid")}</button>
          </div>
        </div>
        <div class="list-note">Daftar produk di Dashboard menampilkan maksimal 5 produk terbaru per page.</div>
        ${items.length ? (state.view === "list" ? renderProductTable(items) : renderProductCards(items)) : '<div class="empty-state">Tidak ada produk yang sesuai filter.</div>'}
        ${renderPagination(currentPage, totalPages, orderedItems.length)}
      </section>
    `;
  }

  function renderProductionList() {
    const items = filteredProducts({ includeSelectedPeriod: false }).sort((a, b) => b.productionTime.localeCompare(a.productionTime));

    return `
      <section>
        <div class="toolbar">
          <div class="filters">
            <input class="search" id="searchInput" value="${state.query}" placeholder="Cari batch, kode produk, atau nama produk" />
            <select class="select" id="typeFilter">
              <option value="All" ${state.type === "All" ? "selected" : ""}>Semua tipe</option>
              <option value="Jumbo Roll" ${state.type === "Jumbo Roll" ? "selected" : ""}>Jumbo Roll</option>
              <option value="Slit Roll" ${state.type === "Slit Roll" ? "selected" : ""}>Slit Roll</option>
            </select>
          </div>
          <div class="view-toggle" aria-label="Ubah tampilan">
            <button class="icon-btn ${state.view === "list" ? "active" : ""}" data-view="list" title="Tampilan list">${icon("list")}</button>
            <button class="icon-btn ${state.view === "card" ? "active" : ""}" data-view="card" title="Tampilan card">${icon("grid")}</button>
          </div>
        </div>
        ${items.length ? (state.view === "list" ? renderProductTable(items) : renderProductCards(items)) : '<div class="empty-state">Tidak ada produk yang sesuai filter.</div>'}
      </section>
    `;
  }

  function getLatestProducts(items, limit) {
    const sortedItems = [...items].sort((a, b) => b.productionTime.localeCompare(a.productionTime));
    return limit ? sortedItems.slice(0, limit) : sortedItems;
  }

  function paginateItems(items, page, pageSize) {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }

  function renderPagination(currentPage, totalPages, totalItems) {
    if (totalItems <= dashboardPageSize) return "";

    return `
      <div class="pagination">
        <button class="ghost-btn" data-dashboard-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} type="button">Sebelumnya</button>
        <span>Page ${currentPage} dari ${totalPages}</span>
        <button class="ghost-btn" data-dashboard-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} type="button">Berikutnya</button>
      </div>
    `;
  }

  function getQcAssessment(qc) {
    if (qc.result === "FAIL") {
      return qc.reason || `${qc.parameter} tidak memenuhi batas toleransi quality check dan perlu review QA.`;
    }

    return qc.assessment || `${qc.parameter} berada dalam batas acceptance criteria untuk produk ini.`;
  }

  function productMatchesSelectedPeriod(product) {
    if (!state.selectedPeriod) return true;

    const periodInfo = getPeriodInfo(getProductionDate(product), state.selectedPeriod.period);
    return periodInfo.key === state.selectedPeriod.key;
  }

  function getProductionByPeriod(period) {
    const production = new Map();

    products.forEach((product) => {
      const date = getProductionDate(product);
      const periodInfo = getPeriodInfo(date, period);
      const current = production.get(periodInfo.key) || {
        key: periodInfo.key,
        label: periodInfo.label,
        startDate: periodInfo.startDate,
        period,
        total: 0,
        jumbo: 0,
        slit: 0,
        pass: 0,
        fail: 0,
      };

      current.total += 1;
      current.jumbo += product.type === "Jumbo Roll" ? 1 : 0;
      current.slit += product.type === "Slit Roll" ? 1 : 0;
      current.pass += product.qcStatus === "PASS" ? 1 : 0;
      current.fail += product.qcStatus === "FAIL" ? 1 : 0;
      production.set(periodInfo.key, current);
    });

    return [...production.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  function getPeriodInfo(date, period) {
    const parsedDate = parseDate(date);
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth();

    if (period === "weekly") {
      const weekStart = getWeekStart(date);
      const weekEnd = addDays(weekStart, 6);
      return {
        key: `weekly:${toDateKey(weekStart)}`,
        label: `${formatDateLabel(toDateKey(weekStart))} - ${formatDateLabel(toDateKey(weekEnd))}`,
        startDate: toDateKey(weekStart),
      };
    }

    if (period === "monthly") {
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      return {
        key: `monthly:${year}-${String(month + 1).padStart(2, "0")}`,
        label: formatMonthYear(startDate),
        startDate,
      };
    }

    if (period === "quarterly") {
      const quarter = Math.floor(month / 3) + 1;
      const startMonth = (quarter - 1) * 3 + 1;
      return {
        key: `quarterly:${year}-Q${quarter}`,
        label: `Q${quarter} ${year}`,
        startDate: `${year}-${String(startMonth).padStart(2, "0")}-01`,
      };
    }

    if (period === "semester") {
      const semester = month < 6 ? 1 : 2;
      const startMonth = semester === 1 ? "01" : "07";
      return {
        key: `semester:${year}-S${semester}`,
        label: `S${semester} ${year}`,
        startDate: `${year}-${startMonth}-01`,
      };
    }

    if (period === "yearly") {
      return {
        key: `yearly:${year}`,
        label: String(year),
        startDate: `${year}-01-01`,
      };
    }

    return {
      key: `daily:${date}`,
      label: formatDateLabel(date),
      startDate: date,
    };
  }

  function getWeekStart(date) {
    const parsedDate = parseDate(date);
    const day = parsedDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(parsedDate, diff);
  }

  function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function renderProductionChart() {
    const productionSeries = getProductionByPeriod(state.chartPeriod);
    const points = getLineChartPoints(productionSeries);
    const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const areaPath = points.length
      ? `M ${points[0].x} 188 ${points.map((point) => `L ${point.x} ${point.y}`).join(" ")} L ${points[points.length - 1].x} 188 Z`
      : "";

    return `
      <section class="chart-panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">Production Trend</p>
            <h3>Trend Produksi</h3>
          </div>
          <span class="muted">${state.selectedPeriod ? `Filter aktif: ${state.selectedPeriod.label}` : "Semua periode"}</span>
        </div>
        <div class="chart-period-toggle" aria-label="Periode grafik produksi">
          ${chartPeriods
            .map(
              (period) => `
                <button class="period-btn ${state.chartPeriod === period.key ? "active" : ""}" data-chart-period="${period.key}" type="button">
                  ${period.label}
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="production-chart">
          <svg class="line-chart" viewBox="0 0 680 260" role="img" aria-label="Trend produksi">
            <defs>
              <linearGradient id="productionArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#0f7473" stop-opacity="0.22" />
                <stop offset="100%" stop-color="#0f7473" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <path class="line-chart-grid" d="M 48 40 H 632 M 48 114 H 632 M 48 188 H 632" />
            <path class="line-chart-axis" d="M 48 188 H 632" />
            <path class="line-chart-area" d="${areaPath}" />
            <path class="line-chart-path" d="${path}" />
            ${points
              .map(
                (point) => `
                  <g
                    class="line-point ${state.selectedPeriod?.key === point.key ? "active" : ""}"
                    data-production-period="${point.period}"
                    data-production-key="${point.key}"
                    data-production-label="${point.label}"
                    tabindex="0"
                    role="button"
                    aria-label="Filter produksi periode ${point.label}"
                  >
                    <title>${point.label}: ${point.total} produk, ${point.pass} PASS, ${point.fail} FAIL</title>
                    <line class="point-guide" x1="${point.x}" y1="${point.y}" x2="${point.x}" y2="188" />
                    <circle class="point-hit" cx="${point.x}" cy="${point.y}" r="24" />
                    <circle class="point-dot" cx="${point.x}" cy="${point.y}" r="7" />
                    <text class="point-value" x="${point.x}" y="${point.y - 16}">${point.total}</text>
                    <text class="point-label" x="${point.x}" y="224">${point.label}</text>
                    <text class="point-meta" x="${point.x}" y="244">${point.pass}P / ${point.fail}F</text>
                  </g>
                `,
              )
              .join("")}
          </svg>
        </div>
      </section>
    `;
  }

  function getLineChartPoints(productionSeries) {
    const chart = {
      left: 56,
      right: 624,
      top: 40,
      bottom: 188,
    };
    const totals = productionSeries.map((item) => item.total);
    const maxTotal = Math.max(...totals, 1);
    const minTotal = Math.min(...totals, 0);
    const range = Math.max(maxTotal - minTotal, 1);
    const step = productionSeries.length > 1 ? (chart.right - chart.left) / (productionSeries.length - 1) : 0;

    return productionSeries.map((item, index) => {
      const x = productionSeries.length > 1 ? Math.round(chart.left + step * index) : Math.round((chart.left + chart.right) / 2);
      const y = Math.round(chart.bottom - ((item.total - minTotal) / range) * (chart.bottom - chart.top));

      return {
        ...item,
        x,
        y,
      };
    });
  }

  function renderProductTable(items) {
    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nomor Batch</th>
              <th>Kode Produk</th>
              <th>Nama Produk</th>
              <th>Jam Produksi</th>
              <th>Tipe</th>
              <th>Status Proses</th>
              <th>QC</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (product) => `
                  <tr class="clickable" data-product="${product.id}">
                    <td><strong>${product.batch}</strong></td>
                    <td>${product.code}</td>
                    <td>${product.name}</td>
                    <td>${product.productionTime}</td>
                    <td>${productBadge(product)}</td>
                    <td>${productFlowBadge(product)}</td>
                    <td>${qcBadge(product.qcStatus)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderProductCards(items) {
    return `
      <div class="product-grid">
        ${items
          .map(
            (product) => `
              <article class="product-card" data-product="${product.id}">
                <div class="card-head">
                  <div>
                    <p class="eyebrow">${product.batch}</p>
                    <h3>${product.name}</h3>
                  </div>
                  ${qcBadge(product.qcStatus)}
                </div>
                <div class="kv">
                  <div><span>Kode Produk</span><strong>${product.code}</strong></div>
                  <div><span>Jam Produksi</span><strong>${product.productionTime}</strong></div>
                </div>
                <div class="detail-actions">${productBadge(product)} ${productFlowBadge(product)}</div>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderDetail() {
    const product = products.find((item) => item.id === state.selectedProductId);
    if (!product) return '<div class="empty-state">Produk tidak ditemukan.</div>';
    const lastLocation = formatLastLocation(product.location);

    return `
      <section class="detail-view">
        <div class="detail-panel">
          <div class="detail-head">
            <div>
              <p class="eyebrow">${product.batch}</p>
              <h2>${product.name}</h2>
              <div class="detail-meta">
                <strong>${product.code}</strong>
                <span>Tanggal Produksi: ${product.productionTime}</span>
                <span>Posisi terakhir: ${lastLocation}</span>
              </div>
            </div>
            <div class="detail-actions">
              ${productBadge(product)}
              ${productFlowBadge(product)}
              ${qcBadge(product.qcStatus)}
              <button class="ghost-btn" id="backBtn">${icon("back")} Kembali</button>
            </div>
          </div>
        </div>
        <div class="detail-layout">
          <div class="detail-panel">
            <div class="section-title"><h3>Karakteristik Produk</h3></div>
            <div class="characteristics">
              ${Object.entries(product.characteristics)
                .map(([key, value]) => `<div class="info-box"><span>${labelize(key)}</span><strong>${value}</strong></div>`)
                .join("")}
            </div>
          </div>
          <div class="detail-panel">
            <div class="section-title"><h3>Quality Check</h3>${qcBadge(product.qcStatus)}</div>
            <div class="qc-list">
              ${product.qcDetails
                .map((qc) => {
                  const assessment = getQcAssessment(qc);

                  return `
                    <div class="qc-item" tabindex="0">
                      <div>
                        <strong>${qc.parameter}</strong>
                        <span class="muted">${qc.value}</span>
                      </div>
                      ${qcBadge(qc.result)}
                      <div class="qc-assessment" role="tooltip">
                        <strong>Penilaian</strong>
                        <span>${assessment}</span>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
          <div class="detail-panel">
            <div class="section-title"><h3>Histori Posisi Produk</h3></div>
            <div class="timeline">
              ${product.timeline
                .map((event) => {
                  const linkedProduct = event.relatedProductId
                    ? products.find((item) => item.id === event.relatedProductId)
                    : null;

                  return `
                    <div class="timeline-item">
                      <span class="timeline-dot"></span>
                      <div class="timeline-copy">
                        <strong>${event.place}</strong>
                        <span>${event.time}</span>
                        <p class="muted">${event.note}</p>
                        ${
                          linkedProduct
                            ? `
                              <div class="timeline-related">
                                <div>
                                  <span>Produk hasil slitting</span>
                                  <strong>${linkedProduct.batch} - ${linkedProduct.name}</strong>
                                </div>
                                <button class="text-btn" data-product="${linkedProduct.id}" type="button">Lihat detail</button>
                              </div>
                            `
                            : ""
                        }
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
          <div class="detail-panel">
            <div class="section-title"><h3>Material Pembentuk</h3></div>
            <div class="material-list">
              ${product.materials
                .map(
                  (material) => `
                    <div class="material-item">
                      <div>
                        <strong>${material.name}</strong>
                        <div class="muted">${material.type} - ${material.batch} - ${material.quantity}</div>
                      </div>
                      ${
                        products.some((item) => item.id === material.id)
                          ? `<button class="text-btn" data-product="${material.id}">Lihat detail</button>`
                          : `<button class="text-btn" data-material="${material.id}">Raw material</button>`
                      }
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderReport() {
    const reportItems = filteredReportProducts();
    const totalPages = Math.max(1, Math.ceil(reportItems.length / reportPageSize));
    const currentPage = Math.min(state.reportPage, totalPages);
    const pageItems = paginateItems(reportItems, currentPage, reportPageSize);

    return `
      <section class="report-view">
        <div class="report-panel">
          <div class="section-title">
            <h3>Traceability Produk</h3>
            <button class="primary-btn" id="exportBtn">Export CSV</button>
          </div>
          <div class="toolbar report-toolbar">
            <div class="filters">
              <input class="search" id="reportSearchInput" value="${state.reportQuery}" placeholder="Cari batch, kode produk, nama produk, atau lokasi" />
            </div>
          </div>
          <div class="report-list">
            ${pageItems.length
              ? pageItems
              .map(
                (product) => `
                  <div class="report-row">
                    <button class="report-item ${state.selectedReportProductId === product.id ? "active" : ""}" data-report-product="${product.id}" type="button">
                      <div>
                        <strong>${product.batch} - ${product.name}</strong>
                        <div class="muted">Tanggal Produksi: ${product.productionTime}</div>
                        <div class="muted">Posisi Terakhir: ${formatLastLocation(product.location)}</div>
                      </div>
                      <div class="detail-actions">
                        ${qcBadge(product.qcStatus)}
                      </div>
                    </button>
                    ${state.selectedReportProductId === product.id ? renderReportTraceDetail(product) : ""}
                  </div>
                `,
              )
              .join("")
              : '<div class="empty-state">Tidak ada produk yang sesuai pencarian.</div>'}
          </div>
          ${renderReportPagination(currentPage, totalPages, reportItems.length)}
        </div>
      </section>
    `;
  }

  function filteredReportProducts() {
    const q = state.reportQuery.trim().toLowerCase();

    return products
      .filter((product) =>
        [product.batch, product.code, product.name, product.type, product.location, product.materials.map((m) => m.batch).join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .sort((a, b) => b.productionTime.localeCompare(a.productionTime));
  }

  function renderReportTraceDetail(product) {
    return `
      <div class="report-inline-detail">
        <div class="section-title">
          <div>
            <p class="eyebrow">${product.batch}</p>
            <h3>${product.name}</h3>
          </div>
          <button class="primary-btn" data-product="${product.id}" type="button">Detail</button>
        </div>
        <div class="report-trace-layout">
          <div class="trace-card">
            <div class="section-title"><h3>Histori Perpindahan</h3></div>
            <div class="timeline">
              ${product.timeline
                .map(
                  (event) => `
                    <div class="timeline-item">
                      <span class="timeline-dot"></span>
                      <div class="timeline-copy">
                        <strong>${event.place}</strong>
                        <span>${event.time}</span>
                        <p class="muted">${event.note}</p>
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>
          <div class="trace-card">
            <div class="section-title"><h3>Produk Pembentuk</h3></div>
            <div class="material-list">
              ${product.materials
                .map(
                  (material) => `
                    <div class="material-item">
                      <div>
                        <strong>${material.name}</strong>
                        <div class="muted">${material.type} - ${material.batch} - ${material.quantity}</div>
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderReportPagination(currentPage, totalPages, totalItems) {
    if (totalItems <= reportPageSize) return "";

    return `
      <div class="pagination">
        <button class="ghost-btn" data-report-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} type="button">Sebelumnya</button>
        <span>Page ${currentPage} dari ${totalPages}</span>
        <button class="ghost-btn" data-report-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} type="button">Berikutnya</button>
      </div>
    `;
  }

  window.RollTraceViews = {
    filteredProducts,
    renderLogin,
    renderApp,
    renderDashboard,
    renderProductionList,
    renderProductionChart,
    renderProductTable,
    renderProductCards,
    renderDetail,
    renderReport,
  };
})(window);
