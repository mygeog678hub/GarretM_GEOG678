// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
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
  setDoc,
  serverTimestamp,
  increment,
  query,
  where,
  orderBy,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getCurrentUserProfile,
    initializeIdentity
} from "./services/identity-service.js";

import {
  app,
  auth,
  db,
  storage
} from "./services/firebase-config.js";

import {
  setEmployees,
  getEmployees,
  getEmployeeById,
  setCurrentEmployee,
  getCurrentEmployee
} from "./services/employee-service.js";

import {
    createIncidentAlert,
    resolveIncidentRecord,
    loadIncidentReportsData,
    saveIncidentAttachments,
    loadIncidentAttachments,
    saveIncidentDraftRecord,
    generateIncidentCaseNumber,
    startIncidentReportsListener,
    startIncidentsListener,
    addIncidentReviewHistory,
    approveIncidentReport,
    returnIncidentReport,
    loadIncidentSupplements,
    loadIncidentReviewHistory,
    getNextSupplementNumber,
    saveIncidentSupplement,
    loadIncidentReviewQueueData,
    voidIncidentReport      
} from "./services/incident-service.js";

import {
    startShiftListener,
    startOpenShiftsListener,
    startClaimRequestsListener,
    startOfficerOpenShiftsListener,
    startAssignmentListener,
    deleteScheduledShift,
    updateScheduledShift,
    createScheduledShift,
    startOfficerOpenShiftListener,
    approveMarketplaceClaim,
    claimMarketplaceShift,
    declineMarketplaceClaim,
    publishOpenShift,
    cancelMarketplaceShift
} from "./services/scheduling-service.js";

import {
    knowledgeArticles
}
from "./knowledge-data.js";

import {
    calculateDistance
} from "./services/scheduling-utils.js";

import {
    applyRolePermissions,
    sendResetPassword
} from "./services/authorization-service.js";

import {
    completeFirstTimePassword,
    verifyProfile
} from "./services/onboarding-service.js";


// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = user;

    const identityReady =
        await initializeIdentity();

    if (!identityReady) return;

    currentUserProfile =
        window.currentUserProfile;

    applyRolePermissions(currentUserProfile);

    console.log("Profile:", currentUserProfile);

    if (currentUserProfile.onboardingRequired) {

        showFirstTimeSetup();
        return;

    }

    if (currentUserProfile.role === "client") {
        window.location.href = "client-portal.html";
        return;
    }

    console.log(
        "Employee ID:",
        currentUserProfile.employeeId
    );    

    await bootstrapApplication();

    document.getElementById("appLayout")
        .style.display = "block";

    console.log(
        "Authenticated:",
        user.email
    );

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
const geofenceCircles = {};
const activeIncidentMarkers = {};
const activeIncidentGeofences = {};
const tenantId = "default";
const criticalAlert =
  new Audio(
    "./assets/critical-alert.mp3"
  );
criticalAlert.preload = "auto";

let employees = [];
let currentEmployee = null;
let sites = [];
let assets = [];
let vehicles = [];
let assignments = [];
let shifts = [];
let pendingDeployments = [];
let markers = {};
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
let currentOfficer = null;
let currentUser = null;
let currentUserProfile = null;
let activityReports = [];
let patrolTemplates = [];
let currentPatrolId = null;
let checkpoints = [];
let editingCheckpointId = null;
let currentActivePatrolId = null;
let analyticsSiteFilter = "";
let analyticsOfficerFilter = "";
let analyticsStartDateFilter = "";
let analyticsEndDateFilter = "";
let companyProfile = {};
let incidentReports = [];
let currentIncidentId = null;
let photoGallery = [];
let currentPhotoIndex = 0;
let currentGalleryImages = [];
let currentGalleryIndex = 0;
let patrolPhotoGallery = [];
let mileageReportShifts = [];
let editingSeriesId = null;
let editingRecurring = false;
let deletingShiftId = null;
let deletingSeriesId = null;
let deletingRecurring = false;
let currentOfficerShifts = [];
let openShifts = [];
let claimedShifts = [];
window.incidentVehicles = [];

//window.markers = markers;
window.geofenceCircles = geofenceCircles;
window.activeIncidentMarkers = activeIncidentMarkers;
window.activePatrols = [];
window.patrolCompletions = [];
window.currentReportFilter =
  "all";
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

let incidents = [];

startIncidentsListener(result => {

  if (!result.success) {

    console.error(result.message);

    return;

  }

  incidents =
    result.incidents;

  refresh();
  updateMap();

});
startIncidentReportsListener(result => {

  if (!result.success) {

    console.error(result.message);

    return;

  }

  incidentReports =
    result.incidentReports;

  refresh();

});

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

  const dashboardLogs =
    activityLogs.filter(
      log =>
        (!log.scope ||
          log.scope === "site") &&
        log.type !== "Post Abandonment" &&
        log.type !== "Returned To Post"
    );

  const filteredLogs =
    activityFilter === "all"
      ? dashboardLogs
      : dashboardLogs.filter(
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

    ${log.message || log.description || ""}

  </div>

`;

    })
    .join("");
}

function fileToBase64(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload =
        () => resolve(
          reader.result
        );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}

// ================= LOAD =================
function startEmployeeListener() {
onSnapshot(

  query(

    collection(db, "employees"),

    where(
      "tenantId",
      "==",
      window.currentUserProfile.tenantId
    )

  ),

  snap => {

    const employeeList = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      role: d.data().role || "Officer"
    }));


employees = employeeList;
setEmployees(employeeList);

  console.log(
    "Employees Loaded:",
    employees.length
  );

  if (!currentUser) return;

  const employee =
  employees.find(
    
    e =>
      currentUserProfile &&
      currentUserProfile.employeeId &&
      e.id === currentUserProfile.employeeId
  );

      
  currentEmployee = employee;

 if (employee) {

    currentOfficer = employee;

    
    console.log("currentOfficer set:", currentOfficer);
    console.log("currentEmployee:", currentEmployee);

    console.log(
        "Employee Session:",
        employee.name
    );

    console.log(
        "Employee ID:",
        employee.id
    );

    listenForNotifications();

}

 if (
    currentUserProfile &&
    currentUserProfile.role === "Officer"
) {

    showOfficerPortal();

} else {

    console.log(
        "Administrator/Supervisor Login"
    );

    showDashboard();

}

});
}

function startPatrolTemplateListener() {

  onSnapshot(

    query(

      collection(
        db,
        "patrolTemplates"
      ),

      where(
        "tenantId",
        "==",
        window.currentUserProfile.tenantId
      )

    ),

    snapshot => {

      patrolTemplates =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

      renderPatrolTemplates();

    }

  );

}


function startSiteListener() {

  onSnapshot(

    query(

      collection(db, "sites"),

      where(
        "tenantId",
        "==",
        window.currentUserProfile.tenantId
      )

    ),

    snapshot => {
      console.log(
  "Site snapshot size:",
  snapshot.size
);

      sites =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );
        console.log(
  "Sites loaded:",
  snapshot.size,
  sites
);

      window.sites = sites;

      updateMap();
      populatePatrolSiteDropdown();

      // Refresh officer portal if it's active
      if (currentEmployee) {
        renderMySite();
      }

    }

  );

}


function startAssetListener() {
onSnapshot(collection(db, "assets"), snap => {
  assets = snap.docs.map(d => ({
    docId: d.id,
    ...d.data()
  }));
  console.log("Assets Loaded:", assets);
  refresh();
  updateDailySummary();
});
}


function startVehicleListener() {
onSnapshot(collection(db, "vehicles"), snap => {
  vehicles = snap.docs.map(d => ({
    docId: d.id,
    ...d.data()
  }));
  refresh();
  updateDailySummary();
});
}


function startActivityLogListener() {

  onSnapshot(

    query(

      collection(db, "activityLogs"),

      where(
        "tenantId",
        "==",
        window.currentUserProfile.tenantId
      )

    ),

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

}


function startActivityReportListener() {
onSnapshot(
  collection(db, "activityReports"),

  snap => {

    console.log("SNAPSHOT FIRED");

    activityReports = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(
      "REPORT COUNT:",
      snap.size
    );

  },

  error => {

    console.error(
      "ACTIVITY REPORT SNAPSHOT ERROR:",
      error
    );

  }
);
}

function startSiteNoteListener() {
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
}





function startTimeEntryListener() {
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

    updateMap();

  }
);
}

window.launchWorkForge = function () {

    document.getElementById(
        "setupCompletePage"
    ).style.display = "none";

    bootstrapApplication();

};


function startCheckpointListener() {
onSnapshot(

  collection(
    db,
    "checkpoints"
  ),

  snapshot => {

    checkpoints =
      snapshot.docs.map(
        doc => ({

          id: doc.id,

          ...doc.data()

        })
      );

    renderPatrolTemplates();

  }

);
}

function hideAllPages() {

    document.querySelectorAll(
        "[id$='Page'], #officerPortal"
    ).forEach(page => {
        page.style.display = "none";
    });

}

let bootstrapComplete = false;

async function bootstrapApplication() {

  console.log("Mileage page display:",
    getComputedStyle(
        document.getElementById("mileageReportPage")
    ).display
);
  console.log("Bootstrap Profile:", window.currentUserProfile);

  if (bootstrapComplete) {
    console.log("Bootstrap already completed.");
    return;
  }  

  hideAllPages();

// ================= BOOTSTRAP =================

  console.log("========== BOOTSTRAP START ==========");
  
  startEmployeeListener();
  startPatrolTemplateListener();
  startSiteListener();
  startAssignmentListener(result => {

    if (!result.success) {

        console.error(result.message);
        return;

    }

    assignments =
        result.assignments;

    refresh();

    updateDailySummary();

});
  startAssetListener();
  startVehicleListener();
  startActivityLogListener();
  startActivityReportListener();
  startSiteNoteListener();
  startShiftListener(result => {

    if (!result.success) {

        console.error(result.message);
        return;

    }

    shifts = result.shifts;

    renderSchedules();

    renderWeeklyScheduleBoard();

    renderMySchedule();

    renderMySite();

    renderMyAttendanceStatus();

    loadCompanyProfile();

    startOpenShiftsListener(result => {

    if (!result.success) {

        console.error(result.message);
        return;

    }

    openShifts = result.openShifts;

    console.log(
        "Open Shifts:",
        openShifts
    );

    renderOpenShifts();

});

    startOfficerOpenShiftsListener(result => {

    if (!result.success) {

        console.error(result.message);
        return;

    }

    officerOpenShifts =
        result.officerOpenShifts;

    renderOfficerOpenShifts();

});

    startClaimRequestsListener(result => {

    if (!result.success) {

        console.error(result.message);
        return;

    }

    claimedShifts =
        result.claimedShifts;

    renderClaimRequests();

});

});
  startTimeEntryListener();
  startCheckpointListener();

  console.log("========== BOOTSTRAP COMPLETE ==========");

  bootstrapComplete = true;

}

window.addIncidentVehicle =
  function () {
    incidentVehicles.push({
      role: "",
      owner: "",
      plate: "",
      plateState: "",
      year: "",
      make: "",
      model: "",
      color: "",
      towed: false,
      notes: ""
    });

    console.log(
      "After push:",
      incidentVehicles
    );

    renderIncidentVehicles();
  };

window.renderIncidentVehicles =
  function () {

    const container =
      document.getElementById(
        "vehiclesContainer"
      );

    if (!container) return;

    container.innerHTML = "";

    incidentVehicles.forEach(
      (vehicle, index) => {

        const card =
          document.createElement("div");

        card.className =
          "dashboard-card";

        card.innerHTML = `
  <h3>Vehicle ${index + 1}</h3>

  <div class="person-grid">
  <div class="field-group">

  <label>Role</label>
  <select
    oninput="
      incidentVehicles[${index}].role =
      this.value
    "
  >
    <option value="">Select Role</option>
    <option value="Suspect Vehicle"
      ${vehicle.role === "Suspect Vehicle" ? "selected" : ""}>
      Suspect Vehicle
    </option>
    <option value="Victim Vehicle"
      ${vehicle.role === "Victim Vehicle" ? "selected" : ""}>
      Victim Vehicle
    </option>
    <option value="Witness Vehicle"
      ${vehicle.role === "Witness Vehicle" ? "selected" : ""}>
      Witness Vehicle
    </option>
    <option value="Other"
      ${vehicle.role === "Other" ? "selected" : ""}>
      Other
    </option>
  </select>
  </div>

     <div class="field-group">
  <label>Owner</label>
  <input
  type="text"
  value="${vehicle.owner || ""}"
  oninput="
    incidentVehicles[${index}].owner =
      this.value;

    console.log(
      'Vehicles:',
      incidentVehicles
    );
  "
>
  </div>

 <div class="field-group">
  <label>Plate</label>
  <input
    type="text"
    value="${vehicle.plate || ""}"
    oninput="
      incidentVehicles[${index}].plate =
      this.value
    "
  >
  </div>

  <div class="field-group">

  <label>
    Plate State
  </label>

  <select
    oninput="
      incidentVehicles[${index}].plateState =
      this.value
    "
  >

    <option value="">
      State
    </option>

    <option ${vehicle.plateState === "AL" ? "selected" : ""}>AL</option>
    <option ${vehicle.plateState === "AK" ? "selected" : ""}>AK</option>
    <option ${vehicle.plateState === "AZ" ? "selected" : ""}>AZ</option>
    <option ${vehicle.plateState === "AR" ? "selected" : ""}>AR</option>
    <option ${vehicle.plateState === "CA" ? "selected" : ""}>CA</option>
    <option ${vehicle.plateState === "CO" ? "selected" : ""}>CO</option>
    <option ${vehicle.plateState === "CT" ? "selected" : ""}>CT</option>
    <option ${vehicle.plateState === "DE" ? "selected" : ""}>DE</option>
    <option ${vehicle.plateState === "FL" ? "selected" : ""}>FL</option>
    <option ${vehicle.plateState === "GA" ? "selected" : ""}>GA</option>
    <option ${vehicle.plateState === "HI" ? "selected" : ""}>HI</option>
    <option ${vehicle.plateState === "ID" ? "selected" : ""}>ID</option>
    <option ${vehicle.plateState === "IL" ? "selected" : ""}>IL</option>
    <option ${vehicle.plateState === "IN" ? "selected" : ""}>IN</option>
    <option ${vehicle.plateState === "IA" ? "selected" : ""}>IA</option>
    <option ${vehicle.plateState === "KS" ? "selected" : ""}>KS</option>
    <option ${vehicle.plateState === "KY" ? "selected" : ""}>KY</option>
    <option ${vehicle.plateState === "LA" ? "selected" : ""}>LA</option>
    <option ${vehicle.plateState === "ME" ? "selected" : ""}>ME</option>
    <option ${vehicle.plateState === "MD" ? "selected" : ""}>MD</option>
    <option ${vehicle.plateState === "MA" ? "selected" : ""}>MA</option>
    <option ${vehicle.plateState === "MI" ? "selected" : ""}>MI</option>
    <option ${vehicle.plateState === "MN" ? "selected" : ""}>MN</option>
    <option ${vehicle.plateState === "MS" ? "selected" : ""}>MS</option>
    <option ${vehicle.plateState === "MO" ? "selected" : ""}>MO</option>
    <option ${vehicle.plateState === "MT" ? "selected" : ""}>MT</option>
    <option ${vehicle.plateState === "NE" ? "selected" : ""}>NE</option>
    <option ${vehicle.plateState === "NV" ? "selected" : ""}>NV</option>
    <option ${vehicle.plateState === "NH" ? "selected" : ""}>NH</option>
    <option ${vehicle.plateState === "NJ" ? "selected" : ""}>NJ</option>
    <option ${vehicle.plateState === "NM" ? "selected" : ""}>NM</option>
    <option ${vehicle.plateState === "NY" ? "selected" : ""}>NY</option>
    <option ${vehicle.plateState === "NC" ? "selected" : ""}>NC</option>
    <option ${vehicle.plateState === "ND" ? "selected" : ""}>ND</option>
    <option ${vehicle.plateState === "OH" ? "selected" : ""}>OH</option>
    <option ${vehicle.plateState === "OK" ? "selected" : ""}>OK</option>
    <option ${vehicle.plateState === "OR" ? "selected" : ""}>OR</option>
    <option ${vehicle.plateState === "PA" ? "selected" : ""}>PA</option>
    <option ${vehicle.plateState === "RI" ? "selected" : ""}>RI</option>
    <option ${vehicle.plateState === "SC" ? "selected" : ""}>SC</option>
    <option ${vehicle.plateState === "SD" ? "selected" : ""}>SD</option>
    <option ${vehicle.plateState === "TN" ? "selected" : ""}>TN</option>
    <option ${vehicle.plateState === "TX" ? "selected" : ""}>TX</option>
    <option ${vehicle.plateState === "UT" ? "selected" : ""}>UT</option>
    <option ${vehicle.plateState === "VT" ? "selected" : ""}>VT</option>
    <option ${vehicle.plateState === "VA" ? "selected" : ""}>VA</option>
    <option ${vehicle.plateState === "WA" ? "selected" : ""}>WA</option>
    <option ${vehicle.plateState === "WV" ? "selected" : ""}>WV</option>
    <option ${vehicle.plateState === "WI" ? "selected" : ""}>WI</option>
    <option ${vehicle.plateState === "WY" ? "selected" : ""}>WY</option>

  </select>

</div>
 <div class="field-group">

  <label>Year</label>
  <input
    type="text"
    value="${vehicle.year || ""}"
    oninput="
      incidentVehicles[${index}].year =
      this.value
    "
  >
  </div>
 <div class="field-group">
  <label>Make</label>
  <input
    type="text"
    value="${vehicle.make || ""}"
    oninput="
      incidentVehicles[${index}].make =
      this.value
    "
  >
  </div>
  <div class="field-group">

  <label>Model</label>
  <input
    type="text"
    value="${vehicle.model || ""}"
    oninput="
      incidentVehicles[${index}].model =
      this.value
    "
  >
  </div>
 <div class="field-group">
  <label>Color</label>
  <input
    type="text"
    value="${vehicle.color || ""}"
    oninput="
      incidentVehicles[${index}].color =
      this.value
    "
  >
  </div>
 <div class="field-group">
  <label>Towed</label>
  <select
    oninput="
      incidentVehicles[${index}].towed =
      this.value === 'true'
    "
  >  
    <option
      value="false"
      ${!vehicle.towed ? "selected" : ""}
    >
      No
    </option>

    <option
      value="true"
      ${vehicle.towed ? "selected" : ""}
    >
      Yes
    </option>
  </select>
</div>

 <div class="field-group">
  <label>Notes</label>
  <textarea
    oninput="
      incidentVehicles[${index}].notes =
      this.value
    "
  >${vehicle.notes || ""}</textarea>
</div>
 <div class="field-group">
  <button
    type="button"
    onclick="
      removeIncidentVehicle(${index})
    "
  >
    Remove Vehicle
  </button>
  </div>
  </div>
`;

        container.appendChild(
          card
        );
      }
    );
  };

window.removeIncidentVehicle =
  function (index) {
    incidentVehicles.splice(
      index,
      1
    );

    renderIncidentVehicles();
  };

window.renderPatrolDashboard =
  function () {

    refreshPatrolMetrics();
    renderActivePatrolTable();
    renderCompletedPatrolHistory();

  };

onSnapshot(
  collection(db, "activePatrols"),
  snapshot => {

    window.activePatrols =
      snapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()
        })
      );

    renderPatrolDashboard();
    window.renderPatrolAnalytics();
    window.renderPatrolCharts();
  }
);

setInterval(() => {
  refreshPatrolMetrics();

  if (
    document.getElementById(
      "patrolDashboardPage"
    ).style.display !== "none"
  ) {
    renderPatrolDashboard();

  }
}, 10000);

document.getElementById(
  "employeeRole"
).onchange =
  function () {

    const section =
      document.getElementById(
        "securityLicenseSection"
      );

    section.style.display =
      this.value ===
        "Security Officer"

        ? "block"

        : "none";
  };

window.addReviewHistory =
  async function (
    reportId,
    action,
    comments = ""
  ) {

    const result =
      await addIncidentReviewHistory({

        reportId,

        action,

        comments,

        by:
          currentEmployee?.name ||
          currentEmployee?.fullName ||
          "Unknown User",

        byId:
          currentEmployee?.id || ""

      });

    if (!result.success) {

      console.error(
        result.message
      );

    }

  };
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

      tenantId: window.currentUserProfile.tenantId,

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
  const role =
    document.getElementById(
      "employeeRole"
    ).value;

  const securityLevel =
    document.getElementById(
      "employeeSecurityLevel"
    ).value;

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

    role:
      role === "Dispatcher"
        ? "Dispatcher"
        : "Officer",

    securityLevel:
      role === "Security Officer"
        ? securityLevel
        : "",

    employeeId: "",
    email: "",
    phone: "",

    homeAddress: "",
    homeLat: null,
    homeLng: null,

    securityLicenseNumber: "",
    securityLicenseExpiration: "",

    emergencyContactName: "",
    emergencyContactPhone: "",

    hireDate: "",

    tenantId:
  window.currentUserProfile.tenantId,

createdAt:
  new Date().toISOString()
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
    tenantId: window.currentUserProfile.tenantId,
    id,
    type,
    status: "active",
    createdAt: serverTimestamp()
  });

  document.getElementById("assetId").value = "";
  document.getElementById("assetType").value = "";
  document.getElementById("assetId").focus();
}
// ================= ASSIGN =================
async function assign() {

  console.log(
    "ASSIGN FUNCTION FIRED"
  );
  alert(
    `Employee: ${assignEmployee.options[
      assignEmployee.selectedIndex
    ]?.text
    }\nSite: ${assignSite.options[
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

  console.log(
    "Employees Loaded:",
    employees.length
  );

  const employee =
    employees.find(
      e => e.id === employeeId
    );

  const site =
    sites.find(
      s => s.id === siteId
    );

  let mileageDistance = 0;
  let mileageIncentive = false;
  let mileageStatus =
    "Coordinates Missing";

  const mileageThreshold =
    companyProfile
      ?.mileageThreshold || 25;

  if (
    employee?.homeLat &&
    employee?.homeLng &&
    site?.lat &&
    site?.lng
  ) {
    const distanceMeters =
      calculateDistance(
        employee.homeLat,
        employee.homeLng,
        site.lat,
        site.lng
      );

    mileageDistance =
      Number(
        (
          distanceMeters *
          0.000621371
        ).toFixed(1)
      );

    mileageIncentive =
      mileageDistance >
      mileageThreshold;

    mileageStatus =
      "Calculated";
  }

  console.log("Mileage Values", {
    mileageDistance,
    mileageThreshold,
    mileageIncentive,
    mileageStatus
  });
  const docRef =
  await addDoc(
    collection(db, "assignments"),
    {
      tenantId:
        window.currentUserProfile.tenantId,

      employeeId,
      siteId,

      assetId:
        assignAsset.value || null,

      vehicleId:
        assignVehicle.value || null,

      mileageDistance,
      mileageThreshold,
      mileageIncentive,
      mileageStatus,

      startTime:
        serverTimestamp(),

      endTime: null
    }
  );

  console.log(
    "Assignment created:",
    docRef.id
  );

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
  user = "System",
  scope = "site",
  metadata = {}
) {

  try {

    await addDoc(collection(db, "activityLogs"), {
  siteId,
  siteName: metadata.siteName || "",
  employeeId: metadata.employeeId || "",
  officerName: metadata.officerName || user,

  type,
  message,
  user,
  scope,

  tenantId: window.currentUserProfile.tenantId,

  ...metadata,

  timestamp: serverTimestamp()
});

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
  ${activeEmployees > 0
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
      ${a.startTime
          ? new Date(a.startTime).toLocaleDateString() +
          " " +
          new Date(a.startTime).toLocaleTimeString()
          : ""
        }
    </td>

    <td>
  ${a.endTime
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
      <span class="${a.endTime
          ? 'status-completed'
          : 'status-active'
        }">

        ${a.endTime
          ? "Completed"
          : "Active"
        }

      </span>
    </td>

    <td>
      ${!a.endTime
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

document
    .getElementById("knowledgeCenterBtn")
    ?.addEventListener(
        "click",
        showKnowledgeCenter
    );

function showKnowledgeCenter() {

  
    document.getElementById(
          "knowledgeCenterPage"
        ).style.display = "block";

        document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolsPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "none";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";


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

    const active = timeEntries.filter(
      entry =>
        entry.siteId === site.id &&
        entry.status === "Clocked In"
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

      popup +=
        "<b>Assigned Resources:</b><br>";

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

    const officersOnDuty =
      timeEntries.filter(entry =>
        entry.siteId === site.id &&
        entry.status === "Clocked In"
      );

    const activeViolations =
      officersOnDuty.filter(
        officer =>
          officer.currentlyInsideGeofence === false
      );

    popup += "<hr>";

    popup +=
      "<b>Security Officers On Duty:</b><br>";

    if (activeViolations.length) {

      popup += `
    <div
      style="
        border-left:4px solid #dc2626;
        padding-left:8px;
        margin-bottom:10px;
      "
    >
      <b>
        🚨 ACTIVE POST ABANDONMENT
      </b><br>
  `;

      activeViolations.forEach(
        officer => {

          popup += `
        Officer:
        ${officer.employeeName}<br>

        Violation Count:
        ${officer.gpsViolationCount || 0}
        <br><br>
      `;

        }
      );

      popup += "</div>";

    }

    if (!officersOnDuty.length) {

      popup +=
        "No officers currently clocked in";

    } else {

      officersOnDuty.forEach(
        officer => {

          popup += `
        <div
          style="
            margin-bottom:6px;
          "
        >
          👮
          ${officer.employeeName}
        </div>
      `;

        }
      );

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
      ).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })}
</small>
  `;

    }

   marker.bindPopup(popup, {
  maxWidth: 450,
  minWidth: 300
});

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
  ${a.status === "maintenance"
        ? "disabled"
        : ""
      }
>
  ${a.id} - ${a.type}
  ${a.status === "maintenance"
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
    document.getElementById(
      "employeeSearch"
    ).value.toLowerCase();

  const filtered =
    employees.filter(e =>
      e.name
        .toLowerCase()
        .includes(search)
    );

  renderEmployees(filtered);
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

async function createSiteNote({
  siteId,
  note,
  createdBy,
  priority = "Normal",
  title = "",
  category = ""
}) {

  try {

    if (!siteId) {

      return {
        success: false,
        message: "No site selected."
      };

    }

    if (!note?.trim()) {

      return {
        success: false,
        message: "Please enter a site note."
      };

    }

    const site =
      sites.find(
        s => s.id === siteId
      );

    if (!site) {

      return {
        success: false,
        message: "Unable to locate site."
      };

    }

    const noteRef =
      await addDoc(
        collection(db, "siteNotes"),
        {

          siteId,
          siteName: site.name,

          category,

          title,

          priority,

          note: note.trim(),

          createdBy,

          tenantId: window.currentUserProfile.tenantId,

          createdAt:
            new Date().toISOString()

        }
      );

    await logActivity(
      siteId,
      "note",
      `📝 ${priority} Site Note - ${site.name}`,
      createdBy,
      "site",
      {
        siteName: site.name
      }
    );

    // Future:
    // if (priority === "Critical") {
    //   await processCriticalSiteNote(...);
    // }

    return {

      success: true,

      noteId: noteRef.id

    };

  }

  catch (error) {

    console.error(
      "Error creating site note:",
      error
    );

    return {

      success: false,

      message:
        "Unable to save site note."

    };

  }

}

async function saveSiteNote() {

  const siteId =
    document.getElementById("noteSite").value;

  const note =
    document.getElementById("siteNote").value.trim();

  const result =
    await createSiteNote({

      siteId,

      note,

      createdBy:
        currentOfficer?.name ||
        auth.currentUser?.email

    });

  if (!result.success) {

    alert(result.message);

    return;

  }

  closeSiteNoteModal();

  alert("Site note saved.");

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
        status: "maintenance"
      }
    );

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
    tenantId: window.currentUserProfile.tenantId,

    id,
    make: vehMake.value,
    model: vehModel.value,
    plate: vehPlate.value,
    unit: vehUnit.value,

    createdAt: serverTimestamp()
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
    tenantId: window.currentUserProfile.tenantId,
    userId: window.currentUserProfile.uid,

    companyName: companyProfile?.companyName || "",

    module,
    description,
    email,
    severity,

    status: "open",    

    createdAt: serverTimestamp()
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
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)
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
    "editLicenseSection"
  ).style.display =
    emp.designation ===
      "Security Officer"
      ? "block"
      : "none";

  document.getElementById(
    "editEmployeeLicenseLevel"
  ).value =
    emp.licenseLevel || "";

  document.getElementById(
    "editEmployeeLicenseNumber"
  ).value =
    emp.licenseNumber || "";

  document.getElementById(
    "editEmployeeLicenseExpiration"
  ).value =
    emp.licenseExpiration || "";

  document.getElementById(
    "editLicenseSection"
  ).style.display =
    emp.type === "Security Officer"
      ? "block"
      : "none";

  document.getElementById(
    "editEmployeeId"
  ).value =
    emp.employeeId || "";

  document.getElementById(
    "editEmployeeEmail"
  ).value =
    emp.email || "";

  document.getElementById(
    "editEmployeePhone"
  ).value =
    emp.phone || "";

  document.getElementById(
    "editEmployeeHireDate"
  ).value =
    emp.hireDate || "";

  document.getElementById(
    "editEmployeeHomeAddress"
  ).value =
    emp.homeAddress || "";

  document.getElementById(
    "editEmployeeHomeCity"
  ).value =
    emp.homeCity || "";

  document.getElementById(
    "editEmployeeHomeState"
  ).value =
    emp.homeState || "";

  document.getElementById(
    "editEmployeeHomeZip"
  ).value =
    emp.homeZip || "";

  document.getElementById(
    "editEmployeeHomeLat"
  ).value =
    emp.homeLat || "";

  document.getElementById(
    "editEmployeeHomeLng"
  ).value =
    emp.homeLng || "";

  document.getElementById(
    "editEmployeeEmergencyName"
  ).value =
    emp.emergencyContactName || "";

  document.getElementById(
    "editEmployeeEmergencyPhone"
  ).value =
    emp.emergencyContactPhone || "";

  document.getElementById(
    "editEmployeeModal"
  ).style.display = "block";

}

async function saveEmployeeEdit() {

  if (!editingEmployeeId) return;

  let newHomeLat = null;
  let newHomeLng = null;

  const name =
    document.getElementById(
      "editEmpName"
    ).value.trim();

  const designation =
    document.getElementById(
      "editEmpRole"
    ).value.trim();

  const licenseLevel =
    document.getElementById(
      "editEmployeeLicenseLevel"
    ).value;

  const licenseNumber =
    document.getElementById(
      "editEmployeeLicenseNumber"
    ).value.trim();

  const licenseExpiration =
    document.getElementById(
      "editEmployeeLicenseExpiration"
    ).value;

  const employeeId =
    document.getElementById(
      "editEmployeeId"
    ).value.trim();

  const email =
    document.getElementById(
      "editEmployeeEmail"
    ).value.trim();

  const phone =
    document.getElementById(
      "editEmployeePhone"
    ).value.trim();

  const hireDate =
    document.getElementById(
      "editEmployeeHireDate"
    ).value;

  const homeAddress =
    document.getElementById(
      "editEmployeeHomeAddress"
    ).value.trim();

  const homeCity =
    document.getElementById(
      "editEmployeeHomeCity"
    ).value.trim();

  const homeState =
    document.getElementById(
      "editEmployeeHomeState"
    ).value;

  const homeZip =
    document.getElementById(
      "editEmployeeHomeZip"
    ).value.trim();

  const emergencyContactName =
    document.getElementById(
      "editEmployeeEmergencyName"
    ).value.trim();

  const emergencyContactPhone =
    document.getElementById(
      "editEmployeeEmergencyPhone"
    ).value.trim();

  if (
    homeAddress &&
    homeCity &&
    homeState &&
    homeZip
  ) {
    try {

      const addresses = [
        `${homeAddress}, ${homeCity}, ${homeState} ${homeZip}, USA`,
        `${homeAddress}, ${homeCity}, ${homeState}, USA`,
        `${homeAddress}, ${homeZip}, USA`
      ];

      let results = [];

      for (const address of addresses) {        

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              address
            )}`
          );

        results =
          await response.json();        

        if (results.length) {
          break;
        }
      }

      if (results.length) {

        newHomeLat =
          parseFloat(
            results[0].lat
          );

        newHomeLng =
          parseFloat(
            results[0].lon
          );
      }

    } catch (err) {

      console.error(
        "Address geocoding failed:",
        err
      );
    }
  }

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
        designation,

        licenseLevel,
        licenseNumber,
        licenseExpiration,

        employeeId,
        email,
        phone,
        hireDate,

        homeAddress,
        homeCity,
        homeState,
        homeZip,
        homeLat:
          newHomeLat,
        homeLng:
          newHomeLng,

        emergencyContactName,
        emergencyContactPhone
      }
    );

    document.getElementById(
      "editEmployeeHomeLat"
    ).value =
      newHomeLat || "";

    document.getElementById(
      "editEmployeeHomeLng"
    ).value =
      newHomeLng || "";

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
    tenantId: window.currentUserProfile.tenantId,

    employeeId,
    siteId: siteDoc.id,
    assetId: null,
    vehicleId: null,

    startTime: serverTimestamp(),
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
    return {
    success: false,
    message: "Site not found."
};
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
            ${emp.alreadyAssigned
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

            ${employees.map(e => `

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

function filterMapSites(type, button) {

  currentMapFilter = type;

  // active button styling
  document.querySelectorAll(".map-filters button")
    .forEach(btn =>
      btn.classList.remove("active-filter")
    );

  if (button) {
    button.classList.add("active-filter");
  }

  Object.values(markers).forEach(marker => {

    applyMarkerVisibility(marker);

  });

}

function applyMarkerVisibility(marker) {

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
    if (window.map.hasLayer(marker)) {
      window.map.removeLayer(marker);
    }
    return;
  }

  if (
    status === "Inactive" &&
    !showInactiveSites
  ) {
    if (window.map.hasLayer(marker)) {
      window.map.removeLayer(marker);
    }
    return;
  }

  if (
    status === "Closed" &&
    !showClosedSites
  ) {
    if (window.map.hasLayer(marker)) {
      window.map.removeLayer(marker);
    }
    return;
  }

  // SHOW ALL
  if (currentMapFilter === "all") {

    if (!window.map.hasLayer(marker)) {
      marker.addTo(window.map);
    }

    return;

  }

  // MATCH FILTER
  if (marker.siteType === currentMapFilter) {

    if (!window.map.hasLayer(marker)) {
      marker.addTo(window.map);
    }

  }

  // HIDE NON-MATCHING
  else {

    if (window.map.hasLayer(marker)) {
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

  select.innerHTML = `
  <option value="">
    Select Site...
  </option>
`;

  sites
    .sort((a, b) =>
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

  let activeEntry = null;

 if (
  currentEmployee &&
  currentEmployee.id
) {
  activeEntry =
    timeEntries.find(
      entry =>
        entry.employeeId === currentEmployee.id &&
        entry.status === "Clocked In"
    );
}

  if (activeEntry) {

    select.value =
      activeEntry.siteId;

  }

  select.onchange = function () {  

    loadSiteHistory();
  };

  loadSiteHistory();

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
 
  const notes =
    siteNotes
      .filter(
        n => n.siteId === siteId
      )

      .sort((a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
  
  const container =
    document.getElementById(
      "siteNotesList"
    );

  if (!notes.length) {

    container.innerHTML =
      "<p>No notes found.</p>";

    return;

  }
  
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

<pre style="
  color:#111827;
  white-space:pre-wrap;
">
${JSON.stringify(note, null, 2)}
</pre>

    </div>

  `).join("");

}

function loadSiteHistory() {
 

  const select =
    document.getElementById(
      "viewNotesSite"
    );

  const siteId =
    document.getElementById(
      "viewNotesSite"
    ).value;
 

  const notes = siteNotes
    .filter(
      n => n.siteId === siteId
    )
    .map(note => ({
      type: "Site Note",
      createdBy: note.createdBy,
      createdAt: note.createdAt,
      text: note.note || "",
      raw: note
    }));
 

  const reports = activityReports
    .filter(
      r => r.siteId === siteId
    )
    .map(report => ({
      type: "Activity Report",
      createdBy:
        report.officerName ||
        report.employeeName ||
        report.createdBy ||
        "Officer",
      createdAt: report.timestamp?.toDate
  ? report.timestamp.toDate()
  : report.timestamp,
      text: `
${report.activityType || "Activity"}

${report.description || ""}
    `.trim(),
      raw: report
    }));

  const history = [
    ...notes,
    ...reports
  ].sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );

  const container =
    document.getElementById(
      "siteNotesList"
    );

  if (!history.length) {

    container.innerHTML =
      "<p>No history found.</p>";

    return;

  }

  container.innerHTML =
    history.map(item => {

      const icon =
        item.type === "Activity Report"
          ? "📋"
          : "📝";

      return `

      <div style="
        background:#ffffff;
        color:#111827;
        border:1px solid #ddd;
        padding:10px;
        margin-bottom:10px;
        border-radius:6px;
      ">

        <strong>
          ${icon} ${item.type}
        </strong>

        <br><br>

        <small style="color:#6b7280;">

          ${item.createdBy}

          <br>

          ${new Date(
        item.createdAt
      ).toLocaleString()}

        </small>

        <br><br>

        <div style="
          white-space:pre-wrap;
        ">
          ${item.text}
        </div>

      </div>

    `;

    }).join("");
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
    getCurrentOfficerSiteId();

  if (!siteId) {

    alert(
      "Unable to determine your current site."
    );

    return;

  }

  const severity =
  document.getElementById(
    "fieldIncidentSeverity"
  ).value;

const description =
  document.getElementById(
    "fieldIncidentDescription"
  ).value.trim();

  const result =
    await createIncidentAlert({

      siteId,
      severity,
      description,

      reportedBy:
        auth.currentUser?.email || "Unknown"

    });

  if (!result.success) {

    alert(result.message);
    return;

  }

  if (
    severity?.toLowerCase() === "critical"
  ) {

    handleCriticalIncident(siteId);

  }

  alert("Incident reported.");

 document.getElementById(
  "fieldIncidentDescription"
).value = "";

document.getElementById(
  "fieldIncidentSeverity"
).selectedIndex = 0;

}



function handleCriticalIncident(siteId) {

  const site =
    sites.find(s => s.id === siteId);

  if (!site || !window.map) return;

  playCriticalAlert();  

  document
    .getElementById("operationsMapPanel")
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

    if (marker?.openPopup) {

      marker.openPopup();

      window.map.panBy([0, 150]);

    }

  }, 1800);

}


function renderIncidents() {  

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

  ${openIncidents.length
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

${resolvedIncidents.length
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
              ${i.resolvedAt
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
    alert(
      "Resolution notes required."
    );
    return;
  }

  const result =
    await resolveIncidentRecord({

        id,

        resolution,

        resolvedBy:
            auth.currentUser?.email ||
            "Unknown"

    });

if (!result.success) {

    alert(result.message);

    return;

}

alert("Incident resolved.");
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

window.showCompanySettingsPage =
  function () {

    document.getElementById(
      "companySettingsPage"
    ).style.display = "block";

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolsPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "none";
    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";

    document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";


  };

function showDashboard() {

  document.getElementById(
    "dashboardPage"
  ).style.display = "block";

  document.getElementById(
    "schedulingPage"
  ).style.display = "none";

  document.getElementById(
    "officerIncidentReportPage"
  ).style.display = "none";

  document.getElementById(
    "officerPortal"
  ).style.display = "none";

  document.getElementById(
    "incidentReportsPage"
  ).style.display = "none";

  document.getElementById(
    "patrolsPage"
  ).style.display = "none";

  document.getElementById(
    "myPatrolsPage"
  ).style.display = "none";

  document.getElementById(
    "patrolDashboardPage"
  ).style.display = "none";

  document.getElementById(
    "patrolAnalyticsPage"
  ).style.display = "none";

  document.getElementById(
    "companySettingsPage"
  ).style.display = "none";

  document.getElementById(
    "myReportsPage"
  ).style.display =
    "none";

  document.getElementById(
    "incidentReviewPage"
  ).style.display = "none";

  document.getElementById(
    "mileageReportPage"
  ).style.display = "none";

  document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";

  refreshSupervisorDashboard();

}

window.showOfficerPortal =
  async function () {

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display = "block";

    document.getElementById(
      "patrolsPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

     document.getElementById(
    "patrolDashboardPage"
  ).style.display = "none";

    document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";

    document.getElementById(
      "knowledgeCenterPage"
      ).style.display = "none";

       document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    renderMySchedule();
    renderMySite();
    renderMyAttendanceStatus();
    await resumeActivePatrol();

  };    

window.showOfficerIncidentReport =
  function () {

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "block";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolsPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "none";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";

    document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";

  };

function showSchedulingPage() {

  document.getElementById(
    "dashboardPage"
  ).style.display = "none";

  document.getElementById(
    "schedulingPage"
  ).style.display = "block";

  document.getElementById(
    "officerPortal"
  ).style.display = "none";

  document.getElementById(
    "officerIncidentReportPage"
  ).style.display = "none";

  document.getElementById(
    "incidentReportsPage"
  ).style.display = "none";

  document.getElementById(
    "patrolsPage"
  ).style.display = "none";

  document.getElementById(
    "myPatrolsPage"
  ).style.display = "none";

  document.getElementById(
    "patrolDashboardPage"
  ).style.display = "none";

  document.getElementById(
    "patrolAnalyticsPage"
  ).style.display = "none";

  document.getElementById(
    "companySettingsPage"
  ).style.display = "none";

  document.getElementById(
    "myReportsPage"
  ).style.display =
    "none";

  document.getElementById(
    "patrolExecutionPage"
  ).style.display = "none";

  document.getElementById(
    "incidentReviewPage"
  ).style.display = "none";
  document.getElementById(
    "mileageReportPage"
  ).style.display = "none";

  document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";
  
  populateScheduleDropdowns();
  renderWeeklyScheduleBoard();
  updateScheduleType();

}

window.showPatrolExecution =
  function () {

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolsPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "block";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "none";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";

    document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";
  };

window.showIncidentReviewPage =
  async function () {

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolsPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "block";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";

    document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";

    await loadIncidentReviewQueue();
  };

window.showMileageReportPage =
  async function () {

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolsPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "none";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "block";

    document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";

    await loadMileageReport();
  };

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

window.showIncidentReportsPage =
  function () {

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";   

    document.getElementById(
      "officerPortal"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "block";

    document.getElementById(
      "patrolsPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "none";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";

    document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";

    loadIncidentReports();

  };

  async function createSingleShift(shiftData) {

  const {
    employeeId,
    employeeName,
    siteId,
    siteName,
    siteCategory,
    startTime,
    endTime,
    classification,
    licenseLevel,
    shiftPay,
    mileageDistance,
    mileageIncentive,
    mileageStatus,
    mileageThreshold,
    repeatEnabled,
    repeatDays,
    repeatEndDate,
    seriesId
  } = shiftData;

}

let officerOpenShifts = [];

function loadOfficerOpenShifts() {

    startOfficerOpenShiftListener(

        db,

        (openShifts) => {

            officerOpenShifts = openShifts;

            renderOfficerOpenShifts();

        }

    );

}

function renderOfficerOpenShifts() {

    const container =
        document.getElementById(
            "availableOpenShifts"
        );

    if (!container) return;

    if (officerOpenShifts.length === 0) {

        container.innerHTML =
            "<p>No open shifts available.</p>";

        return;

    }

    container.innerHTML =
        officerOpenShifts.map(shift => `

            <div class="open-shift-card">

                <h4>${shift.siteName}</h4>

                <p>
                    ${formatDate(shift.startTime)}
                </p>

                <p>
                    ${formatTime(shift.startTime)}
                    -
                    ${formatTime(shift.endTime)}
                </p>

                <p>
                    ${shift.classification}
                </p>

                <p>
                    $${shift.shiftPay}/hr
                </p>

                <button onclick="claimOpenShift('${shift.id}')">
                  Claim Shift
                </button>

            </div>

        `).join("");

}

async function createOpenShift() {

  try {

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

    const shiftPay =
      parseFloat(
        document.getElementById(
          "schedulePay"
        ).value
      ) || 0;

    const classification =
      document.getElementById(
        "shiftClassification"
      ).value;

    const repeatEnabled =
      document.getElementById(
        "repeatSchedule"
      ).checked;

    const repeatDays = 
      getRepeatDays();

    const repeatEndDate =
      document.getElementById(
        "repeatEndDate"
      ).value;
      
      const result =
    await publishOpenShift(
        db,
        {
            siteId,
            startTime,
            endTime,
            shiftPay,
            classification,
            repeatEnabled,
            repeatDays,
            repeatEndDate
        }
    );

if (!result.success) {

    alert(result.message);
    return;

}

// Clear form
document.getElementById("scheduleSite").value = "";
document.getElementById("scheduleStart").value = "";
document.getElementById("scheduleEnd").value = "";
document.getElementById("schedulePay").value = "";
document.getElementById("shiftClassification").selectedIndex = 0;

document.getElementById("repeatSchedule").checked = false;

document.getElementById("repeatEndDate").value = "";

// Hide repeat options again
toggleRepeatOptions();

alert(result.message);

  } catch (error) {

    console.error(error);

    alert(
      "Unable to publish Open Shift."
    );

  }

}

async function createShift() {

  const scheduleType =
    document.querySelector(
      'input[name="scheduleType"]:checked'
    ).value;

  if (scheduleType === "open") {
    return createOpenShift();
  }

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

  const shiftPay =
    Number(
      document.getElementById(
        "schedulePay"
      ).value
    ) || 0;

  const classification =
    document.getElementById(
      "shiftClassification"
    ).value;   

  const repeatEnabled =
    document.getElementById(
      "repeatSchedule"
    ).checked;

  const repeatDays =
    getRepeatDays();

  const repeatEndDate =
    document.getElementById(
      "repeatEndDate"
    ).value;

    if (
    repeatEnabled &&
    (
      !repeatDays.length ||
      !repeatEndDate
    )
  ) {
    alert(
      "Select repeat days and an end date."
    );
    return;
  }

  if (
    !employeeId ||
    !siteId ||
    !startTime ||
    !endTime
  ) {
    alert(
      "Complete all fields.");

    return;
  }

  const shiftData = {

    employeeId,
    siteId,

    startTime,
    endTime,

    classification,
    shiftPay,

    repeatEnabled,
    repeatDays,
    repeatEndDate

};

const result =
    await createScheduledShift({
        data: shiftData,
        employees,
        sites,
        shifts,
        companyProfile
    });

if (!result || !result.success) {

    alert(
        result?.message ||
        "Unable to create shift."
    );

    return;

}   

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

  document.getElementById(
    "schedulePay"
  ).value = "";

  document.getElementById(
    "repeatSchedule"
  ).checked = false;

  document.getElementById(
    "repeatEndDate"
  ).value = "";

  document.getElementById(
    "shiftClassification"
  ).selectedIndex = 0;

  document
    .querySelectorAll(".repeatDay")
    .forEach(cb => {
      cb.checked = false;
    });

  document.getElementById(
    "repeatOptions"
  ).classList.add("hidden");
}

function formatRepeatDays(
  days
) {
  const names = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];

  return (
    days || []
  )
    .map(
      d => names[d]
    )
    .join(", ");
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

      <span class="shift-classification">
      🛡
        ${shift.classification || "Unclassified"}
      </span>

      ${new Date(
      shift.startTime
    ).toLocaleString()}

      -

      ${new Date(
      shift.endTime
    ).toLocaleString()}

      <br>

      <strong>
  Shift Pay:
</strong>

$${Number(
      shift.shiftPay || 0
    ).toFixed(2)}

<br>

<strong>
  🚗 Mileage:
</strong>

${shift.mileageDistance != null
        ? `${shift.mileageDistance} mi`
        : "Not Available"
      }

${shift.mileageIncentive
        ? `
      <br>
      <span class="mileage-badge">
        🚗 Incentive Pay
      </span>
      `
        : ""
      }

${shift.repeatEnabled
        ? `
      <br>

      <span
        class="repeat-badge"
      >
        🔁 
        ${formatRepeatDays(
          shift.repeatDays
        )}
      </span>

      <br>

      <span
        class="repeat-badge">
        Ends
        ${new Date(
          shift.repeatEndDate
        ).toLocaleDateString()}
      </span>
      `
        : ""
      }

<br><br>

      <button onclick="editShift('${shift.id}')">
        Edit Shift
      </button>

      <button
        class="secondary-btn"
        onclick="extendRecurringSeries('${shift.seriesId}')">

        Extend Series

      </button>

      <button onclick="deleteShift('${shift.id}')">
        Delete Shift
      </button>

    </div>

  `;

  });
  renderWeeklyScheduleBoard();
}

function deleteShift(id) {

  const shift =
    shifts.find(
      s => s.id === id
    );

  if (!shift) return;

  deletingShiftId =
    shift.id;

  deletingSeriesId =
    shift.seriesId || null;

  deletingRecurring =
    !!shift.seriesId;

  document
    .getElementById(
      "deleteRecurringOptions"
    )
    .classList.toggle(
      "hidden",
      !deletingRecurring
    );

  document
    .getElementById(
      "deleteShiftModal"
    )
    .classList.remove(
      "hidden"
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

  editingSeriesId =
    shift.seriesId || null;

  editingRecurring =
    !!shift.seriesId;

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

  document.getElementById(
    "editShiftPay"
  ).value =
    shift.shiftPay || 0;

  document.getElementById(
    "editShiftClassification"
  ).value =
    shift.classification || "";

  document
    .getElementById(
      "editRecurringOptions"
    )
    .classList.toggle(
      "hidden",
      !editingRecurring
    );

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

  const shiftPay =
    Number(
      document.getElementById(
        "editShiftPay"
      ).value
    ) || 0;

  const classification =
    document.getElementById(
      "editShiftClassification"
    ).value;

 

  const editMode =
    document.querySelector(
      'input[name="editRecurringMode"]:checked'
    )?.value || "occurrence";

    const result =
    await updateScheduledShift({

        id,
        employeeId,
        siteId,
        startTime,
        endTime,
        shiftPay,
        classification,

        editMode,
        editingRecurring,
        editingSeriesId,

        employees,
        sites,
        shifts

    });

if (!result.success) {

    alert(result.message);
    return;

}
  
  closeEditShiftModal();
}

function renderWeeklyScheduleBoard() {
  const weekEnd = getEndOfWeek(currentWeekStart);

  document.getElementById("weekRangeLabel").textContent =
    `${currentWeekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
  const board =
    document.getElementById(
      "weeklyScheduleBoard"
    );

  if (!board) return;

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

    for (let day = 1; day <= 7; day++) {

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



async function clockIn() {

  console.log("clockIn currentOfficer:", currentOfficer);
console.log("clockIn currentEmployee:", currentEmployee);


  if (!currentOfficer) {
    alert(
      "Officer session not found."
    );
    return;
  }

  const employeeId =
    currentOfficer.id;

  const employee =
    currentOfficer;

  const position =
    await new Promise(
      (resolve, reject) => {

        if (
          !navigator.geolocation
        ) {
          reject(
            new Error(
              "Geolocation not supported"
            )
          );
          return;
        }

        navigator.geolocation
          .getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
      }
    );

  const officerLat =
    position.coords.latitude;

  const officerLng =
    position.coords.longitude;

  // =====================
  // Optional Pre-Shift Photo
  // =====================

  let preShiftPhoto =
    null;

  const photoInput =
    document.getElementById(
      "preShiftPhoto"
    );

  if (
    photoInput &&
    photoInput.files.length
  ) {
    preShiftPhoto =
      await fileToBase64(
        photoInput.files[0]
      );
  }

  alert(
    `GPS Acquired\n\nLat: ${officerLat}\nLng: ${officerLng}`
  );

  const now =
    new Date();

  const activeShift =
    shifts.find(
      shift => {

        if (
          shift.employeeId !==
          employeeId
        ) {
          return false;
        }

        const start =
          new Date(
            shift.startTime
          );

        const end =
          new Date(
            shift.endTime
          );

        return (
          now >= start &&
          now <= end
        );
      }
    );

  if (!activeShift) {
    alert(
      "No active shift available for clock-in."
    );
    return;
  }

  const site =
    sites.find(
      s =>
        s.id ===
        activeShift.siteId
    );

  if (!site) {
    alert(
      "Assigned site not found."
    );
    return;
  }

  console.log(
    "Officer Lat:",
    officerLat
  );

  console.log(
    "Officer Lng:",
    officerLng
  );

  console.log(
    "Site Object:",
    site
  );

  console.log(
    "Active Shift:",
    activeShift
  );

  const distance =
    calculateDistance(
      officerLat,
      officerLng,
      Number(site.lat),
      Number(site.lng)
    );

  const allowedRadiusFeet =
    Number(
      site.geofenceRadius
    ) || 150;

  const allowedRadius =
    allowedRadiusFeet *
    0.3048;

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

  if (
    distance >
    allowedRadius
  ) {
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

    alert(
      `Accuracy: ${Math.round(
        position.coords.accuracy
      )} meters`
    );

    return;
  }

  const existingEntry =
    timeEntries.find(
      entry =>
        entry.employeeId ===
        employeeId &&
        entry.status ===
        "Clocked In"
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
  collection(
    db,
    "timeEntries"
  ),
  {
    tenantId:
      window.currentUserProfile.tenantId,

    employeeId,
    employeeName,
    siteId,
    siteName,
    shiftId,

    clockIn:
      serverTimestamp(),

    status:
      "Clocked In",

    preShiftPhoto:
      preShiftPhoto
        ? {
            imageBase64:
              preShiftPhoto,
            timestamp:
              serverTimestamp(),
            lat:
              officerLat,
            lng:
              officerLng
          }
        : null,

    monitoringActive:
      true,

    lastGpsCheck:
      null,

    gpsViolationCount:
      0,

    currentlyInsideGeofence:
      true
  }
);

  startPostMonitoring();

  alert(
    "Clock In Successful"
  );  

renderMyAttendanceStatus();
renderMySchedule();

  document.getElementById(
    "clockEmployee"
  ).value = "";

  if (
    photoInput
  ) {
    photoInput.value =
      "";
  }

  const preview =
    document.getElementById(
      "preShiftPreview"
    );

  if (preview) {
    preview.src = "";
    preview.style.display =
      "none";
  }
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

${entry.clockIn
        ? entry.clockIn
          .toDate()
          .toLocaleTimeString()
        : "Unknown"
      }

<br><br>

${entry.preShiftPhoto
        ? `
      <button
        class="btn btn-sm btn-primary"
        onclick="viewPreShiftPhoto('${entry.id}')"
      >
        View Uniform Photo
      </button>
    `
        : `
      <span style="color:#94a3b8;">
        No Uniform Photo
      </span>
    `
      }

      </div>

    `).join("");

}

async function clockOut() {

  let postShiftPhoto =
    null;

  const photoInput =
    document.getElementById(
      "postShiftPhoto"
    );

  if (
    photoInput &&
    photoInput.files.length
  ) {
    postShiftPhoto =
      await fileToBase64(
        photoInput.files[0]
      );
  }

  if (!currentOfficer) {

    alert(
      "Officer session not found."
    );

    return;
  }

  const employeeId =
    currentOfficer.id;

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

    await logActivity(
  activeEntry.siteId,
  "gpsViolation",
  `${activeEntry.employeeName} clocked out outside assigned geofence.`,
  activeEntry.employeeName,
  "site",
  {
    siteName: activeEntry.siteName,
    employeeId: activeEntry.employeeId,
    officerName: activeEntry.employeeName,
    distanceMeters: Math.round(distance),
    distanceFeet: Math.round(distance * 3.28084)
  }
);

  }

  const clockOutTime =
    new Date();

  const clockInTime =
    activeEntry.clockIn?.toDate
      ? activeEntry.clockIn.toDate()
      : new Date(activeEntry.clockIn);

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
    serverTimestamp(),

      hoursWorked:
        Number(hoursWorked),

      status:
        "Clocked Out",

      postShiftPhoto:
        postShiftPhoto
          ? {
            imageBase64:
              postShiftPhoto,
            timestamp:
              serverTimestamp(),
            lat:
              latitude,
            lng:
              longitude
          }
          : null,
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

    renderMyAttendanceStatus();
    renderMySchedule();

  }

  if (photoInput) {
    photoInput.value = "";
  }

  const preview =
    document.getElementById(
      "postShiftPreview"
    );

  if (preview) {
    preview.src = "";
    preview.style.display =
      "none";
  }

  refreshSupervisorDashboard();

}


async function refreshSupervisorDashboard() {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
  timeEntries = attendance;

  const schedules = scheduleSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  let onDuty = 0;
  let clockedOut = 0;
  let activeViolations = 0;
  let criticalCompliance = 0;

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
    if (
      entry.status === "Clocked In" &&
      (entry.gpsViolationCount || 0) >= 4
    ) {
      criticalCompliance++;
    }

  });

  document.getElementById("onDutyCount").textContent = onDuty;
  document.getElementById("clockedOutCount").textContent = clockedOut;

  document.getElementById(
    "activeViolationsCount"
  ).textContent = activeViolations;

  document.getElementById(
    "criticalComplianceCount"
  ).textContent =
    criticalCompliance;

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
<th>Violations</th>
<th>Level</th>
    </tr>
  </thead>
  <tbody>
`;

  attendance.forEach(entry => {
    const rowClass =

      entry.status === "Clocked In" &&
        entry.currentlyInsideGeofence === false

        ? "violation-row"

        : "";

    const escalationLevel =
      getEscalationLevel(
        entry.gpsViolationCount || 0
      );   

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
    <tr class="${rowClass}">
      <td>${entry.employeeName || "-"}</td>
      <td>${entry.siteName || "-"}</td>
      <td>${entry.status || "-"}</td>
      <td>${clockInTime}</td>
      <td>${clockOutTime}</td>
      <td>${entry.hoursWorked || "-"}</td>

<td>
  ${entry.gpsViolationCount || 0}
</td>

<td>
  <span
    class="${getEscalationClass(
      entry.gpsViolationCount || 0
    )}"
  >
    ${getEscalationLevel(
      entry.gpsViolationCount || 0
    )}
  </span>
</td>
    </tr>
  `;
  });

  html += `
  </tbody>
</table>
  </div>
</div>
`;
  
  document.getElementById("attendanceRoster").innerHTML = html;
  renderComplianceFeed();

  if (typeof renderMyAttendanceStatus === "function") {
    renderMyAttendanceStatus();
  }
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

 const snapshot =
  await getDocs(
    query(
      collection(db, "timeEntries"),
      where(
        "tenantId",
        "==",
        window.currentUserProfile.tenantId
      )
    )
  );

  const activeEntries =
    snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(
        entry =>
          entry.status === "Clocked In"
      );

  if (!activeEntries.length) {

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

     await logActivity(
  entry.siteId,
  "Post Abandonment",
  `Left post at ${entry.siteName}`,
  entry.employeeName,
  "site",
  {
    siteName: entry.siteName,
    employeeId: entry.employeeId,
    officerName: entry.employeeName,
    distanceMeters: Math.round(distance),
    distanceFeet: Math.round(distance * 3.28084)
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
        typeof updateMap ===
        "function"
      ) {
        updateMap();
      }

      showDashboard();

      flyToViolationSite(
        entry.siteId
      );

      const violationAudio =
        new Audio(
          "assets/gps-violation.mp3"
        );

      violationAudio.play();

      if (
        typeof refreshSupervisorDashboard ===
        "function"
      ) {
        refreshSupervisorDashboard();
      }     

    }

    // RETURNED TO POST

    else if (
      isInsideGeofence &&
      entry.currentlyInsideGeofence === false
    ) {

     await logActivity(
  entry.siteId,
  "Returned To Post",
  `Returned to ${entry.siteName}`,
  entry.employeeName,
  "site",
  {
    siteName: entry.siteName,
    employeeId: entry.employeeId,
    officerName: entry.employeeName
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

       

      }
      else {

        

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

function flyToViolationSite(
  siteId
) {

  const mapElement =
    document.getElementById(
      "map"
    );

  if (mapElement) {

    mapElement.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }

  const site =
    sites.find(
      s => s.id === siteId
    );

  if (!site) {

    console.error(
      "Violation site not found:",
      siteId
    );

    return;
  }

  map.flyTo(
    [
      site.lat,
      site.lng
    ],
    17,
    {
      duration: 1.5
    }
  );

  setTimeout(() => {

    const marker =
      markers[siteId];

    if (marker) {

      marker.openPopup();

    }

  }, 1600);

}

function renderComplianceFeed() {

  const feed =
    document.getElementById(
      "complianceFeed"
    );

  if (!feed) return;

  const complianceLogs =
    activityLogs
      .filter(log =>

        log.type ===
        "Post Abandonment"

        ||

        log.type ===
        "Returned To Post"

      )

      .sort(
        (a, b) =>

          (b.timestamp?.seconds || 0)

          -

          (a.timestamp?.seconds || 0)
      )

      .slice(0, 25);

  if (!complianceLogs.length) {

    feed.innerHTML =
      `
        <div class="activity-item">
          No compliance events.
        </div>
      `;

    return;
  }

  feed.innerHTML =
    complianceLogs
      .map(log => {

        const time =
          log.timestamp?.toDate
            ? log.timestamp
              .toDate()
              .toLocaleTimeString()
            : "";

        const icon =
          log.type ===
            "Post Abandonment"

            ? "🚨"

            : "✅";

        return `
          <div class="activity-item">

            <strong>
              ${icon}
              ${log.employeeName || ""}
            </strong>

            <br>

            ${log.description ||

          (
            log.type === "Post Abandonment"
              ? `Left post at ${log.siteName || "Unknown Site"}`
              : `Returned to ${log.siteName || "Unknown Site"}`
          )
          }

            <br>

            <small>
              ${time}
            </small>

          </div>
        `;

      })
      .join("");
}

function getEscalationLevel(
  violationCount
) {

  if (violationCount >= 4) {
    return "Critical";
  }

  if (violationCount >= 2) {
    return "Elevated";
  }

  if (violationCount >= 1) {
    return "Warning";
  }

  return "Compliant";
}

function getEscalationClass(
  violationCount
) {

  if (violationCount >= 4) {
    return "escalation-critical";
  }

  if (violationCount >= 2) {
    return "escalation-elevated";
  }

  if (violationCount >= 1) {
    return "escalation-warning";
  }

  return "escalation-compliant";
}

function renderMySchedule() {

  const container =
    document.getElementById(
      "mySchedule"
    );

  if (
    !container ||
    !currentOfficer
  ) return;

  const today = new Date();
today.setHours(0, 0, 0, 0);

const weekEnd = new Date(today);
weekEnd.setDate(weekEnd.getDate() + 7);

currentOfficerShifts =
    shifts
        .filter(shift => {

            if (
                shift.employeeId !==
                currentOfficer.id
            ) {
                return false;
            }

            const shiftDate =
                new Date(shift.startTime);

            return (
                shiftDate >= today &&
                shiftDate < weekEnd
            );

        })
        .sort(
            (a, b) =>
                new Date(a.startTime) -
                new Date(b.startTime)
        );

  if (!currentOfficerShifts.length) {

    container.innerHTML =
      "No scheduled shifts.";

    return;

  }

  container.innerHTML =
    currentOfficerShifts.map(
      shift => `

        <div
          style="
            padding:10px;
            margin-bottom:10px;
            border:1px solid #ddd;
            border-radius:8px;
          "
        >

          <strong>
            ${shift.siteName}
          </strong>

          <br>

          ${new Date(
        shift.startTime
      ).toLocaleString()}

          <br>

          to

          <br>

          ${new Date(
        shift.endTime
      ).toLocaleString()}          

<br>

Pay:
$${Number(
        shift.shiftPay || 0
      ).toFixed(2)}

<br>

License Level:
${currentOfficer.securityLevel || "N/A"}

          Status:
${shift.status}

        </div>

      `
    ).join("");
    updatePortalWelcome();

}

function renderMySite() {

  const container =
    document.getElementById(
      "mySite"
    );

  if (
    !container ||
    !currentOfficer
  ) return;

const siteId =
  getCurrentOfficerSiteId();
  

if (!siteId) {

  container.innerHTML =
    "<p>No site assigned.</p>";

  return;

}

  const site = sites.find(
    s => s.id === siteId
  );

  
  if (!site) {

    container.innerHTML =
      "<p>No site assigned.</p>";

    return;
  }

  container.innerHTML = `

    <strong>
      ${site.name}
    </strong>

    <br><br>

    ${site.address}

    <br>

    ${site.city},
    ${site.state}
    ${site.zip}

    <br><br>

    Category:
    ${site.siteCategory}

    <br>

    Geofence:
    ${site.geofenceRadius} ft

  `;

}

function getCurrentOfficerSiteId() {

  if (!currentOfficer) return null;

  const activeEntry = timeEntries.find(
    entry =>
      entry.employeeId === currentOfficer.id &&
      entry.status === "Clocked In"
  );

  if (activeEntry) {
    return activeEntry.siteId;
  }

  const now = new Date();

  const currentShift = shifts.find(
    shift =>
      shift.employeeId === currentOfficer.id &&
      new Date(shift.startTime) <= now &&
      new Date(shift.endTime) >= now
  );

  return currentShift?.siteId || null;

}

function renderMyPatrols() {

  const container =
    document.getElementById(
      "myPatrolsList"
    );

  if (
    !container ||
    !currentOfficer
  ) return;

  const activeEntry = timeEntries.find(
    entry =>
      entry.employeeId === currentOfficer.id &&
      entry.status === "Clocked In"
  );

  let siteId = null;

  if (activeEntry) {

    siteId = activeEntry.siteId;

  } else {

    const now = new Date();

    const currentShift =
      shifts.find(
        shift =>
          shift.employeeId === currentOfficer.id &&
          new Date(shift.startTime) <= now &&
          new Date(shift.endTime) >= now
      );

    if (!currentShift) {

      container.innerHTML =
        "<p>No patrols available.</p>";

      return;

    }

    siteId = currentShift.siteId;

  }

  const sitePatrols =
    patrolTemplates.filter(
      patrol =>
        patrol.siteId === siteId
    );

  if (!sitePatrols.length) {

    container.innerHTML =
      "<p>No patrol routes assigned to this site.</p>";

    return;

  }

  container.innerHTML =
    sitePatrols.map(
      patrol => {

        const checkpointCount =
          checkpoints.filter(
            cp =>
              cp.patrolId === patrol.id
          ).length;

        return `

          <div class="patrol-card">

            <h3>
              ${patrol.name}
            </h3>

            <p>
              ${checkpointCount}
              Checkpoints
            </p>

            <button
              onclick="startPatrol('${patrol.id}')"
            >
              Start Patrol
            </button>

          </div>

        `;

      }
    ).join("");

}

function renderMyAttendanceStatus() {

  const container =
    document.getElementById(
      "myAttendanceStatus"
    );

  if (
    !container ||
    !currentOfficer
  ) return;

  const myEntries =
    timeEntries
      .filter(
        entry =>
          entry.employeeId ===
          currentOfficer.id
      )
      .sort((a, b) => {

        const aTime =
          a.clockIn?.toDate
            ? a.clockIn.toDate()
            : new Date(a.clockIn || 0);

        const bTime =
          b.clockIn?.toDate
            ? b.clockIn.toDate()
            : new Date(b.clockIn || 0);

        return bTime - aTime;

      });

  if (!myEntries.length) {

    container.innerHTML =
      "No attendance records found.";

    return;

  }

  const latest =
    myEntries[0];

  const status =
    latest.status ||
    "Unknown";

  const clockInTime =
    latest.clockIn
      ? (
        latest.clockIn.toDate
          ? latest.clockIn.toDate()
          : new Date(latest.clockIn)
      ).toLocaleTimeString()
      : "-";

  let displayHours = 0;

  if (latest.status === "Clocked In") {

    const clockInDate =
      latest.clockIn?.toDate
        ? latest.clockIn.toDate()
        : new Date(latest.clockIn);

    displayHours =
      (
        (new Date() - clockInDate)
        / 1000
        / 60
        / 60
      ).toFixed(2);

  }
  else {

    displayHours =
      latest.hoursWorked || 0;

  }

  container.innerHTML = `

    <div>

      <strong>
        Status:
      </strong>

      ${status === "Clocked In"
      ? "🟢 Clocked In"
      : "⚪ Clocked Out"
    }

      <br><br>

      <strong>
        Site:
      </strong>

      ${latest.siteName || "-"}

      <br><br>

      <strong>
        Clock In:
      </strong>

      ${clockInTime}

      <br><br>

      <strong>
        Hours Worked:
      </strong>

      ${displayHours}

      <br><br>

      <strong>
        Compliance:
      </strong>

      ${getEscalationLevel(
      latest.gpsViolationCount || 0
    )}

    </div>

  `;

}

async function submitActivityReport() {

  if (!currentOfficer) {

    alert(
      "Officer session not found."
    );

    return;

  }

  const activityType =
    document.getElementById(
      "activityType"
    ).value;

  const description =
    document.getElementById(
      "activityDescription"
    ).value
      .trim();

  if (
    !activityType ||
    !description
  ) {

    alert(
      "Complete all fields."
    );

    return;

  }

  const activeEntry =
    timeEntries.find(
      entry =>
        entry.employeeId ===
        currentOfficer.id &&
        entry.status ===
        "Clocked In"
    );

  if (!activeEntry) {

    alert(
      "You must be clocked in."
    );

    return;

  }

await addDoc(
  collection(
    db,
    "activityReports"
  ),
  {
    tenantId:
      window.currentUserProfile.tenantId,

    officerId:
      currentOfficer.id,

    officerName:
      currentOfficer.name,

    siteId:
      activeEntry.siteId,

    siteName:
      activeEntry.siteName,

    activityType,

    description,

    timestamp:
      serverTimestamp()
  }
);

  await logActivity(
  activeEntry.siteId,
  "Activity Report",
  `${activityType}: ${description}`,
  currentOfficer.name,
  "site",
  {
    siteName: activeEntry.siteName,
    employeeId: currentOfficer.id,
    officerName: currentOfficer.name
  }
);
  alert(
    "Activity Report Submitted"
  );

  document.getElementById(
    "activityType"
  ).value = "";

  document.getElementById(
    "activityDescription"
  ).value = ""; 

}

window.addPerson = function () {

  const container =
    document.getElementById(
      "personsContainer"
    );

  const personNumber =
    container.children.length + 1;

  container.insertAdjacentHTML(
    "beforeend",

    `
<div class="dashboard-card person-card">

  <h3>
    Person ${personNumber}
  </h3>

  <button
    type="button"
    onclick="this.parentElement.remove()"
  >
    Remove Person
  </button>

  <div class="person-grid">

<div class="field-group">

  <label>Role</label>

  <select
  class="personRole"
  required
>

  <option
    value=""
    selected
    disabled
  >
    Select Role
  </option>

  <option>
    Reporting Party
  </option>

  <option>
    Complainant
  </option>

  <option>
    Property Owner
  </option>

  <option>
    Employee
  </option>

  <option>
    Contractor
  </option>

  <option>
    Visitor
  </option>

  <option>
    Witness
  </option>

  <option>
    Victim
  </option>

  <option>
    Suspect
  </option>

  <option>
    Other
  </option>

</select>
</div>

<div class="field-group">
  <input
    class="personFirstName"
    placeholder="First Name"
  >
  </div>

<div class="field-group">
  <input
    class="personMiddleName"
    placeholder="Middle Name"
  >
  </div>

  <div class="field-group">
  <input
    class="personLastName"
    placeholder="Last Name"
  >
  </div>

  <div class="field-group">

  <label>
    Alias / Nickname
  </label>

  <input
    class="personAlias"
    placeholder="Alias / Nickname"
  >

</div>

  <div class="field-group">
  <input
    type="date"
    class="personDOB"
  >
  </div>

  <div class="field-group">
  <select class="personSex">

    <option value="">
      Sex
    </option>

    <option>Male</option>
    <option>Female</option>

  </select>
  </div>

  <div class="field-group">

  <label>
    Feet
  </label>

  <input
    class="personHeightFeet"
    placeholder="5"
  >

</div>

<div class="field-group">

  <label>
    Inches
  </label>

  <input
    class="personHeightInches"
    placeholder="11"
  >

</div>

  <div class="field-group">
  <input
    class="personWeight"
    placeholder="Weight"
  >
  </div>

  <div class="field-group">

  <label>
    Race
  </label>

  <select class="personRace">

    <option value="">
      Select Race
    </option>

    <option>American Indian / Alaska Native</option>
    <option>Asian</option>
    <option>Black / African American</option>
    <option>Native Hawaiian / Pacific Islander</option>
    <option>White</option>
    <option>Other</option>
    <option>Unknown</option>

  </select>

</div>

<div class="field-group">

  <label>
    Ethnicity
  </label>

  <select class="personEthnicity">

    <option value="">
      Select Ethnicity
    </option>

    <option>Hispanic or Latino</option>
    <option>Not Hispanic or Latino</option>
    <option>Unknown</option>

  </select>

</div>

  <div class="field-group">
  <input
    class="personHairColor"
    placeholder="Hair Color"
  >
  </div>

  <div class="field-group">
  <input
    class="personEyeColor"
    placeholder="Eye Color"
  >
  </div>

  <div class="field-group">
  <select class="personIdType">

    <option value="">
      Identification Type
    </option>

    <option>
      Driver License
    </option>

    <option>
      State ID
    </option>

    <option>
      None
    </option>

  </select>
  </div>

  <div class="field-group">
  <select class="personIdState">

  <option value="">State</option>

  <option>AL</option>
  <option>AK</option>
  <option>AZ</option>
  <option>AR</option>
  <option>CA</option>
  <option>CO</option>
  <option>CT</option>
  <option>DE</option>
  <option>FL</option>
  <option>GA</option>
  <option>HI</option>
  <option>ID</option>
  <option>IL</option>
  <option>IN</option>
  <option>IA</option>
  <option>KS</option>
  <option>KY</option>
  <option>LA</option>
  <option>ME</option>
  <option>MD</option>
  <option>MA</option>
  <option>MI</option>
  <option>MN</option>
  <option>MS</option>
  <option>MO</option>
  <option>MT</option>
  <option>NE</option>
  <option>NV</option>
  <option>NH</option>
  <option>NJ</option>
  <option>NM</option>
  <option>NY</option>
  <option>NC</option>
  <option>ND</option>
  <option>OH</option>
  <option>OK</option>
  <option>OR</option>
  <option>PA</option>
  <option>RI</option>
  <option>SC</option>
  <option>SD</option>
  <option>TN</option>
  <option>TX</option>
  <option>UT</option>
  <option>VT</option>
  <option>VA</option>
  <option>WA</option>
  <option>WV</option>
  <option>WI</option>
  <option>WY</option>

</select>
</div>

<div class="field-group">
  <input
    class="personIdNumber"
    placeholder="ID Number"
  >
  </div>

  <div class="field-group">
  <input
    class="personHomePhone"
    placeholder="Home Phone"
  >
  </div>

  <div class="field-group">
  <input
    class="personCellPhone"
    placeholder="Cell Phone"
  >
  </div>

  <div class="field-group">
  <input
    class="personWorkPhone"
    placeholder="Work Phone"
  >
  </div>
  
  <div class="field-group">

  <label>
    Street Address
  </label>

  <input
    class="personStreet"
    placeholder="Street Address"
  >

</div>

<div class="field-group">

  <label>
    City
  </label>

  <input
    class="personCity"
    placeholder="City"
  >

</div>

<div class="field-group">

  <label>
    State
  </label>

  <select class="personAddressState">

    <option value="">
      State
    </option>

    <option>AL</option>
  <option>AK</option>
  <option>AZ</option>
  <option>AR</option>
  <option>CA</option>
  <option>CO</option>
  <option>CT</option>
  <option>DE</option>
  <option>FL</option>
  <option>GA</option>
  <option>HI</option>
  <option>ID</option>
  <option>IL</option>
  <option>IN</option>
  <option>IA</option>
  <option>KS</option>
  <option>KY</option>
  <option>LA</option>
  <option>ME</option>
  <option>MD</option>
  <option>MA</option>
  <option>MI</option>
  <option>MN</option>
  <option>MS</option>
  <option>MO</option>
  <option>MT</option>
  <option>NE</option>
  <option>NV</option>
  <option>NH</option>
  <option>NJ</option>
  <option>NM</option>
  <option>NY</option>
  <option>NC</option>
  <option>ND</option>
  <option>OH</option>
  <option>OK</option>
  <option>OR</option>
  <option>PA</option>
  <option>RI</option>
  <option>SC</option>
  <option>SD</option>
  <option>TN</option>
  <option>TX</option>
  <option>UT</option>
  <option>VT</option>
  <option>VA</option>
  <option>WA</option>
  <option>WV</option>
  <option>WI</option>
  <option>WY</option>

  </select>

</div>

<div class="field-group">

  <label>
    ZIP Code
  </label>

  <input
    class="personZip"
    placeholder="ZIP Code"
  >

</div>

<div class="field-group">

  <label>
    Employer / School
  </label>

  <input
    class="personEmployer"
    placeholder="Employer / School"
  >

</div>

<div class="field-group">

  <label>
    Email Address
  </label>

  <input
    type="email"
    class="personEmail"
    placeholder="Email Address"
  >

</div>

<div class="field-group">

  <label>
    Preferred Contact
  </label>

  <select class="personPreferredContact">

    <option value="">
      Select Method
    </option>

    <option>Cell Phone</option>
    <option>Home Phone</option>
    <option>Work Phone</option>
    <option>Email</option>

  </select>

</div>
</div>
`
  );

};

window.submitIncidentReport =
  async function () {

    try {

      const incidentData =
        collectIncidentData();      

      if (
        !incidentData.incidentType ||
        !incidentData.narrative
      ) {
        alert(
          "Please complete all required fields."
        );


        return;
      }

      const editingId =
        document.getElementById(
          "editingIncidentId"
        ).value;

      let caseNumber = null;

      //
      // EXISTING DRAFT
      //
      if (editingId) {

        const incidentSnap =
          await getDoc(
            doc(
              db,
              "incidentReports",
              editingId
            )
          );

        const existingIncident =
          incidentSnap.data();

        if (existingIncident.caseNumber) {

  caseNumber =
    existingIncident.caseNumber;

} else {

  const caseNumberResult =
    await generateIncidentCaseNumber();

  if (!caseNumberResult.success) {

    throw new Error(
      caseNumberResult.message
    );

  }

  caseNumber =
    caseNumberResult.caseNumber;

}

        await updateDoc(
          doc(
            db,
            "incidentReports",
            editingId
          ),
          {
            ...incidentData,

            caseNumber,

            status:
              "submitted",

            lastEdited:
              serverTimestamp(),

            submittedAt:
              serverTimestamp()
          }
        );

        await addReviewHistory(
          editingId,
          "submit"
        );

        //
        // SAVE ATTACHMENTS
        //    

          const photos =
  await uploadIncidentPhotos(
    editingId
  );

const result =
  await saveIncidentAttachments(
    editingId,
    photos
  );

if (!result.success) {

  throw new Error(
    result.message
  );

}

      }

      //
      // BRAND NEW REPORT
      //
      else {

        const caseNumberResult =
  await generateIncidentCaseNumber();

if (!caseNumberResult.success) {

  throw new Error(
    caseNumberResult.message
  );

}

caseNumber =
  caseNumberResult.caseNumber;

        const docRef =
          await addDoc(
            collection(
              db,
              "incidentReports"
            ),
            {
              ...incidentData,

              caseNumber,

              status:
                "submitted",

              createdAt:
                serverTimestamp(),

              lastEdited:
                serverTimestamp(),

              submittedAt:
                serverTimestamp(),

              approvedAt: null,
              approvedBy: null,
              approvedByName: null,

              returnedAt: null,
              returnedBy: null,
              returnedByName: null,
              returnComments: "",

              voidedAt: null,
              voidedBy: null,
              voidedByName: null,
              voidReason: "",

              reviewHistory: []
            }
          );

        //
        // SAVE ATTACHMENTS
        //
        const photos =
          await uploadIncidentPhotos(
            docRef.id
          );

       const result =
  await saveIncidentAttachments(
    docRef.id,
    photos
  );

if (!result.success) {

  throw new Error(
    result.message
  );

}

        await addReviewHistory(
          docRef.id,
          "submit"
        );
      }

      //
      // ACTIVITY LOG
      //
      await logActivity(
  incidentData.siteId,
  "Incident Report",
  `Incident ${caseNumber} submitted`,
  currentOfficer?.name || "System",
  "site",
  {
    siteName: incidentData.siteName,
    employeeId: currentOfficer?.id,
    officerName: currentOfficer?.name
  }
);

      alert(
        `Incident ${caseNumber} submitted successfully.`
      );

      clearIncidentPhotos();

      document.getElementById(
        "editingIncidentId"
      ).value = "";

      document.getElementById(
        "incidentType"
      ).value = "";

      document.getElementById(
        "incidentSeverity"
      ).selectedIndex = 0;

      document.getElementById(
        "incidentNarrative"
      ).value = "";

      document.getElementById(
        "personsContainer"
      ).innerHTML = "";

      document.getElementById(
        "vehiclesContainer"
      ).innerHTML = "";

      document.getElementById(
        "incidentAgency"
      ).value = "";

      document.getElementById(
        "incidentAgencyOfficer"
      ).value = "";

      document.getElementById(
        "incidentAgencyBadge"
      ).value = "";

      document.getElementById(
        "incidentAgencyCase"
      ).value = "";

    } catch (error) {

      console.error(
        "Incident Save Error:",
        error
      );

      alert(
        "Unable to save incident report."
      );
    }
  };

function collectIncidentData() {

  const incidentType =
    document.getElementById(
      "incidentType"
    ).value;

  const severity =
    document.getElementById(
      "incidentSeverity"
    ).value;

  const narrative =
    document.getElementById(
      "incidentNarrative"
    ).value.trim();

  if (!currentOfficer) {
    throw new Error(
      "Officer not found."
    );
  }

  let siteId = null;

  const activeEntry =
    timeEntries.find(
      entry =>
        entry.employeeId ===
        currentOfficer.id &&
        entry.status ===
        "Clocked In"
    );

  if (activeEntry) {

    siteId =
      activeEntry.siteId;

  } else {

    const now =
      new Date();

    const currentShift =
      shifts.find(
        shift =>
          shift.employeeId ===
          currentOfficer.id &&
          new Date(
            shift.startTime
          ) <= now &&
          new Date(
            shift.endTime
          ) >= now
      );

    if (currentShift) {
      siteId =
        currentShift.siteId;
    }
  }

  const site =
    sites.find(
      s => s.id === siteId
    );

  const persons = [];

  document
    .querySelectorAll(
      ".person-card"
    )
    .forEach(card => {

      persons.push({

        role:
          card.querySelector(
            ".personRole"
          )?.value || "",

        firstName:
          card.querySelector(
            ".personFirstName"
          )?.value || "",

        middleName:
          card.querySelector(
            ".personMiddleName"
          )?.value || "",

        lastName:
          card.querySelector(
            ".personLastName"
          )?.value || "",

        alias:
          card.querySelector(
            ".personAlias"
          )?.value || "",

        dob:
          card.querySelector(
            ".personDOB"
          )?.value || "",

        sex:
          card.querySelector(
            ".personSex"
          )?.value || "",

        heightFeet:
          card.querySelector(
            ".personHeightFeet"
          )?.value || "",

        heightInches:
          card.querySelector(
            ".personHeightInches"
          )?.value || "",

        weight:
          card.querySelector(
            ".personWeight"
          )?.value || "",

        race:
          card.querySelector(
            ".personRace"
          )?.value || "",

        ethnicity:
          card.querySelector(
            ".personEthnicity"
          )?.value || "",

        hairColor:
          card.querySelector(
            ".personHairColor"
          )?.value || "",

        eyeColor:
          card.querySelector(
            ".personEyeColor"
          )?.value || "",

        idType:
          card.querySelector(
            ".personIdType"
          )?.value || "",

        idState:
          card.querySelector(
            ".personIdState"
          )?.value || "",

        idNumber:
          card.querySelector(
            ".personIdNumber"
          )?.value || "",

        homePhone:
          card.querySelector(
            ".personHomePhone"
          )?.value || "",

        cellPhone:
          card.querySelector(
            ".personCellPhone"
          )?.value || "",

        workPhone:
          card.querySelector(
            ".personWorkPhone"
          )?.value || "",

        street:
          card.querySelector(
            ".personStreet"
          )?.value || "",

        city:
          card.querySelector(
            ".personCity"
          )?.value || "",

        addressState:
          card.querySelector(
            ".personAddressState"
          )?.value || "",

        zip:
          card.querySelector(
            ".personZip"
          )?.value || "",

        employer:
          card.querySelector(
            ".personEmployer"
          )?.value || "",

        email:
          card.querySelector(
            ".personEmail"
          )?.value || "",

        preferredContact:
          card.querySelector(
            ".personPreferredContact"
          )?.value || ""

      });

    });

  const vehicles =
    window.incidentVehicles || []; 

  return {

    incidentType,
    severity,
    narrative,

    officerId:
      currentOfficer.id,

    officerName:
      currentOfficer.name,

    siteId:
      site?.id || "",

    siteName:
      site?.name || "",

    persons,

    vehicles:
      vehicles,

    lawEnforcement: {
      agency:
        document.getElementById(
          "incidentAgency"
        ).value.trim(),

      officer:
        document.getElementById(
          "incidentAgencyOfficer"
        ).value.trim(),

      badge:
        document.getElementById(
          "incidentAgencyBadge"
        ).value.trim(),

      caseNumber:
        document.getElementById(
          "incidentAgencyCase"
        ).value.trim()
    }
  };

}

window.saveIncidentDraft =
  async function () {

    try {

      const incidentData =
        collectIncidentData();

      const editingId =
        document.getElementById(
          "editingIncidentId"
        ).value;

      const result =
        await saveIncidentDraftRecord(
          editingId,
          incidentData
        );

      if (!result.success) {

        throw new Error(
          result.message
        );

      }

      const incidentId =
        result.incidentId;

      if (!editingId) {

        document.getElementById(
          "editingIncidentId"
        ).value =
          incidentId;

      }

      const photos =
        await uploadIncidentPhotos(
          incidentId
        );

      const attachmentResult =
        await saveIncidentAttachments(
          incidentId,
          photos
        );

      if (!attachmentResult.success) {

        throw new Error(
          attachmentResult.message
        );

      }

      alert(
        "Draft saved."
      );

      clearIncidentPhotos();

    } catch (error) {

      console.error(
        "Draft Save Error:",
        error
      );

      alert(
        error.message ||
        "Unable to save draft."
      );

    }

  };

async function loadIncidentReports() {

  const container =
    document.getElementById(
      "incidentReportsList"
    );

  if (!container) return;

  container.innerHTML =
    "<p>Loading...</p>";

  try {

   const result =
  await loadIncidentReportsData();

if (!result.success) {

  container.innerHTML =
    `<p>${result.message}</p>`;

  return;

}

incidentReports =
  result.incidentReports;

if (!incidentReports.length) {

  container.innerHTML =
    "<p>No incident reports found.</p>";

  return;

}
    container.innerHTML =
  incidentReports
       .map(incident => {

          const created =
            incident.createdAt?.toDate
              ? incident.createdAt
                .toDate()
                .toLocaleString()
              : "Pending";

          return `

        <div
          class="dashboard-card"
          style="
            margin-bottom:12px;
          "
        >

          <strong>
            ${incident.caseNumber}
          </strong>

          <br>

          Type:
          ${incident.incidentType}

          <br>

          Severity:
          ${incident.severity}

          <br>

          Officer:
          ${incident.officerName}

          <br>

          Site:
          ${incident.siteName}

          <br>

          Status:
            ${getIncidentStatusBadge(
            incident.status
          )}

          <br>

          Created:
          ${created}

          <br><br>

<button
  onclick="viewIncident('${incident.id}')"
>
  View
</button>

        </div>

      `;

        })
        .join("");

  } catch (error) {

    console.error(
      "Error loading incidents:",
      error
    );

    container.innerHTML =
      "<p>Error loading incident reports.</p>";

  }

}

window.closeIncidentModal =
  function () {

    document
      .getElementById(
        "viewIncidentModal"
      )
      .classList.add(
        "hidden"
      );

  };

function getIncidentStatusBadge(
  status
) {
  switch (status) {
    case "draft":
      return "⚪ Draft";

    case "submitted":
      return "🔵 Submitted";

    case "approved":
      return "🟢 Approved";

    case "returned":
      return "🟠 Returned";

    case "voided":
      return "🔴 Voided";

    default:
      return status || "";
  }

  const comments =
    document.getElementById(
      "supervisorComments"
    );

  if (comments) {
    comments.value = "";
  }
}

window.viewIncident =
  async function (id) {
    

    currentIncidentId = id;

    const snap =
      await getDoc(
        doc(
          db,
          "incidentReports",
          id
        )
      );
    

    if (!snap.exists()) return;

    const incident =
      snap.data();

    incident.id = id;
    window.currentIncident = incident;

    await renderIncidentViewer(
      incident
    );

    document.getElementById(
      "historyBtn"
    ).onclick = function () {
      viewReviewHistory(id);
    };

    renderIncidentActionButtons();

    document
      .getElementById(
        "viewIncidentModal"
      )
      .classList.remove(
        "hidden"
      );
  };

function renderIncidentActionButtons() {

  const container =
    document.getElementById(
      "incidentActionButtons"
    );

  if (
    !container ||
    !window.currentIncident
  ) {
    return;
  }

  const incident =
    window.currentIncident;

  const isSupervisor =
  currentEmployee &&
  currentEmployee.role !== "Officer";

  let html = `
  <button
    onclick="closeIncidentModal()"
  >
    Close
  </button>

  <button
    id="historyBtn"
    class="btn btn-secondary"
  >
    History
  </button>
`;

  //
  // Officer buttons
  //
  if (!isSupervisor) {

    html += `
      <button
        class="btn btn-secondary"
        onclick="openSupplementModal()"
      >
        ➕ Create Supplement
      </button>
    `;
  }

  //
  // Supervisor buttons
  //
  if (isSupervisor) {

    switch (
    incident.status
    ) {

      case "submitted":

        html += `

        
          <button
            onclick="
              approveIncident(
                '${incident.id}'
              )
            "
          >
            ✅ Approve
          </button>
        `;

        html += `
          <button
            onclick="
              returnIncident(
                '${incident.id}'
              )
            "
          >
            🟠 Return
          </button>
        `;

        html += `
          <button
            onclick="
              voidIncident(
                '${incident.id}'
              )
            "
          >
            🔴 Void
          </button>
        `;

        break;

      case "approved":

        html += `
          <button disabled>
            ✅ Approved
          </button>
        `;

        break;

      case "returned":

        html += `
          <button disabled>
            🟠 Returned
          </button>
        `;

        html += `
          <button
            onclick="
              approveIncident(
                '${incident.id}'
              )
            "
          >
            ✅ Approve
          </button>
        `;

        html += `
          <button
            onclick="
              voidIncident(
                '${incident.id}'
              )
            "
          >
            🔴 Void
          </button>
        `;

        break;

      case "voided":

        html += `
          <button disabled>
            🔴 Voided
          </button>
        `;

        break;
    }
  }

  html += `
    <button
      onclick="
        downloadIncidentPdf()
      "
    >
      📄 Download PDF
    </button>
  `;

  container.innerHTML =
    html;

  document.getElementById(
    "historyBtn"
  ).onclick = function () {
    viewReviewHistory(
      incident.id
    );
  };
}

async function renderIncidentViewer(
  incident
) {

  const container =
    document.getElementById(
      "incidentViewerContent"
    );

  const law =
    incident.lawEnforcement || {};

  container.innerHTML = `

      <p>
      <strong>
        Case Number:
      </strong>
      ${incident.caseNumber}
    </p>

    <p>
      <strong>
        Incident Type:
      </strong>
      ${incident.incidentType}
    </p>

    <p>
      <strong>
        Severity:
      </strong>
      ${incident.severity}
    </p>

    <p>
      <strong>
        Officer:
      </strong>
      ${incident.officerName}
    </p>

    <p>
      <strong>
        Site:
      </strong>
      ${incident.siteName}
    </p>

    <p>
      <strong>
        Status:
      </strong>
      ${incident.status}
    </p>

    <hr>

<h3>
  Narrative
</h3>

<p>
  ${incident.narrative}
</p>

<hr>

<h3>
  Persons Involved
</h3>

${incident.persons &&
      incident.persons.length

      ? incident.persons.map(
        person => `

        <div class="person-card">

          <p>
            <strong>Role:</strong>
            ${person.role || ""}
          </p>
        
        <p>
  <strong>Name:</strong>
  ${[
            person.firstName,
            person.middleName,
            person.lastName
          ]
            .filter(Boolean)
            .join(" ")}
</p>

          <p>
            <strong>DOB:</strong>
            ${person.dob || ""}
          </p>

          <p>
  <strong>Phone:</strong>
  ${person.cellPhone ||
          person.homePhone ||
          person.workPhone ||
          ""
          }
</p>          

          <p>
  <strong>Address:</strong>
  ${[
            person.street,
            person.city,
            person.state,
            person.zip
          ]
            .filter(Boolean)
            .join(", ")}
</p>

        </div>

      `
      ).join("")

      : "<p>No persons listed.</p>"
    }

${law.agency ||
      law.officer ||
      law.badge ||
      law.caseNumber

      ? `

    <hr>
  <h4>🚔 Law Enforcement Information</h4>

  <p>
    <strong>Agency:</strong>
    ${law.agency}
  </p>

  <p>
    <strong>Officer:</strong>
    ${law.officer}
  </p>

  <p>
    <strong>Badge #:</strong>
    ${law.badge}
  </p>

  <p>
    <strong>Agency Case #:</strong>
    ${law.caseNumber}
  </p>
` : ""}

<hr>

<h3>
  Vehicles Involved
</h3>

${incident.vehicles &&
      incident.vehicles.length

      ? incident.vehicles.map(
        vehicle => `

        <div class="vehicle-card">

          <p>
            <strong>Year:</strong>
            ${vehicle.year || ""}
          </p>

          <p>
            <strong>Make:</strong>
            ${vehicle.make || ""}
          </p>

          <p>
            <strong>Model:</strong>
            ${vehicle.model || ""}
          </p>

          <p>
            <strong>Color:</strong>
            ${vehicle.color || ""}
          </p>

          <p>
            <strong>License Plate:</strong>
            ${vehicle.plate || ""}
          </p>

          <p>
            <strong>State:</strong>
            ${vehicle.state || ""}
          </p>

        </div>

      `
      ).join("")

      : "<p>No vehicles listed.</p>"
    }

  `;
  loadSupplements(incident.id);

  const attachmentsContainer =
    document.getElementById(
      "reviewAttachmentsContainer"
    );

  const attachmentsSnap =
    await getDocs(
      collection(
        db,
        "incidentReports",
        incident.id,
        "attachments"
      )
    );

  const attachments =
    attachmentsSnap.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data()
      })
    );
  window.currentIncidentAttachments =
    attachments;  

  if (!attachments.length) {

    attachmentsContainer.innerHTML =
      "<p>No attachments.</p>";

  } else {

    photoGallery =
      attachments;

    renderAttachments();
  }

}

window.viewReviewHistory =
  async function (reportId) {

    try {

      const result =
  await loadIncidentReviewHistory(
    reportId
  );

if (!result.success) {

  console.error(
    result.message
  );

  return;

}

      let html = "";

      if (!result.history.length) {

        html = `
        <p>
          No review history found.
        </p>
      `;

      } else {

        result.history.forEach(item => {

          const date =
            item.createdAt
              ?.toDate()
              .toLocaleString()
            || "";


          const action =
            (item.action || "")
              .toLowerCase();

          let badgeClass = "";
          let badgeText = item.action;

          switch (action) {

            case "submit":
            case "submitted":
              badgeClass =
                "history-submitted";
              badgeText =
                "📨 Submitted";
              break;

            case "returned":
            case "returned for corrections":
              badgeClass =
                "history-returned";
              badgeText =
                "🟠 Returned";
              break;

            case "resubmitted":
              badgeClass =
                "history-resubmitted";
              badgeText =
                "🔄 Resubmitted";
              break;

            case "approved":
              badgeClass =
                "history-approved";
              badgeText =
                "✅ Approved";
              break;

            case "voided":
              badgeClass =
                "history-voided";
              badgeText =
                "🔴 Voided";
              break;

            case "supplement added":
              badgeClass =
                "history-supplement";
              badgeText =
                "➕ Supplement Added";
              break;

            default:
              badgeText =
                `📝 ${item.action}`;
          }

          html += `
          <div class="history-item">

            <div class="history-action">
  <span
    class="
      history-badge
      ${badgeClass}
    ">
    ${badgeText}
  </span>
</div>

            <div class="history-user">
              ${item.by || ""}
            </div>

            <div class="history-date">
              ${date}
            </div>

          </div>
        `;
        });

      }

      document.getElementById(
        "historyTimeline"
      ).innerHTML = html;

      document.getElementById(
        "reviewHistoryModal"
      ).style.display = "flex";

    } catch (err) {

      console.error(
        "Error loading history:",
        err
      );

    }

  };

window.populatePatrolSiteDropdown =
  function () {

    const select =
      document.getElementById(
        "patrolSite"
      );

    if (!select) return;

    select.innerHTML =
      '<option value="">Select Site</option>';

    sites.forEach(
      site => {

        select.innerHTML += `
        <option value="${site.id}">
          ${site.name}
        </option>
      `;
      }
    );
  };

async function createPatrolTemplate() {

  const name =
    document.getElementById(
      "patrolName"
    ).value.trim();

  const siteId =
    document.getElementById(
      "patrolSite"
    ).value;

  if (
    !name ||
    !siteId
  ) {
    alert(
      "Complete all fields."
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
      "patrolTemplates"
    ),
    {
      name,
      siteId,
      siteName:
        site?.name || "",

        tenantId:
      window.currentUserProfile.tenantId,

      createdAt:
  serverTimestamp()
    }
  );

  document.getElementById(
    "patrolName"
  ).value = "";

  document.getElementById(
    "patrolSite"
  ).value = "";
}

window.showPatrolsPage =
  function () {

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display =
      "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display =
      "none";

    document.getElementById(
      "patrolsPage"
    ).style.display =
      "block";

    setActiveNavById(
      "patrolsBtn"
    );

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "none";

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "none";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";

    document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";

    const patrolPage =
      document.getElementById(
        "patrolsPage"
      );

    patrolPage.style.display =
      "block";

    patrolPage.classList.remove(
      "hidden"
    );

    populatePatrolSiteDropdown();
  };
window.createPatrolTemplate =
  createPatrolTemplate;

function renderPatrolTemplates() {

  const container =
    document.getElementById(
      "patrolTemplateList"
    );

  if (!container) return;

  container.innerHTML =
    patrolTemplates.length

      ? patrolTemplates.map(
        patrol => {

          const patrolCheckpoints =
            checkpoints
              .filter(
                cp =>
                  cp.patrolId ===
                  patrol.id
              )
              .sort(
                (a, b) =>
                  (a.sequence || 0) -
                  (b.sequence || 0)
              );

          return `

              <div class="patrol-card">

                <h3>
                  ${patrol.name}
                </h3>

                <button
                  onclick="openCheckpointModal(
                    '${patrol.id}'
                  )"
                >
                  Add Checkpoint
                </button>

                <button
                onclick="deletePatrolTemplate('${patrol.id}')"
              >
                  Delete
              </button>

                <p>
                  Site:
                  ${patrol.siteName}
                </p>

                <div
                  class="checkpoint-list"
                >

                  ${patrolCheckpoints
              .map(
                (
                  cp,
                  index
                ) => `

                        <div
                          class="checkpoint-card"
                        >

                          <div
  class="checkpoint-header"
>

<div
  class="checkpoint-number"
>
  ${cp.sequence || index + 1}
</div>

  <strong>
    ${cp.checkpointName}
  </strong>

</div>

                          ${cp.description
                    ? `<br>${cp.description}`
                    : ""
                  }

                          <br><br>

                          <div class="checkpoint-tags">

  ${cp.requiresPhoto
                    ? '<span class="checkpoint-tag">📷 Photo Required</span>'
                    : ''
                  }

  ${cp.requiresNotes
                    ? '<span class="checkpoint-tag">📝 Notes Required</span>'
                    : ''
                  }

</div>

                           <div class="checkpoint-actions">

  <button
    onclick="moveCheckpointUp('${cp.id}')"
  >
    ↑
  </button>

  <button
    onclick="moveCheckpointDown('${cp.id}')"
  >
    ↓
  </button>

  <button
    onclick="editCheckpoint('${cp.id}')"
  >
    Edit
  </button>

  <button
    onclick="deleteCheckpoint('${cp.id}')"
  >
    Delete
  </button>

</div>

</div>

                      `
              )
              .join("")}

                </div>

              </div>

            `;

        }
      ).join("")

      : `

        <p>
          No patrol templates.
        </p>

      `;
}


window.openCheckpointModal =
  function (patrolId) {

    currentPatrolId =
      patrolId;

    const modal =
      document.getElementById(
        "checkpointModal"
      );

    modal.classList.remove(
      "hidden"
    );

  };

window.closeCheckpointModal =
  function () {

    document
      .getElementById(
        "checkpointModal"
      )
      .classList
      .add(
        "hidden"
      );

  };

window.saveCheckpoint =
  async function () {

    const checkpointName =
      document.getElementById(
        "checkpointName"
      ).value.trim();

    const description =
      document.getElementById(
        "checkpointDescription"
      ).value.trim();

    const requiresPhoto =
      document.getElementById(
        "requiresPhoto"
      ).checked;

    const requiresNotes =
      document.getElementById(
        "requiresNotes"
      ).checked;

    if (!checkpointName) {

      alert(
        "Checkpoint name required."
      );

      return;
    }

    const patrolCheckpoints =
      checkpoints.filter(
        cp =>
          cp.patrolId ===
          currentPatrolId
      );

    const nextSequence =
      patrolCheckpoints.length + 1;

    await addDoc(

      collection(
        db,
        "checkpoints"
      ),

      {
        patrolId:
          currentPatrolId,

        checkpointName,

        description,

        requiresPhoto,

        requiresNotes,

        sequence:
          nextSequence,

        createdAt:
          serverTimestamp()
      }

    );
    document.getElementById(
      "checkpointName"
    ).value = "";

    document.getElementById(
      "checkpointDescription"
    ).value = "";

    document.getElementById(
      "requiresPhoto"
    ).checked = false;

    document.getElementById(
      "requiresNotes"
    ).checked = false;

    document.getElementById(
      "checkpointName"
    ).focus();

  };

window.deleteCheckpoint =
  async function (id) {

    const confirmed =
      confirm(
        "Delete this checkpoint?"
      );

    if (!confirmed) return;

    await deleteDoc(
      doc(
        db,
        "checkpoints",
        id
      )
    );

  };


window.saveCheckpointEdit =
  async function () {

    if (!editingCheckpointId)
      return;

    await updateDoc(
      doc(
        db,
        "checkpoints",
        editingCheckpointId
      ),
      {
        checkpointName:
          document.getElementById(
            "editCheckpointName"
          ).value,

        description:
          document.getElementById(
            "editCheckpointDescription"
          ).value,

        requiresPhoto:
          document.getElementById(
            "editRequirePhoto"
          ).checked,

        requiresNotes:
          document.getElementById(
            "editRequireNotes"
          ).checked
      }
    );

    closeEditCheckpointModal();

  };

window.closeEditCheckpointModal =
  function () {

    editingCheckpointId = null;

    document.getElementById(
      "editCheckpointModal"
    ).classList.add(
      "hidden"
    );

  };

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      document
        .querySelectorAll(
          ".modal"
        )
        .forEach(
          modal =>
            modal.classList.add(
              "hidden"
            )
        );

    }

  }
);

window.addEventListener(
  "click",
  function (event) {

    const modal =
      document.getElementById(
        "viewIncidentModal"
      );

    if (
      event.target === modal
    ) {

      modal.classList.add(
        "hidden"
      );

    }

  }
);

window.moveCheckpointUp =
  async function (id) {

    const checkpoint =
      checkpoints.find(
        cp => cp.id === id
      );

    if (!checkpoint)
      return;

    const aboveCheckpoint =
      checkpoints.find(
        cp =>
          cp.patrolId ===
          checkpoint.patrolId &&
          cp.sequence ===
          checkpoint.sequence - 1
      );

    if (!aboveCheckpoint)
      return;

    const currentSequence =
      checkpoint.sequence;

    const aboveSequence =
      aboveCheckpoint.sequence;

    await updateDoc(
      doc(
        db,
        "checkpoints",
        checkpoint.id
      ),
      {
        sequence:
          aboveSequence
      }
    );

    await updateDoc(
      doc(
        db,
        "checkpoints",
        aboveCheckpoint.id
      ),
      {
        sequence:
          currentSequence
      }
    );

  };

window.moveCheckpointDown =
  async function (id) {

    const checkpoint =
      checkpoints.find(
        cp => cp.id === id
      );

    if (!checkpoint)
      return;

    const belowCheckpoint =
      checkpoints.find(
        cp =>
          cp.patrolId ===
          checkpoint.patrolId &&
          cp.sequence ===
          checkpoint.sequence + 1
      );

    if (!belowCheckpoint)
      return;

    const currentSequence =
      checkpoint.sequence;

    const belowSequence =
      belowCheckpoint.sequence;

    await updateDoc(
      doc(
        db,
        "checkpoints",
        checkpoint.id
      ),
      {
        sequence:
          belowSequence
      }
    );

    await updateDoc(
      doc(
        db,
        "checkpoints",
        belowCheckpoint.id
      ),
      {
        sequence:
          currentSequence
      }
    );

  };

window.showMyReportsPage =
  async function () {
    await loadIncidentReports();

    hideAllPages();

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "block";

    document.getElementById(
      "officerPortal"
    ).style.display =
      "none";

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display =
      "none";

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    loadMyReports();
  };

window.showMyPatrols =
  function () {

    document.getElementById(
      "officerPortal"
    ).style.display =
      "none";

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display =
      "block";

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReviewPage"
    ).style.display = "none";

    renderMyPatrols();

  };

window.startPatrol =
  async function (patrolId) {

    const patrol =
      patrolTemplates.find(
        p => p.id === patrolId
      );

    const patrolCheckpointList =
      checkpoints
        .filter(
          cp =>
            cp.patrolId ===
            patrolId
        )
        .sort(
          (a, b) =>
            (a.sequence || 0) -
            (b.sequence || 0)
        );

    if (!patrol) {

      alert(
        "Patrol not found."
      );

      return;
    }

    //
    // RESUME EXISTING PATROL
    //
    const existingPatrol =
      await findActivePatrol(
        currentOfficer.id
      );

    if (existingPatrol) {

      currentActivePatrolId =
        existingPatrol.id;

      showPatrolExecution();

      await loadCurrentCheckpoint(
        existingPatrol.id
      );

      return;
    }

    //
    // CREATE NEW PATROL
    //
    const activePatrolRef =
      await addDoc(
        collection(
          db,
          "activePatrols"
        ),
        {
          officerId:
            currentOfficer.id,

          officerName:
            currentOfficer.name,

          patrolId:
            patrol.id,

          patrolName:
            patrol.name,

          siteId:
            patrol.siteId,

          currentCheckpoint: 0,

          currentCheckpointName:
            patrolCheckpointList[0]
              ?.checkpointName || "",

          totalCheckpoints:
            patrolCheckpointList.length,

          startedAt:
            serverTimestamp(),

          scheduledStart:
  serverTimestamp(),

          expectedDuration:
            patrol.estimatedDuration ||
            1800000,

          lastUpdated:
            serverTimestamp(),

            tenantId:
  window.currentUserProfile.tenantId,

          completed: false,

          completedAt: null
        }
      );

    currentActivePatrolId =
      activePatrolRef.id;

    await logPatrolEvent({

      patrolSessionId:
        activePatrolRef.id,

      patrolId:
        patrol.id,

      patrolName:
        patrol.name,

      officerId:
        currentOfficer.id,

      officerName:
        currentOfficer.name,

      siteId:
        patrol.siteId,

      eventType:
        "PATROL_STARTED"

    });

    showPatrolExecution();

    await loadCurrentCheckpoint(
      activePatrolRef.id
    );
  };

async function findActivePatrol(officerId) {

  const snapshot =
    await getDocs(
      query(
        collection(db, "activePatrols"),
        where(
          "officerId",
          "==",
          officerId
        ),
        where(
          "completed",
          "==",
          false
        )
      )
    );

  if (snapshot.empty) {
    return null;
  }

  const docSnap =
    snapshot.docs[0];

  return {
    id: docSnap.id,
    ...docSnap.data()
  };

}

window.logPatrolEvent =
  async function (eventData) {

    try {

      const payload = {
        ...eventData
      };

      if (
        !payload.timestamp
      ) {
        payload.timestamp =
          serverTimestamp();
      }

      await addDoc(
        collection(
          db,
          "patrolEvents"
        ),
        payload
      );

    } catch (error) {

      console.error(
        "Failed to log patrol event:",
        error
      );
    }
  };

window.loadCurrentCheckpoint =
  async function (activePatrolId) {

    // Load the active patrol document
    const activePatrolDoc =
      await getDoc(
        doc(
          db,
          "activePatrols",
          activePatrolId
        )
      );

    if (!activePatrolDoc.exists()) {

      alert(
        "Active patrol not found."
      );

      return;

    }

    const activePatrol =
      activePatrolDoc.data();

    checkpoints.forEach(cp => {


    });

   

    console.log(
      "Checkpoint Patrol IDs:",
      checkpoints.map(
        cp => cp.patrolId
      )
    );    

    checkpoints.forEach(cp => {

      
    });

    const patrolCheckpoints =
      checkpoints
        .filter(
          cp =>
            cp.patrolId ===
            activePatrol.patrolId
        )
        .sort(
          (a, b) =>
            a.sequence - b.sequence
        );
   
    if (!patrolCheckpoints.length) {

      alert(
        "No checkpoints found."
      );

      return;

    }
    if (
      activePatrol.currentCheckpoint >=
      patrolCheckpoints.length
    ) {

      await updateDoc(

        doc(
          db,
          "activePatrols",
          currentActivePatrolId
        ),

        {

          completed: true,

          completedAt:
            serverTimestamp()

        }

      );

      alert(
        "Patrol Complete!"
      );

      showMyPatrols();

      return;

    }

    const currentCheckpoint =
      patrolCheckpoints[
      activePatrol.currentCheckpoint
      ];

    document.getElementById(
      "activePatrolName"
    ).textContent =
      activePatrol.patrolName;

    document.getElementById(
      "checkpointTitle"
    ).textContent =
      currentCheckpoint.checkpointName;

    document.getElementById(
      "checkpointProgress"
    ).textContent =
      `Checkpoint ${activePatrol.currentCheckpoint + 1
      } of ${patrolCheckpoints.length
      }`;

    document.getElementById(
      "checkpointContent"
    ).innerHTML = `

  ${currentCheckpoint.description
        ? `
        <div
          class="checkpoint-instructions"
        >
          <h4>
            Instructions
          </h4>

          <p>
            ${currentCheckpoint.description}
          </p>
        </div>
      `
        : ""
      }

  <p>
    <strong>Photo Required:</strong>
    ${currentCheckpoint.requiresPhoto
        ? "Yes"
        : "No"
      }
  </p>

  <p>
    <strong>Notes Required:</strong>
    ${currentCheckpoint.requiresNotes
        ? "Yes"
        : "No"
      }
  </p>

`;

  };

window.completeCheckpoint =
  async function () {

    if (
      !currentActivePatrolId
    ) {

      alert(
        "No active patrol."
      );

      return;

    }

    const activePatrolRef =
      doc(
        db,
        "activePatrols",
        currentActivePatrolId
      );

    const activePatrolDoc =
      await getDoc(
        activePatrolRef
      );

    if (
      !activePatrolDoc.exists()
    ) {

      alert(
        "Active patrol not found."
      );

      return;

    }

    const activePatrol =
      activePatrolDoc.data();

    const patrolCheckpoints =
      checkpoints
        .filter(
          cp =>
            cp.patrolId ===
            activePatrol.patrolId
        )
        .sort(
          (a, b) =>
            a.sequence - b.sequence
        );

    const checkpoint =
      patrolCheckpoints[
      activePatrol.currentCheckpoint
      ];

    if (!checkpoint) {

      alert(
        "Checkpoint not found."
      );

      return;

    }

    openCheckpointEvidenceModal(
      checkpoint
    );

  };

window.deletePatrolTemplate =
  async function (id) {

    const checkpointCount =
      checkpoints.filter(
        cp => cp.patrolId === id
      ).length;

    if (checkpointCount > 0) {

      alert(
        "Delete all checkpoints before deleting this patrol."
      );

      return;

    }

    if (
      !confirm(
        "Delete this patrol template?"
      )
    ) {

      return;

    }

    await deleteDoc(
      doc(
        db,
        "patrolTemplates",
        id
      )
    );

  };

window.openCheckpointEvidenceModal =
  function (checkpoint) {

    document.getElementById(
      "evidenceCheckpointName"
    ).textContent =
      checkpoint.checkpointName;

    document.getElementById(
      "evidencePhotoSection"
    ).classList.toggle(
      "hidden",
      !checkpoint.requiresPhoto
    );

    document.getElementById(
      "evidenceNotesSection"
    ).classList.toggle(
      "hidden",
      !checkpoint.requiresNotes
    );

    document.getElementById(
      "checkpointEvidenceModal"
    ).classList.remove(
      "hidden"
    );

  };

window.closeCheckpointEvidenceModal =
  function () {

    document.getElementById(
      "checkpointEvidenceModal"
    ).classList.add(
      "hidden"
    );
    document.getElementById(
      "checkpointNotes"
    ).value = "";

    document.getElementById(
      "checkpointPhoto"
    ).value = "";

  };

window.saveCheckpointEvidence =
  async function () {

    if (!currentActivePatrolId) {

      alert(
        "No active patrol."
      );

      return;

    }

    const activePatrolRef =
      doc(
        db,
        "activePatrols",
        currentActivePatrolId
      );

    const activePatrolDoc =
      await getDoc(
        activePatrolRef
      );

    if (!activePatrolDoc.exists()) {

      alert(
        "Active patrol not found."
      );

      return;

    }

    const activePatrol =
      activePatrolDoc.data();

    const patrolCheckpoints =
      checkpoints
        .filter(
          cp =>
            cp.patrolId ===
            activePatrol.patrolId
        )
        .sort(
          (a, b) =>
            a.sequence - b.sequence
        );

    const checkpoint =
      patrolCheckpoints[
      activePatrol.currentCheckpoint
      ];

    if (!checkpoint) {

      alert(
        "Checkpoint not found."
      );

      return;

    }

    const nextCheckpoint =
      activePatrol.currentCheckpoint + 1;

    const notes =
      document.getElementById(
        "checkpointNotes"
      ).value.trim();

    const photo =
      document.getElementById(
        "checkpointPhoto"
      ).files[0];

    let photoUrl = "";

    if (photo) {

      photoUrl =
        await uploadCheckpointPhoto(

          photo,

          activePatrol.patrolId,

          checkpoint.id

        );

    }

    if (
      checkpoint.requiresNotes &&
      !notes
    ) {

      alert(
        "Notes are required for this checkpoint."
      );

      return;

    }

    if (
      checkpoint.requiresPhoto &&
      !photo
    ) {

      alert(
        "A photo is required for this checkpoint."
      );

      return;

    }

    let latitude = null;
    let longitude = null;
    let accuracy = null;

    try {

      const position =
        await new Promise(
          (resolve, reject) => {

            navigator.geolocation
              .getCurrentPosition(
                resolve,
                reject,
                {
                  enableHighAccuracy: true,
                  timeout: 10000
                }
              );

          }
        );

      latitude =
        position.coords.latitude;

      longitude =
        position.coords.longitude;

      accuracy =
        position.coords.accuracy;

    } catch (error) {

      console.warn(
        "Unable to obtain GPS location:",
        error
      );

    }

    try {


      await addDoc(

        collection(
          db,
          "patrolCompletions"
        ),

        {

          patrolSessionId:
            currentActivePatrolId,

          activePatrolId:
            currentActivePatrolId,

          patrolId:
            activePatrol.patrolId,

          checkpointId:
            checkpoint.id,

          checkpointName:
            checkpoint.checkpointName,

          officerId:
            currentOfficer.id,

          officerName:
            currentOfficer.name,

          siteId:
            activePatrol.siteId,

          completedAt:
            serverTimestamp(),

          photoUrl: photoUrl,

          notes: notes,

          latitude:
            latitude,

          longitude:
            longitude,

          accuracy:
            accuracy

        }

      );

      await logPatrolEvent({

        patrolSessionId:
          currentActivePatrolId,

        patrolId:
          activePatrol.patrolId,

        patrolName:
          activePatrol.patrolName,

        officerId:
          currentOfficer.id,

        officerName:
          currentOfficer.name,

        siteId:
          activePatrol.siteId,

        eventType:
          "CHECKPOINT_COMPLETED",

        checkpointId:
          checkpoint.id,

        checkpointName:
          checkpoint.checkpointName,

        notes:
          notes || "",

        photoUrl:
          photoUrl || "",

        latitude:
          latitude,

        longitude:
          longitude,

        accuracy:
          accuracy

      });

     
    } catch (error) {

      console.error(error);

      alert(JSON.stringify(error));

      return;

    }

    await updateDoc(

      activePatrolRef,

      {

        currentCheckpoint:
          nextCheckpoint

      }

    );

    if (
      nextCheckpoint >=
      patrolCheckpoints.length
    ) {

      await updateDoc(

        activePatrolRef,

        {

          completed: true,

          completedAt:
            serverTimestamp()

        }

      );

      await logPatrolEvent({

        patrolSessionId:
          currentActivePatrolId,

        patrolId:
          activePatrol.patrolId,

        patrolName:
          activePatrol.patrolName,

        officerId:
          currentOfficer.id,

        officerName:
          currentOfficer.name,

        siteId:
          activePatrol.siteId,

        eventType:
          "PATROL_COMPLETED"

      });

      closeCheckpointEvidenceModal();

      alert(
        "Patrol Complete!"
      );

      showMyPatrols();

      return;

    }

    closeCheckpointEvidenceModal();

    await loadCurrentCheckpoint(
      currentActivePatrolId
    );
  };

window.uploadCheckpointPhoto =
  async function (
    file,
    patrolId,
    checkpointId
  ) {

    const storageRef =
      ref(

        storage,

        `patrolPhotos/${patrolId
        }/${checkpointId
        }/${Date.now()
        }`

      );

    await uploadBytes(
      storageRef,
      file
    );

    return await getDownloadURL(
      storageRef
    );

  };

window.editCheckpoint =
  function (id) {

    const checkpoint =
      checkpoints.find(
        cp => cp.id === id
      );

    if (!checkpoint) {

      alert(
        "Checkpoint not found."
      );

      return;

    }

    editingCheckpointId =
      checkpoint.id;

    document.getElementById(
      "editCheckpointName"
    ).value =
      checkpoint.checkpointName;

    document.getElementById(
      "editCheckpointDescription"
    ).value =
      checkpoint.description || "";

    document.getElementById(
      "editRequirePhoto"
    ).checked =
      checkpoint.requiresPhoto;

    document.getElementById(
      "editRequireNotes"
    ).checked =
      checkpoint.requiresNotes;

    document.getElementById(
      "editCheckpointModal"
    ).classList.remove(
      "hidden"
    );

  };

window.resumeActivePatrol =
  async function () {

    if (!currentOfficer) return;

    const activePatrol =
      await findActivePatrol(
        currentOfficer.id
      );

    if (!activePatrol) {
      return;
    }

    currentActivePatrolId =
      activePatrol.id;

    showPatrolExecution();

    await loadCurrentCheckpoint(
      activePatrol.id
    );

  };

window.setActiveNavById =
  function (id) {

    document
      .querySelectorAll(
        ".nav-buttons button:not(.logout-btn)"
      )
      .forEach(btn =>
        btn.classList.remove(
          "active-nav"
        )
      );

    document
      .getElementById(id)
      ?.classList.add(
        "active-nav"
      );
  };

function refreshPatrolDashboard() {
  refreshPatrolMetrics();
  renderActivePatrolTable();
}

function refreshPatrolMetrics() {

  const active =
    activePatrols.filter(
      p => !p.completed
    );

  document.getElementById(
    "activePatrolsCount"
  ).textContent =
    active.length;

  const officers =
    new Set(
      active.map(
        p => p.officerId
      )
    );

  document.getElementById(
    "officersOnPatrolCount"
  ).textContent =
    officers.size;

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const completedToday =
    activePatrols.filter(
      patrol => {

        if (
          !patrol.completed ||
          !patrol.completedAt
        ) {
          return false;
        }

        return (
          patrol.completedAt
            .toDate() >= today
        );
      }
    );

  document.getElementById(
    "completedPatrolsTodayCount"
  ).textContent =
    completedToday.length;

  const overduePatrols =
    active.filter(
      patrol =>
        isPatrolOverdue(
          patrol
        )
    );

  document.getElementById(
    "overduePatrolsCount"
  ).textContent =
    overduePatrols.length;
  renderCompletedPatrolHistory();
}

function renderActivePatrolTable() {

  const container =
    document.getElementById(
      "livePatrolTable"
    );

  if (!container)
    return;

  const active =
    activePatrols.filter(
      p => !p.completed
    );

  if (!active.length) {

    container.innerHTML =
      "<p>No active patrols.</p>";

    return;
  }

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
         <th>Officer</th>
            <th>Patrol</th>
            <th>Progress</th>
            <th>Current Checkpoint</th>
            <th>Started</th>
            <th>Elapsed</th>
            <th>Status</th>
        </tr>
      </thead>

      <tbody>

        ${active.map(
    patrol => {


      const overdue =
        isPatrolOverdue(patrol);

      const status =
        overdue
          ? `
      <span class="badge warning">
        Overdue
      </span>
    `
          : `
      <span class="badge success">
        Active
      </span>
    `;

      const rowClass =
        overdue
          ? "overdue-row"
          : "";

      const elapsed =
        getPatrolElapsed(
          patrol
        );

      const elapsedDisplay =
        overdue
          ? `
      <span class="overdue-time">
        ${elapsed}
      </span>
    `
          : elapsed;

      const progress =
        `${Math.min(
          patrol.currentCheckpoint + 1,
          patrol.totalCheckpoints
        )}
 / ${patrol.totalCheckpoints}`;

      const percent =
        (patrol.currentCheckpoint /
          patrol.totalCheckpoints) * 100;

      return `
                <tr class="${rowClass}">            
           
                <td>${patrol.officerName}</td>

                <td>${patrol.patrolName}</td>

                <td>
  <div>${progress}</div>

  <div class="progress-bar">
    <div
      class="progress-fill"
      style="
        width:${percent}%;
      ">
    </div>
  </div>
</td>

                <td>
                  ${patrol.currentCheckpointName ||
        "-"
        }
                </td>

                <td>
                  ${patrol.startedAt
          ?.toDate()
          .toLocaleTimeString()
        }
                </td>

              <td>${elapsedDisplay}</td>
              <td>${status}</td>
              </tr>
            `;
    }
  ).join("")}

      </tbody>
    </table>
  `;
}

window.showPatrolDashboardPage =
  function () {

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "block";

    setActiveNavById(
      "patrolDashboardBtn"
    );

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "none";

    document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";

    document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";

    refreshPatrolDashboard();
  };

function isPatrolOverdue(
  patrol
) {
  if (!patrol) {
    return false;
  }

  if (patrol.completed) {
    return false;
  }

  if (
    !patrol.scheduledStart
  ) {
    return false;
  }

  const expectedDuration =
    patrol.expectedDuration ||
    1800000;

  return (
    Date.now() >
    patrol.scheduledStart +
    expectedDuration
  );
}

function getPatrolElapsed(
  patrol
) {
  if (
    !patrol?.scheduledStart
  ) {
    return "-";
  }

  const elapsedMs =
    Date.now() -
    patrol.scheduledStart;

  const minutes =
    Math.floor(
      elapsedMs / 60000
    );

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours > 0) {
    return `${hours}h ${minutes % 60
      }m`;
  }

  return `${minutes}m`;
}

window.loadPatrolTimeline =
  async function (
    patrolSessionId
  ) {

    // Load patrol events
    const eventsQuery =
      query(
        collection(
          db,
          "patrolEvents"
        ),
        where(
          "patrolSessionId",
          "==",
          patrolSessionId
        ),
        orderBy(
          "timestamp",
          "asc"
        )
      );

    const eventsSnapshot =
      await getDocs(
        eventsQuery
      );

    const events =
      eventsSnapshot.docs.map(
        doc => ({
          id: doc.id,
          ...doc.data()
        })
      );

    // Load checkpoint evidence
    const completionsQuery =
      query(
        collection(
          db,
          "patrolCompletions"
        ),
        where(
          "patrolSessionId",
          "==",
          patrolSessionId
        )
      );

    const completionsSnapshot =
      await getDocs(
        completionsQuery
      );

    // Build evidence lookup
    const evidenceMap = {};

    completionsSnapshot.forEach(
      doc => {

        const completion =
          doc.data();

        evidenceMap[
          completion.checkpointId
        ] = completion;
      }
    );

    // Merge evidence into events
    return events.map(
      event => {

        const evidence =
          evidenceMap[
          event.checkpointId
          ];

        return {

          ...event,

          photoUrl:
            evidence?.photoUrl || "",

          notes:
            evidence?.notes || ""

        };
      }
    );
  };

window.viewPatrolTimeline =
  async function (
    patrolSessionId
  ) {   

    const events =
      await loadPatrolTimeline(
        patrolSessionId
      );

    patrolPhotoGallery =
      events
        .filter(
          e => e.photoUrl
        )
        .map(
          e => e.photoUrl
        );

    const container =
      document.getElementById(
        "patrolTimeline"
      );

    if (!events.length) {

      container.innerHTML =
        `
      <p>
        No timeline events found.
      </p>
      `;

    } else {

      container.innerHTML =
        events.map(
          (event, index) => {

            let icon = "📍";
            let text = "";

            switch (
            event.eventType
            ) {

              case "PATROL_STARTED":
                icon = "🟢";
                text =
                  "Patrol Started";
                break;

              case "CHECKPOINT_COMPLETED":
                icon = "✅";
                text =
                  `${event.checkpointName} Completed`;
                break;

              case "PATROL_COMPLETED":
                icon = "🏁";
                text =
                  "Patrol Completed";
                break;

              case "PATROL_OVERDUE":
                icon = "⚠️";
                text =
                  "Patrol Became Overdue";
                break;

              default:
                text =
                  event.eventType;
            }

            const time =
              event.timestamp?.toDate
                ? event.timestamp
                  .toDate()
                  .toLocaleString()
                : "-";

            const photoIndex =
              event.photoUrl
                ? photoGallery.indexOf(
                  event.photoUrl
                )
                : -1;

            return `
  <div class="timeline-item">

    <div class="timeline-time">
      ${time}
    </div>

    <div class="timeline-event">
      ${icon}
      ${text}
    </div>

    ${event.notes
                ? `
          <div class="timeline-notes">
            📝 ${event.notes}
          </div>
        `
                : ""
              }

${event.photoUrl
                ? `
      <div class="timeline-photo">
        <img
          src="${event.photoUrl}"
          class="evidence-thumbnail"
         onclick="
  openPhotoViewer(
    ${photoIndex}
  )
">
      </div>
    `
                : ""
              }

    ${event.latitude
                ? `
          <div class="timeline-location">
            📍
            ${event.latitude.toFixed(6)},
            ${event.longitude.toFixed(6)}
          </div>

          <div class="timeline-accuracy">
            GPS Accuracy:
            ${Math.round(event.accuracy)} m
          </div>

          <button
            class="secondary-btn"
            onclick="
              viewPatrolLocation(
                ${event.latitude},
                ${event.longitude}
              )
            ">
            🗺 View on Map
          </button>
        `
                : ""
              }

  </div>
`;
          }
        ).join("");
    }

    console.log(
      "Opening timeline modal..."
    );

    document.getElementById(
      "patrolTimelineModal"
    ).style.display =
      "flex";

    document.getElementById(
      "officerPortal"
    ).style.display =
      "none";

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display =
      "none";

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

  };

window.testPatrolTimeline =
  async function () {

    const completed =
      activePatrols.find(
        p => p.completed
      );

    if (!completed) {

      alert(
        "No completed patrol found."
      );

      return;
    }

    await viewPatrolTimeline(
      completed.id
    );
  };

window.closePatrolTimelineModal =
  function () {

    document.getElementById(
      "patrolTimelineModal"
    ).style.display =
      "none";

  };

window.renderCompletedPatrolHistory =
  function () {

    const container =
      document.getElementById(
        "completedPatrolHistory"
      );

    if (!container)
      return;

    const completed =
      activePatrols
        .filter(
          p => p.completed
        )
        .sort(
          (a, b) => {

            const aTime =
              a.completedAt?.toDate?.()
                ?.getTime() || 0;

            const bTime =
              b.completedAt?.toDate?.()
                ?.getTime() || 0;

            return bTime - aTime;
          }
        );

    if (!completed.length) {

      container.innerHTML =
        `
      <p>
        No completed patrols.
      </p>
      `;

      return;
    }

    container.innerHTML =
      completed.map(
        patrol => `

      <div
        class="completed-patrol-card">

        <div>

          <strong>
            ${patrol.patrolName}
          </strong>

          <br>

          Officer:
          ${patrol.officerName}

          <br>

          Completed:
${patrol.completedAt?.toDate
            ? patrol.completedAt
              .toDate()
              .toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short"
              })
            : "-"
          }
        </div>

        <button
          onclick="
            viewPatrolTimeline(
              '${patrol.id}'
            )
          ">
          Timeline
        </button>

      </div>

      `
      ).join("");
  };

window.viewPatrolLocation =
  function (lat, lng) {

    closePatrolTimelineModal();

    showDashboard();

    document.getElementById(
      "operationsMapPanel"
    )?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    setTimeout(() => {

      map.invalidateSize();

      map.flyTo(
        [lat, lng],
        19,
        {
          duration: 2
        }
      );

      L.popup()
        .setLatLng(
          [lat, lng]
        )
        .setContent(`
        <strong>
          Patrol Evidence
        </strong>
        <br>
        ${lat.toFixed(6)},
        ${lng.toFixed(6)}
      `)
        .openOn(map);

    }, 500);

  };

window.openPhotoViewer =
  function (index) {

    currentPhotoIndex = index;

    document.getElementById(
      "photoViewerImage"
    ).src =
      photoGallery[
        currentPhotoIndex
      ].downloadURL;

    updatePhotoCounter();

    document.getElementById(
      "photoViewerModal"
    ).style.display =
      "flex";
  };

window.closePhotoViewer =
  function () {

    document.getElementById(
      "photoViewerModal"
    ).style.display =
      "none";

    document.getElementById(
      "photoViewerImage"
    ).src = "";

    currentPhotoIndex = 0;
  };

window.showPatrolAnalytics =
  function () {

    document.getElementById(
      "dashboardPage"
    ).style.display = "none";

    document.getElementById(
      "schedulingPage"
    ).style.display = "none";

    document.getElementById(
      "officerPortal"
    ).style.display = "none";

    document.getElementById(
      "myPatrolsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolExecutionPage"
    ).style.display = "none";

    document.getElementById(
      "incidentReportsPage"
    ).style.display = "none";

    document.getElementById(
      "officerIncidentReportPage"
    ).style.display = "none";

    document.getElementById(
      "patrolTimelineModal"
    ).style.display = "none";

    document.getElementById(
      "companySettingsPage"
    ).style.display = "none";

    document.getElementById(
      "patrolAnalyticsPage"
    ).style.display = "block";

    setActiveNavById(
      "patrolAnalyticsBtn"
    );

    document.getElementById(
      "patrolDashboardPage"
    ).style.display = "none";

    document.getElementById(
      "myReportsPage"
    ).style.display =
      "none";

    document.getElementById(
      "mileageReportPage"
    ).style.display = "none";

    document
        .getElementById(
            "knowledgeCenterPage"
        ).style.display = "none";

    renderPatrolAnalytics();
  };

window.renderPatrolAnalytics =
  function () {

    const filteredPatrols =
      getFilteredPatrols();

    const total =
      filteredPatrols.length;

    const completed =
      filteredPatrols.filter(
        p => p.completed
      ).length;

    const active =
      filteredPatrols.filter(
        p => !p.completed
      ).length;

    const completionRate =
      total
        ? Math.round(
          (completed / total) * 100
        )
        : 0;

    const missed =
      filteredPatrols.filter(
        p =>
          p.totalCheckpoints &&
          p.currentCheckpoint <
          p.totalCheckpoints - 1 &&
          p.completed
      ).length;

    const overdue =
      filteredPatrols.filter(
        patrol => {

          if (
            patrol.completed ||
            !patrol.startedAt
          ) {
            return false;
          }

          const elapsed =
            Date.now() -
            patrol.startedAt
              .toDate()
              .getTime();

          return (
            elapsed >
            patrol.expectedDuration
          );
        }
      ).length;

    const officerStats = {};

    filteredPatrols.forEach(
      patrol => {

        const officer =
          patrol.officerName ||
          "Unknown";

        if (!officerStats[officer]) {

          officerStats[officer] = {
            total: 0,
            completed: 0
          };
        }

        officerStats[officer].total++;

        if (patrol.completed) {
          officerStats[officer].completed++;
        }
      }
    );

    const topOfficer =
      Object.entries(
        officerStats
      )
        .sort(
          (
            [, a],
            [, b]
          ) =>
            b.completed -
            a.completed
        )[0]?.[0] ||
      "-";

    const completedPatrols =
      filteredPatrols.filter(
        p =>
          p.completed &&
          p.startedAt &&
          p.completedAt
      );

    const averageSeconds =
      completedPatrols.length
        ? Math.round(
          completedPatrols.reduce(
            (sum, patrol) => {

              const seconds =
                (
                  patrol.completedAt.toDate() -
                  patrol.startedAt.toDate()
                ) / 1000;

              return sum + seconds;
            },
            0
          ) /
          completedPatrols.length
        )
        : 0;

    const minutes =
      Math.floor(
        averageSeconds / 60
      );

    const seconds =
      averageSeconds % 60;

    document.getElementById(
      "patrolAnalyticsCards"
    ).innerHTML =
      `
    <div class="stat-card">
      <h2>${total}</h2>
      <p>📋 Total Patrols</p>
    </div>

    <div class="stat-card">
      <h2>${completed}</h2>
      <p>✅ Completed</p>
    </div>

    <div class="stat-card">
      <h2>${active}</h2>
      <p>🟢 Active</p>
    </div>

    <div class="stat-card">
      <h2>${overdue}</h2>
      <p>⚠ Overdue</p>
    </div>

    <div class="stat-card">
      <h2>${completionRate}%</h2>
      <p>🎯 Completion Rate</p>
    </div>

    <div class="stat-card">
  <h2>${topOfficer}</h2>
  <p>🏆 Top Officer</p>
</div>

    <div class="stat-card">
      <h2>${minutes}m ${seconds}s</h2>
      <p>⏱ Avg Duration</p>
    </div>

    <div class="stat-card">
      <h2>${missed}</h2>
      <p>❌ Missed Checkpoints</p>
    </div>
    
    `;

    populateAnalyticsFilters();
    renderOfficerPerformance();
    renderSitePerformance();
  };

window.renderSitePerformance =
  function () {

    const patrols =
      getFilteredPatrols();

    const stats = {};

    patrols.forEach(
      patrol => {

        const site =
          sites.find(
            s =>
              s.id ===
              patrol.siteId
          );

        const name =
          site?.name ||
          "Unknown";

        if (!stats[name]) {

          stats[name] = {
            total: 0,
            completed: 0
          };
        }

        stats[name].total++;

        if (patrol.completed) {
          stats[name].completed++;
        }
      }
    );

    document.getElementById(
      "sitePerformanceTable"
    ).innerHTML =
      `
      <table class="table">

        <thead>
          <tr>
            <th>Site</th>
            <th>Patrols</th>
            <th>Completed</th>
            <th>Completion %</th>
          </tr>
        </thead>

        <tbody>

          ${Object.entries(stats)
        .map(
          ([name, s]) => {

            const pct =
              s.total
                ? Math.round(
                  s.completed /
                  s.total *
                  100
                )
                : 0;

            return `
                    <tr>
                      <td>${name}</td>
                      <td>${s.total}</td>
                      <td>${s.completed}</td>
                      <td>${pct}%</td>
                    </tr>
                  `;
          }
        )
        .join("")
      }

        </tbody>

      </table>
    `;
  };

window.renderOfficerPerformance =
  function () {
    const patrols =
      getFilteredPatrols();

    const container =
      document.getElementById(
        "officerPerformanceTable"
      );

    if (!container)
      return;

    const stats = {};

    patrols.forEach(
      patrol => {

        const officer =
          patrol.officerName ||
          "Unknown";

        if (!stats[officer]) {

          stats[officer] = {
            total: 0,
            completed: 0
          };
        }

        stats[officer].total++;

        if (patrol.completed) {
          stats[officer].completed++;
        }
      }
    );

    const rows =
      Object.entries(stats)
        .sort(
          (
            [, a],
            [, b]
          ) =>
            b.completed -
            a.completed
        );

    container.innerHTML =
      `
      <table class="table">

        <thead>
          <tr>
            <th>Officer</th>
            <th>Patrols</th>
            <th>Completed</th>
            <th>Completion %</th>
          </tr>
        </thead>

        <tbody>

          ${rows.map(
        ([name, s]) => {

          const pct =
            s.total
              ? Math.round(
                s.completed /
                s.total *
                100
              )
              : 0;

          return `
                  <tr>
                    <td>${name}</td>
                    <td>${s.total}</td>
                    <td>${s.completed}</td>
                    <td>${pct}%</td>
                  </tr>
                `;
        }
      ).join("")
      }

        </tbody>

      </table>
    `;
  };

window.populateAnalyticsFilters =
  function () {

    const siteSelect =
      document.getElementById(
        "analyticsSiteFilter"
      );

    const officerSelect =
      document.getElementById(
        "analyticsOfficerFilter"
      );

    if (!siteSelect || !officerSelect)
      return;

    siteSelect.innerHTML =
      `<option value="">All Sites</option>`;

    officerSelect.innerHTML =
      `<option value="">All Officers</option>`;

    sites
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      .forEach(site => {

        siteSelect.innerHTML += `
        <option value="${site.id}">
          ${site.name}
        </option>
      `;
      });

    employees
      .filter(
        e => e.role === "Officer"
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      .forEach(officer => {

        officerSelect.innerHTML += `
        <option value="${officer.id}">
          ${officer.name}
        </option>
      `;
      });

    siteSelect.value =
      analyticsSiteFilter;

    officerSelect.value =
      analyticsOfficerFilter;

    siteSelect.onchange = () => {

      console.log(
        "Site changed:",
        siteSelect.value
      );

      analyticsSiteFilter =
        siteSelect.value;

      renderPatrolAnalytics();
    };

    officerSelect.onchange = () => {

      console.log(
        "Officer changed:",
        officerSelect.value
      );

      analyticsOfficerFilter =
        officerSelect.value;

      renderPatrolAnalytics();
    };

    const startInput =
      document.getElementById(
        "analyticsStartDate"
      );

    if (startInput) {
      startInput.onchange =
        e => {

          analyticsStartDateFilter =
            e.target.value;

          console.log(
            "Start Date:",
            analyticsStartDateFilter
          );

          renderPatrolAnalytics();
        };
    }

    const endInput =
      document.getElementById(
        "analyticsEndDate"
      );

    if (endInput) {
      endInput.onchange =
        e => {

          analyticsEndDateFilter =
            e.target.value;

          console.log(
            "End Date:",
            analyticsEndDateFilter
          );

          renderPatrolAnalytics();
        };
    }

  };

window.applyAnalyticsFilters =
  function () {

    const start =
      document.getElementById(
        "analyticsStartDate"
      ).value;

    const end =
      document.getElementById(
        "analyticsEndDate"
      ).value;

    const siteId =
      document.getElementById(
        "analyticsSiteFilter"
      ).value;

    const officerId =
      document.getElementById(
        "analyticsOfficerFilter"
      ).value;

    filteredPatrolCompletions =
      patrolCompletions.filter(
        patrol => {

          let pass = true;

          if (start) {

            const startDate =
              new Date(start);

            pass =
              pass &&
              patrol.completedAt?.toDate() >=
              startDate;
          }

          if (end) {

            const endDate =
              new Date(end);
            endDate.setHours(
              23,
              59,
              59,
              999
            );

            pass =
              pass &&
              patrol.completedAt?.toDate() <=
              endDate;
          }

          if (siteId) {
            pass =
              pass &&
              patrol.siteId === siteId;
          }

          if (officerId) {
            pass =
              pass &&
              patrol.employeeId === officerId;
          }

          return pass;
        }
      );

    refreshPatrolAnalytics();
  };

window.clearAnalyticsFilters =
  function () {

    document.getElementById(
      "analyticsStartDate"
    ).value = "";

    document.getElementById(
      "analyticsEndDate"
    ).value = "";

    document.getElementById(
      "analyticsSiteFilter"
    ).value = "";

    document.getElementById(
      "analyticsOfficerFilter"
    ).value = "";

    filteredPatrolCompletions = [];

    refreshPatrolAnalytics();
  };

function getFilteredPatrols() {

  let filtered =
    [...activePatrols];

  if (analyticsSiteFilter) {
    filtered =
      filtered.filter(
        p =>
          p.siteId ===
          analyticsSiteFilter
      );
  }

  if (analyticsOfficerFilter) {
    filtered =
      filtered.filter(
        p =>
          p.officerId ===
          analyticsOfficerFilter
      );
  }
  if (analyticsStartDateFilter) {

    const start =
      new Date(
        analyticsStartDateFilter
      );

    start.setHours(
      0, 0, 0, 0
    );

    filtered =
      filtered.filter(
        patrol => {

          if (!patrol.startedAt)
            return false;

          const patrolDate =
            patrol.startedAt
              .toDate();

          return (
            patrolDate >=
            start
          );
        }
      );
  }

  if (analyticsEndDateFilter) {

    const end =
      new Date(
        analyticsEndDateFilter
      );

    end.setHours(
      23, 59, 59, 999
    );

    filtered =
      filtered.filter(
        patrol => {

          if (!patrol.startedAt)
            return false;

          const patrolDate =
            patrol.startedAt
              .toDate();

          return (
            patrolDate <=
            end
          );
        }
      );
  }
  return filtered;
}

window.saveCompanyProfile =
  async function () {

    try {

      let logoUrl =
        companyProfile.logoUrl || "";

      let logoBase64 =
        companyProfile.logoBase64 || "";

      let patchUrl =
        companyProfile.patchUrl || "";

      const logoFile =
        document.getElementById(
          "companyLogoUpload"
        ).files[0];

      console.log(
        "Selected logo file:",
        logoFile
      );

      if (logoFile) {

        logoUrl =
          await uploadCompanyLogo(
            logoFile
          );

        logoBase64 =
          await fileToBase64(
            logoFile
          );

        console.log(
          "Base64 length:",
          logoBase64?.length
        );

        console.log(
          "Base64 starts with:",
          logoBase64?.substring(0, 30)
        );
      }

      const patchFile =
        document.getElementById(
          "companyPatchUpload"
        ).files[0];

      if (patchFile) {

        patchUrl =
          await uploadCompanyPatch(
            patchFile
          );
      }

      const profile = {
        companyName:
          document.getElementById(
            "companyName"
          ).value,

        phone:
          document.getElementById(
            "companyPhone"
          ).value,

        email:
          document.getElementById(
            "companyEmail"
          ).value,

        website:
          document.getElementById(
            "companyWebsite"
          ).value,

        licenseNumber:
          document.getElementById(
            "companyLicenseNumber"
          ).value,

        address:
          document.getElementById(
            "companyAddress"
          ).value,

        city:
          document.getElementById(
            "companyCity"
          ).value,

        state:
          document.getElementById(
            "companyState"
          ).value,

        zip:
          document.getElementById(
            "companyZip"
          ).value,

        logoUrl,
        logoBase64,
        patchUrl,

        mileageThreshold:
          Number(
            document.getElementById(
              "mileageThreshold"
            ).value
          ) || 25,

        createdAt:
          companyProfile.createdAt ??
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      };

      await setDoc(
        doc(
          db,
          "tenants",
          tenantId,
          "settings",
          "companyProfile"
        ),
        profile,
        { merge: true }
      );
      companyProfile = profile;
      window.companyProfile =
        companyProfile;

      return companyProfile;

      alert(
        "Company profile saved."
      );

    } catch (error) {

      console.error(
        "Save company profile error:",
        error
      );

      alert(
        "Unable to save company profile."
      );
    }

  };

window.loadCompanyProfile =
  async function () {

    try {

      const docRef = doc(
        db,
        "tenants",
        tenantId,
        "settings",
        "companyProfile"
      );

      const docSnap =
        await getDoc(docRef);

      if (!docSnap.exists())
        return;

      companyProfile =
        docSnap.data();

      window.companyProfile =
        companyProfile;

      console.log(
        "COMPANY PROFILE:",
        companyProfile
      );

      document.getElementById(
        "companyName"
      ).value =
        companyProfile.companyName || "";

      document.getElementById(
        "companyPhone"
      ).value =
        companyProfile.phone || "";

      document.getElementById(
        "companyEmail"
      ).value =
        companyProfile.email || "";

      document.getElementById(
        "companyWebsite"
      ).value =
        companyProfile.website || "";

      document.getElementById(
        "companyLicenseNumber"
      ).value =
        companyProfile.licenseNumber || "";

      document.getElementById(
        "companyAddress"
      ).value =
        companyProfile.address || "";

      document.getElementById(
        "companyCity"
      ).value =
        companyProfile.city || "";

      document.getElementById(
        "companyState"
      ).value =
        companyProfile.state || "";

      document.getElementById(
        "companyZip"
      ).value =
        companyProfile.zip || "";

      document.getElementById(
        "mileageThreshold"
      ).value =
        companyProfile.mileageThreshold || 25;

    } catch (error) {

      console.error(
        "Load company profile error:",
        error
      );
    }
   if (companyProfile.logoBase64) {

  const logoPreview =
    document.getElementById(
      "companyLogoPreview"
    );

  logoPreview.src =
    companyProfile.logoBase64;

  logoPreview.style.display =
    "block";
}

const headerLogo =
  document.getElementById(
    "clientLogoHeader"
  );

if (
  headerLogo &&
  companyProfile.logoBase64
) {

  headerLogo.src =
    companyProfile.logoBase64;

  headerLogo.classList.remove(
    "hidden"
  );

}

    if (companyProfile.patchUrl) {

      const patchPreview =
        document.getElementById(
          "companyPatchPreview"
        );

      patchPreview.src =
        companyProfile.patchUrl;

      patchPreview.style.display =
        "block";
    }
  };

window.uploadCompanyLogo =
  async function (file) {

    const storageRef =
      ref(
        storage,
        `company-assets/${tenantId}/logo`
      );

    await uploadBytes(
      storageRef,
      file
    );

    return await getDownloadURL(
      storageRef
    );
  };

window.uploadCompanyPatch =
  async function (file) {

    const storageRef =
      ref(
        storage,
        `company-assets/${tenantId}/patch`
      );

    await uploadBytes(
      storageRef,
      file
    );

    return await getDownloadURL(
      storageRef
    );
  };

window.openSupplementModal =
  async function () {

    console.log(
      "Current Incident:",
      window.currentIncident
    );

    const incident =
      window.currentIncident;

    if (!incident) {
      alert(
        "No incident selected."
      );
      return;
    }

    document.getElementById(
      "supplementIncidentId"
    ).value =
      incident.id;

    document.getElementById(
      "supplementCaseNumber"
    ).value =
      incident.caseNumber;

    const supplementNumber =
      await getNextSupplementNumber(
        incident.id
      );

    document.getElementById(
      "supplementNumber"
    ).value =
      supplementNumber;

    document.getElementById(
      "viewIncidentModal"
    ).style.display =
      "none";

    document.getElementById(
      "supplementModal"
    ).style.display =
      "block";
  };


window.closeSupplementModal =
  function () {

    document.getElementById(
      "supplementModal"
    ).style.display =
      "none";

    document.getElementById(
      "viewIncidentModal"
    ).style.display =
      "block";
  };

window.loadSupplements =
  async function (
    incidentId
  ) {
    const container =
      document.getElementById(
        "supplementsContainer"
      );

    if (!container) return;

    container.innerHTML =
      "<p>Loading supplements...</p>";

    try {
     const result =
  await loadIncidentSupplements(
    incidentId
  );

if (!result.success) {

  container.innerHTML =
    `<p>${result.message}</p>`;

  return;

}

if (!result.supplements.length) {

  container.innerHTML =
    "<p>No supplemental reports.</p>";

  return;

}

container.innerHTML = "";

result.supplements.forEach(s => {

    const created =
      s.createdAt?.toDate
        ? s.createdAt
            .toDate()
            .toLocaleString()
        : "Unknown Date";

    container.innerHTML += `
      ...
    `;

});
    }
    catch (err) {
      console.error(
        "Error loading supplements:",
        err
      );

      container.innerHTML =
        "<p>Error loading supplements.</p>";
    }
  };

window.viewSupplement =
  async function (
    incidentId,
    supplementId
  ) {

    const snap =
      await getDoc(
        doc(
          db,
          "incidentReports",
          incidentId,
          "supplements",
          supplementId
        )
      );

    if (!snap.exists()) {
      alert(
        "Supplement not found."
      );
      return;
    }

    const s =
      snap.data();

    document.getElementById(
      "supplementViewerContent"
    ).innerHTML = `
    <p>
      <strong>
        Case Number:
      </strong>
      ${s.caseNumber}
    </p>

    <p>
      <strong>
        Supplement:
      </strong>
      ${s.supplementId}
    </p>

    <p>
      <strong>
        Officer:
      </strong>
      ${s.officerName}
    </p>

    <p>
      <strong>
        Date:
      </strong>
      ${s.createdAt?.toDate
        ? s.createdAt
          .toDate()
          .toLocaleString()
        : ""
      }
    </p>

    <hr>

    <h3>
      Narrative
    </h3>

    <pre
      style="
        white-space: pre-wrap;
        font-family: inherit;
      "
    >
${s.narrative}
    </pre>
  `;

    document.getElementById(
      "viewIncidentModal"
    ).style.display =
      "none";

    document.getElementById(
      "viewSupplementModal"
    ).style.display =
      "block";
  };

window.getNextSupplementNumber =
  async function (
    incidentId
  ) {

    const result =
      await getNextSupplementNumber(
        incidentId
      );

    if (!result.success) {

      console.error(
        result.message
      );

      return "001";

    }

    return result.supplementNumber;

  };

window.saveSupplement =
  async function () {

    const incidentId =
      document.getElementById(
        "supplementIncidentId"
      ).value;

    const supplementId =
      document.getElementById(
        "supplementNumber"
      ).value;

    const narrative =
      document.getElementById(
        "supplementNarrative"
      ).value;

   const result =
  await saveIncidentSupplement({

    incidentId,

    supplementId,

    caseNumber,

    narrative,

    officerId:
      currentOfficer.id,

    officerName:
      currentOfficer.name

  });

if (!result.success) {

  alert(result.message);

  return;

}
    await addReviewHistory(
      incidentId,
      "Supplement Added",
      `Supplement ${supplementId}`
    );

    alert(
      `Supplement ${supplementId} saved.`
    );

    closeSupplementModal();

    loadSupplements(
      incidentId
    );
    document.getElementById(
      "supplementNarrative"
    ).value = "";
  };

window.closeSupplementViewer =
  function () {
    document.getElementById(
      "viewSupplementModal"
    ).style.display =
      "none";

    document.getElementById(
      "viewIncidentModal"
    ).style.display =
      "block";
  };

window.showMyReports =
  async function () {

    const drafts =
      incidentReports.filter(
        r =>
          r.officerId ===
          currentOfficer.id &&
          r.status ===
          "draft"
      );

    renderDraftReports(
      drafts
    );
  };

window.loadMyReports =
  function () {

    console.log(
      "All Incident Reports:",
      incidentReports
    );

    console.log(
      "Current Officer:",
      currentOfficer.id
    );

    const drafts =
      incidentReports.filter(
        r =>
          r.officerId ===
          currentOfficer.id &&
          r.status ===
          "draft"
      );

    console.log(
      "Drafts:",
      drafts
    );

    let myReports =
      incidentReports.filter(
        r =>
          r.officerId ===
          currentOfficer.id &&
          r.status !==
          "draft"
      );

    if (
      window.currentReportFilter !==
      "all"
    ) {
      myReports =
        myReports.filter(
          r =>
            r.status ===
            window.currentReportFilter
        );
    }

    console.log(
      "My Reports:",
      myReports
    );

    renderDraftReports(
      drafts
    );

    renderSubmittedReports(
      myReports
    );
  };

function renderDraftReports(
  drafts
) {

  const tbody =
    document.getElementById(
      "draftReportsBody"
    );

  tbody.innerHTML = "";

  drafts.forEach(report => {

    tbody.innerHTML += `
      <tr>
        <td>
          ${report.createdAt
        ?.toDate()
        ?.toLocaleDateString() ||
      ""
      }
        </td>

        <td>
          ${report.incidentType}
        </td>

        <td>

          <button
            onclick="
              editDraft(
                '${report.id}'
              )
            "
          >
            Continue
          </button>

        </td>
      </tr>
    `;

  });

}

window.editDraft =
  async function (
    reportId
  ) {

    try {

      const result =
  await loadIncidentDraft(
    reportId
  );

if (!result.success) {

  alert(
    result.message
  );

  return;

}

const report =
  result.report;

      document.getElementById(
        "editingIncidentId"
      ).value =
        reportId;

      document.getElementById(
        "incidentType"
      ).value =
        report.incidentType || "";

      document.getElementById(
        "incidentSeverity"
      ).value =
        report.severity || "";

      document.getElementById(
        "incidentNarrative"
      ).value =
        report.narrative || "";

      document.getElementById(
        "incidentAgency"
      ).value =
        report.lawEnforcement
          ?.agency || "";

      document.getElementById(
        "incidentAgencyOfficer"
      ).value =
        report.lawEnforcement
          ?.officer || "";

      document.getElementById(
        "incidentAgencyBadge"
      ).value =
        report.lawEnforcement
          ?.badge || "";

      document.getElementById(
        "incidentAgencyCase"
      ).value =
        report.lawEnforcement
          ?.caseNumber || "";

      document.getElementById(
        "personsContainer"
      ).innerHTML = "";

      report.persons?.forEach(
        person => {

          addPerson();

          const cards =
            document.querySelectorAll(
              ".person-card"
            );

          const card =
            cards[
            cards.length - 1
            ];

          card.querySelector(
            ".personRole"
          ).value =
            person.role || "";

          card.querySelector(
            ".personFirstName"
          ).value =
            person.firstName || "";

          card.querySelector(
            ".personMiddleName"
          ).value =
            person.middleName || "";

          card.querySelector(
            ".personLastName"
          ).value =
            person.lastName || "";

          card.querySelector(
            ".personAlias"
          ).value =
            person.alias || "";

          card.querySelector(
            ".personDOB"
          ).value =
            person.dob || "";

          card.querySelector(
            ".personSex"
          ).value =
            person.sex || "";

          card.querySelector(
            ".personHeightFeet"
          ).value =
            person.heightFeet || "";

          card.querySelector(
            ".personHeightInches"
          ).value =
            person.heightInches || "";

          card.querySelector(
            ".personWeight"
          ).value =
            person.weight || "";

          card.querySelector(
            ".personRace"
          ).value =
            person.race || "";

          card.querySelector(
            ".personEthnicity"
          ).value =
            person.ethnicity || "";

          card.querySelector(
            ".personHairColor"
          ).value =
            person.hairColor || "";

          card.querySelector(
            ".personEyeColor"
          ).value =
            person.eyeColor || "";

          card.querySelector(
            ".personIdType"
          ).value =
            person.idType || "";

          card.querySelector(
            ".personIdState"
          ).value =
            person.idState || "";

          card.querySelector(
            ".personIdNumber"
          ).value =
            person.idNumber || "";

          card.querySelector(
            ".personHomePhone"
          ).value =
            person.homePhone || "";

          card.querySelector(
            ".personCellPhone"
          ).value =
            person.cellPhone || "";

          card.querySelector(
            ".personWorkPhone"
          ).value =
            person.workPhone || "";

          card.querySelector(
            ".personStreet"
          ).value =
            person.street || "";

          card.querySelector(
            ".personCity"
          ).value =
            person.city || "";

          card.querySelector(
            ".personAddressState"
          ).value =
            person.addressState || "";

          card.querySelector(
            ".personZip"
          ).value =
            person.zip || "";

          card.querySelector(
            ".personEmployer"
          ).value =
            person.employer || "";

          card.querySelector(
            ".personEmail"
          ).value =
            person.email || "";

          card.querySelector(
            ".personPreferredContact"
          ).value =
            person.preferredContact || "";
        }
      );

      incidentVehicles =
        report.vehicles || [];

      renderIncidentVehicles();

      if (
        report.supervisorComments
      ) {
        alert(
          `Supervisor Comments:\n\n${report.returnComments}`
        );
      }

      if (
        report.supervisorComments
      ) {

        document.getElementById(
          "supervisorCommentsCard"
        ).style.display =
          "block";

        document.getElementById(
          "supervisorCommentsText"
        ).textContent =
          report.supervisorComments;

      } else {

        document.getElementById(
          "supervisorCommentsCard"
        ).style.display =
          "none";

      }
      const attachments =
        await loadIncidentAttachments(
          reportId
        );
      renderIncidentAttachments(
        attachments
      );

      showOfficerIncidentReport();

    } catch (error) {

      console.error(
        "Edit Draft Error:",
        error
      );

      alert(
        "Unable to open draft."
      );

    }

  };

window.loadIncidentReviewQueue =
  async function () {

    const container =
      document.getElementById(
        "incidentReviewList"
      );

    container.innerHTML =
      "<p>Loading...</p>";

    try {

      const result =
  await loadIncidentReviewQueueData();

if (!result.success) {

  container.innerHTML =
    `<p>${result.message}</p>`;

  return;

}

if (!result.incidentReports.length) {

  container.innerHTML =
    "<p>No reports awaiting review.</p>";

  return;

}

container.innerHTML =
  result.incidentReports
    .map(incident => {

            return `

            <div
              class="dashboard-card"
              style="
                margin-bottom:12px;
              "
            >

              <strong>
                ${incident.caseNumber}
              </strong>

              <br>

              Officer:
              ${incident.officerName}

              <br>

              Type:
              ${incident.incidentType}

              <br>

              Site:
              ${incident.siteName}

              <br>

              Status:
              ${getIncidentStatusBadge(
              incident.status
            )}

              <br><br>

              <button
                onclick="viewIncident('${incident.id}')"
              >
                View
              </button>

            </div>

          `;

          })
          .join("");

    } catch (error) {

      console.error(
        "Review Queue Error:",
        error
      );

      container.innerHTML =
        "<p>Error loading review queue.</p>";
    }
  };

window.approveIncident =
  async function (id) {

    if (
      !confirm(
        "Approve this report?"
      )
    ) {
      return;
    }

    const result =
      await approveIncidentReport({

        reportId: id,

        approvedBy:
          currentEmployee.id,

        approvedByName:
          currentEmployee.name

      });

    if (!result.success) {

      alert(result.message);

      return;

    }

    await addReviewHistory(
      id,
      "approved"
    );

    alert(
      "Report approved."
    );

    closeIncidentModal();

    await loadIncidentReviewQueue();

  };

window.returnIncident =
  async function (id) {

    try {

      const comments =
        document
          .getElementById(
            "supervisorComments"
          )
          .value
          .trim();

      if (!comments) {
        alert(
          "Please provide correction instructions."
        );
        return;
      }

      if (
        !confirm(
          "Return this report for corrections?"
        )
      ) {
        return;
      }

      const result =
  await returnIncidentReport({

    reportId: id,

    supervisorComments:
      comments,

    returnedBy:
      currentEmployee.id,

    returnedByName:
      currentEmployee.name

  });

if (!result.success) {

  alert(result.message);

  return;

}

await addReviewHistory(
  id,
  "returned",
  comments
);

const report =
  result.report;

      await addDoc(
        collection(
          db,
          "notifications"
        ),
        {
          officerId:
            report.officerId,

          incidentId:
            id,

          title:
            "Report Returned",

          message:
            `Case ${report.caseNumber ||
            "Draft Report"
            } was returned for corrections.`,

          read: false,

          createdAt:
            serverTimestamp()
        }
      );

      alert(
        "Report returned to officer."
      );

      closeIncidentModal();

      await loadIncidentReviewQueue();

    } catch (error) {

      console.error(
        "Return Error:",
        error
      );

      alert(
        "Unable to return report."
      );
    }
  };

let returningIncidentId = null;

window.openReturnReportModal =
  function (incidentId) {
    returningIncidentId = incidentId;

    document.getElementById(
      "returnComment"
    ).value = "";

    document.getElementById(
      "returnReportModal"
    ).style.display = "flex";
  };

window.closeReturnReportModal =
  function () {
    document.getElementById(
      "returnReportModal"
    ).style.display = "none";

    returningIncidentId = null;
  };

window.submitReturnReport =
  async function () {

    const comment =
      document.getElementById(
        "returnComment"
      ).value.trim();

    if (!comment) {
      alert(
        "Please provide correction instructions."
      );
      return;
    }

    try {

      const result =
  await returnIncidentReport({

    reportId:
      returningIncidentId,

    comments:
      comment,

    returnedBy:
      currentEmployee.id,

    returnedByName:
      currentOfficer?.name ||
      auth.currentUser.displayName ||
      "Supervisor"

  });

if (!result.success) {

  alert(result.message);

  return;

}
     await addReviewHistory(
  returningIncidentId,
  "Returned for corrections",
  comment
);

      await addDoc(
        collection(
          db,
          "notifications"
        ),
        {
          userId:
            report.officerId,

          type:
            "report_returned",

          title:
            "Incident Report Returned",

          message:
            `Case ${report.caseNumber} was returned for corrections.`,

          incidentId:
            returningIncidentId,

          read: false,

          createdAt:
            serverTimestamp()
        }
      );

      closeReturnReportModal();

      alert(
        "Report returned for corrections."
      );

    } catch (error) {
      console.error(error);

      alert(
        "Unable to return report."
      );
    }
  };

window.renderSubmittedReports =
  function (reports) {

    const tbody =
      document.getElementById(
        "submittedReportsBody"
      );

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!reports.length) {
      tbody.innerHTML = `
      <tr>
        <td colspan="4">
          No submitted reports.
        </td>
      </tr>
    `;
      return;
    }

    reports.forEach(report => {

      const date =
        report.submittedAt?.toDate
          ? report
            .submittedAt
            .toDate()
            .toLocaleDateString()
          : "-";

      const type =
        report.status ===
          "returned"
          ? `
          ${report.incidentType}
          <br>
          <small style="color:red;">
            Returned for Corrections
          </small>
          ${report.returnComments
            ? `<br><small>
                   Supervisor:
                   ${report.returnComments}
                 </small>`
            : ""
          }
        `
          : report.incidentType;

      tbody.innerHTML += `
      <tr>
        <td>
          ${report.caseNumber}
        </td>

        <td>
          ${date}
        </td>

        <td>
          ${type}
        </td>

        <td>
        <td>

  <button
    onclick="
      editDraft(
        '${report.id}'
      )
    ">
    View
  </button>

  <button
    class="btn btn-secondary"
    onclick="
      viewReviewHistory(
        '${report.id}'
      )
    ">
    History
  </button>

</td>
      </td>
      </tr>
    `;
    });

  };

window.listenForNotifications =
  function () {

    console.log(
      "Current Employee:",
      currentEmployee
    );

    const user =
      auth.currentUser;

    if (!user) return;

    onSnapshot(
      query(
        collection(
          db,
          "notifications"
        ),
        where(
          "officerId",
          "==",
          currentEmployee.id
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      ),
      (snapshot) => {

        console.log(
          "Notifications found:",
          snapshot.size
        );

        const container =
          document.getElementById(
            "notificationsList"
          );
        container.innerHTML =
          "";

        let unread = 0;

        snapshot.forEach(
          (docSnap) => {

            const n =
              docSnap.data();

            if (!n.read) {
              unread++;
            }

            const div =
              document.createElement(
                "div"
              );

            div.className =
              `notification-item ${!n.read
                ? "unread"
                : ""
              }`;

            div.innerHTML = `
            <strong>
              ${n.title}
            </strong>
            <br>
            ${n.message}
            <div class="notification-time">
              ${n.createdAt
                ?.toDate()
                .toLocaleString() ||
              ""
              }
            </div>
          `;

            div.onclick =
              () =>
                openNotification(
                  docSnap.id,
                  n
                );

            container.appendChild(
              div
            );
          }
        );

        const badge =
          document.getElementById(
            "notificationBadge"
          );

        badge.textContent =
          unread;

        badge.style.display =
          unread > 0
            ? "inline-block"
            : "none";
      }
    );
  };

window.openNotification =
  async function (
    notificationId,
    notification
  ) {

    if (!notification.read) {

      await updateDoc(
        doc(
          db,
          "notifications",
          notificationId
        ),
        {
          read: true,
          readAt:
            serverTimestamp()
        }
      );
    }

    if (
      notification.incidentId
    ) {

      editDraft(
        notification.incidentId
      );
    }
  };

window.voidIncident =
  async function (
    reportId
  ) {
    try {

      const reason =
        prompt(
          "Enter reason for voiding this report:"
        );

      if (reason === null) {
        return;
      }

      const result =
    await voidIncidentReport(
        reportId,
        reason,
        currentEmployee
    );

if (!result.success) {

    throw new Error(
        result.message
    );
}

      alert(
        "Incident has been voided."
      );

      closeIncidentModal();

      loadIncidentReports?.();
      loadIncidentReviewQueue?.();

    } catch (err) {

      console.error(
        "Void Incident Error:",
        err
      );

      alert(
        "Unable to void incident."
      );
    }
  };

window.currentReportFilter =
  "all";

window.filterMyReports =
  function (status) {

    window.currentReportFilter =
      status;

    loadMyReports();
  };

window.closeReviewHistoryModal =
  function () {

    document.getElementById(
      "reviewHistoryModal"
    ).style.display = "none";

    document.getElementById(
      "historyTimeline"
    ).innerHTML = "";
  };

let incidentPhotoFiles = [];

document.getElementById(
  "incidentPhotos"
).addEventListener(
  "change",
  function (e) {

    console.log(
      "Photo input changed"
    );

    for (
      const file of e.target.files
    ) {
      incidentPhotoFiles.push(
        file
      );
    }

    console.log(
      "Incident photo count:",
      incidentPhotoFiles.length
    );

    previewIncidentPhotos();

    // allows selecting the same file again
    e.target.value = "";
  }
);

function previewIncidentPhotos() {
  const files =
    document.getElementById(
      "incidentPhotos"
    ).files;

  const container =
    document.getElementById(
      "photoPreviewContainer"
    );

  container.innerHTML = "";

  [...files].forEach(file => {
    const reader =
      new FileReader();

    reader.onload = e => {
      const img =
        document.createElement(
          "img"
        );

      img.src =
        e.target.result;

      img.onclick =
        () =>
          openEvidenceViewer(
            e.target.result
          );

      img.style.width =
        "100px";

      img.style.height =
        "100px";

      img.style.objectFit =
        "cover";

      img.style.margin =
        "5px";

      img.style.borderRadius =
        "8px";

      container.appendChild(
        img
      );
    };

    reader.readAsDataURL(
      file
    );
  });
}

async function uploadIncidentPhotos(
  incidentId
) {

  console.log(
    "uploadIncidentPhotos called"
  );

  console.log(
    "incidentPhotoFiles:",
    incidentPhotoFiles
  );

  console.log(
    "Length:",
    incidentPhotoFiles.length
  );

  console.log(
    "incidentPhotoFiles:",
    incidentPhotoFiles
  );

  console.log(
    "Length:",
    incidentPhotoFiles.length
  );

  const files =
    incidentPhotoFiles;
  console.log(
    "Files being uploaded:",
    files
  );

  if (!files.length) {
    return [];
  }
  const uploadedPhotos = [];

  for (const file of files) {
    const fileName =
      `${Date.now()}_${file.name}`;

    const storageRef = ref(
      storage,
      `incident-evidence/${incidentId}/${fileName}`
    );

    await uploadBytes(
      storageRef,
      file
    );

    const downloadURL =
      await getDownloadURL(
        storageRef
      );

    const imageBase64 =
      await fileToBase64(
        file
      );

    uploadedPhotos.push({
      type: "photo",
      fileName,
      originalName:
        file.name,
      downloadURL,
      imageBase64,
      uploadedBy:
        currentOfficer.id,
      uploadedAt:
        serverTimestamp()
    });
  }

  return uploadedPhotos;
}


function clearIncidentPhotos() {
  console.log(
    "Clearing incident photos..."
  );

  incidentPhotoFiles = [];

  document.getElementById(
    "incidentPhotos"
  ).value = "";

  document.getElementById(
    "photoPreviewContainer"
  ).innerHTML = "";
}

function renderIncidentAttachments(
  attachments
) {
  const container =
    document.getElementById(
      "existingPhotoContainer"
    );

  if (!container) return;

  container.innerHTML = "";

  attachments.forEach(
    photo => {

      const img =
        document.createElement(
          "img"
        );
      img.src =
        photo.downloadURL;

      img.onclick =
        () =>
          openEvidenceViewer(
            photo.downloadURL
          );

      img.src =
        photo.downloadURL;

      img.style.width =
        "100px";

      img.style.height =
        "100px";

      img.style.objectFit =
        "cover";

      img.style.cursor =
        "pointer";

      img.onclick =
        () =>
          openEvidenceViewer(
            photo.downloadURL
          );

      container.appendChild(
        img
      );

      img.style.width =
        "100px";

      img.style.height =
        "100px";

      img.style.objectFit =
        "cover";

      img.style.margin =
        "5px";

      img.style.borderRadius =
        "8px";

      img.style.cursor =
        "pointer";

      container.appendChild(
        img
      );
    }
  );
}

window.openEvidenceViewer =
  function (imageUrl) {

    document.getElementById(
      "evidenceViewerImage"
    ).src =
      imageUrl;

    document.getElementById(
      "evidenceViewerModal"
    ).style.display =
      "block";

  };

window.closeEvidenceViewer =
  function () {

    document.getElementById(
      "evidenceViewerModal"
    ).style.display =
      "none";

    document.getElementById(
      "evidenceViewerImage"
    ).src =
      "";

  };

window.showNextPhoto =
  function () {

    if (
      !photoGallery.length
    ) return;

    currentPhotoIndex =
      (currentPhotoIndex + 1) %
      photoGallery.length;

    document.getElementById(
      "photoViewerImage"
    ).src =
      photoGallery[
        currentPhotoIndex
      ].downloadURL;

    updatePhotoCounter();
  };

window.showPreviousPhoto =
  function () {

    if (
      !photoGallery.length
    ) return;

    currentPhotoIndex =
      currentPhotoIndex === 0
        ? photoGallery.length - 1
        : currentPhotoIndex - 1;

    document.getElementById(
      "photoViewerImage"
    ).src =
      photoGallery[
        currentPhotoIndex
      ].downloadURL;

    updatePhotoCounter();
  };

function updatePhotoCounter() {

  const counter =
    document.getElementById(
      "photoCounter"
    );

  if (!counter) return;

  counter.textContent =
    `${currentPhotoIndex + 1}
     of
     ${photoGallery.length}`;
}

window.openCurrentPhoto =
  function () {

    const imageUrl =
      photoGallery[
        currentPhotoIndex
      ].downloadURL;

    if (!imageUrl) return;

    window.open(
      imageUrl,
      "_blank"
    );
  };

window.downloadCurrentPhoto =
  function () {

    const photo =
      photoGallery[
      currentPhotoIndex
      ];

    if (!photo) return;

    // Incident photo
    if (photo.downloadURL) {
      window.open(
        photo.downloadURL,
        "_blank"
      );
      return;
    }

    // Base64 photo
    const image =
      photo.imageBase64 ||
      photo;

    if (!image) return;

    const a =
      document.createElement("a");

    a.href = image;
    a.download =
      "photo.jpg";

    document.body.appendChild(
      a
    );

    a.click();

    document.body.removeChild(
      a
    );
  };

function renderAttachments() {
  console.log(
    "Rendering:",
    photoGallery
  );

  const attachmentsContainer =
    document.getElementById(
      "reviewAttachmentsContainer"
    );

  if (!attachmentsContainer)
    return;

  if (!photoGallery.length) {

    attachmentsContainer.innerHTML =
      "<p>No attachments.</p>";

    return;
  }

  attachmentsContainer.innerHTML =
    photoGallery
      .map(
        (attachment, index) => `
          <img
            src="${attachment.downloadURL}"
            class="evidence-thumbnail"
            onclick="
              openPhotoViewer(
                ${index}
              )
            ">
        `
      )
      .join("");
}

document
  .getElementById("preShiftPhoto")
  ?.addEventListener(
    "change",
    function (e) {
      const file =
        e.target.files[0];

      if (!file) return;

      const reader =
        new FileReader();

      reader.onload =
        function (event) {
          const img =
            document.getElementById(
              "preShiftPreview"
            );

          img.src =
            event.target.result;

          img.style.display =
            "block";
        };

      reader.readAsDataURL(
        file
      );
    }
  );

window.viewPreShiftPhoto =
  function (timeEntryId) {

    const entry =
      timeEntries.find(
        t => t.id === timeEntryId
      );

    if (
      !entry ||
      !entry.preShiftPhoto
    ) {
      return;
    }

    photoGallery = [
      entry.preShiftPhoto
    ];

    currentPhotoIndex = 0;

    document.getElementById(
      "photoViewerImage"
    ).src =
      entry.preShiftPhoto
        .imageBase64;

    document.getElementById(
      "photoViewerModal"
    ).style.display =
      "flex";
  };

document
  .getElementById("postShiftPhoto")
  ?.addEventListener(
    "change",
    function (e) {

      const file =
        e.target.files[0];

      if (!file) return;

      const reader =
        new FileReader();

      reader.onload =
        function (event) {

          const img =
            document.getElementById(
              "postShiftPreview"
            );

          img.src =
            event.target.result;

          img.style.display =
            "block";
        };

      reader.readAsDataURL(
        file
      );
    }
  );

window.loadMileageReport =
  async function () {
    console.log(
      "Mileage Report:",
      mileageReportShifts
    );
    try {
      const q = query(
        collection(db, "shifts"),
        orderBy("startTime", "desc")
      );

      const snapshot =
        await getDocs(q);

      mileageReportShifts =
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      window.mileageReportShifts =
        mileageReportShifts;

      console.log(
        "Mileage Report Shifts:",
        mileageReportShifts
      );

      renderMileageReport();

    } catch (error) {
      console.error(
        "Mileage Report Error:",
        error
      );
    }
  };

window.renderMileageReport =
  function () {

    console.log(
      "Mileage Report Shifts:",
      mileageReportShifts
    );

    let filteredShifts =
      mileageReportShifts.filter(
        shift =>
          shift.mileageStatus ===
          "Calculated"
      );

    const filter =
      document.getElementById(
        "mileageReportFilter"
      ).value;

    if (filter === "incentive") {
      filteredShifts =
        filteredShifts.filter(
          shift =>
            shift.mileageIncentive
        );
    }

    if (filter === "week") {

      const today =
        new Date();

      const weekAgo =
        new Date();

      weekAgo.setDate(
        today.getDate() - 7
      );

      filteredShifts =
        filteredShifts.filter(
          shift =>
            new Date(
              shift.startTime
            ) >= weekAgo
        );
    }

    if (filter === "month") {

      const now =
        new Date();

      filteredShifts =
        filteredShifts.filter(
          shift => {

            const shiftDate =
              new Date(
                shift.startTime
              );

            return (
              shiftDate.getMonth() ===
              now.getMonth() &&
              shiftDate.getFullYear() ===
              now.getFullYear()
            );
          }
        );
    }

    const incentiveShifts =
      filteredShifts.filter(
        shift =>
          shift.mileageIncentive
      );

    const totalMiles =
      incentiveShifts.reduce(
        (sum, shift) =>
          sum +
          Number(
            shift.mileageDistance || 0
          ),
        0
      );

    const uniqueOfficers =
      new Set(
        incentiveShifts.map(
          shift => shift.employeeId
        )
      );

    document.getElementById(
      "totalMileageShifts"
    ).textContent =
      incentiveShifts.length;

    document.getElementById(
      "totalMileageMiles"
    ).textContent =
      totalMiles.toFixed(1);

    document.getElementById(
      "totalMileageOfficers"
    ).textContent =
      uniqueOfficers.size;

    let html = `
<table class="dashboard-table">
<thead>
<tr>
<th>Employee</th>
<th>Site</th>
<th>Date</th>
<th>Distance</th>
<th>Threshold</th>
<th>Incentive</th>
</tr>
</thead>
<tbody>
`;

    filteredShifts.forEach(
      shift => {

        html += `
      <tr>
        <td>${shift.employeeName}</td>
        <td>${shift.siteName}</td>
        <td>
          ${new Date(
          shift.startTime
        ).toLocaleDateString()}
        </td>
        <td>
          ${Number(
          shift.mileageDistance || 0
        ).toFixed(1)} mi
        </td>
        <td>
          ${shift.mileageThreshold} mi
        </td>
        <td>
          ${shift.mileageIncentive
            ? "🚗 Yes"
            : "—"
          }
        </td>
      </tr>
    `;
      }
    );

    html += `
</tbody>
</table>
`;

    document.getElementById(
      "mileageReportTable"
    ).innerHTML = html;

  };

window.toggleRepeatOptions =
  function () {

    const section =
      document.getElementById(
        "repeatOptions"
      );

    const checked =
      document.getElementById(
        "repeatSchedule"
      ).checked;

    section.classList.toggle(
      "hidden",
      !checked
    );
  };

function getRepeatDays() {
  return Array.from(
    document.querySelectorAll(
      ".repeatDay:checked"
    )
  ).map(cb => Number(cb.value));
}



async function confirmDeleteShift() {
  console.log("Reached confirmDeleteShift section");

  const deleteMode =
    document.querySelector(
      'input[name="deleteRecurringMode"]:checked'
    )?.value || "occurrence";

  if (
    !deletingRecurring ||
    deleteMode === "occurrence"
  ) {

    await deleteDoc(
      doc(
        db,
        "shifts",
        deletingShiftId
      )
    );

  } else {

    const batch =
      writeBatch(db);

    const seriesQuery =
      query(
        collection(
          db,
          "shifts"
        ),
        where(
          "seriesId",
          "==",
          deletingSeriesId
        )
      );

    const snapshot =
      await getDocs(
        seriesQuery
      );

    const now =
      new Date();

    for (
      const shiftDoc of
      snapshot.docs
    ) {

      const shift =
        shiftDoc.data();

      if (
        new Date(
          shift.startTime
        ) < now
      ) {
        continue;
      }

      batch.delete(
        shiftDoc.ref
      );

    }

    await batch.commit();

  }

  deletingShiftId = null;
  deletingSeriesId = null;
  deletingRecurring = false;

  closeDeleteShiftModal();  

}

function closeDeleteShiftModal() {

  document
    .getElementById(
      "deleteShiftModal"
    )
    .classList.add(
      "hidden"
    );

  deletingShiftId = null;
  deletingSeriesId = null;
  deletingRecurring = false;

}

async function extendRecurringSeries(seriesId) {

  try {

    const q = query(
  collection(db, "shifts"),
  where("seriesId", "==", seriesId)
);

const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("Recurring series not found.");
      return;
    }

    const shifts = [];

    snapshot.forEach(doc => {
      shifts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by start time
    shifts.sort((a, b) =>
      new Date(a.startTime) -
      new Date(b.startTime)
    );

    const firstShift = shifts[0];
    const lastShift = shifts[shifts.length - 1];

    console.log("First shift:", firstShift);

    const currentEnd = lastShift.endTime
  ? lastShift.endTime.substring(0, 10)
  : lastShift.startTime.substring(0, 10);

const newEndDate = prompt(
  `Current series ends on ${currentEnd}.\n\n` +
  `Enter the new ending date (YYYY-MM-DD):`,
  currentEnd
);

if (!newEndDate) {
  return;
}

const requestedEnd = new Date(newEndDate);

if (isNaN(requestedEnd.getTime())) {
  alert("Invalid date.");
  return;
}

const currentEndDate = new Date(currentEnd);

if (requestedEnd <= currentEndDate) {
  alert("The new end date must be after the current end date.");
  return;
}

const generatedDates = generateRecurringDates(
  firstShift.startTime,
  firstShift.repeatDays,
  newEndDate
);

const lastStart = new Date(lastShift.startTime);

const newDates = generatedDates.filter(
  date => date > lastStart
);

const shiftTemplate = {
  ...firstShift,
  repeatEndDate: newEndDate,
  createdAt: new Date().toISOString()
};

// Remove fields we don't want to copy
delete shiftTemplate.id;
let createdCount = 0;

for (const date of newDates) {

  const newStart = applyTimeToDate(
    firstShift.startTime,
    date
  );

  const newEnd = applyTimeToDate(
    firstShift.endTime,
    date
  );

  const occurrenceStart =
    formatLocalDateTime(newStart);

  const occurrenceEnd =
    formatLocalDateTime(newEnd);

 const duplicate = shifts.some(
  shift =>
    shift.employeeId === firstShift.employeeId &&
    shift.siteId === firstShift.siteId &&
    shift.startTime === occurrenceStart &&
    shift.endTime === occurrenceEnd
);

if (duplicate) {
  console.log("Skipping duplicate:", occurrenceStart);
  continue;
}

const conflict = shifts.some(
  shift =>
    shift.employeeId === firstShift.employeeId &&
    timesOverlap(
      occurrenceStart,
      occurrenceEnd,
      shift.startTime,
      shift.endTime
    )
);

if (conflict) {
  console.log("Skipping conflict:", occurrenceStart);
  continue;
}

await addDoc(
  collection(db, "shifts"),
  {
    ...shiftTemplate,
    startTime: occurrenceStart,
    endTime: occurrenceEnd,
    seriesId: firstShift.seriesId
  }
);

shifts.push({
  ...shiftTemplate,
  startTime: occurrenceStart,
  endTime: occurrenceEnd,
  seriesId: firstShift.seriesId
});

createdCount++;

}

for (const shift of shifts) {

  if (!shift.id) continue;

  await updateDoc(
    doc(db, "shifts", shift.id),
    {
      repeatEndDate: newEndDate
    }
  );

}

alert(
  `Series extended by ${createdCount} shifts.`
);

console.log("Generated Dates:", generatedDates);
console.log("New Dates:", newDates);

newDates.forEach((date, index) => {
  console.log(
    `${index + 1}:`,
    formatLocalDateTime(date)
  );
});

  } catch (error) {

    console.error(error);

    alert(
      "Unable to load recurring series."
    );

  }

}

function updateScheduleType() {

    const scheduleType =
        document.querySelector(
            'input[name="scheduleType"]:checked'
        ).value;

    const assignedSection =
        document.getElementById(
            "assignedOfficerSection"
        );

    const submitButton =
        document.getElementById(
            "scheduleSubmitButton"
        );

    if (scheduleType === "assigned") {

        assignedSection.style.display =
            "block";

        submitButton.textContent =
            "Create Shift";

        submitButton.onclick =
            createShift;

    } else {

        assignedSection.style.display =
            "none";

        submitButton.textContent =
            "Publish Open Shift";

        submitButton.onclick =
            createOpenShift;

    }

}

function updatePortalWelcome() {

  const welcome =
    document.getElementById(
      "portalWelcome"
    );

  const subtitle =
    document.getElementById(
      "portalSubtitle"
    );

  if (
    !welcome ||
    !subtitle ||
    !currentOfficer
  ) return;
  console.log(currentOfficer);

 welcome.textContent =
    `Welcome back, ${currentOfficer.name}!`;

  if (!currentOfficerShifts.length) {

    subtitle.textContent =
      "You have no scheduled shifts today.";

    return;

  }

  const now = new Date();

  const activeShift =
    currentOfficerShifts.find(
      shift =>
        new Date(shift.startTime) <= now &&
        new Date(shift.endTime) >= now
    );

  if (activeShift) {

    subtitle.textContent =
      `You are currently on duty at ${activeShift.siteName}.`;

    return;

  }

  const nextShift =
    currentOfficerShifts.find(
      shift =>
        new Date(shift.startTime) > now
    );

  if (nextShift) {

    const startTime =
      new Date(
        nextShift.startTime
      ).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
      });

    subtitle.textContent =
      `Your next shift starts at ${startTime} at ${nextShift.siteName}.`;

    return;

  }

  subtitle.textContent =
    "You have completed today's scheduled shifts.";

}

function loadOpenShifts() {

  onSnapshot(

    query(
      collection(db, "openShifts"),
      where("status", "==", "open")
    ),

    (snapshot) => {

      openShifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(
        "Open Shifts:",
        openShifts
      );

      renderOpenShifts();

    },

    (error) => {

      console.error(
        "Open Shift Listener:",
        error
      );

    }

  );

}

function loadClaimRequests() {

    onSnapshot(

        query(
            collection(db, "openShifts"),
            where("status", "==", "claimed")
        ),

        (snapshot) => {

            claimedShifts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            renderClaimRequests();

        }

    );

}

function renderOpenShifts() {

  const tbody =
    document.getElementById(
      "openShiftsTableBody"
    );

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!openShifts.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          No Open Shifts Published
        </td>
      </tr>
    `;

    return;

  }

  openShifts.forEach(shift => {

    const row =
      document.createElement("tr");

    row.innerHTML = `

    

      <td>${shift.siteName}</td>

      <td>${formatDate(shift.startTime)}</td>

      <td>
        ${formatTime(shift.startTime)}
        -
        ${formatTime(shift.endTime)}
      </td>

      <td>
        $${Number(
          shift.shiftPay
        ).toFixed(2)}
      </td>

      <td>${shift.classification}</td>

      <td>${shift.status}</td>

      <td>
      <button
        class="btn-danger"
        onclick="cancelOpenShift('${shift.id}')">
        Cancel
      </button>
    </td>

    `;

    tbody.appendChild(row);

  });

}

function renderClaimRequests() {

    const tbody =
        document.getElementById(
            "claimRequestsBody"
        );

    if (!tbody) return;

    if (claimedShifts.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    No claim requests.
                </td>
            </tr>
        `;

        return;

    }

    tbody.innerHTML =
        claimedShifts.map(shift => `

            <tr>

                <td>
                    ${shift.claimedByName}
                </td>

                <td>
                    ${shift.siteName}
                </td>

                <td>
                    ${formatDate(
                        shift.startTime
                    )}
                </td>

                <td>
                    ${formatTime(
                        shift.startTime
                    )}
                    -
                    ${formatTime(
                        shift.endTime
                    )}
                </td>

                <td>
                    ${shift.classification}
                </td>

                <td>

                    <button
                        onclick="approveClaim('${shift.id}')">

                        Approve

                    </button>

                    <button
                        onclick="declineClaim('${shift.id}')">

                        Decline

                    </button>

                </td>

            </tr>

        `).join("");

}

async function declineClaim(id) {

    const confirmed = confirm(
        "Decline this Marketplace claim?"
    );

    if (!confirmed) return;

    const result =
        await declineMarketplaceClaim(id);

    if (!result.success) {

        alert(result.message);

        return;

    }

    loadClaimRequests();

    alert(
        "Claim declined. The shift is available for other officers."
    );

}
window.declineClaim = declineClaim;

async function cancelOpenShift(id) {

    const confirmed = confirm(
        "Cancel this Open Shift?"
    );

    if (!confirmed) return;

    const result =
        await cancelMarketplaceShift(id);

    if (!result.success) {

        alert(result.message);
        return;

    }

    alert(result.message);

}
window.cancelOpenShift = cancelOpenShift;

function formatDate(dateString) {

  return new Date(dateString)
    .toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );

}

function formatTime(dateString) {

  return new Date(dateString)
    .toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit"
      }
    );

}

async function claimOpenShift(id) {

    const confirmed = confirm(
        "Claim this open shift?"
    );

    if (!confirmed) return;

    try {

        const result =
            await claimMarketplaceShift(
                db,
                id,
                currentEmployee
            );

        if (!result.success) {

            alert(result.message);
            return;

        }

        alert(result.message);

    } catch (error) {

        console.error(error);

        alert(
            "Unable to claim shift."
        );

    }

}

async function approveClaim(id) {

  try {
   
    const result =
    await approveMarketplaceClaim(
        db,
        id,
        {
            employees,
            sites,
            shifts,
            companyProfile
        }
    );

if (!result.success) {

    alert(result.message);
    return;

}

await logActivity(
    result.openShift.siteId,
    "MARKETPLACE_SHIFT_APPROVED",
    `${result.openShift.claimedByName} approved for ${result.openShift.siteName}`,
    "Supervisor",
    "marketplace"
);

loadClaimRequests();

alert(result.message);
  } catch (error) {

    console.error(error);

    alert(
      "Unable to approve Marketplace claim."
    );

  }

}

function toggleCommunicationForm() {

  const type =
    document.getElementById(
      "communicationType"
    ).value;

  document.getElementById(
    "activityReportForm"
  ).style.display =
    type === "activity"
      ? "block"
      : "none";

  document.getElementById(
    "siteNoteForm"
  ).style.display =
    type === "siteNote"
      ? "block"
      : "none";

  document.getElementById(
    "incidentForm"
  ).style.display =
    type === "incident"
      ? "block"
      : "none";

  const submitBtn =
    document.getElementById(
      "communicationSubmitBtn"
    );

  if (!type) {

    submitBtn.style.display = "none";
    return;

  }

  submitBtn.style.display = "block";

  if (type === "activity") {

    submitBtn.textContent =
      "Submit Activity";

    submitBtn.onclick =
      window.submitActivityReport;

  }

  else if (type === "siteNote") {

    submitBtn.textContent =
      "Submit Site Note";

    submitBtn.onclick =
      window.submitOfficerSiteNote;

  }

  else if (type === "incident") {

    submitBtn.textContent =
      "Submit Incident";

    submitBtn.onclick =
      window.saveIncident;

  }

}

function resetCommunicationForm() {

  document.getElementById(
    "communicationType"
  ).value = "";

  // Activity
  document.getElementById(
    "activityReportDescription"
  ).value = "";

  // Site Note
  document.getElementById(
    "siteNoteTitle"
  ).value = "";

  document.getElementById(
    "siteNoteContent"
  ).value = "";

  // Incident
  document.getElementById(
    "fieldIncidentSeverity"
  ).value = "";

  document.getElementById(
    "fieldIncidentDescription"
  ).value = "";

  toggleCommunicationForm();

}

window.submitOfficerSiteNote =
  async function () {

  const siteId =
    getCurrentOfficerSiteId();

  if (!siteId) {

    alert(
      "Unable to determine your current site."
    );

    return;

  }

  const priority =
    document.getElementById(
      "siteNotePriority"
    ).value;

  const title =
    document.getElementById(
      "siteNoteTitle"
    ).value.trim();

  const note =
    document.getElementById(
      "siteNoteDescription"
    ).value.trim();

  if (!note) {

    alert(
      "Please enter the site note details."
    );

    return;

  }

  const result =
    await createSiteNote({

      siteId,

      priority,

      title,

      note,

      createdBy:
        currentOfficer?.name ||
        auth.currentUser?.email

    });

  if (!result.success) {

    alert(
      result.message
    );

    return;

  }

  document.getElementById(
    "siteNotePriority"
  ).value = "Normal";

  document.getElementById(
    "siteNoteTitle"
  ).value = "";

  document.getElementById(
    "siteNoteDescription"
  ).value = "";

  alert(
    "Site note submitted."
  );

  if (result.success) {

    resetCommunicationForm();

}

}

window.loadKnowledgeArticle =
function (article) {

  document
        .querySelectorAll(".knowledge-nav")
        .forEach(button => {

            button.classList.remove("active");

        });

   const activeButton = document.querySelector(
    `.knowledge-nav[data-article="${article}"]`
);

if (activeButton) {
    activeButton.classList.add("active");
}

    const content =
        document.getElementById(
            "knowledgeContent"
        );

    content.innerHTML =
        knowledgeArticles[article];

};

function showFirstTimeSetup() {

    document.getElementById("firstTimeSetup")
        .style.display = "flex";

}

window.startFirstTimeSetup = function () {

    document.getElementById(
        "firstTimeSetup"
    ).style.display = "none";

    document.getElementById(
        "passwordSetupPage"
    ).style.display = "block";

}

window.completePasswordSetup = async function () {

    const newPassword =
        document.getElementById(
            "newPassword"
        ).value;

    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        ).value;

    const result =
        await completeFirstTimePassword(
            newPassword,
            confirmPassword
        );

    if (!result.success) {

        alert(result.message);
        return;

    }

    // Temporary until Profile Verification is built

    alert(
        "Password updated successfully."
    );

    document.getElementById(
        "passwordSetupPage"
    ).style.display = "none";

    document.getElementById(
        "profileVerificationPage"
    ).style.display = "block";

};

window.completeProfileVerification = async function () {

    const profileData = {

        phone:
            document.getElementById(
                "verifyPhone"
            ).value.trim(),

        emergencyContact:
            document.getElementById(
                "verifyEmergencyContact"
            ).value.trim(),

        acknowledged:
            document.getElementById(
                "verifyAcknowledgement"
            ).checked

    };

    const result =
        await verifyProfile(profileData);

    if (!result.success) {

        alert(result.message);
        return;

    }

    document.getElementById(
        "profileVerificationPage"
    ).style.display = "none";

    document.getElementById(
        "setupCompletePage"
    ).style.display = "block";

};

window.forgotPassword = async function () {

    const email = loginEmail.value.trim();

    const result = await sendResetPassword(email);

    if (!result.success) {
        alert(result.message);
        return;
    }

    alert(result.message);

};

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
window.renderSchedules = renderSchedules
window.deleteShift = deleteShift;
window.saveShiftEdit = saveShiftEdit;
window.confirmDeleteShift = confirmDeleteShift;
window.closeDeleteShiftModal = closeDeleteShiftModal;
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;
window.clockIn = clockIn;
window.clockOut = clockOut;
window.refreshSupervisorDashboard = refreshSupervisorDashboard;
window.showMissingClockIns = showMissingClockIns;
window.closeMissingClockInModal = closeMissingClockInModal;
window.checkPostAbandonment = checkPostAbandonment;
window.renderMySchedule = renderMySchedule
window.submitActivityReport = submitActivityReport;
window.generateIncidentCaseNumber = generateIncidentCaseNumber;
window.extendRecurringSeries = extendRecurringSeries;
window.updateScheduleType = updateScheduleType;
window.createOpenShift = createOpenShift;
window.cancelOpenShift = cancelOpenShift;
window.claimOpenShift = claimOpenShift;
window.toggleCommunicationForm = toggleCommunicationForm;
window.approveClaim = approveClaim;


refreshSupervisorDashboard();
