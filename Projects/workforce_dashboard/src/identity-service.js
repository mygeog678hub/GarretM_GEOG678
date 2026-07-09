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

  if (!userSnap.exists()) {

    return null;

  }

  return {
    uid: firebaseUser.uid,
    ...userSnap.data()
  };

}