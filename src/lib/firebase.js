import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDLqN4jaTVjszXEnlVHVz2EUFuk5DaFGMs",
  authDomain: "flashlearn-49cc8.firebaseapp.com",
  projectId: "flashlearn-49cc8",
  storageBucket: "flashlearn-49cc8.firebasestorage.app",
  messagingSenderId: "934995771686",
  appId: "1:934995771686:web:1ac100ff8193dbe73f01e7",
  measurementId: "G-RV2K2TKXP1"
};


export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 