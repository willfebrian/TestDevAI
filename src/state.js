(function registerState(window) {
  const storedLogin = window.localStorage?.getItem("rollTraceLoggedIn") === "true";
  const storedUsername = window.localStorage?.getItem("rollTraceUsername") || "";
  const storedState = readStoredState(window);

  window.RollTraceState = {
    loggedIn: storedLogin,
    username: storedUsername,
    page: storedState.page || "dashboard",
    view: storedState.view || "list",
    query: storedState.query || "",
    reportQuery: storedState.reportQuery || "",
    reportPage: storedState.reportPage || 1,
    type: storedState.type || "All",
    chartPeriod: storedState.chartPeriod || "daily",
    selectedPeriod: storedState.selectedPeriod || null,
    dashboardPage: storedState.dashboardPage || 1,
    selectedReportProductId: storedState.selectedReportProductId || null,
    selectedProductId: storedState.selectedProductId || null,
    navigationStack: [],
  };

  function readStoredState(window) {
    try {
      return JSON.parse(window.localStorage?.getItem("rollTraceUiState") || "{}");
    } catch {
      return {};
    }
  }
})(window);
