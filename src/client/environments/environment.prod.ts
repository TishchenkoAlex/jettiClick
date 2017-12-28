const domain = 'https://jetti-pg.appspot.com';
// const domain = 'http://cl.jetti-app.com';

export const environment = {
  production: true,
  api: '/api/',
  socket: '',
  auth0: {
    clientID: 'Yk395LuPS8jWPp7e9fQ1PqC72h35UBmu',
    domain: 'jetti-app.auth0.com',
    responseType: 'token id_token',
    audience: 'https://jetti-app.com/api',
    redirectUri: `${domain}/callback`,
    scope: 'openid profile email',
  }
};

