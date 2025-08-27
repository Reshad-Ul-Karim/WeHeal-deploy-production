import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { initFeatherIcons, getDashboard, logoutUser } from '../../utils/api';
import '../../styles/Dashboard.css';

const ClinicStaffDashboard = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await getDashboard();
        if (response.success) {
          setDashboardData(response.data);
        } else {
          setError(response.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        setError('Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    initFeatherIcons();
    fetchDashboardData();
    fetchProfileData();
  }, []);

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
      return picturePath; // Use the proxy which is set to http://localhost:5001
    }
    
    // Fallback: construct the full URL
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    const cleanPath = picturePath.replace(/^\//, ''); // Remove leading slash
    return `${baseUrl}/${cleanPath}`;
  };

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/clinic-staff/profile', {
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

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="staff">
      <div className="header">
        <div className="search">
          <input type="text" placeholder="Search appointments, patients..." />
        </div>
        <div className="profile">
          {profileData?.profilePicture ? (
            <img 
              src={profileData.profilePicture} 
              alt="Profile" 
              className="profile-avatar"
              onError={(e) => {
                console.error('Error loading profile picture:', e);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : (
            <div className="profile-avatar-placeholder">
              <i data-feather="user"></i>
            </div>
          )}
          <span>{user.name}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            <i data-feather="log-out"></i>
            Logout
          </button>
        </div>
      </div>

      <h1>Welcome, {user.name}</h1>

      <div className="widgets-row">
        <div className="widget">
          <h3>Today's Overview</h3>
          <p>Total Appointments: <strong>{dashboardData?.staffData?.totalAppointments || 0}</strong></p>
          <p>Pending Tasks: <strong>{dashboardData?.staffData?.pendingTasks || 0}</strong></p>
          <p>Inventory Alerts: <strong>{dashboardData?.staffData?.inventoryAlerts || 0}</strong></p>
        </div>

        <div className="widget">
          <h3>Today's Schedule</h3>
          <ul>
            {dashboardData?.staffData?.todaySchedule?.map((schedule, index) => (
              <li key={index}>
                <span>
                  {schedule.time} - {schedule.patient} with {schedule.doctor}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="actions-row">
        <button className="btn btn-primary">
          <i data-feather="user-plus"></i>
          Check-In Patient
        </button>
        <button className="btn btn-primary">
          <i data-feather="calendar"></i>
          Schedule Appointment
        </button>
        <button className="btn btn-primary">
          <i data-feather="dollar-sign"></i>
          Process Payment
        </button>
        <button className="btn btn-primary">
          <i data-feather="file-text"></i>
          View Reports
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <input type="text" placeholder="Search appointments..." />
          <div className="actions">
            <button title="Download CSV">
              <i data-feather="download"></i>
            </button>
            <button title="Refresh">
              <i data-feather="refresh-ccw"></i>
            </button>
          </div>
        </div>
        <table className="app-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Room</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>09:00 AM</td>
              <td>John Smith</td>
              <td>Dr. Wilson</td>
              <td>Room 101</td>
              <td><span className="status-scheduled">Checked In</span></td>
              <td>
                <button className="btn btn-primary">Update</button>
                <button className="btn btn-secondary">View</button>
              </td>
            </tr>
            <tr>
              <td>09:30 AM</td>
              <td>Sarah Johnson</td>
              <td>Dr. Lee</td>
              <td>Room 102</td>
              <td><span className="status-pending">Waiting</span></td>
              <td>
                <button className="btn btn-primary">Check In</button>
                <button className="btn btn-secondary">View</button>
              </td>
            </tr>
            <tr>
              <td>10:00 AM</td>
              <td>Mike Davis</td>
              <td>Dr. Smith</td>
              <td>Room 103</td>
              <td><span className="status-cancelled">Cancelled</span></td>
              <td>
                <button className="btn btn-primary">Reschedule</button>
                <button className="btn btn-secondary">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClinicStaffDashboard; 