// src/pages/ResetPassword.js
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../utils/api'; // Assuming resetPassword API method is implemented
import '../styles/Auth.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useParams(); // Grab the token from the URL using useParams
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') setPassword(value);
    if (name === 'confirmPassword') setConfirmPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setMessage('Password should be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Send the reset token and the new password to the backend
      const response = await resetPassword(token, password); // Correct API call with token and new password
      if (response.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login'); // Redirect to login after successful reset
        }, 2000);
      } else {
        setMessage(response.message || 'Failed to reset password');
      }
    } catch (error) {
      setMessage('Error resetting password. Please try again later.');
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
            <h2>Set New Password</h2>
          </div>
        </div>

        {/* Separator */}
        <hr className="separator" />
        <div className="separator-text">Enter your new password below</div>

        {/* Form section */}
        <div className="auth-form-section">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="New Password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="text-center mt-6">
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
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
          <p className={`message ${message.includes("success") ? "success" : "error"}`}>
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

export default ResetPassword;
