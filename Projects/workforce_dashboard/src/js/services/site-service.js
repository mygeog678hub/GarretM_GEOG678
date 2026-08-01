import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadSite(siteId) {

    try {

        const snap =
            await getDoc(
                doc(
                    db,
                    "sites",
                    siteId
                )
            );

        if (!snap.exists()) {

            return {
                success: false,
                message: "Site not found."
            };

        }

        return {

            success: true,

            site: {

                id: snap.id,

                ...snap.data()

            }

        };

    } catch (error) {

        console.error(
            "loadSite:",
            error
        );

        return {

            success: false,

            message:
                "Unable to load site."

        };

    }

}