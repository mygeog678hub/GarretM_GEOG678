import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.migrateSitesTenant = async function () {

  try {

    const tenantId =
      window.currentUserProfile.tenantId;

    const snapshot =
      await getDocs(
        collection(db, "sites")
      );

    let updated = 0;

    for (const docSnap of snapshot.docs) {

      if (docSnap.data().tenantId) continue;

      await updateDoc(
        doc(db, "sites", docSnap.id),
        {
          tenantId
        }
      );

      updated++;

    }

    alert(
      `Updated ${updated} site(s).`
    );

  } catch (error) {

    console.error(error);

    alert(
      "Site migration failed."
    );

  }

};