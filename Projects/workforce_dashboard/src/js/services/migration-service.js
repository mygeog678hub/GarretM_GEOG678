import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getCurrentUserProfile
} from "./identity-service.js";

/*=============================================
    Generic Tenant Migration
=============================================*/
export async function migrateTenantCollection(
  collectionName
) {

  if (!currentUserProfile?.tenantId) {
    throw new Error(
      "Tenant ID unavailable."
    );
  }

  const tenantId =
    currentUserProfile.tenantId;

  console.group(
    `Migrating ${collectionName}`
  );

  const snapshot =
    await getDocs(
      collection(
        db,
        collectionName
      )
    );

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const documentSnapshot of snapshot.docs) {

    processed++;

    const data =
      documentSnapshot.data();

    if (data.tenantId) {

      skipped++;
      continue;

    }

    try {

      await updateDoc(
        doc(
          db,
          collectionName,
          documentSnapshot.id
        ),
        {
          tenantId
        }
      );

      updated++;

    }
    catch (error) {

      errors++;

      console.error(
        documentSnapshot.id,
        error
      );

    }

  }

 if (processed === 0) {

    console.warn(
        `Migration skipped: "${collectionName}" contains no documents or the collection does not exist.`
    );

}

  console.table({

    Collection: collectionName,
    Processed: processed,
    Updated: updated,
    Skipped: skipped,
    Errors: errors

  });

  console.groupEnd();

  return {

    collection: collectionName,
    processed,
    updated,
    skipped,
    errors

  };

}

/*=============================================
    Migrate All Collections
=============================================*/
export async function migrateAllCollections() {

  const collections = [

    "sites",
    "employees",
    "assets",
    "vehicles",
    "assignments",
    "shifts",
    "openShifts",
    "incidents",
    "siteNotes",
    "activityLogs",
    "timeEntries",
    "patrolTemplates",
    "patrolEvents",
    "checkpoints",
    "users"

  ];

  const results = [];

  for (const name of collections) {

    results.push(
      await migrateTenantCollection(name)
    );

  }

  console.group("Migration Complete");

  console.table(results);

  console.groupEnd();

  return results;

}