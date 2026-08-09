const {onCall, onRequest, HttpsError} =
    require("firebase-functions/v2/https");

const {google} =
    require("googleapis");

const crypto = require("node:crypto");

const {

  googleClientId,

  googleClientSecret,

  googleRedirectUri,

} = require(
    "./google-config",
);

const admin =
    require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db =
    admin.firestore();

const {
  getAuthenticatedClient,
} = require("./google-auth");

const {
  createCalendarEvent,
} = require("./google-workspace-service");

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
    JSON.stringify({
      tenantId:
            request.data.tenantId,
      uid:
            request.auth.uid,
      nonce:
            crypto.randomBytes(16).toString("hex"),
    });

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

          state:
              Buffer.from(state).toString("base64"),

        }).toString();

      return {

        success: true,

        authorizationUrl,

        state,

      };
    });

exports.googleWorkspaceCallback =
    onRequest(
        {
          secrets: [
            googleClientId,
            googleClientSecret,
            googleRedirectUri,
          ],
        },
        async (req, res) => {
          try {
            console.log(
                "Google OAuth callback reached.",
            );

            const code =
    req.query.code;

            const state =
    JSON.parse(
        Buffer.from(
            req.query.state,
            "base64",
        ).toString(),
    );

            console.log(
                "OAuth state:",
                state,
            );

            const oauth2Client =
    new google.auth.OAuth2(
        googleClientId.value(),
        googleClientSecret.value(),
        googleRedirectUri.value(),
    );

            console.log(
                "OAuth client created:",
                !!oauth2Client,
            );

            const {tokens} =
    await oauth2Client.getToken(
        code,
    );

            console.log(
                "Google tokens:",
                tokens,
            );

            oauth2Client.setCredentials(tokens);

            const calendar =
    google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

            const calendarList =
    await calendar.calendarList.list();

            const primaryCalendar =
    calendarList.data.items.find(
        (item) => item.primary,
    );

            await db
                .collection(
                    "tenantIntegrations",
                )
                .doc(
                    state.tenantId,
                )
                .set({
                  provider: "google",

                  connected: true,

                  accessToken:
            tokens.access_token,

                  refreshToken:
            tokens.refresh_token,

                  tokenExpiry:
            tokens.expiry_date,

                  connectedAt:
            admin.firestore.FieldValue.serverTimestamp(),

                  connectedBy:
            state.uid,

                  accountEmail:
            primaryCalendar.id,

                  primaryCalendarId:
            primaryCalendar.id,

                  primaryCalendarName:
            primaryCalendar.summary,

                  scopes:
            tokens.scope,

                  calendarEnabled: true,

                  meetEnabled: true,

                  updatedAt:
            admin.firestore.FieldValue.serverTimestamp(),

                }, {
                  merge: true,
                });

            console.log(
                "Refresh token received:",
                !!tokens.refresh_token,
            );

            console.log(
                "Scopes:",
                tokens.scope,
            );

            console.log(
                "Access token received:",
                !!tokens.access_token,
            );

            console.log(
                "Authorization code:",
                code,
            );

            return res.redirect(
                "http://127.0.0.1:5500/Projects/workforce_dashboard/src/app.html?workspace=connected",
            );
          } catch (error) {
            console.error(
                "Google OAuth callback failed:",
                error,
            );

            return res.redirect(
                "http://127.0.0.1:5500/Projects/workforce_dashboard/src/app.html?workspace=error",
            );
          }
        },
    );

exports.createGoogleCalendarTestEvent =
onCall(
    {
      secrets: [
        googleClientId,
        googleClientSecret,
        googleRedirectUri,
      ],
    },

    
    async (request) => {
        console.log("Calling createGoogleCalendarTestEvent...");
      try {
        if (!request.auth) {
          throw new HttpsError(
              "unauthenticated",
              "Authentication required.",
          );
        }

        const uid =
    request.auth.uid;

        console.log("=== Google Calendar Test ===");

        console.log(
            "Authenticated UID:",
            request.auth?.uid,
        );

        console.log(
            "Looking up user profile...",
        );


        const userDoc =
    await db
        .collection("users")
        .doc(uid)
        .get();

        console.log(
            "User document exists:",
            userDoc.exists,
        );


        if (!userDoc.exists) {
          throw new HttpsError(
              "permission-denied",
              "User profile not found.",
          );
        }


        const tenantId =
    userDoc.data().tenantId;


        if (!tenantId) {
          throw new HttpsError(
              "failed-precondition",
              "User is not assigned to a tenant.",
          );
        }

        console.log(
            "Resolved tenant:",
            tenantId,
        );

        console.log(
            "Getting authenticated Google client...",
        );

        const oauth2Client =
            await getAuthenticatedClient(
                tenantId,
            );

        const event = {

          summary:
                "WorkForge Test Event",

          description:
                "Google Workspace integration test.",

          start: {

            dateTime:
                    new Date(
                        Date.now() +
                        5 * 60 * 1000,
                    ).toISOString(),

          },

          end: {

            dateTime:
                    new Date(
                        Date.now() +
                        35 * 60 * 1000,
                    ).toISOString(),

          },

        };

        console.log(
            "Google client authenticated.",
        );

        console.log(
            "Creating Calendar event...",
        );

        const createdEvent =
            await createCalendarEvent(
                oauth2Client,
                event,
            );

        console.log(
            "Calendar event created:",
            createdEvent.id,
        );

        return {

          success: true,

          eventId:
                createdEvent.id,

          htmlLink:
                createdEvent.htmlLink,

        };
      } catch (error) {
        console.error(
            "Calendar test failed:",
            error,
        );

        return {

          success: false,

          message:
                error.message,

        };
      }
    });
