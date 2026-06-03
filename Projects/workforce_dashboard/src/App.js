// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkVL4FUIyb7A2XRi1CGmDLf6W_jlJ2VuM",
  authDomain: "workforge-3b77f.firebaseapp.com",
  projectId: "workforge-3b77f",
  storageBucket: "workforge-3b77f.firebasestorage.app",
  messagingSenderId: "906291779450",
  appId: "1:906291779450:web:276a14fed6b25dde2f68c3"
};
//===================== INITIALIZE =================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// ================= AUTH =================
onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href = "index.html";

  }

});
// ================= DOM =================
const empName = document.getElementById("empName");
const empRole = document.getElementById("empRole");
const siteName = document.getElementById("siteName");
const siteAddress = document.getElementById("siteAddress");
const siteCity = document.getElementById("siteCity");
const siteState = document.getElementById("siteState");
const siteZip = document.getElementById("siteZip");

const vehMake = document.getElementById("vehMake");
const vehModel = document.getElementById("vehModel");
const vehPlate = document.getElementById("vehPlate");
const vehUnit = document.getElementById("vehUnit");

const assignEmployee = document.getElementById("assignEmployee");
const assignSite = document.getElementById("assignSite");
const assignAsset = document.getElementById("assignAsset");
const assignVehicle = document.getElementById("assignVehicle");
const siteCategory = document.getElementById("siteCategory");
const siteSubtype = document.getElementById("siteSubtype");

// ================= ICONS =================
function createSiteIcon(
  label,
  color,
  symbol
) {

  return L.divIcon({

    className: "custom-site-marker",

    html: `
      <div
        style="
          width:42px;
          height:42px;
          border-radius:50%;
          background:${color};
          color:white;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:700;
          font-size:14px;
          border:3px solid white;
          box-shadow:0 0 10px rgba(0,0,0,0.35);
        "
      >
        <div style="
  display:flex;
  flex-direction:column;
  align-items:center;
  line-height:1;
">
  <span style="font-size:16px;">
    ${symbol}
  </span>

  <span style="font-size:11px;">
    ${label}
  </span>
</div>
      </div>
    `,

    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -40]

  });

}
// ================= STATE =================
let employees = [];
let sites = [];
let assets = [];
let vehicles = [];
let assignments = [];
let pendingDeployments = [];
let markers = {};
let editingEmployeeId = null;
let editingSiteId = null;
let previewSiteId = null;

// ================= MAP =================

document.addEventListener("DOMContentLoaded", () => {

  // Create global map
  window.map = L.map("map").setView(
    [29.7604, -95.3698],
    10
  );

  // ================= TILE LAYERS =================

  const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  );

  const lightMap = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        "&copy; OpenStreetMap &copy; CartoDB"
    }
  );

  const darkMap = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        "&copy; OpenStreetMap &copy; CartoDB"
    }
  );

  // ================= DEFAULT MAP =================

  osm.addTo(window.map);

  // ================= LAYER SWITCHER =================

  L.control.layers({
    "Street Map": osm,
    "Light Canvas": lightMap,
    "Dark Mode": darkMap
  }).addTo(window.map);

  // ================= HOME BUTTON =================

  const homeControl = L.control({
    position: "topleft"
  });

  homeControl.onAdd = function () {

    const div = L.DomUtil.create(
      "div",
      "leaflet-bar leaflet-control"
    );

    div.innerHTML =
      '<button style="padding:5px;">🏠</button>';

    div.onclick = function () {

      window.map.setView(
        [29.7604, -95.3698],
        10
      );

    };

    return div;

  };

  homeControl.addTo(window.map);

  // ================= FORCE RESIZE =================

  setTimeout(() => {

    window.map.invalidateSize();

  }, 500);

});

// ================= LOAD =================
onSnapshot(collection(db, "employees"), snap => {
  employees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  refresh();
});

onSnapshot(collection(db, "sites"), snap => {
  sites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  refresh();
});

onSnapshot(collection(db, "assignments"), snap => {
  assignments = snap.docs
  .map(d => ({
    id: d.id,
    ...d.data()
  }))
  .filter(a => !a.archived);
  refresh();
});

onSnapshot(collection(db, "assets"), snap => {
  assets = snap.docs.map(d => ({
    docId: d.id,
    ...d.data()
  }));
  console.log("Assets Loaded:", assets);
  refresh();
});

onSnapshot(collection(db, "vehicles"), snap => {
  vehicles = snap.docs.map(d => ({
    docId: d.id,
    ...d.data()
  }));
  refresh();
});
// ================= ADD SITE -GEOCODING =================
async function addSite() {
  const name = siteName.value.trim();
  const address =
  siteAddress.value.trim();

const city =
  siteCity.value.trim();

const state =
  siteState.value.trim().toUpperCase();

  const zip =
  siteZip.value.trim();

 if (!name || !address || !city || !state || !zip) {
    alert("Enter site name, address, city, state, and ZIP");
    return;
  }

  // 🔥 Prevent duplicates
  const exists = sites.some(s =>
    s.name.toLowerCase() === name.toLowerCase() &&
    s.city.toLowerCase() === city.toLowerCase() &&
    s.state.toLowerCase() === state.toLowerCase()
  );

  if (exists) {
    alert("Site already exists");
    return;
  }
  
try {

 let coords = [];

// FIRST ATTEMPT
const fullQuery = encodeURIComponent(
  `${address}, ${city}, ${state} ${zip}, USA`
);

console.log("Primary Query:", fullQuery);

let response = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${fullQuery}&format=json&limit=1`
);

coords = await response.json();

// FALLBACK ATTEMPT
if (!coords.length) {

  const fallbackQuery = encodeURIComponent(
    `${address}, ${city}, ${state}, USA`
  );

  console.log("Fallback Query:", fallbackQuery);

  response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${fallbackQuery}&format=json&limit=1`
  );

  coords = await response.json();

}

console.log("Geocode Result:", coords);

if (!coords.length) {

  alert(
    "Location not found. Try another address."
  );

  return;

}

 await addDoc(collection(db, "sites"), {

  name,
  address,
  city,
  state,
  zip,

  siteCategory: siteCategory.value,
  siteSubtype: siteSubtype.value,

  lat: +coords[0].lat,
  lng: +coords[0].lon,

  activeEmployees: [],
  defaultCrew: []

});

  siteName.value = "";
  siteAddress.value = "";
  siteCity.value = "";
  siteState.value = "";
  siteZip.value = "";
  siteName.focus();

} catch (err) {

  console.error("Geocoding Error:", err);

  alert("Geocoding failed");

} 
}
// ================= ADD EMPLOYEE=================
async function addEmployee() {
  const name = empName.value.trim();
  const role = empRole.value.trim();

  if (!name) {
    alert("Enter employee name");
    return;
  } 

  // 🔥 Prevent duplicates
  const exists = employees.some(e =>
    e.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    alert("Employee already exists");
    return;
  }

  await addDoc(collection(db, "employees"), {
    name,
    designation: role,
    createdAt: new Date().toISOString()
  });

  empName.value = "";
  empRole.value = "";
  empName.focus();
}
// ================= DELETE EMPLOYEE=================
async function deleteEmployee(id) {
  const isAssigned = assignments.some(a => a.employeeId === id);

  if (isAssigned) {
    alert("Cannot delete: employee is currently assigned.");
    return;
  }

  if (!confirm("Delete this employee?")) return;

  try {
    await deleteDoc(doc(db, "employees", id));    
  } catch (err) {
    console.error("Delete failed:", err);
  }
}

// REQUIRED if using type="module"
window.deleteEmployee = deleteEmployee;
// ================= ADD ASSET =================
async function addAsset() {

  const id =
    document.getElementById("assetId")
      .value
      .trim();

  const type =
    document.getElementById("assetType")
      .value
      .trim();

  if (!id || !type) {
    alert("Enter asset ID and type");
    return;
  }

  // prevent duplicates
  const exists = assets.some(a =>
    a.id.toLowerCase() === id.toLowerCase()
  );

  if (exists) {
    alert("Asset already exists");
    return;
  }

  await addDoc(collection(db, "assets"), {
    id,
    type,
    status: "active",
    createdAt: new Date().toISOString()
  });

  document.getElementById("assetId").value = "";
  document.getElementById("assetType").value = "";
  document.getElementById("assetId").focus();
}

// ================= ASSIGN =================
async function assign() {
  if (!assignEmployee.value || !assignSite.value) {
    alert("Select employee and site");
    return;
  }

  const active = assignments.find(a =>
    a.employeeId === assignEmployee.value && !a.endTime
  );

  if (active) {
    alert("Employee already assigned");
    return;
  }
  const selectedAsset =
  assets.find(
    a => a.id === assignAsset.value
  );
    console.log("Asset Selected:", assignAsset.value);
    console.log("Vehicle Selected:", assignVehicle.value);
if (
  selectedAsset &&
  selectedAsset.status === "maintenance"
) {

  alert(
    "This asset is currently under maintenance"
  );

  return;
}
  await addDoc(collection(db, "assignments"), {
    employeeId: assignEmployee.value,
    siteId: assignSite.value,
    assetId: assignAsset.value || null,
    vehicleId: assignVehicle.value || null,
    startTime: new Date().toISOString(),
    endTime: null
  });
}

async function endBusinessDay() {

  const activeAssignments =
    assignments.filter(a => !a.endTime);

    console.log(assignments);
    console.log(activeAssignments);

  if (!activeAssignments.length) {

    alert(
      "No active assignments"
    );

    return;

  }

  if (!confirm(
    `Unassign ${activeAssignments.length} active assignments?`
  )) return;

  try {

    for (const assignment of activeAssignments) {

      await updateDoc(
        doc(
          db,
          "assignments",
          assignment.id
        ),
        {
          endTime:
            new Date().toISOString()
        }
      );

    }

    alert(
      "Business day ended"
    );

  } catch (err) {

    console.error(err);

    alert(
      "Failed to end business day"
    );

  }

}

// ================= UNASSIGN =================
async function unassign(empId) {
  const a = assignments.find(x =>
    x.employeeId === empId && !x.endTime
  );

  if (!a) return;

  await updateDoc(doc(db, "assignments", a.id), {
    endTime: new Date().toISOString()
  });
}

// ================= DELETE =================
async function deleteAssignment(id) {

  if (!confirm(
    "Archive this assignment?"
  )) return;

  try {

    await updateDoc(
      doc(db, "assignments", id),
      {
        archived: true,
        archivedAt:
          new Date().toISOString()
      }
    );

    alert("Assignment archived");

  } catch (err) {

    console.error(
      "Archive Error:",
      err
    );

    alert(err.message);
  }
}
// ================= RENDER EMPLOYEES =================
function renderEmployees(filteredList = employees) {

  const rows = filteredList.map(e => `
    <tr>
      <td>
        <input
          type="checkbox"
          class="employeeCheckbox"
          value="${e.id}"
        >
      </td>

      <td>${e.name}</td>

      <td>${e.designation || ""}</td>

      <td>
        <button onclick="editEmployee('${e.id}')">
          Edit
        </button>

        <button onclick="deleteEmployee('${e.id}')">
          Delete
        </button>
      </td>
    </tr>
  `).join("");

  document.getElementById("employeeTable").innerHTML = `
    <tr>
      <th>
        <input
          type="checkbox"
          onclick="toggleAllEmployees(this)"
        >
      </th>

      <th>Name</th>
      <th>Position</th>
      <th>Action</th>
    </tr>

    ${rows}
  `;
}

function toggleAllEmployees(source) {
  const checkboxes =
    document.querySelectorAll(".employeeCheckbox");

  checkboxes.forEach(cb => {
    cb.checked = source.checked;
  });
}

async function deleteSelectedEmployees() {

  const checked =
    document.querySelectorAll(
      ".employeeCheckbox:checked"
    );

  if (!checked.length) {
    alert("No employees selected");
    return;
  }

  if (!confirm(
    `Delete ${checked.length} employees?`
  )) return;

  for (const cb of checked) {

    const employeeId = cb.value;

    const isAssigned = assignments.some(a =>
      a.employeeId === employeeId &&
      !a.endTime
    );

    if (isAssigned) {
      console.log(
        "Skipping assigned employee:",
        employeeId
      );
      continue;
    }

    await deleteDoc(
      doc(db, "employees", employeeId)
    );
  }

  alert("Selected employees deleted");
}

function renderSites(filteredSites = sites) {

  const rows = filteredSites.map(s => {

  const activeEmployees = assignments.filter(a =>
    a.siteId === s.id && !a.endTime
  ).length;

  return `

    <tr>

      <td>
        <input
          type="checkbox"
          class="siteCheckbox"
          value="${s.id}"
        >
      </td>

      <td>${s.name || ""}</td>

      <td>${s.address || ""}</td>

      <td>${s.city || ""}</td>

      <td>${s.state || ""}</td>

      <td>${s.zip || ""}</td>
      <td>
  ${
    activeEmployees > 0
      ? `${activeEmployees} Active`
      : "Empty"
  }
</td>

  <td>

  <button onclick="editSite('${s.id}')">
    Edit
  </button>

  <button onclick="saveDefaultCrew('${s.id}')">
    Save Current Crew
  </button>

  <button onclick="deploySiteCrew('${s.id}')">
    Deploy Crew
  </button>

  <button onclick="clearSiteAssignments('${s.id}')">
    Clear Site
  </button>

</td>

</tr>

`;

}).join("");

  document.getElementById("siteTable").innerHTML = `

    <tr>

      <th>
        <input
          type="checkbox"
          onclick="toggleAllSites(this)"
        >
      </th>

      <th>Name</th>
      <th>Address</th>
      <th>City</th>
      <th>State</th>
      <th>ZIP</th>
      <th>Crew</th>
      <th>Action</th>

    </tr>

    ${rows}

  `;
}

// ================= RENDER =================
function render() {
  const rows = assignments.map(a => {
    const emp = employees.find(e => e.id === a.employeeId);
    const site = sites.find(s => s.id === a.siteId);
    const asset = assets.find(
  x => x.id === a.assetId
);

const vehicle = vehicles.find(
  v => v.id === a.vehicleId
);
 return `
  <tr>

    <td>
      ${
        a.startTime
          ? new Date(a.startTime).toLocaleDateString() +
            " " +
            new Date(a.startTime).toLocaleTimeString()
          : ""
      }
    </td>

    <td>
  ${
    a.endTime
      ? new Date(a.endTime).toLocaleDateString() +
        " " +
        new Date(a.endTime).toLocaleTimeString()
      : ""
  }
</td>

    <td>
      ${emp ? emp.name : `❌ ${a.employeeId}`}
    </td>

    <td>
      ${site ? site.name : `❌ ${a.siteId}`}
    </td>

    <td>
      ${asset ? asset.id : ""}
    </td>    

    <td>
      ${vehicle ? vehicle.id : ""}
    </td>

    <td>
      <span class="${
        a.endTime
          ? 'status-completed'
          : 'status-active'
      }">

        ${
          a.endTime
            ? "Completed"
            : "Active"
        }

      </span>
    </td>

    <td>
      ${
        !a.endTime
          ? `<button onclick="unassign('${a.employeeId}')">
               Unassign
             </button>`

          : `<button onclick="deleteAssignment('${a.id}')">
               Delete
             </button>`
      }
    </td>

  </tr>
`;
  }).join("");

  document.getElementById("reportTable").innerHTML = `
    <tr>
  <th>Start</th>
  <th>End</th>
  <th>Employee</th>
  <th>Site</th>
  <th>Asset</th>
  <th>Vehicle</th>
  <th>Employee Status</th>
  <th>Action</th>
</tr>
    ${rows}
  `;
  renderEmployees();
}

// ================= UPDATE MAP =================

function updateMap() {

  if (!window.map) return;

  // remove deleted markers
  Object.keys(markers).forEach(id => {

    if (!sites.find(s => s.id === id)) {

      window.map.removeLayer(markers[id]);

      delete markers[id];

    }

  });

  sites.forEach(site => {

    if (!site.lat || !site.lng) return;

    const active = assignments.filter(a =>
      a.siteId === site.id && !a.endTime
    );

   let label = "SITE";
let color = "#6b7280";
let symbol = "📍";

// ACTIVE STATUS
if (active.length > 0) {
  color = "#16a34a";
}

// MAINTENANCE
if (site.maintenance) {
  color = "#eab308";
}

// ================= SCHOOLS =================
if (site.siteCategory === "school") {
  symbol = "🏫";

  if (site.siteSubtype === "elementary") {
    label = "ES";
  }

  else if (site.siteSubtype === "middle") {
    label = "MS";
  }

  else if (site.siteSubtype === "high") {
    label = "HS";
  }

  else if (site.siteSubtype === "admin") {
    label = "ADM";
  }

}

// ================= CONSTRUCTION =================
else if (
  site.siteCategory === "construction"
) {
  symbol = "🚧";

  label = "CON";

}

// ================= WAREHOUSE =================
else if (
  site.siteCategory === "warehouse"
) {
  symbol = "🏭";

  label = "WH";

}

// ================= GOVERNMENT =================
else if (
  site.siteCategory === "government"
) {
  symbol = "🏛️";

  label = "GOV";

}

// ================= SCHOOLS =================
if (site.siteCategory === "school") {

  if (site.siteSubtype === "elementary") {
    label = "ES";
  }

  else if (site.siteSubtype === "middle") {
    label = "MS";
  }

  else if (site.siteSubtype === "high") {
    label = "HS";
  }

  else if (site.siteSubtype === "admin") {
    label = "ADM";
  }

}

// ================= CONSTRUCTION =================
else if (
  site.siteCategory === "construction"
) {

  label = "CON";

}

// ================= WAREHOUSE =================
else if (
  site.siteCategory === "warehouse"
) {

  label = "WH";

}

// ================= GOVERNMENT =================
else if (
  site.siteCategory === "government"
) {

  label = "GOV";

}

const icon =
  createSiteIcon(
  label,
  color,
  symbol
);

    // create marker
    if (!markers[site.id]) {

      markers[site.id] = L.marker(
  [site.lat, site.lng],
  {
    icon,
    draggable: true
  }
).addTo(window.map);

// SAVE NEW POSITION
markers[site.id].on("dragend", async (e) => {

  const marker = e.target;

  const position = marker.getLatLng();

  try {

    await updateDoc(
      doc(db, "sites", site.id),
      {
        lat: position.lat,
        lng: position.lng
      }
    );

    console.log(
      `Updated ${site.name}:`,
      position
    );

  } catch (err) {

    console.error(
      "Marker update failed:",
      err
    );

    alert("Failed to save location");

  }

});

  } else {

  if (markers[site.id]._icon) {

    markers[site.id]._icon.innerHTML = `
  <div
    style="
      width:42px;
      height:42px;
      border-radius:50%;
      background:${color};
      color:white;
      display:flex;
      align-items:center;
      justify-content:center;
      border:3px solid white;
      box-shadow:0 0 10px rgba(0,0,0,0.35);
      font-weight:700;
    "
  >

    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      line-height:1;
    ">

      <span style="
        font-size:16px;
      ">
        ${symbol}
      </span>

      <span style="
        font-size:11px;
      ">
        ${label}
      </span>

    </div>

  </div>
`;

  }

  markers[site.id].setLatLng([
    site.lat,
    site.lng
  ]);

}

    const marker = markers[site.id];

    let popup =
      `<b>${site.name}</b><br>` +
      `${site.city}, ${site.state}<br><br>`;

    if (!active.length) {

      popup += "No active assignments";

    } else {

      popup += "<b>Employees:</b><br>";

      active.forEach(a => {

        const emp =
          employees.find(
            e => e.id === a.employeeId
          );

        const asset =
          assets.find(
            x => x.id === a.assetId
          );

        const vehicle =
          vehicles.find(
            v => v.id === a.vehicleId
          );

        popup += `
          <div style="margin-bottom:8px;">

            <b>
              ${emp?.name || "Unknown"}
            </b><br>

            Asset:
            ${asset ? asset.id : "None"}<br>

            Vehicle:
            ${vehicle ? vehicle.id : "None"}

          </div>
        `;

      });

    }

    if (site.maintenance) {

      popup +=
        "<br><b>Maintenance Required</b>";

    }

    marker.bindPopup(popup);

  });

}

function updateSubtypeOptions() {

  const category =
    document.getElementById(
      "siteCategory"
    ).value;

  const subtype =
    document.getElementById(
      "siteSubtype"
    );

  // ================= SCHOOL =================
  if (category === "school") {

    subtype.innerHTML = `

      <option value="elementary">
        Elementary School
      </option>

      <option value="middle">
        Middle School
      </option>

      <option value="high">
        High School
      </option>

      <option value="admin">
        Administration
      </option>

    `;

  }

  // ================= CONSTRUCTION =================
  else if (
    category === "construction"
  ) {

    subtype.innerHTML = `

      <option value="commercial">
        Commercial
      </option>

      <option value="residential">
        Residential
      </option>

      <option value="roadwork">
        Roadwork
      </option>

      <option value="utilities">
        Utilities
      </option>

    `;

  }

  // ================= WAREHOUSE =================
  else if (
    category === "warehouse"
  ) {

    subtype.innerHTML = `

      <option value="distribution">
        Distribution
      </option>

      <option value="storage">
        Storage
      </option>

      <option value="cold">
        Cold Storage
      </option>

    `;

  }

  // ================= GOVERNMENT =================
  else if (
    category === "government"
  ) {

    subtype.innerHTML = `

      <option value="police">
        Police
      </option>

      <option value="fire">
        Fire
      </option>

      <option value="city">
        City Services
      </option>

    `;

  }

}

// ================= REFRESH =================
function refresh() {

  const validSiteIds =
    sites.map(s => s.id);

  // remove assignments tied to deleted sites
  assignments = assignments.filter(a =>
    validSiteIds.includes(a.siteId)
  );

  // ================= EMPLOYEE DROPDOWN =================
 assignEmployee.innerHTML =
  employees.map(e => `
    <option value="${e.id}">
      ${e.name}
    </option>
  `).join("");

  // ================= SITE DROPDOWN =================
  assignSite.innerHTML =
    sites.map(s => `
      <option value="${s.id}">
        ${s.name}
      </option>
    `).join("");

  // ================= ASSET DROPDOWN =================
  const selectedAsset =
    assignAsset.value;

  assignAsset.innerHTML =
    `<option value="">None</option>` +
    assets.map(a => `
     <option
  value="${a.id}"
  ${
    a.status === "maintenance"
      ? "disabled"
      : ""
  }
>
  ${a.id} - ${a.type}
  ${
    a.status === "maintenance"
      ? "(MAINTENANCE)"
      : "(ACTIVE)"
  }
</option>
    `).join("");

  assignAsset.value =
    selectedAsset;

  // ================= VEHICLE DROPDOWN =================
  const selectedVehicle =
    assignVehicle.value;

  assignVehicle.innerHTML =
    `<option value="">None</option>` +
    vehicles.map(v => `
      <option value="${v.id}">
        ${v.id}
      </option>
    `).join("");

  assignVehicle.value =
    selectedVehicle;

  // ================= MAINTENANCE DROPDOWN =================
  const maintenanceAssetSelect =
    document.getElementById(
      "maintenanceAssetSelect"
    );

  if (maintenanceAssetSelect) {

    const selectedMaintenanceAsset =
      maintenanceAssetSelect.value;

    maintenanceAssetSelect.innerHTML =
  `
    <option value="">
      -- Select Asset For Maintenance --
    </option>
  ` +
  assets.map(a => `
    <option value="${a.id}">
      ${a.id} - ${a.type || "Unknown Type"}
    </option>
  `).join("");

    maintenanceAssetSelect.value =
      selectedMaintenanceAsset;
  }
 
  document.getElementById("employeeCount").textContent =
  employees.length;

document.getElementById("assignmentCount").textContent =
  assignments.filter(a => !a.endTime).length;

document.getElementById("siteCount").textContent =
  sites.length;

document.getElementById("maintenanceCount").textContent =
  assets.filter(
    a => a.status === "maintenance"
  ).length;

  render();

  updateMap();
  const siteModal =
  document.getElementById("siteModal");

if (
  siteModal &&
  siteModal.style.display === "block"
) {
  renderSites();
}
}

// ================= EMPLOYEE MODAL =================
function viewEmployees() {
  const modal = document.getElementById("employeeModal");

  renderEmployees();

  document.getElementById("employeeSearch").value = "";

  modal.style.display = "block";
}
// optional alias so old code still works
function openEmployeeModal() {
  viewEmployees();
}

function outsideModalClick(event) {
  const content = document.getElementById("employeeModalContent");

  // close only if clicking overlay
  if (!content.contains(event.target)) {
    closeEmployeeModal();
  }
}

function filterEmployees() {
  const search =
    document.getElementById("employeeSearch")
      .value
      .toLowerCase();

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search)
  );

  const rows = filtered.map(e => `
    <tr>
      <td>${e.name}</td>
      <td>${e.designation || ""}</td>
      <td>
        <button onclick="deleteEmployee('${e.id}')">
          Delete
        </button>
      </td>
    </tr>
  `).join("");

  document.getElementById("employeeTable").innerHTML = `
    <tr>
      <th>Name</th>
      <th>Position</th>
      <th>Action</th>
    </tr>
    ${rows}
  `;
}
function closeEmployeeModal() {
  const modal = document.getElementById("employeeModal");

  if (modal) {
    modal.style.display = "none";
  }
}

// ================= EXPORT EXCEL =================
function exportExcel() {

  let csv =
    "empID,Start,End,Site,empName,designation,asset,assetStatus,vehicle,employeeStatus\n";

  assignments.forEach(a => {

    const emp = employees.find(
      e => e.id === a.employeeId
    );

    const site = sites.find(
      s => s.id === a.siteId
    );

    const asset = assets.find(
      x => x.id === a.assetId
    );

    const vehicle = vehicles.find(
      v => v.id === a.vehicleId
    );

    const start =
      a.startTime
        ? new Date(a.startTime).toLocaleString()
        : "";

    const end =
      a.endTime
        ? new Date(a.endTime).toLocaleString()
        : "";

    const row = [
      a.employeeId || "",
      `"${start}"`,
      `"${end}"`,
      site?.name || "",
      emp?.name || "",
      emp?.designation || "",
      asset?.id || "",
      asset?.status || "",
      vehicle?.id || "",
      a.endTime ? "Completed" : "Active"
    ];

    csv += row.join(",") + "\n";
  });

  const blob = new Blob(
    [csv],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const link = document.createElement("a");

  const url = URL.createObjectURL(blob);

  link.href = url;

  link.download = "daily_report.csv";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}

async function markMaintenance() {

  try {

    const assetId =
      document.getElementById(
        "maintenanceAssetSelect"
      ).value;

    console.log("Selected Asset:", assetId);

    if (!assetId) {
      alert("Select an asset");
      return;
    }

    const asset = assets.find(a =>
      a.id === assetId
    );

    console.log("Matched Asset:", asset);

    if (!asset) {
      alert("Asset not found");
      return;
    }

    await updateDoc(
      doc(db, "assets", asset.docId),
      {
        status: "maintenance"
      }
    );

    console.log("Maintenance Updated");

    alert(`${assetId} set to maintenance`);

  } catch (err) {

    console.error(
      "Maintenance Error:",
      err
    );

    alert(err.message);
  }
}

async function markActive() {

  try {

    const assetId =
      document.getElementById(
        "maintenanceAssetSelect"
      ).value;

    if (!assetId) {
      alert("Select an asset");
      return;
    }

    const asset = assets.find(a =>
      a.id === assetId
    );

    if (!asset) {
      alert("Asset not found");
      return;
    }

    await updateDoc(
      doc(db, "assets", asset.docId),
      {
        status: "active"
      }
    );

    alert(`${assetId} set to active`);

  } catch (err) {

    console.error(
      "Active Error:",
      err
    );

    alert(err.message);
  }
}
// ================= ADD VEHICLE =================
async function addVehicle() {

  if (!vehMake.value || !vehModel.value) {
    alert("Enter vehicle make and model");
    return;
  }

  const id = "VEH-" + Date.now();

  await addDoc(collection(db, "vehicles"), {
    id,
    make: vehMake.value,
    model: vehModel.value,
    plate: vehPlate.value,
    unit: vehUnit.value,
    createdAt: new Date().toISOString()
  });

  vehMake.value = "";
  vehModel.value = "";
  vehPlate.value = "";
  vehUnit.value = "";
  vehMake.focus();
}

async function reportIssue() {

  try {

    const module =
      document.getElementById("bugModule").value;

    const description =
      document.getElementById("bugDescription").value;

    const email =
      document.getElementById("bugEmail").value;

    const severity =
      document.getElementById("bugSeverity").value;

    if (!module || !description || !email) {
      alert("Complete all fields");
      return;
    }

    await addDoc(
      collection(db, "issues"),
      {
        module,
        description,
        email,
        severity,
        createdAt: new Date().toISOString(),
        status: "open"
      }
    );

    alert("Issue submitted");

    document.getElementById("bugModule").value = "";
    document.getElementById("bugDescription").value = "";
    document.getElementById("bugEmail").value = "";
    document.getElementById("bugSeverity").value = "Low";

  } catch (err) {

    console.error(
      "Issue Submit Error:",
      err
    );

    alert(err.message);
  }
}

async function deleteSite(siteId) {

  const activeAssignments =
    assignments.some(a =>
      a.siteId === siteId &&
      !a.endTime
    );

  if (activeAssignments) {
    alert(
      "Cannot delete site with active assignments"
    );
    return;
  }

  if (!confirm("Delete this site?"))
    return;

  try {

    await deleteDoc(
      doc(db, "sites", siteId)
    );

    alert("Site deleted");

  } catch (err) {

    console.error(
      "Delete Site Error:",
      err
    );

    alert(err.message);
  }
}

// ================= LOGOUT =================

async function logout() {

  try {

    await signOut(auth);

    window.location.href = "index.html";

  } catch (err) {

    console.error("Logout Error:", err);

    alert(err.message);

  }

}

function searchSite() {

  const query =
    document.getElementById("siteSearch")
      .value
      .toLowerCase();

  const match = sites.find(s =>

    s.name.toLowerCase().includes(query)

  );

  if (!match) return;

  window.map.flyTo(
    [match.lat, match.lng],
    16
  );

  const marker = markers[match.id];

  if (marker) {

    marker.openPopup();

  }

}

function openSiteModal() {

  renderSites();

  document.getElementById(
    "siteModal"
  ).style.display = "block";

}

function closeSiteModal() {

  document.getElementById(
    "siteModal"
  ).style.display = "none";

}

function outsideSiteModalClick(event) {

  const content =
    document.getElementById(
      "siteModalContent"
    );

  if (!content.contains(event.target)) {

    closeSiteModal();

  }

}

function filterSites() {

  const query =
    document.getElementById(
      "siteSearchModal"
    )
    .value
    .toLowerCase();

  const filtered = sites.filter(s =>

    (s.name || "")
      .toLowerCase()
      .includes(query)

    ||

    (s.address || "")
      .toLowerCase()
      .includes(query)

    ||

    (s.city || "")
      .toLowerCase()
      .includes(query)

  );

  renderSites(filtered);

}

function toggleAllSites(source) {

  const checkboxes =
    document.querySelectorAll(
      ".siteCheckbox"
    );

  checkboxes.forEach(cb => {

    cb.checked = source.checked;

  });

}

async function deleteSelectedSites() {

  const checked =
    document.querySelectorAll(
      ".siteCheckbox:checked"
    );

  if (!checked.length) {

    alert("No sites selected");

    return;

  }

  if (!confirm(
    `Delete ${checked.length} sites?`
  )) return;

  for (const cb of checked) {

    const siteId = cb.value;

    const activeAssignments =
      assignments.some(a =>

        a.siteId === siteId &&
        !a.endTime

      );

    if (activeAssignments) {

      console.log(
        "Skipping active site:",
        siteId
      );

      continue;

    }

    await deleteDoc(
      doc(db, "sites", siteId)
    );

  }

  alert("Selected sites deleted");

}

function editEmployee(id) {

  const emp =
    employees.find(e => e.id === id);

  if (!emp) return;

  editingEmployeeId = id;

  document.getElementById(
    "editEmpName"
  ).value = emp.name || "";

  document.getElementById(
    "editEmpRole"
  ).value = emp.designation || "Worker";

  document.getElementById(
    "editEmployeeModal"
  ).style.display = "block";

}

async function saveEmployeeEdit() {

  if (!editingEmployeeId) return;

  const name =
    document.getElementById(
      "editEmpName"
    ).value.trim();

  const designation =
    document.getElementById(
      "editEmpRole"
    ).value.trim();

  if (!name) {

    alert("Enter employee name");

    return;

  }

  try {

    await updateDoc(
      doc(
        db,
        "employees",
        editingEmployeeId
      ),
      {
        name,
        designation
      }
    );

    closeEditEmployeeModal();

  } catch (err) {

    console.error(err);

    alert("Failed to update employee");

  }

}

function closeEditEmployeeModal() {

  document.getElementById(
    "editEmployeeModal"
  ).style.display = "none";

  editingEmployeeId = null;

}

function editSite(id) {

  const site =
    sites.find(s => s.id === id);

  if (!site) return;

  editingSiteId = id;

  document.getElementById(
    "editSiteName"
  ).value = site.name || "";

  document.getElementById(
    "editSiteAddress"
  ).value = site.address || "";

  document.getElementById(
    "editSiteCity"
  ).value = site.city || "";

  document.getElementById(
    "editSiteState"
  ).value = site.state || "";

  document.getElementById(
    "editSiteZip"
  ).value = site.zip || "";
  document.getElementById(
  "editSiteCategory"
).value =
  site.siteCategory || "school";

document.getElementById(
  "editSiteSubtype"
).value =
  site.siteSubtype || "elementary";

  document.getElementById(
    "editSiteModal"
  ).style.display = "block";

}

function closeEditSiteModal() {

  document.getElementById(
    "editSiteModal"
  ).style.display = "none";

  editingSiteId = null;

}

async function saveSiteEdit() {

  if (!editingSiteId) return;

  const name =
    document.getElementById(
      "editSiteName"
    ).value.trim();

  const address =
    document.getElementById(
      "editSiteAddress"
    ).value.trim();

  const city =
    document.getElementById(
      "editSiteCity"
    ).value.trim();

  const state =
    document.getElementById(
      "editSiteState"
    ).value.trim();

  const zip =
  
    document.getElementById(
      "editSiteZip"
    ).value.trim();
    const siteCategory =
  document.getElementById(
    "editSiteCategory"
  ).value;

const siteSubtype =
  document.getElementById(
    "editSiteSubtype"
  ).value;
  if (
    !name ||
    !address ||
    !city ||
    !state ||
    !zip
  ) {

    alert(
      "Complete all site fields"
    );

    return;

  }

  try {

    // ================= GEOCODE =================

    let coords = [];

    const query =
      encodeURIComponent(
        `${address}, ${city}, ${state} ${zip}, USA`
      );

    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
    );

    coords = await response.json();

    // fallback
    if (!coords.length) {

      const fallback =
        encodeURIComponent(
          `${address}, ${city}, ${state}, USA`
        );

      response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${fallback}&format=json&limit=1`
      );

      coords = await response.json();

    }

    if (!coords.length) {

      alert(
        "Location not found"
      );

      return;

    }

    // ================= UPDATE =================

    await updateDoc(
  doc(
    db,
    "sites",
    editingSiteId
  ),
  {

    name,
    address,
    city,
    state,
    zip,

    siteCategory,
    siteSubtype,

    lat: +coords[0].lat,
    lng: +coords[0].lon

  }
);

    closeEditSiteModal();

  } catch (err) {

    console.error(err);

    alert(
      "Failed to update site"
    );

  }

}

async function saveDefaultCrew(siteId) {

  try {

    // find active assignments for this site
    const crewAssignments =
      assignments.filter(a =>

        a.siteId === siteId &&
        !a.endTime

      );

    // extract employee IDs
    const employeeIds = [

  ...new Set(
    crewAssignments.map(
      a => a.employeeId
    )
  )

];

    // update site
    await updateDoc(
      doc(db, "sites", siteId),
      {
        defaultCrew: employeeIds
      }
    );

    const site =
      sites.find(s => s.id === siteId);

    alert(
      `${employeeIds.length} employees saved to ${site?.name || "site"} default crew.`
    );

  } catch (err) {

    console.error(err);

    alert(
      "Failed to save default crew"
    );

  }

}

async function deployDefaultCrews() {

  try {

    const sitesSnap =
      await getDocs(collection(db, "sites"));

    let deployedCount = 0;

    for (const siteDoc of sitesSnap.docs) {

      const site = siteDoc.data();

      const crew =
        site.defaultCrew || [];

      console.log(
        "Deploying Crew:",
        crew
      );

      for (const employeeId of crew) {

        const alreadyAssigned =
          assignments.find(a =>

            a.employeeId === employeeId &&
            !a.endTime

          );

        if (alreadyAssigned) {
          continue;
        }

        await addDoc(
          collection(db, "assignments"),
          {
            employeeId,
            siteId: siteDoc.id,
            assetId: null,
            vehicleId: null,
            startTime:
              new Date().toISOString(),
            endTime: null
          }
        );

        deployedCount++;

      }

    }

    alert(
      `${deployedCount} crew assignments deployed`
    );

  } catch (err) {

    console.error(err);

    alert(
      "Failed to deploy crews"
    );

  }

}
// ================= GLOBAL =================
async function clearSiteAssignments(siteId) {

  try {

    const activeAssignments =
      assignments.filter(a =>

        a.siteId === siteId &&
        !a.endTime

      );

    console.log(
      "Assignments Found:",
      activeAssignments
    );

    if (!activeAssignments.length) {

      alert("No active assignments");

      return;

    }

    if (!confirm(
      `Clear ${activeAssignments.length} assignments from this site?`
    )) return;

    for (const assignment of activeAssignments) {

      await updateDoc(
        doc(db, "assignments", assignment.id),
        {
          endTime:
            new Date().toISOString()
        }
      );

    }

    alert("Site cleared.");

  } catch (err) {

    console.error(err);

    alert("Failed to clear site");

  }

}
// ================= GLOBAL =================
async function deploySiteCrew(siteId) {

  const site =
    sites.find(s => s.id === siteId);

  if (!site) {
    alert("Site not found");
    return;
  }

  const crew =
    site.defaultCrew || [];

  if (!crew.length) {

    alert(
      "No default crew saved for this site"
    );

    return;

  }

  pendingDeployments = [];

  crew.forEach(employeeId => {

    const employee =
      employees.find(
        e => e.id === employeeId
      );

    const alreadyAssigned =
      assignments.find(a =>

        a.employeeId === employeeId &&
        !a.endTime

      );

    pendingDeployments.push({
      employeeId,
      employeeName:
        employee?.name || "Unknown",
      siteId,
      siteName: site.name,
      alreadyAssigned
    });

  });

  previewSiteId = siteId;

  renderDeploymentPreview();

}
// ================= GLOBAL =================
async function archiveAllCompletedAssignments() {

  try {

    const completedAssignments =
      assignments.filter(a => a.endTime);

    if (!completedAssignments.length) {

      alert(
        "No completed assignments to archive"
      );

      return;

    }

    if (!confirm(
      `Archive ${completedAssignments.length} completed assignments?`
    )) return;

    for (const assignment of completedAssignments) {

      await updateDoc(
        doc(db, "assignments", assignment.id),
        {
          archived: true,
          archivedAt:
            new Date().toISOString()
        }
      );

    }

    alert(
      `${completedAssignments.length} assignments archived`
    );

  } catch (err) {

    console.error(err);

    alert(
      "Failed to archive assignments"
    );

  }

}
// ================= GLOBAL =================
function renderDeploymentPreview() {

  const modal =
    document.getElementById(
      "deployPreviewModal"
    );

  const body =
    document.getElementById(
      "deployPreviewBody"
    );

  // GROUP BY SITE
const grouped = {};

const site =
  sites.find(s => s.id === previewSiteId);

if (site) {

  grouped[site.id] = {
    siteName: site.name,
    employees: []
  };

}
// populate employees
pendingDeployments.forEach(d => {

  if (!grouped[d.siteId]) return;

  grouped[d.siteId].employees.push(d);

});

  body.innerHTML = Object.entries(grouped)
    .map(([siteId, group]) => `

      <div style="
        margin-bottom:25px;
        padding:15px;
        border:1px solid #ccc;
        border-radius:8px;
        color:#111;
      ">

        <h3>
          ${group.siteName}
        </h3>

        ${group.employees.map(emp => `

          <div style="
            margin-bottom:10px;
            padding:8px;
            border-bottom:1px solid #eee;
          ">

            <b>${emp.employeeName}</b>

            <br>

            Status:
            ${
              emp.alreadyAssigned
                ? "Already Assigned"
                : "Ready"
            }

            <br><br>

            <button
              onclick="removePendingDeployment(
                '${siteId}',
                '${emp.employeeId}'
              )"
            >
              Remove
            </button>

          </div>

        `).join("")}

        <div style="
          margin-top:15px;
        ">

          <select id="addEmployee-${siteId}">

            <option value="">
              Add Employee
            </option>

            ${
              employees.map(e => `

                <option value="${e.id}">
                  ${e.name}
                </option>

              `).join("")
            }

          </select>

          <button
            onclick="addEmployeeToSite('${siteId}')"
          >
            Add
          </button>

        </div>

      </div>

    `).join("");

  modal.style.display = "block";

}

function removePendingDeployment(
  siteId,
  employeeId
) {

  pendingDeployments =
    pendingDeployments.filter(d =>

      !(
        d.siteId === siteId &&
        d.employeeId === employeeId
      )

    );

  renderDeploymentPreview();

}

function closeDeployPreview() {

  document.getElementById(
    "deployPreviewModal"
  ).style.display = "none";

  pendingDeployments = [];

}

async function confirmDeployment() {

  try {

    let deployedCount = 0;

    for (const d of pendingDeployments) {

     const activeAssignment =
  assignments.find(a =>

    a.employeeId === d.employeeId &&
    !a.endTime

  );

if (activeAssignment) {
  continue;
}

      await addDoc(
        collection(db, "assignments"),
        {
          employeeId: d.employeeId,
          siteId: d.siteId,
          assetId: null,
          vehicleId: null,
          startTime:
            new Date().toISOString(),
          endTime: null
        }
      );

      deployedCount++;

    }

    closeDeployPreview();

    alert(
      `${deployedCount} crew members deployed`
    );

  } catch (err) {

    console.error(err);

    alert(
      "Deployment failed"
    );

  }

}
// ================= GLOBAL =================
function addEmployeeToSite(siteId) {

  const select =
    document.getElementById(
      `addEmployee-${siteId}`
    );

  const employeeId =
    select.value;

  if (!employeeId) return;

  const employee =
    employees.find(
      e => e.id === employeeId
    );

  if (!employee) return;

  const site =
    sites.find(
      s => s.id === siteId
    );

  if (!site) return;

  // prevent duplicates
  const exists =
  pendingDeployments.some(d =>

    d.siteId === siteId &&
    d.employeeId === employeeId

  );

  if (exists) {

    alert(
      "Employee already added"
    );

    return;

  }

  pendingDeployments.push({

    employeeId,
    employeeName: employee.name,
    siteId,
    siteName: site.name,
    alreadyAssigned: false

  });

  renderDeploymentPreview();

}

// ================= GLOBAL =================
window.addEmployee = addEmployee;
window.addSite = addSite;
window.addAsset = addAsset;
window.addVehicle = addVehicle;
window.assign = assign;
window.unassign = unassign;
window.deleteAssignment = deleteAssignment;
window.deleteEmployee = deleteEmployee;
window.openEmployeeModal = openEmployeeModal;
window.closeEmployeeModal = closeEmployeeModal;
window.exportExcel = exportExcel;
window.viewEmployees = viewEmployees;
window.filterEmployees = filterEmployees;
window.outsideModalClick = outsideModalClick;
window.toggleAllEmployees = toggleAllEmployees;
window.deleteSelectedEmployees = deleteSelectedEmployees;
window.markMaintenance = markMaintenance;
window.markActive = markActive;
window.reportIssue = reportIssue;
window.deleteSite = deleteSite;
window.logout = logout;
window.searchSite = searchSite;
window.openSiteModal = openSiteModal;
window.closeSiteModal = closeSiteModal;
window.filterSites = filterSites;
window.toggleAllSites = toggleAllSites;
window.deleteSelectedSites = deleteSelectedSites;
window.outsideSiteModalClick = outsideSiteModalClick;
window.editEmployee = editEmployee;
window.saveEmployeeEdit = saveEmployeeEdit;
window.closeEditEmployeeModal = closeEditEmployeeModal;
window.editSite = editSite;
window.closeEditSiteModal = closeEditSiteModal;
window.saveSiteEdit = saveSiteEdit;
window.endBusinessDay = endBusinessDay;
window.saveDefaultCrew = saveDefaultCrew;
window.deployDefaultCrews = deployDefaultCrews;
window.deploySiteCrew = deploySiteCrew;
window.archiveAllCompletedAssignments = archiveAllCompletedAssignments;
window.clearSiteAssignments = clearSiteAssignments;
window.confirmDeployment = confirmDeployment;
window.closeDeployPreview = closeDeployPreview;
window.removePendingDeployment = removePendingDeployment;
window.addEmployeeToSite = addEmployeeToSite;
window.updateSubtypeOptions = updateSubtypeOptions;
