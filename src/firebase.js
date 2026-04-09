import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDV5q8hcU820FNWudXseOhGMEpfXnUAhpU",
  authDomain: "football-manager-a792d.firebaseapp.com",
  projectId: "football-manager-a792d",
  storageBucket: "football-manager-a792d.firebasestorage.app",
  messagingSenderId: "892554125426",
  appId: "1:892554125426:web:0944c07f8e2f9ccfce22eb",
  measurementId: "G-N5TD8JWJRX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
