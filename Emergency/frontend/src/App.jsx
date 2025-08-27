import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SignIn from './pages/SignIn';
import PatientSignIn from './pages/PatientSignIn';
import PatientSignUp from './pages/PatientSignUp';
import DriverSignIn from './pages/DriverSignIn';
import DriverSignUp from './pages/DriverSignUp';
import DriverDashboard from './pages/DriverDashboard';
import PatientDashboard from './pages/PatientDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignIn />} />
          
          {/* Patient Routes */}
          <Route path="/patient/signin" element={<PatientSignIn />} />
          <Route path="/patient/signup" element={<PatientSignUp />} />
          <Route 
            path="/patient/dashboard" 
            element={
              <ProtectedRoute role="Patient">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Driver Routes */}
          <Route path="/driver/signin" element={<DriverSignIn />} />
          <Route path="/driver/signup" element={<DriverSignUp />} />
          <Route 
            path="/driver/dashboard" 
            element={
              <ProtectedRoute role="Driver">
                <DriverDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
