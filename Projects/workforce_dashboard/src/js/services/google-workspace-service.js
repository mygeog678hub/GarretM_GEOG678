/**
 * ==================================================
 * WorkForge v1.1.0
 * Google Workspace Service
 * ==================================================
 *
 * Manages tenant-level Google Workspace integration.
 *
 * Responsibilities:
 *  - Connection status
 *  - OAuth lifecycle
 *  - Workspace metadata
 *
 * This service does NOT create meetings.
 * Operations Meetings are handled by meetings-service.js.
 * ==================================================
 */

import {
    db
} from "./firebase-config.js";

import { app } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getFunctions,
    httpsCallable
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const functions =
    getFunctions(app);

export async function getGoogleWorkspaceStatus() {

    try {

        const tenantId =
            window.currentUserProfile?.tenantId;

        if (!tenantId) {

            return {
                success: false,
                message: "Tenant not available."
            };

        }

        const ref =
            doc(
                db,
                "tenantIntegrations",
                tenantId
            );

        const snap =
            await getDoc(ref);

        if (!snap.exists()) {

            return {
                success: true,
                connected: false
            };

        }

        return {
            success: true,
            ...snap.data()
        };

    }
    catch (error) {

        console.error(
            "Google Workspace:",
            error
        );

        return {
            success: false,
            message: error.message
        };

    }

}

export async function connectGoogleWorkspace() {

    console.log(
        "Starting Google Workspace authorization..."
    );

    console.log(
    "Tenant ID:",
    window.currentUserProfile.tenantId,
);

    const startOAuth =
    httpsCallable(
        functions,
        "startGoogleWorkspaceOAuth",
    );

const result =
    await startOAuth({
        tenantId:
            window.currentUserProfile.tenantId,
    });

    if (
        result.data.success &&
        result.data.authorizationUrl
    ) {

        window.location.href =
            result.data.authorizationUrl;

    } else {

        console.error(
            "OAuth initialization failed.",
            result.data
        );

    }

}

export async function disconnectGoogleWorkspace() {

    return {
        success: false,
        message: "Not implemented."
    };

}

export async function createGoogleCalendarTestEvent() {

    const createTest =
        httpsCallable(
            functions,
            "createGoogleCalendarTestEvent",
        );

    const result =
        await createTest({

            tenantId:
                window.currentUserProfile.tenantId,

        });

    return result.data;

}

window.createGoogleCalendarTestEvent =
    createGoogleCalendarTestEvent;