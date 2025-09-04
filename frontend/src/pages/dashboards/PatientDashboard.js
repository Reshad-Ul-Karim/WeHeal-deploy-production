import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { initFeatherIcons, getPatientDashboard, logoutUser, api } from '../../utils/api';
import DoctorSearch from '../../components/DoctorSearch';
import ReportsSection from '../../components/ReportsSection';
import PrescriptionList from '../../components/prescription/PrescriptionList';
import HealthTips from '../../components/HealthTips';
import SubscriptionManagement from '../../components/subscription/SubscriptionManagement';
import './PatientDashboard.css';
import { paymentAPI } from '../../services/marketplaceAPI';
import '../../styles/marketplace.css';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Alert from '@mui/material/Alert';
import { websocketService } from '../../services/websocket';

const PatientDashboard = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatAssignedAgent, setChatAssignedAgent] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    age: '',
    weight: '',
    height: '',
    address: '',
    bloodGroup: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
    medicalHistory: [],
    allergies: [],
    currentMedications: []
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const notificationRef = useRef(null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationDropdown]);

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

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!appointmentId) {
      alert('Invalid appointment');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setCancellingAppointment(true);
      const response = await api.post(`/patient/cancel-appointment/${appointmentId}`);
      
      if (response.data.success) {
        setDashboardData(prev => ({
          ...prev,
          patientData: {
            ...prev.patientData,
            upcomingAppointments: prev.patientData.upcomingAppointments.filter(
              apt => apt._id !== appointmentId
            )
          }
        }));
        showNotification('Appointment cancelled successfully', 'success');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error cancelling appointment';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setCancellingAppointment(false);
    }
  };

  const handleStartVideoCall = (appointmentId) => {
    navigate(`/video-call/${appointmentId}`);
  };

  const handleEmergencyService = () => {
    navigate('/emergency');
  };

  const handleNurseService = () => {
    navigate('/emergency/nurse-marketplace');
  };

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

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/patient-profile/profile');
      if (response.data.success) {
        const userData = response.data.data;
        setProfileData({
          name: userData.name || '',
          phone: userData.phone || '',
          age: userData.patientDetails?.age || '',
          weight: userData.patientDetails?.weight || '',
          height: userData.patientDetails?.height || '',
          address: userData.patientDetails?.address || '',
          bloodGroup: userData.patientDetails?.bloodGroup || '',
          emergencyContact: userData.patientDetails?.emergencyContact || { name: '', phone: '', relationship: '' },
          medicalHistory: userData.patientDetails?.medicalHistory || [],
          allergies: userData.patientDetails?.allergies || [],
          currentMedications: userData.patientDetails?.currentMedications || []
        });
        if (userData.profilePicture) {
          setProfilePicture(userData.profilePicture);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Lightweight patient-side chat widget state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatImageUpload, setChatImageUpload] = useState(null);
  const [chatImagePreview, setChatImagePreview] = useState(null);
  useEffect(() => {
    const handlerAssigned = (data) => setChatAssignedAgent(data.agent);
    const handlerMessage = (msg) => {
    if (msg.type === 'image') {
      setChatMessages(prev => [...prev, { 
        from: 'agent', 
        type: 'image',
        imageUrl: msg.imageUrl,
        fileName: msg.fileName,
        at: msg.at 
      }]);
    } else {
      setChatMessages(prev => [...prev, msg]);
    }
  };
    const handlerChatEnded = (data) => {
      // Chat was ended by the agent
      setChatOpen(false);
      setChatMessages([]);
      setChatInput('');
      setChatAssignedAgent(null);
      // You could show a notification here if needed
    };
    
    try {
      websocketService.connect();
      websocketService.subscribe('chat:assigned', handlerAssigned);
      websocketService.subscribe('chat:message', handlerMessage);
      websocketService.subscribe('chat:ended', handlerChatEnded);
    } catch {}
    
    return () => {
      websocketService.unsubscribe('chat:assigned', handlerAssigned);
      websocketService.unsubscribe('chat:message', handlerMessage);
      websocketService.unsubscribe('chat:ended', handlerChatEnded);
    };
  }, []);

  const startChat = () => {
    setChatOpen(true);
    try {
      const userId = user?._id || user?.id;
      websocketService.send('chat:new', { patientId: userId, timestamp: new Date().toISOString() });
    } catch {}
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = {
      from: 'patient',
      text: chatInput.trim(),
      at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
    try {
      if (chatAssignedAgent?.id) {
        websocketService.send('chat:message', {
          toUserId: chatAssignedAgent.id,
          message: { ...msg, patientId: user?._id || user?.id }
        });
      }
    } catch {}
  };

  const endChat = () => {
    try {
      if (chatAssignedAgent?.id) {
        websocketService.send('chat:end', { 
          patientId: user?._id || user?.id, 
          agentId: chatAssignedAgent.id 
        });
      }
    } catch {}
    
    // Clear chat state
    setChatOpen(false);
    setChatMessages([]);
    setChatInput('');
    setChatAssignedAgent(null);
    setChatImageUpload(null);
    setChatImagePreview(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setChatImageUpload(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setChatImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendImage = () => {
    if (!chatImageUpload) return;
    
    const msg = {
      from: 'patient',
      type: 'image',
      imageUrl: chatImagePreview,
      fileName: chatImageUpload.name,
      at: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, msg]);
    
    try {
      if (chatAssignedAgent?.id) {
        websocketService.send('chat:message', {
          toUserId: chatAssignedAgent.id,
          message: { ...msg, patientId: user?._id || user?.id }
        });
      }
    } catch {}
    
    // Clear image state
    setChatImageUpload(null);
    setChatImagePreview(null);
  };

  const removeImage = () => {
    setChatImageUpload(null);
    setChatImagePreview(null);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/patient-profile/profile', profileData);
      if (response.data.success) {
        showNotification('Profile updated successfully', 'success');
        setShowProfileEdit(false);
        // Refresh dashboard data
        const dashResponse = await getPatientDashboard();
        if (dashResponse.success) {
          setDashboardData(dashResponse.data);
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      showNotification(err.response?.data?.message || 'Error updating profile', 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    
    try {
      const response = await api.put('/patient-profile/change-password', passwordData);
      if (response.data.success) {
        showNotification('Password changed successfully', 'success');
        setShowPasswordChange(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      showNotification(err.response?.data?.message || 'Error changing password', 'error');
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await api.post('/patient-profile/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setProfilePicture(response.data.profilePicture);
        showNotification('Profile picture updated successfully', 'success');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      showNotification('Error uploading profile picture', 'error');
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getPatientDashboard();
        if (response.success) {
          setDashboardData(response.data);
          
          // Also fetch recent payment count for overview
          fetchRecentPaymentCount();
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
      fetchProfileData();
    }
  }, [user]);

  const fetchRecentPaymentCount = async () => {
    try {
      const response = await api.get('/payments/all-history');
      if (response.data.success) {
        const payments = response.data.data || [];
        
        // Count payments from this month
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const recentPayments = payments.filter(payment => {
          const paymentDate = new Date(payment.createdAt || payment.date);
          return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
        });
        
        // Update the overview card
        const countElement = document.getElementById('recent-payments-count');
        if (countElement) {
          countElement.textContent = recentPayments.length;
        }
      }
    } catch (error) {
      console.error('Error fetching recent payment count:', error);
    }
  };

  useEffect(() => {
    initFeatherIcons();
  }, [dashboardData, activeTab]);

  if (!user) {
    return <div className="loading-container">Please log in to view your dashboard.</div>;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData || !dashboardData.user) {
    return <div className="error-message">No dashboard data available</div>;
  }

  return (
    <div className={`patient-dashboard-new ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {showDoctorSearch ? (
        <DoctorSearch 
          onBack={() => setShowDoctorSearch(false)} 
          onAppointmentBooked={(newDashboardData) => {
            setDashboardData(newDashboardData);
            setShowDoctorSearch(false);
          }}
        />
      ) : (
        <div className="dashboard-layout">
          {/* Sidebar Navigation */}
          <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <div className="logo">
                <div className="logo-icon">
                  <i data-feather="heart"></i>
                </div>
                {!sidebarCollapsed && <span className="logo-text">WeHeal</span>}
              </div>
              <button 
                className="sidebar-toggle"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <i data-feather={sidebarCollapsed ? "chevron-right" : "chevron-left"}></i>
              </button>
            </div>

            <nav className="sidebar-nav">
              <div className="nav-section">
                <button 
                  className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <i data-feather="home"></i>
                  {!sidebarCollapsed && <span>Overview</span>}
                </button>
                <button 
                  className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  <i data-feather="calendar"></i>
                  {!sidebarCollapsed && <span>Appointments</span>}
                </button>
                <button 
                  className={`nav-item ${activeTab === 'health' ? 'active' : ''}`}
                  onClick={() => setActiveTab('health')}
                >
                  <i data-feather="activity"></i>
                  {!sidebarCollapsed && <span>Health Records</span>}
                </button>

                <button 
                  className={`nav-item ${activeTab === 'marketplace' ? 'active' : ''}`}
                  onClick={() => setActiveTab('marketplace')}
                >
                  <i data-feather="shopping-bag"></i>
                  {!sidebarCollapsed && <span>Marketplace</span>}
                </button>
                <button 
                  className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('subscriptions')}
                >
                  <i data-feather="refresh-cw"></i>
                  {!sidebarCollapsed && <span>Subscriptions</span>}
                </button>
                <button 
                  className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('billing')}
                >
                  <i data-feather="credit-card"></i>
                  {!sidebarCollapsed && <span>Billing</span>}
                </button>
                <button 
                  className={`nav-item ${activeTab === 'ai-buddy' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ai-buddy')}
                >
                  <i data-feather="cpu"></i>
                  {!sidebarCollapsed && <span>My AI Buddy</span>}
                </button>
                <button 
                  className={`nav-item ${activeTab === 'customer-care' ? 'active' : ''}`}
                  onClick={() => setActiveTab('customer-care')}
                >
                  <i data-feather="headphones"></i>
                  {!sidebarCollapsed && <span>Customer Care</span>}
                </button>
              </div>

              <div className="nav-section emergency">
                <button 
                  className="nav-item emergency-btn"
                  onClick={handleEmergencyService}
                >
                  <i data-feather="phone-call"></i>
                  {!sidebarCollapsed && <span>Emergency</span>}
                </button>
              </div>

              {/* Health Tips Section */}
              <div className="nav-section health-tips-section">
                <HealthTips collapsed={sidebarCollapsed} />
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="dashboard-main">
            {/* Top Header */}
            <header className="main-header">

              <div className="header-right">
                <button 
                  className="theme-toggle-btn"
                  onClick={toggleDarkMode}
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  <i data-feather={isDarkMode ? 'sun' : 'moon'}></i>
                </button>
                <div className="notification-btn" ref={notificationRef} onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}>
                  <i data-feather="bell"></i>
                  <span className="notification-badge">3</span>
                  
                  {/* Notification Dropdown */}
                  {showNotificationDropdown && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <h4>Recent Activity</h4>
                        <button 
                          className="close-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNotificationDropdown(false);
                          }}
                        >
                          <i data-feather="x"></i>
                        </button>
                      </div>
                      <div className="notification-content">
                        <div className="activity-item">
                          <div className="activity-icon">
                            <i data-feather="calendar-check"></i>
                          </div>
                          <div className="activity-content">
                            <h4>Appointment Confirmed</h4>
                            <p>Dr. Smith - Cardiology consultation</p>
                            <span className="activity-time">2 hours ago</span>
                          </div>
                        </div>
                        <div className="activity-item">
                          <div className="activity-icon">
                            <i data-feather="file-plus"></i>
                          </div>
                          <div className="activity-content">
                            <h4>Lab Results Available</h4>
                            <p>Blood work completed - Normal results</p>
                            <span className="activity-time">1 day ago</span>
                          </div>
                        </div>
                        <div className="activity-item">
                          <div className="activity-icon">
                            <i data-feather="credit-card"></i>
                          </div>
                          <div className="activity-content">
                            <h4>Payment Processed</h4>
                            <p>Consultation fee paid - $150</p>
                            <span className="activity-time">3 days ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="user-profile" onClick={() => setShowProfileEdit(true)}>
                  <div className="user-avatar">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" />
                    ) : (
                      <div className="avatar-placeholder">
                        <i data-feather="user"></i>
                      </div>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">Patient</span>
                  </div>
                  <i data-feather="chevron-down"></i>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  <i data-feather="log-out"></i>
                </button>
              </div>
            </header>

            {/* Content Area */}
            <div className="content-area">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="overview-content">
                  {/* Health Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Appointments Card */}
                    <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                      <div className="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 to-blue-800 text-white shadow-blue-900/20 absolute grid h-12 w-12 place-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                          <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5M9 12.75h6m-6 3h6m-6-6h6"></path>
                        </svg>
                      </div>
                      <div className="p-4 text-right">
                        <p className="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">Appointments</p>
                        <h4 className="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">{dashboardData.patientData?.upcomingAppointments?.length || 0}</h4>
                      </div>
                      <div className="border-t border-blue-gray-50 p-4">
                        <p className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600"><strong className="text-green-500">+2</strong>&nbsp;new this week</p>
                      </div>
                    </div>

                    {/* Points Card */}
                    <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                      <div className="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-yellow-600 to-yellow-800 text-white shadow-yellow-900/20 absolute grid h-12 w-12 place-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"></path>
                        </svg>
                      </div>
                      <div className="p-4 text-right">
                        <p className="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">Points</p>
                        <h4 className="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">{dashboardData.patientData?.loyaltyPoints || 0}</h4>
                      </div>
                      <div className="border-t border-blue-gray-50 p-4">
                        <p className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600"><strong className="text-yellow-500">Silver</strong>&nbsp;member status</p>
                      </div>
                    </div>

                    {/* Payments Card */}
                    <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                      <div className="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-green-600 to-green-800 text-white shadow-green-900/20 absolute grid h-12 w-12 place-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                          <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"></path>
                        </svg>
                      </div>
                      <div className="p-4 text-right">
                        <p className="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">Recent Payments</p>
                        <h4 className="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900" id="recent-payments-count">-</h4>
                      </div>
                      <div className="border-t border-blue-gray-50 p-4">
                        <p className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600"><strong className="text-green-500">Paid</strong>&nbsp;this month</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="section">
                    <div className="section-header">
                      <h2>Quick Actions</h2>
                      <p>Common tasks and shortcuts</p>
                    </div>
                    <div className="action-cards">
                      <div className="action-card primary" onClick={() => setShowDoctorSearch(true)}>
                        <div className="action-icon">
                          <i data-feather="search"></i>
                        </div>
                        <div className="action-content">
                          <h4>Find Doctor</h4>
                          <p>Search specialists and book appointments</p>
                          <div className="action-arrow">
                            <i data-feather="arrow-right"></i>
                          </div>
                        </div>
                      </div>
                      
                      <div className="action-card emergency" onClick={handleEmergencyService}>
                        <div className="action-icon">
                          <i data-feather="phone-call"></i>
                        </div>
                        <div className="action-content">
                          <h4>Emergency Care</h4>
                          <p>24/7 emergency medical services</p>
                          <div className="action-arrow">
                            <i data-feather="arrow-right"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity & Upcoming */}
                  <div className="two-column">
                    <div className="section">
                      <div className="section-header">
                        <h2>Upcoming Appointments</h2>
                        <button className="btn-link" onClick={() => setActiveTab('appointments')}>
                          View all
                        </button>
                      </div>
                      <div className="appointments-preview">
                        {dashboardData.patientData?.upcomingAppointments?.slice(0, 3).map((appointment, index) => (
                          <div key={appointment._id || index} className="appointment-preview-card">
                            <div className="appointment-time">
                              <span className="time">{appointment.time}</span>
                              <span className="date">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="appointment-details">
                              <h4>{appointment.doctor}</h4>
                              <p>{appointment.specialization}</p>
                              <span className={`status status-${appointment.status?.toLowerCase()}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="appointment-actions">
                              {appointment.type === 'tele-consult' && appointment.status === 'scheduled' && (
                                <button className="btn-sm btn-primary" onClick={() => handleStartVideoCall(appointment._id)}>
                                  <i data-feather="video"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        )) || (
                          <div className="empty-state-small">
                            <i data-feather="calendar"></i>
                            <p>No upcoming appointments</p>
                            <button className="btn-sm btn-primary" onClick={() => setShowDoctorSearch(true)}>
                              Book Now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>


                  </div>
                </div>
              )}

              {activeTab === 'ai-buddy' && (
                <div className="section" style={{ textAlign: 'center' }}>
                  <h2>My AI Buddy</h2>
                  <p style={{ color: '#6B6B6B' }}>Coming soon: Chat with your AI health assistant for quick help.</p>
                </div>
              )}

              {activeTab === 'customer-care' && (
                <div className="section" style={{ maxWidth: 800 }}>
                  <h2>Customer Care</h2>
                  <p style={{ color: '#6B6B6B' }}>We're here to help. Reach out through any of the options below.</p>
                  <div className="two-column" style={{ gap: '1rem' }}>
                    <div className="card">
                      <div className="card-body">
                        <h3>WhatsApp Chat</h3>
                        <p style={{ color: '#6B6B6B' }}>24/7 support via WhatsApp</p>
                        <a 
                          href="https://wa.me/+8801308538775?text=Hi%20I%20need%20help%20with%20WeHeal" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-primary"
                          style={{ 
                            backgroundColor: '#25D366', 
                            borderColor: '#25D366',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>💬</span>
                          Chat on WhatsApp
                        </a>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-body">
                        <h3>Email</h3>
                        <p style={{ color: '#6B6B6B' }}>We usually respond within a few hours</p>
                        <a href="mailto:support@weheal.com" className="btn btn-outline">support@weheal.com</a>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    {!chatOpen ? (
                      <button className="btn btn-primary" onClick={startChat}>Start Live Chat</button>
                    ) : (
                      <div className="card" style={{ marginTop: '1rem' }}>
                        <div className="card-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div>
                              <strong>Live Chat</strong>
                              <div style={{ color: '#6B6B6B', fontSize: 12 }}>
                                {chatAssignedAgent ? `Connected to ${chatAssignedAgent.name || 'Agent'}` : 'Waiting for an agent...'}
                              </div>
                            </div>
                            <button className="btn btn-secondary" onClick={endChat}>End Chat</button>
                          </div>
                          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, height: 260, overflowY: 'auto', padding: 8, marginBottom: 8 }}>
                            {chatMessages.length === 0 ? (
                              <div style={{ color: '#6B6B6B', textAlign: 'center', marginTop: 24 }}>No messages yet.</div>
                            ) : (
                              chatMessages.map((m, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: m.from === 'patient' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                                  <div style={{ background: m.from === 'patient' ? '#8B4513' : '#F5F5F5', color: m.from === 'patient' ? '#fff' : '#2C2C2C', padding: '6px 10px', borderRadius: 12, maxWidth: '70%' }}>
                                    {m.type === 'image' ? (
                                      <div>
                                        <img 
                                          src={m.imageUrl} 
                                          alt={m.fileName || 'Image'} 
                                          style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '200px', 
                                            borderRadius: '8px',
                                            marginBottom: '4px'
                                          }} 
                                        />
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                          {m.fileName}
                                        </div>
                                      </div>
                                    ) : (
                                      m.text
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your message..." className="form-input" style={{ flex: 1 }} />
                            <button className="btn btn-primary" onClick={sendChat}>Send</button>
                            <button className="btn btn-danger" onClick={endChat}>End Chat</button>
                          </div>
                          
                          {/* Image Upload Section */}
                          <div style={{ marginTop: '12px', padding: '12px', border: '1px solid #E5E5E5', borderRadius: '8px', background: '#F9F9F9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                                id="chat-image-upload"
                              />
                              <label htmlFor="chat-image-upload" className="btn btn-outline" style={{ cursor: 'pointer', margin: 0 }}>
                                📷 Add Image
                              </label>
                              {chatImageUpload && (
                                <>
                                  <button className="btn btn-primary" onClick={sendImage} style={{ fontSize: '12px', padding: '6px 12px' }}>
                                    Send Image
                                  </button>
                                  <button className="btn btn-secondary" onClick={removeImage} style={{ fontSize: '12px', padding: '6px 12px' }}>
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                            
                            {/* Image Preview */}
                            {chatImagePreview && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img 
                                  src={chatImagePreview} 
                                  alt="Preview" 
                                  style={{ 
                                    width: '60px', 
                                    height: '60px', 
                                    objectFit: 'cover', 
                                    borderRadius: '6px',
                                    border: '2px solid #e5e7eb'
                                  }} 
                                />
                                <div style={{ fontSize: '12px', color: '#6B6B6B' }}>
                                  <div><strong>{chatImageUpload?.name}</strong></div>
                                  <div>{(chatImageUpload?.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Appointments Tab */}
              {activeTab === 'appointments' && (
                <div className="appointments-content">
                  <div className="content-header">
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowDoctorSearch(true)}
                    >
                      <i data-feather="plus"></i>
                      Book New Appointment
                    </button>
                  </div>

                  <div className="appointments-grid">
                    {dashboardData.patientData?.upcomingAppointments && 
                     dashboardData.patientData.upcomingAppointments.length > 0 ? (
                      dashboardData.patientData.upcomingAppointments.map((appointment, index) => (
                        <div key={appointment._id || index} className="appointment-card-new">
                          <div className="appointment-card-header">
                            <div className="doctor-profile">
                              <div className="doctor-avatar">
                                <img src={`https://i.pravatar.cc/150?img=${index + 1}`} alt={appointment.doctor} />
                              </div>
                              <div className="doctor-info">
                                <h3>{appointment.doctor}</h3>
                                <p className="specialization">{appointment.specialization}</p>
                              </div>
                            </div>
                            <div className={`status-badge-new status-${appointment.status?.toLowerCase()}`}>
                              {appointment.status}
                            </div>
                          </div>

                          <div className="appointment-details-new">
                            <div className="detail-row">
                              <div className="detail-item">
                                <i data-feather="calendar"></i>
                                <div>
                                  <span className="label">Date</span>
                                  <span className="value">{new Date(appointment.date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}</span>
                                </div>
                              </div>
                              <div className="detail-item">
                                <i data-feather="clock"></i>
                                <div>
                                  <span className="label">Time</span>
                                  <span className="value">{appointment.time}</span>
                                </div>
                              </div>
                            </div>
                            <div className="detail-row">
                              <div className="detail-item">
                                <i data-feather={appointment.type === 'tele-consult' ? 'video' : 'map-pin'}></i>
                                <div>
                                  <span className="label">Type</span>
                                  <span className="value">{appointment.type === 'tele-consult' ? 'Video Consultation' : 'In-Person Visit'}</span>
                                </div>
                              </div>
                              <div className="detail-item">
                                <i data-feather="dollar-sign"></i>
                                <div>
                                  <span className="label">Fee</span>
                                  <span className="value">$150</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="appointment-actions-new">
                            {appointment.type === 'tele-consult' && appointment.status === 'scheduled' && (
                              <button 
                                className="btn btn-primary"
                                onClick={() => handleStartVideoCall(appointment._id)}
                              >
                                <i data-feather="video"></i>
                                Join Video Call
                              </button>
                            )}
                            <button 
                              className="btn btn-outline"
                              onClick={() => handleCancelAppointment(appointment._id)}
                              disabled={cancellingAppointment}
                            >
                              <i data-feather="x"></i>
                              {cancellingAppointment ? 'Cancelling...' : 'Cancel Appointment'}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state-large">
                        <div className="empty-icon">
                          <i data-feather="calendar"></i>
                        </div>
                        <h3>No Appointments Scheduled</h3>
                        <p>You don't have any upcoming appointments. Book your first appointment to get started with your healthcare journey.</p>
                        <button className="btn btn-primary" onClick={() => setShowDoctorSearch(true)}>
                          <i data-feather="search"></i>
                          Find a Doctor
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Health Records Tab */}
              {activeTab === 'health' && (
                <div className="health-content">
                  <div style={{ padding: '2rem' }}>
                    <ReportsSection />
                  </div>
                </div>
              )}



              {activeTab === 'marketplace' && (
                <div className="marketplace-content" style={{ padding: '2rem', backgroundColor: '#F5F5F5' }}>
                  <div className="marketplace-dashboard" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Enhanced Header */}
                    <div className="marketplace-header" style={{ 
                      marginBottom: '3rem', 
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '3rem 2rem',
                      borderRadius: '1rem',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                      <h2 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '700', 
                        marginBottom: '1rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        Healthcare Marketplace
                      </h2>
                      <p style={{ 
                        fontSize: '1.2rem', 
                        opacity: '0.9',
                        maxWidth: '600px',
                        margin: '0 auto'
                      }}>
                        Shop for medications, lab tests, and wellness products with confidence
                      </p>
                    </div>
                    
                    {/* Quick Stats Cards */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '1.5rem', 
                      marginBottom: '3rem' 
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💊</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>500+</h3>
                        <p style={{ opacity: '0.9' }}>Medicines Available</p>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧪</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>50+</h3>
                        <p style={{ opacity: '0.9' }}>Lab Tests</p>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚚</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Free</h3>
                        <p style={{ opacity: '0.9' }}>Delivery</p>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(67, 233, 123, 0.3)'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔒</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>100%</h3>
                        <p style={{ opacity: '0.9' }}>Authentic</p>
                      </div>
                    </div>
                    
                    {/* Enhanced Quick Actions */}
                    <div className="marketplace-quick-actions" style={{ marginBottom: '3rem' }}>
                      <h3 style={{ 
                        fontSize: '1.8rem', 
                        fontWeight: '600', 
                        textAlign: 'center', 
                        marginBottom: '2rem',
                        color: '#374151'
                      }}>
                        Quick Actions
                      </h3>
                      <div className="quick-action-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                        gap: '2rem' 
                      }}>
                        <button 
                          className="quick-action-card"
                          onClick={() => navigate('/marketplace')}
                          style={{
                            background: 'white',
                            border: 'none',
                            borderRadius: '1rem',
                            padding: '2rem',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-5px)';
                            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div className="action-icon" style={{ 
                            fontSize: '3rem', 
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            textRendering: 'optimizeLegibility',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translate3d(0, 0, 0)',
                            WebkitTransform: 'translate3d(0, 0, 0)',
                            willChange: 'auto',
                            perspective: '1000px',
                            WebkitPerspective: '1000px'
                          }}>
                            🛍️
                          </div>
                          <h3 style={{ 
                            fontSize: '1.3rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            color: '#374151'
                          }}>Browse All Products</h3>
                          <p style={{ 
                            color: '#6b7280',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>Explore our complete marketplace with hundreds of products</p>
                        </button>
                        
                        <button 
                          className="quick-action-card"
                          onClick={() => navigate('/marketplace/category/medicine')}
                          style={{
                            background: 'white',
                            border: 'none',
                            borderRadius: '1rem',
                            padding: '2rem',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-5px)';
                            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div className="action-icon" style={{ 
                            fontSize: '3rem', 
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            textRendering: 'optimizeLegibility',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)',
                            willChange: 'auto'
                          }}>
                            💊
                          </div>
                          <h3 style={{ 
                            fontSize: '1.3rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            color: '#374151'
                          }}>Medicines</h3>
                          <p style={{ 
                            color: '#6b7280',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>Browse medications and prescriptions from verified pharmacies</p>
                        </button>
                        
                        <button 
                          className="quick-action-card"
                          onClick={() => navigate('/lab-tests')}
                          style={{
                            background: 'white',
                            border: 'none',
                            borderRadius: '1rem',
                            padding: '2rem',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-5px)';
                            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div className="action-icon" style={{ 
                            fontSize: '3rem', 
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            textRendering: 'optimizeLegibility',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)',
                            willChange: 'auto'
                          }}>
                            🧪
                          </div>
                          <h3 style={{ 
                            fontSize: '1.3rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            color: '#374151'
                          }}>Lab Tests</h3>
                          <p style={{ 
                            color: '#6b7280',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>Book diagnostic tests and comprehensive health checkups</p>
                        </button>
                        
                        <button 
                          className="quick-action-card"
                          onClick={() => navigate('/cart')}
                          style={{
                            background: 'white',
                            border: 'none',
                            borderRadius: '1rem',
                            padding: '2rem',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-5px)';
                            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div className="action-icon" style={{ 
                            fontSize: '3rem', 
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            textRendering: 'optimizeLegibility',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)',
                            willChange: 'auto'
                          }}>
                            🛒
                          </div>
                          <h3 style={{ 
                            fontSize: '1.3rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            color: '#374151'
                          }}>My Cart</h3>
                          <p style={{ 
                            color: '#6b7280',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>Review and manage items in your shopping cart</p>
                        </button>
                        
                        <button 
                          className="quick-action-card"
                          onClick={() => navigate('/lab-tests/my-tests')}
                          style={{
                            background: 'white',
                            border: 'none',
                            borderRadius: '1rem',
                            padding: '2rem',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-5px)';
                            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div className="action-icon" style={{ 
                            fontSize: '3rem', 
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            textRendering: 'optimizeLegibility',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            WebkitTransform: 'translateZ(0)',
                            willChange: 'auto'
                          }}>
                            📋
                          </div>
                          <h3 style={{ 
                            fontSize: '1.3rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            color: '#374151'
                          }}>My Lab Tests</h3>
                          <p style={{ 
                            color: '#6b7280',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>Track your lab test orders and download reports</p>
                        </button>
                        
                        <button 
                          className="quick-action-card"
                          onClick={() => navigate('/orders')}
                          style={{
                            background: 'white',
                            border: 'none',
                            borderRadius: '1rem',
                            padding: '2rem',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-5px)';
                            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div className="action-icon" style={{ 
                            fontSize: '3rem', 
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}>
                            📦
                          </div>
                          <h3 style={{ 
                            fontSize: '1.3rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            color: '#374151'
                          }}>My Orders</h3>
                          <p style={{ 
                            color: '#6b7280',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>Track your orders and view purchase history</p>
                        </button>
                      </div>
                    </div>
                    
                    {/* Enhanced Info Cards */}
                    <div className="marketplace-info">
                      <h3 style={{ 
                        fontSize: '1.8rem', 
                        fontWeight: '600', 
                        textAlign: 'center', 
                        marginBottom: '2rem',
                        color: '#374151'
                      }}>
                        Why Choose Our Marketplace?
                      </h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                        gap: '2rem' 
                      }}>
                        <div className="info-card" style={{
                          background: 'white',
                          padding: '2.5rem 2rem',
                          borderRadius: '1rem',
                          textAlign: 'center',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ 
                            fontSize: '3.5rem', 
                            marginBottom: '1.5rem',
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}>🚚</div>
                          <h4 style={{ 
                            fontSize: '1.4rem', 
                            fontWeight: '600', 
                            marginBottom: '1rem',
                            color: '#374151'
                          }}>Free Delivery</h4>
                          <p style={{ 
                            color: '#6b7280',
                            fontSize: '1rem',
                            lineHeight: '1.6'
                          }}>Free delivery on all orders with fast and reliable shipping to your doorstep</p>
                        </div>
                        
                        <div className="info-card" style={{
                          background: 'white',
                          padding: '2.5rem 2rem',
                          borderRadius: '1rem',
                          textAlign: 'center',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ 
                            fontSize: '3.5rem', 
                            marginBottom: '1.5rem',
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}>💳</div>
                          <h4 style={{ 
                            fontSize: '1.4rem', 
                            fontWeight: '600', 
                            marginBottom: '1rem',
                            color: '#374151'
                          }}>Cash on Delivery</h4>
                          <p style={{ 
                            color: '#6b7280',
                            fontSize: '1rem',
                            lineHeight: '1.6'
                          }}>Pay when you receive your order - convenient and secure payment option</p>
                        </div>
                        
                        <div className="info-card" style={{
                          background: 'white',
                          padding: '2.5rem 2rem',
                          borderRadius: '1rem',
                          textAlign: 'center',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ 
                            fontSize: '3.5rem', 
                            marginBottom: '1.5rem',
                            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}>🔒</div>
                          <h4 style={{ 
                            fontSize: '1.4rem', 
                            fontWeight: '600', 
                            marginBottom: '1rem',
                            color: '#374151'
                          }}>Secure & Authentic</h4>
                          <p style={{ 
                            color: '#6b7280',
                            fontSize: '1rem',
                            lineHeight: '1.6'
                          }}>All products are verified, authentic, and sourced from trusted suppliers</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="billing-content" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="left-col">
                    {/* Billing Summary */}
                    <div className="card" style={{ marginBottom: '1rem' }}>
                      <div className="card-header">
                        <h3>Billing Summary</h3>
                      </div>
                      <div className="card-body">
                        <BillingSection setActiveTab={setActiveTab} />
                      </div>
                    </div>
                    
                    {/* Full Payment History */}
                    <div className="card">
                      <div className="card-header">
                        <h2>Complete Payment History</h2>
                      </div>
                      <div className="card-body">
                        <PaymentHistory />
                      </div>
                    </div>
                  </div>
                  <div className="right-col" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <LoyaltyCard />
                    <InsuranceCard />
                    <ShippingAddressCard />
                    <BankDetailsCard />
                    <CardDetailsCard />
                    <MobileBankingCard />
                  </div>
                </div>
              )}

              {activeTab === 'subscriptions' && (
                <div className="subscription-content">
                  <SubscriptionManagement />
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Profile Edit Modal - keeping the existing modal for now */}
      {showProfileEdit && (
        <div className="modal-overlay-new" onClick={() => setShowProfileEdit(false)}>
          <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-new">
              <h2>Edit Profile</h2>
              <button className="close-btn-new" onClick={() => setShowProfileEdit(false)}>
                <i data-feather="x"></i>
              </button>
            </div>
            <div className="modal-body-new">
              <div className="profile-picture-section-new">
                <div className="current-picture-new">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" />
                  ) : (
                    <div className="picture-placeholder-new">
                      <i data-feather="user"></i>
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i data-feather="camera"></i>
                  Change Picture
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  style={{ display: 'none' }}
                />
              </div>
              
              <form onSubmit={handleProfileUpdate} className="profile-form-new">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      value={profileData.age}
                      onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      value={profileData.weight}
                      onChange={(e) => setProfileData({...profileData, weight: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      value={profileData.height}
                      onChange={(e) => setProfileData({...profileData, height: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      value={profileData.bloodGroup}
                      onChange={(e) => setProfileData({...profileData, bloodGroup: e.target.value})}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="emergency-contact-section-new">
                  <h3>Emergency Contact</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={profileData.emergencyContact.name}
                        onChange={(e) => setProfileData({
                          ...profileData, 
                          emergencyContact: {...profileData.emergencyContact, name: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={profileData.emergencyContact.phone}
                        onChange={(e) => setProfileData({
                          ...profileData, 
                          emergencyContact: {...profileData.emergencyContact, phone: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship</label>
                      <input
                        type="text"
                        value={profileData.emergencyContact.relationship}
                        onChange={(e) => setProfileData({
                          ...profileData, 
                          emergencyContact: {...profileData.emergencyContact, relationship: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-actions-new">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProfileEdit(false)}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => setShowPasswordChange(true)}
                  >
                    <i data-feather="lock"></i>
                    Change Password
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i data-feather="save"></i>
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="modal-overlay-new" onClick={() => setShowPasswordChange(false)}>
          <div className="modal-content-new small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-new">
              <h2>Change Password</h2>
              <button className="close-btn-new" onClick={() => setShowPasswordChange(false)}>
                <i data-feather="x"></i>
              </button>
            </div>
            <div className="modal-body-new">
              <form onSubmit={handlePasswordChange} className="password-form-new">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
                <div className="form-actions-new">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordChange(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i data-feather="save"></i>
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentHistory = () => {
  const { user } = useOutletContext();
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== SIMPLIFIED PAYMENT FETCHING ===');
      console.log('User ID:', user?._id);
      
      // Simple approach: fetch all payments from a single endpoint
      const response = await api.get('/payments/all-history');
      console.log('All payments response:', response);
      
      if (response.data.success) {
        const payments = response.data.data || [];
        console.log('Payments received:', payments.length);
        setAllPayments(payments);
      } else {
        console.error('Failed to fetch payments:', response.data.message);
        setError('Failed to fetch payments: ' + response.data.message);
      }
      
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchAllPayments();
    }
  }, [user?._id]);

  const refreshPayments = () => {
    fetchAllPayments();
  };

  if (loading) return (
    <div style={{ 
      textAlign: 'center', 
      padding: '2rem', 
      color: '#6b7280',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div className="spinner"></div>
      <Typography>Loading payment history...</Typography>
    </div>
  );

  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
      <Button onClick={refreshPayments} variant="outlined">
        Try Again
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--mk-text, #333)' }}>
          Payment History
        </Typography>
        <Button 
          onClick={refreshPayments} 
          variant="outlined" 
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>

      {allPayments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No payments found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your payment history will appear here once you make payments.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {allPayments.map((payment, index) => (
            <Paper key={payment._id || index} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {payment.paymentType === 'marketplace' ? 'Marketplace Purchase' : 'Consultation'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Date: {new Date(payment.createdAt || payment.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Amount: ₹{payment.amount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Method: {payment.paymentMethod}
                  </Typography>
                </Box>
                <Chip 
                  label={payment.status || 'Completed'} 
                  color={payment.status === 'completed' ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              {payment.orderId && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Order ID: {payment.orderId}
                </Typography>
              )}
              
              {payment.transactionId && (
                <Typography variant="body2" color="text.secondary">
                  Transaction ID: {payment.transactionId}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

const BillingSection = ({ setActiveTab }) => {
  const { user } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/payments/all-history');
      
      if (response.data.success) {
        setPayments(response.data.data || []);
      } else {
        setError('Failed to fetch billing data');
      }
    } catch (err) {
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchBillingData();
    }
  }, [user?._id]);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading billing information...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchBillingData} variant="outlined" size="small">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Billing & Payment History
      </Typography>
      
      {payments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="text.secondary">
            No payment history available
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {payments.slice(0, 5).map((payment, index) => (
            <Paper key={payment._id || index} sx={{ p: 2, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {payment.paymentType === 'marketplace' ? '🛒 Purchase' : '👨‍⚕️ Consultation'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(payment.createdAt || payment.date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                    ₹{payment.amount}
                  </Typography>
                  <Chip 
                    label={payment.status || 'Paid'} 
                    size="small" 
                    color={payment.status === 'completed' ? 'success' : 'default'}
                  />
                </Box>
              </Box>
            </Paper>
          ))}
          
          {payments.length > 5 && (
            <Box sx={{ textAlign: 'center', pt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing 5 of {payments.length} payments
              </Typography>
              <Button 
                onClick={() => setActiveTab('billing')} 
                variant="text" 
                size="small"
                sx={{ mt: 1 }}
              >
                View All Payments
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PatientDashboard;

// Right column cards
const LoyaltyCard = () => {
  const [points, setPoints] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/patient-profile/profile');
        if (res.data?.data?.loyaltyPoints != null) setPoints(res.data.data.loyaltyPoints);
      } catch {}
    })();
  }, []);
  return (
    <div className="card">
      <div className="card-header"><h3>Loyalty Points</h3></div>
      <div className="card-body"><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{points} pts</div></div>
    </div>
  );
};

const InsuranceCard = () => <ProfileSectionCard title="Health Insurance" fieldPath="billing.insurance" fields={[{ key: 'provider', label: 'Provider' }, { key: 'policyNumber', label: 'Policy No.' }, { key: 'coverage', label: 'Coverage' }, { key: 'validTill', label: 'Valid Till' }]} />;
const ShippingAddressCard = () => <ProfileSectionCard title="Shipping Address" fieldPath="billing.shippingAddress" fields={[{ key: 'street', label: 'Street' }, { key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'zipCode', label: 'ZIP' }, { key: 'country', label: 'Country' }]} />;
const BankDetailsCard = () => <ListSectionCard title="Bank Accounts" listFieldPath="paymentMethods.bankAccounts" itemFields={[{ key: 'bankName', label: 'Bank' }, { key: 'accountHolder', label: 'Holder' }, { key: 'accountNumberMasked', label: 'Account' }, { key: 'branchName', label: 'Branch' }]} addTemplate={{ bankName: '', accountHolder: '', accountNumberMasked: '', branchName: '' }} />;
const CardDetailsCard = () => <ListSectionCard title="Saved Cards" listFieldPath="paymentMethods.cards" itemFields={[{ key: 'brand', label: 'Brand' }, { key: 'cardHolder', label: 'Holder' }, { key: 'last4', label: 'Last 4' }, { key: 'expiryDate', label: 'Expiry' }]} addTemplate={{ brand: '', cardHolder: '', last4: '', expiryDate: '' }} />;
const MobileBankingCard = () => <ListSectionCard title="Mobile Wallets" listFieldPath="paymentMethods.mobileWallets" itemFields={[{ key: 'provider', label: 'Provider' }, { key: 'mobileNumber', label: 'Number' }]} addTemplate={{ provider: '', mobileNumber: '' }} />;

// Generic single-object editor
const ProfileSectionCard = ({ title, fieldPath, fields }) => {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    const res = await api.get('/patient-profile/profile');
    const obj = res.data?.data || {};
    const value = fieldPath.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);
    setData(value);
    setForm(value || fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {}));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {};
    const [root, sub] = fieldPath.split('.');
    payload[root] = { [sub]: form };
    await api.put('/patient-profile/profile', payload);
    setEditing(false);
    await load();
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>{title}</h3>
        <button className="btn btn-sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : (data ? 'Edit' : 'Add')}</button>
      </div>
      <div className="card-body">
        {data && !editing ? (
          <div>
            {fields.map(f => (
              <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#6B6B6B' }}>{f.label}</span>
                <span>{data[f.key] || '-'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>{f.label}</label>
                <input value={form[f.key] || ''} onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }} />
              </div>
            ))}
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Generic list editor
const ListSectionCard = ({ title, listFieldPath, itemFields, addTemplate }) => {
  const [list, setList] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(addTemplate);

  const load = async () => {
    const res = await api.get('/patient-profile/profile');
    const obj = res.data?.data || {};
    const value = listFieldPath.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);
    setList(Array.isArray(value) ? value : []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const [root, sub, leaf] = listFieldPath.split('.');
    const payload = { [root]: { [sub]: { [leaf]: [...list, form] } } };
    await api.put('/patient-profile/profile', payload);
    setAdding(false);
    setForm(addTemplate);
    await load();
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>{title}</h3>
        <button className="btn btn-sm" onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : 'Add'}</button>
      </div>
      <div className="card-body">
        {list.length === 0 && !adding && <div style={{ color: '#6B6B6B' }}>No {title.toLowerCase()} added yet.</div>}
        {list.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {list.map((item, idx) => (
              <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem' }}>
                {itemFields.map(f => (
                  <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B6B6B' }}>{f.label}</span>
                    <span>{item[f.key]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {adding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {itemFields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>{f.label}</label>
                <input value={form[f.key] || ''} onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }} />
              </div>
            ))}
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
};



