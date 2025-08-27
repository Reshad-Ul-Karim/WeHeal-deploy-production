import { connectDB } from '../db/connectDB.js';
import { LabTestReport } from '../models/labTestReportModel.js';
import { User } from '../models/userModel.js';

const sampleLabTestReports = [
  {
    testName: 'Complete Blood Count (CBC)',
    doctorName: 'Dr. Sarah Johnson',
    orderDate: new Date('2024-01-15'),
    testDate: new Date('2024-01-16'),
    reportGeneratedDate: new Date('2024-01-17'),
    status: 'completed',
    reportStatus: 'ready',
    price: 45.00,
    reportUrl: 'https://example.com/reports/cbc-report.pdf'
  },
  {
    testName: 'Lipid Profile',
    doctorName: 'Dr. Michael Chen',
    orderDate: new Date('2024-01-20'),
    testDate: new Date('2024-01-21'),
    reportGeneratedDate: new Date('2024-01-22'),
    status: 'completed',
    reportStatus: 'ready',
    price: 55.00,
    reportUrl: 'https://example.com/reports/lipid-report.pdf'
  },
  {
    testName: 'Thyroid Function Test (TSH, T3, T4)',
    doctorName: 'Dr. Emily Davis',
    orderDate: new Date('2024-01-25'),
    testDate: new Date('2024-01-26'),
    status: 'processing',
    reportStatus: 'pending',
    price: 85.00
  },
  {
    testName: 'Diabetes Panel (HbA1c + Glucose)',
    doctorName: 'Dr. Robert Wilson',
    orderDate: new Date('2024-01-30'),
    status: 'sample-collected',
    reportStatus: 'pending',
    price: 65.00
  },
  {
    testName: 'Liver Function Test (LFT)',
    doctorName: 'Dr. Lisa Anderson',
    orderDate: new Date('2024-02-05'),
    status: 'ordered',
    reportStatus: 'pending',
    price: 70.00
  }
];

async function addSampleLabTestReports() {
  try {
    await connectDB();
    
    // Get a sample patient (first patient in the database)
    const patient = await User.findOne({ role: 'Patient' });
    if (!patient) {
      console.log('No patient found in database. Please create a patient first.');
      process.exit(1);
    }

    // Get a sample doctor (first doctor in the database)
    const doctor = await User.findOne({ role: 'Doctor' });
    if (!doctor) {
      console.log('No doctor found in database. Using patient as doctor for sample data.');
    }

    // Clear existing lab test reports for this patient
    await LabTestReport.deleteMany({ patientId: patient._id });
    console.log('Cleared existing lab test reports for patient:', patient.name);
    
    // Add sample lab test reports
    const labTestReports = [];
    for (const reportData of sampleLabTestReports) {
      const labTestReport = new LabTestReport({
        patientId: patient._id,
        doctorId: doctor ? doctor._id : patient._id, // Use doctor if available, otherwise use patient
        testName: reportData.testName,
        testCategory: 'lab-test',
        testDetails: {
          testType: 'Blood Test',
          sampleType: 'Blood',
          preparationInstructions: 'Fasting required for 8-12 hours',
          reportDeliveryTime: '24-48 hours'
        },
        orderDate: reportData.orderDate,
        testDate: reportData.testDate,
        status: reportData.status,
        reportStatus: reportData.reportStatus,
        reportUrl: reportData.reportUrl || '',
        reportGeneratedDate: reportData.reportGeneratedDate,
        price: reportData.price,
        paymentStatus: 'paid'
      });
      
      labTestReports.push(labTestReport);
    }

    const savedReports = await LabTestReport.insertMany(labTestReports);
    console.log(`Added ${savedReports.length} sample lab test reports:`);
    
    savedReports.forEach(report => {
      console.log(`- ${report.testName} (${report.status}) - $${report.price}`);
    });
    
    console.log('\nSample lab test reports added successfully!');
    console.log(`Patient: ${patient.name} (${patient.email})`);
    if (doctor) {
      console.log(`Doctor: ${doctor.name} (${doctor.email})`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample lab test reports:', error);
    process.exit(1);
  }
}

addSampleLabTestReports();
