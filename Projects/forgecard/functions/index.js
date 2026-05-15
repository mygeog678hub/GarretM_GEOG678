const functions = require("firebase-functions");
const express = require("express");
const Stripe = require("stripe");

const functions = require("firebase-functions");

const stripe = require("stripe")(
  functions.config().stripe.secret
);

const app = express();

app.post(
  "/stripeWebhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
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

exports.api = functions.https.onRequest(app);