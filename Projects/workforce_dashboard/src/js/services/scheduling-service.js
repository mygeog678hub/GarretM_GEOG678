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
    getDoc,
    deleteDoc,
    doc,
    writeBatch,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    calculateDistance,
    generateRecurringDates,
    applyTimeToDate,
    formatLocalDateTime,
    timesOverlap
} from "./scheduling-utils.js";




/*********************************************************************
 * Shift Retrieval
 *********************************************************************/

export function startOfficerOpenShiftListener(
    db,
    onUpdate
) {

    return onSnapshot(

        query(
            collection(db, "openShifts"),
            where("status", "==", "open")
        ),

        (snapshot) => {

            const openShifts =
                snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

            onUpdate(openShifts);

        }

    );

}

/*********************************************************************
 * Shift Retrieval
 *********************************************************************/

export async function claimMarketplaceShift(
    db,
    shiftId,
    employee
) {

    try {

        await updateDoc(
            doc(db, "openShifts", shiftId),
            {

                status: "claimed",

                claimedEmployeeId:
                    employee.id,

                claimedByName:
                    employee.name,

                claimedAt:
                    serverTimestamp()

            }
        );

        return {
            success: true,
            message: "Shift claimed successfully."
        };

    } catch (error) {

        console.error(error);

        return {
            success: false,
            message: "Unable to claim shift."
        };

    }

}

/*********************************************************************
 * Shift Creation
 *********************************************************************/

export async function createScheduledShift({
    data,
    employees,
    sites,
    shifts,
    companyProfile
}) {

  const {

    employeeId,
    siteId,

    startTime,
    endTime,

    classification,
    shiftPay,

    repeatEnabled,
    repeatDays,
    repeatEndDate

} = data;

    const employee =
    employees.find(
      e => e.id === employeeId
    ); 

     const site =
    sites.find(
      s => s.id === siteId
    );


if (!employee) {

    return {
        success: false,
        message: "Employee not found."
    };

}

if (!site) {

    return {
        success: false,
        message: "Site not found."
    };

}
    

  if (
  new Date(endTime) <=
  new Date(startTime)
) {

 return {
    success: false,
    message: "Shift end time must be after the start time."
};

  return;

} 

let generatedDates = [];

if (repeatEnabled) {

    generatedDates = generateRecurringDates(
        startTime,
        repeatDays,
        repeatEndDate
    );

}

  let mileageDistance = 0;
  let mileageIncentive = false;
  let mileageStatus =
    "Coordinates Missing";

  const mileageThreshold =
    companyProfile
      ?.mileageThreshold || 25;

  if (
    employee?.homeLat != null &&
    employee?.homeLng != null &&
    site?.lat != null &&
    site?.lng != null
  ) {
    const distanceMeters =
      calculateDistance(
        employee.homeLat,
        employee.homeLng,
        site.lat,
        site.lng
      );

    mileageDistance =
      Number(
        (
          distanceMeters *
          0.000621371
        ).toFixed(1)
      );

    mileageIncentive =
      mileageDistance >
      mileageThreshold;

    mileageStatus =
      "Calculated";

    console.log(
      "Mileage calculated:",
      {
        employee:
          employee.name,
        site:
          site.name,
        miles:
          mileageDistance,
        incentive:
          mileageIncentive
      }
    );

  } else {

    console.warn(
      "Mileage calculation skipped.",
      {
        employee:
          employee?.name,
        employeeCoords: {
          lat:
            employee?.homeLat,
          lng:
            employee?.homeLng
        },
        site:
          site?.name,
        siteCoords: {
          lat:
            site?.lat,
          lng:
            site?.lng
        }
      }
    );

    mileageDistance = null;
    mileageIncentive = false;
    mileageStatus = "Unavailable";
  }

 const duplicate  =
    shifts.some(
      shift =>

        shift.employeeId === employeeId &&

        shift.siteId === siteId &&

        shift.startTime === startTime &&

        shift.endTime === endTime
    );

  if (
  !repeatEnabled &&
  duplicate
) {

 return {
    success: false,
    message: "This shift already exists."
};

  return;

}

  const conflict =
    shifts.some(
      shift =>

        shift.employeeId ===
        employeeId &&

        timesOverlap(
          startTime,
          endTime,
          shift.startTime,
          shift.endTime
        )
    );

 if (
  !repeatEnabled &&
  conflict
) {

 return {
    success: false,
    message: "Officer already scheduled during this time."
};

  return;

} 

  const shiftData = {

    employeeId,

    employeeName:
      employee.name,

    licenseLevel:
      employee.licenseLevel || "",

    siteId,

    siteName:
      site.name,

    siteCategory:
      site.siteCategory || "other",

    classification,

    shiftPay,

    mileageDistance,
    mileageThreshold,
    mileageIncentive,
    mileageStatus,

    repeatEnabled,
    repeatDays,
    repeatEndDate,

    status:
      "Scheduled",

    createdAt:
      new Date().toISOString()

  };

  console.log("Saving shift:", {
  startTime,
  endTime
});

let createdShiftId = null;

  if (!repeatEnabled) {

    const shiftRef = await addDoc(
  collection(db, "shifts"),
  {
    ...shiftData,
    startTime,
    endTime
  }
);

createdShiftId = shiftRef.id;


  } else {

    const seriesId =
      crypto.randomUUID();

    console.log(
      `Creating ${generatedDates.length} recurring shifts`
    );

    for (const date of generatedDates) {

      const newStart =
        applyTimeToDate(
          startTime,
          date
        );

      const newEnd =
        applyTimeToDate(
          endTime,
          date
        );

        const occurrenceStart =
  formatLocalDateTime(
    newStart
  );

const occurrenceEnd =
  formatLocalDateTime(
    newEnd
  ); 

  const duplicate =
  shifts.some(
    shift =>

      shift.employeeId ===
        employeeId &&

      shift.siteId ===
        siteId &&

      shift.startTime ===
        occurrenceStart &&

      shift.endTime ===
        occurrenceEnd
  );

if (duplicate) {  

  continue;

}

const conflict =
  shifts.some(
    shift =>

      shift.employeeId ===
        employeeId &&

      timesOverlap(
        occurrenceStart,
        occurrenceEnd,
        shift.startTime,
        shift.endTime
      )
  );

if (conflict) {  

  continue;

}
      
      const shiftRef = await addDoc(
    collection(db, "shifts"),
    {
        ...shiftData,

        startTime:
            occurrenceStart,

        endTime:
            occurrenceEnd,

        seriesId
    }
); 

if (!createdShiftId) {

    createdShiftId = shiftRef.id;

}

    }

  }
return {
    success: true,
    shiftId: createdShiftId
};

}

export async function publishOpenShift(
    db,
    shiftData
) {

    const {
        siteId,
        startTime,
        endTime,
        shiftPay,
        classification,
        repeatEnabled,
        repeatDays,
        repeatEndDate
    } = shiftData;

    try {

    // validation
   if (!siteId) {

    return {
        success: false,
        message: "Please select a site."
    };

}

if (!startTime || !endTime) {

    return {
        success: false,
        message: "Please select the shift times."
    };

}

if (
    new Date(endTime) <=
    new Date(startTime)
) {

    return {
        success: false,
        message: "Shift end time must be after the start time."
    };

}

    // site lookup
    const siteDoc = await getDoc(
  doc(db, "sites", siteId)
);

if (!siteDoc.exists()) {
  return {
    success: false,
    message: "Site not found."
};
}

const siteData = siteDoc.data();

    // addDoc()
     await addDoc(
  collection(db, "openShifts"),
  {

    siteId,
    siteName: siteData.name,
siteCategory: siteData.siteCategory,

    startTime,
    endTime,

    shiftPay,
    classification,

    repeatEnabled,
    repeatDays,
    repeatEndDate,

    seriesId: null,

    status: "open",

    publishedAt: serverTimestamp(),

    createdAt: serverTimestamp()

  }
);

    // return { success, message }
    return {
    success: true,
    message: "Open Shift published successfully."
};
} catch (error) {

    console.error(error);

    return {
        success: false,
        message: "Unable to publish Open Shift."
    };

}
}

export async function approveMarketplaceClaim(
    db,
    openShiftId,
    appState
) {

    try {

            const {
          employees,
          sites,
          shifts,
          companyProfile
      } = appState;

        const openShiftRef =
            doc(db, "openShifts", openShiftId);

        const openShiftSnap =
            await getDoc(openShiftRef);

        if (!openShiftSnap.exists()) {

            return {
                success: false,
                message: "Open Shift not found."
            };

        }

        const openShift =
            openShiftSnap.data();

        // We'll add the next block here
        const shiftData = {

  employeeId:
    openShift.claimedEmployeeId,

  employeeName:
    openShift.claimedByName,

  siteId:
    openShift.siteId,

  startTime:
    openShift.startTime,

  endTime:
    openShift.endTime,

  classification:
    openShift.classification,

  shiftPay:
    openShift.shiftPay,

  repeatEnabled:
    openShift.repeatEnabled || false,

  repeatDays:
    openShift.repeatDays || [],

  repeatEndDate:
    openShift.repeatEndDate || null,

  seriesId:
    openShift.seriesId || null

};

const result =
    await createScheduledShift({
        data: shiftData,
        employees,
        sites,
        shifts,
        companyProfile
    });

if (!result.success) {

  return result;

}

await updateDoc(
  openShiftRef,
  {
    status: "assigned",
    shiftId: result.shiftId,
    approvedAt: new Date().toISOString()
  }
);

return {
    success: true,
    message: "Shift approved and added to the schedule.",
    openShift,
    shiftId: result.shiftId
};

    } catch (error) {

        console.error(error);

        return {
            success: false,
            message: "Unable to approve Marketplace claim."
        };

    }

}

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