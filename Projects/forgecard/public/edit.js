import {
  db,
  doc,
  getDoc,
  updateDoc,
  storage,
  ref,
  uploadBytes,
  getDownloadURL
} from "./firebase.js";
let existingPhotoURL = "";

/* =========================
   GET CARD ID
========================= */

const params =
  new URLSearchParams(window.location.search);

const cardId = params.get("id");
console.log("Card ID:", cardId);

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

    existingPhotoURL =
      data.photo || "";

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
      const photoFile =
  photoInput.files[0];

let photoURL =
  existingPhotoURL;

if (photoFile) {

  const storageRef = ref(
    storage,
    `profilePhotos/${Date.now()}_${photoFile.name}`
  );

  await uploadBytes(
    storageRef,
    photoFile
  );

  photoURL =
    await getDownloadURL(storageRef);
}

      await updateDoc(
        doc(db, "cards", cardId),
        {
          name: nameInput.value,
          company: companyInput.value,
          username: usernameInput.value,
          phone: phoneInput.value,
          email: emailInput.value,
          website: websiteInput.value,
          photo: photoURL,
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

const cancelEditBtn =
  document.getElementById(
    "cancelEditBtn"
  );

if (cancelEditBtn) {

  cancelEditBtn.addEventListener(
    "click",
    () => {

      const confirmCancel =
        confirm(
          "Discard changes?"
        );

      if (confirmCancel) {

        window.history.back();
      }

    }
  );

}