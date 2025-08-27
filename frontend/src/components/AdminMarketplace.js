import React, { useState, useEffect } from 'react';
import { adminMarketplaceAPI } from '../services/marketplaceAPI';

// Add Product Form Component
const AddProductForm = ({ onProductAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'medicine',
    price: '',
    stock: '',
    manufacturer: '',
    dosage: '',
    requirements: '',
    testType: '',
    preparationInstructions: '',
    reportDeliveryTime: '',
    sampleType: '',
    labOptions: []
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleLabOptionChange = (index, field, value) => {
    const updatedLabOptions = [...formData.labOptions];
    updatedLabOptions[index] = {
      ...updatedLabOptions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      labOptions: updatedLabOptions
    }));
  };

  const addLabOption = () => {
    setFormData(prev => ({
      ...prev,
      labOptions: [...prev.labOptions, { labName: '', price: '' }]
    }));
  };

  const removeLabOption = (index) => {
    setFormData(prev => ({
      ...prev,
      labOptions: prev.labOptions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'labOptions') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add image if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await adminMarketplaceAPI.createProduct(formDataToSend);
      
      if (response.success) {
        setSuccess('Product created successfully!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: 'medicine',
          price: '',
          stock: '',
          manufacturer: '',
          dosage: '',
          requirements: '',
          testType: '',
          preparationInstructions: '',
          reportDeliveryTime: '',
          sampleType: '',
          labOptions: []
        });
        setImageFile(null);
        
        // Call the callback to refresh products
        setTimeout(() => {
          onProductAdded();
        }, 1500);
      } else {
        setError(response.message || 'Failed to create product');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-form" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h4 style={{ marginBottom: '1.5rem', color: '#374151' }}>Add New Product</h4>
      
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            Product Name *
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
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              resize: 'vertical'
            }}
            placeholder="Enter product description"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="medicine">Medicine</option>
              <option value="lab-test">Lab Test</option>
            </select>
          </div>

          {formData.category === 'medicine' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="0.00"
              />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {formData.category === 'medicine' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="Enter stock quantity"
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Manufacturer
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
              placeholder="Enter manufacturer name"
            />
          </div>
        </div>

        {formData.category === 'medicine' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Dosage (for medicines)
            </label>
            <input
              type="text"
              name="dosage"
              value={formData.dosage}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
              placeholder="e.g., 500mg, 10ml"
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            Requirements
          </label>
          <input
            type="text"
            name="requirements"
            value={formData.requirements}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
            placeholder="e.g., Prescription required"
          />
        </div>

        {/* Lab Test Specific Fields */}
        {formData.category === 'lab-test' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Test Type
                </label>
                <input
                  type="text"
                  name="testType"
                  value={formData.testType}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="e.g., Blood Test, Urine Test"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Sample Type
                </label>
                <input
                  type="text"
                  name="sampleType"
                  value={formData.sampleType}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="e.g., Blood, Urine, Saliva"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Preparation Instructions
              </label>
              <textarea
                name="preparationInstructions"
                value={formData.preparationInstructions}
                onChange={handleInputChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
                placeholder="e.g., Fasting required for 8 hours"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Report Delivery Time
              </label>
              <input
                type="text"
                name="reportDeliveryTime"
                value={formData.reportDeliveryTime}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="e.g., 24-48 hours"
              />
            </div>

            {/* Lab Options Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '500', color: '#374151' }}>
                  Lab Options
                </label>
                <button
                  type="button"
                  onClick={addLabOption}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  + Add Lab Option
                </button>
              </div>
              
              {formData.labOptions.length === 0 ? (
                <div style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  border: '2px dashed #d1d5db',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  No lab options added yet. Click "Add Lab Option" to add lab choices with different prices.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formData.labOptions.map((option, index) => (
                    <div key={index} style={{
                      padding: '1rem',
                      background: '#f8fafc',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                          Lab Option {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLabOption(index)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            Lab Name
                          </label>
                          <input
                            type="text"
                            value={option.labName}
                            onChange={(e) => handleLabOptionChange(index, 'labName', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem'
                            }}
                            placeholder="e.g., Square Hospital"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            Price (₹)
                          </label>
                          <input
                            type="number"
                            value={option.price}
                            onChange={(e) => handleLabOptionChange(index, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem'
                            }}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            Product Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          />
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Optional: Upload an image (JPEG, PNG, GIF - Max 5MB)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          
          <button
            type="button"
            onClick={onProductAdded}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const AdminMarketplace = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching admin marketplace stats...');
      const response = await adminMarketplaceAPI.getMarketplaceStats();
      console.log('Stats response:', response);
      if (response.success) {
        setStats(response.data);
      } else {
        setError('Failed to load statistics');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      if (err.response?.status === 403) {
        setError('Access denied: Admin privileges required');
      } else if (err.response?.status === 401) {
        setError('Authentication required: Please log in as admin');
      } else {
        setError('Error fetching statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching admin marketplace products...');
      const response = await adminMarketplaceAPI.getAllProducts({ limit: 10, isActive: 'true' });
      console.log('Products response:', response);
      if (response.success) {
        setProducts(response.data.products || []);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      if (err.response?.status === 403) {
        setError('Access denied: Admin privileges required');
      } else if (err.response?.status === 401) {
        setError('Authentication required: Please log in as admin');
      } else {
        setError('Error fetching products');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminMarketplaceAPI.getAllOrders();
      console.log('Orders response:', response);
      if (response.success) {
        setOrders(response.data.orders || []);
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await adminMarketplaceAPI.deleteProduct(productId);
      if (response.success) {
        // Remove from local list
        setProducts(prev => prev.filter(p => p._id !== productId));
        setSuccess('Product deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      if (err.response?.status === 403) {
        setError('Access denied: Admin privileges required');
      } else if (err.response?.status === 401) {
        setError('Authentication required: Please log in as admin');
      } else {
        setError('Error deleting product');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await adminMarketplaceAPI.updateOrderStatus(orderId, { status: newStatus });
      
      if (response.success) {
        // Update the orders list locally
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        setSuccess(`Order status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      if (err.response?.status === 403) {
        setError('Access denied: Admin privileges required');
      } else if (err.response?.status === 401) {
        setError('Authentication required: Please log in as admin');
      } else {
        setError('Error updating order status');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle view order details
  const handleViewOrderDetails = (orderId) => {
    // For now, we'll show an alert with order ID
    // In a full implementation, this could open a modal or navigate to a detail page
    alert(`View details for Order ID: ${orderId}\n\nThis feature can be enhanced to show full order details in a modal or dedicated page.`);
  };

  // useEffect to fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
      fetchProducts();
      fetchOrders();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  return (
    <div className="admin-marketplace">
      <div className="marketplace-header" style={{ marginBottom: '2rem' }}>
        <h3>Marketplace Management</h3>
        <p>Manage products, orders, and marketplace statistics</p>
      </div>

      {/* Navigation Tabs */}
      <div className="marketplace-tabs" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'products', label: 'Products' },
            { id: 'orders', label: 'Orders' },
            { id: 'add-product', label: 'Add Product' }
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

      {/* Content based on active tab */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && stats && (
            <div className="marketplace-overview">
              <div className="stats-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem', 
                marginBottom: '2rem' 
              }}>
                <div className="stat-card" style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Total Products</h4>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{stats.products.total}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{stats.products.active} active</p>
                </div>
                <div className="stat-card" style={{ padding: '1.5rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>Medicines</h4>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#0369a1' }}>{stats.products.medicines}</p>
                </div>
                <div className="stat-card" style={{ padding: '1.5rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#064e3b' }}>Lab Tests</h4>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#059669' }}>{stats.products.labTests}</p>
                </div>
                <div className="stat-card" style={{ padding: '1.5rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Total Orders</h4>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#d97706' }}>{stats.orders.total}</p>
                  <p style={{ fontSize: '0.875rem', color: '#92400e', margin: '0.25rem 0 0 0' }}>{stats.orders.pending} pending</p>
                </div>
                <div className="stat-card" style={{ padding: '1.5rem', background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#581c87' }}>Revenue</h4>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#7c3aed' }}>₹{stats.revenue.total.toFixed(2)}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('products')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Manage Products
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Manage Orders
                </button>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="products-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4>Recent Products</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setActiveTab('add-product')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Add Product
                  </button>
                  <button
                    onClick={() => setActiveTab('products')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    View All Products
                  </button>
                </div>
              </div>
              {products.length === 0 ? (
                <p>No products found. <button onClick={() => setActiveTab('add-product')} style={{ color: '#3b82f6', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Add your first product</button></p>
              ) : (
                <div className="table-container">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Name</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Category</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Price</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Stock</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 5).map(product => (
                        <tr key={product._id}>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{product.name}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                            <span style={{ 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '0.375rem', 
                              fontSize: '0.75rem',
                              background: product.category === 'medicine' ? '#dcfce7' : '#dbeafe',
                              color: product.category === 'medicine' ? '#166534' : '#1e40af'
                            }}>
                              {product.category === 'medicine' ? '💊 Medicine' : '🧪 Lab Test'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>₹{product.price}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{product.stock}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                            <span style={{ 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '0.375rem', 
                              fontSize: '0.75rem',
                              background: product.isActive ? '#dcfce7' : '#fee2e2',
                              color: product.isActive ? '#166534' : '#dc2626'
                            }}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4>Recent Orders</h4>
                <button
                  onClick={() => setActiveTab('orders')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  View All Orders
                </button>
              </div>
              {orders.length === 0 ? (
                <p>No orders found.</p>
              ) : (
                <div className="table-container">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Order ID</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Customer</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Total</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(order => (
                        <tr key={order._id}>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb', fontFamily: 'monospace' }}>{order.orderId}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{order.userId?.fullName || order.userId?.name || 'N/A'}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>₹{order.totalAmount}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                              style={{
                                padding: '0.5rem',
                                border: '2px solid #d1d5db',
                                borderRadius: '0.5rem',
                                background: 'white',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                minWidth: '130px',
                                fontWeight: '500',
                                transition: 'border-color 0.2s ease',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            >
                              {/* Medicine order statuses */}
                              <option value="pending" style={{ background: '#fef3c7', color: '#92400e' }}>⏳ Pending</option>
                              <option value="confirmed" style={{ background: '#dbeafe', color: '#1e40af' }}>✅ Confirmed</option>
                              <option value="processing" style={{ background: '#e0e7ff', color: '#5b21b6' }}>⚡ Processing</option>
                              <option value="shipped" style={{ background: '#cffafe', color: '#065f46' }}>🚚 Shipped</option>
                              <option value="delivered" style={{ background: '#dcfce7', color: '#166534' }}>✨ Delivered</option>
                              
                              {/* Lab test specific statuses */}
                              <option value="received-request" style={{ background: '#f3e8ff', color: '#581c87' }}>📋 Received Request</option>
                              <option value="processing-request" style={{ background: '#e0f2fe', color: '#0c4a6e' }}>⚡ Processing Request</option>
                              <option value="sent-for-sample-collection" style={{ background: '#fff7ed', color: '#9a3412' }}>🚚 Sent for Sample Collection</option>
                              <option value="sample-collected" style={{ background: '#dcfce7', color: '#166534' }}>🧪 Sample Collected</option>
                              <option value="report-delivered" style={{ background: '#f0fdf4', color: '#15803d' }}>📄 Report Delivered</option>
                              
                              {/* Common status */}
                              <option value="cancelled" style={{ background: '#fee2e2', color: '#dc2626' }}>❌ Cancelled</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                            {new Date(order.orderDate).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                            <button
                              onClick={() => handleViewOrderDetails(order._id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                              }}
                            >
                              👁️ View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'add-product' && (
            <AddProductForm onProductAdded={() => {
              setActiveTab('products');
              fetchProducts();
            }} />
          )}
        </>
      )}
    </div>
  );
};

export default AdminMarketplace;
