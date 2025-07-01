export const environment = {
  production: false,
  ssr: false,
  ENABLE_ALL_FEATURES_FOR_DEV: true,
  firebaseConfig: {
    apiKey: 'AIzaSyC5iLSLevYe2zkEcARQbzMIF0wLP6VXyfg',
    authDomain: 'watford-events.firebaseapp.com',
    projectId: 'watford-events',
    storageBucket: 'watford-events.firebasestorage.app',
    messagingSenderId: '96622213811',
    appId: '1:96622213811:web:93b481584742d93c178ec6',
    measurementId: 'G-488QLDGW25',
  },
  featureFlags: {
    patchwork: false,
    landlord: false,
    theme: true,
    search: false,
    badges: false,
    missions: false,
    photoUpload: false,
    carpets: false
  }
};
