import {
  db,
  doc,
  getDoc,
  updateDoc
} from "./firebase.js";

/* =========================
   GET CARD ID
========================= */

const params =
  new URLSearchParams(window.location.search);

const cardId = params.get("id");

/* =========================
   FORM ELEMENTS
========================= */

const editForm =
  document.getElementById("editForm");

const nameInput =
  document.getElementById("name");

const companyInput =
  document.getElementById("company");

const usernameInput =
  document.getElementById("username");

const phoneInput =
  document.getElementById("phone");

const emailInput =
  document.getElementById("email");

const websiteInput =
  document.getElementById("website");

const photoInput =
  document.getElementById("photo");

const themeInput =
  document.getElementById("theme");

/* =========================
   LOAD CARD DATA
========================= */

async function loadCard() {

  try {

    const docRef =
      doc(db, "cards", cardId);

    const docSnap =
      await getDoc(docRef);

    if (!docSnap.exists()) {

      alert("Card not found");

      return;
    }

    const data = docSnap.data();

    nameInput.value =
      data.name || "";

    companyInput.value =
      data.company || "";

    usernameInput.value =
      data.username || "";

    phoneInput.value =
      data.phone || "";

    emailInput.value =
      data.email || "";

    websiteInput.value =
      data.website || "";

    photoInput.value =
      data.photo || "";

    themeInput.value =
      data.theme || "ocean";

  } catch (error) {

    console.error(error);

  }
}

loadCard();

/* =========================
   SAVE CHANGES
========================= */

editForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    try {

      await updateDoc(
        doc(db, "cards", cardId),
        {
          name: nameInput.value,
          company: companyInput.value,
          username: usernameInput.value,
          phone: phoneInput.value,
          email: emailInput.value,
          website: websiteInput.value,
          photo: photoInput.value,
          theme: themeInput.value
        }
      );

      alert("Card updated!");

      window.location.href =
        "dashboard.html";

    } catch (error) {

      console.error(error);

      alert("Failed to update card");

    }
  }
);