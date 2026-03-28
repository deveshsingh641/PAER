import PDFDocument from 'pdfkit';

export function renderApplicationPdf({ application, userSafe }, res) {
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="passport-application-${application.id}.pdf"`);

  doc.pipe(res);

  doc.fontSize(18).text('Passport Application (Demo Export)', { align: 'left' });
  doc.moveDown(0.5);

  doc.fontSize(10).text(`Application ID: ${application.id}`);
  doc.text(`Status: ${application.status}`);
  doc.text(`Exported for: ${userSafe?.name || userSafe?.email || userSafe?.phone || 'User'}`);
  doc.moveDown();

  doc.fontSize(12).text('Personal details', { underline: true });
  doc.moveDown(0.25);
  const personal = application.form?.personal || {};
  doc.fontSize(10).text(`Full name: ${personal.fullName || '-'}`);
  doc.text(`Date of birth: ${personal.dob || '-'}`);
  doc.text(`Gender: ${personal.gender || '-'}`);
  doc.text(`Address: ${[personal.addressLine1, personal.addressLine2].filter(Boolean).join(', ') || '-'}`);
  doc.text(`Pincode: ${personal.pincode || '-'}`);
  doc.moveDown();

  doc.fontSize(12).text('Identity details', { underline: true });
  doc.moveDown(0.25);
  const identity = application.form?.identity || {};
  doc.fontSize(10).text(`ID type: ${identity.idType || '-'}`);
  doc.text(`ID number: ${identity.idNumber || '-'}`);
  doc.moveDown();

  doc.fontSize(12).text('Service preferences', { underline: true });
  doc.moveDown(0.25);
  const service = application.form?.service || {};
  doc.fontSize(10).text(`Passport type: ${service.passportType || '-'}`);
  doc.text(`Booklet pages: ${service.bookletPages || '-'}`);
  doc.text(`Delivery: ${service.deliveryMode || '-'}`);
  doc.moveDown();

  doc.fontSize(12).text('Appointment', { underline: true });
  doc.moveDown(0.25);
  const appt = application.appointment || null;
  doc.fontSize(10).text(`City: ${appt?.city || '-'}`);
  doc.text(`Center: ${appt?.centerName || '-'}`);
  doc.text(`Slot: ${appt?.slotStart || '-'}`);

  doc.end();
}

export function renderAppointmentReceiptPdf({ application, userSafe }, res) {
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="appointment-receipt-${application.id}.pdf"`
  );

  doc.pipe(res);

  doc.fontSize(18).text('Appointment Receipt', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Application ID: ${application.id}`);
  doc.text(`Applicant: ${userSafe?.name || userSafe?.email || 'User'}`);
  doc.moveDown();

  const appt = application.appointment || null;
  doc.fontSize(12).text('Appointment details', { underline: true });
  doc.moveDown(0.25);
  doc.fontSize(10).text(`City: ${appt?.city || '-'}`);
  doc.text(`Center: ${appt?.centerName || '-'}`);
  doc.text(`Slot: ${appt?.slotStart || '-'}`);
  doc.moveDown();

  doc.fontSize(10).text('Bring original documents + one photocopy. Arrive 15 minutes early.', { align: 'left' });

  doc.end();
}
