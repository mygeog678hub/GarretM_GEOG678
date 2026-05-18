
import {
  db,
  auth,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  query,
  where,
  onAuthStateChanged,
  onSnapshot,

} from "./firebase.js";

const protectedPages = [
  "create.html"
];

const currentPage =
  window.location.pathname
    .split("/")
    .pop();

onAuthStateChanged(auth, (user) => {

  if (
    !user &&
    protectedPages.includes(currentPage)
  ) {

    window.location.href =
      "login.html";
  }

});

import {
  canCreateCard
} from "./permissions.js";

const form = document.getElementById("cardForm");
/* =========================
   CREATE CARD
========================= */

if (form) {

  form.addEventListener("submit", async (e) => {

   e.preventDefault();

console.log("Generate Card clicked");

const username =
  document
    .getElementById("username")
    .value
    .trim()
    .toLowerCase();

const usernameRegex =
  /^[a-z0-9_]+$/;

if (!usernameRegex.test(username)) {

  alert(
    "Username can only contain letters, numbers, and underscores."
  );

  return;
}

const photoFile =
  document.getElementById("photo").files[0];

let photoURL = "";

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

const usernameQuery = query(
  collection(db, "cards"),
  where("username", "==", username)
);

const usernameSnapshot =
  await getDocs(usernameQuery);

if (!usernameSnapshot.empty) {

  alert("Username already taken.");

  return;
}

const user = auth.currentUser;

// Load user document
const userRef = doc(
  db,
  "users",
  user.uid
);

const userSnap =
  await getDoc(userRef);

const userData =
  userSnap.data();

// Count existing cards
const cardsQuery = query(
  collection(db, "cards"),
  where("userId", "==", user.uid)
);

const cardsSnapshot =
  await getDocs(cardsQuery);

const totalCards =
  cardsSnapshot.size;

// Check permissions
if (
  !canCreateCard(
    userData,
    totalCards
  )
) {

  alert(
    "Free accounts can only create 1 card. Upgrade to Pro."
  );

  return;
}

    const cardData = {

  userId: auth.currentUser.uid,

  name:
    document.getElementById("name").value,

  username: username,

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

facebook:
  document.getElementById("facebook").value,

instagram:
  document.getElementById("instagram").value,

linkedin:
  document.getElementById("linkedin").value,

twitter:
  document.getElementById("twitter").value,

photo: photoURL,
  theme: document.getElementById("theme").value,

  createdAt: new Date()
};

    try {

      const docRef = await addDoc(
        collection(db, "cards"),
        cardData
      );

      /* =========================
         REDIRECT TO CARD PAGE
      ========================= */

      window.location.href =
  `profile.html?id=${docRef.id}`;

    } catch (error) {

      console.error(error);

      alert("Failed to create card.");

    }

  });

}
/* =========================
   STRIPE CHECKOUT
========================= */

const upgradeBtn =
  document.getElementById("upgradeBtn");

if (upgradeBtn) {

  upgradeBtn.addEventListener(
    "click",
    async () => {

      console.log("Upgrade clicked");

      const user =
        auth.currentUser;

      console.log("Current user:", user);

      if (!user) {

        console.log("No authenticated user");

        window.location.href =
          "login.html";

        return;
      }

      try {

        console.log("Creating checkout session...");

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
                window.location.origin,

              cancel_url:
                window.location.origin
            }
          );

        console.log(
          "Checkout session created:",
          checkoutSessionRef.id
        );

        onSnapshot(
          checkoutSessionRef,
          (snap) => {

            console.log(
              "Snapshot received:",
              snap.data()
            );

            const data =
              snap.data();

            if (data?.url) {

              console.log(
                "Redirecting to Stripe"
              );

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