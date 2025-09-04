import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/marketplaceAPI';
import ReportViewer from './ReportViewer';
import PrescriptionList from './prescription/PrescriptionList';

const ReportsSection = () => {
  const [labTestOrders, setLabTestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('lab-reports');

  const [reportViewer, setReportViewer] = useState({
    isOpen: false,
    reportUrl: '',
    reportName: ''
  });

  useEffect(() => {
    fetchLabTestOrders();
  }, []);

  const fetchLabTestOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await orderAPI.getUserOrders({ limit: 50 });
      console.log('Orders response:', response);
      
      if (response.success) {
        // Filter only lab test orders with reports
        const labOrders = response.data.orders.filter(order => 
          order.items.some(item => item.category === 'lab-test') && 
          order.reportPaths && order.reportPaths.length > 0
        );
        setLabTestOrders(labOrders);
      } else {
        setError('Failed to fetch lab test reports');
      }
    } catch (err) {
      console.error('Error fetching lab test reports:', err);
      setError('Error loading lab test reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (order, labTestItem) => {
    const reportPath = order.reportPaths?.find(rp => rp.productId === labTestItem.productId._id);
    
    if (reportPath) {
      const reportUrl = `http://localhost:5001/api/reports/${order.orderId}/${labTestItem.productId._id}`;
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
    const reportPath = order.reportPaths?.find(rp => rp.productId === labTestItem.productId._id);
    
    if (reportPath) {
      const downloadUrl = `http://localhost:5001/api/reports/${order.orderId}/${labTestItem.productId._id}/download`;
      
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Group orders by date
  const groupedOrders = labTestOrders.reduce((groups, order) => {
    const date = formatDate(order.orderDate);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(order);
    return groups;
  }, {});

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Loading reports...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#dc2626',
        background: '#fee2e2',
        borderRadius: '0.5rem',
        border: '1px solid #fecaca'
      }}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('lab-reports')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'lab-reports' ? '#3b82f6' : 'transparent',
            color: activeTab === 'lab-reports' ? 'white' : '#6b7280',
            borderRadius: '0.5rem 0.5rem 0 0',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          🧪 Lab Test Reports
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'prescriptions' ? '#3b82f6' : 'transparent',
            color: activeTab === 'prescriptions' ? 'white' : '#6b7280',
            borderRadius: '0.5rem 0.5rem 0 0',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          💊 My Prescriptions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'lab-reports' && (
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📋 Lab Test Reports
          </h3>

          {Object.keys(groupedOrders).length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              📄 No lab test reports available yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {Object.entries(groupedOrders).map(([date, orders]) => (
              <div key={date} style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📅 {date}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map((order) => {
                    const labTestItems = order.items.filter(item => item.category === 'lab-test');
                    
                    return labTestItems.map((item, index) => {
                      const reportPath = order.reportPaths?.find(rp => rp.productId === item.productId._id);
                      const hasReport = !!reportPath;
                  
                      return (
                        <div key={`${order._id}-${index}`} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          background: '#f8fafc',
                          borderRadius: '0.75rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}>
                            <span style={{ fontSize: '1.2rem' }}>🧪</span>
                            <div>
                              <div style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#374151'
                              }}>
                                {item.name}
                              </div>
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#6b7280'
                              }}>
                                Order #{order.orderId}
                              </div>
                              {/* Display selected lab option */}
                              {item.labOption && (
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: '#3b82f6',
                                  fontWeight: '500',
                                  marginTop: '0.25rem'
                                }}>
                                  🏥 {item.labOption.labName}
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            gap: '0.5rem'
                          }}>
                            <button
                              onClick={() => handleViewReport(order, item)}
                              disabled={!hasReport}
                              style={{
                                padding: '0.5rem 1rem',
                                background: hasReport 
                                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                  : '#e5e7eb',
                                color: hasReport ? 'white' : '#9ca3af',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: hasReport ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease',
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
                              👁️ View
                            </button>

                            <button
                              onClick={() => handleDownloadReport(order, item)}
                              disabled={!hasReport}
                              style={{
                                padding: '0.5rem 1rem',
                                background: hasReport 
                                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                  : '#e5e7eb',
                                color: hasReport ? 'white' : '#9ca3af',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: hasReport ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease',
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
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💊 My Prescriptions
          </h3>
          <PrescriptionList userRole="patient" />
        </div>
      )}

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

export default ReportsSection;
