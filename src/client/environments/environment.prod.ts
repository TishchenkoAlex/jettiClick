export const environment = {
  production: true,
  api: '/api/',
  firebase: {
    apiKey: 'AIzaSyD1QE8sGmF4S6KHZoPprWP3bxz6vYVimyQ',
    authDomain: 'jetti-app.firebaseapp.com',
    databaseURL: 'https://jetti-app.firebaseio.com',
    projectId: 'jetti-app',
    storageBucket: 'jetti-app.appspot.com',
    messagingSenderId: '49165416613'
  },
  auth0: {
    clientID: 'Yk395LuPS8jWPp7e9fQ1PqC72h35UBmu',
    domain: 'jetti-app.auth0.com',
    responseType: 'token id_token',
    audience: 'https://jetti-app.com/api',
    redirectUri: 'https://jetti-project.appspot.com/callback',
    scope: 'openid profile',
  }
};
