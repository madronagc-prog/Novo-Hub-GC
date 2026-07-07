const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDz-YgcObciWm31Cd1vSBEzkz8yxQkgKpk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0426171387.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0426171387",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0426171387.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "483686146532",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:483686146532:web:c59a81339f74291fd6e7f1",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-hubdegestodoconh-dbb3b3b5-312e-490e-88b9-4bf7f33097e7",
};

export default firebaseConfig;
