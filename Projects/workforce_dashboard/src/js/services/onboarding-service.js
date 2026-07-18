// onboarding-service.js

import { auth, db } from "./firebase-config.js";

import {
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function completeFirstTimePassword(
    newPassword,
    confirmPassword
) {

    if (!newPassword || !confirmPassword) {

        return {
            success: false,
            message: "Please enter both password fields."
        };

    }

    if (newPassword !== confirmPassword) {

        return {
            success: false,
            message: "Passwords do not match."
        };

    }

    if (newPassword.length < 8) {

        return {
            success: false,
            message:
                "Password must be at least 8 characters."
        };

    }

   const user = auth.currentUser;

if (!user) {

    return {
        success: false,
        message: "No authenticated user."
    };

}

try {

    await updatePassword(
        user,
        newPassword
    );

    await updateDoc(
        doc(db, "users", user.uid),
        {
            mustChangePassword: false,
            passwordChangedAt: serverTimestamp()
        }
    );

    return {
        success: true
    };

}
catch (error) {

    console.error(
        "Password setup failed:",
        error
    );

    switch (error.code) {

        case "auth/weak-password":

            return {
                success: false,
                message: "Password must be at least 8 characters."
            };

        case "auth/requires-recent-login":

            return {
                success: false,
                message: "Please sign in again before changing your password."
            };

        default:

            return {
                success: false,
                message: error.message
            };

    }

}

}

export async function verifyProfile(
    profileData
) {

    try {

        const user = auth.currentUser;

        if (!user) {

            return {
                success: false,
                message: "No authenticated user."
            };

        }

        if (!profileData.phone) {

            return {
                success: false,
                message: "Please enter your mobile phone number."
            };

        }

        if (!profileData.emergencyContact) {

            return {
                success: false,
                message: "Please enter an emergency contact."
            };

        }

        if (!profileData.acknowledged) {

            return {
                success: false,
                message: "Please certify that your information is correct."
            };

        }

        await updateDoc(
            doc(db, "users", user.uid),
            {
                profileVerified: true,
                onboardedAt: serverTimestamp()
            }
        );

        return {
            success: true
        };

    }
    catch (error) {

        console.error(
            "Profile verification failed:",
            error
        );

        return {
            success: false,
            message: error.message
        };

    }

}