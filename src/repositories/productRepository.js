(function registerProductRepository(window) {
  const config = window.RollTraceConfig;
  const dataSources = window.RollTraceDataSources;

  function getActiveSource() {
    return dataSources[config.dataSource] || dataSources.mock;
  }

  function getProducts() {
    return getActiveSource().getProducts();
  }

  function findById(id) {
    return getProducts().find((product) => product.id === id);
  }

  function exists(id) {
    return Boolean(findById(id));
  }

  window.RollTraceRepositories = {
    ...(window.RollTraceRepositories || {}),
    product: {
      getProducts,
      findById,
      exists,
    },
  };
})(window);
