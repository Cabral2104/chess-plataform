const currentHost =
  typeof window !== 'undefined' && window.location.hostname
    ? window.location.hostname
    : '127.0.0.1';

export const environment = {
  production: false,
  apiUrl: `http://${currentHost}:8000/api`,
  reverb: {
    key: 'do83julmti4nvtyj2hoc',
    host: currentHost,
    port: 8085,
    scheme: 'http',
  },
};
