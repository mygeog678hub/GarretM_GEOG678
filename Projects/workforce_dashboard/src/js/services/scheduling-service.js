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

import {
    syncShiftToGoogleCalendar,
    deleteGoogleCalendarEvent,
} from "./google-workspace-service.js";




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
    companyProfile,
    currentUserProfile
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

const officerLevel = getSecurityLevel(employee.securityLevel);
const shiftLevel = getSecurityLevel(classification);

if (officerLevel < shiftLevel) {
  return {
    success: false,
    message: "Officer is not licensed for this assignment."
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

const now = new Date();

let pastShiftOverride = false;

if (new Date(startTime) < now) {

  const role =
    currentUserProfile?.role;

  const canOverride =
    role === "Admin" ||
    role === "Supervisor";

  if (!canOverride) {

    return {
      success: false,
      message: "Cannot create a shift in the past."
    };

  }

  const approved = confirm(
    "This shift begins in the past.\n\n" +
    "Do you want to create it anyway?"
  );

  if (!approved) {

    return {
      success: false,
      message: "Shift creation cancelled."
    };

  }

  pastShiftOverride = true;

}

let longShiftOverride = false;

const durationHours =
  (new Date(endTime) - new Date(startTime)) / 3600000;

const standardHours = 8;
const maxHours = 24;

if (durationHours > maxHours) {

  return {
    success: false,
    message: `Shift duration cannot exceed ${maxHours} hours.`
  };

}

if (durationHours > standardHours) {

  const role =
    currentUserProfile?.role;    

  const canOverride =
    role === "Admin" ||
    role === "Supervisor";

  if (!canOverride) {

    return {
      success: false,
      message:
        `Shifts longer than ${standardHours} hours require supervisor approval.`
    };

  }

  const approved = confirm(
    `This shift is ${durationHours.toFixed(1)} hours long.\n\n` +
    `Do you want to override the standard ${standardHours}-hour limit?`
  );

  if (!approved) {

    return {
      success: false,
      message: "Shift creation cancelled."
    };

  }

  longShiftOverride = true;

}

let generatedDates = [];

if (repeatEnabled) {

    generatedDates = generateRecurringDates(
        startTime,
        repeatDays,
        repeatEndDate
    );

}

const originalStart = new Date(startTime);
const originalEnd = new Date(endTime);

const overnight =
  originalEnd.toDateString() !==
  originalStart.toDateString();

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

} 

  const shiftData = {

    employeeId,

    employeeName:
      employee.name,

    securityLevel:
      employee.securityLevel || "",

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

    tenantId:
    window.currentUserProfile.tenantId,

    pastShiftOverride,

pastShiftOverrideBy:
  pastShiftOverride
    ? currentUserProfile.uid
    : null,

pastShiftOverrideAt:
  pastShiftOverride
    ? new Date().toISOString()
    : null,

overrideApproved:
  longShiftOverride,

overrideApprovedBy:
  longShiftOverride
    ? currentUserProfile.uid
    : null,

overrideApprovedAt:
  longShiftOverride
    ? new Date().toISOString()
    : null,

    status:
      "Scheduled",

    createdAt:
      new Date().toISOString()

  }; 

let createdShiftId = null;
const createdShiftIds = [];

let createdCount = 0;
const conflicts = [];

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

      if (overnight) {
        newEnd.setDate(
          newEnd.getDate() + 1
        );
      }

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

  conflicts.push(occurrenceStart);

  continue;

}
      
   const shiftRef = await addDoc(
    collection(db, "shifts"),
    {
        ...shiftData,
        startTime: occurrenceStart,
        endTime: occurrenceEnd,
        seriesId
    }
);

createdShiftIds.push(
    shiftRef.id
);

createdCount++;

if (!createdShiftId) {
    createdShiftId = shiftRef.id;
}

createdCount++;

if (!createdShiftId) {

    createdShiftId = shiftRef.id;

}

    }

  }
if (repeatEnabled) {

    if (createdCount === 0) {

        return {
            success: false,
            message: "Officer is already scheduled for all selected occurrences."
        };

    }

    if (conflicts.length > 0) {

        return {
            success: true,
            partialSuccess: true,
            message:
                `${createdCount} recurring shift(s) created. ` +
                `${conflicts.length} conflicting occurrence(s) were skipped.`,
            shiftId: createdShiftId
        };

    }

}

if (repeatEnabled) {

    for (const shiftId of createdShiftIds) {

        try {

            await syncShiftToGoogleCalendar(
                shiftId        
            );

        } catch (error) {

            console.error(
                `Google Calendar sync failed for recurring shift ${shiftId}:`,
                error
            );

        }

    }

} else if (createdShiftId) {

    try {

        await syncShiftToGoogleCalendar(
            createdShiftId
        );

    } catch (error) {

        console.error(
            "Google Calendar sync failed:",
            error
        );

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

// Recurring shift validation
if (repeatEnabled) {

    if (repeatDays.length === 0) {

        return {
            success: false,
            message: "Please select at least one repeat day."
        };

    }

    if (!repeatEndDate) {

        return {
            success: false,
            message: "Please select a repeat end date."
        };

    }

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

    tenantId: window.currentUserProfile.tenantId,

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

    seriesId,

    tenantId

}) {

    try {

        if (!recurring) {          

            // Remove Google Calendar event first.
// Continue even if Google deletion fails.

try {  

    await deleteGoogleCalendarEvent(
        shiftId
    );

} catch (error) {

    console.error(
        "Google Calendar delete failed:",
        error
    );
    

}

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
              collection(db, "shifts"),
              where("tenantId", "==", tenantId),
              where("seriesId", "==", seriesId)
              
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

    // Preserve history
    if (
        new Date(shift.startTime) < now
    ) {
        continue;
    }

    console.log(
        "Deleting recurring shift:",
        shiftDoc.id,
        shift.startTime,
        shift.googleCalendar?.eventId
    );

    try {

        await deleteGoogleCalendarEvent(
            shiftDoc.id
        );

    } catch (error) {

        console.error(
            `Google Calendar delete failed for recurring shift ${shiftDoc.id}:`,
            error
        );

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

function getSecurityLevel(value) {
  const levels = {
    "LVL 2": 2,
    "LVL 3": 3,
    "LVL 4": 4
  };

  return levels[value] || 0;
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
    shifts,
    tenantId,
    currentUserProfile

}) {

     const employee =
        employees.find(
          e => e.id === employeeId
        );

        if (!employee) {

    return {
        success: false,
        message: "Employee not found."
    };

}    
    
    const officerLevel = getSecurityLevel(employee.securityLevel);
    const shiftLevel = getSecurityLevel(classification);
     
    
      if (
        officerLevel <
        shiftLevel
      ) {
        return {
    success: false,
    message: "Officer is not licensed for this assignment."
};   
        
      }
    
      if (
    !employeeId ||
    !siteId ||
    !startTime ||
    !endTime
) {

    return {
        success: false,
        message: "Complete all fields."
    };

}
    
     if (
    new Date(endTime) <=
    new Date(startTime)
) {

    return {
        success: false,
        message: "End time must be after start time."
    };

}

const durationHours =
  (new Date(endTime) - new Date(startTime)) / 3600000;

const standardHours = 8;
const maxHours = 24;

if (durationHours > maxHours) {

    return {
        success: false,
        message: `Shift duration cannot exceed ${maxHours} hours.`
    };

}

if (durationHours > standardHours) {

    const role = currentUserProfile?.role;

    const canOverride =
        role === "Admin" ||
        role === "Supervisor";

    if (!canOverride) {

        return {
            success: false,
            message: `Shifts longer than ${standardHours} hours require supervisor approval.`
        };

    }

    const approved = confirm(
        `This shift is ${durationHours.toFixed(1)} hours long.\n\n` +
        `Continue with supervisor override?`
    );

    if (!approved) {

        return {
            success: false,
            message: "Shift update cancelled."
        };

    }

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
    
        classification,

        overrideApproved:
        durationHours > standardHours,

        overrideApprovedBy:
          durationHours > standardHours
            ? currentUserProfile.uid
            : null,

        overrideApprovedAt:
          durationHours > standardHours
            ? new Date().toISOString()
            : null,
    
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

    
    collection(db, "shifts"),
    where("tenantId", "==", tenantId),
    where("seriesId", "==", editingSeriesId)
  );


    const snapshot =
      await getDocs(
        seriesQuery
      );

    const now =
      new Date();

      const editedStart = new Date(startTime);
      const editedEnd = new Date(endTime);
      const durationMs = editedEnd.getTime() - editedStart.getTime();

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
      // Preserve the original occurrence date
const occurrenceDate =
  new Date(shift.startTime);

// Apply the edited start time to this occurrence
const newStart = new Date(occurrenceDate);

newStart.setHours(
  editedStart.getHours(),
  editedStart.getMinutes(),
  0,
  0
);

// Preserve the edited duration
const newEnd = new Date(
  newStart.getTime() + durationMs
);

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
    formatLocalDateTime(newStart),

  endTime:
    formatLocalDateTime(newEnd)

};

      batch.update(
        shiftDoc.ref,
        seriesUpdate
      );

    }

    await batch.commit();

    //
// Synchronize every updated occurrence
// to Google Calendar
//
for (const shiftDoc of snapshot.docs) {

    const shift = shiftDoc.data();

    // Skip historical shifts just as we did
    // during the Firestore update.
    if (
        new Date(shift.startTime) < now
    ) {
        continue;
    }

    try {

        await syncShiftToGoogleCalendar(
            shiftDoc.id
        );

    } catch (error) {

        console.error(
            `Google Calendar sync failed for recurring shift ${shiftDoc.id}:`,
            error
        );

    }

}

  }

  if (!editingRecurring || editMode === "occurrence") {

    try {

        await syncShiftToGoogleCalendar(
            id
        );

    } catch (error) {

        console.error(
            "Google Calendar sync failed:",
            error
        );

    }

}

  return {
    success: true
};

}

export async function declineMarketplaceClaim(id) {

    try {

        const marketplaceRef =
            doc(db, "openShifts", id);

        const marketplaceSnap =
            await getDoc(marketplaceRef);

        if (!marketplaceSnap.exists()) {

            return {
                success: false,
                message: "Marketplace shift not found."
            };

        }

        const shift =
            marketplaceSnap.data();

        await updateDoc(
            marketplaceRef,
            {
                status: "open",

                claimedBy: null,
                claimedByName: null,
                claimedAt: null,

                declinedAt: serverTimestamp()
            }
        );

        await logActivity(
            shift.siteId,
            "MARKETPLACE_SHIFT_DECLINED",
            `${shift.claimedByName || "An officer"} was declined for ${shift.siteName}.`,
            "Supervisor",
            "marketplace"
        );

        return {
            success: true
        };

    } catch (error) {

        console.error(
            "declineMarketplaceClaim:",
            error
        );

        return {
            success: false,
            message:
                "Unable to decline Marketplace claim."
        };

    }

}

export async function cancelMarketplaceShift(id) {

    try {

        await updateDoc(
            doc(db, "openShifts", id),
            {
                status: "cancelled",
                cancelledAt: serverTimestamp()
            }
        );

        return {
            success: true,
            message: "Open Shift Cancelled."
        };

    } catch (error) {

        console.error(
            "cancelMarketplaceShift:",
            error
        );

        return {
            success: false,
            message: "Unable to cancel Open Shift."
        };

    }

}

/*********************************************************************
 * Realtime Listeners
 *********************************************************************/

export function startShiftListener(
    tenantId,
    callback
) {

    if (!tenantId) {

        callback({
            success: false,
            message: "Tenant ID is required."
        });

        return () => {};

    }

    const q = query(
        collection(db, "shifts"),
        where(
            "tenantId",
            "==",
            tenantId
        )
    );

    return onSnapshot(

        q,

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

export function startOpenShiftsListener(
    tenantId,
    callback
) {

    if (!tenantId) {

        callback({
            success: false,
            message: "Tenant ID is required."
        });

        return () => {};

    }

    const q = query(

        collection(db, "openShifts"),

        where(
            "tenantId",
            "==",
            tenantId
        ),

        where(
            "status",
            "==",
            "open"
        )

    );

    return onSnapshot(

        q,

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
export function startClaimRequestsListener(
    tenantId,
    callback
) {

    if (!tenantId) {

        callback({
            success: false,
            message: "Tenant ID is required."
        });

        return () => {};

    }

    const q = query(

        collection(db, "openShifts"),

        where(
            "tenantId",
            "==",
            tenantId
        ),

        where(
            "status",
            "==",
            "claimed"
        )

    );

    return onSnapshot(

        q,

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

export function startOfficerOpenShiftsListener(
    tenantId,
    callback
) {

    if (!tenantId) {

        callback({
            success: false,
            message: "Tenant ID is required."
        });

        return () => {};

    }

    const q = query(

        collection(db, "openShifts"),

        where(
            "tenantId",
            "==",
            tenantId
        ),

        where(
            "status",
            "==",
            "open"
        )

    );

    return onSnapshot(

        q,

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