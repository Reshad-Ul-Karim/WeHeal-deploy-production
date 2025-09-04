import React, { useState } from 'react';

const UserForm = ({ onSubmit, onCancel }) => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '+1234567890',
    role: 'Patient',
    isVerified: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData((prevData) => ({ 
      ...prevData, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== UserForm handleSubmit ===');
    console.log('Form data being submitted:', userData);
    
    // Validate required fields
    if (!userData.name || !userData.email || !userData.password || !userData.phone) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate phone format
    if (!userData.phone.startsWith('+')) {
      alert('Phone number must start with +');
      return;
    }
    
    if (onSubmit) {
      await onSubmit(userData);
    } else {
      // Fallback to direct API call
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          console.log('User added successfully');
          setUserData({
            name: '',
            email: '',
            password: '',
            phone: '+1234567890',
            role: 'Patient',
            isVerified: false,
          });
        } else {
          console.error('Error adding user');
        }
      } catch (error) {
        console.error('Error adding user:', error);
      }
    }
  };

  return (
    <div className="user-form-modal">
      <div className="modal-header">
        <h3>Add New User</h3>
        {onCancel && (
          <button type="button" className="close-btn" onClick={onCancel}>
            ×
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={userData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={userData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">Role *</label>
          <select 
            id="role" 
            name="role" 
            value={userData.role} 
            onChange={handleChange}
            required
          >
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Nurse">Nurse</option>
            <option value="ClinicStaff">Clinic Staff</option>
            <option value="CustomerCare">Customer Care Officer</option>
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isVerified"
              checked={userData.isVerified}
              onChange={handleChange}
            />
            <span className="checkmark"></span>
            Verified User
          </label>
        </div>

        <div className="form-actions">
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            Add User
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
