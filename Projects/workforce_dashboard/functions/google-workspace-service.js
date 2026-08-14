const {google} = require("googleapis");

/**
 * Creates a Google Calendar event.
 *
 * @param {google.auth.OAuth2} oauth2Client
 * @param {Object} event
 * @param {Object} options
 * @return {Promise<Object>}
 */
async function createCalendarEvent(
    oauth2Client,
    event,
    options = {},
) {
  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  try {
    const request = {
      calendarId: "primary",
      requestBody: event,
    };

    if (
      options.conferenceDataVersion
    ) {
      request.conferenceDataVersion =
        options.conferenceDataVersion;
    }

    const response =
      await calendar.events.insert(
          request,
      );

    return response.data;
  } catch (error) {
    console.error(
        "FULL ERROR:",
        error,
    );

    console.error(
        "STACK:",
        error.stack,
    );

    console.error(
        "GOOGLE RESPONSE:",
        JSON.stringify(
            error.response?.data,
            null,
            2,
        ),
    );

    throw error;
  }
}

async function updateCalendarEvent(
    oauth2Client,
    eventId,
    event,
) {
  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  try {
    const response =
            await calendar.events.update({

              calendarId: "primary",

              eventId,

              requestBody: event,

            });

    return response.data;
  } catch (error) {
    console.error("FULL ERROR:", error);

    console.error(
        "GOOGLE RESPONSE:",
        JSON.stringify(
            error.response?.data,
            null,
            2,
        ),
    );

    throw error;
  }
}

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
};
