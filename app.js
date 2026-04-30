(function bootstrap(window, document) {
  const app = document.querySelector("#app");
  const state = window.RollTraceState;
  const views = window.RollTraceViews;
  const events = window.RollTraceEvents;

  function render() {
    persistUiState();
    app.innerHTML = state.loggedIn ? views.renderApp() : views.renderLogin();
    events.bindEvents({ render });
  }

  function persistUiState() {
    if (!state.loggedIn) return;

    window.localStorage?.setItem(
      "rollTraceUiState",
      JSON.stringify({
        page: state.page,
        view: state.view,
        query: state.query,
        reportQuery: state.reportQuery,
        reportPage: state.reportPage,
        type: state.type,
        username: state.username,
        chartPeriod: state.chartPeriod,
        chartRangeStart: state.chartRangeStart,
        chartRangeEnd: state.chartRangeEnd,
        selectedPeriod: state.selectedPeriod,
        dashboardPage: state.dashboardPage,
        productionPage: state.productionPage,
        selectedReportProductId: state.selectedReportProductId,
        selectedProductId: state.selectedProductId,
      }),
    );
  }

  window.RollTraceApp = { render };

  render();
})(window, document);
