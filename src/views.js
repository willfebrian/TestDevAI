(function registerViews(window) {
  const state = window.RollTraceState;
  const productRepository = window.RollTraceRepositories.product;
  const { icon, productBadge, qcBadge, getProductStage, productFlowBadge, labelize, getProductionDate, parseDate, formatDateLabel, formatMonthYear, formatLastLocation } = window.RollTraceUi;

  const dashboardPageSize = 5;
  const productionPageSize = 10;
  const reportPageSize = 10;

  const chartPeriods = [
    { key: "daily", label: "Harian" },
    { key: "weekly", label: "Mingguan" },
    { key: "monthly", label: "Bulanan" },
    { key: "quarterly", label: "Kuartal" },
    { key: "semester", label: "Semester" },
    { key: "yearly", label: "Tahunan" },
  ];

  function getProducts() {
    return productRepository.getProducts();
  }

  function filteredProducts({ includeSelectedPeriod = true } = {}) {
    const q = state.query.trim().toLowerCase();

    return getProducts().filter((product) => {
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
          <p>Production output, QC result, material source, and current location visibility for manufacturing review.</p>
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
            <h2>Access production monitoring</h2>
            <p class="helper">Use an authorized account to review production output, QC result, and roll traceability.</p>
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
            <p class="demo-note">Demo login: <strong>admin</strong> / <strong>admin123</strong> atau user demo lain di README.</p>
          </form>
        </div>
      </section>
    `;
  }

  function renderApp() {
    const pageTitle = state.selectedProductId
      ? "Product Detail"
      : state.page === "report"
        ? "Traceability Report"
        : state.page === "production"
          ? "Production Output List"
          : "Production Dashboard";
    const subtitle = state.selectedProductId
      ? "Product characteristics, QC result, material source, and movement visibility."
      : state.page === "report"
        ? "Movement history, material source, and QC result for cross-functional review."
        : state.page === "production"
          ? "Production output list for Jumbo Roll and Slit Roll."
          : "Production summary and latest output per page.";

    return `
      <section class="app-shell">
        <aside class="sidebar">
          <button class="brand-row brand-home" data-page="dashboard" type="button" title="Go to Production Dashboard">
            <div class="brand-mark">PIC</div>
            <div>
              <strong>Product Intelligence Center</strong><br />
              <small>${state.username || "admin"}</small>
            </div>
          </button>
          <nav class="nav-stack">
            <button class="nav-btn ${state.page === "production" ? "active" : ""}" data-page="production">${icon("list")} Production Output List</button>
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
    const products = getProducts();
    const scopedProducts = state.selectedPeriod
      ? products.filter((product) => productMatchesSelectedPeriod(product))
      : products;
    const pass = scopedProducts.filter((product) => product.qcStatus === "PASS").length;
    const fail = scopedProducts.filter((product) => product.qcStatus === "FAIL").length;

    return `
      <section>
        <div class="metrics">
          <div class="metric"><span>Total Output</span><strong>${scopedProducts.length}</strong></div>
          <div class="metric"><span>Jumbo Roll</span><strong>${scopedProducts.filter((p) => p.type === "Jumbo Roll").length}</strong></div>
          <div class="metric"><span>QC PASS</span><strong>${pass}</strong></div>
          <div class="metric"><span>QC FAIL</span><strong>${fail}</strong></div>
        </div>
        ${renderProductionChart()}
        <div class="toolbar">
          <div class="filters">
            <input class="search" id="searchInput" value="${state.query}" placeholder="Search batch, product code, or product name" />
            <select class="select" id="typeFilter">
              <option value="All" ${state.type === "All" ? "selected" : ""}>All product types</option>
              <option value="Jumbo Roll" ${state.type === "Jumbo Roll" ? "selected" : ""}>Jumbo Roll</option>
              <option value="Slit Roll" ${state.type === "Slit Roll" ? "selected" : ""}>Slit Roll</option>
            </select>
            ${
              state.selectedPeriod
                ? `<button class="date-filter-chip" id="clearPeriodFilter" type="button">${state.selectedPeriod.label} <span>Clear</span></button>`
                : ""
            }
          </div>
          <div class="view-toggle" aria-label="Change view">
            <button class="icon-btn ${state.view === "list" ? "active" : ""}" data-view="list" title="List view">${icon("list")}</button>
            <button class="icon-btn ${state.view === "card" ? "active" : ""}" data-view="card" title="Card view">${icon("grid")}</button>
          </div>
        </div>
        ${items.length ? (state.view === "list" ? renderProductTable(items) : renderProductCards(items)) : '<div class="empty-state">No product matches the active filter.</div>'}
        ${renderPagination(currentPage, totalPages, orderedItems.length)}
      </section>
    `;
  }

  function renderProductionList() {
    const orderedItems = filteredProducts({ includeSelectedPeriod: false }).sort((a, b) => b.productionTime.localeCompare(a.productionTime));
    const totalPages = Math.max(1, Math.ceil(orderedItems.length / productionPageSize));
    const currentPage = Math.min(state.productionPage, totalPages);
    const items = paginateItems(orderedItems, currentPage, productionPageSize);

    return `
      <section>
        <div class="toolbar">
          <div class="filters">
            <input class="search" id="searchInput" value="${state.query}" placeholder="Search batch, product code, or product name" />
            <select class="select" id="typeFilter">
              <option value="All" ${state.type === "All" ? "selected" : ""}>All product types</option>
              <option value="Jumbo Roll" ${state.type === "Jumbo Roll" ? "selected" : ""}>Jumbo Roll</option>
              <option value="Slit Roll" ${state.type === "Slit Roll" ? "selected" : ""}>Slit Roll</option>
            </select>
          </div>
          <div class="view-toggle" aria-label="Change view">
            <button class="icon-btn ${state.view === "list" ? "active" : ""}" data-view="list" title="List view">${icon("list")}</button>
            <button class="icon-btn ${state.view === "card" ? "active" : ""}" data-view="card" title="Card view">${icon("grid")}</button>
          </div>
        </div>
        ${items.length ? (state.view === "list" ? renderProductTable(items) : renderProductCards(items)) : '<div class="empty-state">No product matches the active filter.</div>'}
        ${renderProductionPagination(currentPage, totalPages, orderedItems.length)}
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
        <button class="ghost-btn" data-dashboard-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} type="button">Previous</button>
        <span>Page ${currentPage} dari ${totalPages}</span>
        <button class="ghost-btn" data-dashboard-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} type="button">Next</button>
      </div>
    `;
  }

  function renderProductionPagination(currentPage, totalPages, totalItems) {
    if (totalItems <= productionPageSize) return "";

    return `
      <div class="pagination">
        <button class="ghost-btn" data-production-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} type="button">Previous</button>
        <span>Page ${currentPage} dari ${totalPages}</span>
        <button class="ghost-btn" data-production-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} type="button">Next</button>
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

    getProducts().filter(productMatchesChartRange).forEach((product) => {
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
      const startDate = toDateKey(weekStart);
      const endDate = toDateKey(weekEnd);
      return {
        key: `weekly:${startDate}`,
        label: `W${String(getIsoWeekNumber(weekStart)).padStart(2, "0")} ${formatMonthYear(startDate)}`,
        detailLabel: `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`,
        startDate,
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

  function getIsoWeekNumber(date) {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
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

  function productMatchesChartRange(product) {
    const date = getProductionDate(product);
    const start = state.chartRangeStart;
    const end = state.chartRangeEnd;

    return (!start || date >= start) && (!end || date <= end);
  }

  function getChartRangeLabel() {
    const start = state.chartRangeStart;
    const end = state.chartRangeEnd;

    if (start && end) return `${formatDateLabel(start)} - ${formatDateLabel(end)}`;
    if (start) return `From ${formatDateLabel(start)}`;
    if (end) return `Until ${formatDateLabel(end)}`;
    return "";
  }

  function renderProductionChart() {
    const productionSeries = getProductionByPeriod(state.chartPeriod);
    const chartWidth = getChartWidth(productionSeries.length);
    const points = getLineChartPoints(productionSeries, chartWidth);
    const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const areaPath = points.length
      ? `M ${points[0].x} 188 ${points.map((point) => `L ${point.x} ${point.y}`).join(" ")} L ${points[points.length - 1].x} 188 Z`
      : "";

    return `
      <section class="chart-panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">Production Trend</p>
            <h3>Production Trend</h3>
          </div>
          <span class="muted">${state.selectedPeriod ? `Filter aktif: ${state.selectedPeriod.label}` : getChartRangeLabel() || "Semua periode"}</span>
        </div>
        <div class="chart-period-toggle" aria-label="Production chart period">
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
        <form class="chart-range-form" id="chartRangeForm">
          <label>
            <span>Start Date</span>
            <input type="date" id="chartRangeStart" value="${state.chartRangeStart}" />
          </label>
          <label>
            <span>End Date</span>
            <input type="date" id="chartRangeEnd" value="${state.chartRangeEnd}" />
          </label>
          <button class="ghost-btn" type="submit">Apply</button>
          ${(state.chartRangeStart || state.chartRangeEnd) ? '<button class="text-btn" id="clearChartRange" type="button">Reset</button>' : ""}
        </form>
        <div class="production-chart">
          ${
            productionSeries.length
              ? `<svg class="line-chart" style="min-width: ${chartWidth}px" viewBox="0 0 ${chartWidth} 260" role="img" aria-label="Production trend">
            <defs>
              <linearGradient id="productionArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#0f7473" stop-opacity="0.22" />
                <stop offset="100%" stop-color="#0f7473" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <path class="line-chart-grid" d="M 48 40 H ${chartWidth - 48} M 48 114 H ${chartWidth - 48} M 48 188 H ${chartWidth - 48}" />
            <path class="line-chart-axis" d="M 48 188 H ${chartWidth - 48}" />
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
                    aria-label="Filter production period ${point.label}"
                  >
                    <title>${point.detailLabel || point.label}: ${point.total} products, ${point.pass} PASS, ${point.fail} FAIL</title>
                    <line class="point-guide" x1="${point.x}" y1="${point.y}" x2="${point.x}" y2="188" />
                    <circle class="point-hit" cx="${point.x}" cy="${point.y}" r="24" />
                    <circle class="point-dot" cx="${point.x}" cy="${point.y}" r="7" />
                    <text class="point-value" x="${point.x}" y="${point.y - 16}">${point.total}</text>
                    ${
                      point.showLabel
                        ? `
                          <text class="point-label" x="${point.x}" y="224">${point.displayLabel}</text>
                          <text class="point-meta" x="${point.x}" y="244">${point.pass}P / ${point.fail}F</text>
                        `
                        : ""
                    }
                  </g>
                `,
              )
              .join("")}
          </svg>`
              : '<div class="empty-state">No production data matches the selected date range.</div>'
          }
        </div>
      </section>
    `;
  }

  function getChartWidth(pointCount) {
    return Math.max(680, pointCount * 58 + 120);
  }

  function getChartLabelInterval(pointCount) {
    if (pointCount <= 10) return 1;
    if (pointCount <= 18) return 2;
    return Math.ceil(pointCount / 9);
  }

  function getDisplayLabel(item) {
    return item.label;
  }

  function getLineChartPoints(productionSeries, chartWidth) {
    const chart = {
      left: 56,
      right: chartWidth - 56,
      top: 40,
      bottom: 188,
    };
    const totals = productionSeries.map((item) => item.total);
    const maxTotal = Math.max(...totals, 1);
    const minTotal = Math.min(...totals, 0);
    const range = Math.max(maxTotal - minTotal, 1);
    const step = productionSeries.length > 1 ? (chart.right - chart.left) / (productionSeries.length - 1) : 0;
    const labelInterval = getChartLabelInterval(productionSeries.length);

    return productionSeries.map((item, index) => {
      const x = productionSeries.length > 1 ? Math.round(chart.left + step * index) : Math.round((chart.left + chart.right) / 2);
      const y = Math.round(chart.bottom - ((item.total - minTotal) / range) * (chart.bottom - chart.top));
      const showLabel = index % labelInterval === 0 || index === productionSeries.length - 1;

      return {
        ...item,
        displayLabel: getDisplayLabel(item),
        showLabel,
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
              <th>Batch No.</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Production Time</th>
              <th>Product Type</th>
              <th>Product Stage</th>
              <th>QC Result</th>
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
                  <div><span>Product Code</span><strong>${product.code}</strong></div>
                  <div><span>Production Time</span><strong>${product.productionTime}</strong></div>
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
    const product = productRepository.findById(state.selectedProductId);
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
                <span>Production Date: ${product.productionTime}</span>
                <span>Current Location: ${lastLocation}</span>
              </div>
            </div>
            <div class="detail-actions">
              ${productBadge(product)}
              ${productFlowBadge(product)}
              ${qcBadge(product.qcStatus)}
              <button class="ghost-btn" id="backBtn">${icon("back")} Back</button>
            </div>
          </div>
        </div>
        <div class="detail-layout">
          <div class="detail-panel">
            <div class="section-title"><h3>Product Characteristics</h3></div>
            <div class="characteristics">
              ${Object.entries(product.characteristics)
                .map(([key, value]) => `<div class="info-box"><span>${labelize(key)}</span><strong>${value}</strong></div>`)
                .join("")}
            </div>
          </div>
          <div class="detail-panel">
            <div class="section-title">
              <h3>QC Detail</h3>
              <div class="detail-actions">
                ${qcBadge(product.qcStatus)}
                <button class="text-btn compact-btn" data-qc-product="${product.id}" type="button">View Full QC</button>
              </div>
            </div>
            <div class="qc-list">
              ${product.qcDetails
                .slice(0, 3)
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
                        <strong>Assessment</strong>
                        <span>${assessment}</span>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
          <div class="detail-panel">
            <div class="section-title"><h3>Movement History</h3></div>
            <div class="timeline">
              ${product.timeline
                .map((event) => {
                  const linkedProduct = event.relatedProductId
                    ? productRepository.findById(event.relatedProductId)
                    : null;

                  return `
                    <div class="timeline-item">
                      <span class="timeline-dot"></span>
                      <div class="timeline-copy">
                        <strong>${event.place}</strong>
                        <span>${event.time}</span>
                        <p class="muted">${event.note}</p>
                        ${renderTimelineSourceDetails(event)}
                        ${
                          linkedProduct
                            ? `
                              <div class="timeline-related">
                                <div>
                                  <span>${event.relatedProductType || "Slitting Output"}</span>
                                  <strong>${linkedProduct.batch} - ${linkedProduct.name}</strong>
                                </div>
                                <button class="text-btn" data-product="${linkedProduct.id}" type="button">View Detail</button>
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
            <div class="section-title"><h3>Material Source</h3></div>
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
                        productRepository.exists(material.id)
                          ? `<button class="text-btn" data-product="${material.id}">View Detail</button>`
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
            <h3>Traceability Report</h3>
            <button class="primary-btn" id="exportBtn">Export CSV</button>
          </div>
          <div class="toolbar report-toolbar">
            <div class="filters">
              <input class="search" id="reportSearchInput" value="${state.reportQuery}" placeholder="Search batch, product code, product name, or location" />
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
                        <div class="muted">Production Date: ${product.productionTime}</div>
                        <div class="muted">Current Location: ${formatLastLocation(product.location)}</div>
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
              : '<div class="empty-state">No product matches the search criteria.</div>'}
          </div>
          ${renderReportPagination(currentPage, totalPages, reportItems.length)}
        </div>
      </section>
    `;
  }

  function filteredReportProducts() {
    const q = state.reportQuery.trim().toLowerCase();

    return getProducts()
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
            <div class="section-title"><h3>Movement History</h3></div>
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
                        ${renderTimelineSourceDetails(event)}
                        ${renderTimelineRelatedProduct(event)}
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>
          <div class="trace-card">
            <div class="section-title"><h3>Material Source</h3></div>
            ${renderMaterialSourceTree(product)}
          </div>
        </div>
      </div>
    `;
  }

  function renderMaterialSourceTree(product) {
    return `
      <div class="material-tree">
        ${renderMaterialSourceNode(
          {
            id: product.id,
            type: product.type,
            name: product.name,
            batch: product.batch,
            quantity: "Trace target",
            product,
          },
          new Set(),
        )}
      </div>
    `;
  }

  function renderMaterialSourceNode(source, visited) {
    const sourceProduct = source.product || productRepository.findById(source.id);
    const isRawMaterial = !sourceProduct;
    const nextVisited = new Set(visited);

    if (sourceProduct) {
      nextVisited.add(sourceProduct.id);
    }

    const children = sourceProduct
      ? sourceProduct.materials.filter((material) => !nextVisited.has(material.id))
      : [];

    const nodeContent = `
      <div class="material-tree-line">
        <div>
          <strong>${source.batch} - ${source.name}</strong>
          <div class="muted">${getMaterialStageLabel(source, sourceProduct)} - ${source.quantity}</div>
        </div>
        ${
          isRawMaterial
            ? `<button class="text-btn" data-material="${source.id}" type="button">Source Detail</button>`
            : `<button class="text-btn" data-product="${sourceProduct.id}" type="button">Detail</button>`
        }
      </div>
    `;

    if (!children.length) {
      return `<div class="material-tree-node ${isRawMaterial ? "raw-source" : "product-source"}">${nodeContent}</div>`;
    }

    return `
      <details class="material-tree-node ${isRawMaterial ? "raw-source" : "product-source"}" open>
        <summary>${nodeContent}</summary>
        <div class="material-tree-children">
          ${children.map((material) => renderMaterialSourceNode(material, nextVisited)).join("")}
        </div>
      </details>
    `;
  }

  function renderReportPagination(currentPage, totalPages, totalItems) {
    if (totalItems <= reportPageSize) return "";

    return `
      <div class="pagination">
        <button class="ghost-btn" data-report-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} type="button">Previous</button>
        <span>Page ${currentPage} dari ${totalPages}</span>
        <button class="ghost-btn" data-report-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} type="button">Next</button>
      </div>
    `;
  }

  function getMaterialStageLabel(source, sourceProduct) {
    if (!sourceProduct || source.type === "Raw Material") return "Raw Material";

    return getProductStage(sourceProduct).label;
  }

  function renderTimelineSourceDetails(event) {
    if (!event.sourceDetails?.length) return "";

    return `
      <ul class="timeline-source-list">
        ${event.sourceDetails
          .map(
            (source) => `
              <li>
                <strong>${source.label}</strong>
                <span>${source.batch} - ${source.name}</span>
                ${source.quantity ? `<small>${source.quantity}</small>` : ""}
                ${source.originLocation ? `<small>From: ${source.originLocation}</small>` : ""}
                ${source.joinLocation ? `<small>Join Location: ${source.joinLocation}</small>` : ""}
              </li>
            `,
          )
          .join("")}
      </ul>
    `;
  }

  function renderTimelineRelatedProduct(event) {
    const linkedProduct = event.relatedProductId
      ? productRepository.findById(event.relatedProductId)
      : null;

    if (!linkedProduct) return "";

    return `
      <div class="timeline-related">
        <div>
          <span>${event.relatedProductType || "Related Product"}</span>
          <strong>${linkedProduct.batch} - ${linkedProduct.name}</strong>
        </div>
        <button class="text-btn" data-product="${linkedProduct.id}" type="button">View Detail</button>
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
