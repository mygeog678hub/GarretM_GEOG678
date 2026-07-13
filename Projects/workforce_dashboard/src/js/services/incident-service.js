import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    serverTimestamp
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