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

        ${data.photo ? `
          <img
            src="${data.photo}"
            class="dashboard-photo"
          />
        ` : ""}

        <h2>${data.name || ""}</h2>

        <p>${data.company || ""}</p>

        <p>@${data.username || ""}</p>

        <div class="dashboard-actions">

  <a
    href="card.html?id=${docSnap.id}"
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
