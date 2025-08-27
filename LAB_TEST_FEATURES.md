# Lab Test Features Documentation

## Overview
This document describes the new lab test functionality that has been added to the WeHeal healthcare marketplace. The lab test system provides a dedicated interface for patients to browse, order, and track their lab tests and reports.

## New Features

### 1. Dedicated Lab Test Section
- **Route**: `/lab-tests`
- **Description**: A dedicated page that shows only lab test products
- **Features**:
  - Shows only lab test products (filtered by category)
  - Search functionality for lab tests
  - Sorting options (price, name, date)
  - "My Lab Tests" and "My Reports" buttons at the top

### 2. My Lab Tests Page
- **Route**: `/lab-tests/my-tests`
- **Description**: Shows all lab tests ordered by the patient
- **Features**:
  - Displays test name, referring doctor, order date, status
  - Shows test date and price
  - Status indicators (ordered, sample-collected, processing, completed, cancelled)
  - View and download buttons for completed reports
  - Appropriate messages for pending reports

### 3. My Reports Page
- **Route**: `/lab-tests/my-reports`
- **Description**: Shows completed lab test reports
- **Features**:
  - Displays only completed lab tests
  - View and download PDF options for ready reports
  - Shows "Lab report is yet to come" message for pending reports
  - Shows "No lab reports available" when no reports exist

## Database Changes

### New Model: LabTestReport
```javascript
{
  reportId: String (unique),
  patientId: ObjectId (ref: User),
  doctorId: ObjectId (ref: User),
  testName: String,
  testCategory: String (enum: ['lab-test']),
  testDetails: {
    testType: String,
    sampleType: String,
    preparationInstructions: String,
    reportDeliveryTime: String
  },
  orderDate: Date,
  testDate: Date,
  status: String (enum: ['ordered', 'sample-collected', 'processing', 'completed', 'cancelled']),
  reportStatus: String (enum: ['pending', 'ready', 'not-available']),
  reportFile: String,
  reportUrl: String,
  reportGeneratedDate: Date,
  notes: String,
  price: Number,
  paymentStatus: String (enum: ['pending', 'paid', 'failed'])
}
```

## API Endpoints

### Lab Test Reports
- `GET /api/lab-tests/patient/tests` - Get patient's lab tests
- `GET /api/lab-tests/patient/reports` - Get patient's lab reports
- `POST /api/lab-tests/patient/order` - Create lab test order
- `PUT /api/lab-tests/:reportId/status` - Update lab test status (admin/doctor)

## Patient Dashboard Changes

### Marketplace Section
- The "Lab Tests" button in the patient dashboard now redirects to `/lab-tests` instead of `/marketplace/category/lab-test`
- This provides a more focused experience for lab test ordering

## Order Processing Changes

### Enhanced Order Controller
- Automatically creates lab test report entries when lab tests are ordered
- Different delivery estimates for lab tests (2 days) vs medicines (7 days)
- No stock reduction for lab tests (since they're services, not physical products)

## Setup Instructions

### 1. Database Setup
The new model will be automatically created when the application starts. No manual database setup is required.

### 2. Add Sample Data (Optional)
To test the functionality with sample data, run:
```bash
cd backend
node scripts/addSampleLabTestReports.js
```

This will create sample lab test reports for the first patient in your database.

### 3. Testing the Features

#### For Patients:
1. Login as a patient
2. Go to Dashboard → Marketplace
3. Click on "Lab Tests" button
4. Browse lab tests and add to cart
5. Complete checkout
6. View "My Lab Tests" to see order status
7. View "My Reports" to see completed reports

#### For Admins/Doctors:
1. Use the API endpoint to update lab test status:
```bash
PUT /api/lab-tests/:reportId/status
{
  "status": "completed",
  "reportStatus": "ready",
  "reportUrl": "https://example.com/report.pdf",
  "reportGeneratedDate": "2024-01-17T00:00:00.000Z"
}
```

## File Structure

### New Files Created:
- `backend/models/labTestReportModel.js` - Lab test report model
- `backend/controllers/labTestReportController.js` - Lab test report controller
- `backend/routes/labTestReportRoutes.js` - Lab test report routes
- `backend/scripts/addSampleLabTestReports.js` - Sample data script
- `frontend/src/pages/marketplace/LabTestsPage.js` - Lab tests page
- `frontend/src/pages/marketplace/MyLabTestsPage.js` - My lab tests page
- `frontend/src/pages/marketplace/MyReportsPage.js` - My reports page

### Modified Files:
- `backend/server.js` - Added lab test routes
- `backend/controllers/orderController.js` - Enhanced order processing
- `frontend/src/App.js` - Added new routes
- `frontend/src/pages/dashboards/PatientDashboard.js` - Updated marketplace navigation

## Status Flow

### Lab Test Status:
1. **ordered** - Test has been ordered
2. **sample-collected** - Sample has been collected
3. **processing** - Test is being processed
4. **completed** - Test is completed
5. **cancelled** - Test was cancelled

### Report Status:
1. **pending** - Report is not ready yet
2. **ready** - Report is available for viewing/download
3. **not-available** - Report is not available

## User Experience

### When No Lab Tests Exist:
- "My Lab Tests" shows: "No Lab Tests Found" with option to browse lab tests
- "My Reports" shows: "No Lab Reports Available" with explanation

### When Lab Tests Are Ordered But Reports Not Ready:
- Shows test details with status
- View/Download buttons show: "Lab report is yet to come. Please check again later."

### When Reports Are Ready:
- Shows test details
- View button opens report in new tab
- Download button downloads PDF file

## Future Enhancements

1. **Doctor Assignment**: Allow doctors to be properly assigned to lab test orders
2. **Report Upload**: Add functionality for doctors/admins to upload report files
3. **Notifications**: Send notifications when reports are ready
4. **Lab Test Scheduling**: Allow patients to schedule lab test appointments
5. **Report Sharing**: Allow patients to share reports with doctors
6. **Analytics**: Add analytics for lab test trends and usage

## Troubleshooting

### Common Issues:

1. **No lab tests showing**: Make sure you have lab test products in the database
2. **API errors**: Check that the lab test routes are properly added to server.js
3. **Permission errors**: Ensure the user has the correct role (Patient for viewing, Doctor/Admin for updating)

### Debug Steps:
1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Verify database connections
4. Ensure all routes are properly configured
