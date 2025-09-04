# WeHeal Backend API Endpoints Guide

## Base URL
**Production**: `https://weheal-backend.onrender.com/api`
**Development**: `http://localhost:5001/api`

## Complete API Endpoints List

### 🔐 Authentication Routes (`/api/auth`)
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/check-auth` - Check authentication status
- `GET /api/auth/dashboard` - Get dashboard data

### 📊 Dashboard Routes (`/api/dashboard`)
- `GET /api/dashboard` - Get dashboard statistics

### 👨‍💼 Admin Routes (`/api/admin`)
- Admin management endpoints (protected by admin middleware)

### 🛒 Admin Marketplace Routes (`/api/admin/marketplace`)
- Admin marketplace management endpoints

### 🏪 Marketplace Routes (`/api/marketplace`)
- `GET /api/marketplace/products` - Get all products
- `GET /api/marketplace/products/category/:category` - Get products by category
- `GET /api/marketplace/products/:id` - Get product by ID

### 🛒 Cart Routes (`/api/cart`)
- Cart management endpoints

### 📦 Order Routes (`/api/orders`)
- Order management endpoints

### 📹 Video Call Routes (`/api/video-call`)
- Video call management endpoints

### 👨‍⚕️ Doctor Routes (`/api/doctor`)
- `GET /api/doctor/dashboard` - Doctor dashboard
- `GET /api/doctor/availability` - Get doctor availability
- `PUT /api/doctor/availability` - Update doctor availability
- `GET /api/doctor/availability/all` - Get all doctor availability
- `GET /api/doctor/patient/:patientId` - Get patient details
- `GET /api/doctor/appointment/:appointmentId` - Get appointment details
- `GET /api/doctor/profile` - Get doctor profile
- `PUT /api/doctor/profile` - Update doctor profile
- `GET /api/doctor/specializations` - Get specializations
- `POST /api/doctor/upload-profile-picture` - Upload profile picture

### 👤 Patient Routes (`/api/patient`)
- `GET /api/patient/dashboard` - Patient dashboard
- `GET /api/patient/search-doctors` - Search doctors
- `GET /api/patient/doctor-availability` - Get doctor availability
- `POST /api/patient/book-appointment` - Book appointment
- `POST /api/patient/cancel-appointment` - Cancel appointment

### 💊 Prescription Routes (`/api/prescriptions`)
- Prescription management endpoints

### 📋 Subscription Routes (`/api/subscriptions`)
- Subscription management endpoints

### ⚡ Flash Sale Routes (`/api/flash-sales`)
- Flash sale management endpoints

### 🚨 Emergency Routes (`/api/emergency`)
- `POST /api/emergency/request` - Create emergency request
- `POST /api/emergency/accept/:requestId` - Accept emergency request
- `PUT /api/emergency/status/:requestId` - Update request status
- `GET /api/emergency/request/:requestId` - Get request details
- `PUT /api/emergency/payment/:requestId` - Update payment status
- `GET /api/emergency/driver/profile` - Get driver profile
- `PUT /api/emergency/driver/profile` - Update driver profile
- `GET /api/emergency/drivers` - Get all drivers
- `POST /api/emergency/driver/upload-profile-picture` - Upload driver profile picture
- `PUT /api/emergency/ride/:requestId` - Update ride details
- `GET /api/emergency/ride/:requestId` - Get ride details

### 🏥 Lab Center Routes (`/api/lab-centers`)
- `GET /api/lab-centers` - Get all lab centers
- `GET /api/lab-centers/city/:city` - Get lab centers by city
- `GET /api/lab-centers/:id` - Get lab center by ID
- `POST /api/lab-centers` - Create lab center (Admin)
- `PUT /api/lab-centers/:id` - Update lab center (Admin)
- `DELETE /api/lab-centers/:id` - Delete lab center (Admin)

### 💰 Payment Routes (`/api/payments`)
- `POST /api/payments/init` - Initialize payment
- `POST /api/payments/verify/:orderId` - Verify payment
- `GET /api/payments/status/:orderId` - Get payment status
- `GET /api/payments/user` - Get user payments
- `GET /api/payments/receipt/:orderId` - Generate receipt

### 🧪 Lab Test Routes
- `GET /api/lab-test-pricing` - Get lab test pricing
- `POST /api/lab-test-pricing` - Create lab test pricing (Admin)
- `PUT /api/lab-test-pricing/:id` - Update lab test pricing (Admin)
- `DELETE /api/lab-test-pricing/:id` - Delete lab test pricing (Admin)

### 📊 Lab Test Report Routes
- `GET /api/lab-test-reports` - Get lab test reports
- `POST /api/lab-test-reports` - Create lab test report
- `GET /api/lab-test-reports/:id` - Get lab test report by ID
- `PUT /api/lab-test-reports/:id` - Update lab test report
- `DELETE /api/lab-test-reports/:id` - Delete lab test report

### 🚑 Emergency Nurse Routes (`/api/emergency-nurses`)
- Emergency nurse management endpoints

### 🛒 Additional Routes
- `GET /api/oxygen-cylinders` - Oxygen cylinder management
- `GET /api/wheelchairs` - Wheelchair management
- `GET /api/customer-care` - Customer care endpoints
- `GET /api/reports` - Report generation endpoints

## Frontend Configuration

### Update Frontend API Base URL

In your frontend, update the API base URL to use the production backend:

```javascript
// In your frontend configuration
const API_BASE_URL = 'https://weheal-backend.onrender.com/api';

// Or set as environment variable
REACT_APP_API_URL=https://weheal-backend.onrender.com/api
```

### Common Frontend API Calls

```javascript
// Example API calls from frontend
const response = await fetch('https://weheal-backend.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(loginData)
});

// For protected routes
const response = await fetch('https://weheal-backend.onrender.com/api/patient/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});
```

## Testing Endpoints

### Health Check
```bash
curl https://weheal-backend.onrender.com/api/auth/check-auth
```

### Test Authentication
```bash
curl -X POST https://weheal-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Important Notes

1. **CORS**: Backend is configured to allow requests from `https://weheal-frontend.onrender.com`
2. **Authentication**: Most routes require JWT token in Authorization header
3. **File Uploads**: Profile pictures and other files are handled via multipart/form-data
4. **Rate Limiting**: Consider implementing rate limiting for production
5. **SSL**: All production endpoints use HTTPS

## Environment Variables for Frontend

Make sure these are set in your Render frontend service:

```
REACT_APP_API_URL=https://weheal-backend.onrender.com/api
REACT_APP_ZEGO_APP_ID=1347306852
REACT_APP_ZEGO_SERVER_SECRET=f613212fd9bc5b92cd5f4341e58becde
```
