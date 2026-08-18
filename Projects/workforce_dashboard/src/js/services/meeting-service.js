import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    updateDoc,
    serverTimestamp,
    doc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getCurrentUserProfile
} from "./identity-service.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

import { app } from "./firebase-config.js";


/*********************************************************************
 * Meeting Constants
 *********************************************************************/

const VALID_MEETING_TYPES = [
    "general",
    "roll_call",
    "shift_briefing",
    "training",
    "incident_review",
    "client_meeting",
    "safety",
    "performance",
    "other"
];

const VALID_LOCATION_TYPES = [
    "virtual",
    "physical",
    "hybrid"
];


/*********************************************************************
 * Meeting Helpers
 *********************************************************************/

function isValidMeetingType(meetingType) {

    return VALID_MEETING_TYPES.includes(
        meetingType
    );

}


function isValidLocationType(locationType) {

    return VALID_LOCATION_TYPES.includes(
        locationType
    );

}


function getTimestampDate(value) {

    if (!value) {

        return null;

    }

    if (value instanceof Date) {

        return value;

    }

    if (
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }

    return null;

}


/*********************************************************************
 * Create Meeting
 *********************************************************************/

export async function createMeeting({

    title,
    description = "",
    meetingType,
    startTime,
    endTime,
    timezone,
    locationType,
    location = ""

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to create meetings."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Title
        // -------------------------

        if (
            typeof title !== "string" ||
            !title.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting title is required."
            };

        }

        if (title.trim().length > 200) {

            return {
                success: false,
                message:
                    "Meeting title cannot exceed 200 characters."
            };

        }

        // -------------------------
        // Description
        // -------------------------

        if (
            typeof description !== "string"
        ) {

            return {
                success: false,
                message:
                    "Meeting description must be text."
            };

        }

        if (description.length > 2000) {

            return {
                success: false,
                message:
                    "Meeting description cannot exceed 2,000 characters."
            };

        }

        // -------------------------
        // Meeting Type
        // -------------------------

        if (
            !isValidMeetingType(
                meetingType
            )
        ) {

            return {
                success: false,
                message:
                    "Invalid meeting type."
            };

        }

        // -------------------------
        // Location Type
        // -------------------------

        if (
            !isValidLocationType(
                locationType
            )
        ) {

            return {
                success: false,
                message:
                    "Invalid meeting location type."
            };

        }

        // -------------------------
        // Timezone
        // -------------------------

        if (
            typeof timezone !== "string" ||
            !timezone.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting timezone is required."
            };

        }

        // -------------------------
        // Time Validation
        // -------------------------

        const startDate =
            getTimestampDate(
                startTime
            );

        const endDate =
            getTimestampDate(
                endTime
            );

        if (!startDate) {

            return {
                success: false,
                message:
                    "Meeting start time is required."
            };

        }

        if (!endDate) {

            return {
                success: false,
                message:
                    "Meeting end time is required."
            };

        }

        if (
            endDate.getTime() <=
            startDate.getTime()
        ) {

            return {
                success: false,
                message:
                    "Meeting end time must be after start time."
            };

        }

        // -------------------------
        // Meeting Document
        // -------------------------

        const meetingData = {

            tenantId:
                currentUserProfile.tenantId,

            title:
                title.trim(),

            description:
                description.trim(),

            meetingType,

            organizerId:
                currentUserProfile.uid,

            startTime:
                startDate,

            endTime:
                endDate,

            timezone:
                timezone.trim(),

            status:
                "draft",

            locationType,

            location:
                typeof location === "string"
                    ? location.trim()
                    : "",

            googleEventId:
                null,

            googleCalendarId:
                null,

            meetLink:
                null,

            conferenceId:
                null,

            createdAt:
                serverTimestamp(),

            createdBy:
                currentUserProfile.uid,

            updatedAt:
                serverTimestamp(),

            updatedBy:
                currentUserProfile.uid

        };

        // -------------------------
        // Firestore
        // -------------------------

        const meetingRef =
            await addDoc(
                collection(
                    db,
                    "meetings"
                ),
                meetingData
            );

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_CREATED",

            `Meeting "${title.trim()}" created.`,

            userName,

            "meeting",

            {
                meetingId:
                    meetingRef.id,

                meetingType,

                organizerId:
                    currentUserProfile.uid,

                locationType
            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true,

            meetingId:
                meetingRef.id

        };

    } catch (error) {

        console.error(
            "createMeeting:",
            error
        );

        return {

            success: false,

            message:
                "Unable to create meeting."

        };

    }

}

/*********************************************************************
 * Add Attendee
 *********************************************************************/

export async function addAttendee({

    meetingId,
    attendeeType,
    userId = null,
    name = "",
    email = "",
    role

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to manage meeting attendees."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "draft" &&
            meeting.status !== "scheduled"
        ) {

            return {
                success: false,
                message:
                    "Attendees cannot be added to a meeting in its current state."
            };

        }

        // -------------------------
        // Attendee Type
        // -------------------------

        if (
            attendeeType !== "internal" &&
            attendeeType !== "external"
        ) {

            return {
                success: false,
                message:
                    "Invalid attendee type."
            };

        }

        // -------------------------
        // Role
        // -------------------------

        if (
    role !== "required" &&
    role !== "optional"
) {

            return {
                success: false,
                message:
                    "Invalid attendee role."
            };

        }

        // -------------------------
        // Internal Attendee
        // -------------------------

        let attendeeName = "";
        let attendeeEmail = "";
        let attendeeUserId = null;

        if (
            attendeeType === "internal"
        ) {

            if (
                typeof userId !== "string" ||
                !userId.trim()
            ) {

                return {
                    success: false,
                    message:
                        "User ID is required for an internal attendee."
                };

            }

            const userRef =
                doc(
                    db,
                    "users",
                    userId
                );

            const userSnap =
                await getDoc(userRef);

            if (!userSnap.exists()) {

                return {
                    success: false,
                    message:
                        "Internal user was not found."
                };

            }

            const user =
                userSnap.data();

            if (
                user.tenantId !==
                currentUserProfile.tenantId
            ) {

                return {
                    success: false,
                    message:
                        "Internal attendee must belong to the same tenant."
                };

            }

            attendeeUserId =
                userId;

            attendeeName =
                user.displayName ||
                user.name ||
                "";

            attendeeEmail =
                user.email ||
                user.accountEmail ||
                "";

            if (!attendeeName) {

                return {
                    success: false,
                    message:
                        "Internal attendee name could not be determined."
                };

            }

            if (!attendeeEmail) {

                return {
                    success: false,
                    message:
                        "Internal attendee email could not be determined."
                };

            }

        }

        // -------------------------
        // External Attendee
        // -------------------------

        if (
            attendeeType === "external"
        ) {

            if (
                typeof name !== "string" ||
                !name.trim()
            ) {

                return {
                    success: false,
                    message:
                        "External attendee name is required."
                };

            }

            if (
                typeof email !== "string" ||
                !email.trim()
            ) {

                return {
                    success: false,
                    message:
                        "External attendee email is required."
                };

            }

            attendeeName =
                name.trim();

            attendeeEmail =
                email.trim().toLowerCase();

        }

        // -------------------------
        // Attendee Collection
        // -------------------------

        const attendeesRef =
            collection(
                db,
                "meetings",
                meetingId,
                "attendees"
            );

        // -------------------------
        // Duplicate Prevention
        // -------------------------

        const existingAttendees =
            await getDocs(
                attendeesRef
            );

        const duplicate =
            existingAttendees.docs.some(
                attendeeDoc => {

                    const attendee =
                        attendeeDoc.data();

                    if (
                        attendeeType ===
                        "internal"
                    ) {

                        return (
                            attendee.attendeeType ===
                                "internal" &&
                            attendee.userId ===
                                attendeeUserId
                        );

                    }

                    return (
                        attendee.attendeeType ===
                            "external" &&
                        attendee.email?.toLowerCase() ===
                            attendeeEmail
                    );

                }
            );

        if (duplicate) {

            return {
                success: false,
                message:
                    "This attendee is already part of the meeting."
            };

        }        

        // -------------------------
        // Attendee Document
        // -------------------------

        const attendeeData = {

            attendeeType,

            userId:
                attendeeUserId,

            name:
                attendeeName,

            email:
                attendeeEmail,

            role,

            responseStatus:
                "pending",

            attendanceStatus:
                "not_attended",

            invitedAt:
                serverTimestamp(),

            respondedAt:
                null,

            joinedAt:
                null,

            leftAt:
                null

        };

        // -------------------------
        // Firestore
        // -------------------------

        const attendeeRef =
            await addDoc(
                attendeesRef,
                attendeeData
            );

                    // -------------------------
        // Google Calendar / Meet
        // -------------------------

        if (
            meeting.status === "scheduled" &&
            meeting.googleEventId
        ) {

            const functions =
                getFunctions(app);

            let googleResult;

            if (
                meeting.locationType === "physical"
            ) {

                const updateGoogleCalendarEvent =
                    httpsCallable(
                        functions,
                        "updateGoogleCalendarEvent"
                    );

                googleResult =
                    await updateGoogleCalendarEvent({

                        meetingId,

                        title:
                            meeting.title,

                        description:
                            meeting.description || "",

                        startTime:
                            meeting.startTime,

                        endTime:
                            meeting.endTime,

                        timezone:
                            meeting.timezone,

                        locationType:
                            meeting.locationType,

                        location:
                            meeting.location || ""

                    });

            } else {

                const updateGoogleMeeting =
                    httpsCallable(
                        functions,
                        "updateGoogleMeeting"
                    );

                googleResult =
                    await updateGoogleMeeting({

                        meetingId,

                        title:
                            meeting.title,

                        description:
                            meeting.description || "",

                        startTime:
                            meeting.startTime,

                        endTime:
                            meeting.endTime,

                        timezone:
                            meeting.timezone,

                        locationType:
                            meeting.locationType,

                        location:
                            meeting.location || ""

                    });

            }

            if (
                !googleResult.data ||
                !googleResult.data.success
            ) {

                console.warn(
                    "Meeting attendee added locally, but Google synchronization failed:",
                    googleResult.data?.message ||
                        "Unknown Google synchronization error."
                );

            }

        }

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_ATTENDEE_ADDED",

            `${attendeeName} added to meeting "${meeting.title}".`,

            userName,

            "meeting",

            {
                meetingId,

                attendeeId:
                    attendeeRef.id,

                attendeeType,

                attendeeUserId,

                attendeeName,

                attendeeEmail,

                role
            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true,

            attendeeId:
                attendeeRef.id

        };

    } catch (error) {

        console.error(
            "addAttendee:",
            error
        );

        return {

            success: false,

            message:
                "Unable to add meeting attendee."

        };

    }

}

/*********************************************************************
 * Remove Attendee
 *********************************************************************/

export async function removeAttendee({

    meetingId,
    attendeeId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to manage meeting attendees."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Validate IDs
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        if (
            typeof attendeeId !== "string" ||
            !attendeeId.trim()
        ) {

            return {
                success: false,
                message:
                    "Attendee ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "draft" &&
            meeting.status !== "scheduled"
        ) {

            return {
                success: false,
                message:
                    "Attendees cannot be removed from a meeting in its current state."
            };

        }

        // -------------------------
        // Attendee
        // -------------------------

        const attendeeRef =
            doc(
                db,
                "meetings",
                meetingId,
                "attendees",
                attendeeId
            );

        const attendeeSnap =
            await getDoc(attendeeRef);

        if (!attendeeSnap.exists()) {

            return {
                success: false,
                message:
                    "Attendee not found."
            };

        }

        const attendee =
            attendeeSnap.data();

        // -------------------------
        // Organizer Protection
        // -------------------------

        if (
            attendee.attendeeType ===
                "internal" &&
            attendee.userId ===
                meeting.organizerId
        ) {

            return {
                success: false,
                message:
                    "The meeting organizer cannot be removed."
            };

        }

        // -------------------------
        // Delete Attendee
        // -------------------------

        await deleteDoc(
            attendeeRef
        );
        
                

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_ATTENDEE_REMOVED",

            `${attendee.name || attendee.email || "Attendee"} removed from meeting "${meeting.title}".`,

            userName,

            "meeting",

            {
                meetingId,

                attendeeId,

                attendeeType:
                    attendee.attendeeType,

                attendeeUserId:
                    attendee.userId || null,

                attendeeName:
                    attendee.name || "",

                attendeeEmail:
                    attendee.email || "",

                role:
                    attendee.role || ""
            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "removeAttendee:",
            error
        );

        return {

            success: false,

            message:
                "Unable to remove meeting attendee."

        };

    }

}

/*********************************************************************
 * Update Meeting
 *********************************************************************/

export async function updateMeeting({

    meetingId,
    title,
    description = "",
    meetingType,
    startTime,
    endTime,
    timezone,
    locationType,
    location = ""

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to update meetings."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "draft" &&
            meeting.status !== "scheduled"
        ) {

            return {
                success: false,
                message:
                    "Meetings cannot be updated in their current state."
            };

        }

        // -------------------------
        // Title
        // -------------------------

        if (
            typeof title !== "string" ||
            !title.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting title is required."
            };

        }

        if (
            title.trim().length > 200
        ) {

            return {
                success: false,
                message:
                    "Meeting title cannot exceed 200 characters."
            };

        }

        // -------------------------
        // Description
        // -------------------------

        if (
            typeof description !== "string"
        ) {

            return {
                success: false,
                message:
                    "Meeting description must be text."
            };

        }

        if (
            description.length > 2000
        ) {

            return {
                success: false,
                message:
                    "Meeting description cannot exceed 2,000 characters."
            };

        }

        // -------------------------
        // Meeting Type
        // -------------------------

        if (
            !isValidMeetingType(
                meetingType
            )
        ) {

            return {
                success: false,
                message:
                    "Invalid meeting type."
            };

        }

        // -------------------------
        // Location Type
        // -------------------------

        if (
            !isValidLocationType(
                locationType
            )
        ) {

            return {
                success: false,
                message:
                    "Invalid meeting location type."
            };

        }

        // -------------------------
        // Timezone
        // -------------------------

        if (
            typeof timezone !== "string" ||
            !timezone.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting timezone is required."
            };

        }

        // -------------------------
        // Time Validation
        // -------------------------

        const startDate =
            getTimestampDate(
                startTime
            );

        const endDate =
            getTimestampDate(
                endTime
            );

        if (!startDate) {

            return {
                success: false,
                message:
                    "Meeting start time is required."
            };

        }

        if (!endDate) {

            return {
                success: false,
                message:
                    "Meeting end time is required."
            };

        }

        if (
            endDate.getTime() <=
            startDate.getTime()
        ) {

            return {
                success: false,
                message:
                    "Meeting end time must be after start time."
            };

        }

        // -------------------------
        // Meeting Update
        // -------------------------

        const updateData = {

            title:
                title.trim(),

            description:
                description.trim(),

            meetingType,

            startTime,

            endTime,

            timezone:
                timezone.trim(),

            locationType,
            location:
                typeof location === "string"
                    ? location.trim()
                    : "",

            updatedAt:
                serverTimestamp(),

            updatedBy:
                currentUserProfile.uid

        };

// -------------------------
// Google Calendar
// -------------------------

if (
    meeting.status === "scheduled" &&
    meeting.googleEventId
) {

    const functions =
        getFunctions(app);

    let googleResult;

    if (
        locationType === "physical"
    ) {

        const updateGoogleCalendarEvent =
            httpsCallable(
                functions,
                "updateGoogleCalendarEvent"
            );

        googleResult =
            await updateGoogleCalendarEvent({

                meetingId,

                title:
                    title.trim(),

                description:
                    description.trim(),

                startTime,

                endTime,

                timezone:
                    timezone.trim(),

                locationType,

                location:
                    typeof location === "string"
                        ? location.trim()
                        : ""

                });

    } else {

        const updateGoogleMeeting =
            httpsCallable(
                functions,
                "updateGoogleMeeting"
            );

        googleResult =
            await updateGoogleMeeting({

                meetingId,

                title:
                    title.trim(),

                description:
                    description.trim(),

                startTime,

                endTime,

                timezone:
                    timezone.trim(),

              locationType,

                location:
                    typeof location === "string"
                        ? location.trim()
                        : ""

                });

    }

    if (
        !googleResult.data ||
        !googleResult.data.success
    ) {

        return {
            success: false,
            message:
                googleResult.data?.message ||
                "Unable to update Google Calendar meeting."
        };

    }

}

// -------------------------
// Firestore
// -------------------------

await updateDoc(
    meetingRef,
    updateData
);

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_UPDATED",

            `Meeting "${title.trim()}" updated.`,

            userName,

            "meeting",

            {
                meetingId,

                meetingType,

                organizerId:
                    meeting.organizerId,

                locationType
            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "updateMeeting:",
            error
        );

        return {

            success: false,

            message:
                "Unable to update meeting."

        };

    }

}

/*********************************************************************
 * Delete Meeting
 *********************************************************************/

export async function deleteMeeting({

    meetingId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to delete meetings."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "draft" &&
            meeting.status !== "scheduled"
        ) {

            return {
                success: false,
                message:
                    "Meetings cannot be deleted in their current state."
            };

        }

        // -------------------------
        // Attendees
        // -------------------------

        const attendeesRef =
            collection(
                db,
                "meetings",
                meetingId,
                "attendees"
            );

        const attendeesSnap =
            await getDocs(
                attendeesRef
            );

        for (
            const attendeeDoc
            of attendeesSnap.docs
        ) {

            await deleteDoc(
                attendeeDoc.ref
            );

        }

        // -------------------------
        // Delete Meeting
        // -------------------------

        await deleteDoc(
            meetingRef
        );

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_DELETED",

            `Meeting "${meeting.title}" deleted.`,

            userName,

            "meeting",

            {
                meetingId,

                meetingType:
                    meeting.meetingType,

                organizerId:
                    meeting.organizerId,

                locationType:
                    meeting.locationType
            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "deleteMeeting:",
            error
        );

        return {

            success: false,

            message:
                "Unable to delete meeting."

        };

    }

}

/*********************************************************************
 * Get Meetings
 *********************************************************************/

export async function getMeetings() {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to view meetings."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting Query
        // -------------------------

        const meetingsRef =
            collection(
                db,
                "meetings"
            );

        const meetingsQuery =
            query(
                meetingsRef,
                where(
                    "tenantId",
                    "==",
                    currentUserProfile.tenantId
                ),
                orderBy(
                    "startTime",
                    "asc"
                )
            );

        const meetingsSnap =
            await getDocs(
                meetingsQuery
            );

        // -------------------------
        // Transform Results
        // -------------------------

        const meetings =
            meetingsSnap.docs.map(
                meetingDoc => ({

                    id:
                        meetingDoc.id,

                    ...meetingDoc.data()

                })
            );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true,

            meetings

        };

    } catch (error) {

        console.error(
            "getMeetings:",
            error
        );

        return {

            success: false,

            message:
                "Unable to load meetings."

        };

    }

}

/*********************************************************************
 * Get Meeting
 *********************************************************************/

export async function getMeeting({

    meetingId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to view meetings."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true,

            meeting: {

                id:
                    meetingSnap.id,

                ...meeting

            }

        };

    } catch (error) {

        console.error(
            "getMeeting:",
            error
        );

        return {

            success: false,

            message:
                "Unable to load meeting."

        };

    }

}

/*********************************************************************
 * Get Meeting Attendee Users
 *********************************************************************/

export async function getMeetingAttendeeUsers() {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to view meeting attendees."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Users
        // -------------------------

        const usersRef =
            collection(
                db,
                "users"
            );

        const usersQuery =
            query(
                usersRef,
                where(
                    "tenantId",
                    "==",
                    currentUserProfile.tenantId
                )
            );

        const usersSnap =
            await getDocs(
                usersQuery
            );

        // -------------------------
        // Transform Results
        // -------------------------

        const users =
            usersSnap.docs.map(
                userDoc => {

                    const user =
                        userDoc.data();

                    return {

                        id:
                            userDoc.id,

                        displayName:
                            user.displayName ||
                            user.name ||
                            "",

                        email:
                            user.email ||
                            user.accountEmail ||
                            "",

                        role:
                            user.role ||
                            "",

                        active:
                            user.active !== false

                    };

                }
            ).filter(
                user =>
                    user.active &&
                    user.displayName &&
                    user.email
            );

        // -------------------------
        // Sort
        // -------------------------

        users.sort(
            (a, b) =>
                a.displayName.localeCompare(
                    b.displayName
                )
        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true,

            users

        };

    } catch (error) {

        console.error(
            "getMeetingAttendeeUsers:",
            error
        );

        return {

            success: false,

            message:
                "Unable to load internal users."

        };

    }

}

/*********************************************************************
 * Get My Meeting Participation
 *********************************************************************/

export async function getMyMeetingParticipation({

    meetingId

}) {

    try {

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        const attendeesRef =
            collection(
                db,
                "meetings",
                meetingId,
                "attendees"
            );

        const attendeeQuery =
            query(
                attendeesRef,
                where(
                    "userId",
                    "==",
                    currentUserProfile.uid
                )
            );

        const attendeeSnap =
            await getDocs(
                attendeeQuery
            );

        if (attendeeSnap.empty) {

            return {
                success: true,
                isAttendee: false,
                participation: null
            };

        }

        if (attendeeSnap.size > 1) {

            return {
                success: false,
                message:
                    "Multiple attendee records were found for this user."
            };

        }

        const attendeeDoc =
            attendeeSnap.docs[0];

        return {

            success: true,

            isAttendee: true,

            participation: {

                id:
                    attendeeDoc.id,

                ...attendeeDoc.data()

            }

        };

    } catch (error) {

        console.error(
            "getMyMeetingParticipation:",
            error
        );

        return {

            success: false,

            message:
                "Unable to load meeting participation."

        };

    }

}

/*********************************************************************
 * Get Meeting Attendees
 *********************************************************************/

export async function getMeetingAttendees({

    meetingId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to view meeting attendees."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Attendees
        // -------------------------

        const attendeesRef =
            collection(
                db,
                "meetings",
                meetingId,
                "attendees"
            );

        const attendeesSnap =
            await getDocs(
                attendeesRef
            );

        // -------------------------
        // Transform Results
        // -------------------------

        const attendees =
            attendeesSnap.docs.map(
                attendeeDoc => ({

                    id:
                        attendeeDoc.id,

                    ...attendeeDoc.data()

                })
            );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true,

            attendees

        };

    } catch (error) {

        console.error(
            "getMeetingAttendees:",
            error
        );

        return {

            success: false,

            message:
                "Unable to load meeting attendees."

        };

    }

}

/*********************************************************************
 * Update Attendee
 *********************************************************************/

export async function updateAttendee({

    meetingId,
    attendeeId,
    name = "",
    email = "",
    role

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to manage meeting attendees."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Validate IDs
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        if (
            typeof attendeeId !== "string" ||
            !attendeeId.trim()
        ) {

            return {
                success: false,
                message:
                    "Attendee ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "draft" &&
            meeting.status !== "scheduled"
        ) {

            return {
                success: false,
                message:
                    "Attendees cannot be updated in a meeting in its current state."
            };

        }

        // -------------------------
        // Attendee
        // -------------------------

        const attendeeRef =
            doc(
                db,
                "meetings",
                meetingId,
                "attendees",
                attendeeId
            );

        const attendeeSnap =
            await getDoc(attendeeRef);

        if (!attendeeSnap.exists()) {

            return {
                success: false,
                message:
                    "Attendee not found."
            };

        }

        const attendee =
            attendeeSnap.data();

        // -------------------------
        // Role
        // -------------------------

        if (
            role !== "required" &&
            role !== "optional"
        ) {

            return {
                success: false,
                message:
                    "Invalid attendee role."
            };

        }

        // -------------------------
        // Internal Attendee
        // -------------------------

        let attendeeName =
            attendee.name || "";

        let attendeeEmail =
            attendee.email || "";

        if (
            attendee.attendeeType ===
            "internal"
        ) {

            if (
                typeof attendee.userId !== "string" ||
                !attendee.userId.trim()
            ) {

                return {
                    success: false,
                    message:
                        "Internal attendee user ID is missing."
                };

            }

            const userRef =
                doc(
                    db,
                    "users",
                    attendee.userId
                );

            const userSnap =
                await getDoc(userRef);

            if (!userSnap.exists()) {

                return {
                    success: false,
                    message:
                        "Internal user was not found."
                };

            }

            const user =
                userSnap.data();

            if (
                user.tenantId !==
                currentUserProfile.tenantId
            ) {

                return {
                    success: false,
                    message:
                        "Internal attendee must belong to the same tenant."
                };

            }

            attendeeName =
                user.displayName ||
                user.name ||
                "";

            attendeeEmail =
                user.email ||
                user.accountEmail ||
                "";

            if (!attendeeName) {

                return {
                    success: false,
                    message:
                        "Internal attendee name could not be determined."
                };

            }

            if (!attendeeEmail) {

                return {
                    success: false,
                    message:
                        "Internal attendee email could not be determined."
                };

            }

        }

        // -------------------------
        // External Attendee
        // -------------------------

        if (
            attendee.attendeeType ===
            "external"
        ) {

            if (
                typeof name !== "string" ||
                !name.trim()
            ) {

                return {
                    success: false,
                    message:
                        "External attendee name is required."
                };

            }

            if (
                typeof email !== "string" ||
                !email.trim()
            ) {

                return {
                    success: false,
                    message:
                        "External attendee email is required."
                };

            }

            attendeeName =
                name.trim();

            attendeeEmail =
                email.trim().toLowerCase();

        }

        // -------------------------
        // Attendee Update
        // -------------------------

        const updateData = {

            name:
                attendeeName,

            email:
                attendeeEmail,

            role,

            updatedAt:
                serverTimestamp(),

            updatedBy:
                currentUserProfile.uid

        };

        // -------------------------
        // Firestore
        // -------------------------

        await updateDoc(
            attendeeRef,
            updateData
        );

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_ATTENDEE_UPDATED",

            `${attendeeName} updated in meeting "${meeting.title}".`,

            userName,

            "meeting",

            {

                meetingId,

                attendeeId,

                attendeeType:
                    attendee.attendeeType,

                attendeeUserId:
                    attendee.userId || null,

                attendeeName,

                attendeeEmail,

                role

            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "updateAttendee:",
            error
        );

        return {

            success: false,

            message:
                "Unable to update meeting attendee."

        };

    }

}

/*********************************************************************
 * Respond to Meeting
 *********************************************************************/

export async function respondToMeeting({

    meetingId,
    response

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Response
        // -------------------------

        if (
            response !== "accepted" &&
            response !== "declined"
        ) {

            return {
                success: false,
                message:
                    "Invalid meeting response."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "scheduled" &&
            meeting.status !== "in_progress"
        ) {

            return {
                success: false,
                message:
                    "Meeting responses cannot be changed in its current state."
            };

        }

        // -------------------------
        // Current User Attendee
        // -------------------------

        const attendeesRef =
            collection(
                db,
                "meetings",
                meetingId,
                "attendees"
            );

        const attendeeQuery =
            query(
                attendeesRef,
                where(
                    "userId",
                    "==",
                    currentUserProfile.uid
                )
            );

        const attendeeSnap =
            await getDocs(
                attendeeQuery
            );

        if (attendeeSnap.empty) {

            return {
                success: false,
                message:
                    "You are not an internal attendee of this meeting."
            };

        }

        if (attendeeSnap.size > 1) {

            return {
                success: false,
                message:
                    "Multiple attendee records were found for this user."
            };

        }

        const attendeeDoc =
            attendeeSnap.docs[0];

        const attendee =
            attendeeDoc.data();

        if (
            attendee.attendeeType !==
            "internal"
        ) {

            return {
                success: false,
                message:
                    "Only internal attendees can respond through the meeting portal."
            };

        }

        // -------------------------
        // Update Response
        // -------------------------

        await updateDoc(
            attendeeDoc.ref,
            {

                responseStatus:
                    response,

                respondedAt:
                    serverTimestamp()

            }
        );

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_ATTENDEE_RESPONSE",

            `${userName} ${response} meeting "${meeting.title}".`,

            userName,

            "meeting",

            {

                meetingId,

                response,

                attendeeId:
                    attendeeDoc.id

            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true,

            response

        };

    } catch (error) {

        console.error(
            "respondToMeeting:",
            error
        );

        return {

            success: false,

            message:
                "Unable to update meeting response."

        };

    }

}

/*********************************************************************
 * Mark Attendee Joined
 *********************************************************************/

export async function markAttendeeJoined({

    meetingId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "in_progress"
        ) {

            return {
                success: false,
                message:
                    "Attendance can only be recorded for an in-progress meeting."
            };

        }

        // -------------------------
        // Current User Attendee
        // -------------------------

        const attendeesRef =
            collection(
                db,
                "meetings",
                meetingId,
                "attendees"
            );

        const attendeeQuery =
            query(
                attendeesRef,
                where(
                    "userId",
                    "==",
                    currentUserProfile.uid
                )
            );

        const attendeeSnap =
            await getDocs(
                attendeeQuery
            );

        if (attendeeSnap.empty) {

            return {
                success: false,
                message:
                    "You are not an internal attendee of this meeting."
            };

        }

        if (attendeeSnap.size > 1) {

            return {
                success: false,
                message:
                    "Multiple attendee records were found for this user."
            };

        }

        const attendeeDoc =
            attendeeSnap.docs[0];

        const attendee =
            attendeeDoc.data();

        // -------------------------
        // Attendee Type
        // -------------------------

        if (
            attendee.attendeeType !==
            "internal"
        ) {

            return {
                success: false,
                message:
                    "Only internal attendees can record attendance."
            };

        }

        // -------------------------
        // Response Validation
        // -------------------------

        if (
            attendee.responseStatus !==
            "accepted"
        ) {

            return {
                success: false,
                message:
                    "You must accept the meeting before joining."
            };

        }

        // -------------------------
        // Attendance State
        // -------------------------

        if (
            attendee.attendanceStatus ===
            "attended"
        ) {

            return {
                success: false,
                message:
                    "Attendance has already been recorded."
            };

        }

        // -------------------------
        // Record Attendance
        // -------------------------

        await updateDoc(
            attendeeDoc.ref,
            {

                attendanceStatus:
                    "attended",

                joinedAt:
                    serverTimestamp()

            }
        );

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_ATTENDEE_JOINED",

            `${userName} joined meeting "${meeting.title}".`,

            userName,

            "meeting",

            {

                meetingId,

                attendeeId:
                    attendeeDoc.id

            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "markAttendeeJoined:",
            error
        );

        return {

            success: false,

            message:
                "Unable to record meeting attendance."

        };

    }

}

/*********************************************************************
 * Mark Attendee Left
 *********************************************************************/

export async function markAttendeeLeft({

    meetingId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "in_progress" &&
            meeting.status !== "completed"
        ) {

            return {
                success: false,
                message:
                    "Attendance cannot be completed in the current meeting state."
            };

        }

        // -------------------------
        // Current User Attendee
        // -------------------------

        const attendeesRef =
            collection(
                db,
                "meetings",
                meetingId,
                "attendees"
            );

        const attendeeQuery =
            query(
                attendeesRef,
                where(
                    "userId",
                    "==",
                    currentUserProfile.uid
                )
            );

        const attendeeSnap =
            await getDocs(
                attendeeQuery
            );

        if (attendeeSnap.empty) {

            return {
                success: false,
                message:
                    "You are not an internal attendee of this meeting."
            };

        }

        if (attendeeSnap.size > 1) {

            return {
                success: false,
                message:
                    "Multiple attendee records were found for this user."
            };

        }

        const attendeeDoc =
            attendeeSnap.docs[0];

        const attendee =
            attendeeDoc.data();

        // -------------------------
        // Attendee Type
        // -------------------------

        if (
            attendee.attendeeType !==
            "internal"
        ) {

            return {
                success: false,
                message:
                    "Only internal attendees can record attendance."
            };

        }

        // -------------------------
        // Attendance State
        // -------------------------

        if (
            attendee.attendanceStatus !==
            "attended"
        ) {

            return {
                success: false,
                message:
                    "Attendance has not been recorded for this attendee."
            };

        }

        if (
            attendee.leftAt
        ) {

            return {
                success: false,
                message:
                    "Attendance has already been ended."
            };

        }

        // -------------------------
        // Record Departure
        // -------------------------

        await updateDoc(
            attendeeDoc.ref,
            {

                attendanceStatus:
                    "left",

                leftAt:
                    serverTimestamp()

            }
        );

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_ATTENDEE_LEFT",

            `${userName} left meeting "${meeting.title}".`,

            userName,

            "meeting",

            {

                meetingId,

                attendeeId:
                    attendeeDoc.id

            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "markAttendeeLeft:",
            error
        );

        return {

            success: false,

            message:
                "Unable to record meeting departure."

        };

    }

}

/*********************************************************************
 * Schedule Meeting
 *********************************************************************/

export async function scheduleMeeting({

    meetingId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to schedule meetings."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "draft"
        ) {

            return {
                success: false,
                message:
                    "Only draft meetings can be scheduled."
            };

        }

        // -------------------------
        // Attendees
        // -------------------------

        const attendeesRef =
            collection(
                db,
                "meetings",
                meetingId,
                "attendees"
            );

        const attendeesSnap =
            await getDocs(
                attendeesRef
            );

        if (
            attendeesSnap.empty
        ) {

            return {
                success: false,
                message:
                    "A meeting must have at least one attendee before it can be scheduled."
            };

        }

// -------------------------
// Google Calendar / Meet
// -------------------------

const functions =
    getFunctions(app);

let googleResult;

if (
    meeting.locationType === "physical"
) {

    const createGoogleCalendarEvent =
        httpsCallable(
            functions,
            "createGoogleCalendarEvent"
        );

    googleResult =
        await createGoogleCalendarEvent({
            meetingId
        });

} else {

    const createGoogleMeeting =
        httpsCallable(
            functions,
            "createGoogleMeeting"
        );

    googleResult =
        await createGoogleMeeting({
            meetingId
        });

}

if (
    !googleResult.data ||
    !googleResult.data.success
) {

    return {
        success: false,
        message:
            googleResult.data?.message ||
            "Unable to create Google Calendar event."
    };

}
// -------------------------
// Schedule Meeting
// -------------------------

await updateDoc(
    meetingRef,
    {

        status:
            "scheduled",
        
        scheduledAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp(),

        updatedBy:
            currentUserProfile.uid

    }
);

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_SCHEDULED",

            `Meeting "${meeting.title}" scheduled.`,

            userName,

            "meeting",

            {

                meetingId,

                meetingType:
                    meeting.meetingType,

                organizerId:
                    meeting.organizerId,

                locationType:
                    meeting.locationType

            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "scheduleMeeting:",
            error
        );

        return {

            success: false,

            message:
                "Unable to schedule meeting."

        };

    }

}

/*********************************************************************
 * Cancel Meeting
 *********************************************************************/

export async function cancelMeeting({

    meetingId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to cancel meetings."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "scheduled"
        ) {

            return {
                success: false,
                message:
                    "Only scheduled meetings can be cancelled."
            };

        }

// -------------------------
// Cancel Google Meeting
// -------------------------
const functions =
    getFunctions(app);

let googleResult;

if (
    meeting.locationType === "physical"
) {

    const deletePhysicalGoogleCalendarEvent =
    httpsCallable(
        functions,
        "deletePhysicalGoogleCalendarEvent"
    );

    googleResult =
    await deletePhysicalGoogleCalendarEvent({
        meetingId
    });

} else {

    const deleteGoogleMeeting =
        httpsCallable(
            functions,
            "deleteGoogleMeeting"
        );

    googleResult =
        await deleteGoogleMeeting({
            meetingId
        });

}

if (
    !googleResult.data ||
    !googleResult.data.success
) {
    return {
        success: false,
        message:
            googleResult.data?.message ||
            "Unable to cancel Google Calendar event."
    };
}

        // -------------------------
        // Cancel Meeting
        // -------------------------

        await updateDoc(
            meetingRef,
            {

                status:
                    "cancelled",

                cancelledAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUserProfile.uid

            }
        );

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_CANCELLED",

            `Meeting "${meeting.title}" cancelled.`,

            userName,

            "meeting",

            {

                meetingId,

                meetingType:
                    meeting.meetingType,

                organizerId:
                    meeting.organizerId,

                locationType:
                    meeting.locationType

            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "cancelMeeting:",
            error
        );

        return {

            success: false,

            message:
                "Unable to cancel meeting."

        };

    }

}

/*********************************************************************
 * Start Meeting
 *********************************************************************/

export async function startMeeting({

    meetingId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to start meetings."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "scheduled"
        ) {

            return {
                success: false,
                message:
                    "Only scheduled meetings can be started."
            };

        }

        // -------------------------
        // Start Meeting
        // -------------------------

        await updateDoc(
            meetingRef,
            {

                status:
                    "in_progress",

                startedAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUserProfile.uid

            }
        );

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_STARTED",

            `Meeting "${meeting.title}" started.`,

            userName,

            "meeting",

            {

                meetingId,

                meetingType:
                    meeting.meetingType,

                organizerId:
                    meeting.organizerId,

                locationType:
                    meeting.locationType

            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "startMeeting:",
            error
        );

        return {

            success: false,

            message:
                "Unable to start meeting."

        };

    }

}

/*********************************************************************
 * Complete Meeting
 *********************************************************************/

export async function completeMeeting({

    meetingId

}) {

    try {

        // -------------------------
        // Identity
        // -------------------------

        const currentUserProfile =
            await getCurrentUserProfile();

        if (!currentUserProfile) {

            return {
                success: false,
                message:
                    "User is not authenticated."
            };

        }

        // -------------------------
        // Authorization
        // -------------------------

        if (
            currentUserProfile.role !== "Administrator" &&
            currentUserProfile.role !== "Supervisor"
        ) {

            return {
                success: false,
                message:
                    "You do not have permission to complete meetings."
            };

        }

        // -------------------------
        // Tenant
        // -------------------------

        if (!currentUserProfile.tenantId) {

            return {
                success: false,
                message:
                    "User tenant could not be determined."
            };

        }

        // -------------------------
        // Meeting ID
        // -------------------------

        if (
            typeof meetingId !== "string" ||
            !meetingId.trim()
        ) {

            return {
                success: false,
                message:
                    "Meeting ID is required."
            };

        }

        // -------------------------
        // Meeting
        // -------------------------

        const meetingRef =
            doc(
                db,
                "meetings",
                meetingId
            );

        const meetingSnap =
            await getDoc(meetingRef);

        if (!meetingSnap.exists()) {

            return {
                success: false,
                message:
                    "Meeting not found."
            };

        }

        const meeting =
            meetingSnap.data();

        // -------------------------
        // Tenant Validation
        // -------------------------

        if (
            meeting.tenantId !==
            currentUserProfile.tenantId
        ) {

            return {
                success: false,
                message:
                    "You do not have access to this meeting."
            };

        }

        // -------------------------
        // Meeting State
        // -------------------------

        if (
            meeting.status !== "in_progress"
        ) {

            return {
                success: false,
                message:
                    "Only in-progress meetings can be completed."
            };

        }

        // -------------------------
        // Complete Meeting
        // -------------------------

        await updateDoc(
            meetingRef,
            {

                status:
                    "completed",

                completedAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUserProfile.uid

            }
        );

        // -------------------------
        // Activity Log
        // -------------------------

        const userName =
            currentUserProfile.displayName ||
            currentUserProfile.name ||
            currentUserProfile.email ||
            currentUserProfile.uid;

        await logActivity(

            null,

            "MEETING_COMPLETED",

            `Meeting "${meeting.title}" completed.`,

            userName,

            "meeting",

            {

                meetingId,

                meetingType:
                    meeting.meetingType,

                organizerId:
                    meeting.organizerId,

                locationType:
                    meeting.locationType

            }

        );

        // -------------------------
        // Success
        // -------------------------

        return {

            success: true

        };

    } catch (error) {

        console.error(
            "completeMeeting:",
            error
        );

        return {

            success: false,

            message:
                "Unable to complete meeting."

        };

    }

}
