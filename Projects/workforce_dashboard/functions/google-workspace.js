const {onCall} =
    require("firebase-functions/v2/https");

const {defineSecret} =
    require("firebase-functions/params");

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
          console.log(
              "Google Workspace OAuth requested.",
          );

          return {
            success: true,
            message: "OAuth endpoint reached.",
          };
        },
    );
