import { db } from "./firebase-config.js";

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

console.log("Current user:", auth.currentUser);

// Temporary until authentication (Phase 9B)
const currentSiteId = "H9448x1K3XtRgbA8BnPk";

document.addEventListener("DOMContentLoaded", async () => {

    console.log("Client Portal Loaded");

    await initializeClientPortal();

});

async function initializeClientPortal() {

   // await loadCompanyProfile();

    await loadTodaysOfficers();

}

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