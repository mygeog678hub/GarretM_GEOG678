import {
  storage
} from "./firebase-config.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

async function uploadPreShiftPhoto(
  file,
  tenantId,
  employeeId
) {

  const fileName =
    `${Date.now()}-${file.name}`;

  const storageRef =
    ref(
      storage,
      `tenants/${tenantId}/preShiftPhotos/${employeeId}/${fileName}`
    );

  const snapshot =
    await uploadBytes(
      storageRef,
      file
    );

  const url =
    await getDownloadURL(
      snapshot.ref
    );

  return {
    url,
    path:
      snapshot.ref.fullPath
  };

}

export {
  uploadPreShiftPhoto
};