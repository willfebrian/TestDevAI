(function registerUi(window) {
  function icon(name) {
    const icons = {
      list: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      report: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3h9l3 3v15H6zM14 3v4h4M9 13h6M9 17h6M9 9h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5m6-7-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };

    return icons[name] || "";
  }

  function productBadge(product) {
    const typeClass = product.type === "Jumbo Roll" ? "jumbo" : "slit";
    return `<span class="pill ${typeClass}">${product.type}</span>`;
  }

  function qcBadge(status) {
    return `<span class="pill ${status.toLowerCase()}">${status}</span>`;
  }

  function getProductFlow(product) {
    const suffix = product.code.slice(-1).toUpperCase();

    return suffix === "I"
      ? { label: "Input Slitting", className: "input" }
      : { label: "Produk Final", className: "final" };
  }

  function productFlowBadge(product) {
    const flow = getProductFlow(product);
    return `<span class="pill ${flow.className}">${flow.label}</span>`;
  }

  function labelize(value) {
    const labels = {
      width: "Lebar",
      length: "Panjang",
      thickness: "Ketebalan",
      weight: "Berat",
      core: "Core",
      line: "Line Produksi",
    };

    return labels[value] || value;
  }

  function getProductionDate(product) {
    return product.productionTime.slice(0, 10);
  }

  function parseDate(date) {
    return new Date(`${date}T00:00:00`);
  }

  function formatDateLabel(date) {
    return parseDate(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  }

  function formatMonthYear(date) {
    return parseDate(date).toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
  }

  function formatLastLocation(location) {
    return String(location).replace(/^Terpakai untuk Slitting -\s*/i, "");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showModal({ title, message, actionLabel = "Tutup" }) {
    const document = window.document;
    const existingDialog = document.querySelector("#appModal");

    existingDialog?.remove();

    const dialog = document.createElement("dialog");
    dialog.id = "appModal";
    dialog.className = "modal-dialog";
    dialog.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <span class="modal-icon">i</span>
          <div>
            <p class="eyebrow">Notification</p>
            <h3>${escapeHtml(title)}</h3>
          </div>
        </div>
        <p class="modal-message">${escapeHtml(message)}</p>
        <div class="modal-actions">
          <button class="primary-btn" type="button" data-modal-close>${escapeHtml(actionLabel)}</button>
        </div>
      </div>
    `;

    document.body.append(dialog);

    const closeDialog = () => {
      if (typeof dialog.close === "function") {
        dialog.close();
      }
      dialog.remove();
    };

    dialog.querySelector("[data-modal-close]").addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", closeDialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function showLoadingModal(message = "Memuat halaman...") {
    const document = window.document;
    const existingDialog = document.querySelector("#loadingModal");
    const existingAppDialog = document.querySelector("#appModal");

    existingDialog?.remove();
    existingAppDialog?.remove();

    const dialog = document.createElement("dialog");
    dialog.id = "loadingModal";
    dialog.className = "loading-dialog";
    dialog.innerHTML = `
      <div class="loading-card">
        <span class="loading-spinner" aria-hidden="true"></span>
        <div>
          <p class="eyebrow">Loading</p>
          <h3>${escapeHtml(message)}</h3>
        </div>
      </div>
    `;

    document.body.append(dialog);

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    return () => {
      if (typeof dialog.close === "function") {
        dialog.close();
      }
      dialog.remove();
    };
  }

  window.RollTraceUi = {
    icon,
    productBadge,
    qcBadge,
    getProductFlow,
    productFlowBadge,
    labelize,
    getProductionDate,
    parseDate,
    formatDateLabel,
    formatMonthYear,
    formatLastLocation,
    showModal,
    showLoadingModal,
  };
})(window);
