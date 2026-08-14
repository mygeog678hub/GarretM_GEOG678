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

