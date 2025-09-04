// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Landing from "./pages/Landing"; // Landing page component
import ForgotPassword from "./pages/ForgotPassword"; // Import ForgotPassword component
import VerifyEmail from "./pages/VerifyEmail"; // Import VerifyEmail component
import Login from "./pages/Login"; // Login page component
import Signup from "./pages/Signup"; // Example other page // Example dashboard after login
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import DriverDashboard from "./pages/dashboards/DriverDashboard";
import ClinicStaffDashboard from "./pages/dashboards/ClinicStaffDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import AdminUserDetails from "./pages/dashboards/AdminUserDetails";
import CustomerCareDashboard from "./pages/dashboards/CustomerCareDashboard";
import NurseDashboard from "./pages/dashboards/NurseDashboard";
import VideoCall from './components/VideoCall';
import Emergency from './pages/emergency/ServicesLanding';
import EmergencyTrack from './pages/emergency/EmergencyTrack';
import EmergencyPatientDashboard from './pages/emergency/PatientDashboard';
import EmergencyDriverDashboard from './pages/emergency/DriverDashboard';
import EmergencyNurseMarketplace from './pages/emergency/EmergencyNurseMarketplaceSimple';
import EmergencyNurseCheckout from './pages/emergency/EmergencyNurseCheckout';
import EmergencyNurseCheckoutCallback from './pages/emergency/EmergencyNurseCheckoutCallback';
import PatientEmergencyRequests from './pages/emergency/PatientEmergencyRequestsSimple';
import OxygenCylinderPage from './pages/emergency/OxygenCylinderPage';
import OxygenCylinderPayment from './pages/emergency/OxygenCylinderPayment';
import OxygenCylinderSuccess from './pages/emergency/OxygenCylinderSuccess';
import WheelchairPage from './pages/emergency/WheelchairPage';
import WheelchairPayment from './pages/emergency/WheelchairPayment';
import WheelchairSuccess from './pages/emergency/WheelchairSuccess';
import PaymentHistory from './pages/billing/PaymentHistory';

// Marketplace imports
import MarketplacePage from './pages/marketplace/MarketplacePage';
import CategoryPage from './pages/marketplace/CategoryPage';
import ProductDetailPage from './pages/marketplace/ProductDetailPage';
import CartPage from './pages/marketplace/CartPage';
import CheckoutPage from './pages/marketplace/CheckoutPage';
import OrdersPage from './pages/marketplace/OrdersPage';
import OrderDetailPage from './pages/marketplace/OrderDetailPage';

// Lab Test imports
import LabTestsPage from './pages/marketplace/LabTestsPage';
import MyLabTestsPage from './pages/marketplace/MyLabTestsPage';
import MyReportsPage from './pages/marketplace/MyReportsPage';

// Prescription imports
import PrescriptionForm from './components/prescription/PrescriptionForm';
import PrescriptionView from './components/prescription/PrescriptionView';

// Consultation Payment import
import ConsultationPayment from './components/ConsultationPayment';

// Context imports
import { CartProvider } from './contexts/CartContext';

// Styles
import './styles/prescription.css';


const App = () => {
  return (
    <CartProvider>
      <Router>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Navigate to="/dashboard/patient" />} />
          <Route path="/dashboard/patient" element={<PatientDashboard />} />
          <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
          <Route path="/dashboard/driver" element={<DriverDashboard />} />
          <Route path="/dashboard/customer-care" element={<CustomerCareDashboard />} />
          <Route path="/dashboard/nurse" element={<NurseDashboard />} />
          <Route path="/dashboard/clinic-staff" element={<ClinicStaffDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/admin/user/:id" element={<AdminUserDetails />} />
          <Route path="/video-call/:appointmentId" element={<VideoCall />} />
          
          {/* Emergency Routes */}
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/emergency/track/:requestId" element={<EmergencyTrack />} />
          <Route path="/emergency/patient" element={<EmergencyPatientDashboard />} />
          <Route path="/emergency/driver" element={<EmergencyDriverDashboard />} />
          <Route path="/emergency/nurse-marketplace" element={<EmergencyNurseMarketplace />} />
          <Route path="/emergency/nurse-checkout" element={<EmergencyNurseCheckout />} />
          <Route path="/emergency/nurse-payment-callback" element={<EmergencyNurseCheckoutCallback />} />
          <Route path="/emergency/my-requests" element={<PatientEmergencyRequests />} />
          <Route path="/emergency/oxygen-cylinder" element={<OxygenCylinderPage />} />
          <Route path="/oxygen-cylinder/payment" element={<OxygenCylinderPayment />} />
          <Route path="/oxygen-cylinder/success" element={<OxygenCylinderSuccess />} />
          <Route path="/emergency/wheelchair" element={<WheelchairPage />} />
          <Route path="/wheelchair/payment" element={<WheelchairPayment />} />
          <Route path="/wheelchair/success" element={<WheelchairSuccess />} />
          <Route path="/billing/payments" element={<PaymentHistory />} />
          
          {/* Marketplace Routes */}
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/category/:category" element={<CategoryPage />} />
          <Route path="/marketplace/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          
          {/* Lab Test Routes */}
          <Route path="/lab-tests" element={<LabTestsPage />} />
          <Route path="/lab-tests/my-tests" element={<MyLabTestsPage />} />
          <Route path="/lab-tests/my-reports" element={<MyReportsPage />} />
          
          {/* Prescription Routes */}
          <Route path="/prescription/create/:appointmentId" element={<PrescriptionForm />} />
          <Route path="/prescription/:id" element={<PrescriptionView />} />
          
          {/* Consultation Payment Routes */}
          <Route path="/consultation-payment/:appointmentId" element={<ConsultationPayment />} />
        </Route>

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Router>
    </CartProvider>
  );
};

export default App;