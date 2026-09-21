/* Firebase project config for the shared daily results (see js/results.js).
 * Not a secret — this key only identifies the project to Firebase; access
 * is controlled by Firestore security rules, not by hiding this value.
 * Paste in the values from Firebase console > Project settings > General >
 * "Your apps" > the web app's config snippet. */
window.NAPKIN = window.NAPKIN || {};
window.NAPKIN.firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
