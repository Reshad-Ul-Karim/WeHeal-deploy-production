import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  console.log('ProtectedRoute - Role:', role); // Debug log

  // For testing purposes, bypass authentication for driver role
  if (role === 'Driver') {
    console.log('Bypassing authentication for Driver role'); // Debug log
    // Set a mock user in localStorage for driver
    if (!localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify({
        role: 'Driver',
        name: 'Test Driver',
        email: 'driver@test.com'
      }));
    }
    return children;
  }

  // For patient role, check authentication as normal
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('Checking authentication for Patient role:', { token, user }); // Debug log

  if (!token || user.role !== role) {
    console.log('Authentication failed, redirecting to login'); // Debug log
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute; 