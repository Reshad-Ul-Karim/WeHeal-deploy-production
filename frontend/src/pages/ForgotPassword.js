// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../utils/api'; // Assuming forgotPassword API method is implemented
import '../styles/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(email);
      if (response.success) {
        setMessage('Password reset link has been sent to your email.');
      } else {
        setMessage(response.message || 'Failed to send password reset email');
      }
    } catch (error) {
      setMessage('Error sending password reset email. Please try again later.');
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
            <h2>Reset Your Password</h2>
          </div>
        </div>

        {/* Separator */}
        <hr className="separator" />
        <div className="separator-text">Enter your email to reset password</div>

        {/* Form section */}
        <div className="auth-form-section">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>

            <div className="text-center mt-6">
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom links */}
      <div className="flex flex-wrap mt-6 relative" style={{ maxWidth: '400px', margin: '24px auto 0 auto' }}>
        <div style={{ width: '100%', textAlign: 'center' }}>
          <span style={{ color: 'var(--blue-gray-200)' }}>Remember your password? </span>
          <Link to="/login" style={{ color: 'var(--blue-gray-200)' }}>
            <small>Sign in</small>
          </Link>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{ marginTop: '16px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
          <p className={`message ${message.includes("sent") ? "success" : "error"}`}>
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

export default ForgotPassword;

