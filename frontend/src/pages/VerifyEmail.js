// src/pages/VerifyEmail.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importing useNavigate for redirection and Link for navigation
import { verifyEmail } from '../utils/api'; // Assuming verifyEmail API method is implemented
import '../styles/Auth.css';

const VerifyEmail = () => {
  const navigate = useNavigate();  // Hook for programmatic navigation
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code) {
      setMessage('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyEmail(code);
      if (response.success) {
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login'); // Redirect to the login page after email is verified
        }, 2000); // Wait for 2 seconds before redirecting
      } else {
        setMessage(response.message || 'Invalid or expired verification code');
      }
    } catch (error) {
      setMessage('Error verifying email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Header */}
      <div className="auth-header">
        <div className="auth-header-left">
          <h1>WEHEAL</h1>
          <a href="#" className="docs-link">
            📄 DOCS
          </a>
        </div>
        <div className="auth-header-right">
          <span className="demo-pages">DEMO PAGES</span>
          <div className="social-icons">
            <a href="#" className="social-icon">f</a>
            <a href="#" className="social-icon">🐦</a>
            <a href="#" className="social-icon">🐙</a>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="auth-form-container">
        {/* Top section */}
        <div className="auth-form-top">
          <div className="text-center mb-3">
            <h2>Verify Your Email</h2>
          </div>
        </div>

        {/* Separator */}
        <hr className="separator" />
        <div className="separator-text">Enter verification code sent to your email</div>

        {/* Form section */}
        <div className="auth-form-section">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="code">Verification Code</label>
              <input
                type="text"
                id="code"
                name="code"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={handleCodeChange}
                required
                maxLength="6"
                className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                style={{ 
                  letterSpacing: '0.3em', 
                  textAlign: 'center', 
                  fontSize: '1.4rem', 
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  border: '2px solid #e2e8f0',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
                }}
              />
            </div>
            
            <div className="text-center mt-6">
              <button 
                type="submit" 
                disabled={isLoading}
                className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify Email'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom links */}
      <div className="flex flex-wrap mt-6 relative" style={{ maxWidth: '400px', margin: '24px auto 0 auto' }}>
        <div style={{ width: '50%' }}>
          <Link to="/login" style={{ color: 'var(--blue-gray-200)' }}>
            <small>Back to Login</small>
          </Link>
        </div>
        <div style={{ width: '50%', textAlign: 'right' }}>
          <Link to="/" style={{ color: 'var(--blue-gray-200)' }}>
            <small>Create Account</small>
          </Link>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{ marginTop: '16px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
          <p className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="auth-footer">
        <div className="auth-footer-left">
          <span>Copyright © 2025 Creative Tim Distributed by <strong>ThemeWagon</strong>.</span>
        </div>
        <div className="auth-footer-right">
          <a href="#">Creative Tim</a>
          <a href="#">About Us</a>
          <a href="#">Blog</a>
          <a href="#">MIT License</a>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
