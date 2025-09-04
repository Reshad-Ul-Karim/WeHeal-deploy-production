import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import '../styles/DoctorProfile.css';

const DoctorProfile = ({ onProfileUpdate }) => {
  const [profile, setProfile] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialization: '',
    yearsOfExperience: '',
    consultationFee: '',
    bio: '',
    languages: [],
    education: []
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [tempProfilePicture, setTempProfilePicture] = useState(null);
  const [profilePictureError, setProfilePictureError] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSpecializations();
    initializeTheme();
  }, []);

  // Initialize theme from localStorage and DOM
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', savedTheme);
  };

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(currentTheme === 'dark');
    };

    // Create a mutation observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
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
      return picturePath; // Use the proxy which is set to https://weheal-backend.onrender.com
    }
    
    // Fallback: construct the full URL
    const baseUrl = process.env.REACT_APP_API_URL || 'https://weheal-backend.onrender.com';
    const cleanPath = picturePath.replace(/^\//, ''); // Remove leading slash
    return `${baseUrl}/${cleanPath}`;
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctor/profile');
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData({
          name: response.data.data.name || '',
          phone: response.data.data.phone || '',
          specialization: response.data.data.doctorDetails?.specialization || '',
          yearsOfExperience: response.data.data.doctorDetails?.yearsOfExperience || '',
          consultationFee: response.data.data.doctorDetails?.consultationFee || '',
          bio: response.data.data.doctorDetails?.bio || '',
          languages: response.data.data.doctorDetails?.languages || [],
          education: response.data.data.doctorDetails?.education || []
        });
        // Set profile picture if available
        if (response.data.data.profilePicture) {
          const pictureUrl = constructProfilePictureUrl(response.data.data.profilePicture);
          console.log('Setting initial profile picture URL:', pictureUrl);
          setProfilePicture(pictureUrl);
          setProfilePictureError(false); // Reset error state
        } else {
          // Clear profile picture if none exists
          setProfilePicture(null);
          setProfilePictureError(false); // Reset error state
        }
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await api.get('/doctor/specializations');
      if (response.data.success) {
        setSpecializations(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching specializations:', err);
      // Set default specializations if API fails
      setSpecializations([
        'General Medicine',
        'Cardiology',
        'Dermatology',
        'Endocrinology',
        'Gastroenterology',
        'Neurology',
        'Obstetrics & Gynecology',
        'Ophthalmology',
        'Orthopedics',
        'Pediatrics',
        'Psychiatry',
        'Pulmonology',
        'Rheumatology',
        'Urology',
        'ENT (Ear, Nose & Throat)',
        'Emergency Medicine',
        'Family Medicine',
        'Internal Medicine',
        'Oncology',
        'Pathology'
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLanguageChange = (language) => {
    try {
      const updatedLanguages = formData.languages.includes(language)
        ? formData.languages.filter(l => l !== language)
        : [...formData.languages, language];
      
      console.log('Updating languages:', {
        current: formData.languages,
        adding: language,
        result: updatedLanguages
      });

      setFormData(prev => ({
        ...prev,
        languages: updatedLanguages
      }));
    } catch (err) {
      console.error('Error updating languages:', err);
      setError('Error updating languages. Please try again.');
    }
  };

  const handleEducationChange = (index, field, value) => {
    const newEducation = [...formData.education];
    if (!newEducation[index]) {
      newEducation[index] = { degree: '', institution: '', year: '' };
    }
    newEducation[index][field] = value;
    setFormData(prev => ({
      ...prev,
      education: newEducation
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: '' }]
    }));
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, and GIF images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Maximum size is 5MB.');
      return;
    }

    // Create temporary preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempProfilePicture(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      setUploadingPicture(true);
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await api.post('/doctor/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Profile picture upload response:', response.data);

      if (response.data.success) {
        // Handle different response structures
        let pictureUrl = response.data.profilePicture || response.data.data?.profilePicture || response.data.url;
        
        // Use the helper function to construct proper URL
        pictureUrl = constructProfilePictureUrl(pictureUrl);
        
        console.log('Setting profile picture URL:', pictureUrl);
        setProfilePicture(pictureUrl);
        setTempProfilePicture(null); // Clear temporary preview
        
        // Update the profile state with new picture
        setProfile(prev => ({
          ...prev,
          profilePicture: pictureUrl
        }));
        
        // Notify parent component about the profile update
        if (onProfileUpdate) {
          onProfileUpdate(pictureUrl);
        }
        
        alert('Profile picture updated successfully!');
      } else {
        alert(response.data.message || 'Error updating profile picture');
        setTempProfilePicture(null); // Clear temporary preview on error
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert(err.response?.data?.message || 'Error uploading profile picture');
      setTempProfilePicture(null); // Clear temporary preview on error
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      console.log('Submitting profile update:', formData);

      const dataToSubmit = {
        ...formData,
        languages: formData.languages || [],
        education: formData.education.map(edu => ({
          ...edu,
          year: parseInt(edu.year) || null
        }))
      };

      const response = await api.put('/doctor/profile', dataToSubmit);
      console.log('Profile update response:', response.data);

      if (response.data.success) {
        setProfile(response.data.data);
        setEditMode(false);
        setError(null);
      } else {
        setError(response.data.message || 'Error updating profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Error updating profile. Please check your input and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Doctor Profile</h2>
        <div className="header-actions">
          <button 
            className="theme-toggle-btn"
            onClick={() => {
              const newTheme = isDarkMode ? 'light' : 'dark';
              setIsDarkMode(!isDarkMode);
              document.documentElement.setAttribute('data-theme', newTheme);
              localStorage.setItem('theme', newTheme);
            }}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button 
            className={`btn ${editMode ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Profile Picture Section */}
      <div className="profile-picture-section">
        <div className="profile-picture-container">
          {tempProfilePicture ? (
            <img 
              src={tempProfilePicture} 
              alt="Profile Preview" 
              className="profile-picture"
            />
          ) : profilePicture && !profilePictureError ? (
            <img 
              src={profilePicture} 
              alt="Profile" 
              className="profile-picture"
              onError={(e) => {
                console.error('Error loading profile picture:', e);
                setProfilePictureError(true);
              }}
            />
          ) : (
            <div className="profile-picture-placeholder">
              <i data-feather="user"></i>
            </div>
          )}
          {editMode && (
            <div className="profile-picture-upload">
              <div className="upload-actions">
                <label htmlFor="profile-picture-input" className="upload-btn">
                  {uploadingPicture ? (
                    <div className="uploading-spinner"></div>
                  ) : (
                    <>
                      <i data-feather="camera"></i>
                      <span>{(profilePicture || tempProfilePicture) ? 'Change Picture' : 'Upload Picture'}</span>
                    </>
                  )}
                </label>
                {(profilePicture || tempProfilePicture) && (
                  <button
                    type="button"
                    className="remove-picture-btn"
                    onClick={() => {
                      setProfilePicture(null);
                      setTempProfilePicture(null);
                    }}
                    disabled={uploadingPicture}
                  >
                    <i data-feather="trash-2"></i>
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                style={{ display: 'none' }}
                disabled={uploadingPicture}
              />
                        {!(profilePicture || tempProfilePicture) && (
            <p className="upload-hint">Click to upload your profile picture</p>
          )}
          {profilePictureError && profilePicture && (
            <button
              type="button"
              className="retry-picture-btn"
              onClick={() => {
                setProfilePictureError(false);
                // Force re-render of the image
                const img = new Image();
                img.onload = () => setProfilePictureError(false);
                img.onerror = () => setProfilePictureError(true);
                img.src = profilePicture;
              }}
              title="Retry loading profile picture"
            >
              <i data-feather="refresh-cw"></i>
              <span>Retry</span>
            </button>
          )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!editMode}
              required
              placeholder={formData.name || "Enter your name"}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!editMode}
              required
              placeholder={formData.phone || "Enter your phone number"}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Professional Details</h3>
          <div className="form-group">
            <label>Specialization</label>
            <select
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              disabled={!editMode}
              required
            >
              <option value="">{formData.specialization || "Select Specialization"}</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Years of Experience</label>
            <input
              type="number"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleInputChange}
              disabled={!editMode}
              min="0"
              max="50"
              required
              placeholder={formData.yearsOfExperience || "Years of experience"}
            />
          </div>
          <div className="form-group">
            <label>Consultation Fee</label>
            <input
              type="number"
              name="consultationFee"
              value={formData.consultationFee}
              onChange={handleInputChange}
              disabled={!editMode}
              min="0"
              required
              placeholder={formData.consultationFee || "Enter consultation fee"}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Education</h3>
          {formData.education.map((edu, index) => (
            <div key={index} className="education-entry">
              <div className="form-group">
                <label>Degree</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                  disabled={!editMode}
                  placeholder={edu.degree || "Enter degree"}
                  required
                />
              </div>
              <div className="form-group">
                <label>Institution</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                  disabled={!editMode}
                  placeholder={edu.institution || "Enter institution name"}
                  required
                />
              </div>
              <div className="form-group">
                <label>Year</label>
                <input
                  type="number"
                  value={edu.year}
                  onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                  disabled={!editMode}
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder={edu.year || "Year"}
                  required
                />
              </div>
              {editMode && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeEducation(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {editMode && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addEducation}
            >
              Add Education
            </button>
          )}
        </div>

        <div className="form-section">
          <h3>Languages</h3>
          <div className="languages-grid">
            {['English', 'Spanish', 'French', 'German', 'Chinese', 'Hindi', 'Arabic', 'Russian', 'Japanese', 'Korean', 'Bangla'].map(lang => (
              <label key={lang} className="language-checkbox">
                <input
                  type="checkbox"
                  checked={formData.languages.includes(lang)}
                  onChange={() => handleLanguageChange(lang)}
                  disabled={!editMode}
                />
                {lang}
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Bio</h3>
          <div className="form-group">
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!editMode}
              maxLength="500"
              rows="4"
              placeholder={formData.bio || "Write a brief professional bio"}
            />
            <small>{formData.bio.length}/500 characters</small>
          </div>
        </div>

        {editMode && (
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default DoctorProfile; 