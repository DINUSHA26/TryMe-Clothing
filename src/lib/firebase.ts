import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBhV1NCJTnj-RdoYxyXWMICIqt2V92lzNQ",
  authDomain: "tryme-fashion.firebaseapp.com",
  projectId: "tryme-fashion",
  storageBucket: "tryme-fashion.firebasestorage.app",
  messagingSenderId: "512567038814",
  appId: "1:512567038814:web:dbccf8e75a5b459af675cf",
  measurementId: "G-ZX8XTGXJTS"
};

// Initialize Firebase only if it hasn't been initialized already (important for Next.js SSR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export default app;
