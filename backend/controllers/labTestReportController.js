import { LabTestReport } from '../models/labTestReportModel.js';
import { User } from '../models/userModel.js';

// Get patient's lab tests
export const getPatientLabTests = async (req, res) => {
  try {
    const patientId = req.user._id;
    
    const labTests = await LabTestReport.find({ patientId })
      .populate('doctorId', 'name doctorDetails')
      .sort({ orderDate: -1 });

    const formattedLabTests = labTests.map(test => ({
      reportId: test.reportId,
      testName: test.testName,
      doctorName: `Dr. ${test.doctorId.name}`,
      orderDate: test.orderDate,
      status: test.status,
      reportStatus: test.reportStatus,
      price: test.price,
      testDate: test.testDate,
      reportGeneratedDate: test.reportGeneratedDate,
      reportUrl: test.reportUrl
    }));

    res.json({
      success: true,
      data: formattedLabTests
    });
  } catch (error) {
    console.error('Error fetching patient lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab tests',
      error: error.message
    });
  }
};

// Get patient's lab reports
export const getPatientLabReports = async (req, res) => {
  try {
    const patientId = req.user._id;
    
    const labReports = await LabTestReport.find({ 
      patientId,
      status: 'completed'
    })
      .populate('doctorId', 'name doctorDetails')
      .sort({ orderDate: -1 });

    const formattedReports = labReports.map(report => ({
      reportId: report.reportId,
      testName: report.testName,
      doctorName: `Dr. ${report.doctorId.name}`,
      orderDate: report.orderDate,
      testDate: report.testDate,
      reportGeneratedDate: report.reportGeneratedDate,
      reportStatus: report.reportStatus,
      reportUrl: report.reportUrl,
      price: report.price
    }));

    res.json({
      success: true,
      data: formattedReports
    });
  } catch (error) {
    console.error('Error fetching patient lab reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab reports',
      error: error.message
    });
  }
};

// Create a new lab test order (when patient orders from marketplace)
export const createLabTestOrder = async (req, res) => {
  try {
    const { testName, doctorId, testDetails, price } = req.body;
    const patientId = req.user._id;

    if (!testName || !doctorId || !price) {
      return res.status(400).json({
        success: false,
        message: 'Test name, doctor ID, and price are required'
      });
    }

    const labTestOrder = new LabTestReport({
      patientId,
      doctorId,
      testName,
      testCategory: 'lab-test',
      testDetails,
      price: parseFloat(price),
      status: 'ordered',
      reportStatus: 'pending'
    });

    await labTestOrder.save();

    res.status(201).json({
      success: true,
      message: 'Lab test order created successfully',
      data: {
        reportId: labTestOrder.reportId,
        testName: labTestOrder.testName,
        orderDate: labTestOrder.orderDate,
        status: labTestOrder.status
      }
    });
  } catch (error) {
    console.error('Error creating lab test order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lab test order',
      error: error.message
    });
  }
};

// Update lab test status (for admin/doctor use)
export const updateLabTestStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, reportStatus, reportUrl, testDate, reportGeneratedDate } = req.body;

    const labTest = await LabTestReport.findOne({ reportId });
    
    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }

    // Update fields if provided
    if (status) labTest.status = status;
    if (reportStatus) labTest.reportStatus = reportStatus;
    if (reportUrl) labTest.reportUrl = reportUrl;
    if (testDate) labTest.testDate = testDate;
    if (reportGeneratedDate) labTest.reportGeneratedDate = reportGeneratedDate;

    await labTest.save();

    res.json({
      success: true,
      message: 'Lab test status updated successfully',
      data: {
        reportId: labTest.reportId,
        status: labTest.status,
        reportStatus: labTest.reportStatus
      }
    });
  } catch (error) {
    console.error('Error updating lab test status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lab test status',
      error: error.message
    });
  }
};
