import {
  auth,
  db
} from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/**
 * Returns the authenticated user's
 * WorkForge profile.
 */
export async function getCurrentUserProfile() {

    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {

        return null;

    }

    // -------------------------
    // Identity
    // -------------------------

    const userRef = doc(
        db,
        "users",
        firebaseUser.uid
    );

const userSnap = await getDoc(userRef);

if (!userSnap.exists()) {

    console.error(
        `User profile document not found for UID: ${firebaseUser.uid}`
    );

    return null;

}

// -------------------------
// User Settings
// -------------------------

const settingsRef = doc(
    db,
    "userSettings",
    firebaseUser.uid
);

const settingsSnap =
    await getDoc(settingsRef);

if (!settingsSnap.exists()) {

    console.error(
        `Missing userSettings document for user ${firebaseUser.uid}.`
    );

    throw new Error(
    `User settings document is missing for UID: ${firebaseUser.uid}`
);

}

const profile = {

    ...userSnap.data(),

    ...settingsSnap.data()

};

    return {

        uid: firebaseUser.uid,

        ...profile,

        onboardingRequired:
    profile.mustChangePassword === true ||
    profile.profileVerified !== true

    };

}

export async function initializeIdentity() {

    try {

        const currentUserProfile =
            await getCurrentUserProfile();  

        if (!currentUserProfile) {

           console.warn(
    "Identity initialization skipped. No authenticated Firebase user yet."
);   

            return false;

        }

        window.currentUserProfile =
            currentUserProfile;     

        return true;

    } catch (err) {

        console.error(
            "Identity initialization failed:",
            err
        );

        return false;

    }

}