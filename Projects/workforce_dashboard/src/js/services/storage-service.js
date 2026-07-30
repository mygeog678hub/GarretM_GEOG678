import {
  storage
} from "./firebase-config.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

async function uploadPreShiftPhoto(
  file,
  tenantId,
  employeeId
) {
    console.log("storage:", storage);

  const fileName =
    `${Date.now()}-${file.name}`;

    console.log("storage =", storage);
    console.log("storage.app =", storage.app);
    console.log("storageRef =", storageRef);
    console.log("typeof storageRef =", typeof storageRef);
    console.log("tenantId:", tenantId);
    console.log("employeeId:", employeeId);
    console.log("file:", file);
    console.log("file.name:", file?.name);
    console.log(import.meta.url);

let uploadRef;

try {

  uploadRef = storageRef(
    storage,
    `tenants/${tenantId}/preShiftPhotos/${employeeId}/${fileName}`
  );

  console.log("uploadRef", uploadRef);

} catch (e) {

  console.error("storageRef failed", e);
  console.error(e.stack);

  throw e;
}

console.log("Starting upload...");

const snapshot = await uploadBytes(
  uploadRef,
  file
);

console.log("Upload complete", snapshot);

const url = await getDownloadURL(snapshot.ref);

console.log("Download URL", url);

return {
  url,
  path: snapshot.ref.fullPath
};

}

export {
  uploadPreShiftPhoto
};