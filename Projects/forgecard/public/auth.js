console.log("AUTH JS LOADED");

import {

  auth,
  provider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail

} from "./firebase.js";

const loginForm =
  document.getElementById("loginForm");

const signupBtn =
  document.getElementById("signupBtn");

/* =========================
   LOGIN
========================= */

loginForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const email =
      document.getElementById("email").value;

    const password =
      document.getElementById("password").value;

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Login successful.");

      window.location.href =
        "dashboard.html";

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  }
);

/* =========================
   SIGNUP
========================= */

signupBtn.addEventListener(
  "click",
  async () => {

    console.log("SIGNUP CLICKED");

    const email =
      document.getElementById("email").value;

    const password =
      document.getElementById("password").value;

    if (!email || !password) {

      alert(
        "Enter email and password first."
      );

      return;
    }

    try {

      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Account created successfully.");

      window.location.href =
        "dashboard.html";

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  }
);

/* =========================
   GOOGLE LOGIN
========================= */

document
  .getElementById("googleLoginBtn")
  .addEventListener(
    "click",
    async () => {

      try {

        await signInWithPopup(
          auth,
          provider
        );

        alert(
          "Google login successful."
        );

        window.location.href =
          "dashboard.html";

      } catch (error) {

        console.error(error);

        alert(error.message);

      }

    }
);

/* =========================
   PASSWORD RESET
========================= */

document
  .getElementById("forgotPassword")
  .addEventListener(
    "click",
    async () => {

      const email =
        document.getElementById("email").value;

      if (!email) {

        alert(
          "Enter your email first."
        );

        return;
      }

      try {

        await sendPasswordResetEmail(
          auth,
          email
        );

        alert(
          "Password reset email sent."
        );

      } catch (error) {

        console.error(error);

        alert(error.message);

      }

    }
);