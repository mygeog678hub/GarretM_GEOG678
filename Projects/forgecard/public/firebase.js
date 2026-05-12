// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// Note: Storage functions are imported in edit.js since they're only needed there

/* =========================
   FIREBASE CONFIG
========================= */
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyCzSrgG1bilr1qwdgUJ0sOxVsTgKGm94t0",
  authDomain: "forgecard-9071c.firebaseapp.com",
  projectId: "forgecard-9071c",
  storageBucket: "forgecard-9071c.firebasestorage.app",
  messagingSenderId: "352554240057",
  appId: "1:352554240057:web:038d9e9ae9acecdebba5e8"
};

/* =========================
   INITIALIZE FIREBASE
========================= */

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);
const storage = getStorage(app);

/* =========================
   EXPORTS
========================= */

export {
  db,
  auth,
  storage,

  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  increment,
  query,
  where,
  ref,
  uploadBytes,
  getDownloadURL,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  onSnapshot
};