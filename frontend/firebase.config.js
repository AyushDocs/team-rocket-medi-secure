import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZMAe6A86R4RT1-WNrvcCe88-_X2O15a4",
  authDomain: "sanjeevni-1a311.firebaseapp.com",
  projectId: "sanjeevni-1a311",
  storageBucket: "sanjeevni-1a311.firebasestorage.app",
  messagingSenderId: "40193147629",
  appId: "1:40193147629:web:2c6ab2b7f29634625282e4"
};

import { initializeFirestore } from "firebase/firestore";

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider };
export default app;