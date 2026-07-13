import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    formatRelativeTime
} from "../utils.js";

export async function loadTodaysOfficers() {

    console.log(
    "Loader Profile:",
    window.currentUserProfile
);

console.log(
    "Loader Site ID:",
    window.currentUserProfile?.siteId
);


   try {

     const currentSiteId =
    window.currentUserProfile?.siteId;

if (!currentSiteId) {

    console.error(
        "Client Portal: No siteId available for current user."
    );

    return [];

}

        const today =
            new Date()
                .toISOString()
                .substring(0, 10);

        const q = query(
            collection(db, "shifts"),
            where("siteId", "==", currentSiteId)
        );


        const snapshot = await getDocs(q);

        const officers =
            snapshot.docs

                .map(doc => ({
                    shiftId: doc.id,
                    ...doc.data()
                }))

                .filter(shift =>
                    shift.startTime &&
                    shift.startTime.startsWith(today)
                )

                .map(shift => ({

                    shiftId: shift.shiftId,

                    employeeId: shift.employeeId,

                    name: shift.employeeName,

                    post: shift.siteName,

                    shift: `${shift.startTime} - ${shift.endTime}`,

                    status: shift.status || "Scheduled",

                    clock: "--"

                }));
       

        return officers;

    }
    catch (error) {

       console.error(
    "Client Portal: loadTodaysOfficers failed",
    error
);

        return [];

    }

}

export async function loadTodaysPatrolActivity() {

    const today =
        new Date()
            .toISOString()
            .substring(0, 10);

   const currentSiteId =
    window.currentUserProfile?.siteId;

if (!currentSiteId) {

    console.error(
        "Client Portal: No siteId available for current user."
    );

    return [];

}

const q = query(
    collection(db, "patrolEvents"),
    where("siteId", "==", currentSiteId)
);

const snapshot =
    await getDocs(q);

    const patrols =
        snapshot.docs
            .map(doc => {

                const event = doc.data();

                const eventDate =
                    event.timestamp?.toDate
                        ? event.timestamp
                            .toDate()
                            .toISOString()
                            .substring(0, 10)
                        : "";

                if (eventDate !== today)
                    return null;

                let type = "activity";
                let title = "Patrol Activity";

                switch (event.eventType) {

                    case "CHECKPOINT_COMPLETED":
                        type = "checkpoint";
                        title = "Checkpoint Completed";
                        break;

                    case "PATROL_STARTED":
                        type = "started";
                        title = "Patrol Started";
                        break;

                    case "PATROL_COMPLETED":
                        type = "completed";
                        title = "Patrol Completed";
                        break;

                    case "PATROL_OVERDUE":
                        type = "overdue";
                        title = "Patrol Overdue";
                        break;

                }

                return {

                    type,
                    title,
                    location:
                        event.checkpointName || "-",

                    time:
                        event.timestamp?.toDate
                            ? event.timestamp
                                .toDate()
                                .toLocaleTimeString([], {
                                    hour: "numeric",
                                    minute: "2-digit"
                                })
                            : ""

                };

            })
            .filter(Boolean);

    patrols.sort((a, b) => {

        // We'll improve sorting later if needed.
        return 0;

    }); 

    return patrols;

}

export async function loadTodaysIncidents() {

    const currentSiteId =
    window.currentUserProfile?.siteId;

if (!currentSiteId) {

    console.error(
        "Client Portal: No siteId available for current user."
    );

    return [];

}

const q = query(
    collection(db, "incidents"),
    where("siteId", "==", currentSiteId)
);

const snapshot =
    await getDocs(q);

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    return snapshot.docs

        .map(doc => ({

            id: doc.id,
            ...doc.data()

        }))

        .filter(incident => {

            if (!incident.createdAt)
                return false;

            return incident.createdAt.startsWith(today);

        })

        .sort((a, b) =>

            new Date(b.createdAt) -
            new Date(a.createdAt)

        )

       .map(incident => {

        return {

            id: incident.id,

            severity: incident.severity,

            title: incident.description,

            location: incident.siteName,

            reported: formatRelativeTime(
                incident.createdAt
            ),

            status: incident.status

        };

    });

}

export async function loadClientKPIs({
    officers,
    patrols,
    incidents,
    communications
}) {

    return {
        officers: officers.length,
        patrols: patrols.length,
        incidents: incidents.filter(
            i => i.status !== "resolved"
        ).length,
        communications: communications.length
    };

}


