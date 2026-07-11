console.log("Client Portal loaded");
import { db } from "./js/services/firebase-config.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth();

//console.log("Current user:", auth.currentUser);

// Temporary until authentication (Phase 9B)
const currentSiteId = "H9448x1K3XtRgbA8BnPk";

document.addEventListener("DOMContentLoaded", async () => {

    console.log("Client Portal Loaded");

    await initializeClientPortal();

});

async function loadCompanyProfile() {

  try {

    const profile =
  await window.loadCompanyProfile();

if (!profile) return;

document.getElementById(
  "clientCompanyName"
).textContent =
  profile.companyName || "WorkForge";

    const logo =
      document.getElementById(
        "clientCompanyLogo"
      );

    if (profile.logoBase64) {

      logo.src =
        profile.logoBase64;

      logo.style.display =
        "block";

    }

  } catch (error) {

    console.error(
      "Unable to load company profile:",
      error
    );

  }

}

async function loadTodaysOfficers() {

  try {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      collection(db, "shifts"),
      where("siteId", "==", currentSiteId),
      where("startTime", ">=", today.toISOString()),
      where("startTime", "<", tomorrow.toISOString())
    );

    const snapshot = await getDocs(q);

    console.log(
      "Today's shifts:",
      snapshot.size
    );

  } catch (error) {

    console.error(
      "Error loading today's officers:",
      error
    );

  }

}

function renderSiteStatus(status) {

    document.getElementById("siteStatusTitle").textContent =
        status.title;

    document.getElementById("siteStatusMessage").textContent =
        status.message;

    document.getElementById("statusOfficers").textContent =
        `✓ Officers on duty: ${status.officers}`;

    document.getElementById("statusPatrols").textContent =
        `✓ Patrols completed today: ${status.patrols}`;

    document.getElementById("statusIncidents").textContent =
        `✓ Open incidents: ${status.incidents}`;

    document.getElementById("statusLastPatrol").textContent =
        `✓ Last patrol: ${status.lastPatrol}`;

    const card =
        document.getElementById("clientSiteStatusCard");

    if (card) {

        card.classList.remove(
            "status-normal",
            "status-warning",
            "status-critical"
        );

        card.classList.add(status.cssClass);

    }

}

function renderKPIs(kpis) {

    document.getElementById("kpiOfficerCount").textContent =
        kpis.officers;

    document.getElementById("kpiPatrolCount").textContent =
        kpis.patrols;

    document.getElementById("kpiIncidentCount").textContent =
        kpis.incidents;

    document.getElementById("kpiCommunicationCount").textContent =
        kpis.communications;

}

function renderClientHeader(site) {

    document.getElementById("clientSiteName").textContent =
        site.name;

    document.getElementById("clientWelcomeMessage").textContent =
        `Welcome back. Here's today's status for ${site.name}.`;

    document.getElementById("clientStatusPill").textContent =
        "🟢 Normal Operations";

}

async function initializeClientPortal() {

    renderSiteStatus({
        title: "🟢 Normal Operations",
        message: "No active incidents have been reported today.",
        officers: 2,
        patrols: 18,
        incidents: 0,
        lastPatrol: "11 minutes ago",
        cssClass: "status-normal"
    });

   renderKPIs({

    officers: 2,

    patrols: 18,

    incidents: 0,

    communications: 3

});

}