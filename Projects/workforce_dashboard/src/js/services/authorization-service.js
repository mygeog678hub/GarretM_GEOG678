import { 
    auth 
} from "./firebase-config.js";

import { 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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



export async function sendResetPassword(email) {

    if (!email?.trim()) {
        return {
            success: false,
            message: "Please enter your email address."
        };
    }

    try {

        await sendPasswordResetEmail(auth, email.trim());

        return {
            success: true,
            message: "If an account exists for that email, a password reset link has been sent."
        };

    } catch (error) {

        console.error(error);

        return {
            success: false,
            message: error.message
        };

    }

}