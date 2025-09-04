import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import '../../styles/NurseDashboard.css';

const NurseDashboard = () => {
  const [nurseData, setNurseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [earningsToday, setEarningsToday] = useState(0);
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    specialization: '',
    yearsOfExperience: 0,
    shift: 'morning',
    education: [],
    certifications: []
  });
  const [availability, setAvailability] = useState({
    isAvailable: true,
    currentStatus: 'available'
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchNurseData();
    fetchEmergencyRequests();
  }, []);

  const fetchNurseData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/nurse/dashboard');
      if (response.data.success) {
        setNurseData(response.data.data.nurse);
        setEmergencyRequests(response.data.data.emergencyRequests || []);
        
        // Set profile data for editing
        setProfileData({
          name: response.data.data.nurse.name,
          phone: response.data.data.nurse.phone,
          specialization: response.data.data.nurse.nurseDetails?.specialization || '',
          yearsOfExperience: response.data.data.nurse.nurseDetails?.yearsOfExperience || 0,
          shift: response.data.data.nurse.nurseDetails?.shift || 'morning',
          education: response.data.data.nurse.nurseDetails?.education || [],
          certifications: response.data.data.nurse.nurseDetails?.certifications || []
        });

        // Set availability data
        setAvailability({
          isAvailable: response.data.data.nurse.nurseDetails?.isAvailable || true,
          currentStatus: response.data.data.nurse.nurseDetails?.currentStatus || 'available'
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching nurse data');
      console.error('Error fetching nurse data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyRequests = async () => {
    try {
      const response = await api.get('/emergency-nurse/nurse/requests');
      if (response.data.success) {
        const reqs = response.data.data.requests;
        setEmergencyRequests(reqs);
        // Calculate nurse earnings: 75% of paid request amounts where status completed today / total
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const today = reqs.filter(r => r.status === 'completed' && r.completedAt && new Date(r.completedAt) >= startOfDay);
        const sumToday = today.reduce((s, r) => s + (r.nursePayout || 0), 0);
        const sumTotal = reqs.filter(r => r.status === 'completed').reduce((s, r) => s + (r.nursePayout || 0), 0);
        setEarningsToday(sumToday);
        setEarningsTotal(sumTotal);
      }
    } catch (err) {
      console.error('Error fetching emergency requests:', err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const response = await api.put('/nurse/profile', {
        name: profileData.name,
        phone: profileData.phone,
        nurseDetails: {
          specialization: profileData.specialization,
          yearsOfExperience: profileData.yearsOfExperience,
          shift: profileData.shift,
          education: profileData.education,
          certifications: profileData.certifications
        }
      });

      if (response.data.success) {
        setNurseData(response.data.data.nurse);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating profile');
      console.error('Error updating profile:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAvailabilityUpdate = async () => {
    try {
      setUpdating(true);
      const response = await api.put('/nurse/availability', availability);

      if (response.data.success) {
        setNurseData(response.data.data.nurse);
        alert('Availability updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating availability');
      console.error('Error updating availability:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await api.put(`/emergency-nurse/nurse/accept/${requestId}`);
      if (response.data.success) {
        await fetchEmergencyRequests();
        alert('Emergency request accepted successfully!');
      }
    } catch (err) {
      alert('Failed to accept request. Please try again.');
      console.error('Error accepting request:', err);
    }
  };

  const handleCompleteRequest = async (requestId) => {
    const notes = prompt('Please add any notes about the service provided:');
    if (notes === null) return; // User cancelled

    try {
      const response = await api.put(`/emergency-nurse/nurse/complete/${requestId}`, {
        notes
      });
      if (response.data.success) {
        await fetchEmergencyRequests();
        alert('Emergency request completed successfully!');
      }
    } catch (err) {
      alert('Failed to complete request. Please try again.');
      console.error('Error completing request:', err);
    }
  };

  const addEducation = () => {
    setProfileData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: '' }]
    }));
  };

  const updateEducation = (index, field, value) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    setProfileData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const updateCertification = (index, value) => {
    setProfileData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? value : cert
      )
    }));
  };

  const removeCertification = (index) => {
    setProfileData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="nurse-dashboard">
        <div className="loading">Loading nurse dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nurse-dashboard">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="nurse-dashboard">
      <div className="dashboard-header">
        <h1>Nurse Dashboard</h1>
        <div className="nurse-info">
          <h2>Welcome, {nurseData?.name}</h2>
          <p className="specialization">{nurseData?.nurseDetails?.specialization} Nurse</p>
          <div className="status-indicator">
            <span className={`status ${availability.currentStatus}`}>
              {availability.currentStatus.toUpperCase()}
            </span>
            <span className={`availability ${availability.isAvailable ? 'available' : 'unavailable'}`}>
              {availability.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={activeTab === 'availability' ? 'active' : ''}
          onClick={() => setActiveTab('availability')}
        >
          Availability
        </button>
        <button 
          className={activeTab === 'emergency' ? 'active' : ''}
          onClick={() => setActiveTab('emergency')}
        >
          Emergency Requests
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Requests</h3>
                <p className="stat-number">{emergencyRequests.length}</p>
              </div>
              <div className="stat-card">
                <h3>Active Requests</h3>
                <p className="stat-number">
                  {emergencyRequests.filter(req => req.status === 'active').length}
                </p>
              </div>
              <div className="stat-card">
                <h3>Completed</h3>
                <p className="stat-number">
                  {emergencyRequests.filter(req => req.status === 'completed').length}
                </p>
              </div>
              <div className="stat-card">
                <h3>Experience</h3>
                <p className="stat-number">{nurseData?.nurseDetails?.yearsOfExperience} years</p>
              </div>
            </div>

            <div className="recent-requests">
              <div className="earnings-summary" style={{display:'flex',gap:16,marginBottom:12}}>
                <div className="card" style={{padding:12,border:'1px solid #eee',borderRadius:8}}>
                  <h4>Today's Earnings</h4>
                  <p className="stat-number">৳ {earningsToday}</p>
                </div>
                <div className="card" style={{padding:12,border:'1px solid #eee',borderRadius:8}}>
                  <h4>Total Earnings</h4>
                  <p className="stat-number">৳ {earningsTotal}</p>
                </div>
              </div>
              <h3>Recent Emergency Requests</h3>
              {emergencyRequests.length === 0 ? (
                <p className="no-requests">No emergency requests at the moment.</p>
              ) : (
                <div className="requests-list">
                  {emergencyRequests.slice(0, 5).map((request, index) => (
                    <div key={request._id || index} className="request-item">
                      <div className="request-info">
                        <h4>Request #{request._id ? request._id.slice(-8) : index + 1}</h4>
                        <p>Patient: {request.patientId?.name || 'Unknown'}</p>
                        <p>Status: {request.status}</p>
                        <p>Urgency: {request.urgency}</p>
                        <p>Description: {request.description?.substring(0, 50)}...</p>
                      </div>
                      <div className="request-actions">
                        {request.status === 'pending' && (
                          <button 
                            className="btn-primary"
                            onClick={() => handleAcceptRequest(request._id)}
                          >
                            Accept
                          </button>
                        )}
                        {request.status === 'accepted' && (
                          <button 
                            className="btn-secondary"
                            onClick={() => handleCompleteRequest(request._id)}
                          >
                            Complete
                          </button>
                        )}
                        <button className="btn-secondary">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-section">
            <h3>Update Profile</h3>
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <select
                  value={profileData.specialization}
                  onChange={(e) => setProfileData(prev => ({ ...prev, specialization: e.target.value }))}
                >
                  <option value="General">General</option>
                  <option value="ICU">ICU</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Pediatric">Pediatric</option>
                  <option value="Surgical">Surgical</option>
                  <option value="Cardiac">Cardiac</option>
                  <option value="Oncology">Oncology</option>
                  <option value="Psychiatric">Psychiatric</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={profileData.yearsOfExperience}
                  onChange={(e) => setProfileData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) }))}
                />
              </div>

              <div className="form-group">
                <label>Shift</label>
                <select
                  value={profileData.shift}
                  onChange={(e) => setProfileData(prev => ({ ...prev, shift: e.target.value }))}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                </select>
              </div>

              <div className="form-group">
                <label>Education</label>
                {profileData.education.map((edu, index) => (
                  <div key={index} className="education-item">
                    <input
                      type="text"
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Year"
                      value={edu.year}
                      onChange={(e) => updateEducation(index, 'year', e.target.value)}
                    />
                    <button type="button" onClick={() => removeEducation(index)}>Remove</button>
                  </div>
                ))}
                <button type="button" onClick={addEducation}>Add Education</button>
              </div>

              <div className="form-group">
                <label>Certifications</label>
                {profileData.certifications.map((cert, index) => (
                  <div key={index} className="certification-item">
                    <input
                      type="text"
                      placeholder="Certification"
                      value={cert}
                      onChange={(e) => updateCertification(index, e.target.value)}
                    />
                    <button type="button" onClick={() => removeCertification(index)}>Remove</button>
                  </div>
                ))}
                <button type="button" onClick={addCertification}>Add Certification</button>
              </div>

              <button type="submit" disabled={updating} className="btn-primary">
                {updating ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="availability-section">
            <h3>Update Availability</h3>
            <div className="availability-form">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={availability.isAvailable}
                    onChange={(e) => setAvailability(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  />
                  Available for emergency requests
                </label>
              </div>

              <div className="form-group">
                <label>Current Status</label>
                <select
                  value={availability.currentStatus}
                  onChange={(e) => setAvailability(prev => ({ ...prev, currentStatus: e.target.value }))}
                >
                  <option value="available">Available</option>
                  <option value="on_duty">On Duty</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <button 
                onClick={handleAvailabilityUpdate} 
                disabled={updating}
                className="btn-primary"
              >
                {updating ? 'Updating...' : 'Update Availability'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="emergency-section">
            <h3>Emergency Requests</h3>
            <div className="emergency-requests">
              {emergencyRequests.length === 0 ? (
                <p className="no-requests">No emergency requests at the moment.</p>
              ) : (
                <div className="requests-list">
                  {emergencyRequests.map((request, index) => (
                    <div key={request._id || index} className="request-card">
                      <div className="request-header">
                        <h4>Emergency Request #{request._id ? request._id.slice(-8) : index + 1}</h4>
                        <span className={`priority ${request.urgency || 'medium'}`}>
                          {request.urgency || 'Medium'} Priority
                        </span>
                      </div>
                      <div className="request-details">
                        <p><strong>Patient:</strong> {request.patientId?.name || 'Unknown'}</p>
                        <p><strong>Status:</strong> {request.status}</p>
                        <p><strong>Location:</strong> {request.location || 'Not specified'}</p>
                        <p><strong>Time:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                        <p><strong>Description:</strong> {request.description || 'No description provided'}</p>
                        <p><strong>Duration:</strong> {request.estimatedDuration} hour{request.estimatedDuration > 1 ? 's' : ''}</p>
                      </div>
                      <div className="request-actions">
                        {request.status === 'pending' && (
                          <button 
                            className="btn-primary"
                            onClick={() => handleAcceptRequest(request._id)}
                          >
                            Accept Request
                          </button>
                        )}
                        {request.status === 'accepted' && (
                          <button 
                            className="btn-secondary"
                            onClick={() => handleCompleteRequest(request._id)}
                          >
                            Complete Service
                          </button>
                        )}
                        <button className="btn-secondary">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseDashboard;
