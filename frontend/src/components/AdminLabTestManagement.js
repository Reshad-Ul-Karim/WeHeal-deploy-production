import React, { useState, useEffect } from 'react';
import { adminMarketplaceAPI } from '../services/marketplaceAPI';

// Lab Center Management Component
const LabCenterManagement = () => {
  const [labCenters, setLabCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    operatingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: { open: '10:00', close: '14:00' }
    },
    facilities: []
  });

  const facilityOptions = [
    'blood-collection',
    'urine-collection',
    'imaging',
    'cardiology',
    'pathology',
    'radiology'
  ];

  useEffect(() => {
    fetchLabCenters();
  }, []);

  const fetchLabCenters = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://weheal-backend.onrender.com/api/lab-centers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setLabCenters(data.data.labCenters || data.data);
      } else {
        setError('Failed to fetch lab centers');
      }
    } catch (err) {
      console.error('Error fetching lab centers:', err);
      setError('Error fetching lab centers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFacilityChange = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://weheal-backend.onrender.com/api/lab-centers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Lab center created successfully!');
        setShowAddForm(false);
        setFormData({
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
          },
          contactInfo: {
            phone: '',
            email: '',
            website: ''
          },
          operatingHours: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '09:00', close: '16:00' },
            sunday: { open: '10:00', close: '14:00' }
          },
          facilities: []
        });
        fetchLabCenters();
      } else {
        setError(data.message || 'Failed to create lab center');
      }
    } catch (err) {
      console.error('Error creating lab center:', err);
      setError('Error creating lab center');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#374151', margin: 0 }}>Lab Center Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          {showAddForm ? 'Cancel' : 'Add Lab Center'}
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca', 
          color: '#dc2626', 
          padding: '0.75rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#dcfce7', 
          border: '1px solid #bbf7d0', 
          color: '#166534', 
          padding: '0.75rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1rem' 
        }}>
          {success}
        </div>
      )}

      {showAddForm && (
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '1rem', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#374151' }}>Add New Lab Center</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Lab Center Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="Enter lab center name"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter street address"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  City *
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter city"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  State *
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Phone *
                </label>
                <input
                  type="tel"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="contactInfo.email"
                  value={formData.contactInfo.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Website
              </label>
              <input
                type="url"
                name="contactInfo.website"
                value={formData.contactInfo.website}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="Enter website URL"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Facilities Available
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {facilityOptions.map(facility => (
                  <label key={facility} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.facilities.includes(facility)}
                      onChange={() => handleFacilityChange(facility)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                      {facility.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Creating...' : 'Create Lab Center'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lab Centers List */}
      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '1rem', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' 
      }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#374151' }}>Lab Centers</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
        ) : labCenters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No lab centers found. Add your first lab center above.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {labCenters.map(labCenter => (
              <div
                key={labCenter._id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  background: '#f9fafb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>{labCenter.name}</h4>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                      📍 {labCenter.address.street}, {labCenter.address.city}, {labCenter.address.state} {labCenter.address.zipCode}
                    </p>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                      📞 {labCenter.contactInfo.phone}
                    </p>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '0.875rem' }}>
                      ✉️ {labCenter.contactInfo.email}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      ⭐ {labCenter.rating}/5 ({labCenter.totalRatings} ratings)
                    </div>
                  </div>
                </div>
                
                {labCenter.facilities.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                      Facilities:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {labCenter.facilities.map(facility => (
                        <span
                          key={facility}
                          style={{
                            background: '#e5e7eb',
                            color: '#374151',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            textTransform: 'capitalize'
                          }}
                        >
                          {facility.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabCenterManagement;
