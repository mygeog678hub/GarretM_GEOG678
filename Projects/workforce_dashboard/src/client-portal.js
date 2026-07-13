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

import { formatRelativeTime } from "./js/utils.js";

import {
    initializeIdentity
} from "./js/services/identity-service.js";

import {
    loadTodaysOfficers,
    loadTodaysPatrolActivity,
    loadTodaysIncidents,
    loadClientKPIs
} from "./js/services/client-service.js";


const auth = getAuth();

// Temporary until authentication (Phase 9B)
const currentSiteId =
    window.currentUserProfile?.siteId;

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
    "Client Portal: Unable to load company profile",
    error
);

  }

}

function renderTodaysOfficers(officers) {

    const container =
        document.getElementById("todayOfficers");

    if (!container) return;

  if (!officers.length) {

    container.classList.add("empty");

    container.innerHTML = renderNoDataCard({
        icon: "👮",
        title: "No officers are scheduled for today.",
        message:
            "If you expected security coverage at this property, please contact your account manager."
    });

    return;
}

container.classList.remove("empty");

container.innerHTML =
    officers.map(renderOfficerCard).join("");
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

export async function initializeClientPortal() {

    console.log(
    "Client Portal Profile:",
    window.currentUserProfile
);    

   const liveOfficers =
    await loadTodaysOfficers();

renderTodaysOfficers(liveOfficers);

const patrols =
    await loadTodaysPatrolActivity();

renderPatrolActivity(patrols);

const incidents =
    await loadTodaysIncidents();

renderIncidentSummary(incidents);

// We'll add communications next
const communications =
    await loadTodaysCommunications();

const kpis =
    await loadClientKPIs({
        officers: liveOfficers,
        patrols,
        incidents,
        communications
    });

renderKPIs(kpis);

const siteStatus =
    loadSiteStatus({
        officers: liveOfficers,
        patrols,
        incidents
    });

renderSiteStatus(siteStatus);

renderPatrolActivity(
    patrols
);

renderIncidentSummary(
    incidents
);
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

function renderPatrolActivity(patrols) {

    const container =
        document.getElementById("clientPatrols");

    if (!container) return;

    if (!patrols.length) {

        container.innerHTML =
            renderNoDataCard({
                icon: "🚓",
                title: "No Patrol Activity Today",
                message:
                    "No patrol activity has been recorded for this property today."
            });

        return;

    }

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

function renderIncidentSummary(incidents) {

    const container =
        document.getElementById("clientIncidents");

    if (!container) return;

    if (!incidents.length) {

        container.innerHTML =
            renderNoDataCard({

                icon: "🚨",

                title: "No Incidents Reported Today",

                message:
                    "There are currently no reported incidents for this property."

            });

        return;

    }

    container.innerHTML = `

    <div class="incident-feed">

        ${incidents
            .map(renderIncidentCard)
            .join("")}

    </div>

`;

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

function renderNoDataCard({
    icon,
    title,
    message
}) {

    return `
        <div class="no-data-card">

            <div class="no-data-icon">
                ${icon}
            </div>

            <div class="no-data-title">
                ${title}
            </div>

            <div class="no-data-message">
                ${message}
            </div>

        </div>
    `;

}





function loadSiteStatus({
    officers,
    patrols,
    incidents
}) {

    const activeIncidents =
        incidents.filter(
            incident =>
                incident.status !== "resolved"
        ).length;

    let title = "🟢 Normal Operations";
    let message =
        "No active incidents have been reported today.";
    let cssClass = "status-normal";

    if (activeIncidents > 0) {

        title = "🟡 Attention Required";
        message =
            `${activeIncidents} active incident${activeIncidents > 1 ? "s have" : " has"} been reported today.`;

        cssClass = "status-warning";

    }

    return {

        title,

        message,

        officers: officers.length,

        patrols: patrols.length,

        incidents: activeIncidents,

        lastPatrol:
            patrols.length
                ? patrols[0].time
                : "No patrols today",

        cssClass

    };

}