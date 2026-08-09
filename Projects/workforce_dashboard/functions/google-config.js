const {defineSecret} =
    require("firebase-functions/params");

const googleClientId =
    defineSecret(
        "GOOGLE_CLIENT_ID",
    );

const googleClientSecret =
    defineSecret(
        "GOOGLE_CLIENT_SECRET",
    );

const googleRedirectUri =
    defineSecret(
        "GOOGLE_REDIRECT_URI",
    );

module.exports = {

  googleClientId,

  googleClientSecret,

  googleRedirectUri,

};
