import {
  db,
  collection,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  increment,
  addDoc
} from "./firebase.js";

const params =
  new URLSearchParams(window.location.search);

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

    const cardRef =
      doc(db, "cards", id);

    const snapshot =
      await getDoc(cardRef);

    if (!snapshot.exists()) {

      console.log("No matching card found.");

      cardContainer.innerHTML =
        "<h2>Card not found.</h2>";

      return;
    }

    const data = snapshot.data();

    /* =========================
   SEO META TAGS
========================= */

document.title =
  `${data.name} | ForgeCard`;

const description =
  `${data.name} - ${data.title || "Professional"} at ${data.company || "ForgeCard"}. Connect instantly with ForgeCard digital business cards.`;

document
  .querySelector(
    'meta[name="description"]'
  )
  ?.setAttribute(
    "content",
    description
  );

document
  .querySelector(
    'meta[property="og:title"]'
  )
  ?.setAttribute(
    "content",
    `${data.name} | ForgeCard`
  );

document
  .querySelector(
    'meta[property="og:description"]'
  )
  ?.setAttribute(
    "content",
    description
  );

document
  .querySelector(
    'meta[name="twitter:title"]'
  )
  ?.setAttribute(
    "content",
    `${data.name} | ForgeCard`
  );

document
  .querySelector(
    'meta[name="twitter:description"]'
  )
  ?.setAttribute(
    "content",
    description
  );

/* =========================
   SAVE CONTACT
========================= */

function setupSaveContact(data) {

  const btn =
    document.getElementById(
      "saveContactBtn"
    );

  if (!btn) return;

  btn.addEventListener(
    "click",
    () => {

      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${data.name || ""}
ORG:${data.company || ""}
TITLE:${data.title || ""}
TEL:${data.phone || ""}
EMAIL:${data.email || ""}
URL:${data.website || ""}
END:VCARD`;

      const blob =
        new Blob(
          [vcard],
          {
            type: "text/vcard"
          }
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
    }
  );
}

   // Increment scan analytics
     updateDoc(
      doc(db, "cards", id),
      {
        scans: increment(1),

        lastScanned: new Date()
      }
    );

    // Save scan log
     addDoc(
      collection(
        db,
        "cards",
        id,
        "scanLogs"
      ),
      {
        timestamp: new Date(),

        userAgent:
          navigator.userAgent,

        language:
          navigator.language,

        platform:
          navigator.platform,

        referrer:
          document.referrer || "Direct"
      }
    );

    console.log(
      "Theme value:",
      data.theme
    );

    console.log(
      "Card data:",
      data
    );

    cardContainer.innerHTML = `

<div class="profile-wrapper">

  <!-- BUSINESS CARD -->
  <div class="business-card ${data.theme || 'theme-ocean'}">

  ${
  data.theme === "fbc_pct3"

  ?

  `

  <div class="fbc-header">

    <img
      class="fbc-patch"
      src="pct3/assets/pct3-patch.png"
    >

    <img
      class="fbc-headshot"
      src="${
        data.photo ||
        'pct3/assets/default-avatar.png'
      }"
    >

    <img
      class="fbc-badge"
      src="pct3/assets/pct3-badge.png"
    >

  </div>

  `

  :

  `

  ${
    data.photo
      ?

      `
      <img
        src="${data.photo}"
        alt="Profile Photo"
        class="profile-photo"
      />
      `

      :

      ""
  }

  `

}

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
    href="${data.website || '#'}"
    target="_blank"
  >
    🌐 ${data.website || "No website"}
  </a>

<!-- SOCIAL ICONS -->
<div class="social-icons">

  ${data.facebook ? `
    <a
      href="${data.facebook}"
      target="_blank"
      rel="noopener noreferrer"
      class="social-btn facebook"
    >
      <i class="fab fa-facebook-f"></i>
    </a>
  ` : ""}

  ${data.instagram ? `
    <a
      href="${data.instagram}"
      target="_blank"
      rel="noopener noreferrer"
      class="social-btn instagram"
    >
      <i class="fab fa-instagram"></i>
    </a>
  ` : ""}

  ${data.linkedin ? `
    <a
      href="${data.linkedin}"
      target="_blank"
      rel="noopener noreferrer"
      class="social-btn linkedin"
    >
      <i class="fab fa-linkedin-in"></i>
    </a>
  ` : ""}

  ${data.twitter ? `
    <a
      href="${data.twitter}"
      target="_blank"
      rel="noopener noreferrer"
      class="social-btn x"
    >
      <i class="fab fa-x-twitter"></i>
    </a>
  ` : ""}

</div>

<div class="profile-actions">

  <button id="saveContactBtn">
    Import Contact
  </button>

</div>

${
  data.theme === "fbc_pct3"

  ?

  `

  <div class="fbc-actions">

    <button>
      Vacation Watch
    </button>

    <button>
      Submit Tip
    </button>

    <button>
      Contact Dispatch
    </button>

  </div>

  `

  :

  ``

}

</div>

`;

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
   INIT
========================= */

loadCard();