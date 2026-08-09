const admin = require("firebase-admin");

const {google} = require("googleapis");

const {
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
} = require("./google-config");

const db = admin.firestore();

/**
 * Loads the Google Workspace integration
 * for a tenant.
 *
 * @param {string} tenantId
 * @return {Promise<Object>}
 */

async function loadTenantIntegration(
    tenantId,
) {
  const doc =
        await db
            .collection(
                "tenantIntegrations",
            )
            .doc(
                tenantId,
            )
            .get();

  if (!doc.exists) {
    throw new Error(
        "Google Workspace is not connected.",
    );
  }

  return doc.data();
}

/**
 * Creates an authenticated Google OAuth2
 * client for the tenant.
 *
 * @param {string} tenantId
 * @return {Promise<google.auth.OAuth2>}
 */

async function getAuthenticatedClient(
    tenantId,
) {
  const integration =
        await loadTenantIntegration(
            tenantId,
        );

  const oauth2Client =
        new google.auth.OAuth2(
            googleClientId.value(),
            googleClientSecret.value(),
            googleRedirectUri.value(),
        );

  oauth2Client.setCredentials({

    access_token:
            integration.accessToken,

    refresh_token:
            integration.refreshToken,

    expiry_date:
            integration.tokenExpiry,

  });

  return oauth2Client;
}

module.exports = {

  loadTenantIntegration,

  getAuthenticatedClient,

};
