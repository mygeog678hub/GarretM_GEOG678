const {onCall} =
    require("firebase-functions/v2/https");

const {
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
} = require("./google-config");

const {
  getAuthenticatedClient,
} = require("./google-auth");

const {
  createCalendarEvent,
} = require("./google-workspace-service");

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
      try {
        const tenantId =
        request.data.tenantId;

        if (!tenantId) {
          throw new Error(
              "Missing tenantId.",
          );
        }

        const oauth2Client =
        await getAuthenticatedClient(
            tenantId,
        );

        const now =
        new Date();

        const start =
        new Date(
            now.getTime() +
            (5 * 60 * 1000),
        );

        const end =
        new Date(
            start.getTime() +
            (30 * 60 * 1000),
        );

        const event = {

          summary:
            "WorkForge Test Event",

          description:
            "Google Workspace integration test.",

          start: {

            dateTime:
                start.toISOString(),

            timeZone:
                "America/Chicago",

          },

          end: {

            dateTime:
                end.toISOString(),

            timeZone:
                "America/Chicago",

          },

        };

        const createdEvent =
        await createCalendarEvent(

            oauth2Client,

            event,

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

        throw new Error(
            error.message,
        );
      }
    });
