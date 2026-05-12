import {
  db,
  auth,
  collection,
  addDoc,
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

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href = "login.html";
  }

});

const form = document.getElementById("cardForm");
/* =========================
   CREATE CARD
========================= */

if (form) {

  form.addEventListener("submit", async (e) => {

    e.preventDefault();   
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
  `profile.html?username=${username}`;

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
                "price_1TWHl4L4HqGdfeeqcfYxY0CZ",

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