const {onCall} =
    require("firebase-functions/v2/https");

const {defineSecret} =
    require("firebase-functions/params");

const crypto = require("node:crypto");

const googleClientId =
    defineSecret("GOOGLE_CLIENT_ID");

const googleClientSecret =
    defineSecret("GOOGLE_CLIENT_SECRET");

const googleRedirectUri =
    defineSecret("GOOGLE_REDIRECT_URI");

exports.startGoogleWorkspaceOAuth =
onCall(
    {
      secrets: [
        googleClientId,
        googleClientSecret,
        googleRedirectUri,
      ],
    },
    async (request) => {
      if (!request.auth) {
        throw new Error("Authentication required.");
      }

      const state =
        crypto.randomBytes(32).toString("hex");

      // Temporary until callback validation
      // We'll persist this in the next step.
      const authorizationUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
        new URLSearchParams({

          client_id:
                googleClientId.value(),

          redirect_uri:
                googleRedirectUri.value(),

          response_type: "code",

          access_type: "offline",

          prompt: "consent",

          include_granted_scopes: "true",

          scope: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),

          state,

        }).toString();

      return {

        success: true,

        authorizationUrl,

        state,

      };
    });
