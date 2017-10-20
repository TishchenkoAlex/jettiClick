// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  api: 'http://localhost:3000/api/',
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
    redirectUri: 'http://localhost:4200/callback',
    scope: 'openid profile email',
  }
};
