import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { initFeatherIcons, getDoctorDashboard, logoutUser } from '../../utils/api';
import DoctorAvailability from '../../components/DoctorAvailability';
import DoctorProfile from '../../components/DoctorProfile';
import PrescriptionList from '../../components/prescription/PrescriptionList';
import '../../styles/Dashboard.css';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showLabTests, setShowLabTests] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profilePictureError, setProfilePictureError] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDarkMode(savedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const showNotification = (message, type = 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const handleLogout = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    
    try {
      await logoutUser();
      showNotification('Logged out successfully', 'success');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      showNotification('Error during logout. Please try again.', 'error');
    }
  };

  const handleRetryProfilePicture = () => {
    setProfilePictureError(false);
    if (profileData?.profilePicture) {
      // Force re-render of the image
      const img = new Image();
      img.onload = () => setProfilePictureError(false);
      img.onerror = () => setProfilePictureError(true);
      img.src = profileData.profilePicture;
    }
  };

  const handleProfilePictureUpdate = (newProfilePictureUrl) => {
    // Update the profile data with the new picture URL
    setProfileData(prev => ({
      ...prev,
      profilePicture: newProfilePictureUrl
    }));
    // Reset any profile picture errors
    setProfilePictureError(false);
  };

  const handleStartVideoCall = (appointmentId) => {
    navigate(`/video-call/${appointmentId}`);
  };

  const handleCreatePrescription = (appointmentId) => {
    navigate(`/prescription/create/${appointmentId}`);
  };

  const handleShowPrescriptions = () => {
    setShowPrescriptions(!showPrescriptions);
    setShowAvailability(false);
    setShowProfile(false);
    setShowLabTests(false);
    setShowEarnings(false);
  };

  const handleShowLabTests = () => {
    setShowLabTests(!showLabTests);
    setShowAvailability(false);
    setShowProfile(false);
    setShowPrescriptions(false);
    setShowEarnings(false);
  };

  const handleShowEarnings = () => {
    setShowEarnings(!showEarnings);
    setShowAvailability(false);
    setShowProfile(false);
    setShowPrescriptions(false);
    setShowLabTests(false);
  };

  const handleViewPatientDetails = async (appointment) => {
    try {
      console.log('Appointment data:', appointment); // Debug log
      
      // Show loading state
      showNotification('Loading patient details...', 'info');
      
      // Get patient ID from appointment
      const patientId = appointment.patientId || appointment.patient?._id;
      console.log('Patient ID extracted:', patientId); // Debug log
      
      if (!patientId) {
        showNotification('Patient ID not found in appointment data', 'error');
        console.error('No patient ID found in appointment:', appointment);
        return;
      }

      // Fetch patient details from API
      console.log('Making API call to:', `/api/doctor/patient/${patientId}`); // Debug log
      const response = await fetch(`/api/doctor/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('API response status:', response.status); // Debug log

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data); // Debug log
      
      if (data.success) {
        setSelectedPatient(data.data);
        setShowPatientDetails(true);
        showNotification('Patient details loaded successfully', 'success');
      } else {
        throw new Error(data.message || 'Failed to fetch patient details');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      showNotification(`Error loading patient details: ${error.message}`, 'error');
      
      // Fallback to basic appointment data if API fails
      const fallbackPatient = {
        id: appointment._id || Math.random().toString(36).substr(2, 9),
        name: appointment.patient || 'Unknown Patient',
        type: appointment.type || 'General Consultation',
        date: appointment.date || new Date().toLocaleDateString(),
        time: appointment.time || 'Not specified',
        status: appointment.status || 'Scheduled',
        phone: appointment.patientPhone || '+1 (555) 0123',
        email: appointment.patientEmail || 'patient@email.com',
        age: appointment.patientAge || 'Not specified',
        gender: appointment.patientGender || 'Not specified',
        bloodGroup: 'Not specified',
        allergies: 'Not specified',
        lastVisit: 'Not available',
        reasonForVisit: appointment.reason || 'General consultation',
        symptoms: appointment.symptoms || ['Not specified'],
        medicalHistory: 'Not available'
      };
      
      setSelectedPatient(fallbackPatient);
      setShowPatientDetails(true);
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('Starting to fetch dashboard data...'); // Debug log
      setLoading(true);
      const response = await getDoctorDashboard();
      console.log('Dashboard API response:', response); // Debug log
      if (response.success) {
        setDashboardData(response.data);
        setError(null);
        setLoading(false); // Fix: Set loading to false on success
        console.log('Dashboard data loaded successfully'); // Debug log
      } else {
        setError(response.message || 'Failed to fetch dashboard data');
        setLoading(false);
        console.log('Dashboard API failed:', response.message); // Debug log
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.response?.data?.message || 'Error loading dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Test backend connectivity first
      const testBackend = async () => {
        try {
          console.log('Testing backend connectivity...');
          const response = await fetch('https://weheal-backend.onrender.com/api/auth/check-auth', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          console.log('Backend connectivity test response:', response.status);
        } catch (error) {
          console.error('Backend connectivity test failed:', error);
        }
      };
      
      testBackend();
      fetchDashboardData();
      fetchProfileData();
    }
  }, [user]);

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
      // Reset error state when fetching new data
      setProfilePictureError(false);
      
      const response = await fetch('/api/doctor/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Raw profile data:', data.data); // Debug log
          console.log('Profile picture path from backend:', data.data.profilePicture); // Debug log
          
          // Use the helper function to construct proper URL
          const profilePictureUrl = constructProfilePictureUrl(data.data.profilePicture);
          console.log('Constructed profile picture URL:', profilePictureUrl); // Debug log
          
          const profileDataWithPicture = {
            ...data.data,
            profilePicture: profilePictureUrl
          };
          setProfileData(profileDataWithPicture);
        }
      } else {
        console.error('Profile API response not ok:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setProfilePictureError(true);
    }
  };

  useEffect(() => {
    initFeatherIcons();
  }, [dashboardData]);

  if (!user) {
    return (
      <div className="auth-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData || !dashboardData.user) {
    return <div className="error">No dashboard data available</div>;
  }

  return (
    <div className="doctor-dashboard-new">
      <div className="doctor-dashboard-layout">
        {/* Medical Insights Banner */}
        <div className="medical-insights-banner">
          <div className="medical-insights-header">
            <div className="medical-insights-icon">
              <i data-feather="activity"></i>
            </div>
            <h2 className="medical-insights-title">Medical Insights</h2>
          </div>
          <div className="medical-insights-content">
            <p className="medical-insight-text">
              Today's Priority: {dashboardData?.doctorData?.patientQueue?.waiting || 0} patients waiting, {dashboardData?.doctorData?.appointmentsToday || 0} appointments scheduled. Stay focused on providing excellent care.
            </p>
          </div>
        </div>

        <div className="doctor">
      <div className="header">
        <div className="search">
          <input 
            type="text" 
            placeholder="Search patients, records..." 
            onChange={(e) => {
              if (e.target.value.length > 2) {
                showNotification(`Searching for: ${e.target.value}`, 'info');
              }
            }}
          />
          <button 
            className="search-btn"
            onClick={() => showNotification('Advanced search coming soon...', 'info')}
          >
            <i data-feather="search"></i>
          </button>
        </div>
        <div className="profile">
          <button 
            className="theme-toggle-btn"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i data-feather={isDarkMode ? 'sun' : 'moon'}></i>
          </button>
          {profileData?.profilePicture && !profilePictureError ? (
            <img 
              src={profileData.profilePicture} 
              alt="Profile" 
              className="profile-avatar"
              onError={(e) => {
                console.error('Error loading profile picture:', e);
                console.error('Failed URL:', profileData.profilePicture);
                console.error('Error details:', e.nativeEvent);
                setProfilePictureError(true);
              }}
            />
          ) : (
            <div className="profile-avatar-container">
              <div className="profile-avatar-placeholder">
                <i data-feather="user"></i>
              </div>
              {profilePictureError && profileData?.profilePicture && (
                <button 
                  className="retry-profile-btn"
                  onClick={handleRetryProfilePicture}
                  title="Retry loading profile picture"
                >
                  <i data-feather="refresh-cw"></i>
                </button>
              )}
            </div>
          )}
          <span>Dr. {user.name}</span>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <i data-feather="log-out"></i>
            Logout
          </button>
        </div>
      </div>

      <h1>Welcome, Dr. {user.name}</h1>

      <div className="actions-top">
        <button 
          className="btn btn-primary btn-large"
          onClick={() => showNotification('Starting consultation...', 'info')}
        >
          <i data-feather="video"></i>
          Start Consultation
        </button>
        <button 
          className="btn btn-secondary btn-medium"
          onClick={() => showNotification('Opening schedule...', 'info')}
        >
          <i data-feather="calendar"></i>
          View Schedule
        </button>
        <button 
          className={`btn btn-medium ${showAvailability ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setShowAvailability(!showAvailability);
            setShowProfile(false);
            setShowPrescriptions(false);
            setShowLabTests(false);
            setShowEarnings(false);
          }}
        >
          <i data-feather="clock"></i>
          {showAvailability ? 'Hide Availability' : 'Manage Availability'}
        </button>
        <button 
          className={`btn btn-medium ${showProfile ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setShowProfile(!showProfile);
            setShowAvailability(false);
            setShowPrescriptions(false);
            setShowLabTests(false);
            setShowEarnings(false);
          }}
        >
          <i data-feather="user"></i>
          {showProfile ? 'Hide Profile' : 'Edit Profile'}
        </button>
        <button 
          className={`btn btn-medium ${showPrescriptions ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleShowPrescriptions}
        >
          <i data-feather="file-text"></i>
          {showPrescriptions ? 'Hide Prescriptions' : 'Generate Prescription'}
        </button>
        <button 
          className={`btn btn-medium ${showLabTests ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleShowLabTests}
        >
          <i data-feather="clipboard"></i>
          {showLabTests ? 'Hide Lab Tests' : 'Assigned Lab Tests'}
        </button>
        <button 
          className={`btn btn-medium ${showEarnings ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleShowEarnings}
        >
          <i data-feather="dollar-sign"></i>
          {showEarnings ? 'Hide Earnings' : 'View Earnings'}
        </button>
      </div>

      {/* Main Dashboard Content - Only show when no sections are active */}
      {!showAvailability && !showProfile && !showPrescriptions && !showLabTests && !showEarnings && (
        <>
          <section className="schedule-section">
            <h2>Today's Schedule</h2>
            <div className="timeline">
              {dashboardData?.doctorData?.schedule?.map((appointment) => (
                <div className="timeline-item" key={appointment._id}>
                  <span className="time">{appointment.time}</span>
                  <div className="details">
                    <span className="patient-name">{appointment.patient}</span>
                    <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <span className="mode">{appointment.type}</span>
                  <div className="appointment-actions">
                    <div className="appointment-actions">
                      {appointment.type === 'Tele-Consult' && (
                        <button 
                          className="btn btn-primary btn-small"
                          onClick={() => handleStartVideoCall(appointment._id)}
                          disabled={appointment.videoCallStatus === 'completed'}
                        >
                          <i data-feather="video"></i>
                          {appointment.videoCallStatus === 'in-progress' ? 'Join Call' : 
                           appointment.videoCallStatus === 'completed' ? 'Call Completed' : 
                           'Start Call'}
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleViewPatientDetails(appointment)}
                      >
                        <i data-feather="file-text"></i>
                        View Details
                      </button>
                      <button 
                        className="btn btn-success btn-small"
                        onClick={() => handleCreatePrescription(appointment._id)}
                        title="Create Prescription"
                      >
                        <i data-feather="file-plus"></i>
                        Prescription
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(!dashboardData?.doctorData?.schedule || dashboardData.doctorData.schedule.length === 0) && (
                <div className="no-appointments">
                  <i data-feather="calendar"></i>
                  <p>No appointments scheduled for today</p>
                </div>
              )}
            </div>
          </section>

          <div className="summary-row">
            <div className="summary-card">
              <h3>Patient Statistics</h3>
              <p>Total Patients: <strong>{dashboardData?.doctorData?.totalPatients || 0}</strong></p>
              <p>Appointments Today: <strong>{dashboardData?.doctorData?.appointmentsToday || 0}</strong></p>
              <p>Upcoming Appointments: <strong>{dashboardData?.doctorData?.upcomingAppointments || 0}</strong></p>
              <p>Completed Appointments: <strong>{dashboardData?.doctorData?.completedAppointments || 0}</strong></p>
            </div>
          </div>

          <div className="summary-row">
            <div className="summary-card card-queue">
              <h3>Patient Queue</h3>
              <div className="value">{dashboardData?.doctorData?.patientQueue?.waiting || 0}</div>
              <div className="sub">Patients Waiting</div>
            </div>
            <div className="summary-card card-prescribe">
              <h3>Prescriptions</h3>
              <div className="value">{dashboardData?.doctorData?.prescriptionsToday?.completed || 0}</div>
              <div className="sub">Today's Total</div>
            </div>
            <div className="summary-card card-messages">
              <h3>Messages</h3>
              <div className="value">{dashboardData?.doctorData?.messages?.unread || 0}</div>
              <div className="sub">Unread</div>
            </div>
          </div>

          <div className="content-split">
            <div className="table-container">
              <div className="table-header">
                <h3>All Appointments</h3>
                <div className="search-actions">
                  <input 
                    type="text" 
                    placeholder="Search appointments..." 
                    onChange={(e) => showNotification(`Searching for: ${e.target.value}`, 'info')}
                  />
                  <div className="actions">
                    <button 
                      title="Download CSV"
                      onClick={() => showNotification('Download functionality coming soon...', 'info')}
                    >
                      <i data-feather="download"></i>
                    </button>
                    <button 
                      title="Refresh" 
                      onClick={() => {
                        showNotification('Refreshing data...', 'info');
                        fetchDashboardData();
                      }}
                    >
                      <i data-feather="refresh-ccw"></i>
                    </button>
                  </div>
                </div>
              </div>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.doctorData?.allAppointments?.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>{appointment.date}</td>
                      <td>{appointment.time}</td>
                      <td>{appointment.patient}</td>
                      <td>{appointment.type}</td>
                      <td>
                        <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td>
                        <span className={`payment-badge payment-${appointment.consultationPaymentStatus || 'pending'}`}>
                          {appointment.consultationPaymentStatus === 'completed' ? 'Paid' : 
                           appointment.consultationPaymentStatus === 'failed' ? 'Failed' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          {appointment.type === 'Tele-Consult' && (
                            <button 
                              className="btn btn-primary btn-small"
                              onClick={() => handleStartVideoCall(appointment._id)}
                              disabled={appointment.videoCallStatus === 'completed'}
                            >
                              <i data-feather="video"></i>
                              {appointment.videoCallStatus === 'in-progress' ? 'Join Call' : 
                               appointment.videoCallStatus === 'completed' ? 'Call Completed' : 
                               'Start Call'}
                            </button>
                          )}
                          <button 
                            className="btn btn-secondary btn-small"
                            onClick={() => handleViewPatientDetails(appointment)}
                          >
                            <i data-feather="file-text"></i>
                            View Details
                          </button>
                          <button 
                            className="btn btn-success btn-small"
                            onClick={() => handleCreatePrescription(appointment._id)}
                            title="Create Prescription"
                          >
                            <i data-feather="file-plus"></i>
                            Prescription
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!dashboardData?.doctorData?.allAppointments || dashboardData.doctorData.allAppointments.length === 0) && (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No appointments scheduled
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>


          </div>
        </>
      )}

      {/* Render Sections */}
      {showAvailability && (
        <div className="section-panel">
          <div className="section-header">
            <h2>Manage Availability</h2>
            <button 
              className="close-btn-red" 
              onClick={() => setShowAvailability(false)}
              title="Close"
            >
              <i data-feather="x"></i>
            </button>
          </div>
          <div className="section-content">
            <DoctorAvailability />
          </div>
        </div>
      )}

      {showProfile && (
        <div className="section-panel">
          <div className="section-header">
            <h2>Edit Profile</h2>
            <button 
              className="close-btn-red" 
              onClick={() => setShowProfile(false)}
              title="Close"
            >
              <i data-feather="x"></i>
            </button>
          </div>
          <div className="section-content">
            <DoctorProfile onProfileUpdate={handleProfilePictureUpdate} />
          </div>
        </div>
      )}

      {showPrescriptions && (
        <div className="section-panel">
          <div className="section-header">
            <h2>My Prescriptions</h2>
            <button 
              className="close-btn-red" 
              onClick={() => setShowPrescriptions(false)}
              title="Close"
            >
              <i data-feather="x"></i>
            </button>
          </div>
          <div className="section-content">
            <PrescriptionList userRole="doctor" />
          </div>
        </div>
      )}

      {showLabTests && (
        <div className="section-panel">
          <div className="section-header">
            <h2>Lab Tests</h2>
            <button 
              className="close-btn-red" 
              onClick={() => setShowLabTests(false)}
              title="Close"
            >
              <i data-feather="x"></i>
            </button>
          </div>
          <div className="section-content">
            <div className="lab-tests-panel">
              <p>Lab test management functionality will be implemented here.</p>
            </div>
          </div>
        </div>
      )}

      {showEarnings && (
        <div className="section-panel">
          <div className="section-header">
            <h2>Earnings & Analytics</h2>
            <button 
              className="close-btn-red" 
              onClick={() => setShowEarnings(false)}
              title="Close"
            >
              <i data-feather="x"></i>
            </button>
          </div>
          <div className="section-content">
            <p>Earnings and analytics functionality will be implemented here.</p>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <div className="modal-overlay-new" onClick={() => setShowPatientDetails(false)}>
          <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-new">
              <h2>Patient Details</h2>
              <button className="close-btn-red" onClick={() => setShowPatientDetails(false)} title="Close">
                <i data-feather="x"></i>
              </button>
            </div>
            <div className="modal-body-new">
              <div className="patient-details-section">
                <div className="patient-header">
                  <div className="patient-avatar">
                    <div className="avatar-placeholder">
                      <i data-feather="user"></i>
                    </div>
                  </div>
                  <div className="patient-info">
                    <h3>{selectedPatient.name}</h3>
                    <p>Patient ID: #{selectedPatient._id?.slice(-6) || 'N/A'}</p>
                    <span className="status-badge status-active">
                      Active Patient
                    </span>
                  </div>
                </div>

                <div className="patient-details-grid">
                  <div className="detail-section">
                    <h4>Contact Information</h4>
                    <div className="detail-item">
                      <i data-feather="phone"></i>
                      <div>
                        <span className="label">Phone</span>
                        <span className="value">{selectedPatient.phone}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <i data-feather="mail"></i>
                      <div>
                        <span className="label">Email</span>
                        <span className="value">{selectedPatient.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Basic Information</h4>
                    <div className="detail-item">
                      <i data-feather="calendar"></i>
                      <div>
                        <span className="label">Age</span>
                        <span className="value">{selectedPatient.age} years</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <i data-feather="user"></i>
                      <div>
                        <span className="label">Gender</span>
                        <span className="value">{selectedPatient.gender}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <i data-feather="droplet"></i>
                      <div>
                        <span className="label">Blood Group</span>
                        <span className="value">{selectedPatient.bloodGroup}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Appointment Details</h4>
                    {selectedPatient.appointments && selectedPatient.appointments.length > 0 ? (
                      selectedPatient.appointments.slice(0, 3).map((apt, index) => (
                        <div key={apt._id} className="detail-item">
                          <i data-feather="calendar"></i>
                          <div>
                            <span className="label">Appointment {index + 1}</span>
                            <span className="value">
                              {new Date(apt.appointmentDate).toLocaleDateString()} - {apt.startTime}
                            </span>
                            <span className="sub-value">Type: {apt.type} | Status: {apt.status}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="detail-item">
                        <i data-feather="calendar"></i>
                        <div>
                          <span className="label">No Appointments</span>
                          <span className="value">No appointment history found</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <h4>Medical Information</h4>
                    <div className="detail-item">
                      <i data-feather="alert-triangle"></i>
                      <div>
                        <span className="label">Allergies</span>
                        <span className="value">{selectedPatient.patientDetails?.allergies || 'None reported'}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <i data-feather="clock"></i>
                      <div>
                        <span className="label">Last Visit</span>
                        <span className="value">
                          {selectedPatient.appointments && selectedPatient.appointments.length > 0 
                            ? new Date(selectedPatient.appointments[0].appointmentDate).toLocaleDateString()
                            : 'No visits recorded'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section full-width">
                    <h4>Current Visit</h4>
                    <div className="detail-item">
                      <i data-feather="clipboard"></i>
                      <div>
                        <span className="label">Reason for Visit</span>
                        <span className="value">{selectedPatient.reasonForVisit}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <i data-feather="thermometer"></i>
                      <div>
                        <span className="label">Symptoms</span>
                        <span className="value">{selectedPatient.symptoms}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section full-width">
                    <h4>Medical History</h4>
                    <div className="medical-history">
                      <p>{selectedPatient.medicalHistory}</p>
                    </div>
                  </div>
                </div>

                <div className="patient-actions">
                  <button className="btn btn-primary">
                    <i data-feather="file-plus"></i>
                    Add Notes
                  </button>
                  <button className="btn btn-secondary">
                    <i data-feather="file-text"></i>
                    Generate Prescription
                  </button>
                  <button className="btn btn-outline">
                    <i data-feather="clipboard"></i>
                    Order Lab Tests
                  </button>
                  <button className="btn btn-outline" onClick={() => setShowPatientDetails(false)}>
                    <i data-feather="x"></i>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard; 