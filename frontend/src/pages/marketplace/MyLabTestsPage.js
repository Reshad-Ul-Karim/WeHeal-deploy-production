import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/marketplaceAPI';
import DashboardButton from '../../components/DashboardButton';
import ReportViewer from '../../components/ReportViewer';
import '../../styles/marketplace.css';

const MyLabTestsPage = () => {
  const navigate = useNavigate();
  const [labTestOrders, setLabTestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [reportViewer, setReportViewer] = useState({
    isOpen: false,
    reportUrl: '',
    reportName: ''
  });

  useEffect(() => {
    fetchLabTestOrders();
    
    // Set up automatic refresh every 30 seconds to get real-time status updates
    const interval = setInterval(() => {
      fetchLabTestOrders(false); // false means don't show loading state
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchLabTestOrders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError('');
      
      const response = await orderAPI.getUserOrders({ limit: 50 });
      
      if (response.success) {
        // Filter only lab test orders
        const labOrders = response.data.orders.filter(order => 
          order.items.some(item => item.category === 'lab-test')
        );
        
        // Check if any status has changed
        const hasStatusChanged = labTestOrders.some((oldOrder, index) => {
          const newOrder = labOrders[index];
          return newOrder && oldOrder.status !== newOrder.status;
        });
        
        setLabTestOrders(labOrders);
        setLastUpdated(new Date());
        
        // Show notification if status changed
        if (hasStatusChanged && !showLoading) {
          setShowUpdateNotification(true);
          setTimeout(() => setShowUpdateNotification(false), 3000);
        }
      } else {
        setError('Failed to fetch lab test orders');
      }
    } catch (err) {
      console.error('Error fetching lab test orders:', err);
      setError('Error loading lab test orders. Please try again.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white', icon: '⏳' };
      case 'confirmed':
        return { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', icon: '✅' };
      case 'received-request':
        return { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', icon: '📋' };
      case 'processing-request':
        return { bg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'white', icon: '⚡' };
      case 'sent-for-sample-collection':
        return { bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white', icon: '🚚' };
      case 'sample-collected':
        return { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', icon: '🧪' };
      case 'report-delivered':
        return { bg: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)', color: 'white', icon: '📄' };
      case 'cancelled':
        return { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', icon: '❌' };
      default:
        return { bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', color: 'white', icon: '📦' };
    }
  };

  const getStatusSteps = (currentStatus) => {
    const allSteps = [
      { key: 'pending', label: 'Order Placed', icon: '⏳' },
      { key: 'confirmed', label: 'Order Confirmed', icon: '✅' },
      { key: 'received-request', label: 'Request Received', icon: '📋' },
      { key: 'processing-request', label: 'Processing Request', icon: '⚡' },
      { key: 'sent-for-sample-collection', label: 'Sample Collection', icon: '🚚' },
      { key: 'sample-collected', label: 'Sample Collected', icon: '🧪' },
      { key: 'report-delivered', label: 'Report Ready', icon: '📄' }
    ];

    const currentIndex = allSteps.findIndex(step => step.key === currentStatus);
    
    return allSteps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
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

  const handleViewReport = (order, labTestItem) => {
    // Find the report path for this specific lab test
    const reportPath = order.reportPaths?.find(rp => rp.productId === labTestItem.productId._id);
    
    if (reportPath) {
      const reportUrl = `https://weheal-backend.onrender.com/api/reports/${order.orderId}/${labTestItem.productId._id}`;
      setReportViewer({
        isOpen: true,
        reportUrl: reportUrl,
        reportName: `${labTestItem.name} - ${order.orderId}`
      });
    } else {
      alert('Report not available yet. Please wait for the report to be generated.');
    }
  };

  const handleDownloadReport = (order, labTestItem) => {
    // Find the report path for this specific lab test
    const reportPath = order.reportPaths?.find(rp => rp.productId === labTestItem.productId._id);
    
    if (reportPath) {
      const downloadUrl = `https://weheal-backend.onrender.com/api/reports/${order.orderId}/${labTestItem.productId._id}/download`;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `lab-report-${order.orderId}-${labTestItem.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Report not available yet. Please wait for the report to be generated.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Dashboard Button */}
      <DashboardButton userRole="Patient" />
      
      {/* CSS for animations */}
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            20% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `}
      </style>

      {/* Enhanced Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
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
            <span style={{ fontSize: '4rem' }}>🧪</span>
            My Lab Tests
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '1.2rem',
            fontWeight: '400',
            lineHeight: '1.6'
          }}>
            Track your lab test orders and download reports
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1rem',
        paddingBottom: '2rem'
      }}>

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

        {/* Refresh Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {lastUpdated && (
              <span style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {showUpdateNotification && (
              <div style={{
                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                border: '2px solid #86efac',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: '#166534',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'fadeInOut 3s ease-in-out'
              }}>
                ✅ Status updated automatically!
              </div>
            )}
          </div>
          <button
            onClick={() => fetchLabTestOrders(true)}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh Status'}
          </button>
        </div>

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
        ) : labTestOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 0',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>🧪</div>
            <div style={{
              color: '#6b7280',
              fontSize: '1.25rem',
              marginBottom: '1.5rem',
              fontWeight: '600'
            }}>
              No lab test orders found
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
              🛍️ Order Lab Tests
            </button>
          </div>
        ) : (
          <>
            {/* Lab Test Orders List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {labTestOrders.map((order) => {
                const statusInfo = getStatusColor(order.status);
                const statusSteps = getStatusSteps(order.status);
                const labTestItems = order.items.filter(item => item.category === 'lab-test');
                
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
                    {/* Order Header */}
                    <div style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      borderBottom: '1px solid #bae6fd'
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
                            🧪 Lab Test Order #{order.orderId}
                          </h3>
                          <p style={{
                            fontSize: '0.95rem',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            📅 Ordered on {formatDate(order.orderDate)}
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
                            {statusInfo.icon} {order.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

                    {/* Lab Test Items */}
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
                        🧪 Lab Tests ({labTestItems.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {labTestItems.map((item, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            padding: '1.5rem',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            borderRadius: '1rem',
                            border: '1px solid #bae6fd'
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
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                                  color: 'white',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '1rem',
                                  fontSize: '0.8rem',
                                  fontWeight: '500'
                                }}>
                                  🧪 Lab Test
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
                              
                              {/* Display selected lab option */}
                              {item.labOption && (
                                <div style={{
                                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                  border: '1px solid #93c5fd',
                                  borderRadius: '0.5rem',
                                  padding: '0.75rem',
                                  marginTop: '0.75rem'
                                }}>
                                  <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#1e40af',
                                    marginBottom: '0.25rem'
                                  }}>
                                    🏥 Selected Lab:
                                  </div>
                                  <div style={{
                                    fontSize: '0.8rem',
                                    color: '#1e3a8a'
                                  }}>
                                    {item.labOption.labName}
                                  </div>
                                </div>
                              )}
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
                      </div>
                    </div>

                    {/* Status Progress Bar */}
                    <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)' }}>
                      <h4 style={{
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        📊 Test Progress
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}>
                        {statusSteps.map((step, index) => (
                          <div key={step.key} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flex: 1,
                            minWidth: '120px'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              fontWeight: '600',
                              background: step.completed 
                                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                              color: step.completed ? 'white' : '#6b7280',
                              boxShadow: step.active ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
                            }}>
                              {step.icon}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              color: step.completed ? '#374151' : '#6b7280',
                              textAlign: 'center',
                              lineHeight: '1.2'
                            }}>
                              {step.label}
                            </div>
                            {index < statusSteps.length - 1 && (
                              <div style={{
                                width: '100%',
                                height: '2px',
                                background: step.completed 
                                  ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                  : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                                marginTop: '-0.5rem'
                              }}></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)',
                      borderTop: '1px solid #d1d5db'
                    }}>
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
                        
                        {/* Individual Report Buttons for each lab test */}
                        {order.status === 'report-delivered' && labTestItems.map((item, index) => {
                          const reportPath = order.reportPaths?.find(rp => rp.productId === item.productId._id);
                          const hasReport = !!reportPath;
                          
                          return (
                            <div key={index} style={{
                              display: 'flex',
                              gap: '0.5rem',
                              alignItems: 'center',
                              padding: '0.75rem 1rem',
                              background: 'white',
                              borderRadius: '0.75rem',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}>
                              <span style={{
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                color: '#374151',
                                marginRight: '0.5rem'
                              }}>
                                {item.name}:
                              </span>
                              
                              <button
                                onClick={() => handleViewReport(order, item)}
                                disabled={!hasReport}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  background: hasReport 
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : '#e5e7eb',
                                  color: hasReport ? 'white' : '#9ca3af',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: hasReport ? 'pointer' : 'not-allowed',
                                  transition: 'all 0.3s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                onMouseEnter={(e) => {
                                  if (hasReport) {
                                    e.target.style.transform = 'translateY(-1px)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (hasReport) {
                                    e.target.style.transform = 'translateY(0)';
                                  }
                                }}
                              >
                                📄 View
                              </button>
                              
                              <button
                                onClick={() => handleDownloadReport(order, item)}
                                disabled={!hasReport}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  background: hasReport 
                                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                    : '#e5e7eb',
                                  color: hasReport ? 'white' : '#9ca3af',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: hasReport ? 'pointer' : 'not-allowed',
                                  transition: 'all 0.3s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                onMouseEnter={(e) => {
                                  if (hasReport) {
                                    e.target.style.transform = 'translateY(-1px)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (hasReport) {
                                    e.target.style.transform = 'translateY(0)';
                                  }
                                }}
                              >
                                ⬇️ Download
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* Report Viewer Modal */}
      <ReportViewer
        isOpen={reportViewer.isOpen}
        onClose={() => setReportViewer({ isOpen: false, reportUrl: '', reportName: '' })}
        reportUrl={reportViewer.reportUrl}
        reportName={reportViewer.reportName}
      />
    </div>
  );
};

export default MyLabTestsPage;
