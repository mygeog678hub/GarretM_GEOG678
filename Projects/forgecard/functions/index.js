const { onDocumentCreated } = require(
  "firebase-functions/v2/firestore"
);

const { defineSecret } = require(
  "firebase-functions/params"
);

const admin = require("firebase-admin");

const { Resend } = require("resend");

admin.initializeApp();

const RESEND_API_KEY =
  defineSecret("RESEND_API_KEY");

exports.sendContactNotification =
  onDocumentCreated(
    {
      document:
        "contactMessages/{docId}",

      secrets:
        [RESEND_API_KEY]
    },

    async (event) => {

      console.log(
        "FUNCTION STARTED"
      );

      try {

        const data =
          event.data.data();

        console.log(
          "DATA:",
          data
        );

        const resend =
          new Resend(
            RESEND_API_KEY.value()
          );

        const response =
          await resend.emails.send({

            from:
              "ForgeCard <noreply@getforgecard.com>",

            to:
              "mgarret27@gmail.com",

            subject:
              `New ForgeCard Contact: ${data.subject}`,

            html:
              `<p>${data.message}</p>`
          });

        console.log(
          "RESEND RESPONSE:",
          response
        );

      } catch (error) {

        console.error(
          "FULL ERROR:",
          error
        );

      }

    }
  );