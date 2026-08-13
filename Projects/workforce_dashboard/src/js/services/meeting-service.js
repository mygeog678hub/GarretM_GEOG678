import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getCurrentUserProfile
} from "./identity-service.js";


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
    locationType

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
            currentUserProfile.role !== "Admin" &&
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

            startTime,

            endTime,

            timezone:
                timezone.trim(),

            status:
                "draft",

            locationType,

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