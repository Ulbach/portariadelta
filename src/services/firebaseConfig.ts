import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
export const firebaseConfig = {
  apiKey: "AIzaSyC0MnP557L2MiBKodygaKRkE-gh_kXnAeI",
  authDomain: "gen-lang-client-0632978305.firebaseapp.com",
  projectId: "gen-lang-client-0632978305",
  storageBucket: "gen-lang-client-0632978305.firebasestorage.app",
  messagingSenderId: "419163189053",
  appId: "1:419163189053:web:4d318baae5119083d89f54",
  firestoreDatabaseId: "ai-studio-remixportariaint-246660d2-4eae-4731-9452-0390acde93b9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
