const PDFDocument = require('pdfkit');

/**
 * Format currency in INR format (₹ XX,XXX)
 */
const formatINR = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return 'Rs. ' + Number(amount).toLocaleString('en-IN');
};

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Generate Rent Receipt PDF
 */
const generateRentReceiptPDF = (res, { payment, invoice, tenant, room, owner }) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Rent_Receipt_${payment.receiptNumber || 'REC'}.pdf"`
  );

  doc.pipe(res);

  // Decorative border
  doc
    .rect(20, 20, 555, 802)
    .lineWidth(1.5)
    .stroke('#4f46e5');

  doc
    .rect(24, 24, 547, 794)
    .lineWidth(0.5)
    .stroke('#cbd5e1');

  // Header
  doc
    .fillColor('#1e1b4b')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(owner?.houseName || 'Shanti Niwas (House Rental)', 50, 45, { align: 'center' });

  doc
    .fillColor('#64748b')
    .fontSize(10)
    .font('Helvetica')
    .text(owner?.houseAddress || 'Residential Room Rental Management', { align: 'center' });

  doc
    .fillColor('#4338ca')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('OFFICIAL RENT PAYMENT RECEIPT', { align: 'center', characterSpacing: 1 });

  doc.moveDown(0.8);

  // Horizontal line
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#e2e8f0')
    .stroke();

  doc.moveDown(1);

  // Receipt meta details in 2 columns
  const metaY = doc.y;
  doc
    .fillColor('#334155')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Receipt No: ', 50, metaY)
    .font('Helvetica')
    .text(payment.receiptNumber || payment.paymentNumber, 130, metaY)
    .font('Helvetica-Bold')
    .text('Date of Payment: ', 50, metaY + 18)
    .font('Helvetica')
    .text(formatDate(payment.paymentDate), 150, metaY + 18)
    .font('Helvetica-Bold')
    .text('Payment Method: ', 50, metaY + 36)
    .font('Helvetica')
    .text(payment.paymentMethod || 'UPI', 150, metaY + 36);

  if (payment.transactionReference) {
    doc
      .font('Helvetica-Bold')
      .text('Txn Reference: ', 50, metaY + 54)
      .font('Helvetica')
      .text(payment.transactionReference, 150, metaY + 54);
  }

  // Right column
  doc
    .font('Helvetica-Bold')
    .text('Invoice Ref: ', 330, metaY)
    .font('Helvetica')
    .text(invoice?.invoiceNumber || '-', 410, metaY)
    .font('Helvetica-Bold')
    .text('Billing Month: ', 330, metaY + 18)
    .font('Helvetica')
    .text(invoice?.billingMonth || '-', 410, metaY + 18)
    .font('Helvetica-Bold')
    .text('Invoice Status: ', 330, metaY + 36)
    .font('Helvetica')
    .fillColor(invoice?.remainingBalance === 0 ? '#16a34a' : '#d97706')
    .text(invoice?.status || 'Paid', 410, metaY + 36);

  doc.moveDown(4.5);

  // Tenant & Room details box
  const boxY = doc.y;
  doc
    .roundedRect(50, boxY, 495, 80, 6)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  doc
    .fillColor('#0f172a')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Tenant & Room Details', 65, boxY + 12);

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Tenant Name: ', 65, boxY + 32)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(tenant?.fullName || 'N/A', 150, boxY + 32)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Mobile: ', 65, boxY + 50)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(tenant?.primaryMobile || '-', 150, boxY + 50);

  doc
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Assigned Room: ', 330, boxY + 32)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(room?.roomNumber || 'Room', 430, boxY + 32)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Floor Level: ', 330, boxY + 50)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(room?.floorName || `Floor ${room?.floor ?? 1}`, 430, boxY + 50);

  doc.y = boxY + 95;

  // Financial Breakdown Table
  const tableY = doc.y;
  doc
    .rect(50, tableY, 495, 26)
    .fill('#e0e7ff');

  doc
    .fillColor('#312e81')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Description', 65, tableY + 8)
    .text('Amount (INR)', 430, tableY + 8, { align: 'right' });

  let curY = tableY + 30;

  const rows = [
    { label: `Monthly Rent (${invoice?.billingMonth || 'Current'})`, val: formatINR(invoice?.rentAmount) },
    { label: 'Previous Outstanding Balance', val: formatINR(invoice?.previousBalance || 0) },
    { label: 'Total Invoice Due', val: formatINR(invoice?.totalDue || invoice?.rentAmount) },
    { label: 'Amount Paid in this Receipt', val: formatINR(payment?.amountPaid), highlight: true },
    { label: 'Remaining Outstanding Balance', val: formatINR(invoice?.remainingBalance || 0), balance: true },
  ];

  rows.forEach((r, idx) => {
    if (r.highlight) {
      doc.rect(50, curY - 4, 495, 24).fill('#ecfdf5');
    } else if (idx % 2 === 1) {
      doc.rect(50, curY - 4, 495, 24).fill('#f8fafc');
    }

    doc
      .fontSize(9.5)
      .font(r.highlight || r.balance ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(r.highlight ? '#047857' : r.balance ? '#b91c1c' : '#334155')
      .text(r.label, 65, curY + 2)
      .text(r.val, 430, curY + 2, { align: 'right' });

    curY += 24;
  });

  // Table bottom border
  doc
    .moveTo(50, curY)
    .lineTo(545, curY)
    .strokeColor('#cbd5e1')
    .stroke();

  doc.y = curY + 25;

  // Receipt Notes
  if (payment.notes) {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#475569')
      .text('Notes / Remarks:', 50, doc.y)
      .font('Helvetica')
      .text(payment.notes, 50, doc.y + 12);
    doc.moveDown(2);
  }

  // Footer & Signature
  const footerY = 680;
  doc
    .moveTo(50, footerY)
    .lineTo(545, footerY)
    .strokeColor('#e2e8f0')
    .stroke();

  doc
    .fontSize(8.5)
    .font('Helvetica-Oblique')
    .fillColor('#64748b')
    .text(
      'This is an official system-generated payment receipt issued by the property owner. No signature required.',
      50,
      footerY + 12,
      { align: 'center', width: 495 }
    );

  // Owner Name block
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text('Issued by: ' + (owner?.name || 'Property Owner'), 50, footerY + 36)
    .font('Helvetica')
    .fillColor('#475569')
    .text('Phone: ' + (owner?.phone || 'On Record'), 50, footerY + 50)
    .text('Email: ' + (owner?.email || 'owner@rentmanager.local'), 50, footerY + 64);

  doc
    .font('Helvetica-Bold')
    .fillColor('#16a34a')
    .text('[ STATUS: PAYMENT RECORDED ]', 370, footerY + 50);

  doc.end();
};

/**
 * Generate Electricity Bill & Receipt PDF
 */
const generateElectricityReceiptPDF = (res, { bill, reading, payment, tenant, room, owner }) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Electricity_Bill_${bill.billNumber}.pdf"`
  );

  doc.pipe(res);

  // Decorative border
  doc.rect(20, 20, 555, 802).lineWidth(1.5).stroke('#d97706');
  doc.rect(24, 24, 547, 794).lineWidth(0.5).stroke('#fde68a');

  // Header
  doc
    .fillColor('#78350f')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(owner?.houseName || 'Shanti Niwas', 50, 45, { align: 'center' });

  doc
    .fillColor('#92400e')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('ELECTRICITY SUB-METER BILL & RECEIPT', { align: 'center', characterSpacing: 1 });

  doc.moveDown(0.8);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#fde68a').stroke();
  doc.moveDown(1);

  // Meta info
  const metaY = doc.y;
  doc
    .fillColor('#334155')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Bill Number: ', 50, metaY)
    .font('Helvetica')
    .text(bill.billNumber, 130, metaY)
    .font('Helvetica-Bold')
    .text('Billing Month: ', 50, metaY + 18)
    .font('Helvetica')
    .text(bill.billingMonth, 130, metaY + 18)
    .font('Helvetica-Bold')
    .text('Meter Number: ', 50, metaY + 36)
    .font('Helvetica')
    .text(bill.meterNumber || room?.electricityMeterNumber || 'Sub-Meter #1', 130, metaY + 36);

  doc
    .font('Helvetica-Bold')
    .text('Due Date: ', 330, metaY)
    .font('Helvetica')
    .text(formatDate(bill.dueDate), 420, metaY)
    .font('Helvetica-Bold')
    .text('Status: ', 330, metaY + 18)
    .font('Helvetica')
    .fillColor(bill.status === 'Paid' ? '#16a34a' : '#b45309')
    .text(bill.status, 420, metaY + 18);

  doc.moveDown(4.5);

  // Meter Reading Box
  const boxY = doc.y;
  doc.roundedRect(50, boxY, 495, 75, 6).fillAndStroke('#fffbeb', '#fef3c7');

  doc
    .fillColor('#92400e')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Sub-Meter Consumption Breakdown', 65, boxY + 10);

  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor('#451a03')
    .text('Previous Reading: ', 65, boxY + 30)
    .font('Helvetica')
    .text(`${bill.previousReading} units`, 165, boxY + 30)
    .font('Helvetica-Bold')
    .text('Current Reading: ', 65, boxY + 48)
    .font('Helvetica')
    .text(`${bill.currentReading} units`, 165, boxY + 48);

  doc
    .font('Helvetica-Bold')
    .text('Units Consumed: ', 320, boxY + 30)
    .font('Helvetica')
    .text(`${bill.unitsConsumed} units`, 425, boxY + 30)
    .font('Helvetica-Bold')
    .text('Rate per Unit: ', 320, boxY + 48)
    .font('Helvetica')
    .text(formatINR(bill.ratePerUnit) + ' / unit', 425, boxY + 48);

  doc.y = boxY + 90;

  // Calculation Table
  const tableY = doc.y;
  doc.rect(50, tableY, 495, 26).fill('#fef3c7');

  doc
    .fillColor('#78350f')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Charge Calculation', 65, tableY + 8)
    .text('Amount (INR)', 430, tableY + 8, { align: 'right' });

  let curY = tableY + 30;

  const rows = [
    {
      label: `Current Consumption (${bill.unitsConsumed} units x ${bill.ratePerUnit}/unit)`,
      val: formatINR(bill.billAmount),
    },
    { label: 'Previous Electricity Arrears', val: formatINR(bill.previousBalance || 0) },
    { label: 'Total Electricity Due', val: formatINR(bill.totalDue), bold: true },
    { label: 'Amount Paid', val: formatINR(bill.amountPaid), highlight: true },
    { label: 'Pending Electricity Balance', val: formatINR(bill.remainingBalance), balance: true },
  ];

  rows.forEach((r) => {
    if (r.highlight) doc.rect(50, curY - 4, 495, 24).fill('#ecfdf5');
    doc
      .fontSize(9.5)
      .font(r.bold || r.highlight || r.balance ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(r.highlight ? '#047857' : r.balance ? '#b91c1c' : '#334155')
      .text(r.label, 65, curY + 2)
      .text(r.val, 430, curY + 2, { align: 'right' });
    curY += 24;
  });

  doc.moveTo(50, curY).lineTo(545, curY).strokeColor('#fde68a').stroke();

  // Footer
  const footerY = 680;
  doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#e2e8f0').stroke();

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('Managed by property owner. Paid separately from monthly room rent.', 50, footerY + 15, {
      align: 'center',
    });

  doc.end();
};

/**
 * Generate Rental Agreement Summary PDF
 */
const generateAgreementPDF = (res, { agreement, tenant, room, owner }) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Agreement_${agreement.agreementNumber}.pdf"`
  );

  doc.pipe(res);

  // Border
  doc.rect(20, 20, 555, 802).lineWidth(1.5).stroke('#1e293b');
  doc.rect(24, 24, 547, 794).lineWidth(0.5).stroke('#94a3b8');

  // Header
  doc
    .fillColor('#0f172a')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('RESIDENTIAL ROOM RENTAL AGREEMENT', 50, 45, { align: 'center' });

  doc
    .fillColor('#475569')
    .fontSize(10)
    .font('Helvetica')
    .text(`Agreement Number: ${agreement.agreementNumber}`, { align: 'center' });

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cbd5e1').stroke();
  doc.moveDown(0.8);

  // Introduction Paragraph
  doc
    .fillColor('#334155')
    .fontSize(9.5)
    .font('Helvetica')
    .text(
      `This Residential Room Rental Agreement is entered into on ${formatDate(
        agreement.startDate
      )}, between the Property Owner and the Tenant as named below:`,
      50,
      doc.y,
      { align: 'justify', lineGap: 3 }
    );

  doc.moveDown(1);

  // Parties Box
  const pY = doc.y;
  doc.roundedRect(50, pY, 495, 120, 4).fillAndStroke('#f8fafc', '#e2e8f0');

  // Owner col
  doc
    .fillColor('#0f172a')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('1. PROPERTY OWNER (Landlord)', 65, pY + 10)
    .font('Helvetica')
    .fillColor('#334155')
    .text(`Name: ${owner?.name || 'Property Owner'}`, 65, pY + 28)
    .text(`House: ${owner?.houseName || 'Shanti Niwas'}`, 65, pY + 44)
    .text(`Address: ${owner?.houseAddress || 'Sector 15, Jaipur'}`, 65, pY + 60, { width: 200 })
    .text(`Phone: ${owner?.phone || 'On Record'}`, 65, pY + 92);

  // Tenant col
  doc
    .fillColor('#0f172a')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('2. TENANT', 310, pY + 10)
    .font('Helvetica')
    .fillColor('#334155')
    .text(`Name: ${tenant?.fullName || 'Tenant'}`, 310, pY + 28)
    .text(`Father's Name: ${tenant?.fatherName || '-'}`, 310, pY + 44)
    .text(`Permanent: ${tenant?.permanentAddress || '-'}`, 310, pY + 60, { width: 220 })
    .text(`Mobile: ${tenant?.primaryMobile || '-'}`, 310, pY + 92);

  doc.y = pY + 135;

  // Terms Box
  const tY = doc.y;
  doc.roundedRect(50, tY, 495, 100, 4).fillAndStroke('#eff6ff', '#bfdbfe');

  doc
    .fillColor('#1e40af')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('KEY RENTAL TERMS & CONDITIONS', 65, tY + 10);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#1e3a8a')
    .text(`• Assigned Room: ${room?.roomNumber || 'Room'} (${room?.floorName || 'Floor 1'})`, 65, tY + 28)
    .text(`• Agreement Period: ${formatDate(agreement.startDate)} to ${formatDate(agreement.endDate)}`, 65, tY + 44)
    .text(`• Monthly Room Rent: ${formatINR(agreement.monthlyRent)} (Due on the ${agreement.rentDueDay || 5}th of every month)`, 65, tY + 60)
    .text(`• Refundable Security Deposit: ${formatINR(agreement.securityDeposit)}`, 65, tY + 76);

  doc
    .text(`• Electricity Billing: Sub-meter at ${formatINR(agreement.ratePerUnit || 9.5)}/unit`, 310, tY + 28)
    .text(`• Notice Period: 30 days prior notice`, 310, tY + 44)
    .text(`• Current Status: ${agreement.status}`, 310, tY + 60);

  doc.y = tY + 115;

  // Standard Rules
  doc
    .fillColor('#0f172a')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('GENERAL TENANCY CLAUSES:', 50, doc.y);

  doc.moveDown(0.5);

  const clauses = agreement.terms || [
    'The tenant agrees to pay the agreed monthly rent on or before the due date.',
    'Sub-meter electricity units will be recorded monthly and paid separately from the room rent.',
    'The room shall be used exclusively for residential purposes by the registered tenant.',
    'Subletting or accommodating unauthorized third parties is strictly prohibited.',
    'Cleanliness of the rented room and common corridors must be maintained at all times.',
    'Any physical damages to fittings, walls, or electrical switches will be deducted from the security deposit.',
    'A mandatory 30-day advance notice is required before vacating the premises.',
  ];

  clauses.forEach((c, idx) => {
    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`${idx + 1}. ${c}`, 55, doc.y, { lineGap: 3 });
  });

  // Signature Block
  const sigY = 700;
  doc.moveTo(50, sigY).lineTo(545, sigY).strokeColor('#cbd5e1').stroke();

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('Landlord / Property Owner Signature', 70, sigY + 50)
    .text('Tenant Signature', 390, sigY + 50);

  doc.end();
};

module.exports = {
  generateRentReceiptPDF,
  generateElectricityReceiptPDF,
  generateAgreementPDF,
};

