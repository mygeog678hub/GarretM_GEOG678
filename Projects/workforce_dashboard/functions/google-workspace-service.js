const {google} = require("googleapis");

/**
 * Creates a Google Calendar event.
 *
 * @param {google.auth.OAuth2} oauth2Client
 * @param {Object} event
 * @return {Promise<Object>}
 */
async function createCalendarEvent(
    oauth2Client,
    event,
) {
  const calendar =
        google.calendar({
          version: "v3",
          auth: oauth2Client,
        });

  const response =
        await calendar.events.insert({
          calendarId: "primary",
          requestBody: event,
        });

  return response.data;
}

module.exports = {

  createCalendarEvent,

};
