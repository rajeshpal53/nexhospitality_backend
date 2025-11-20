// config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://connectingservices-9a16b.firebaseio.com'
//   apiKey: "AIzaSyBtXTJEpB2nBbcrOaCAYBhQ5k3hufkGVIA",
//   authDomain: "connectingservices-9a16b.firebaseapp.com",
//   projectId: "connectingservices-9a16b",
//   storageBucket: "connectingservices-9a16b.appspot.com",
//   messagingSenderId: "107285483046",
//   appId: "1:107285483046:web:41f9b34fb76dd82cc720e7",
//   measurementId: "G-8ZME7SPPYS"
});

module.exports = admin;
