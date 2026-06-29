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