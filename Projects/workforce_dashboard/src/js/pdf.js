window.testPdf =
function() {

  const {
    jsPDF
  } = window.jspdf;

  const doc =
    new jsPDF();

  doc.setFontSize(20);

  doc.text(
    "WorkForge PDF Engine",
    20,
    30
  );

  doc.setFontSize(12);

  doc.text(
    "PDF engine initialized successfully.",
    20,
    50
  );

  doc.save(
    "test.pdf"
  );
 
};

window.downloadIncidentPdf =
async function() {

  const incident =
    window.currentIncident;

  if (!incident) {

    alert(
      "No incident selected."
    );

    return;
  }

  const {
    jsPDF
  } = window.jspdf;

  const doc =
    new jsPDF();

  let y = 20;

  // ======================
  // Company Header
  // ======================

  doc.setFontSize(18);

  doc.text(
    window.companyProfile?.companyName ||
    "Security Company",
    20,
    y
  );

  y += 8;

  doc.setFontSize(11);

  if (
    window.companyProfile?.licenseNumber
  ) {

    doc.text(
      `License #: ${window.companyProfile?.licenseNumber}`,
      20,
      y
    );

    y += 8;
  }

  doc.setFontSize(16);

  doc.text(
    "Incident Report",
    20,
    y
  );

  y += 15;

  // ======================
  // Incident Information
  // ======================

  doc.setFontSize(11);

  doc.text(
    `Case Number: ${incident.caseNumber || ""}`,
    20,
    y
  );

  y += 8;

  doc.text(
    `Officer: ${incident.officerName || ""}`,
    20,
    y
  );

  y += 8;

  doc.text(
    `Incident Type: ${incident.incidentType || ""}`,
    20,
    y
  );

  y += 8;

  doc.text(
    `Severity: ${incident.severity || ""}`,
    20,
    y
  );

  y += 8;

  doc.text(
    `Status: ${incident.status || ""}`,
    20,
    y
  );

  y += 8;

  doc.text(
    `Site: ${incident.siteName || ""}`,
    20,
    y
  );

  y += 15;

  // ======================
  // Narrative
  // ======================

  doc.setFontSize(13);

  doc.text(
    "Narrative",
    20,
    y
  );

  y += 8;

  doc.setFontSize(11);

  const narrativeLines =
    doc.splitTextToSize(
      incident.narrative || "",
      170
    );

  doc.text(
    narrativeLines,
    20,
    y
  );

  y +=
    narrativeLines.length * 6 +
    15;

  // ======================
  // Persons Involved
  // ======================

  if (
    incident.persons &&
    incident.persons.length
  ) {

    doc.autoTable({

      startY: y,

      head: [[
        "Name",
        "Role",
        "Phone"
      ]],

      body:
        incident.persons.map(
          person => [

            `${person.firstName || ""}
${person.lastName || ""}`,

            person.role || "",

            person.cellPhone || ""
          ]
        )
    });

    y =
      doc.lastAutoTable
        .finalY + 15;
  }

  // ======================
  // Save PDF
  // ======================

  const fileName =
    incident.caseNumber
      ? `${incident.caseNumber}.pdf`
      : "incident-report.pdf";

  doc.save(
    fileName
  );
};