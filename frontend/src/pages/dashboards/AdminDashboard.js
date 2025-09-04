import React, { useEffect, useState } from 'react';
import { useUsersContext } from '../../contexts/UsersContext';
import UserDetails from '../../components/UsersDetails';
import UserForm from '../../components/UserForm';
import AdminMarketplace from '../../components/AdminMarketplace';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/Auth.css';
import '../../styles/Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useOutletContext();
  const { users, dispatch } = useUsersContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [customerCareData, setCustomerCareData] = useState({
    name: '',
    userId: '',
    phone: '+1234567890',
    password: ''
  });
  const [addingCustomerCare, setAddingCustomerCare] = useState(false);
  const [editRequests, setEditRequests] = useState([]);
  const navigate = useNavigate();

  // Calculate user counts by role
  const userCounts = users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        if (response.data.success) {
          dispatch({ type: 'SET_USERS', payload: response.data.data.users });
        } else {
          setError(response.data.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError('Error fetching users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [dispatch]);

  // Fetch edit requests for customer care tab
  useEffect(() => {
    const fetchEditRequests = async () => {
      if (activeTab === 'customer-care') {
        try {
          // TODO: Implement API endpoint for edit requests
          // const response = await api.get('/admin/edit-requests');
          // if (response.data.success) {
          //   setEditRequests(response.data.data.requests);
          // }
        } catch (err) {
          console.error('Error fetching edit requests:', err);
        }
      }
    };
    fetchEditRequests();
  }, [activeTab]);

  // Filter users based on search term, role, and status
  useEffect(() => {
    if (users) {
      const filtered = users.filter(user => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || user.role === roleFilter;
        const matchesStatus =
          statusFilter === 'All' ||
          (statusFilter === 'Verified' && user.isVerified) ||
          (statusFilter === 'Unverified' && !user.isVerified);
        return matchesSearch && matchesRole && matchesStatus;
      });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users, roleFilter, statusFilter]);

  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout();
    } else {
      navigate('/login');
    }
  };

  const handleAddUser = async (userData) => {
    console.log('=== handleAddUser called ===');
    console.log('User data being sent:', userData);
    
    setAddingUser(true);
    try {
      const response = await api.post('/admin/users', userData);
      console.log('Response from server:', response.data);
      
      if (response.data.success) {
        // Add the new user to the users list
        dispatch({ type: 'ADD_USER', payload: response.data.data.user });
        setShowAddUserModal(false);
        setError(null);
        // Show success message
        alert('User created successfully!');
      } else {
        setError(response.data.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error in handleAddUser:', err);
      console.error('Error response:', err.response?.data);
      setError('Error creating user: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddingUser(false);
    }
  };

  const handleAddCustomerCareOfficer = async (e) => {
    e.preventDefault();
    setAddingCustomerCare(true);
    try {
      // Create a user with the customer care role using userId as email
      const userData = {
        name: customerCareData.name,
        email: `${customerCareData.userId}@weheal.local`, // Create a local email for login
        password: customerCareData.password,
        phone: customerCareData.phone,
        role: 'CustomerCare',
        isVerified: true
      };

      const response = await api.post('/admin/users', userData);
      if (response.data.success) {
        // Add the new user to the users list
        dispatch({ type: 'ADD_USER', payload: response.data.data.user });
        setCustomerCareData({ name: '', userId: '', phone: '+1234567890', password: '' });
        setError(null);
        // Show success message
        alert('Customer Care Officer created successfully!');
      } else {
        setError(response.data.message || 'Failed to create customer care officer');
      }
    } catch (err) {
      setError('Error creating customer care officer: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddingCustomerCare(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeletingId(userId);
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      if (response.data.success) {
        // Update the users list by removing the deleted user
        dispatch({ type: 'DELETE_USER', payload: userId });
        // Show success message
        setError(null);
      } else {
        setError(response.data.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard auth-container" style={{ padding: '2rem', position: 'relative', minHeight: '100vh' }}>
      <div className="auth-form-container" style={{ maxWidth: '1200px', width: '100%' }}>
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <button className="btn btn-primary" onClick={handleLogout} style={{ minWidth: 100 }}>Logout</button>
        </div>
        
        {error && (
          <div className="message error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="admin-tabs" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { id: 'users', label: 'User Management' },
              { id: 'marketplace', label: 'Marketplace' },
              { id: 'customer-care', label: 'Customer Care' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === tab.id ? '600' : '400'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <>
            {/* User Statistics Cards - modern design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Users Card */}
              <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                <div className="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 to-blue-800 text-white shadow-blue-900/20 absolute grid h-12 w-12 place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                    <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.016A7.5 7.5 0 0118.75 12.75v-.024M7.5 4.5v-.024a7.5 7.5 0 00-1.5 0v.024m0 0H6a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25h3.75m-1.5-12H18a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 016 4.5h1.5m-1.5 0v-.024a7.5 7.5 0 011.5 0V4.5z"></path>
                  </svg>
                </div>
                <div className="p-4 text-right">
                  <p className="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">Total Users</p>
                  <h4 className="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">{users?.length || 0}</h4>
                </div>
                <div className="border-t border-blue-gray-50 p-4">
                  <p className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600"><strong className="text-blue-500">+{userCounts?.Patient || 0}</strong>&nbsp;patients registered</p>
                </div>
              </div>

              {/* Doctors Card */}
              <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                <div className="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-green-600 to-green-800 text-white shadow-green-900/20 absolute grid h-12 w-12 place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                    <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"></path>
                  </svg>
                </div>
                <div className="p-4 text-right">
                  <p className="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">Doctors</p>
                  <h4 className="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">{userCounts?.Doctor || 0}</h4>
                </div>
                <div className="border-t border-blue-gray-50 p-4">
                  <p className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600"><strong className="text-green-500">Active</strong>&nbsp;medical professionals</p>
                </div>
              </div>

              {/* Nurses Card */}
              <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                <div className="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-purple-600 to-purple-800 text-white shadow-purple-900/20 absolute grid h-12 w-12 place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                    <path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 010-3.586V5.25A2.25 2.25 0 015.25 3h5.879a2.25 2.25 0 011.586.586l5.415 5.414a2.548 2.548 0 010 3.586l-3.586 3.586a2.548 2.548 0 01-3.586 0L8.25 9.25l-.75.75 3.92 3.92z"></path>
                  </svg>
                </div>
                <div className="p-4 text-right">
                  <p className="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">Nurses</p>
                  <h4 className="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">{userCounts?.Nurse || 0}</h4>
                </div>
                <div className="border-t border-blue-gray-50 p-4">
                  <p className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600"><strong className="text-purple-500">Care</strong>&nbsp;specialists available</p>
                </div>
              </div>
              {/* Patients Card */}
              <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                <div className="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-orange-600 to-orange-800 text-white shadow-orange-900/20 absolute grid h-12 w-12 place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                    <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.016A7.5 7.5 0 0118.75 12.75v-.024M7.5 4.5v-.024a7.5 7.5 0 00-1.5 0v.024m0 0H6a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25h3.75m-1.5-12H18a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 016 4.5h1.5m-1.5 0v-.024a7.5 7.5 0 011.5 0V4.5z"></path>
                  </svg>
                </div>
                <div className="p-4 text-right">
                  <p className="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">Patients</p>
                  <h4 className="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">{userCounts?.Patient || 0}</h4>
                </div>
                <div className="border-t border-blue-gray-50 p-4">
                  <p className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600"><strong className="text-orange-500">Active</strong>&nbsp;patient accounts</p>
                </div>
              </div>

              {/* Clinic Staff Card */}
              <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                <div className="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-teal-600 to-teal-800 text-white shadow-teal-900/20 absolute grid h-12 w-12 place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                    <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"></path>
                  </svg>
                </div>
                <div className="p-4 text-right">
                  <p className="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">Clinic Staff</p>
                  <h4 className="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">{userCounts?.ClinicStaff || 0}</h4>
                </div>
                <div className="border-t border-blue-gray-50 p-4">
                  <p className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600"><strong className="text-teal-500">Support</strong>&nbsp;staff members</p>
                </div>
              </div>

              {/* Customer Care Card */}
              <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
                <div className="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-pink-600 to-pink-800 text-white shadow-pink-900/20 absolute grid h-12 w-12 place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-white">
                    <path d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.281-4.381z"></path>
                  </svg>
                </div>
                <div className="p-4 text-right">
                  <p className="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">Customer Care</p>
                  <h4 className="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">{userCounts?.CustomerCare || 0}</h4>
                </div>
                <div className="border-t border-blue-gray-50 p-4">
                  <p className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600"><strong className="text-pink-500">Support</strong>&nbsp;team members</p>
                </div>
              </div>
            </div>
            
            {/* Users Section */}
            <div className="users-section">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Users</h3>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowAddUserModal(true)}
                  style={{ minWidth: 120 }}
                >
                  + Add User
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="auth-form input"
                  style={{ minWidth: 180 }}
                />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="auth-form input" style={{ minWidth: 120 }}>
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Nurse">Nurse</option>
                  <option value="Patient">Patient</option>
                  <option value="ClinicStaff">ClinicStaff</option>
                  <option value="CustomerCare">Customer Care</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="auth-form input" style={{ minWidth: 120 }}>
                  <option value="All">All Status</option>
                  <option value="Verified">Verified</option>
                  <option value="Unverified">Unverified</option>
                </select>
              </div>
              
              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {user.name.charAt(0)}
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                            {user.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="action-btn view"
                            style={{ marginBottom: '0.25rem', background: '#e0e7ff', color: '#3730a3' }}
                            onClick={() => navigate(`/dashboard/admin/user/${user._id}`)}
                          >
                            View Details
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={deletingId === user._id}
                          >
                            {deletingId === user._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'marketplace' && (
          <AdminMarketplace />
        )}

        {activeTab === 'customer-care' && (
          <>
            {/* Customer Care Statistics */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <h3>Total Edit Requests</h3>
                <p className="stat-number">0</p>
              </div>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <h3>Pending Requests</h3>
                <p className="stat-number">0</p>
              </div>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <h3>Customer Care Officers</h3>
                <p className="stat-number">{userCounts?.CustomerCare || 0}</p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Edit Requests Section */}
              <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <div className="card-header" style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Edit Requests</h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    Review and approve user information change requests
                  </p>
                </div>
                
                <div className="edit-requests-list">
                  {editRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                      <h4 style={{ marginBottom: '0.5rem' }}>No Edit Requests</h4>
                      <p style={{ fontSize: '0.875rem' }}>
                        Edit requests from customer care officers will appear here
                      </p>
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '6px', border: '1px dashed #d1d5db' }}>
                        <p style={{ fontSize: '0.75rem', margin: 0 }}>
                          <strong>Sample Request:</strong><br/>
                          • User: John Doe<br/>
                          • Request: Profile Update<br/>
                          • Status: Pending<br/>
                          • Officer: Agent Smith
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="requests-list">
                      {editRequests.map((request) => (
                        <div key={request._id} className="request-item" style={{ 
                          padding: '1rem', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '6px', 
                          marginBottom: '0.75rem',
                          background: request.status === 'pending' ? '#fef3c7' : 
                                    request.status === 'approved' ? '#d1fae5' : '#fee2e2'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div>
                              <strong>{request.userName}</strong>
                              <span style={{ 
                                marginLeft: '0.5rem', 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem',
                                background: request.status === 'pending' ? '#f59e0b' : 
                                          request.status === 'approved' ? '#10b981' : '#ef4444',
                                color: 'white'
                              }}>
                                {request.status}
                              </span>
                            </div>
                            <small style={{ color: '#6b7280' }}>{request.requestId}</small>
                          </div>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                            <strong>Request:</strong> {request.requestType}
                          </p>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                            <strong>Officer:</strong> {request.customerCareOfficerName}
                          </p>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                            <strong>Reason:</strong> {request.reason}
                          </p>
                          {request.status === 'pending' && (
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                              <button 
                                className="btn btn-success" 
                                style={{ 
                                  padding: '0.5rem 1rem', 
                                  background: '#10b981', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '4px', 
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Approve
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ 
                                  padding: '0.5rem 1rem', 
                                  background: '#ef4444', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '4px', 
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Care Officer Creation Section */}
              <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <div className="card-header" style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Add Customer Care Officer</h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    Create new customer care officer accounts
                  </p>
                </div>
                
                <form onSubmit={handleAddCustomerCareOfficer} className="customer-care-form">
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerCareData.name}
                      onChange={(e) => setCustomerCareData({...customerCareData, name: e.target.value})}
                      placeholder="Enter full name"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                      User ID *
                    </label>
                    <input
                      type="text"
                      value={customerCareData.userId}
                      onChange={(e) => setCustomerCareData({...customerCareData, userId: e.target.value})}
                      placeholder="Enter easy to remember user ID"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      This will be used for login (e.g., "agent1", "support_john")
                    </small>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={customerCareData.phone || '+1234567890'}
                      onChange={(e) => setCustomerCareData({...customerCareData, phone: e.target.value})}
                      placeholder="Enter phone number"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      value={customerCareData.password}
                      onChange={(e) => setCustomerCareData({...customerCareData, password: e.target.value})}
                      placeholder="Enter password"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addingCustomerCare}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    {addingCustomerCare ? 'Creating...' : 'Create Customer Care Officer'}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <UserForm 
              onSubmit={handleAddUser}
              onCancel={() => setShowAddUserModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
