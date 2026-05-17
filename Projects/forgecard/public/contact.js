import {
  db,
  collection,
  addDoc
} from "./firebase.js";

const form =
  document.getElementById("contactForm");

const successMessage =
  document.getElementById("successMessage");

if (form) {

  form.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const name =
        document
          .getElementById("name")
          .value
          .trim();

      const email =
        document
          .getElementById("email")
          .value
          .trim();

      const subject =
        document
          .getElementById("subject")
          .value
          .trim();

      const message =
        document
          .getElementById("message")
          .value
          .trim();

      try {

        await addDoc(
          collection(db, "contactMessages"),
          {
            name,
            email,
            subject,
            message,
            createdAt: new Date()
          }
        );

        form.reset();

        successMessage.style.display =
          "block";

      } catch (error) {

  console.error(
    "Contact form error:",
    error
  );

  alert(error.message);

}

    }
  );

}