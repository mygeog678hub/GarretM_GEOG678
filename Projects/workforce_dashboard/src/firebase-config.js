import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkVL4FUIyb7A2XRi1CGmDLf6W_jlJ2VuM",
  authDomain: "workforge-3b77f.firebaseapp.com",
  projectId: "workforge-3b77f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };