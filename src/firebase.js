import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // This was missing!

const firebaseConfig = {
  apiKey: "AIzaSyC_ny40QyHP2PG-mADAemPSKxGlwV8QzNI",
  authDomain: "chalichali-photo-booth.firebaseapp.com",
  projectId: "chalichali-photo-booth",
  storageBucket: "chalichali-photo-booth.firebasestorage.app",
  messagingSenderId: "45510277298",
  appId: "1:45510277298:web:3ef8c959e94d5e7f6ff1ab",
  measurementId: "G-JXQE6EWELR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database so App.jsx can use it
export const db = getFirestore(app);
