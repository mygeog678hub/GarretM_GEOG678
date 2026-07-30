import {
  storage
} from "./firebase-config.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


async function uploadImage({
  tenantId,
  folder,
  entityId,
  file
}) {

  if (!tenantId)
    throw new Error("tenantId is required.");

  if (!folder)
    throw new Error("folder is required.");

  if (!entityId)
    throw new Error("entityId is required.");

  if (!file)
    throw new Error("file is required.");

  const safeName =
    file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

const fileName =
    `${Date.now()}-${safeName}`;

  const uploadRef = storageRef(
    storage,
    `tenants/${tenantId}/${folder}/${entityId}/${fileName}`
  );

  const snapshot =
    await uploadBytes(
      uploadRef,
      file
    );

  const url =
    await getDownloadURL(
      snapshot.ref
    );

  return {
    success: true,
    url,
    path: snapshot.ref.fullPath,
    timestamp: Date.now()
  };

}


async function uploadPreShiftPhoto(
  file,
  tenantId,
  employeeId
) {

  return uploadImage({

    tenantId,

    folder: "preShiftPhotos",

    entityId: employeeId,

    file

  });

}


export {

  uploadImage,

  uploadPreShiftPhoto

};