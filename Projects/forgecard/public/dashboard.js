import {
  auth,
  db,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  onSnapshot,
  addDoc,
  signOut,
  onAuthStateChanged
} from "./firebase.js";
console.log("dashboard.js loaded");

import {
  isPro
} from "./permissions.js";
import {
  canUseAnalytics
} from "./permissions.js";

import {
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const dashboardGrid =
  document.getElementById("dashboardGrid");  

/* =========================
   LOAD CARDS
========================= */

async function loadCards(user) {
console.log("Loading cards...");
  try {

    const q = query(
      collection(db, "cards"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    const userRef = doc(
  db,
  "users",
  user.uid
);

const userSnap =
  await getDoc(userRef);

const userData =
  userSnap.data();

const currentPlan =
  userData?.subscription || "free";

let cardLimit = 1;

if (currentPlan === "pro") {

  cardLimit = 10;

}

if (currentPlan === "teams") {

  cardLimit = 25;

}

const currentPlanElement =
  document.getElementById(
    "currentPlan"
  );

const cardUsageElement =
  document.getElementById(
    "cardUsage"
  );

if (currentPlanElement) {

  currentPlanElement.textContent =
    currentPlan.charAt(0).toUpperCase() +
    currentPlan.slice(1);

}

if (cardUsageElement) {

  cardUsageElement.textContent =
    `${snapshot.size} / ${cardLimit}`;

}
    const cardCountElement =
  document.getElementById("cardCount");

if (cardCountElement) {

  cardCountElement.textContent =
    snapshot.size;
}

    dashboardGrid.innerHTML = "";
    const loadingMessage =
  document.getElementById("loadingMessage");

    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      const card = document.createElement("div");

card.className =
  "dashboard-card";

      card.innerHTML = `
 <div class="business-card ${data.theme || 'theme-ocean'}">

    <div class="card-top">

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

    <img
      class="card-avatar"
      src="${data.photo || 'default-avatar.png'}"
    >

    `

  }

  <div class="card-info">

        <h2>${data.name || 'No Name'}</h2>

        <p class="card-company">
          ${data.company || ''}
        </p>

        <p class="card-username">
          @${data.username || 'user'}
        </p>

        <div class="card-stats">
          <p>Scans: ${data.scans || 0}</p>
          <p>
  Last Scan:
  ${
    data.lastScanned
      ?

      new Date(
        data.lastScanned.seconds
          ? data.lastScanned.seconds * 1000
          : data.lastScanned
      ).toLocaleDateString()

      :

      'N/A'
  }
</p>
        </div>

      </div>

    </div>

    <div class="card-actions">

      <a
  href="profile.html?id=${docSnap.id}"
  class="btn card-btn"
>
  View Profile
</a>

      <div class="card-actions-row">

  <button
    class="btn card-btn"
    onclick="window.location.href='edit.html?id=${docSnap.id}'"
  >
    Edit
  </button>

  <button
    class="btn card-btn delete-btn"
    data-id="${docSnap.id}"
  >
    Delete
  </button>

  <div class="qr-section">
  <div id="qrcode-${docSnap.id}"></div>
</div>

</div>

    </div>

  </div>
`;
console.log("Appending card:", data.name);
      dashboardGrid.appendChild(card);
      generateQR(docSnap.id);
      const deleteBtn =
  card.querySelector(".delete-btn");

deleteBtn.addEventListener(
  "click",
  async () => {

    const confirmed = confirm(
      "Delete this card?"
    );

    if (!confirmed) return;

    try {

      await deleteDoc(
        doc(db, "cards", docSnap.id)
      );

      card.remove();

    } catch (error) {

      console.error(error);

      alert("Failed to delete card.");

    }

  }
);

    });
    if (loadingMessage) {
  loadingMessage.style.display = "none";
}

  } catch (error) {

    console.error(error);

    dashboardGrid.innerHTML =
      "<h2>Failed to load cards.</h2>";
  }
}
/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href =
      "login.html";

    return;
  }

  loadCards(user);
loadAnalytics(user);
});

async function loadAnalytics(user) {

  try {

    const analyticsContent =
      document.getElementById(
        "analyticsContent"
      );

    const q = query(
      collection(db, "cards"),
      where("userId", "==", user.uid)
    );

    const snapshot =
      await getDocs(q);

    let totalScans = 0;

    let totalCards = 0;

    let lastScanned = "N/A";

    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      totalCards++;

      totalScans +=
        data.scans || 0;

      if (data.lastScanned) {

        lastScanned =
          new Date(
            data.lastScanned.seconds
              ? data.lastScanned.seconds * 1000
              : data.lastScanned
          ).toLocaleDateString();

      }

    });

    analyticsContent.innerHTML = `

      <div class="analytics-grid">

        <div class="stats-card">
          <h3>Total Scans</h3>
          <span>${totalScans}</span>
        </div>

        <div class="stats-card">
          <h3>Total Cards</h3>
          <span>${totalCards}</span>
        </div>

        <div class="stats-card">
          <h3>Last Scan</h3>
          <span>${lastScanned}</span>
        </div>

      </div>

    `;

  } catch (error) {

    console.error(
      "Analytics error:",
      error
    );

  }

}

/* =========================
   QR GENERATION
========================= */

function generateQR(cardId) {

  const qrContainer =
    document.getElementById(`qrcode-${cardId}`);

  if (!qrContainer) return;

  qrContainer.innerHTML = "";

  const profileURL =
    `${window.location.origin}/profile.html?id=${cardId}`;

  new QRCode(qrContainer, {

    text: profileURL,

    width: 180,

    height: 180,

    colorDark: "#000000",

    colorLight: "#ffffff",

    correctLevel:
      QRCode.CorrectLevel.H
  });
}
/* =========================
   UPGRADE TO PRO
========================= */

const dashboardUpgradeBtn =
  document.getElementById(
    "dashboardUpgradeBtn"
  );

if (dashboardUpgradeBtn) {

  dashboardUpgradeBtn.addEventListener(
    "click",
    async () => {

      const user = auth.currentUser;

      if (!user) {

        window.location.href =
          "login.html";

        return;
      }

      try {

        const checkoutSessionRef =
          await addDoc(
            collection(
              db,
              "customers",
              user.uid,
              "checkout_sessions"
            ),
            {
              price:
                "price_1TWiiJLLpp0pEqIbA3FexgpR",

              success_url:
                window.location.origin +
                "/dashboard.html",

              cancel_url:
                window.location.origin +
                "/dashboard.html"
            }
          );

        onSnapshot(
          checkoutSessionRef,
          (snap) => {

            const data = snap.data();

            if (data?.url) {

              window.location.assign(
                data.url
              );
            }

          }
        );

      } catch (error) {

        console.error(error);

        alert(
          "Failed to start checkout."
        );
      }

    }
  );
}
/* =========================
   LOGOUT
========================= */

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async (e) => {

      e.preventDefault();

      try {

        await signOut(auth);

        window.location.href =
          "login.html";

      } catch (error) {

        console.error(error);

        alert("Logout failed.");

      }

    }
  );
}

const changePasswordBtn =
  document.getElementById(
    "changePasswordBtn"
  );

if (changePasswordBtn) {

  changePasswordBtn.addEventListener(
    "click",
    async () => {

      const newPassword =
        prompt(
          "Enter your new password:"
        );

      if (
        !newPassword ||
        newPassword.length < 6
      ) {

        alert(
          "Password must be at least 6 characters."
        );

        return;
      }

      try {

        await updatePassword(
          auth.currentUser,
          newPassword
        );

        alert(
          "Password updated successfully."
        );

      } catch (error) {

        console.error(error);

        alert(
          error.message
        );

      }

    }
  );

}