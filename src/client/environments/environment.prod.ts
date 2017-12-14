export const environment = {
  production: true,
  api: '/api/',
  auth0: {
    clientID: 'Yk395LuPS8jWPp7e9fQ1PqC72h35UBmu',
    domain: 'jetti-app.auth0.com',
    responseType: 'token id_token',
    audience: 'https://jetti-app.com/api',
    redirectUri: 'https://jetti-project.appspot.com/callback',
    scope: 'openid profile email',
  }
};
