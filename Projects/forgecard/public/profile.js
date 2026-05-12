import {
  db,
  collection,
  getDocs,
  query,
  where
} from "./firebase.js";

const params =
  new URLSearchParams(window.location.search);

const username =
  params.get("username");

const cardContainer =
  document.getElementById("businessCard");

/* =========================
   LOAD CARD
========================= */

async function loadCard() {

  if (!username) {

    cardContainer.innerHTML =
      "<h2>No username found.</h2>";

    return;
  }

  try {

  console.log("Username from URL:", username);

  const q = query(
    collection(db, "cards"),
    where("username", "==", username)
  );

  console.log("Running Firestore query...");

  const snapshot =
    await getDocs(q);

  console.log("Documents found:", snapshot.size);

  if (snapshot.empty) {

    console.log("No matching card found.");

    cardContainer.innerHTML =
      "<h2>Card not found.</h2>";

    return;
  }

  const data =
  snapshot.docs[0].data();

applyTheme(data.theme);

console.log("Card data:", data);

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

      <a href="tel:${data.phone || ""}">
        📞 ${data.phone || "No phone"}
      </a>

      <a href="mailto:${data.email || ""}">
        ✉️ ${data.email || "No email"}
      </a>

      <a
        href="${data.website || "#"}"
        target="_blank"
      >
        🌐 ${data.website || "No website"}
      </a>

      <div class="profile-actions">

  <button id="saveContactBtn">
    Save Contact
  </button>

  <button id="downloadQRBtn">
    Download QR
  </button>

  <a
    href="dashboard.html"
    class="profile-nav-btn"
  >
    Dashboard
  </a>

  <a
    href="edit.html?id=${snapshot.docs[0].id}"
    class="profile-nav-btn"
  >
    Edit Card
  </a>

</div>

    `;

    generateQR();

setupDownloadQR();

setupSaveContact(data);

  } catch (error) {

  console.error(error);

  cardContainer.innerHTML = `
    <h2>Error loading card.</h2>
    <p>${error.message}</p>
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
// Download QR code as image
function setupDownloadQR() {

  const downloadBtn =
    document.getElementById("downloadQRBtn");

  if (!downloadBtn) return;

  downloadBtn.addEventListener(
    "click",
    () => {

      const qrCanvas =
        document.querySelector("#qrcode canvas");

      if (!qrCanvas) {

        alert("QR code not ready");

        return;
      }

      const image =
        qrCanvas.toDataURL("image/png");

      const link =
        document.createElement("a");

      link.href = image;

      link.download =
        "forgecard-qrcode.png";

      link.click();
    }
  );
}

function applyTheme(theme) {

  const body = document.body;

  body.classList.remove(
    "theme-ocean",
    "theme-midnight",
    "theme-emerald",
    "theme-sunset",
    "theme-minimal"
  );

  switch(theme) {

    case "midnight":
      body.classList.add("theme-midnight");
      break;

    case "emerald":
      body.classList.add("theme-emerald");
      break;

    case "sunset":
      body.classList.add("theme-sunset");
      break;

    case "minimal":
      body.classList.add("theme-minimal");
      break;

    default:
      body.classList.add("theme-ocean");
  }
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