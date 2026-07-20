/*********************************************************************
 * IMPORTANT
 *
 * This service is the reference architecture for all remaining RC3
 * domain services.
 *
 * Services own:
 * • Firestore
 * • Business rules
 * • Validation
 * • Data transformation
 * • Realtime listeners
 *
 * Services never own:
 * • DOM
 * • HTML
 * • CSS
 * • Rendering
 * • alert()
 * • confirm()
 * • prompt()
 *
 * All service operations return structured results.
 *********************************************************************/

/*********************************************************************
 * Incident Service
 *
 * RC3 Reference Implementation
 *
 * Responsibilities
 * ----------------
 * • Firestore persistence
 * • Business rules
 * • Incident workflows
 * • Data retrieval
 * • Realtime listeners
 * • Number generation
 *
 * This service owns all Incident domain data access.
 * UI controllers are responsible only for user interaction
 * and rendering.
 *********************************************************************/


/*********************************************************************
 * Imports
 *********************************************************************/

import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    query,
    where,
    updateDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/*********************************************************************
 * Incident Creation
 *********************************************************************/

export async function createIncidentAlert({
  siteId,
  severity,
  description,
  reportedBy
}) {

  const site = sites.find(
    s => s.id === siteId
  );

  if (!site) {

    return {
      success: false,
      message: "Unable to locate site."
    };

  }

  if (!description) {

    return {
      success: false,
      message: "Description required."
    };

  }

  try {

    const incidentRef =
      await addDoc(
        collection(db, "incidents"),
        {

          siteId,

          siteName:
            site.name,

          severity,

          description,

          reportedBy:
            reportedBy || "Unknown",

            tenantId: window.currentUserProfile.tenantId,

          createdAt:
  serverTimestamp()

        }
      );

await logActivity(
  siteId,
  "incident",
  `🚨 ${severity} | ${site.name} | ${description}`,
  reportedBy
);

    return {

      success: true,

      incidentId:
        incidentRef.id,

      message:
        "Incident reported."

    };

  }

  catch (error) {

    console.error(
      "Error creating incident:",
      error
    );

    return {

      success: false,

      message:
        "Unable to report incident."

    };

  }

}

export async function saveIncidentDraftRecord(
  editingId,
  incidentData
) {

  try {

    if (editingId) {

      await updateDoc(
        doc(
          db,
          "incidentReports",
          editingId
        ),
        {
          ...incidentData,

          status: "draft",

          lastEdited:
            serverTimestamp()
        }
      );

      return {

        success: true,

        incidentId:
          editingId

      };

    }

    const docRef =
      await addDoc(
        collection(
          db,
          "incidentReports"
        ),
        {
          ...incidentData,

          caseNumber: null,

          tenantId: window.currentUserProfile.tenantId,

          status: "draft",

          createdAt:
            serverTimestamp(),

          lastEdited:
            serverTimestamp(),

          submittedAt: null,

          approvedAt: null,
          approvedBy: null,
          approvedByName: null,

          returnedAt: null,
          returnedBy: null,
          returnedByName: null,
          returnComments: "",

          voidedAt: null,
          voidedBy: null,
          voidedByName: null,
          voidReason: "",

          reviewHistory: []

        }
      );

    return {

      success: true,

      incidentId:
        docRef.id

    };

  } catch (error) {

    console.error(
      "Error saving incident draft:",
      error
    );

    return {

      success: false,

      message:
        "Unable to save incident draft."

    };

  }

}

export async function saveIncidentAttachments(

  incidentId,
  photos

) {

  try {

    for (const photo of photos) {

      await addDoc(
        collection(
          db,
          "incidentReports",
          incidentId,
          "attachments"
        ),
        photo
      );

    }

    return {

      success: true

    };

  } catch (error) {

    console.error(
      "Error saving incident attachments:",
      error
    );

    return {

      success: false,

      message:
        "Unable to save incident attachments."

    };

  }

}

export async function saveIncidentSupplement({

  incidentId,
  supplementId,
  caseNumber,
  narrative,
  officerId,
  officerName

}) {

  try {

    await setDoc(
      doc(
        db,
        "incidentReports",
        incidentId,
        "supplements",
        supplementId
      ),
      {
        incidentId,

        caseNumber,

        supplementId,

        reportType:
          "Supplement",

        narrative,

        officerId,

        officerName,

        createdAt:
          serverTimestamp()
      }
    );

    return {

      success: true

    };

  } catch (error) {

    console.error(
      "Error saving supplement:",
      error
    );

    return {

      success: false,

      message:
        "Unable to save supplement."

    };

  }

}

/*********************************************************************
 * Incident Retrieval
 *********************************************************************/

export async function loadIncidentDraft(
  reportId
) {

  try {

    const snap =
      await getDoc(
        doc(
          db,
          "incidentReports",
          reportId
        )
      );

    if (!snap.exists()) {

      return {

        success: false,

        message:
          "Draft not found."

      };

    }

    return {

      success: true,

      report: {

        id: snap.id,

        ...snap.data()

      }

    };

  } catch (error) {

    console.error(
      "Error loading draft:",
      error
    );

    return {

      success: false,

      message:
        "Unable to load draft."

    };

  }

}


export async function loadIncidentReviewQueueData() {

  try {

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "incidentReports"
          ),
          where(
            "status",
            "==",
            "submitted"
          ),
          orderBy(
            "submittedAt",
            "desc"
          )
        )
      );

    const incidentReports =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    return {

      success: true,

      incidentReports

    };

  } catch (error) {

    console.error(
      "Review Queue Error:",
      error
    );

    return {

      success: false,

      message:
        "Error loading review queue."

    };

  }

}

export async function loadIncidentAttachments(
  incidentId
) {

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "incidentReports",
          incidentId,
          "attachments"
        )
      );

    const attachments =
      snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    return {

      success: true,

      attachments

    };

  } catch (error) {

    console.error(
      "Error loading incident attachments:",
      error
    );

    return {

      success: false,

      message:
        "Unable to load incident attachments."

    };

  }

}

export async function loadIncidentSupplements(
  incidentId
) {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "incidentReports",
          incidentId,
          "supplements"
        )
      );

    const supplements =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    return {

      success: true,

      supplements

    };

  } catch (error) {

    console.error(
      "Error loading supplements:",
      error
    );

    return {

      success: false,

      message:
        "Unable to load supplements."

    };

  }

}

export async function loadIncidentReportsData() {

  try {

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "incidentReports"
          ),
          orderBy(
            "createdAt",
            "desc"
          )
        )
      );

    const incidentReports =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    return {

      success: true,

      incidentReports

    };

  } catch (error) {

    console.error(
      "Error loading incidents:",
      error
    );

    return {

      success: false,

      message:
        "Error loading incident reports."

    };

  }

}


export async function loadIncidentReviewHistory(
  reportId
) {

  try {

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "incidentReports",
            reportId,
            "history"
          ),
          orderBy(
            "createdAt",
            "asc"
          )
        )
      );

    const history =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    return {

      success: true,

      history

    };

  } catch (error) {

    console.error(
      "Error loading review history:",
      error
    );

    return {

      success: false,

      message:
        "Unable to load review history."

    };

  }

}


/*********************************************************************
 * Incident Workflow
 *********************************************************************/

export async function approveIncidentReport({
  reportId,
  approvedBy,
  approvedByName
}) {

  try {

    await updateDoc(
      doc(
        db,
        "incidentReports",
        reportId
      ),
      {
        status: "approved",

        approvedAt:
          serverTimestamp(),

        approvedBy,

        approvedByName
      }
    );

    return {

      success: true

    };

  } catch (error) {

    console.error(
      "Approve Incident Error:",
      error
    );

    return {

      success: false,

      message:
        "Unable to approve report."

    };

  }

}

export async function returnIncidentReport({

    reportId,

    comments,

    returnedBy,

    returnedByName

}){

  try {

    await updateDoc(
      doc(
        db,
        "incidentReports",
        reportId
      ),
     {
    status: "returned",

    supervisorComments:
        comments,

    returnComments:
        comments,

    returnedAt:
        serverTimestamp(),

    returnedBy,

    returnedByName
}
    );

    const reportSnap =
      await getDoc(
        doc(
          db,
          "incidentReports",
          reportId
        )
      );

    return {

      success: true,

      report:
        reportSnap.data()

    };

  } catch (error) {

    console.error(
      "Return Incident Error:",
      error
    );

    return {

      success: false,

      message:
        "Unable to return report."

    };

  }

}

export async function voidIncidentReport(
    reportId,
    reason,
    currentEmployee
) {
    try {

        await updateDoc(
            doc(db, "incidentReports", reportId),
            {
                status: "voided",
                voidReason: reason,
                voidedAt: serverTimestamp(),
                voidedBy: currentEmployee?.id || "",
                voidedByName:
                    currentEmployee?.name ||
                    "Supervisor"
            }
        );

        const historyResult =
    await addIncidentReviewHistory({
        reportId,
        action: "Voided",
        comments: reason,
        by:
            currentEmployee?.name ||
            currentEmployee?.fullName ||
            "Supervisor",
        byId:
            currentEmployee?.id || ""
    });

if (!historyResult.success) {
    return historyResult;
}

       await logActivity(
    reportId,
    "incident",
    "Incident report voided",
    currentEmployee?.name || "Supervisor",
    "incident",
    {
        employeeId: currentEmployee?.id || "",
        officerName:
            currentEmployee?.name ||
            currentEmployee?.fullName ||
            "Supervisor"
    }
);

        return {
            success: true
        };

    } catch (error) {

        console.error(
            "Error voiding incident:",
            error
        );

        return {
            success: false,
            message:
                "Unable to void incident."
        };
    }
}


export async function resolveIncidentRecord({
    id,
    resolution,
    resolvedBy
}) {

    try {

        const incidentRef =
            doc(
                db,
                "incidents",
                id
            );

        const snap =
            await getDoc(
                incidentRef
            );

        if (!snap.exists()) {

            return {
                success: false,
                message:
                    "This incident no longer exists."
            };

        }

        await updateDoc(
            incidentRef,
            {
                status: "Resolved",

                resolution:
                    resolution.trim(),

                resolvedBy,

                resolvedAt:
                    new Date()
                        .toISOString()
            }
        );

        return {
            success: true
        };

    } catch (err) {

        console.error(err);

        return {
            success: false,
            message:
                "Failed to resolve incident."
        };

    }

}


export async function addIncidentReviewHistory({
  reportId,
  action,
  comments = "",
  by,
  byId
}) {

  try {

    await addDoc(
      collection(
        db,
        "incidentReports",
        reportId,
        "history"
      ),
      {
        action,
        comments,

        by,

        byId,

        createdAt:
          serverTimestamp()
      }
    );

    return {

      success: true

    };

  } catch (error) {

    console.error(
      "Error adding incident history:",
      error
    );

    return {

      success: false,

      message:
        "Unable to add review history."

    };

  }

}


/*********************************************************************
 * Number Generation
 *********************************************************************/

export async function generateIncidentCaseNumber() {

  try {

    const currentYear =
      new Date().getFullYear();

    const counterRef =
      doc(
        db,
        "counters",
        "incidentCounter"
      );

    const snap =
      await getDoc(counterRef);

    let year =
      currentYear;

    let currentNumber =
      1;

    if (snap.exists()) {

      const data =
        snap.data();

      year =
        data.year || currentYear;

      currentNumber =
        data.currentNumber || 1;

      if (year !== currentYear) {

        year =
          currentYear;

        currentNumber =
          1;

      }

    }

    const caseNumber =
      `IC-${year}${String(
        currentNumber
      ).padStart(5, "0")}`;

    await setDoc(
      counterRef,
      {
        year,
        currentNumber:
          currentNumber + 1
      }
    );

    return {

      success: true,

      caseNumber

    };

  } catch (error) {

    console.error(
      "Error generating incident case number:",
      error
    );

    return {

      success: false,

      message:
        "Unable to generate incident case number."

    };

  }

}

export async function getNextSupplementNumber(
  incidentId
) {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "incidentReports",
          incidentId,
          "supplements"
        )
      );

    const supplementNumber =
      String(
        snapshot.size + 1
      ).padStart(3, "0");

    return {

      success: true,

      supplementNumber

    };

  } catch (error) {

    console.error(
      "Error generating supplement number:",
      error
    );

    return {

      success: false,

      message:
        "Unable to determine the next supplement number."

    };

  }

}



/*********************************************************************
 * Realtime Listeners
 *********************************************************************/

export function startIncidentReportsListener(callback) {

  return onSnapshot(
    query(
      collection(
        db,
        "incidentReports"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    ),
    snapshot => {

      const incidentReports =
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      callback({
        success: true,
        incidentReports
      });

    },
    error => {

      console.error(
        "Incident Reports listener error:",
        error
      );

      callback({
        success: false,
        message:
          "Unable to load incident reports."
      });

    }
  );

}

export function startIncidentsListener(callback) {

  return onSnapshot(
    collection(
      db,
      "incidents"
    ),
    snapshot => {

      const incidents =
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      callback({
        success: true,
        incidents
      });

    },
    error => {

      console.error(
        "Incidents listener error:",
        error
      );

      callback({
        success: false,
        message:
          "Unable to load incidents."
      });

    }
  );

}