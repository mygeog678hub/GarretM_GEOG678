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

      <img
        class="card-avatar"
        src="${data.photo || 'default-avatar.png'}"
      >

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
          <p>Last Scan: ${data.lastScan || 'N/A'}</p>
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

</div>

    </div>

  </div>
`;
console.log("Appending card:", data.name);
      dashboardGrid.appendChild(card);
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

  //loadAnalytics(user);

});
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