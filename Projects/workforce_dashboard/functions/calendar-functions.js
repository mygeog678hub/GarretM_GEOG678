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
  console.log("=== syncShiftToGoogleCalendar ===");

  console.log("Loading context...");

  const context =
        await loadShiftContext(
            shiftId,
        );

  console.log("Context loaded.");

  console.log(
      JSON.stringify(
          context,
          null,
          2,
      ),
  );

  console.log("Building event...");

  const event =
        buildShiftCalendarEvent(
            context,
        );

  console.log("Event built.");

  console.log(
      JSON.stringify(
          event,
          null,
          2,
      ),
  );

  console.log("Authenticating...");

  const oauth2Client =
        await getAuthenticatedClient(
            tenantId,
        );

  console.log("Authenticated.");

  console.log("Creating Google event...");

  const createdEvent =
        await createCalendarEvent(
            oauth2Client,
            event,
        );

  console.log("Google event created.");

  console.log(
      JSON.stringify(
          createdEvent,
          null,
          2,
      ),
  );

  await db
      .collection("shifts")
      .doc(shiftId)
      .update({
        googleCalendar: {
          eventId: createdEvent.id,
          htmlLink: createdEvent.htmlLink,
          synced: true,
          syncedAt:
                    admin.firestore.FieldValue.serverTimestamp(),
        },
      });

  console.log("Firestore updated.");

  return createdEvent;
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
