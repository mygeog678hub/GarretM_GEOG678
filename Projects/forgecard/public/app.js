import {
  db,
  auth,
  collection,
  addDoc,
  onAuthStateChanged
} from "./firebase.js";

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href = "login.html";
  }

});

const form = document.getElementById("cardForm");


/* =========================
   CREATE CARD
========================= */

if (form) {

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const cardData = {
      userId: auth.currentUser.uid,

      name: document.getElementById("name").value,
      username:
      document.getElementById("username").value,

      company: document.getElementById("company").value,

      title: document.getElementById("title").value,

      email: document.getElementById("email").value,

      phone: document.getElementById("phone").value,

      website: document.getElementById("website").value,
      photo: document.getElementById("photo").value,

      createdAt: new Date()

    };

    try {

      const docRef = await addDoc(
        collection(db, "cards"),
        cardData
      );

      /* =========================
         REDIRECT TO CARD PAGE
      ========================= */

      window.location.href =
        `card.html?id=${docRef.id}`;

    } catch (error) {

      console.error(error);

      alert("Failed to create card.");

    }

  });

}