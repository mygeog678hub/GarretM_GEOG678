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

     
    renderTodayOfficers();
    renderPatrolActivity();
    renderIncidentSummary();
    renderSiteStatus();
    renderKPIs();

}

function renderTodayOfficers() {
  console.log("Rendering Today's Officers");

    const officers = [

        {
            name: "James Wilson",
            post: "Main Entrance",
            shift: "0700 - 1500",
            status: "On Duty",
            clock: "3 hrs 12 min"
        },

        {
            name: "Maria Rodriguez",
            post: "Loading Dock",
            shift: "0800 - 1600",
            status: "On Duty",
            clock: "2 hrs 08 min"
        },

        {
            name: "David Johnson",
            post: "Patrol Vehicle",
            shift: "0600 - 1800",
            status: "Scheduled",
            clock: "--"
        }

    ];

    const container =
        document.getElementById("todayOfficers");

    if (!container) return;

    container.innerHTML =
        officers.map(renderOfficerCard).join("");

}

function renderOfficerCard(officer) {

    let badgeClass = "client-status-success";
    let badgeText = "ON DUTY";
    let footer = "✔ Clocked In";

    if (officer.status === "Scheduled") {

        badgeClass = "client-status-warning";
        badgeText = "SCHEDULED";
        footer = "🕒 Scheduled";

    }

    if (officer.status === "Off Duty") {

        badgeClass = "client-status-danger";
        badgeText = "OFF DUTY";
        footer = "🚫 Off Duty";

    }

    return `

        <div class="officer-card">

            <div class="officer-header">

                <div class="officer-left">

                    <div class="officer-avatar">
                        👮
                    </div>

                    <div>

                        <div class="officer-name">
                            ${officer.name}
                        </div>

                        <div class="officer-post">
                            📍 ${officer.post}
                        </div>

                    </div>

                </div>

                <div class="${badgeClass}">
                    ${badgeText}
                </div>

            </div>

            <hr class="officer-divider">

            <div class="officer-detail">

                <span class="detail-label">
                    🕒 Shift
                </span>

                <span class="detail-value">
                    ${officer.shift}
                </span>

            </div>

            <div class="officer-detail">

                <span class="detail-label">
                    ⏱ Time on Post
                </span>

                <span class="detail-value">
                    ${officer.clock}
                </span>

            </div>

            <div class="officer-footer">

                ${footer}

            </div>

        </div>

    `;

}

function renderPatrolActivity() {

    const patrols = [

        {
            type: "completed",
            title: "Patrol Completed",
            location: "Main Entrance",
            time: "2 minutes ago"
        },

        {
            type: "started",
            title: "Patrol Started",
            location: "Perimeter Patrol",
            time: "14 minutes ago"
        },

        {
            type: "checkpoint",
            title: "Checkpoint Reached",
            location: "Warehouse Gate",
            time: "18 minutes ago"
        },

        {
            type: "overdue",
            title: "Patrol Overdue",
            location: "North Fence",
            time: "45 minutes ago"
        }

    ];

    const container =
        document.getElementById("clientPatrols");

    if (!container) return;

    container.innerHTML =
        patrols
            .map(renderPatrolCard)
            .join("");

}

function renderPatrolCard(event) {

    let icon = "✔";
    let badge = "client-status-success";

    switch (event.type) {

        case "started":
            icon = "🚶";
            badge = "client-status-warning";
            break;

        case "checkpoint":
            icon = "📍";
            badge = "client-status-success";
            break;

        case "overdue":
            icon = "⚠";
            badge = "client-status-danger";
            break;

    }

    return `

        <div class="patrol-card">

            <div class="patrol-header">

                <div class="${badge}">
                    ${icon}
                </div>

                <div class="patrol-title">
                    ${event.title}
                </div>

            </div>

            <div class="patrol-location">

                📍 ${event.location}

            </div>

            <div class="patrol-time">

                ${event.time}

            </div>

        </div>

    `;

}

function renderIncidentSummary() {

    const incidents = [

        {
            severity: "High",
            title: "Unauthorized Person",
            location: "Main Entrance",
            reported: "18 minutes ago",
            status: "Open"
        },

        {
            severity: "Medium",
            title: "Vehicle Gate Left Open",
            location: "Warehouse",
            reported: "2 hours ago",
            status: "Monitoring"
        },

        {
            severity: "Low",
            title: "Noise Complaint",
            location: "Parking Lot",
            reported: "Yesterday",
            status: "Closed"
        }

    ];

    const container =
        document.getElementById("clientIncidents");

    if (!container) return;

    container.innerHTML =
        incidents
            .map(renderIncidentCard)
            .join("");

}

function renderIncidentCard(incident) {

    let badgeClass = "client-status-success";
    let icon = "🟢";

    if (incident.severity === "Medium") {

        badgeClass = "client-status-warning";
        icon = "🟡";

    }

    if (incident.severity === "High") {

        badgeClass = "client-status-danger";
        icon = "🔴";

    }

    return `

        <div class="incident-card">

            <div class="incident-header">

                <div class="${badgeClass}">
                    ${icon} ${incident.severity.toUpperCase()}
                </div>

            </div>

            <div class="incident-title">

                ${incident.title}

            </div>

            <div class="incident-location">

                📍 ${incident.location}

            </div>

            <hr class="incident-divider">

            <div class="incident-meta">

                <div>

                    <span class="meta-label">
                        Reported
                    </span>

                    <span class="meta-value">
                        ${incident.reported}
                    </span>

                </div>

                <div>

                    <span class="meta-label">
                        Status
                    </span>

                    <span class="meta-value">
                        ${incident.status}
                    </span>

                </div>

            </div>

        </div>

    `;

}