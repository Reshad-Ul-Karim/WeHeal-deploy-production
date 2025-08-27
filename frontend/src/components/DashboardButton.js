import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const DashboardButton = ({ userRole = 'patient' }) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const getDashboardPath = () => {
    switch (userRole) {
      case 'Admin':
        return '/dashboard/admin';
      case 'Doctor':
        return '/dashboard/doctor';
      case 'Nurse':
        return '/dashboard/doctor'; // Nurses use doctor dashboard
      case 'ClinicStaff':
        return '/dashboard/clinic-staff';
      case 'Driver':
        return '/dashboard/driver';
      case 'Patient':
      default:
        return '/dashboard/patient';
    }
  };

  const handleDashboardClick = () => {
    navigate(getDashboardPath());
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center'
    }}>
      {/* Cart Button */}
      <button
        onClick={handleCartClick}
        style={{
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '0.75rem',
          fontSize: '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
        }}
      >
        🛒 Cart
        {cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </button>

      {/* Dashboard Button */}
      <button
        onClick={handleDashboardClick}
        style={{
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '0.75rem',
          fontSize: '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
        }}
      >
        🏠 Dashboard
      </button>
    </div>
  );
};

export default DashboardButton;
