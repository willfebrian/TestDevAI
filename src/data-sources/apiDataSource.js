(function registerApiDataSource(window) {
  const { apiBaseUrl } = window.RollTraceConfig;

  async function requestJson(path, options = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || "Request ke server gagal.");
    }

    return response.json();
  }

  async function getProducts() {
    return requestJson("/products");
  }

  async function login(username, password) {
    return requestJson("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  window.RollTraceDataSources = {
    ...(window.RollTraceDataSources || {}),
    api: {
      getProducts,
      login,
    },
  };
})(window);
