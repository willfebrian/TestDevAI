(function registerMockDataSource(window) {
  const mockData = window.RollTraceMockData;

  function getProducts() {
    return mockData.products;
  }

  function getCredentials() {
    return mockData.credentials;
  }

  window.RollTraceDataSources = {
    ...(window.RollTraceDataSources || {}),
    mock: {
      getProducts,
      getCredentials,
    },
  };
})(window);
