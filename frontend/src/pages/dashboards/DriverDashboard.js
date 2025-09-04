import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { logoutUser } from '../../utils/api';
import { initFeatherIcons } from '../../utils/api';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  useEffect(() => {
    // If user is loaded, navigate to emergency driver dashboard
    if (user) {
      // Redirect to emergency driver dashboard
      navigate('/emergency/driver');
      fetchProfileData();
    }
    
    initFeatherIcons();
  }, [user, navigate]);

  // Helper function to construct proper profile picture URL
  const constructProfilePictureUrl = (picturePath) => {
    if (!picturePath) return null;
    
    // If it's already a full URL, return as is
    if (picturePath.startsWith('http') || picturePath.startsWith('data:')) {
      return picturePath;
    }
    
    // If it's a relative path starting with /uploads, use the proxy
    // The backend now returns /uploads/profiles/filename and the proxy should handle this
    if (picturePath.startsWith('/uploads/')) {
      return picturePath; // Use the proxy which is set to https://weheal-backend.onrender.com
    }
    
    // Fallback: construct the full URL
    const baseUrl = process.env.REACT_APP_API_URL || 'https://weheal-backend.onrender.com';
    const cleanPath = picturePath.replace(/^\//, ''); // Remove leading slash
    return `${baseUrl}/${cleanPath}`;
  };

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/driver/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Use the helper function to construct proper URL
          const profileDataWithPicture = {
            ...data.data,
            profilePicture: constructProfilePictureUrl(data.data.profilePicture)
          };
          setProfileData(profileDataWithPicture);
        }
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!user) {
    return <div>Please log in to view your dashboard.</div>;
  }
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="patient-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Welcome back, {user.name}</h1>
          <p>Loading Driver Dashboard...</p>
        </div>
        <div className="header-right">
          <div className="profile-section">
            <img src="https://i.pravatar.cc/40" alt="Profile" />
            <div className="profile-info">
              <span>{user.name}</span>
              <small>Driver</small>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout}>
              <i data-feather="log-out"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="text-center py-8">
        <p>Redirecting to emergency dashboard...</p>
        <div className="loading-spinner mt-4"></div>
      </div>
    </div>
  );
};

export default DriverDashboard; 