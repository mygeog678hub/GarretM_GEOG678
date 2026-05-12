import {
  db,
  auth,
  collection,
  getDocs,
  query,
  where,
  onAuthStateChanged,
  signOut,
  deleteDoc,
  doc
} from "./firebase.js";

const dashboardGrid =
  document.getElementById("dashboardGrid");

/* =========================
   LOAD CARDS
========================= */

async function loadCards(user) {

  try {

    const q = query(
  collection(db, "cards"),
  where("userId", "==", user.uid)
);

const snapshot = await getDocs(q);

dashboardGrid.innerHTML = "";

snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      const card = document.createElement("div");

      card.className = "dashboard-card";

      card.innerHTML = `

  <div class="dashboard-card-top">

    ${data.photo ? `
      <img
        src="${data.photo}"
        class="dashboard-photo"
      />
    ` : `
      <div class="dashboard-photo-placeholder">
        👤
      </div>
    `}

    <div class="dashboard-info">

      <h2>${data.name || ""}</h2>

      <p>${data.company || ""}</p>

      <p class="username">
        @${data.username || ""}
      </p>

      <p>
        Scans: ${data.scans || 0}
      </p>

      <p>
      Last Scan:
      ${
        data.lastScanned
          ? new Date(
              data.lastScanned.seconds * 1000
            ).toLocaleDateString()
          : "Never"
    }
      </p>

      <span class="theme-badge">
        ${data.theme || "ocean"}
      </span>

    </div>

  </div>

  <div class="dashboard-actions">

    <a
      href="profile.html?username=${data.username}"
      class="btn"
    >
      View
    </a>

    <a
      href="edit.html?id=${docSnap.id}"
      class="btn"
    >
      Edit
    </a>

    <button
      onclick="copyLink('${data.username}')"
    >
      Copy Link
    </button>

    <button
      onclick="deleteCard('${docSnap.id}')"
    >
      Delete
    </button>

  </div>

`;

      dashboardGrid.appendChild(card);

    });

  } catch (error) {

    console.error(error);

    dashboardGrid.innerHTML =
      "<h2>Failed to load cards.</h2>";
  }
}

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href =
      "login.html";

    return;
  }

  loadCards(user);

});
// Check for unique username

window.deleteCard = async function(cardId) {

  const confirmDelete = confirm(
    "Delete this card?"
  );

  if (!confirmDelete) return;

  try {

    await deleteDoc(
      doc(db, "cards", cardId)
    );

    const user = auth.currentUser;

    loadCards(user);

  } catch (error) {

    console.error(error);

    alert("Failed to delete card");

  }
};
// Check for unique username
window.copyLink = function(username) {

  const url =
    `${window.location.origin}/profile.html?username=${username}`;

  navigator.clipboard.writeText(url);

  alert("Profile link copied!");
};

/* =========================
   LOGOUT
========================= */

const logoutBtn =
  document.getElementById("logoutBtn");

logoutBtn.addEventListener(
  "click",
  async () => {

    await signOut(auth);

    window.location.href =
      "login.html";

  }
);
