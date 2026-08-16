/* ===================CLOUD FUNCTIONS===================*/
const {onCall, HttpsError} =
    require("firebase-functions/v2/https");

const {
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
} = require("./google-config");

const admin =
    require("firebase-admin");

const {google} = require("googleapis");

const crypto = require("node:crypto");

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
  updateCalendarEvent,
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
        if (!request.auth) {
          throw new HttpsError(
              "unauthenticated",
              "Authentication required.",
          );
        }

        const uid =
    request.auth.uid;

        const userDoc =
    await db
        .collection("users")
        .doc(uid)
        .get();

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

        const oauth2Client =
        await getAuthenticatedClient(
            tenantId,
        );


        const context =
    await loadShiftContext(
        "YOUR_SHIFT_ID",
    );

        const event =
    buildShiftCalendarEvent(
        context,
    );

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
            "Google response:",
            error.response?.data,
        );

        throw new Error(
            error.message,
        );
      }
    });

async function loadShiftContext(
    shiftId,
) {
  // TODO:
  // Load shift
  const shiftSnap =
    await db
        .collection("shifts")
        .doc(shiftId)
        .get();

  if (!shiftSnap.exists) {
    throw new Error(
        "Shift not found.",
    );
  }

  const shift =
    shiftSnap.data();

  // Load employee
  const employeeSnap =
    await db
        .collection("employees")
        .doc(shift.employeeId)
        .get();

  if (!employeeSnap.exists) {
    throw new Error(
        "Employee not found.",
    );
  }

  const employee =
    employeeSnap.data();
    // Load site
  const siteSnap =
    await db
        .collection("sites")
        .doc(shift.siteId)
        .get();

  if (!siteSnap.exists) {
    throw new Error(
        "Site not found.",
    );
  }

  const site =
    siteSnap.data();

  const context = {

    shiftId,

    shift,

    employeeId: shift.employeeId,

    employee,

    siteId: shift.siteId,

    site,

  };

  return context;
}

function normalizeDateTime(value) {
  return value.length === 16 ? `${value}:00` : value;
}

function buildShiftCalendarEvent(
    context,
) {
  const {
    shift,
    site,
  } = context;

  return {

    summary:
        `${shift.employeeName} - ${shift.siteName}`,

    description:
        `Officer: ${shift.employeeName}

        Site: ${shift.siteName}

        Classification: ${shift.classification}

        Status: ${shift.status}

        Address:
        ${site.address}
        ${site.city}, ${site.state} ${site.zip}

        Created by WorkForge`,

    location:
        `${site.address}, ${site.city}, ${site.state} ${site.zip}`,

    start: {
      dateTime: normalizeDateTime(shift.startTime),
      timeZone: "America/Chicago",
    },
    end: {
      dateTime: normalizeDateTime(shift.endTime),
      timeZone: "America/Chicago",
    },

  };
}

async function syncShiftToGoogleCalendar(
    shiftId,
) {
  const context =
        await loadShiftContext(
            shiftId,
        );

  const event =
        buildShiftCalendarEvent(
            context,
        );

  const oauth2Client =
    await getAuthenticatedClient(
        context.shift.tenantId,
    );

  let calendarEvent;

  const isUpdate =
    !!(
      context.shift.googleCalendar &&
        context.shift.googleCalendar.eventId
    );

  if (isUpdate) {
    calendarEvent =
        await updateCalendarEvent(

            oauth2Client,

            context.shift.googleCalendar.eventId,

            event,

        );
  } else {
    calendarEvent =
        await createCalendarEvent(

            oauth2Client,

            event,

        );
  }

  await db
      .collection("shifts")
      .doc(shiftId)
      .update({
        googleCalendar: {
          eventId: calendarEvent.id,
          htmlLink: calendarEvent.htmlLink,
          synced: true,
          syncedAt:
                    admin.firestore.FieldValue.serverTimestamp(),
        },
      });

  return calendarEvent;
}

async function deleteGoogleCalendarEvent(
    shiftId,
    tenantId,
) {
  const context =
        await loadShiftContext(
            shiftId,
        );

  if (
    !context.shift.googleCalendar ||
        !context.shift.googleCalendar.eventId
  ) {
    return {
      success: true,
      message: "No calendar event to delete.",
    };
  }

  const oauth2Client =
        await getAuthenticatedClient(
            tenantId,
        );

  try {
    await deleteCalendarEvent(
        oauth2Client,
        context.shift.googleCalendar.eventId,
    );
  } catch (error) {
    console.error(
        "Google Calendar delete failed:",
        error,
    );

    console.error(
        "Google response:",
        JSON.stringify(
            error.response?.data,
            null,
            2,
        ),
    );

    throw error;
  }
}

async function createGoogleMeeting(
    meetingId,
    tenantId,
) {
  // -------------------------
  // Load Meeting
  // -------------------------

  const meetingSnap =
      await db
          .collection("meetings")
          .doc(meetingId)
          .get();

  if (!meetingSnap.exists) {
    throw new Error(
        "Meeting not found.",
    );
  }

  const meeting =
      meetingSnap.data();

  // -------------------------
  // Tenant Validation
  // -------------------------

  if (
    meeting.tenantId !== tenantId
  ) {
    throw new Error(
        "You do not have access to this meeting.",
    );
  }

  // -------------------------
  // Meeting Location
  // -------------------------

  if (
    meeting.locationType !== "virtual" &&
    meeting.locationType !== "hybrid"
  ) {
    throw new Error(
        "Google Meet is only available for virtual or hybrid meetings.",
    );
  }
  // -------------------------
  // Attendees
  // -------------------------

  const attendeesSnap =
      await db
          .collection("meetings")
          .doc(meetingId)
          .collection("attendees")
          .get();

  if (attendeesSnap.empty) {
    throw new Error(
        "A meeting must have at least one attendee.",
    );
  }

  const attendees =
      attendeesSnap.docs
          .map((attendeeDoc) => {
            const attendee =
                attendeeDoc.data();

            if (
              !attendee.email ||
              typeof attendee.email !== "string"
            ) {
              return null;
            }

            return {

              email:
                  attendee.email.trim(),

              displayName:
                  attendee.name ||
                  undefined,

            };
          })
          .filter(Boolean);

  // -------------------------
  // Google Authentication
  // -------------------------

  const oauth2Client =
      await getAuthenticatedClient(
          tenantId,
      );

  // -------------------------
  // Meeting Times
  // -------------------------

  if (
    !meeting.startTime ||
  !meeting.endTime
  ) {
    throw new Error(
        "Meeting start and end times are required.",
    );
  }

  const startDate =
    meeting.startTime.toDate();

  const endDate =
    meeting.endTime.toDate();

  // -------------------------
  // Google Calendar Event
  // -------------------------

  const event = {

    summary:
        meeting.title,

    description:
        meeting.description ||
        "",

    start: {

      dateTime:
          startDate.toISOString(),

      timeZone:
          meeting.timezone,

    },

    end: {

      dateTime:
          endDate.toISOString(),

      timeZone:
          meeting.timezone,

    },

    attendees,

    conferenceData: {

      createRequest: {

        requestId:
            crypto.randomUUID(),

        conferenceSolutionKey: {

          type:
              "hangoutsMeet",

        },

      },

    },

  };

  // -------------------------
  // Create Google Event
  // -------------------------

  const createdEvent =
      await createCalendarEvent(

          oauth2Client,

          event,

          {
            conferenceDataVersion: 1,
          },

      );

  // -------------------------
  // Conference Information
  // -------------------------

  const conferenceData =
      createdEvent.conferenceData ||
      null;

  let meetLink =
      createdEvent.hangoutLink ||
      null;

  let conferenceId =
      null;

  if (conferenceData) {
    conferenceId =
        conferenceData.conferenceId ||
        null;

    if (!meetLink) {
      const entryPoints =
          conferenceData.entryPoints ||
          [];

      const videoEntryPoint =
          entryPoints.find(
              (entryPoint) =>
                entryPoint.entryPointType ===
                "video",
          );

      if (videoEntryPoint) {
        meetLink =
            videoEntryPoint.uri ||
            null;
      }
    }
  }

  // -------------------------
  // Google Calendar ID
  // -------------------------

  const integrationSnap =
      await db
          .collection(
              "tenantIntegrations",
          )
          .doc(tenantId)
          .get();

  const integration =
      integrationSnap.exists ?
          integrationSnap.data() :
          null;

  const googleCalendarId =
      integration?.primaryCalendarId ||
      "primary";

  // -------------------------
  // Save Google Data
  // -------------------------

  await db
      .collection("meetings")
      .doc(meetingId)
      .update({

        googleEventId:
            createdEvent.id ||
            null,

        googleCalendarId,

        meetLink,

        conferenceId,

        updatedAt:
            admin.firestore.FieldValue
                .serverTimestamp(),

      });

  // -------------------------
  // Return Result
  // -------------------------

  return {

    success: true,

    eventId:
        createdEvent.id ||
        null,

    calendarId:
        googleCalendarId,

    meetLink,

    conferenceId,

  };
}

async function updateGoogleMeeting(
    meetingId,
    tenantId,
    meetingData,
) {
  // -------------------------
  // Load Meeting
  // -------------------------

  const meetingSnap =
      await db
          .collection("meetings")
          .doc(meetingId)
          .get();

  if (!meetingSnap.exists) {
    throw new Error(
        "Meeting not found.",
    );
  }

  const meeting =
      meetingSnap.data();

  const updatedMeeting = {

    ...meeting,

    ...meetingData,

  };

  // -------------------------
  // Tenant Validation
  // -------------------------

  if (
    meeting.tenantId !== tenantId
  ) {
    throw new Error(
        "You do not have access to this meeting.",
    );
  }

  // -------------------------
  // Google Event
  // -------------------------

  if (
    !meeting.googleEventId
  ) {
    throw new Error(
        "Meeting does not have a Google Calendar event.",
    );
  }

  // -------------------------
  // Meeting Location
  // -------------------------

  if (
    meeting.locationType !== "virtual" &&
    meeting.locationType !== "hybrid"
  ) {
    throw new Error(
        "Google Meet is only available for virtual or hybrid meetings.",
    );
  }

  // -------------------------
  // Meeting Times
  // -------------------------

  if (
    !meeting.startTime ||
    !meeting.endTime
  ) {
    throw new Error(
        "Meeting start and end times are required.",
    );
  }

  // -------------------------
  // Attendees
  // -------------------------

  const attendeesSnap =
      await db
          .collection("meetings")
          .doc(meetingId)
          .collection("attendees")
          .get();

  const attendees =
      attendeesSnap.docs
          .map((attendeeDoc) => {
            const attendee =
                attendeeDoc.data();

            if (
              !attendee.email ||
              typeof attendee.email !== "string"
            ) {
              return null;
            }

            return {
              email:
                  attendee.email.trim(),

              displayName:
                  attendee.name ||
                  undefined,
            };
          })
          .filter(Boolean);

  // -------------------------
  // Google Authentication
  // -------------------------

  const oauth2Client =
      await getAuthenticatedClient(
          tenantId,
      );

  // -------------------------
  // Google Calendar Event
  // -------------------------

  const event = {

    summary:
        updatedMeeting.title,

    description:
        updatedMeeting.description ||
        "",

    start: {

      dateTime:
    new Date(
        updatedMeeting.startTime,
    ).toISOString(),

      timeZone:
            updatedMeeting.timezone,

    },

    end: {

      dateTime:
    new Date(
        updatedMeeting.endTime,
    ).toISOString(),

      timeZone:
            updatedMeeting.timezone,

    },

    attendees,

  };

  // -------------------------
  // Google Calendar ID
  // -------------------------

  const googleCalendarId =
      meeting.googleCalendarId ||
      "primary";

  // -------------------------
  // Update Google Event
  // -------------------------

  const updatedEvent =
      await updateCalendarEvent(

          oauth2Client,

          meeting.googleEventId,

          event,

          googleCalendarId,

      );

  // -------------------------
  // Return Result
  // -------------------------

  return {

    success: true,

    eventId:
        updatedEvent.id ||
        meeting.googleEventId,

    calendarId:
        googleCalendarId,

    meetLink:
        updatedEvent.hangoutLink ||
        meeting.meetLink ||
        null,

    conferenceId:
        meeting.conferenceId ||
        null,

  };
}

exports.deletePhysicalGoogleCalendarEvent =
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
            throw new HttpsError(
                "unauthenticated",
                "Authentication required.",
            );
          }

          const uid =
            request.auth.uid;

          const userDoc =
            await db
                .collection("users")
                .doc(uid)
                .get();

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

          const meetingId =
            request.data?.meetingId;

          if (
            typeof meetingId !== "string" ||
          !meetingId.trim()
          ) {
            throw new HttpsError(
                "invalid-argument",
                "Meeting ID is required.",
            );
          }

          const meetingRef =
            db
                .collection("meetings")
                .doc(meetingId);

          const meetingSnap =
            await meetingRef.get();

          if (!meetingSnap.exists) {
            throw new HttpsError(
                "not-found",
                "Meeting not found.",
            );
          }

          const meeting =
            meetingSnap.data();

          if (
            meeting.tenantId !== tenantId
          ) {
            throw new HttpsError(
                "permission-denied",
                "You do not have access to this meeting.",
            );
          }

          if (
            meeting.locationType !== "physical"
          ) {
            throw new HttpsError(
                "failed-precondition",
                "Calendar-only deletion is only "+
                "available for physical meetings.",
            );
          }

          const googleEventId =
            meeting.googleEventId;

          if (!googleEventId) {
            return {
              success: true,
              message:
                "No Google Calendar event to delete.",
            };
          }

          const oauth2Client =
            await getAuthenticatedClient(
                tenantId,
            );

          try {
            await deleteCalendarEvent(
                oauth2Client,
                googleEventId,
            );
          } catch (error) {
            console.error(
                "Google Calendar event delete failed:",
                error,
            );

            console.error(
                "Google response:",
                JSON.stringify(
                    error.response?.data,
                    null,
                    2,
                ),
            );

            throw new HttpsError(
                "internal",
                error.message ||
              "Unable to delete Google Calendar event.",
            );
          }

          return {
            success: true,
            eventId:
              googleEventId,
          };
        },
    );

exports.deleteGoogleMeeting =
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
        throw new HttpsError(
            "unauthenticated",
            "Authentication required.",
        );
      }

      const uid =
          request.auth.uid;

      const userDoc =
          await db
              .collection("users")
              .doc(uid)
              .get();

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

      const meetingId =
          request.data?.meetingId;

      if (
        typeof meetingId !== "string" ||
        !meetingId.trim()
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Meeting ID is required.",
        );
      }

      const meetingRef =
          db
              .collection("meetings")
              .doc(meetingId);

      const meetingSnap =
          await meetingRef.get();

      if (!meetingSnap.exists) {
        throw new HttpsError(
            "not-found",
            "Meeting not found.",
        );
      }

      const meeting =
          meetingSnap.data();

      if (
        meeting.tenantId !== tenantId
      ) {
        throw new HttpsError(
            "permission-denied",
            "You do not have access to this meeting.",
        );
      }

      const googleEventId =
          meeting.googleEventId;

      if (!googleEventId) {
        return {
          success: true,
          message:
              "No Google Calendar event to delete.",
        };
      }

      const oauth2Client =
          await getAuthenticatedClient(
              tenantId,
          );

      try {
        await deleteCalendarEvent(
            oauth2Client,
            googleEventId,
        );
      } catch (error) {
        console.error(
            "Google meeting delete failed:",
            error,
        );

        console.error(
            "Google response:",
            JSON.stringify(
                error.response?.data,
                null,
                2,
            ),
        );

        throw new HttpsError(
            "internal",
            error.message ||
            "Unable to delete Google meeting.",
        );
      }

      return {
        success: true,
        eventId:
            googleEventId,
      };
    },
);

async function createGoogleCalendarEvent(
    meetingId,
    tenantId,
) {
  // -------------------------
  // Load Meeting
  // -------------------------

  const meetingSnap =
      await db
          .collection("meetings")
          .doc(meetingId)
          .get();

  if (!meetingSnap.exists) {
    throw new Error(
        "Meeting not found.",
    );
  }

  const meeting =
      meetingSnap.data();

  // -------------------------
  // Tenant Validation
  // -------------------------

  if (
    meeting.tenantId !== tenantId
  ) {
    throw new Error(
        "You do not have access to this meeting.",
    );
  }

  // -------------------------
  // Meeting Location
  // -------------------------

  if (
    meeting.locationType !== "physical"
  ) {
    throw new Error(
        "Google Calendar-only events are only available for physical meetings.",
    );
  }

  // -------------------------
  // Attendees
  // -------------------------

  const attendeesSnap =
      await db
          .collection("meetings")
          .doc(meetingId)
          .collection("attendees")
          .get();

  if (attendeesSnap.empty) {
    throw new Error(
        "A meeting must have at least one attendee.",
    );
  }

  const attendees =
      attendeesSnap.docs
          .map((attendeeDoc) => {
            const attendee =
                attendeeDoc.data();

            if (
              !attendee.email ||
              typeof attendee.email !== "string"
            ) {
              return null;
            }

            return {
              email:
                  attendee.email.trim(),

              displayName:
                  attendee.name ||
                  undefined,
            };
          })
          .filter(Boolean);

  // -------------------------
  // Google Authentication
  // -------------------------

  const oauth2Client =
      await getAuthenticatedClient(
          tenantId,
      );

  // -------------------------
  // Meeting Times
  // -------------------------

  if (
    !meeting.startTime ||
    !meeting.endTime
  ) {
    throw new Error(
        "Meeting start and end times are required.",
    );
  }

  const startDate =
      meeting.startTime.toDate();

  const endDate =
      meeting.endTime.toDate();

  // -------------------------
  // Google Calendar Event
  // -------------------------

  const event = {

    summary:
        meeting.title,

    description:
        meeting.description ||
        "",

    location:
      meeting.location ||
      "",

    start: {
      dateTime:
          startDate.toISOString(),

      timeZone:
          meeting.timezone,
    },

    end: {
      dateTime:
          endDate.toISOString(),

      timeZone:
          meeting.timezone,
    },

    attendees,
  };

  // -------------------------
  // Google Calendar ID
  // -------------------------

  const integrationSnap =
      await db
          .collection(
              "tenantIntegrations",
          )
          .doc(tenantId)
          .get();

  const integration =
      integrationSnap.exists ?
          integrationSnap.data() :
          null;

  const googleCalendarId =
      integration?.primaryCalendarId ||
      "primary";

  // -------------------------
  // Create Google Event
  // -------------------------

  const createdEvent =
      await createCalendarEvent(
          oauth2Client,
          event,
      );

  // -------------------------
  // Save Google Data
  // -------------------------

  await db
      .collection("meetings")
      .doc(meetingId)
      .update({

        googleEventId:
            createdEvent.id ||
            null,

        googleCalendarId,

        meetLink:
            null,

        conferenceId:
            null,

        updatedAt:
            admin.firestore.FieldValue
                .serverTimestamp(),

      });

  // -------------------------
  // Return Result
  // -------------------------

  return {

    success: true,

    eventId:
        createdEvent.id ||
        null,

    calendarId:
        googleCalendarId,

    meetLink:
        null,

    conferenceId:
        null,

  };
}

exports.createGoogleCalendarEvent =
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
            throw new HttpsError(
                "unauthenticated",
                "Authentication required.",
            );
          }

          const uid =
            request.auth.uid;

          const userDoc =
            await db
                .collection("users")
                .doc(uid)
                .get();

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

          const meetingId =
            request.data?.meetingId;

          if (
            typeof meetingId !== "string" ||
          !meetingId.trim()
          ) {
            throw new HttpsError(
                "invalid-argument",
                "Meeting ID is required.",
            );
          }

          try {
            return await createGoogleCalendarEvent(
                meetingId,
                tenantId,
            );
          } catch (error) {
            console.error(
                "createGoogleCalendarEvent failed:",
                error,
            );

            console.error(
                "Google response:",
                JSON.stringify(
                    error.response?.data,
                    null,
                    2,
                ),
            );

            throw new HttpsError(
                "internal",
                error.message ||
              "Unable to create Google Calendar event.",
            );
          }
        },
    );

exports.createGoogleMeeting =
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
        throw new HttpsError(
            "unauthenticated",
            "Authentication required.",
        );
      }

      const uid =
          request.auth.uid;

      const userDoc =
          await db
              .collection("users")
              .doc(uid)
              .get();

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

      const meetingId =
          request.data?.meetingId;

      if (
        typeof meetingId !== "string" ||
        !meetingId.trim()
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Meeting ID is required.",
        );
      }

      try {
        return await createGoogleMeeting(
            meetingId,
            tenantId,
        );
      } catch (error) {
        console.error(
            "createGoogleMeeting failed:",
            error,
        );

        console.error(
            "Google response:",
            JSON.stringify(
                error.response?.data,
                null,
                2,
            ),
        );

        throw new HttpsError(
            "internal",
            error.message ||
            "Unable to create Google meeting.",
        );
      }
    },
);

async function updateGoogleCalendarEvent(
    meetingId,
    tenantId,
    meetingData,
) {
  // -------------------------
  // Load Meeting
  // -------------------------

  const meetingSnap =
      await db
          .collection("meetings")
          .doc(meetingId)
          .get();

  if (!meetingSnap.exists) {
    throw new Error(
        "Meeting not found.",
    );
  }

  const meeting =
      meetingSnap.data();

  const updatedMeeting = {
    ...meeting,
    ...meetingData,
  };

  // -------------------------
  // Tenant Validation
  // -------------------------

  if (
    meeting.tenantId !== tenantId
  ) {
    throw new Error(
        "You do not have access to this meeting.",
    );
  }

  // -------------------------
  // Meeting Location
  // -------------------------

  if (
    meeting.locationType !== "physical"
  ) {
    throw new Error(
        "Google Calendar-only events are only available for physical meetings.",
    );
  }

  // -------------------------
  // Google Event
  // -------------------------

  if (
    !meeting.googleEventId
  ) {
    throw new Error(
        "Meeting does not have a Google Calendar event.",
    );
  }

  // -------------------------
  // Meeting Times
  // -------------------------

  if (
    !updatedMeeting.startTime ||
    !updatedMeeting.endTime
  ) {
    throw new Error(
        "Meeting start and end times are required.",
    );
  }

  // -------------------------
  // Attendees
  // -------------------------

  const attendeesSnap =
      await db
          .collection("meetings")
          .doc(meetingId)
          .collection("attendees")
          .get();

  const attendees =
      attendeesSnap.docs
          .map((attendeeDoc) => {
            const attendee =
                attendeeDoc.data();

            if (
              !attendee.email ||
              typeof attendee.email !== "string"
            ) {
              return null;
            }

            return {
              email:
                  attendee.email.trim(),

              displayName:
                  attendee.name ||
                  undefined,
            };
          })
          .filter(Boolean);

  // -------------------------
  // Google Authentication
  // -------------------------

  const oauth2Client =
      await getAuthenticatedClient(
          tenantId,
      );

  // -------------------------
  // Google Calendar Event
  // -------------------------

  const event = {

    summary:
        updatedMeeting.title,

    description:
        updatedMeeting.description ||
        "",

    location:
    updatedMeeting.location ||
    "",

    start: {
      dateTime:
          new Date(
              updatedMeeting.startTime,
          ).toISOString(),

      timeZone:
          updatedMeeting.timezone,
    },

    end: {
      dateTime:
          new Date(
              updatedMeeting.endTime,
          ).toISOString(),

      timeZone:
          updatedMeeting.timezone,
    },

    attendees,

  };

  // -------------------------
  // Google Calendar ID
  // -------------------------

  const googleCalendarId =
      meeting.googleCalendarId ||
      "primary";

  // -------------------------
  // Update Google Event
  // -------------------------

  const updatedEvent =
      await updateCalendarEvent(
          oauth2Client,
          meeting.googleEventId,
          event,
          googleCalendarId,
      );

  // -------------------------
  // Return Result
  // -------------------------

  return {

    success: true,

    eventId:
        updatedEvent.id ||
        meeting.googleEventId,

    calendarId:
        googleCalendarId,

    meetLink:
        null,

    conferenceId:
        null,

  };
}

exports.updateGoogleCalendarEvent =
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
            throw new HttpsError(
                "unauthenticated",
                "Authentication required.",
            );
          }

          const uid =
            request.auth.uid;

          const userDoc =
            await db
                .collection("users")
                .doc(uid)
                .get();

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

          const meetingId =
            request.data?.meetingId;

          if (
            typeof meetingId !== "string" ||
          !meetingId.trim()
          ) {
            throw new HttpsError(
                "invalid-argument",
                "Meeting ID is required.",
            );
          }

          try {
            return await updateGoogleCalendarEvent(
                meetingId,
                tenantId,
                request.data,
            );
          } catch (error) {
            console.error(
                "updateGoogleCalendarEvent failed:",
                error,
            );

            console.error(
                "Google response:",
                JSON.stringify(
                    error.response?.data,
                    null,
                    2,
                ),
            );

            throw new HttpsError(
                "internal",
                error.message ||
              "Unable to update Google Calendar event.",
            );
          }
        },
    );

exports.updateGoogleMeeting =
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
        throw new HttpsError(
            "unauthenticated",
            "Authentication required.",
        );
      }

      const uid =
          request.auth.uid;

      const userDoc =
          await db
              .collection("users")
              .doc(uid)
              .get();

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

      const meetingId =
          request.data?.meetingId;

      if (
        typeof meetingId !== "string" ||
        !meetingId.trim()
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Meeting ID is required.",
        );
      }

      try {
        return await updateGoogleMeeting(
            meetingId,
            tenantId,
            request.data,
        );
      } catch (error) {
        console.error(
            "updateGoogleMeeting failed:",
            error,
        );

        console.error(
            "Google response:",
            JSON.stringify(
                error.response?.data,
                null,
                2,
            ),
        );

        throw new HttpsError(
            "internal",
            error.message ||
            "Unable to update Google meeting.",
        );
      }
    },
);


async function deleteCalendarEvent(
    oauth2Client,
    eventId,
) {
  const calendar =
        google.calendar({

          version: "v3",

          auth: oauth2Client,

        });

  await calendar.events.delete({

    calendarId: "primary",

    eventId,

  });
}

exports.syncShiftToGoogleCalendar =
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
        throw new HttpsError(
            "unauthenticated",
            "Authentication required.",
        );
      }

      const uid = request.auth.uid;

      const userDoc =
    await db
        .collection("users")
        .doc(uid)
        .get();

      if (!userDoc.exists) {
        throw new HttpsError(
            "permission-denied",
            "User profile not found.",
        );
      }

      const tenantId =
    userDoc.data().tenantId;

      return await syncShiftToGoogleCalendar(
          request.data.shiftId,
          tenantId,
      );
    });

exports.deleteGoogleCalendarEvent =
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
        throw new HttpsError(
            "unauthenticated",
            "Authentication required.",
        );
      }

      const uid =
        request.auth.uid;

      const userDoc =
        await db
            .collection("users")
            .doc(uid)
            .get();

      if (!userDoc.exists) {
        throw new HttpsError(
            "permission-denied",
            "User profile not found.",
        );
      }

      const tenantId =
        userDoc.data().tenantId;

      return await deleteGoogleCalendarEvent(
          request.data.shiftId,
          tenantId,
      );
    });

