/*********************************************************************
 * Scheduling Service
 *
 * RC3 Domain Service
 *
 * Responsibilities
 * ----------------
 * • Shift persistence
 * • Scheduling business rules
 * • Shift retrieval
 * • Realtime listeners
 *
 * Services own:
 * • Firestore
 * • Business rules
 * • Realtime listeners
 *
 * Services never own:
 * • DOM
 * • Rendering
 * • HTML
 * • CSS
 *********************************************************************/

/*********************************************************************
 * Imports
 *********************************************************************/

import { db } from "./firebase-config.js";

import {
    collection,
    onSnapshot,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/*********************************************************************
 * Shift Retrieval
 *********************************************************************/

/*********************************************************************
 * Imports
 *********************************************************************/

/*********************************************************************
 * Shift Retrieval
 *********************************************************************/

/*********************************************************************
 * Shift Creation
 *********************************************************************/

/*********************************************************************
 * Shift Workflow
 *********************************************************************/

export async function deleteScheduledShift({

    shiftId,

    recurring,

    seriesId

}) {

    try {

        if (!recurring) {

            await deleteDoc(
                doc(
                    db,
                    "shifts",
                    shiftId
                )
            );

        } else {

            const batch =
                writeBatch(db);

            const seriesQuery =
                query(
                    collection(
                        db,
                        "shifts"
                    ),
                    where(
                        "seriesId",
                        "==",
                        seriesId
                    )
                );

            const snapshot =
                await getDocs(
                    seriesQuery
                );

            const now =
                new Date();

            for (const shiftDoc of snapshot.docs) {

                const shift =
                    shiftDoc.data();

                if (
                    new Date(
                        shift.startTime
                    ) < now
                ) {
                    continue;
                }

                batch.delete(
                    shiftDoc.ref
                );

            }

            await batch.commit();

        }

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "Delete Shift Error:",
            error
        );

        return {

            success: false,

            message:
                "Unable to delete shift."

        };

    }

}

/*********************************************************************
 * Realtime Listeners
 *********************************************************************/

export function startShiftListener(callback) {

    return onSnapshot(
        collection(db, "shifts"),

        snapshot => {

            const shifts =
                snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

            callback({
                success: true,
                shifts
            });

        },

        error => {

            callback({
                success: false,
                message: "Unable to load shifts."
            });

        }
    );

}

export function startOpenShiftsListener(callback) {

    return onSnapshot(

        query(
            collection(db, "openShifts"),
            where("status", "==", "open")
        ),

        snapshot => {

            const openShifts =
                snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

            callback({
                success: true,
                openShifts
            });

        },

        error => {

            console.error(
                "Open Shift Listener:",
                error
            );

            callback({
                success: false,
                message:
                    "Unable to load open shifts."
            });

        }

    );

}

export function startClaimRequestsListener(callback) {

    return onSnapshot(

        query(
            collection(db, "openShifts"),
            where("status", "==", "claimed")
        ),

        snapshot => {

            const claimedShifts =
                snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

            callback({
                success: true,
                claimedShifts
            });

        },

        error => {

            console.error(
                "Claim Requests Listener:",
                error
            );

            callback({
                success: false,
                message:
                    "Unable to load claim requests."
            });

        }

    );

}

export function startOfficerOpenShiftsListener(callback) {

    return onSnapshot(

        query(
            collection(db, "openShifts"),
            where("status", "==", "open")
        ),

        snapshot => {

            const officerOpenShifts =
                snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

            callback({
                success: true,
                officerOpenShifts
            });

        },

        error => {

            console.error(
                "Officer Open Shifts Listener:",
                error
            );

            callback({
                success: false,
                message:
                    "Unable to load officer open shifts."
            });

        }

    );

}

export function startAssignmentListener(callback) {

    return onSnapshot(

        collection(
            db,
            "assignments"
        ),

        snapshot => {

            const assignments =
                snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(
                        assignment =>
                            !assignment.archived
                    );

            callback({
                success: true,
                assignments
            });

        },

        error => {

            console.error(
                "Assignment Listener:",
                error
            );

            callback({
                success: false,
                message:
                    "Unable to load assignments."
            });

        }

    );

}