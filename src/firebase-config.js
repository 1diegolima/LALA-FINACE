import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- TE AMO LALA (Lala Finance) ---
const firebaseConfig = {
  apiKey: "AIzaSyCbXDEs7YkGVV7FYQudC-tU3XbbXjsPBcE",
  authDomain: "lala-finance.firebaseapp.com",
  projectId: "lala-finance",
  storageBucket: "lala-finance.firebasestorage.app",
  messagingSenderId: "135575695929",
  appId: "1:135575695929:web:56acbf77d88efed30c13e8",
  measurementId: "G-3NW9FNYQ50"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CONEXBANK (Banco Externo) ---
const firebaseConfigAmigo = {
  apiKey: "AIzaSyAAbxmINIFuHP9tMlEnnBK62wfuNu0Q44A",
  authDomain: "appconexbank.firebaseapp.com",
  projectId: "appconexbank",
  storageBucket: "appconexbank.firebasestorage.app",
  messagingSenderId: "778411145141",
  appId: "1:778411145141:web:a327a19a2931a4ec1c0bfc",
  measurementId: "G-4MVLXX169W"
};

const appAmigo = initializeApp(firebaseConfigAmigo, "amigo");
const dbAmigo = getFirestore(appAmigo);

export { app, auth, db, dbAmigo };
