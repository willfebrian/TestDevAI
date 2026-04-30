(function registerEvents(window, document) {
  const state = window.RollTraceState;
  const views = window.RollTraceViews;
  const { auth, product } = window.RollTraceRepositories;
  const { showModal, showHtmlModal, showLoadingModal, formatLastLocation, escapeHtml, qcBadge } = window.RollTraceUi;
  const minimumLoadingDuration = 1000;
  let loadingTimer = null;

  function bindEvents({ render }) {
    document.querySelector("#loginForm")?.addEventListener("submit", (event) => handleLogin(event, render));

    document.querySelector("#logoutBtn")?.addEventListener("click", () => {
      renderWithLoading(render, () => {
        state.loggedIn = false;
        window.localStorage?.removeItem("rollTraceLoggedIn");
        window.localStorage?.removeItem("rollTraceUsername");
        window.localStorage?.removeItem("rollTraceUiState");
        state.username = "";
        state.selectedProductId = null;
        state.selectedPeriod = null;
        state.chartPeriod = "daily";
        state.chartRangeStart = "";
        state.chartRangeEnd = "";
        state.query = "";
        state.reportQuery = "";
        state.reportPage = 1;
        state.type = "All";
        state.dashboardPage = 1;
        state.productionPage = 1;
        state.selectedReportProductId = null;
        state.navigationStack = [];
      });
    });

    document.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetPage = button.dataset.page;
        const isSamePage = state.page === targetPage && !state.selectedProductId;
        if (isSamePage) return;

        renderWithLoading(render, () => {
          state.page = targetPage;
          state.selectedProductId = null;
          state.navigationStack = [];
          state.dashboardPage = 1;
          state.productionPage = 1;
          state.reportPage = 1;
          if (state.page === "production") {
            state.selectedPeriod = null;
          }
        });
      });
    });

    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.view = button.dataset.view;
        renderPreservingScroll(render);
      });
    });

    document.querySelector("#searchInput")?.addEventListener("input", (event) => {
      state.query = event.target.value;
      state.dashboardPage = 1;
      state.productionPage = 1;
      renderDashboardOnly(render);
    });

    document.querySelector("#reportSearchInput")?.addEventListener("input", (event) => {
      state.reportQuery = event.target.value;
      state.reportPage = 1;
      syncSelectedReportProduct();
      renderReportOnly(render);
    });

    document.querySelector("#typeFilter")?.addEventListener("change", (event) => {
      state.type = event.target.value;
      state.dashboardPage = 1;
      state.productionPage = 1;
      renderPreservingScroll(render);
    });

    document.querySelectorAll("[data-chart-period]").forEach((button) => {
      button.addEventListener("click", () => {
        state.chartPeriod = button.dataset.chartPeriod;
        state.selectedPeriod = null;
        state.selectedProductId = null;
        state.dashboardPage = 1;
        renderPreservingScroll(render);
      });
    });

    document.querySelector("#chartRangeForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const startInput = document.querySelector("#chartRangeStart");
      const endInput = document.querySelector("#chartRangeEnd");
      const start = startInput?.value || "";
      const end = endInput?.value || "";
      const normalizedRange = normalizeDateRange(start, end);

      state.chartRangeStart = normalizedRange.start;
      state.chartRangeEnd = normalizedRange.end;
      state.selectedPeriod = null;
      state.selectedProductId = null;
      state.dashboardPage = 1;
      renderPreservingScroll(render);
    });

    document.querySelector("#clearChartRange")?.addEventListener("click", () => {
      state.chartRangeStart = "";
      state.chartRangeEnd = "";
      state.selectedPeriod = null;
      state.dashboardPage = 1;
      renderPreservingScroll(render);
    });

    document.querySelectorAll("[data-production-key]").forEach((trigger) => {
      const selectProductionPeriod = () => {
        const period = trigger.getAttribute("data-production-period");
        const key = trigger.getAttribute("data-production-key");
        const label = trigger.getAttribute("data-production-label");
        const isSamePeriod = state.selectedPeriod?.key === key;

        state.selectedPeriod = isSamePeriod ? null : { period, key, label };
        state.selectedProductId = null;
        state.dashboardPage = 1;
        renderPreservingScroll(render);
      };

      trigger.addEventListener("click", selectProductionPeriod);
      trigger.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        selectProductionPeriod();
      });
    });

    document.querySelector("#clearPeriodFilter")?.addEventListener("click", () => {
      state.selectedPeriod = null;
      state.dashboardPage = 1;
      renderPreservingScroll(render);
    });

    document.querySelectorAll("[data-dashboard-page]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;

        renderWithLoading(render, () => {
          state.dashboardPage = Number(button.dataset.dashboardPage);
        });
      });
    });

    document.querySelectorAll("[data-report-page]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;

        renderWithLoading(render, () => {
          state.reportPage = Number(button.dataset.reportPage);
          state.selectedReportProductId = null;
        });
      });
    });

    document.querySelectorAll("[data-production-page]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;

        renderWithLoading(render, () => {
          state.productionPage = Number(button.dataset.productionPage);
        });
      });
    });

    document.querySelectorAll("[data-product]").forEach((item) => {
      item.addEventListener("click", (event) => {
        const id = event.currentTarget.dataset.product;
        if (!id) return;

        if (!canNavigateToProduct(id)) return;

        renderWithLoading(render, () => {
          navigateToProduct(id);
        });
      });
    });

    document.querySelectorAll("[data-report-product]").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.dataset.reportProduct;
        if (!id) return;

        state.selectedReportProductId = state.selectedReportProductId === id ? null : id;
        renderPreservingScroll(render);
      });
    });

    document.querySelectorAll("[data-material]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const material = event.currentTarget.dataset.material;

        showModal({
          title: "Detail Raw Material",
          message: `Detail raw material ${material} siap disambungkan ke master material/API.`,
          actionLabel: "Mengerti",
        });
      });
    });

    document.querySelectorAll("[data-qc-product]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        showFullQcModal(event.currentTarget.dataset.qcProduct);
      });
    });

    document.querySelector("#backBtn")?.addEventListener("click", () => {
      renderWithLoading(render, navigateBack);
    });

    document.querySelector("#exportBtn")?.addEventListener("click", exportCsv);
  }

  function renderWithLoading(render, updateState, options = {}) {
    if (loadingTimer) return;

    const content = document.querySelector(".content");
    const shouldPreserveScroll = options.preserveScroll !== false;
    const scrollTop = shouldPreserveScroll ? content?.scrollTop || 0 : 0;

    updateState();
    const closeLoading = showLoadingModal();

    loadingTimer = window.setTimeout(() => {
      closeLoading();
      loadingTimer = null;
      render();
      if (shouldPreserveScroll) {
        document.querySelector(".content")?.scrollTo({ top: scrollTop });
      }
    }, minimumLoadingDuration);
  }

  function renderPreservingScroll(render) {
    const content = document.querySelector(".content");
    const scrollTop = content?.scrollTop || 0;

    render();
    document.querySelector(".content")?.scrollTo({ top: scrollTop });
  }

  function normalizeDateRange(start, end) {
    if (start && end && start > end) {
      return { start: end, end: start };
    }

    return { start, end };
  }

  function getCurrentRoute() {
    return {
      page: state.page,
      selectedProductId: state.selectedProductId,
    };
  }

  function navigateToProduct(id) {
    state.navigationStack.push(getCurrentRoute());
    state.selectedProductId = id;
  }

  function canNavigateToProduct(id) {
    return state.selectedProductId !== id || state.page === "report";
  }

  function navigateBack() {
    const previousRoute = state.navigationStack.pop();

    if (!previousRoute) {
      state.selectedProductId = null;
      state.page = "dashboard";
      return;
    }

    state.page = previousRoute.page;
    state.selectedProductId = previousRoute.selectedProductId;
  }

  function renderDashboardOnly(render) {
    const content = document.querySelector(".content");

    if (!content || state.page !== "dashboard" || state.selectedProductId) {
      renderPreservingScroll(render);
      return;
    }

    const scrollTop = content.scrollTop;
    content.innerHTML = views.renderDashboard();
    bindEvents({ render });
    content.scrollTo({ top: scrollTop });

    const input = document.querySelector("#searchInput");
    input?.focus();
    input?.setSelectionRange(state.query.length, state.query.length);
  }

  function renderReportOnly(render) {
    const content = document.querySelector(".content");

    if (!content || state.page !== "report" || state.selectedProductId) {
      renderPreservingScroll(render);
      return;
    }

    const scrollTop = content.scrollTop;
    content.innerHTML = views.renderReport();
    bindEvents({ render });
    content.scrollTo({ top: scrollTop });

    const input = document.querySelector("#reportSearchInput");
    input?.focus();
    input?.setSelectionRange(state.reportQuery.length, state.reportQuery.length);
  }

  function syncSelectedReportProduct() {
    if (!state.selectedReportProductId) return;

    const query = state.reportQuery.trim().toLowerCase();
    const selectedProduct = product.findById(state.selectedReportProductId);
    const matchesSearch = selectedProduct
      ? [selectedProduct.batch, selectedProduct.code, selectedProduct.name, selectedProduct.type, selectedProduct.location, selectedProduct.materials.map((m) => m.batch).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query)
      : false;

    if (!matchesSearch) {
      state.selectedReportProductId = null;
    }
  }

  async function handleLogin(event, render) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    const usernameError = document.querySelector("#usernameError");
    const passwordError = document.querySelector("#passwordError");

    usernameError.textContent = "";
    passwordError.textContent = "";

    let valid = true;

    if (!username) {
      usernameError.textContent = "Username wajib diisi.";
      valid = false;
    }

    if (!password) {
      passwordError.textContent = "Password wajib diisi.";
      valid = false;
    } else if (password.length < 8) {
      passwordError.textContent = "Password minimal 8 karakter.";
      valid = false;
    }

    if (!valid) return;

    const loginResult = await auth.login(username, password);

    if (!loginResult) {
      passwordError.textContent = "Username atau password tidak sesuai.";
      return;
    }

    renderWithLoading(render, () => {
      state.loggedIn = true;
      state.username = loginResult.username || username;
      window.localStorage?.setItem("rollTraceLoggedIn", "true");
      window.localStorage?.setItem("rollTraceUsername", state.username);
      state.selectedReportProductId = null;
    });
  }

  function exportCsv() {
    const header = ["Batch No.", "Product Code", "Product Name", "Product Type", "Production Time", "QC Result", "Current Location", "Material Source"];
    const rows = product.getProducts().map((product) => [
      product.batch,
      product.code,
      product.name,
      product.type,
      product.productionTime,
      product.qcStatus,
      formatLastLocation(product.location),
      product.materials.map((material) => `${material.batch} ${material.name}`).join("; "),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "traceability-report.csv";
    link.click();
    URL.revokeObjectURL(url);

    showModal({
      title: "Export Berhasil",
      message: "Traceability Report has been generated in CSV format.",
      actionLabel: "Close",
    });
  }

  function showFullQcModal(productId) {
    const selectedProduct = product.findById(productId);
    if (!selectedProduct) return;

    const passCount = selectedProduct.qcDetails.filter((qc) => qc.result === "PASS").length;
    const failCount = selectedProduct.qcDetails.filter((qc) => qc.result === "FAIL").length;
    const content = `
      <div class="qc-modal-subtitle">
        <strong>${escapeHtml(selectedProduct.name)}</strong>
        <span>Batch No. ${escapeHtml(selectedProduct.batch)} | ${escapeHtml(selectedProduct.code)}</span>
      </div>
      <div class="qc-summary-strip">
        <div><span>Checked Items</span><strong>${selectedProduct.qcDetails.length}</strong></div>
        <div><span>PASS</span><strong>${passCount}</strong></div>
        <div><span>FAIL</span><strong>${failCount}</strong></div>
        <div class="qc-result-summary"><span>QC Result</span><strong class="qc-result-text ${selectedProduct.qcStatus.toLowerCase()}">${escapeHtml(selectedProduct.qcStatus)}</strong></div>
      </div>
      <div class="qc-modal-grid">
        ${selectedProduct.qcDetails.map(renderQcModalItem).join("")}
      </div>
    `;

    showHtmlModal({
      title: "QC Inspection Detail",
      content,
      actionLabel: "Close",
      size: "wide-modal",
      eyebrow: "QC Inspection",
    });
  }

  function renderQcModalItem(qc) {
    const isFail = qc.result === "FAIL";
    const assessment = isFail
      ? qc.reason || "QC item does not meet acceptance criteria."
      : qc.assessment || "QC item is within acceptance criteria.";

    return `
      <article class="qc-modal-item ${isFail ? "fail" : "pass"}">
        <div class="qc-modal-item-head">
          <strong>${escapeHtml(qc.parameter)}</strong>
          ${qcBadge(qc.result)}
        </div>
        <dl class="qc-modal-detail">
          <div><dt>Actual</dt><dd>${escapeHtml(qc.value)}</dd></div>
          <div><dt>Standard</dt><dd>${escapeHtml(qc.standard || "-")}</dd></div>
          <div><dt>Method</dt><dd>${escapeHtml(qc.method || "-")}</dd></div>
          <div><dt>Sample Point</dt><dd>${escapeHtml(qc.samplePoint || "-")}</dd></div>
          <div class="wide"><dt>${isFail ? "Reason" : "Assessment"}</dt><dd>${escapeHtml(assessment)}</dd></div>
          ${isFail && qc.action ? `<div class="wide"><dt>Action</dt><dd>${escapeHtml(qc.action)}</dd></div>` : ""}
        </dl>
      </article>
    `;
  }

  window.RollTraceEvents = {
    bindEvents,
  };
})(window, document);
