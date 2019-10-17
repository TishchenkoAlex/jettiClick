// const domain = 'https://jetti-pg.appspot.com';

export const environment = {
  production: true,
  api: '/api/',
  auth: '/auth/',
  socket: `https://${window.location.host}`,
  host: '',
  path: ''
};

export const OAuthSettings = {
  clientID: '8497b6af-a0c3-4b55-9e60-11bc8ff237e4',
  authority: 'https://login.microsoftonline.com/b91c98b1-d543-428b-9469-f5f8f25bc37b',
  redirectUri: 'https://sm.jetti-app.com/',
  validateAuthority : true,
  scopes: [
    'user.read'
  ]
};
