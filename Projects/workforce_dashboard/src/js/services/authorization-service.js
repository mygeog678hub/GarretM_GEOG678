// authorization-service.js

export function applyRolePermissions(profile) {

    if (!profile) return;

    switch (profile.role) {

        case "Administrator":
            applyAdministratorPermissions();
            break;

        case "Supervisor":
            applySupervisorPermissions();
            break;

        case "Officer":
        default:
            applyOfficerPermissions();
            break;

    }

}

function applyAdministratorPermissions() {

    showNavigation();

}

function applySupervisorPermissions() {

    showNavigation();

}

function applyOfficerPermissions() {

    hideNavigation();

}

function showNavigation() {

    const nav =
        document.getElementById("navCard");

    if (nav) {
        nav.style.display = "flex";
    }

}

function hideNavigation() {

    const nav =
        document.getElementById("navCard");

    if (nav) {
        nav.style.display = "none";
    }

}