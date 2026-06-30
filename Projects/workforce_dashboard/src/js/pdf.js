
window.downloadIncidentPdf =
async function() {
  let y = 20;
  

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

  const doc = new jsPDF();

function checkPageBreak(
  requiredSpace = 20
) {

  if (
    y + requiredSpace > 250
  ) {

    doc.addPage();

    y = 20;
  }
}

function addSectionHeader(
  title
) {

  checkPageBreak(20);

  doc.setFillColor(
    45,
    45,
    45
  );

  doc.rect(
    15,
    y,
    180,
    8,
    "F"
  );

  doc.setTextColor(
    255
  );

  doc.setFontSize(
    12
  );

  doc.text(
    title,
    20,
    y + 5
  );

  doc.setTextColor(
    0
  );

  y += 15;
}

function addFieldRow(
  leftLabel,
  leftValue,
  rightLabel = "",
  rightValue = ""
) {

  checkPageBreak();

  doc.setFont(
    undefined,
    "bold"
  );

  doc.text(
    String(leftLabel),
    20,
    y
  );

  doc.setFont(
    undefined,
    "normal"
  );

  doc.text(
    String(
      leftValue || ""
    ),
    50,
    y
  );

  if (rightLabel) {

    doc.setFont(
      undefined,
      "bold"
    );

    doc.text(
      String(rightLabel),
      110,
      y
    );

    doc.setFont(
      undefined,
      "normal"
    );

    doc.text(
      String(
        rightValue || ""
      ),
      145,
      y
    );
  }

  y += 8;
}

doc.setFontSize(18);

doc.text(
  window.companyProfile?.companyName ||
  "Security Company",
  20,
  y
);

y += 8;

if (
  window.companyProfile?.licenseNumber
) {

  doc.setFontSize(11);

  doc.text(
    `License #: ${window.companyProfile.licenseNumber}`,
    20,
    y
  );

  y += 8;
}

y += 8;

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
  
  addSectionHeader(
  "Incident Information"
);

doc.autoTable({

  startY: y,

  theme: "grid",

  body: [

    [
      "Case Number",
      incident.caseNumber || ""
    ],

    [
      "Officer",
      incident.officerName || ""
    ],

    [
      "Incident Type",
      incident.incidentType || ""
    ],

    [
      "Severity",
      incident.severity || ""
    ],

    [
      "Status",
      incident.status || ""
    ],

    [
      "Site",
      incident.siteName || ""
    ]

  ]
});

y =
  doc.lastAutoTable
    .finalY + 15;
  
  // ======================
  // Persons Involved
  // ======================

if (
  incident.persons &&
  incident.persons.length
) {

  addSectionHeader(
  "Persons Involved"
);

  incident.persons.forEach(
    (person, index) => {

      addSectionHeader(
        `Person Involved #${index + 1}`
      );

      const fullName =
        [
          person.firstName,
          person.middleName,
          person.lastName
        ]
        .filter(Boolean)
        .join(" ");

      const address =
        [
          person.street,
          person.city,
          person.state,
          person.zip
        ]
        .filter(Boolean)
        .join(", ");

      const height =
        person.heightFeet &&
        person.heightInches
          ? `${person.heightFeet}' ${person.heightInches}"`
          : "";

      const dob =
        person.dob
          ? new Date(
              person.dob
            ).toLocaleDateString()
          : "";

      addFieldRow(
        "Name:",
        fullName,
        "Role:",
        person.role
      );

      addFieldRow(
        "Alias:",
        person.alias,
        "DOB:",
        dob
      );

      addFieldRow(
        "Sex:",
        person.sex,
        "Race:",
        person.race
      );

      addFieldRow(
        "Ethnicity:",
        person.ethnicity
      );

      addFieldRow(
        "Height:",
        height,
        "Weight:",
        person.weight
          ? `${person.weight} lbs`
          : ""
      );

      addFieldRow(
        "Hair:",
        person.hairColor,
        "Eyes:",
        person.eyeColor
      );

      addFieldRow(
        "Address:",
        address
      );

      addFieldRow(
        "Cell:",
        person.cellPhone,
        "Home:",
        person.homePhone
      );

      addFieldRow(
        "Employer:",
        person.employer
      );

      addFieldRow(
        "Email:",
        person.email
      );

      addFieldRow(
        "Identification:",
        `${person.idType || ""}
${person.idNumber
  ? " - " + person.idNumber
  : ""}`,
        "State:",
        person.idState ||
        person.state
      );

      y += 5;
    }
  );
}

// ======================
  // Narrative
  // ======================

  addSectionHeader(
  "Narrative"
);

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


addSectionHeader(
  "Signatures"
);

doc.text(
  "________________________",
  20,
  y
);

doc.text(
  "Reporting Officer",
  20,
  y + 7
);

doc.text(
  "________________________",
  120,
  y
);

doc.text(
  "Supervisor",
  120,
  y + 7
);

y += 25;

  // ======================
  // Save PDF
  // ======================

  const fileName =
    incident.caseNumber
      ? `${incident.caseNumber}.pdf`
      : "incident-report.pdf";

      const pages =
  doc.internal
    .getNumberOfPages();

for (
  let i = 1;
  i <= pages;
  i++
) {

  doc.setPage(i);

  doc.setFontSize(9);

  doc.text(
    `Generated by WorkForge Dashboard - Page ${i} of ${pages}`,
    20,
    285
  );
}

  doc.save(
    fileName
  );
};

