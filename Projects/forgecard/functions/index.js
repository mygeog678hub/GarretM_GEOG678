const {
  onRequest
} = require("firebase-functions/v2/https");
const { defineSecret } =
  require("firebase-functions/params");

const stripeSecret =
  defineSecret("STRIPE_SECRET_KEY");

const functions =
  require("firebase-functions");

const express =
  require("express");

const admin =
  require("firebase-admin");

  const { Resend } = require("resend");

admin.initializeApp();

const app = express();
app.post(
  "/stripeWebhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const stripe = require("stripe")(
      stripeSecret.value()
    );
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        "whsec_NKU9AL4kGcEsmsM5nsVb4tnMq95P5HQ3"
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        console.log("Checkout completed:", session.id);

        // future subscription/account activation logic goes here
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

exports.api = onRequest(
  {
    secrets: [stripeSecret]
  },
  app
);

const resendKey =
  defineSecret("RESEND_API_KEY");

const resend =
  new Resend(resendKey.value());

exports.notifyContactSubmission =
  functions.firestore
    .document("contactMessages/{docId}")
    .onCreate(async (snap) => {

      const data = snap.data();

      try {

        await resend.emails.send({

          from:
            "Forgecard <onboarding@resend.dev>",

          to:
            "YOUR_EMAIL@gmail.com",

          subject:
            `New Forgecard Contact: ${data.subject}`,

          html: `
            <h2>New Contact Submission</h2>

            <p><strong>Name:</strong> ${data.name}</p>

            <p><strong>Email:</strong> ${data.email}</p>

            <p><strong>Subject:</strong> ${data.subject}</p>

            <p><strong>Message:</strong></p>

            <p>${data.message}</p>
          `
        });

        console.log("Email sent");

      } catch (error) {

        console.error(error);

      }

    });