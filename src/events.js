(function registerEvents(window, document) {
  const { credentials, products } = window.RollTraceData;
  const state = window.RollTraceState;
  const views = window.RollTraceViews;
  const { showModal, showLoadingModal, formatLastLocation } = window.RollTraceUi;
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
        state.query = "";
        state.reportQuery = "";
        state.reportPage = 1;
        state.type = "All";
        state.dashboardPage = 1;
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
        render();
      });
    });

    document.querySelector("#searchInput")?.addEventListener("input", (event) => {
      state.query = event.target.value;
      state.dashboardPage = 1;
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
      render();
    });

    document.querySelectorAll("[data-chart-period]").forEach((button) => {
      button.addEventListener("click", () => {
        state.chartPeriod = button.dataset.chartPeriod;
        state.selectedPeriod = null;
        state.selectedProductId = null;
        state.dashboardPage = 1;
        render();
      });
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
        render();
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
      render();
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
        render();
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

    document.querySelector("#backBtn")?.addEventListener("click", () => {
      renderWithLoading(render, navigateBack);
    });

    document.querySelector("#exportBtn")?.addEventListener("click", exportCsv);
  }

  function renderWithLoading(render, updateState) {
    if (loadingTimer) return;

    updateState();
    const closeLoading = showLoadingModal();

    loadingTimer = window.setTimeout(() => {
      closeLoading();
      loadingTimer = null;
      render();
    }, minimumLoadingDuration);
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
      render();
      return;
    }

    content.innerHTML = views.renderDashboard();
    bindEvents({ render });

    const input = document.querySelector("#searchInput");
    input?.focus();
    input?.setSelectionRange(state.query.length, state.query.length);
  }

  function renderReportOnly(render) {
    const content = document.querySelector(".content");

    if (!content || state.page !== "report" || state.selectedProductId) {
      render();
      return;
    }

    content.innerHTML = views.renderReport();
    bindEvents({ render });

    const input = document.querySelector("#reportSearchInput");
    input?.focus();
    input?.setSelectionRange(state.reportQuery.length, state.reportQuery.length);
  }

  function syncSelectedReportProduct() {
    if (!state.selectedReportProductId) return;

    const query = state.reportQuery.trim().toLowerCase();
    const selectedProduct = products.find((product) => product.id === state.selectedReportProductId);
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

  function handleLogin(event, render) {
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

    if (username !== credentials.username || password !== credentials.password) {
      passwordError.textContent = "Username atau password tidak sesuai.";
      return;
    }

    renderWithLoading(render, () => {
      state.loggedIn = true;
      state.username = username;
      window.localStorage?.setItem("rollTraceLoggedIn", "true");
      window.localStorage?.setItem("rollTraceUsername", username);
      state.selectedReportProductId = null;
    });
  }

  function exportCsv() {
    const header = ["Batch", "Kode Produk", "Nama Produk", "Tipe", "Jam Produksi", "QC", "Posisi Terakhir", "Material"];
    const rows = products.map((product) => [
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
      message: "Traceability report sudah dibuat dalam format CSV.",
      actionLabel: "Tutup",
    });
  }

  window.RollTraceEvents = {
    bindEvents,
  };
})(window, document);
