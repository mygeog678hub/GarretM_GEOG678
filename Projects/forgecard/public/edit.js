import {
  db,
  doc,
  getDoc,
  updateDoc
} from "./firebase.js";

const params =
  new URLSearchParams(window.location.search);

const id = params.get("id");

const form =
  document.getElementById("editForm");

/* =========================
   LOAD CARD
========================= */

async function loadCard() {

  try {

    const cardRef =
      doc(db, "cards", id);

    const snapshot =
      await getDoc(cardRef);

    if (!snapshot.exists()) {
      alert("Card not found.");
      return;
    }

    const data = snapshot.data();

    document.getElementById("name").value =
      data.name || "";

    document.getElementById("username").value =
      data.username || "";

    document.getElementById("company").value =
      data.company || "";

    document.getElementById("title").value =
      data.title || "";

    document.getElementById("email").value =
      data.email || "";

    document.getElementById("phone").value =
      data.phone || "";

    document.getElementById("website").value =
      data.website || "";

    document.getElementById("photo").value =
      data.photo || "";

  } catch (error) {

    console.error(error);

    alert("Failed to load card.");
  }
}

/* =========================
   SAVE CHANGES
========================= */

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  try {

    const cardRef =
      doc(db, "cards", id);

    await updateDoc(cardRef, {

      name:
        document.getElementById("name").value,

      username:
        document.getElementById("username").value,

      company:
        document.getElementById("company").value,

      title:
        document.getElementById("title").value,

      email:
        document.getElementById("email").value,

      phone:
        document.getElementById("phone").value,

      website:
        document.getElementById("website").value,

      photo:
        document.getElementById("photo").value

    });

    alert("Card updated successfully.");

    window.location.href =
      `card.html?id=${id}`;

  } catch (error) {

    console.error(error);

    alert("Failed to update card.");
  }

});

loadCard();