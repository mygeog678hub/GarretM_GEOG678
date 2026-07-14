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

          createdAt:
            new Date().toISOString()

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