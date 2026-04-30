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
    const users = Array.isArray(credentials) ? credentials : [credentials];
    const matchedUser = users.find((user) => user.username === username && user.password === password);

    return matchedUser
      ? { username: matchedUser.username, name: matchedUser.name || matchedUser.username }
      : null;
  }

  window.RollTraceRepositories = {
    ...(window.RollTraceRepositories || {}),
    auth: {
      login,
    },
  };
})(window);
