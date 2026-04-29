(function registerAuthRepository(window) {
  const config = window.RollTraceConfig;
  const dataSources = window.RollTraceDataSources;

  function getActiveSource() {
    return dataSources[config.dataSource] || dataSources.mock;
  }

  function login(username, password) {
    const source = getActiveSource();

    if (source.login) {
      return source.login(username, password);
    }

    const credentials = source.getCredentials();
    return username === credentials.username && password === credentials.password
      ? { username }
      : null;
  }

  window.RollTraceRepositories = {
    ...(window.RollTraceRepositories || {}),
    auth: {
      login,
    },
  };
})(window);
