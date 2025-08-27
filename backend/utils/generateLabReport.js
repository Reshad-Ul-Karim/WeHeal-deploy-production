// backend/utils/generateLabReport.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatDate(date) {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', '');
}

async function generateLabReport(order, labTestItem) {
  try {
    const reportId = order.orderId;
    const reportsDir = path.join(__dirname, '../reports');

    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Build absolute paths
    const pdfName = `report_${reportId}_${labTestItem.productId._id}.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);
    const qrName = `qr_${reportId}_${labTestItem.productId._id}.png`;
    const qrPath = path.join(reportsDir, qrName);

    // Generate QR code
    await QRCode.toFile(qrPath, `https://weheal.com/report/${reportId}`);

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const now = new Date();
    const date = formatDate(now);
    const doctors = [
      "Dr. Easha Maliha",
      "Dr. R. K. Ahsan",
      "Dr. Naima Islam",
      "Dr. Taufiq Hasan",
      "Dr. Zara Rahman"
    ];
    const doctorName = doctors[Math.floor(Math.random() * doctors.length)];

    // Get patient info from order
    const patientName = order.userId?.fullName || order.userId?.name || 'N/A';
    const patientAge = order.userId?.age || '--';
    const patientGender = order.userId?.gender || '--';

    // === HEADER ===
    doc
      .rect(0, 0, doc.page.width, 70)
      .fill('#2d3436')
      .fillColor('white')
      .fontSize(20)
      .text('WeHeal', 40, 25)
      .fontSize(10)
      .text('Dhaka, Bangladesh', 40, 45)
      .text(
        '+8801717171717   |   Weheal@gmail.com   |   www.WeHeal.com',
        250,
        30,
        { align: 'right' }
      );

    // === QR at top-right ===
    doc.image(qrPath, 460, 90, { width: 80 });

    // === PATIENT INFO ===
    doc
      .fillColor('black')
      .fontSize(10)
      .text(`\n\nPatient Name: ${patientName}`, 40, 90)
      .text(`Age / Sex: ${patientAge} YRS / ${patientGender.toUpperCase()}`)
      .text(`Reg. No.: ${reportId}`)
      .text(`Reported on: ${date}`)
      .moveDown();

    // === TEST TITLE ===
    doc
      .fillColor('#2d3436')
      .fontSize(14)
      .text(`\n${labTestItem.name.toUpperCase()}`, { align: 'center' })
      .moveDown()
      .fillColor('black');

    // === LAB INFO ===
    if (labTestItem.productId.labOptions && labTestItem.productId.labOptions.length > 0) {
      const selectedLab = labTestItem.productId.labOptions[0]; // Use first lab option
      doc
        .fontSize(10)
        .text(`Laboratory: ${selectedLab.labName}`)
        .text(`Test Type: ${labTestItem.productId.testType || 'Standard Test'}`)
        .text(`Sample Type: ${labTestItem.productId.sampleType || 'Blood'}`)
        .moveDown();
    }

    // === TABLE ===
    const table = [
      ['TEST', 'VALUE', 'UNIT', 'REFERENCE'],
      ['HEMOGLOBIN', '15', 'g/dl', '13 - 17'],
      ['WBC', '5,100', '/cumm', '4,800 - 10,800'],
      ['NEUTROPHILS', '79', '%', '40 - 80'],
      ['LYMPHOCYTES', '18', '%', '20 - 40'],
      ['MONOCYTES', '1', '%', '2 - 10'],
      ['PLATELETS', '3.5', 'lakhs/cumm', '1.5 - 4.1']
    ];

    const startX = 40;
    const rowHeight = 22;
    const cellWidths = [150, 100, 100, 140];
    let y = doc.y;

    table.forEach((row, i) => {
      const rowY = y + i * rowHeight;
      const bgColor = i === 0 ? '#dfe6e9' : '#f5f7fa';

      doc
        .rect(startX, rowY, 500, rowHeight)
        .fill(bgColor)
        .fillColor('black');

      row.forEach((text, colIndex) => {
        doc
          .fontSize(10)
          .text(text, startX + (colIndex * 125) + 5, rowY + 6, {
            width: cellWidths[colIndex],
            align: 'left'
          });
      });
    });

    y += table.length * rowHeight + 20;

    // === CLINICAL NOTES ===
    doc
      .fontSize(10)
      .text('Clinical Notes:', 40, y)
      .text(
        'This report helps evaluate overall health and detect disorders such as anemia, infection, and other hematological conditions.',
        { indent: 10 }
      );

    // === DOCTOR RIBBON WITH NOTCHES ===
    const ribbonX = 40;
    const ribbonY = doc.y + 10;
    const ribbonW = 200;
    const ribbonH = 30;

    doc
      .moveTo(ribbonX, ribbonY)
      .lineTo(ribbonX + ribbonW, ribbonY)
      .lineTo(ribbonX + ribbonW - 10, ribbonY + ribbonH / 2)
      .lineTo(ribbonX + ribbonW, ribbonY + ribbonH)
      .lineTo(ribbonX, ribbonY + ribbonH)
      .lineTo(ribbonX + 10, ribbonY + ribbonH / 2)
      .closePath()
      .fill('#00b894');

    doc
      .fillColor('white')
      .fontSize(12)
      .text(`Prepared by: ${doctorName}`, ribbonX + 10, ribbonY + 8);

    doc
      .fillColor('black')
      .fontSize(10)
      .text(`Designation: Consultant Pathologist`, 40, ribbonY + ribbonH + 5)
      .text(`Date: ${date}`, 40, ribbonY + ribbonH + 20);

    // === FOOTER ===
    doc
      .fontSize(8)
      .fillColor('#636e72')
      .text('This report is computer generated and does not require signature.', {
        align: 'center'
      })
      .text('For any queries, contact support@weheal.com', {
        align: 'center'
      });

    // Finalize PDF
    doc.end();

    // Wait for write stream to finish
    await new Promise(resolve => stream.on('finish', resolve));

    // Clean up QR code file
    fs.unlinkSync(qrPath);

    // Return the relative path for storage
    return `/reports/${pdfName}`;
  } catch (error) {
    console.error('Error generating lab report:', error);
    throw error;
  }
}

export { generateLabReport };
