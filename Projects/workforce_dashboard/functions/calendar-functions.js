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

    shift,

    employee,

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
    tenantId,
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
            tenantId,
        );

  let calendarEvent;

  if (
    context.shift.googleCalendar &&
    context.shift.googleCalendar.eventId
  ) {
    console.log(
        "Updating existing Google Calendar event...",
    );

    calendarEvent =
        await updateCalendarEvent(

            oauth2Client,

            context.shift.googleCalendar.eventId,

            event,

        );
  } else {
    console.log(
        "Creating new Google Calendar event...",
    );

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
