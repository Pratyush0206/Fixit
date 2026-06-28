import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDR1YCYzYauim2eL0JEnUR_MmT4kNMcft4",
  authDomain: "fixit-d2040.firebaseapp.com",
  projectId: "fixit-d2040",
  storageBucket: "fixit-d2040.firebasestorage.app",
  messagingSenderId: "538100432620",
  appId: "1:538100432620:web:a37052a5a0b24dfe722fc9",
  measurementId: "G-HEHRGT1VMN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);