import {
  db,
  doc,
  getDoc
} from "./firebase.js";

const params = new URLSearchParams(window.location.search);

const id = params.get("id");

const cardContainer =
  document.getElementById("businessCard");

/* =========================
   LOAD CARD
========================= */

async function loadCard() {

  if (!id) {

    cardContainer.innerHTML =
      "<h2>No card ID found.</h2>";

    return;
  }

  try {

    const cardRef = doc(db, "cards", id);

    const snapshot = await getDoc(cardRef);

    if (!snapshot.exists()) {

      cardContainer.innerHTML =
        "<h2>Card not found.</h2>";

      return;
    }

    const data = snapshot.data();

    cardContainer.innerHTML = `
    ${data.photo ? `
  <img
    src="${data.photo}"
    alt="Profile Photo"
    class="profile-photo"
  />
` : ""}

      <h1>${data.name || ""}</h1>

      <h2>${data.title || ""}</h2>

      <p>${data.company || ""}</p>
      <p class="username">
        @${data.username || ""}
      </p>

      <a href="tel:${data.phone}">
        📞 ${data.phone || "No phone"}
      </a>

      <a href="mailto:${data.email}">
        ✉️ ${data.email || "No email"}
      </a>

      <a href="${data.website}" target="_blank">
        🌐 ${data.website || "No website"}
      </a>

      <button id="saveContactBtn">
        Save Contact
      </button>

    `;

    generateQR();
    setupSaveContact(data);

  } catch (error) {

    console.error(error);

    cardContainer.innerHTML = `
      <h2>Error loading card.</h2>
    `;
  }
}

/* =========================
   QR GENERATION
========================= */

function generateQR() {

  const qrContainer =
    document.getElementById("qrcode");

  qrContainer.innerHTML = "";

  new QRCode(qrContainer, {

    text: window.location.href,

    width: 220,
    height: 220

  });
}

/* =========================
   SAVE CONTACT
========================= */

function setupSaveContact(data) {

  const btn =
    document.getElementById("saveContactBtn");

  if (!btn) return;

  btn.addEventListener("click", () => {

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${data.name || ""}
ORG:${data.company || ""}
TITLE:${data.title || ""}
TEL:${data.phone || ""}
EMAIL:${data.email || ""}
URL:${data.website || ""}
END:VCARD`;

    const blob = new Blob(
      [vcard],
      { type: "text/vcard" }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `${data.name || "contact"}.vcf`;

    a.click();

    URL.revokeObjectURL(url);

  });
}

/* =========================
   INIT
========================= */

loadCard();