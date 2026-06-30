
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
    y + requiredSpace > 270
  ) {

    doc.addPage();

    y = 20;
  }
}  

  
  const margin = 15;
const contentWidth = 180;

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

function writeParagraph(
  text,
  x = 20,
  width = 170,
  lineHeight = 6
) {

  const lines =
    doc.splitTextToSize(
      text || "",
      width
    );

  lines.forEach(
    line => {

      if (
        y + lineHeight > 270
      ) {

        doc.addPage();

        y = 20;
      }

      doc.text(
        line,
        x,
        y
      );

      y += lineHeight;
    }
  );
}

function addFieldRow(
  leftLabel,
  leftValue,
  rightLabel = "",
  rightValue = "",
  shaded = false
) {

  checkPageBreak();

  if (shaded) {

  doc.setFillColor(
    235,
    235,
    235
  );

  doc.rect(
    18,
    y - 5,
    175,
    7,
    "F"
  );
}

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
          let shaded = false;
            
      addFieldRow(
        "Name:",
        fullName,
        "Role:",
        person.role,
        shaded
      );
      shaded = !shaded;

      addFieldRow(
        "Alias:",
        person.alias,
        "DOB:",
        dob, 
        shaded       
      );
    shaded = !shaded;

      addFieldRow(
        "Sex:",
        person.sex,
        "Race:",
        person.race,
        shaded
      );
      shaded = !shaded;

      addFieldRow(
        "Ethnicity:",
        person.ethnicity,
        "",
        "",
        shaded        
      );
      shaded = !shaded;

      addFieldRow(
        "Height:",
        height,
        "Weight:",
        person.weight
          ? `${person.weight} lbs`
          : "",
          shaded
      );
      shaded = !shaded;

      addFieldRow(
        "Hair:",
        person.hairColor,
        "Eyes:",
        person.eyeColor,
        shaded        
      );
      shaded = !shaded;

      addFieldRow(
        "Address:",
        address,
        shaded
      );
      shaded = !shaded;

      addFieldRow(
        "Cell:",
        person.cellPhone,
        "Home:",
        person.homePhone,
        shaded              
      );
      shaded = !shaded;

      addFieldRow(
        "Employer:",
        person.employer,
        "",
        "",
        shaded
      );
      shaded = !shaded;

      addFieldRow(
        "Email:",
        person.email,
        "",
        "",
        shaded        
      );
      shaded = !shaded;

    addFieldRow(
  "Identification:",
  `${person.idType || ""}${
    person.idNumber
      ? " - " + person.idNumber
      : ""
  }`,
  "State:",
  person.idState ||
    person.state,
  shaded
);
      shaded = !shaded;

      y += 5;
    }
  );
}

// ======================
// Vehicles Involved
// ======================

if (
  incident.vehicles &&
  incident.vehicles.length
) {

  addSectionHeader(
    "VEHICLES INVOLVED"
  );

  incident.vehicles.forEach(
  (vehicle, index) => {

    let cardHeight = 45;

    if (vehicle.notes) {
      const noteLines =
        doc.splitTextToSize(
          vehicle.notes,
          contentWidth - 40
        );

      cardHeight +=
        noteLines.length * 5 + 10;
    }

    checkPageBreak(
      cardHeight + 10
    );

    const startY = y;

    doc.setDrawColor(
      180,
      180,
      180
    );

    doc.roundedRect(
      margin,
      startY,
      contentWidth,
      cardHeight,
      3,
      3
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      `Vehicle #${index + 1}`,
      margin + 4,
      startY + 7
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    let rowY =
      startY + 14;

      let shaded = false;

    const fields = [
      ["Role", vehicle.role],
      ["Owner", vehicle.owner],
      [
        "Plate",
        `${vehicle.plate || ""} ${
          vehicle.state
            ? `(${vehicle.state})`
            : ""
        }`
      ],
      [
        "Vehicle",
        `${vehicle.year || ""} ${
          vehicle.make || ""
        } ${
          vehicle.model || ""
        }`
      ],
      ["Color", vehicle.color],
      ["VIN", vehicle.vin],
      ["Insurance", vehicle.insurance],
      ["Policy", vehicle.policy],
      ["Towed", vehicle.towed]
    ];

    fields.forEach(
      field => {

        if (!field[1])
          return;
        if (shaded) {
  doc.setFillColor(
    242,
    242,
    242
  );

  doc.rect(
    margin + 2,
    rowY - 4,
    contentWidth - 4,
    6,
    "F"
  );
}

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.text(
          `${field[0]}:`,
          margin + 5,
          rowY
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.text(
          String(field[1]),
          margin + 35,
          rowY
        );

        rowY += 6;
        shaded = !shaded;
      }
    );

    if (vehicle.notes) {

      rowY += 2;

      doc.setFont(
        "helvetica",
        "bold"
      );

      if (shaded) {
  doc.setFillColor(
    242,
    242,
    242
  );

  doc.rect(
    margin + 2,
    rowY - 4,
    contentWidth - 4,
    8,
    "F"
  );
}

      doc.text(
        "Notes:",
        margin + 5,
        rowY
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      const noteLines =
        doc.splitTextToSize(
          vehicle.notes,
          contentWidth - 40
        );

      doc.text(
        noteLines,
        margin + 35,
        rowY
      );

      rowY +=
        noteLines.length * 5;
    }

    y =
      startY +
      cardHeight +
      5;
  }
);

y += 5;
}

// ======================
  // Narrative
  // ======================

addSectionHeader(
  "Narrative"
);

doc.setFontSize(11);

writeParagraph(
  incident.narrative || ""
);

y += 10;

checkPageBreak(35);

const submittedDate =
  incident.createdAt
    ? new Date(
        incident.createdAt.seconds
          ? incident.createdAt.seconds * 1000
          : incident.createdAt
      ).toLocaleString()
    : "";

doc.setFont(
  "helvetica",
  "bold"
);

doc.text(
  "Reporting Officer:",
  20,
  y
);

doc.setFont(
  "helvetica",
  "normal"
);

doc.text(
  incident.officerName || "",
  65,
  y
);

y += 10;

doc.setFont(
  "helvetica",
  "bold"
);

doc.text(
  "Submitted:",
  20,
  y
);

doc.setFont(
  "helvetica",
  "normal"
);

doc.text(
  submittedDate,
  65,
  y
);

y += 15;
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
  `Page ${i} of ${pages}`,
  190,
  285,
  {
    align: "right"
  }
);
}

  doc.save(
    fileName
  );
}

