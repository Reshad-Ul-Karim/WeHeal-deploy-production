import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/marketplaceAPI';
import DashboardButton from '../../components/DashboardButton';
import '../../styles/marketplace.css';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchOrders();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await orderAPI.getUserOrders(filters);
      
      if (response.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error loading orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({
      ...prev,
      status,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      setDownloadingInvoice(orderId);
      setError('');
      
      await orderAPI.downloadInvoice(orderId);
      
      // Show success message (optional)
      // You could add a toast notification here
      console.log('Invoice downloaded successfully');
      
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setError(`Failed to download invoice for order ${orderId}. Please try again.`);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white', icon: '⏳' };
      case 'confirmed':
        return { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', icon: '✅' };
      case 'processing':
        return { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', icon: '⚡' };
      case 'shipped':
        return { bg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'white', icon: '🚚' };
      case 'delivered':
        return { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', icon: '✨' };
      case 'cancelled':
        return { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', icon: '❌' };
      default:
        return { bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', color: 'white', icon: '📦' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Dashboard Button */}
      <DashboardButton userRole="Patient" />
      
      {/* Enhanced Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem',
          paddingTop: '3rem',
          paddingBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '0.75rem',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <span style={{ fontSize: '4rem' }}>📦</span>
            My Orders
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '1.2rem',
            fontWeight: '400',
            lineHeight: '1.6'
          }}>
            Track and manage your orders with ease
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1rem',
        paddingBottom: '2rem'
      }}>

        {/* Enhanced Filters */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb'
        }}>
          <h3 className="gradient-text" style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🔍 Filter Orders
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {[
              { value: '', label: 'All Orders', icon: '📋' },
              { value: 'pending', label: 'Pending', icon: '⏳' },
              { value: 'confirmed', label: 'Confirmed', icon: '✅' },
              { value: 'processing', label: 'Processing', icon: '⚡' },
              { value: 'shipped', label: 'Shipped', icon: '🚚' },
              { value: 'delivered', label: 'Delivered', icon: '📦' },
              { value: 'cancelled', label: 'Cancelled', icon: '❌' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleStatusFilter(filter.value)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: filters.status === filter.value
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  color: filters.status === filter.value ? 'white' : '#374151',
                  boxShadow: filters.status === filter.value 
                    ? '0 4px 15px rgba(59, 130, 246, 0.3)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  if (filters.status !== filter.value) {
                    e.target.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.status !== filter.value) {
                    e.target.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {filter.icon} {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
            border: '2px solid #f87171',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            color: '#dc2626',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 15px rgba(248, 113, 113, 0.2)'
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {[...Array(3)].map((_, index) => (
              <div key={index} style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  height: '1.5rem',
                  background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                  width: '25%',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></div>
                <div style={{
                  height: '1rem',
                  background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                  borderRadius: '0.5rem',
                  marginBottom: '0.75rem',
                  width: '50%',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></div>
                <div style={{
                  height: '1rem',
                  background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                  width: '33%',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></div>
                <div style={{
                  height: '5rem',
                  background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                  borderRadius: '0.75rem',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 0',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>📦</div>
            <div style={{
              color: '#6b7280',
              fontSize: '1.25rem',
              marginBottom: '1.5rem',
              fontWeight: '600'
            }}>
              {filters.status ? 
                `No ${filters.status} orders found` : 
                'No orders found'
              }
            </div>
            <button
              onClick={() => navigate('/marketplace')}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
              }}
            >
              🛍️ Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Enhanced Orders List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {orders.map((order) => {
                const statusInfo = getStatusColor(order.status);
                return (
                  <div key={order._id} style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                  }}
                  >
                    {/* Enhanced Order Header */}
                    <div style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)',
                      borderBottom: '1px solid #d1d5db'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}>
                          <div>
                            <h3 className="gradient-text" style={{
                              fontSize: '1.4rem',
                              fontWeight: '700',
                              marginBottom: '0.5rem'
                            }}>
                              🧾 Order #{order.orderId}
                            </h3>
                            <p style={{
                              fontSize: '0.95rem',
                              color: '#6b7280',
                              fontWeight: '500'
                            }}>
                              📅 Placed on {formatDate(order.orderDate)}
                            </p>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem'
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.75rem 1.25rem',
                              borderRadius: '1rem',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                            }}>
                              {statusInfo.icon} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <div className="gradient-text-price" style={{
                              fontSize: '1.6rem',
                              fontWeight: '800'
                            }}>
                              ₹{order.totalAmount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Order Items */}
                    <div style={{ padding: '2rem' }}>
                      <h4 style={{
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        📦 Order Items
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            padding: '1.5rem',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)',
                            borderRadius: '1rem',
                            border: '1px solid #d1d5db'
                          }}>
                            <div style={{ flexShrink: 0 }}>
                              <img
                                src={item.productId?.image ? `https://weheal-backend.onrender.com${item.productId.image}` : '/placeholder-product.png'}
                                alt={item.name}
                                style={{
                                  height: '80px',
                                  width: '80px',
                                  borderRadius: '1rem',
                                  objectFit: 'cover',
                                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                                  border: '2px solid #e5e7eb'
                                }}
                                onError={(e) => {
                                  e.target.src = '/placeholder-product.png';
                                }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '0.5rem',
                                lineHeight: '1.4'
                              }}>
                                {item.name}
                              </h4>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{
                                  display: 'inline-block',
                                  background: item.category === 'medicine' 
                                    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                    : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                                  color: 'white',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '1rem',
                                  fontSize: '0.8rem',
                                  fontWeight: '500'
                                }}>
                                  {item.category === 'medicine' ? '💊 Medicine' : '🧪 Lab Test'}
                                </div>
                                <span style={{
                                  fontSize: '0.9rem',
                                  color: '#6b7280',
                                  fontWeight: '500'
                                }}>
                                  Qty: <span style={{ fontWeight: '700', color: '#374151' }}>{item.quantity}</span>
                                </span>
                                <span style={{
                                  fontSize: '0.9rem',
                                  color: '#6b7280',
                                  fontWeight: '500'
                                }}>
                                  ₹{item.price} each
                                </span>
                              </div>
                            </div>
                            <div className="gradient-text-price" style={{
                              fontSize: '1.3rem',
                              fontWeight: '700',
                              textAlign: 'right'
                            }}>
                              ₹{item.total.toFixed(2)}
                            </div>
                          </div>
                        ))}
                        
                        {order.items.length > 2 && (
                          <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                            borderRadius: '0.75rem',
                            textAlign: 'center',
                            color: '#3730a3',
                            fontWeight: '600',
                            fontSize: '0.95rem'
                          }}>
                            📦 +{order.items.length - 2} more item(s)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Order Actions */}
                    <div style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)',
                      borderTop: '1px solid #d1d5db'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                      }}>
                        {/* Tracking and Delivery Info */}
                        {(order.trackingNumber || order.estimatedDelivery) && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            fontSize: '0.9rem',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            {order.trackingNumber && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                borderRadius: '0.75rem',
                                color: '#1e40af'
                              }}>
                                🚚 Tracking: <span style={{ fontWeight: '700' }}>{order.trackingNumber}</span>
                              </div>
                            )}
                            {order.estimatedDelivery && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                                borderRadius: '0.75rem',
                                color: '#166534'
                              }}>
                                📅 Est. Delivery: <span style={{ fontWeight: '700' }}>{formatDate(order.estimatedDelivery)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          <button
                            onClick={() => navigate(`/orders/${order.orderId}`)}
                            style={{
                              padding: '0.75rem 1.5rem',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.75rem',
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                            }}
                          >
                            👁️ View Details
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(order.orderId)}
                            disabled={downloadingInvoice === order.orderId}
                            style={{
                              padding: '0.75rem 1.5rem',
                              background: downloadingInvoice === order.orderId 
                                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.75rem',
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              cursor: downloadingInvoice === order.orderId ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: downloadingInvoice === order.orderId 
                                ? '0 2px 8px rgba(156, 163, 175, 0.3)'
                                : '0 4px 15px rgba(16, 185, 129, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              opacity: downloadingInvoice === order.orderId ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (downloadingInvoice !== order.orderId) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (downloadingInvoice !== order.orderId) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                              }
                            }}
                          >
                            {downloadingInvoice === order.orderId ? (
                              <>⏳ Downloading...</>
                            ) : (
                              <>📄 Download Invoice</>
                            )}
                          </button>
                          {['pending', 'confirmed'].includes(order.status) && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to cancel this order?')) {
                                  // Cancel order logic will be added
                                }
                              }}
                              style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                              }}
                            >
                              ❌ Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{
                marginTop: '3rem',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.95rem',
                    color: '#6b7280',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📊 Showing <span className="gradient-text" style={{ fontWeight: '700' }}>
                      {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                      {Math.min(pagination.currentPage * filters.limit, pagination.totalOrders)}
                    </span> of <span className="gradient-text" style={{ fontWeight: '700' }}>
                      {pagination.totalOrders}
                    </span> orders
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: !pagination.hasPrevPage 
                          ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                          : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                        color: !pagination.hasPrevPage ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: !pagination.hasPrevPage ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: !pagination.hasPrevPage 
                          ? 'none' 
                          : '0 2px 8px rgba(107, 114, 128, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (pagination.hasPrevPage) {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pagination.hasPrevPage) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.3)';
                        }
                      }}
                    >
                      ⬅️ Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: !pagination.hasNextPage 
                          ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                          : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                        color: !pagination.hasNextPage ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: !pagination.hasNextPage ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: !pagination.hasNextPage 
                          ? 'none' 
                          : '0 2px 8px rgba(107, 114, 128, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (pagination.hasNextPage) {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pagination.hasNextPage) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.3)';
                        }
                      }}
                    >
                      Next ➡️
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
