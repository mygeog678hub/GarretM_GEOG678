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

  const firebaseUser =
    auth.currentUser;

    console.log("Firebase User:", firebaseUser);

  if (!firebaseUser) {

    return null;

  }

  const userRef = doc(
    db,
    "users",
    firebaseUser.uid
  );

  const userSnap =
    await getDoc(userRef);

    
console.log("Looking for UID:", firebaseUser.uid);

    console.log("User document exists:", userSnap.exists());

  if (!userSnap.exists()) {

    return null;

  }

  return {
    uid: firebaseUser.uid,
    ...userSnap.data()
  };

}

export async function initializeIdentity() {

    try {

        const currentUserProfile =
            await getCurrentUserProfile();

            console.log(
    "initializeIdentity received:",
    currentUserProfile
);

        if (!currentUserProfile) {

           console.warn(
    "Identity initialization skipped. No authenticated Firebase user yet."
);   

            return false;

        }

        window.currentUserProfile =
            currentUserProfile;

        console.log(
            "Application Profile:",
            currentUserProfile
        );

        return true;

    } catch (err) {

        console.error(
            "Identity initialization failed:",
            err
        );

        return false;

    }

}