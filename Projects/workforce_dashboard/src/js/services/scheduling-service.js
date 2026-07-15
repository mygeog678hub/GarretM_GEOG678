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
    writeBatch,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function timesOverlap(
  start1,
  end1,
  start2,
  end2
) {

  return (
    new Date(start1) <
    new Date(end2)
  ) &&
    (
      new Date(end1) >
      new Date(start2)
    );

}


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

export async function updateScheduledShift({

    id,
    employeeId,
    siteId,
    startTime,
    endTime,
    shiftPay,
    classification,
    editMode,
    editingRecurring,
    editingSeriesId,
    employees,
    sites,
    shifts

}) {

     const employee =
        employees.find(
          e => e.id === employeeId
        );
    
      console.log(employee);
      console.log(
        "securityLevel:",
        employee.securityLevel
      );
      console.log(
        "licenseLevel:",
        employee.licenseLevel
      );
    
      const levels = {
        "LVL 2": 2,
        "LVL 3": 3,
        "LVL 4": 4
      };
    
      const licenseMap = {
        "Non-Commissioned (Level II)": 2,
        "Commissioned (Level III)": 3,
        "Personal Protection (Level IV)": 4
      };
    
      const officerLevel =
        licenseMap[
        employee.licenseLevel
        ] || 0;
    
      const shiftLevel =
        levels[
        classification
        ] || 0;
    
      console.log(
        "Officer Level:",
        officerLevel
      );
    
      console.log(
        "Shift Level:",
        shiftLevel
      );
    
      if (
        officerLevel <
        shiftLevel
      ) {
        alert(
          `${employee.name} is not licensed for this assignment.`
        );
    
        return;
      }
    
      if (
        !employeeId ||
        !siteId ||
        !startTime ||
        !endTime
      ) {
        console.log({
          employeeId,
          siteId,
          startTime,
          endTime
        });
    
        alert(
          "Complete all fields."
        );
        return;
      }
    
      if (
        new Date(endTime) <=
        new Date(startTime)
      ) {
        alert(
          "End time must be after start time."
        );
        return;
      }
    
      const duplicate =
        shifts.some(
          shift =>
    
            shift.id !== id &&
    
            shift.employeeId ===
            employeeId &&
    
            shift.siteId ===
            siteId &&
    
            shift.startTime ===
            startTime &&
    
            shift.endTime ===
            endTime
        );
    
      if (duplicate) {
    
      return {
        success: false,
        message: "This shift already exists."
    };
    
        return;
    
      }  
    
    const conflict = shifts.some(shift => {
    
      if (shift.id === id) {
        return false; // Don't compare the shift to itself
      }
    
      if (shift.employeeId !== employeeId) {
        return false;
      }
    
      return timesOverlap(
        startTime,
        endTime,
        shift.startTime,
        shift.endTime
      );
    
    });
    
      if (conflict) {
    
       return {
        success: false,
        message: "Officer already scheduled during this time."
    };
    
        return;
    
      }
    
      const site =
        sites.find(
          s => s.id === siteId
        );
    
      const updateData = {
    
        employeeId,
    
        employeeName:
          employee.name,
    
        siteId,
    
        siteName:
          site.name,
    
        startTime,
    
        endTime,
    
        shiftPay,
    
        classification
    
      };

      if (
    !editingRecurring ||
    editMode === "occurrence"
  ) {

    await updateDoc(
      doc(db, "shifts", id),
      updateData
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
          editingSeriesId
        )
      );

    const snapshot =
      await getDocs(
        seriesQuery
      );

    const now =
      new Date();

    for (
      const shiftDoc of
      snapshot.docs
    ) {

      const shift =
        shiftDoc.data();

      // Preserve history
      if (
        new Date(
          shift.startTime
        ) < now
      ) {
        continue;
      }

      // Keep the original date for this occurrence
      const shiftDate =
        shift.startTime.split("T")[0];

      // Use the new times selected in the edit form
      const newStartTime =
        startTime.split("T")[1];

      const newEndTime =
        endTime.split("T")[1];

      const seriesUpdate = {

        employeeId,

        employeeName:
          employee.name,

        siteId,

        siteName:
          site.name,

        shiftPay,

        classification,

        startTime:
          `${shiftDate}T${newStartTime}`,

        endTime:
          `${shiftDate}T${newEndTime}`

      };

      batch.update(
        shiftDoc.ref,
        seriesUpdate
      );

    }

    await batch.commit();

  }

  return {
    success: true
};

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