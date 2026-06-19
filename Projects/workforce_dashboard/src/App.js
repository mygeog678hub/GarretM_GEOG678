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
  serverTimestamp,
  increment,
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

    window.location.href =
      "index.html";

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
let shifts = [];
let pendingDeployments = [];
let markers = {};
const geofenceCircles = {};
const activeIncidentMarkers = {};
const activeIncidentGeofences = {};
const criticalAlert =
  new Audio(
    "./assets/critical-alert.mp3"
  );

criticalAlert.preload = "auto";
window.markers = markers;
window.geofenceCircles = geofenceCircles;
window.activeIncidentMarkers = activeIncidentMarkers;
let searchMarker = null;
let markerEditMode = false;
let editingEmployeeId = null;
let editingSiteId = null;
let previewSiteId = null;
let currentMapFilter = "all";
let activityLogs = [];
let activityFilter = "all";
let siteNotes = [];
let showActiveSites = true;
let showInactiveSites = false;
let showClosedSites = false;
let timeEntries = [];
let missingClockInList = [];
let postMonitoringTimer = null;



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

  // ================= HOME BUTTON =================

  const homeControl = L.control({
    position: "topleft"
  });

  homeControl.onAdd = function () {

  const div = L.DomUtil.create(
  "div"
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
  // ================= ADDRESS SEARCH CONTROL =================

const searchControl = L.control({
  position: "topright"
});

searchControl.onAdd = function () {

  const div = L.DomUtil.create(
    "div",
    "leaflet-bar"
  );

  div.innerHTML = `

    <div style="
      background:rgba(255,255,255,0.96);
padding:10px;
border-radius:12px;
border:1px solid #d1d5db;
box-shadow:0 2px 10px rgba(0,0,0,0.12);
display:flex;
gap:8px;
align-items:center;
    ">

      <input
        id="mapAddressSearch"
        type="text"
        placeholder="Search address..."
        style="
          border:1px solid #d1d5db;
border-radius:8px;
outline:none;
padding:8px 10px;
width:220px;
background:white;
color:#111827;
font-size:14px;
        "
      >

      <button
        onclick="searchAddress()"
        style="
          padding:8px 12px;
cursor:pointer;
border:none;
border-radius:8px;
background:#2563eb;
color:white;
font-weight:600;
        "
      >
        🔍
      </button>

    </div>

  `;

  // prevent map dragging while typing
  L.DomEvent.disableClickPropagation(div);

  return div;

};

searchControl.addTo(window.map);

 // ================= LAYER SWITCHER =================

 L.control.layers({
  "Street Map": osm,
  "Light Canvas": lightMap,
  "Dark Mode": darkMap
}).addTo(window.map);

  // ================= FORCE RESIZE =================

  setTimeout(() => {

    window.map.invalidateSize();

  }, 500);

});

function refreshActivityFeed() {

  const feed =
    document.getElementById(
      "activityFeed"
    );

  if (!feed) return;

  const filteredLogs =
    activityFilter === "all"
      ? activityLogs
      : activityLogs.filter(
          log => log.type === activityFilter
        );

  feed.innerHTML = filteredLogs
    .slice(0, 25)
    .map(log => {

      const time = log.timestamp
        ? new Date(
            log.timestamp.seconds * 1000
          ).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
          })
        : "";

      return `

  <div class="activity-item activity-${log.type}">

    <small>${time}</small>

    <br>

    <strong>
      ${log.type.charAt(0).toUpperCase() + log.type.slice(1)}
    </strong>

    <br>

    ${log.message}

  </div>

`;

    })
    .join("");
}

// ================= LOAD =================
onSnapshot(collection(db, "employees"), snap => {
  employees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  refresh();
  updateDailySummary();
});

onSnapshot(collection(db, "sites"), snap => {
  sites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  refresh();
  updateDailySummary();
});

onSnapshot(collection(db, "assignments"), snap => {
  assignments = snap.docs
  .map(d => ({
    id: d.id,
    ...d.data()
  }))
  .filter(a => !a.archived);
  refresh();
  updateDailySummary();
});

onSnapshot(collection(db, "assets"), snap => {
  assets = snap.docs.map(d => ({
    docId: d.id,
    ...d.data()
  }));
  console.log("Assets Loaded:", assets);
  refresh();
  updateDailySummary();
});

onSnapshot(collection(db, "vehicles"), snap => {
  vehicles = snap.docs.map(d => ({
    docId: d.id,
    ...d.data()
  }));
  refresh();
  updateDailySummary();
});

onSnapshot(

  collection(db, "activityLogs"),

  snap => {

    activityLogs = snap.docs
      .map(doc => doc.data())
      .sort((a, b) => {

        const aTime =
          a.timestamp?.seconds || 0;

        const bTime =
          b.timestamp?.seconds || 0;

        return bTime - aTime;

      });

    refreshActivityFeed();
    updateDailySummary();

  }

);

onSnapshot(
  collection(db, "siteNotes"),
  snap => {

    siteNotes = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    updateMap();

  }
);

let incidents = [];

onSnapshot(
  collection(db, "incidents"),
  snap => {

    console.log(
      "Incidents updated:",
      snap.size
    );

    incidents = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(
  "Snapshot incidents:",
  incidents.length
);

    refresh();

  }
);

onSnapshot(
  collection(db, "shifts"),
  snap => {

    shifts =
      snap.docs.map(
        d => ({
          id: d.id,
          ...d.data()
        })
      );

    renderSchedules();

  }
);

onSnapshot(
  collection(db, "shifts"),
  snap => {

    shifts =
      snap.docs.map(
        d => ({
          id: d.id,
          ...d.data()
        })
      );

    renderSchedules();

  }
);

onSnapshot(
  collection(db, "timeEntries"),
  snapshot => {

    timeEntries =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()          
        })        
      );
      renderActiveTimeEntries();

  }
);
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

  const geofenceRadius =
  Number(
    document.getElementById(
      "siteGeofenceRadius"
    ).value
  ) || 150;

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
console.log(
  `${address}, ${city}, ${state} ${zip}, USA`
);

let response = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${fullQuery}&format=json&limit=1`
);

coords = await response.json();
console.log("Geocode Results:", coords);

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

  const position =
    await new Promise(
      (resolve, reject) => {

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000
          }
        );

      }
    );

  coords = [{
    lat: position.coords.latitude,
    lon: position.coords.longitude
  }];

  alert(
    "Address not found. Using current GPS location."
  );

}

await addDoc(collection(db, "sites"), {

  name,
  address,
  city,
  state,
  zip,

  siteCategory: siteCategory.value,
  siteSubtype: siteSubtype.value,

  status: "Active",

  geofenceRadius,

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

  document.getElementById(
  "siteGeofenceRadius"
).value = 150;

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
  alert(
  `Employee: ${
    assignEmployee.options[
      assignEmployee.selectedIndex
    ]?.text
  }\nSite: ${
    assignSite.options[
      assignSite.selectedIndex
    ]?.text
  }`
);
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
  const employeeId = assignEmployee.value;
const siteId = assignSite.value;

const employee =
  employees.find(
    e => e.id === employeeId
  );

const site =
  sites.find(
    s => s.id === siteId
  );

  console.log("employeeId:", employeeId);
console.log("employee:", employee);
console.log("site:", site);

await addDoc(collection(db, "assignments"), {
  employeeId,
  siteId,
  assetId: assignAsset.value || null,
  vehicleId: assignVehicle.value || null,
  startTime: new Date().toISOString(),
  endTime: null
});

await logActivity(
  siteId,
  "assignment",
  `${employee?.name || "Employee"} assigned to ${site?.name || "site"}`,
  "Dispatcher"
);   
}

async function logActivity(
  siteId,
  type,
  message,
  user = "System"
) {

  try {

    await addDoc(
      collection(db, "activityLogs"),
      {
        siteId,
        type,
        message,
        user,
        timestamp: serverTimestamp()
      }
    );

  } catch (err) {

    console.error(
      "Activity log error:",
      err
    );

  }

}
window.logActivity = logActivity;

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

  const employee =
    employees.find(
      e => e.id === assignment.employeeId
    );

  const site =
    sites.find(
      s => s.id === assignment.siteId
    );

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

  await logActivity(
    assignment.siteId,
    "unassignment",
    `${employee?.name || "Employee"} removed from ${site?.name || "site"} during End Business Day`,
    "System"
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

  const employee =
    employees.find(
      e => e.id === a.employeeId
    );

  const site =
    sites.find(
      s => s.id === a.siteId
    );  

  await updateDoc(
    doc(db, "assignments", a.id),
    {
      endTime: new Date().toISOString()
    }
  );

  await logActivity(
    a.siteId,
    "unassignment",
    `${employee?.name || "Employee"} manually unassigned from ${site?.name || "site"}`,
    "Dispatcher"
  );
  alert(
  `${employee?.name || "Employee"} unassigned successfully`
);

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

  const status =
  s.status || "Active";

  let statusBadge = "🟢 Active";

if (status === "Inactive") {
  statusBadge = "🟡 Inactive";
}

if (status === "Closed") {
  statusBadge = "🔴 Closed";
}

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

      <td>${statusBadge}</td>
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
      <th>Status</th>
      <th>Crew</th>
      <th>Action</th>

    </tr>

    ${rows}

  `;
}

// ================= RENDER =================
function render() {
  const rows = [...assignments]

  .sort((a, b) =>
    new Date(b.startTime || 0) -
    new Date(a.startTime || 0)
  )

  .map(a => {
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
  <thead>
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
  </thead>

  <tbody>
    ${rows}
  </tbody>
`;
  renderEmployees();
}

function updateDailySummary() {

  const summary =
    document.getElementById(
      "dailySummary"
    );

  if (!summary) return;

  const today =
    new Date().toDateString();

  const assignmentsToday =
    assignments.filter(a =>
      new Date(
        a.startTime
      ).toDateString() === today
    ).length;

  const completedToday =
    assignments.filter(a =>
      a.endTime &&
      new Date(
        a.endTime
      ).toDateString() === today
    ).length;

 const staffedSites =
[
  ...new Set(
    assignments
      .filter(
        a => !a.endTime
      )
      .map(
        a => a.siteId
      )
  )
].length;

const activeEmployees =
  assignments.filter(
    a => !a.endTime
  ).length;

const availableEmployees =
  employees.length -
  activeEmployees;

  summary.innerHTML = `

    <div>
      Assignments Today:
      <strong>${assignmentsToday}</strong>
    </div>

    <div>
      Completed:
      <strong>${completedToday}</strong>
    </div>

   <div>
  Sites Staffed:
  <strong>${staffedSites}</strong>
</div>

    <div>
      Available:
      <strong>${availableEmployees}</strong>
    </div>

  `;
}

// ================= UPDATE MAP =================

function updateMap() {
  console.log(
  "updateMap:",
  incidents.length
);

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
    const siteStatus =
  site.status || "Active";

   let label = "SITE";
let color = "#6b7280";
let symbol = "📍";

if (siteStatus === "Inactive") {
  color = "#f59e0b";
}

if (siteStatus === "Closed") {
  color = "#6b7280";
}

// ACTIVE STATUS
if (
  siteStatus === "Active" &&
  active.length > 0
) {
  color = "#16a34a";
}

// MAINTENANCE
if (site.maintenance) {
  color = "#eab308";
}
console.log(
  "SITE:",
  site.name,
  site.id
);

console.log(
  "INCIDENTS:",
  incidents.map(i => ({
    siteName: i.siteName,
    siteId: i.siteId,
    severity: i.severity,
    status: i.status
  }))
);

// CRITICAL INCIDENT
const hasCriticalIncident =
  incidents.some(i =>
    i.siteId === site.id &&
    i.severity === "Critical" &&
    i.status !== "Resolved"
  );

if (hasCriticalIncident) {

  color = "#dc2626";

  highlightIncidentSite(
    site.id
  );

} else {

  clearIncidentHighlight(
    site.id
  );

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
    draggable: markerEditMode
  }
).addTo(window.map);

markers[site.id].siteType =
  site.siteCategory === "school"
    ? `school-${site.siteSubtype}`
    : site.siteCategory;

    markers[site.id].siteId = site.id;

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

  markers[site.id].setIcon(icon);

  markers[site.id].setLatLng([
    site.lat,
    site.lng
  ]);

}
// ================= GEOFENCE =================

const radius =
  site.geofenceRadius ?? 150;

// Remove old circle
if (geofenceCircles[site.id]) {

  window.map.removeLayer(
    geofenceCircles[site.id]
  );

}

let circleColor = "#38bdf8";

if (site.status === "Inactive") {
  circleColor = "#9ca3af";
}

if (site.status === "Closed") {
  circleColor = "#dc2626";
}

geofenceCircles[site.id] =
  L.circle(
    [site.lat, site.lng],
    {
      radius:
        radius * 0.3048,

      color:
        circleColor,

      weight: 2,

      fillOpacity: 0.08
    }
  ).addTo(window.map);

// APPLY TO ALL MARKERS
applyMarkerVisibility(
  markers[site.id]
);

    const marker = markers[site.id];
    const latestNote =
  siteNotes
  
    .filter(n =>
      n.siteId === site.id
    )
    .sort((a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
    )[0];

    const activeCriticalIncident =
  incidents
    .filter(i =>
      i.siteId === site.id &&
      i.severity === "Critical" &&
      i.status !== "Resolved"
    )
    .sort((a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
    )[0];

    let popup = "";

if (activeCriticalIncident) {

  popup = `
    <div
      style="
        border-left:4px solid #dc2626;
        padding-left:10px;
      "
    >

      <h3 style="
        color:#dc2626;
        margin:0 0 8px 0;
      ">
        🚨 ACTIVE CRITICAL INCIDENT
      </h3>

      <b>Site:</b>
      ${site.name}<br><br>

      <b>Severity:</b>
      ${activeCriticalIncident.severity}
      <br><br>

      <b>Description:</b><br>
      ${activeCriticalIncident.description}
      <br><br>

      <b>Status:</b>
      OPEN

    </div>

    <hr>
  `;

} else {

  popup =
    `<b>${site.name}</b><br>` +
    `${site.city}, ${site.state}<br><br>`;

}

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
    if (latestNote) {

  popup += `
    <hr>

    <b>Latest Note</b><br>

    ${latestNote.note}<br><br>

    <small>
      Updated:
      ${new Date(
        latestNote.createdAt
      ).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
      })}
    </small>
  `;

}

    marker.bindPopup(popup);

  });

}

function createAlertIcon() {

  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width:22px;
          height:22px;
          border-radius:50%;
          background:#dc2626;
          border:3px solid white;
          box-shadow:
            0 0 12px #dc2626;
        ">
      </div>
    `,
    iconSize: [22, 22]
  });

}

function highlightIncidentSite(siteId) {

  const marker =
    markers[siteId];

  const circle =
    geofenceCircles[siteId];

  if (!marker) return;

  if (
    activeIncidentMarkers[siteId]
  ) {
    return;
  }

  const originalIcon =
    marker.options.icon;

  const alertIcon =
    createAlertIcon();

  let flash = false;

  const interval =
    setInterval(() => {

      flash = !flash;

      marker.setIcon(
        flash
          ? alertIcon
          : originalIcon
      );

      if (circle) {

        circle.setStyle({

          color:
            flash
              ? "#dc2626"
              : "#38bdf8",

          fillColor:
            flash
              ? "#dc2626"
              : "#38bdf8"

        });

      }

    }, 700);

  activeIncidentMarkers[
    siteId
  ] = {
    interval,
    originalIcon
  };

}

function clearIncidentHighlight(
  siteId
) {

  const marker =
    markers[siteId];

  const circle =
    geofenceCircles[siteId];

  const active =
    activeIncidentMarkers[
      siteId
    ];

  if (!active) return;

  clearInterval(
    active.interval
  );

  if (marker) {

    marker.setIcon(
      active.originalIcon
    );

  }

  if (circle) {

    const site =
      sites.find(
        s => s.id === siteId
      );

    let color = "#38bdf8";

    if (
      site?.status ===
      "Inactive"
    ) {
      color = "#9ca3af";
    }

    if (
      site?.status ===
      "Closed"
    ) {
      color = "#dc2626";
    }

    circle.setStyle({
      color,
      fillColor: color
    });

  }

  delete activeIncidentMarkers[
    siteId
  ];

}

window.highlightIncidentSite = highlightIncidentSite;
window.clearIncidentHighlight = clearIncidentHighlight;

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

function toggleMarkerEditing() {

  markerEditMode =
    !markerEditMode;

  Object.values(markers).forEach(marker => {

    if (markerEditMode) {

      marker.dragging.enable();

    } else {

      marker.dragging.disable();

    }

  });

  alert(
    markerEditMode
      ? "Marker editing ENABLED"
      : "Marker editing DISABLED"
  );

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
 // only employees without active assignments
const availableEmployees =
  employees.filter(e =>

    !assignments.find(a =>

      a.employeeId === e.id &&
      !a.endTime

    )

  );

assignEmployee.innerHTML =
  availableEmployees.map(e => `
    <option value="${e.id}">
      ${e.name}
    </option>
  `).join("");

  // ================= SITE DROPDOWN =================
  assignSite.innerHTML =
  sites
    .filter(s =>
      (s.status || "Active") === "Active"
    )
    .map(s => `
      <option value="${s.id}">
        ${s.name}
      </option>
    `)
    .join("");

    // ================= INCIDENT SITE DROPDOWN =================
const incidentSite =
  document.getElementById(
    "incidentSite"
  );

if (incidentSite) {

  incidentSite.innerHTML =
    sites.map(s => `
      <option value="${s.id}">
        ${s.name}
      </option>
    `).join("");

}

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

 const incidentCountEl =
  document.getElementById(
    "incidentCount"
  );

if (incidentCountEl) {
  incidentCountEl.textContent =
    incidents.filter(i =>
      i.status !== "Resolved"
    ).length;
}

  renderIncidents();

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

function openSiteNoteModal() {

  const select =
    document.getElementById(
      "noteSite"
    );

  select.innerHTML = "";

  sites
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    .forEach(site => {

      const option =
        document.createElement("option");

      option.value = site.id;
      option.textContent = site.name;

      select.appendChild(option);
    });        

  document.getElementById(
    "siteNote"
  ).value = "";

  document.getElementById(
    "siteNoteModal"
  ).style.display = "flex";
}

function closeSiteNoteModal() {

  document.getElementById(
    "siteNoteModal"
  ).style.display = "none";
}    

async function saveSiteNote() {

  const siteId =
    document.getElementById(
      "noteSite"
    ).value;

  const note =
    document.getElementById(
      "siteNote"
    ).value.trim();

  if (!note) {

    alert(
      "Please enter a note."
    );

    return;
  }  

  const site =
    sites.find(
      s => s.id === siteId
    );

  await addDoc(
    collection(db, "siteNotes"),
    {
      siteId,
      siteName: site.name,
      note,
      createdBy:
        auth.currentUser?.email ||
        "Unknown",

      createdAt:
        new Date().toISOString()
    }    
  );  

 await logActivity(
  siteId,
  "note",
  `Site note added for ${site.name}`,
  auth.currentUser?.email || "Unknown"
);

  closeSiteNoteModal();

  alert(
    "Site note saved."
  );
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

  const query = document
    .getElementById("siteSearch")
    .value
    .trim()
    .toLowerCase();

  if (!query) return;
  if (query.length < 3) return;

  const matches = sites.filter(s =>

    s.name &&
    s.name.toLowerCase().includes(query)

  );

  if (matches.length === 1) {

    const match = matches[0];

   window.map.flyTo(
  [match.lat, match.lng],
  16
);

window.map.once("moveend", () => {
  document.getElementById(
    "siteSearch"
  ).value = "";
});

    const marker = markers[match.id];

   if (marker) {
  marker.openPopup();
}

document.getElementById(
  "siteSearch"
).value = "";

  } else if (matches.length > 1) {

    } else if (matches.length > 1) {

  return;

  } else {

    alert("No matching site found.");

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

async function searchAddress() {

  const query =
    document.getElementById(
      "mapAddressSearch"
    ).value.trim();

  if (!query) return;

  try {

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${
        encodeURIComponent(query)
      }&format=json&limit=1`
    );

    const results =
      await response.json();

    if (!results.length) {

      alert("Address not found");

      return;

    }

    const lat =
      +results[0].lat;

    const lng =
      +results[0].lon;

    window.map.flyTo(
      [lat, lng],
      16
    );

    // optional temporary marker
   // remove old search marker
if (searchMarker) {

  window.map.removeLayer(
    searchMarker
  );

}

// create new temporary marker
searchMarker = L.marker(
  [lat, lng]
)
.addTo(window.map)
.bindPopup(query)
.openPopup();
      document.getElementById(
  "mapAddressSearch"
).value = "";

  } catch (err) {

    console.error(err);

    alert(
      "Address search failed"
    );

  }

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
  "editSiteRadius"
).value =
  site.geofenceRadius ?? 150;
  document.getElementById(
  "editSiteCategory"
).value =
  site.siteCategory || "school";

document.getElementById(
  "editSiteSubtype"
).value =
  site.siteSubtype || "elementary";

  document.getElementById(
  "editSiteStatus"
).value =
  site.status || "Active";

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

   const geofenceRadius =
  Number(
    document.getElementById(
      "editSiteRadius"
    ).value
  ) || 150;

    const siteCategory =
  document.getElementById(
    "editSiteCategory"
  ).value;

  const status =
  document.getElementById(
    "editSiteStatus"
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

  const existingSite =
    sites.find(
      s => s.id === editingSiteId
    );

  if (!existingSite) {

    alert(
      "Address not found and existing site could not be loaded."
    );

    return;

  }

  coords = [{
    lat: existingSite.lat,
    lon: existingSite.lng
  }];

  alert(
    "Address not found. Existing coordinates will be retained."
  );

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
    status,

    geofenceRadius,

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

        const employee =
  employees.find(
    e => e.id === employeeId
  );

const site =
  sites.find(
    s => s.id === siteDoc.id
  );

await logActivity(
  siteDoc.id,
  "assignment",
  `${employee?.name || "Employee"} deployed to ${site?.name || "site"}`,
  "Dispatcher"
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

function setActivityFilter(type) {

  activityFilter = type;

  refreshActivityFeed();

}
window.setActivityFilter =
  setActivityFilter;
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

const employee =
  employees.find(
    e => e.id === d.employeeId
  );

const site =
  sites.find(
    s => s.id === d.siteId
  );

await logActivity(
  d.siteId,
  "assignment",
  `${employee?.name || "Employee"} deployed to ${site?.name || "site"}`,
  "Dispatcher"
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

function filterMapSites(type, button){

  currentMapFilter = type;

  // active button styling
  document.querySelectorAll(".map-filters button")
    .forEach(btn =>
      btn.classList.remove("active-filter")
    );

  if(button){
    button.classList.add("active-filter");
  }

  Object.values(markers).forEach(marker => {

    applyMarkerVisibility(marker);

  });

}

function applyMarkerVisibility(marker){

  const site =
    sites.find(
      s => s.id === marker.siteId
    );

  const status =
    site?.status || "Active";

  // STATUS FILTERS
  if (
    status === "Active" &&
    !showActiveSites
  ) {
    if(window.map.hasLayer(marker)){
      window.map.removeLayer(marker);
    }
    return;
  }

  if (
    status === "Inactive" &&
    !showInactiveSites
  ) {
    if(window.map.hasLayer(marker)){
      window.map.removeLayer(marker);
    }
    return;
  }

  if (
    status === "Closed" &&
    !showClosedSites
  ) {
    if(window.map.hasLayer(marker)){
      window.map.removeLayer(marker);
    }
    return;
  }

  // SHOW ALL
  if(currentMapFilter === "all"){

    if(!window.map.hasLayer(marker)){
      marker.addTo(window.map);
    }

    return;

  }

  // MATCH FILTER
  if(marker.siteType === currentMapFilter){

    if(!window.map.hasLayer(marker)){
      marker.addTo(window.map);
    }

  }

  // HIDE NON-MATCHING
  else {

    if(window.map.hasLayer(marker)){
      window.map.removeLayer(marker);
    }

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

function openViewNotesModal() {

  const select =
    document.getElementById(
      "viewNotesSite"
    );

  select.innerHTML = "";

  sites
    .sort((a,b) =>
      a.name.localeCompare(b.name)
    )
    .forEach(site => {

      const option =
        document.createElement(
          "option"
        );

      option.value = site.id;
      option.textContent =
        site.name;

      select.appendChild(option);

    });

  loadSiteNotes();

  document.getElementById(
    "viewNotesModal"
  ).style.display = "block";

}

function closeViewNotesModal() {

  document.getElementById(
    "viewNotesModal"
  ).style.display = "none";

}

function loadSiteNotes() {

  const siteId =
    document.getElementById(
      "viewNotesSite"
    ).value;
    console.log("Selected Site:", siteId);
console.log("All Notes:", siteNotes);

  const notes =
    siteNotes
      .filter(
        n => n.siteId === siteId
      )
      
      .sort((a,b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
console.log("Matching Notes:", notes);
  const container =
    document.getElementById(
      "siteNotesList"
    );

  if (!notes.length) {

    container.innerHTML =
      "<p>No notes found.</p>";

    return;

  }
console.log("Container:", container);
console.log("First Note:", notes[0]);
  container.innerHTML =
  notes.map(note => `

    <div style="
      background:#ffffff;
      color:#111827;
      border:1px solid #ddd;
      padding:10px;
      margin-bottom:10px;
      border-radius:6px;
    ">

      <small style="color:#6b7280;">
  Entered by: ${note.createdBy}
  <br>
  ${new Date(
    note.createdAt
  ).toLocaleString()}
</small>

<br><br>

${note.note}

    </div>

  `).join("");

}

function outsideViewNotesClick(event) {

  const content =
    document.getElementById(
      "viewNotesContent"
    );

  if (!content.contains(event.target)) {

    closeViewNotesModal();

  }

}

async function saveIncident() {

  const siteId =
    document.getElementById(
      "incidentSite"
    ).value;

  const severity =
    document.getElementById(
      "incidentSeverity"
    ).value;

  const description =
    document.getElementById(
      "incidentDescription"
    ).value.trim();

  if (!description) {

    alert(
      "Description required."
    );

    return;

  }  

  const site =
    sites.find(
      s => s.id === siteId
    );

  await addDoc(
    collection(
      db,
      "incidents"
    ),
    {

      siteId,

      siteName:
        site?.name || "Unknown",

      severity,

      description,

      reportedBy:
        auth.currentUser?.email ||
        "Unknown",

      createdAt:
        new Date().toISOString()

    }
    
  );
  

 await logActivity(
  siteId,
  "incident",
  `🚨 ${severity} Incident - ${site.name}`,
  auth.currentUser?.email ||
  "Unknown"
);

if (
  severity?.toLowerCase() === "critical"
) {

  playCriticalAlert();

  console.log("Site:", site);

  if (
    site &&
    window.map
  ) {

    document
      .getElementById(
        "operationsMapPanel"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    setTimeout(() => {

  window.map.flyTo(
    [site.lat, site.lng],
    16,
    {
      duration: 1.5
    }
  );

}, 500);

setTimeout(() => {

  const marker =
    markers[site.id];

  if (
    marker &&
    marker.openPopup
  ) {

    marker.openPopup();

    window.map.panBy(
      [0, 150]
    );

  }

}, 1800);

  }

}

alert(
  "Incident reported."
);
document.getElementById(
  "incidentDescription"
).value = "";
document.getElementById(
  "incidentSeverity"
).selectedIndex = 0;

}

function renderIncidents() {
  console.log(
  "renderIncidents:",
  incidents.length
);

  const container =
    document.getElementById(
      "incidentList"
    );

  if (!container) return;

  document.getElementById(
  "openIncidentCount"
).textContent =
  incidents.filter(i =>
    i.status !== "Resolved"
  ).length;

  const openIncidents =
  incidents.filter(i =>
    i.status !== "Resolved"
  );

const resolvedIncidents =
  incidents.filter(i =>
    i.status === "Resolved"
  );

container.innerHTML = `  

  ${
    openIncidents.length
      ? openIncidents.map(i => `

        <div class="incident-card">

          <div>

            <strong>
              ${i.severity}
            </strong>

            <br>

            ${i.description}

            <br>

            <small>
              ${i.siteName}
            </small>

          </div>

          <button
            onclick="resolveIncident('${i.id}')"
          >
            Resolve
          </button>

        </div>

      `).join("")
      : "<p>No open incidents.</p>"
  }

 <h3 class="resolved-incidents-title" style="margin-top:20px;">
  ✅ Resolved Incidents
</h3>

<div class="resolved-incidents">

${
  resolvedIncidents.length
    ? resolvedIncidents.map(i => `

        <div class="incident-card resolved-card">

          <div>

            <strong>
              ${i.severity}
            </strong>

            <br>

            ${i.description}

            <br>

            <small>
              ${i.siteName}
            </small>

            <br><br>

            <small>
              Resolved By:
              ${i.resolvedBy || "Unknown"}
            </small>

            <br>

            <small>
              ${
                i.resolvedAt
                  ? new Date(
                      i.resolvedAt
                    ).toLocaleString()
                  : ""
              }
            </small>

            <br>

            <small>
              Resolution:
              ${i.resolution || ""}
            </small>

          </div>

        </div>

      `).join("")
      : "<p>No resolved incidents.</p>"
  }
</div>
`;
}

async function resolveIncident(id) {

  const resolution = prompt(
    "Enter resolution notes:"
  );

  if (!resolution?.trim()) {
    alert("Resolution notes required.");
    return;
  }

  try {

    await updateDoc(
      doc(db, "incidents", id),
      {
        status: "Resolved",
        resolution: resolution.trim(),
        resolvedBy:
          auth.currentUser?.email || "Unknown",
        resolvedAt:
          new Date().toISOString()
      }
    );

    alert(
      "Incident resolved."
    );

  } catch (err) {

    console.error(err);

    alert(
      "Failed to resolve incident."
    );

  }

}

function playCriticalAlert() {

  try {

    criticalAlert.pause();

    criticalAlert.currentTime = 0;

    criticalAlert.play();

  } catch (err) {

    console.error(
      "Critical alert failed:",
      err
    );

  }

}

function showDashboard() {

  document.getElementById(
    "dashboardPage"
  ).style.display = "block";

  document.getElementById(
    "schedulingPage"
  ).style.display = "none";

  refreshSupervisorDashboard();

}

function showSchedulingPage() {

  document.getElementById(
    "dashboardPage"
  ).style.display = "none";

  document.getElementById(
    "schedulingPage"
  ).style.display = "block";

  populateScheduleDropdowns();
  renderWeeklyScheduleBoard(); 

}

function populateScheduleDropdowns() {

  const employeeSelect =
    document.getElementById(
      "scheduleEmployee"
    );

  const siteSelect =
    document.getElementById(
      "scheduleSite"
    );

    const clockSelect =
  document.getElementById(
    "clockEmployee"
  );

 if (!employeeSelect || !siteSelect) {
  return;
}

  employeeSelect.innerHTML =
    '<option value="">Select Officer</option>';

    employeeSelect.innerHTML =
  '<option value="">Select Officer</option>';

  siteSelect.innerHTML =
    '<option value="">Select Site</option>';

employees.forEach(emp => {

  employeeSelect.innerHTML += `
    <option value="${emp.id}">
      ${emp.name}
    </option>
  `;

  if (clockSelect) {

    clockSelect.innerHTML += `
      <option value="${emp.id}">
        ${emp.name}
      </option>
    `;

  }

});

  sites.forEach(site => {

    siteSelect.innerHTML += `
      <option value="${site.id}">
        ${site.name}
      </option>
    `;

  });

}

async function createShift() {

  const employeeId =
    document.getElementById(
      "scheduleEmployee"
    ).value;

  const siteId =
    document.getElementById(
      "scheduleSite"
    ).value;

  const startTime =
    document.getElementById(
      "scheduleStart"
    ).value;

  const endTime =
    document.getElementById(
      "scheduleEnd"
    ).value;

  if (
    !employeeId ||
    !siteId ||
    !startTime ||
    !endTime
  ) {
    alert(
      "Complete all fields."
    );
    return;
  }

  const employee =
    employees.find(
      e => e.id === employeeId
    );

  const site =
    sites.find(
      s => s.id === siteId
    );

    const duplicate =
  shifts.some(
    shift =>

      shift.employeeId === employeeId &&

      shift.siteId === siteId &&

      shift.startTime === startTime &&

      shift.endTime === endTime
  );

if (duplicate) {

  alert(
    "This shift already exists."
  );

  return;

}

const conflict =
  shifts.some(
    shift =>

      shift.employeeId ===
      employeeId &&

      timesOverlap(
        startTime,
        endTime,
        shift.startTime,
        shift.endTime
      )
  );

if (conflict) {

  alert(
    "Officer already scheduled during this time."
  );

  return;

}

  await addDoc(
    collection(db, "shifts"),    
    {
      

      employeeId,

      employeeName:
        employee.name,

      siteId,

      siteName:
  site.name,

siteCategory:
  site.siteCategory || "other",

startTime,

endTime,

      status:
        "Scheduled",

      createdAt:
        new Date().toISOString()

        

    }
    
    
  );

  document.getElementById(
  "scheduleEmployee"
).value = "";

document.getElementById(
  "scheduleSite"
).value = "";

  console.log("Shift saved");
  document.getElementById(
  "scheduleEmployee"
).value = "";

document.getElementById(
  "scheduleSite"
).value = "";

document.getElementById(
  "scheduleStart"
).value = "";

document.getElementById(
  "scheduleEnd"
).value = "";
console.log("Fields cleared");
}

function timesOverlap(
  start1,
  end1,
  start2,
  end2
) {

  return (
    new Date(start1) <
    new Date(end2)
  ) &&
  (
    new Date(end1) >
    new Date(start2)
  );

}


function renderSchedules() {

  const container =
    document.getElementById(
      "scheduleList"
    );

  if (!container) return;

  container.innerHTML = "";

  const sortedShifts =
    [...shifts].sort(
      (a, b) =>
        new Date(b.startTime) -
        new Date(a.startTime)
    );

  sortedShifts.forEach(shift => {

    container.innerHTML += `

      <div class="shift-card">

        <strong>
          ${shift.employeeName}
        </strong>

        <br>

        ${shift.siteName}

        <br>

        ${new Date(
          shift.startTime
        ).toLocaleString()}

        -

        ${new Date(
          shift.endTime
        ).toLocaleString()}

        <br><br>

        <button onclick="editShift('${shift.id}')">
  Edit Shift
</button>

<button onclick="deleteShift('${shift.id}')">
  Delete Shift
</button>

      </div>

    `;

  });
renderWeeklyScheduleBoard();
}

async function deleteShift(id) {

  if (
    !confirm(
      "Delete this shift?"
    )
  ) {
    return;
  }

  await deleteDoc(
    doc(
      db,
      "shifts",
      id
    )
  );

}

function closeEditShiftModal() {

  document
    .getElementById(
      "editShiftModal"
    )
    .classList.add(
      "hidden"
    );

}

window.closeEditShiftModal =
  closeEditShiftModal;
  

function editShift(id) {

  const shift =
    shifts.find(
      s => s.id === id
    );

  if (!shift) return;

  populateEditShiftDropdowns();

  document.getElementById(
    "editShiftId"
  ).value = shift.id;

  document.getElementById(
    "editShiftEmployee"
  ).value = shift.employeeId;

  document.getElementById(
    "editShiftSite"
  ).value = shift.siteId;

  document.getElementById(
    "editShiftStart"
  ).value = shift.startTime;

  document.getElementById(
    "editShiftEnd"
  ).value = shift.endTime;

  document
    .getElementById(
      "editShiftModal"
    )
    .classList.remove(
      "hidden"
    );

}

window.editShift = editShift;

function populateEditShiftDropdowns() {

  const employeeSelect =
    document.getElementById(
      "editShiftEmployee"
    );

  const siteSelect =
    document.getElementById(
      "editShiftSite"
    );

  employeeSelect.innerHTML =
    '<option value="">Select Officer</option>';

  siteSelect.innerHTML =
    '<option value="">Select Site</option>';

  employees.forEach(employee => {

    employeeSelect.innerHTML += `
      <option value="${employee.id}">
        ${employee.name}
      </option>
    `;

  });

  sites.forEach(site => {

    siteSelect.innerHTML += `
      <option value="${site.id}">
        ${site.name}
      </option>
    `;

  });

}

async function saveShiftEdit() {

  const id =
    document.getElementById(
      "editShiftId"
    ).value;

  const employeeId =
    document.getElementById(
      "editShiftEmployee"
    ).value;

  const siteId =
    document.getElementById(
      "editShiftSite"
    ).value;

  const startTime =
    document.getElementById(
      "editShiftStart"
    ).value;

  const endTime =
    document.getElementById(
      "editShiftEnd"
    ).value;

  if (
    !employeeId ||
    !siteId ||
    !startTime ||
    !endTime
  ) {
    alert(
      "Complete all fields."
    );
    return;
  }

  if (
    new Date(endTime) <=
    new Date(startTime)
  ) {
    alert(
      "End time must be after start time."
    );
    return;
  }

  const duplicate =
    shifts.some(
      shift =>

        shift.id !== id &&

        shift.employeeId ===
        employeeId &&

        shift.siteId ===
        siteId &&

        shift.startTime ===
        startTime &&

        shift.endTime ===
        endTime
    );

  if (duplicate) {

    alert(
      "This shift already exists."
    );

    return;

  }

  const conflict =
    shifts.some(
      shift =>

        shift.id !== id &&

        shift.employeeId ===
        employeeId &&

        timesOverlap(
          startTime,
          endTime,
          shift.startTime,
          shift.endTime
        )
    );

  if (conflict) {

    alert(
      "Officer already scheduled during this time."
    );

    return;

  }

  const employee =
    employees.find(
      e => e.id === employeeId
    );

  const site =
    sites.find(
      s => s.id === siteId
    );

  await updateDoc(
    doc(
      db,
      "shifts",
      id
    ),
    {

      employeeId,

      employeeName:
        employee.name,

      siteId,

      siteName:
        site.name,

      startTime,

      endTime

    }
  );

  closeEditShiftModal();

}

function renderWeeklyScheduleBoard(){
const weekEnd = getEndOfWeek(currentWeekStart);

document.getElementById("weekRangeLabel").textContent =
    `${currentWeekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
  const board =
    document.getElementById(
      "weeklyScheduleBoard"
    );

  if(!board) return;

const weekShifts = shifts.filter(shift => {

  const shiftDate =
    new Date(shift.startTime);

  return (
    shiftDate >= currentWeekStart &&
    shiftDate <= weekEnd
  );

});

  const dayNames = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];

  let html = `
    <div class="weekly-board">
      <div class="weekly-grid">

        <div class="weekly-header">Officer</div>
        <div class="weekly-header">Mon</div>
        <div class="weekly-header">Tue</div>
        <div class="weekly-header">Wed</div>
        <div class="weekly-header">Thu</div>
        <div class="weekly-header">Fri</div>
        <div class="weekly-header">Sat</div>
        <div class="weekly-header">Sun</div>
  `;

  employees.forEach(employee => {

    html += `
      <div class="weekly-cell officer-name">
        ${employee.name}
      </div>
    `;

    for(let day = 1; day <= 7; day++){

      const actualDay =
        day === 7 ? 0 : day;

      const dayShifts =
  weekShifts.filter(shift => {

          return (
            shift.employeeId === employee.id &&
            new Date(
              shift.startTime
            ).getDay() === actualDay
          );

        });

      html += `
        <div class="weekly-cell">
      `;

     dayShifts.forEach(shift => {

      const categoryColors = {
  school: "#2196F3",
  government: "#4CAF50",
  construction: "#FF9800",
  warehouse: "#9C27B0"
};

const blockColor =
  categoryColors[
    (shift.siteCategory || "other")
      .toLowerCase()
  ] || "#607D8B";

  const startTime =
    new Date(shift.startTime)
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

  const endTime =
    new Date(shift.endTime)
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

  html += `
    <div
      class="schedule-block"
      style="background:${blockColor}"
      onclick="editShift('${shift.id}')"
    >
      ${shift.siteName}
      <br>
      <small>
        ${startTime}-${endTime}
      </small>
    </div>
  `;

});
html += `
        </div>
      `;

    }

  });

  html += `
      </div>
    </div>
  `;

  board.innerHTML = html;

}

let currentWeekStart = getStartOfWeek(new Date());

function getStartOfWeek(date) {
    const d = new Date(date);

    const day = d.getDay();

    const diff = day === 0
        ? -6
        : 1 - day;

    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);

    return d;
}

function getEndOfWeek(startDate) {
    const end = new Date(startDate);

    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return end;
}

function previousWeek() {

    currentWeekStart.setDate(
        currentWeekStart.getDate() - 7
    );

    renderWeeklyScheduleBoard();
}

function nextWeek() {

    currentWeekStart.setDate(
        currentWeekStart.getDate() + 7
    );

    renderWeeklyScheduleBoard();
}

function calculateDistance(lat1, lon1, lat2, lon2) {

  const R = 6371000; // meters

  const dLat =
    (lat2 - lat1) * Math.PI / 180;

  const dLon =
    (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

async function clockIn() {

  const employeeId =
    document.getElementById(
      "clockEmployee"
    ).value;

  if (!employeeId) {

    alert(
      "Select an officer."
    );

    return;
  }

  const employee =
    employees.find(
      e => e.id === employeeId
    );

    const position = await new Promise((resolve, reject) => {

  if (!navigator.geolocation) {

    reject(
      new Error(
        "Geolocation not supported"
      )
    );

    return;
  }

  navigator.geolocation.getCurrentPosition(
    resolve,
    reject,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );

});

const officerLat =
  position.coords.latitude;

const officerLng =
  position.coords.longitude;

alert(
  `GPS Acquired\n\nLat: ${officerLat}\nLng: ${officerLng}`
);

const now = new Date();

const activeShift =
  shifts.find(shift => {

    if (
      shift.employeeId !== employeeId
    ) {
      return false;
    }

    const start =
      new Date(shift.startTime);

    const end =
      new Date(shift.endTime);

    return (
      now >= start &&
      now <= end
    );

  });

if (!activeShift) {

  alert(
    "No active shift available for clock-in."
  );

  return;
}

  const site =
  sites.find(
    s => s.id === activeShift.siteId
  );

if (!site) {

  alert(
    "Assigned site not found."
  );

  return;
}

const distance =
  calculateDistance(
    officerLat,
    officerLng,
    Number(site.lat),
    Number(site.lng)
  );

const allowedRadiusFeet =
  Number(site.geofenceRadius) || 150;

const allowedRadius =
  allowedRadiusFeet * 0.3048;
console.log(
  "Distance:",
  distance,
  "Allowed Feet:",
  allowedRadiusFeet,
  "Allowed Meters:",
  allowedRadius,
  "Site:",
  site.siteName,
  "Lat:",
  site.lat,
  "Lng:",
  site.lng
);
if (distance > allowedRadius) {

  alert(
    `Clock In Denied

Assigned Site:
${site.siteName || activeShift.siteName}

Distance:
${Math.round(distance)} meters
Allowed Radius:
${allowedRadiusFeet} feet
Allowed Radius:
${Math.round(allowedRadius)} meters`
  );

  return;
}

  const existingEntry =
    timeEntries.find(
      entry =>
        entry.employeeId === employeeId &&
        entry.status === "Clocked In"
        
    );    

  if (existingEntry) {

    alert(
      "Officer already clocked in."
    );

    return;
  }

  const employeeName =
  employee.name;

const siteId =
  activeShift.siteId;

const siteName =
  activeShift.siteName;

const shiftId =
  activeShift.id;

  await addDoc(
  collection(db, "timeEntries"),
  {
    employeeId,
    employeeName,
    siteId,
    siteName,
    shiftId,

    clockIn: serverTimestamp(),
    status: "Clocked In",

    monitoringActive: true,
    lastGpsCheck: null,
    gpsViolationCount: 0,
    currentlyInsideGeofence: true
  }
);
startPostMonitoring();
  alert(
    "Clock In Successful"
  );

  document.getElementById(
  "clockEmployee"
).value = "";

}

function renderActiveTimeEntries() {

  const container =
    document.getElementById(
      "activeTimeEntries"
    );

  if (!container) return;

  const activeEntries =
    timeEntries.filter(
      entry =>
        entry.status === "Clocked In"
    );

  if (activeEntries.length === 0) {

    container.innerHTML =
      "No officers clocked in.";

    return;
  }

  container.innerHTML =
    activeEntries.map(entry => `

      <div class="activity-item">

        <strong>
          ${entry.employeeName}
        </strong>

        <br>

        ${entry.siteName}

        <br>

        ${
  entry.clockIn
    ? entry.clockIn
        .toDate()
        .toLocaleTimeString()
    : "Unknown"
}

      </div>

    `).join("");

}

async function clockOut() {

const employeeId =
document.getElementById(
"clockEmployee"
).value;

if (!employeeId) {

alert(
  "Select an officer."
);

return;

}

const position =
await new Promise(
(resolve, reject) => {

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );

  }
);

const latitude =
position.coords.latitude;

const longitude =
position.coords.longitude;

const activeEntry =
timeEntries.find(
entry =>
entry.employeeId === employeeId &&
entry.status === "Clocked In"
);

if (!activeEntry) {

alert(
  "No active clock-in found."
);

return;

}

const site =
sites.find(
s =>
s.id ===
activeEntry.siteId
);

if (!site) {

alert(
  "Assigned site not found."
);

return;

}

const distance =
calculateDistance(
latitude,
longitude,
site.lat,
site.lng
);

const allowedRadiusFeet =
Number(
site.geofenceRadius
) || 150;

const allowedRadius =
allowedRadiusFeet * 0.3048;

const outsideGeofence =
distance > allowedRadius;

if (outsideGeofence) {

await addDoc(
  collection(
    db,
    "activityLogs"
  ),
  {
    type:
      "gpsViolation",

    message:
      `${activeEntry.employeeName} clocked out outside assigned geofence.`,

    employeeId:
      activeEntry.employeeId,

    employeeName:
      activeEntry.employeeName,

    siteId:
      activeEntry.siteId,

    siteName:
      activeEntry.siteName,

    distanceMeters:
      Math.round(distance),

    distanceFeet:
      Math.round(
        distance * 3.28084
      ),

    timestamp:
      serverTimestamp()
  }
);

}

const clockOutTime =
new Date();

const clockInTime =
new Date(
activeEntry.clockIn
);

const hoursWorked =
(
(clockOutTime - clockInTime)
/ 1000
/ 60
/ 60
).toFixed(2);

await updateDoc(

doc(
  db,
  "timeEntries",
  activeEntry.id
),

{
  clockOut:
    clockOutTime.toISOString(),

  hoursWorked:
    Number(hoursWorked),

  status:
    "Clocked Out"
}

);

const remainingActiveEntries =
  timeEntries.filter(
    entry =>
      entry.status ===
      "Clocked In" &&
      entry.employeeId !==
      employeeId
  );

if (
  remainingActiveEntries.length === 0
) {

  stopPostMonitoring();

}

if (outsideGeofence) {

alert(
  `Clock Out Completed

WARNING:
You were outside the assigned geofence.

Distance:
${Math.round(distance * 3.28084)} feet

This event has been logged.`
);

}
else {

alert(
  "Clock Out Successful"
);

}

document.getElementById(
  "clockEmployee"
).value = "";

loadTimeEntries();

refreshSupervisorDashboard();

}


async function refreshSupervisorDashboard() {
  console.log("Supervisor dashboard running");

  const today = new Date();
  today.setHours(0,0,0,0);

  const attendanceSnapshot =
  await getDocs(
    collection(db, "timeEntries")
  );

const scheduleSnapshot =
  await getDocs(
    collection(db, "shifts")
  );

  const attendance = attendanceSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const schedules = scheduleSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log("Attendance Records:", attendance.length);
console.log("Shift Records:", schedules.length);

let onDuty = 0;
let clockedOut = 0;
let activeViolations = 0;

console.log(
  "Roster Attendance Records:",
  attendance.length
);

attendance.forEach(entry => {

  if (entry.status === "Clocked In") {
    onDuty++;
  }

  if (entry.status === "Clocked Out") {
    clockedOut++;
  }

  if (
    entry.status === "Clocked In" &&
    entry.currentlyInsideGeofence === false
  ) {
    activeViolations++;
  }

});

  document.getElementById("onDutyCount").textContent = onDuty;
  document.getElementById("clockedOutCount").textContent = clockedOut;

  document.getElementById(
  "activeViolationsCount"
).textContent = activeViolations;

const scheduledToday = schedules.filter(shift => {

  if (!shift.startTime) return false;

  const start = new Date(shift.startTime);

  return (
    start.getFullYear() === today.getFullYear() &&
    start.getMonth() === today.getMonth() &&
    start.getDate() === today.getDate()
  );

});

document.getElementById("scheduledTodayCount").textContent =
  scheduledToday.length;

  let missingClockIns = 0;
  missingClockInList = [];

scheduledToday.forEach(shift => {

  const hasTimeEntry = attendance.some(entry =>
    entry.shiftId === shift.id
  );

  const shiftStart = new Date(shift.startTime);

 if (
  shiftStart < new Date() &&
  !hasTimeEntry
) {

  missingClockIns++;

  missingClockInList.push({

    officerName:
      shift.employeeName || "Unknown",

    siteName:
      shift.siteName || "Unknown",

    startTime:
      shift.startTime

  });

}

});

document.getElementById("missingClockInCount").textContent =
  missingClockIns;

let html = `
<div class="report-wrapper">
  <div class="table-wrapper">
    <table class="report-table">
  <thead>
    <tr>
      <th>Officer</th>
      <th>Site</th>
      <th>Status</th>
      <th>Clock In</th>
      <th>Clock Out</th>
      <th>Hours</th>
    </tr>
  </thead>
  <tbody>
`;

attendance.forEach(entry => {

 const clockInTime = entry.clockIn
  ? entry.clockIn.toDate
    ? entry.clockIn.toDate().toLocaleTimeString()
    : new Date(entry.clockIn).toLocaleTimeString()
  : "-";

const clockOutTime = entry.clockOut
  ? entry.clockOut.toDate
    ? entry.clockOut.toDate().toLocaleTimeString()
    : new Date(entry.clockOut).toLocaleTimeString()
  : "-";

  html += `
    <tr>
      <td>${entry.employeeName || "-"}</td>
      <td>${entry.siteName || "-"}</td>
      <td>${entry.status || "-"}</td>
      <td>${clockInTime}</td>
      <td>${clockOutTime}</td>
      <td>${entry.hoursWorked || "-"}</td>
    </tr>
  `;
});

html += `
  </tbody>
</table>
  </div>
</div>
`;
console.log(html);
document.getElementById("attendanceRoster").innerHTML = html;
}

function showMissingClockIns() {

  let html = "";

  if (missingClockInList.length === 0) {

    html =
      "<p>No missing clock-ins.</p>";

  } else {

    missingClockInList.forEach(item => {

      html += `
        <div class="shift-card">

          <strong>
            ${item.officerName}
          </strong>

          <br>

          Site:
          ${item.siteName}

          <br>

          Shift Start:
          ${new Date(
            item.startTime
          ).toLocaleString()}

        </div>
      `;

    });

  }

  document.getElementById(
    "missingClockInList"
  ).innerHTML = html;

  document.getElementById(
    "missingClockInModal"
  ).classList.remove("hidden");

}

async function checkPostAbandonment() {
  console.log(
  "Monitoring Tick",
  new Date().toLocaleTimeString()
);

  const activeEntries =
    timeEntries.filter(
      entry =>
        entry.status === "Clocked In"
    );

  if (!activeEntries.length) {

    alert(
      "No officers currently clocked in."
    );

    return;
  }

  const position =
    await new Promise(
      (resolve, reject) => {

        navigator.geolocation
          .getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true
            }
          );

      }
    );

  const officerLat =
    position.coords.latitude;

  const officerLng =
    position.coords.longitude;

  for (const entry of activeEntries) {

    const site =
      sites.find(
        s => s.id === entry.siteId
      );

    if (!site) continue;

    const distance =
      calculateDistance(
        officerLat,
        officerLng,
        Number(site.lat),
        Number(site.lng)
      );

    const radiusFeet =
      Number(site.geofenceRadius) || 150;

    const radiusMeters =
      radiusFeet * 0.3048;

    alert(
      `${entry.employeeName}

Distance:
${Math.round(distance)} meters

Allowed:
${Math.round(radiusMeters)} meters`
    );

    const isInsideGeofence =
      distance <= radiusMeters;

    const entryRef =
      doc(
        db,
        "timeEntries",
        entry.id
      );

    // OFFICER LEFT POST

if (
  !isInsideGeofence &&
  entry.currentlyInsideGeofence === true
) {

  await addDoc(
    collection(
      db,
      "activityLogs"
    ),
    {
      type: "Post Abandonment",
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      siteId: entry.siteId,
      siteName: entry.siteName,
      timestamp: serverTimestamp()
    }
  );

  await updateDoc(
    entryRef,
    {
      currentlyInsideGeofence: false,
      gpsViolationCount: increment(1),
      lastGpsCheck: serverTimestamp()
    }
  );

  if (
    typeof refreshSupervisorDashboard ===
    "function"
  ) {
    refreshSupervisorDashboard();
  }

  alert(
    `${entry.employeeName} is outside geofence`
  );

}

// RETURNED TO POST

else if (
  isInsideGeofence &&
  entry.currentlyInsideGeofence === false
) {

  await addDoc(
    collection(
      db,
      "activityLogs"
    ),
    {
      type: "Returned To Post",
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      siteId: entry.siteId,
      siteName: entry.siteName,
      timestamp: serverTimestamp()
    }
  );

  await updateDoc(
    entryRef,
    {
      currentlyInsideGeofence: true,
      lastGpsCheck: serverTimestamp()
    }
  );

  if (
    typeof refreshSupervisorDashboard ===
    "function"
  ) {
    refreshSupervisorDashboard();
  }

  alert(
    `${entry.employeeName} has returned to post`
  );

}

// NO STATE CHANGE

else {

  await updateDoc(
    entryRef,
    {
      lastGpsCheck:
        serverTimestamp()
    }
  );

  if (
    isInsideGeofence
  ) {

    alert(
      `${entry.employeeName} is currently on post`
    );

  }
  else {

    alert(
      `${entry.employeeName} remains outside geofence`
    );

  }

}

} // end for loop

} // end checkPostAbandonment

function closeMissingClockInModal() {

  document
    .getElementById(
      "missingClockInModal"
    )
    ?.classList.add(
      "hidden"
    );

}

function startPostMonitoring() {

  if (postMonitoringTimer) {

    clearInterval(
      postMonitoringTimer
    );

  }

  postMonitoringTimer =
    setInterval(
      async () => { 

        try {

          await checkPostAbandonment();

        }
        catch (error) {

          console.error(
            "Post monitoring error:",
            error
          );

        }

      },
      30000
    ); 

}

function stopPostMonitoring() {

  if (
    !postMonitoringTimer
  ) return;

  clearInterval(
    postMonitoringTimer
  );

  postMonitoringTimer =
    null; 

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
window.toggleMarkerEditing = toggleMarkerEditing;
window.searchAddress = searchAddress;
window.filterMapSites = filterMapSites;
window.openSiteNoteModal = openSiteNoteModal;
window.closeSiteNoteModal = closeSiteNoteModal;
window.saveSiteNote = saveSiteNote;
window.openViewNotesModal = openViewNotesModal;
window.closeViewNotesModal = closeViewNotesModal;
window.loadSiteNotes = loadSiteNotes;
window.outsideViewNotesClick = outsideViewNotesClick;
window.saveIncident = saveIncident;
window.resolveIncident = resolveIncident;
window.renderIncidents = renderIncidents;
window.showSchedulingPage = showSchedulingPage;
window.showDashboard = showDashboard;
window.createShift = createShift;
window.renderSchedules = renderSchedules;
window.deleteShift = deleteShift;
window.saveShiftEdit = saveShiftEdit;
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;
window.clockIn = clockIn;
window.clockOut = clockOut;
window.refreshSupervisorDashboard = refreshSupervisorDashboard;
window.showMissingClockIns = showMissingClockIns;
window.closeMissingClockInModal = closeMissingClockInModal;
window.checkPostAbandonment = checkPostAbandonment;

refreshSupervisorDashboard();