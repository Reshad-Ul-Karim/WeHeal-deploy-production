import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/marketplace.css';

const MyReportsPage = () => {
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/lab-tests/patient/reports');
      
      if (response.data.success) {
        setLabReports(response.data.data);
      } else {
        setError('Failed to fetch lab reports');
      }
    } catch (err) {
      console.error('Error fetching lab reports:', err);
      setError('Error loading lab reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center">
            <button
              onClick={() => navigate('/lab-tests')}
              style={{
                position: 'absolute',
                top: '2rem',
                left: '2rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '3rem',
                height: '3rem',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              ←
            </button>
            
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: '800', 
              marginBottom: '1rem',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              letterSpacing: '-0.02em'
            }}>
              📄 My Lab Reports
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              opacity: '0.95',
              fontWeight: '300',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Access and download your completed lab test reports
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #f87171',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 15px rgba(248, 113, 113, 0.2)'
          }}>
            <div style={{ color: '#dc2626', fontWeight: '500', fontSize: '1rem' }}>{error}</div>
          </div>
        )}

        {loading ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <div style={{ color: '#6b7280', fontSize: '1.2rem' }}>Loading your lab reports...</div>
          </div>
        ) : labReports.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📄</div>
            <h2 style={{ 
              color: '#374151', 
              fontSize: '1.5rem', 
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              No Lab Reports Available
            </h2>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.1rem',
              marginBottom: '2rem'
            }}>
              There are no lab reports available for you right now. Your reports will appear here once they are completed and ready.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/lab-tests/my-tests')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                View My Lab Tests
              </button>
              <button
                onClick={() => navigate('/lab-tests')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Browse Lab Tests
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <h2 style={{ 
                fontSize: '1.8rem', 
                fontWeight: '700', 
                color: '#1f2937'
              }}>
                Lab Report History
              </h2>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {labReports.length} {labReports.length === 1 ? 'Report' : 'Reports'}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {labReports.map((report) => (
                <div
                  key={report.reportId}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '0.5rem'
                      }}>
                        {report.testName}
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        fontSize: '0.95rem'
                      }}>
                        <div>
                          <span style={{ color: '#6b7280', fontWeight: '500' }}>Referred by: </span>
                          <span style={{ color: '#374151' }}>{report.doctorName}</span>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280', fontWeight: '500' }}>Order Date: </span>
                          <span style={{ color: '#374151' }}>{formatDate(report.orderDate)}</span>
                        </div>
                        {report.testDate && (
                          <div>
                            <span style={{ color: '#6b7280', fontWeight: '500' }}>Test Date: </span>
                            <span style={{ color: '#374151' }}>{formatDate(report.testDate)}</span>
                          </div>
                        )}
                        {report.reportGeneratedDate && (
                          <div>
                            <span style={{ color: '#6b7280', fontWeight: '500' }}>Report Date: </span>
                            <span style={{ color: '#374151' }}>{formatDate(report.reportGeneratedDate)}</span>
                          </div>
                        )}
                        <div>
                          <span style={{ color: '#6b7280', fontWeight: '500' }}>Price: </span>
                          <span style={{ color: '#374151', fontWeight: '600' }}>${report.price}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {report.reportStatus === 'ready' && report.reportUrl ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                          <button
                            onClick={() => window.open(report.reportUrl, '_blank')}
                            style={{
                              padding: '0.75rem 1.5rem',
                              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            👁️ View Report
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = report.reportUrl;
                              link.download = `${report.testName}_Report.pdf`;
                              link.click();
                            }}
                            style={{
                              padding: '0.75rem 1.5rem',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            📥 Download PDF
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          padding: '0.75rem 1.5rem',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textAlign: 'center',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ marginBottom: '0.25rem' }}>⏳</div>
                          Lab report is yet to come.<br />
                          Please check again later.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReportsPage;
