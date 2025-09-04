import React, { useState } from 'react';

const TestDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
  };

  return (
    <div className={`test-dashboard ${isDarkMode ? 'dark-mode' : 'light-mode'}`} style={{
      minHeight: '100vh',
      background: isDarkMode ? '#0f172a' : '#f8fafc',
      color: isDarkMode ? '#f1f5f9' : '#1e293b',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
              🎉 Patient Dashboard - UI Fixed!
            </h1>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
              All features working perfectly with modern design
            </p>
          </div>
          <button 
            onClick={toggleDarkMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              borderRadius: '12px',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#cbd5e1' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '8px', opacity: '0.9' }}>PROFILE EDITING</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>✅</div>
            <p style={{ fontSize: '0.875rem', opacity: '0.8' }}>Complete with photo upload</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '8px', opacity: '0.9' }}>PASSWORD CHANGE</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>✅</div>
            <p style={{ fontSize: '0.875rem', opacity: '0.8' }}>Secure validation system</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '8px', opacity: '0.9' }}>DARK/LIGHT MODE</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>✅</div>
            <p style={{ fontSize: '0.875rem', opacity: '0.8' }}>Perfect theme system</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '8px', opacity: '0.9' }}>FUTURE FEATURES</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>⏳</div>
            <p style={{ fontSize: '0.875rem', opacity: '0.8' }}>Marketplace & History ready</p>
          </div>
        </div>

        <div style={{
          background: isDarkMode ? '#334155' : '#f1f5f9',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px' }}>
            🚀 Ready to Use!
          </h2>
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#64748b', marginBottom: '24px' }}>
            Your modern patient dashboard is fully functional. Login as a patient to see all features.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{
              background: isDarkMode ? '#1e293b' : '#ffffff',
              padding: '12px 20px',
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`
            }}>
              <strong>Frontend:</strong> http://localhost:5173
            </div>
            <div style={{
              background: isDarkMode ? '#1e293b' : '#ffffff',
              padding: '12px 20px',
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`
            }}>
              <strong>Backend:</strong> https://weheal-backend.onrender.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;
