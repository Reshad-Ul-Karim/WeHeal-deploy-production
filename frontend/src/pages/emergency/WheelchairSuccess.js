import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './WheelchairSuccess.css';

const WheelchairSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, paymentId, orderData, paymentMethod } = location.state || {};

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'processing': return '🔄';
      case 'in-transit': return '🚚';
      case 'delivered': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  if (!orderData || !orderId) {
    return (
      <div className="success-page">
        <div className="container">
          <div className="error-message">
            <h2>Invalid Order</h2>
            <p>Please go back and create a new order.</p>
            <button onClick={() => navigate('/emergency/wheelchair')}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="container">
        {/* Header */}
        <div className="success-header">
          <div className="success-icon">🎉</div>
          <h1>Payment Successful!</h1>
          <p>Your wheelchair subscription order has been confirmed</p>
        </div>

        {/* Order Details */}
        <div className="order-details-section">
          <h2>Order Details</h2>
          <div className="order-details-card">
            <div className="detail-row">
              <span className="label">Order ID:</span>
              <span className="value">{orderId}</span>
            </div>
            <div className="detail-row">
              <span className="label">Payment ID:</span>
              <span className="value">{paymentId}</span>
            </div>
            <div className="detail-row">
              <span className="label">Plan:</span>
              <span className="value">{orderData.plan.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Duration:</span>
              <span className="value">{orderData.plan.duration}</span>
            </div>
            <div className="detail-row">
              <span className="label">Delivery:</span>
              <span className="value">{orderData.delivery.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Payment Method:</span>
              <span className="value">{paymentMethod}</span>
            </div>
            <div className="detail-row total">
              <span className="label">Total Amount:</span>
              <span className="value">৳{orderData.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tracking Steps */}
        <div className="tracking-section">
          <h2>Order Tracking</h2>
          <div className="tracking-steps">
            <div className="tracking-step completed">
              <div className="step-icon">✅</div>
              <div className="step-content">
                <h3>Order Confirmed</h3>
                <p>Your order has been received and confirmed</p>
                <span className="step-time">Just now</span>
              </div>
            </div>
            <div className="tracking-step pending">
              <div className="step-icon">🔄</div>
              <div className="step-content">
                <h3>Processing</h3>
                <p>We're preparing your wheelchair for delivery</p>
                <span className="step-time">Within 1 hour</span>
              </div>
            </div>
            <div className="tracking-step pending">
              <div className="step-icon">🚚</div>
              <div className="step-content">
                <h3>Out for Delivery</h3>
                <p>Your wheelchair is on its way to you</p>
                <span className="step-time">
                  {orderData.deliveryType === 'urgent' ? 'Within 30-60 minutes' : 'Within 2-4 hours'}
                </span>
              </div>
            </div>
            <div className="tracking-step pending">
              <div className="step-icon">🎉</div>
              <div className="step-content">
                <h3>Delivered</h3>
                <p>Your wheelchair has been delivered successfully</p>
                <span className="step-time">Estimated delivery time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-section">
          <h2>Need Help?</h2>
          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-icon">📞</div>
              <div className="contact-content">
                <h3>Call Us</h3>
                <p>+880 1308 538 775</p>
                <span>Available 24/7</span>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-icon">💬</div>
              <div className="contact-content">
                <h3>Live Chat</h3>
                <p>Chat with our support team</p>
                <span>Available 24/7</span>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-icon">📧</div>
              <div className="contact-content">
                <h3>Email Us</h3>
                <p>support@weheal.com</p>
                <span>Response within 2 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => navigate('/emergency/wheelchair')}
          >
            Order Another Wheelchair
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default WheelchairSuccess;
