import React from 'react';
import { useNavigate } from 'react-router-dom';

const ServiceCard = ({ icon, title, subtitle, onClick, primary }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 18px',
      width: '100%',
      borderRadius: 12,
      border: primary ? '2px solid #1d4ed8' : '1px solid #e5e7eb',
      background: '#fff',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
    }}
  >
    <div style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: primary ? '#dbeafe' : '#f3f4f6',
      color: primary ? '#1d4ed8' : '#374151',
      fontSize: 20,
      fontWeight: 700
    }}>
      {icon}
    </div>
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontWeight: 700, color: '#111827' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{subtitle}</div>
      )}
    </div>
  </button>
);

const ServicesLanding = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '24px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#111827' }}>Emergency Service</h1>
            <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Choose a service to continue</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#000000',
              color: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#1a1a1a';
              e.target.style.borderColor = '#1a1a1a';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#000000';
              e.target.style.borderColor = '#000000';
            }}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <ServiceCard
            icon="🚑"
            title="Ambulance Service"
            subtitle="Request an ambulance immediately"
            primary
            onClick={() => navigate('/emergency/patient')}
          />
        </div>

        <div style={{ marginTop: 24, marginBottom: 12, color: '#374151', fontWeight: 700 }}>Other services</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12
        }}>
          <ServiceCard icon="🧴" title="Oxygen Cylinder" subtitle="Home oxygen delivery" onClick={() => navigate('/emergency/oxygen-cylinder')} />
          <ServiceCard icon="👨‍⚕️" title="Emergency Doctor" subtitle="Instant consultation" onClick={() => {}} />
          <ServiceCard icon="🧑‍⚕️" title="Nurse" subtitle="On-demand nursing" onClick={() => navigate('/emergency/nurse-marketplace')} />
          <ServiceCard icon="🦽" title="Wheelchair" subtitle="Mobility assistance" onClick={() => navigate('/emergency/wheelchair')} />
        </div>
      </div>
    </div>
  );
};

export default ServicesLanding;


