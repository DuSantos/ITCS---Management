import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Substitui estes valores pelas tuas credenciais do Firebase
// Podes encontrar isto na Consola do Firebase > Definições do Projeto > Geral
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyCO8fbA6k6hauFQOPzqmiH7Rk3dVwWwOGM",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "itcs---management.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "itcs---management",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "itcs---management.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "115876876492",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:115876876492:web:44298607ca4bb057427269"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Inicializar os serviços do Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);
