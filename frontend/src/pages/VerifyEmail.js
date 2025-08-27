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
                placeholder="Enter verification code"
                value={code}
                onChange={handleCodeChange}
                required
                style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.2rem', fontWeight: '600' }}
              />
            </div>
            
            <div className="text-center mt-6">
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify Email'}
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
