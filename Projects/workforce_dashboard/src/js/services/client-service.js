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
    where(
        "tenantId",
        "==",
        window.currentUserProfile.tenantId
    ),
    where(
        "siteId",
        "==",
        currentSiteId
    )
);


        const snapshot = await getDocs(q);
        
        const timeEntryQuery = query(
    collection(db, "timeEntries"),
    where(
        "tenantId",
        "==",
        window.currentUserProfile.tenantId
    ),
    where(
        "siteId",
        "==",
        currentSiteId
    ),
    where(
        "status",
        "==",
        "Clocked In"
    )
);

const timeSnapshot =
    await getDocs(timeEntryQuery);

const activeEntries =
    new Map();

timeSnapshot.forEach(doc => {

    const entry = doc.data();

    activeEntries.set(
        entry.employeeId,
        entry
    );

});

window.activeTimeEntries =
    activeEntries;

snapshot.docs.forEach(doc => {

});

        const officers =
            snapshot.docs       

                .map(doc => {

    const data = doc.data();

    return {

        shiftId: doc.id,

        employeeId: data.employeeId,

        employeeName: data.employeeName,

        siteId: data.siteId,

        siteName: data.siteName,

        startTime: data.startTime,

        endTime: data.endTime,

        status: data.status

    };

})

                .filter(shift =>
                    shift.startTime &&
                    shift.startTime.startsWith(today)
                )

               .map(shift => {

    const activeEntry =
        activeEntries.get(
            shift.employeeId
        );

    return {

        shiftId: shift.shiftId,

        employeeId: shift.employeeId,

        name: shift.employeeName,

        post: shift.siteName,

        shift:
            `${formatShiftTime(shift.startTime)} - ${formatShiftTime(shift.endTime)}`,

        status:
            shift.status || "Scheduled",

        clock:
            activeEntry
                ? formatTimeOnPost(
                    activeEntry.clockIn
                )
                : "--"

    };

});
       

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

export function formatTimeOnPost(clockIn) {

    if (!clockIn) return "--";

    const start =
        clockIn?.toDate
            ? clockIn.toDate()
            : new Date(clockIn);

    const elapsed =
        Math.floor(
            (Date.now() - start.getTime()) / 60000
        );

    const hours =
        Math.floor(elapsed / 60);

    const minutes =
        elapsed % 60;

    if (hours === 0) {
        return `${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
}

function formatShiftTime(dateTime) {

    if (!dateTime) return "--";

    const date =
        dateTime?.toDate
            ? dateTime.toDate()
            : new Date(dateTime);

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });

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
    where(
        "tenantId",
        "==",
        window.currentUserProfile.tenantId
    ),
    where(
        "siteId",
        "==",
        currentSiteId
    )
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

    timestamp:
        event.timestamp,

    time:
        event.timestamp?.toDate()
            .toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            })

};

            })
            .filter(Boolean);

   patrols.sort((a, b) =>

    b.timestamp.toMillis() -
    a.timestamp.toMillis()

);

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
    where(
        "tenantId",
        "==",
        window.currentUserProfile.tenantId
    ),
    where(
        "siteId",
        "==",
        currentSiteId
    )
);

const snapshot =
    await getDocs(q);

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    return snapshot.docs

      .map(doc => {

    const data = doc.data();

    return {

        id: doc.id,

        siteId: data.siteId,

        siteName: data.siteName,

        status: data.status,

        severity: data.severity,

        description: data.description,

        createdAt: data.createdAt

    };

})

        .filter(incident => {

    if (!incident.createdAt)
        return false;

    const incidentDate =
        incident.createdAt?.toDate
            ? incident.createdAt
                .toDate()
                .toISOString()
                .split("T")[0]
            : "";

    return incidentDate === today;

})

        .sort((a, b) =>

    b.createdAt.toMillis() -
    a.createdAt.toMillis()

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

            status: incident.status || "Open"

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
        patrols:
    patrols.filter(
        patrol =>
            patrol.type === "completed"
    ).length,
     incidents: incidents.filter(
    i => (i.status || "").toLowerCase() !== "resolved"
).length,
        communications: communications.length
    };

}


