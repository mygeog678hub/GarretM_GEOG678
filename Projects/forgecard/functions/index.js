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