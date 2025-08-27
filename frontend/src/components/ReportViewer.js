import React from 'react';

const ReportViewer = ({ isOpen, onClose, reportUrl, reportName }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        width: '90%',
        height: '90%',
        maxWidth: '1200px',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          borderRadius: '1rem 1rem 0 0'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>
            📄 {reportName || 'Lab Test Report'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.2rem',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            ✕
          </button>
        </div>

        {/* PDF Viewer */}
        <div style={{
          height: 'calc(100% - 80px)',
          padding: '1rem'
        }}>
          {reportUrl ? (
            <iframe
              src={reportUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}
              title="Lab Test Report"
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              fontSize: '1.1rem'
            }}>
              📄 Report not available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
