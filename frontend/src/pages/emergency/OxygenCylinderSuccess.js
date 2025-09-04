import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './OxygenCylinderSuccess.css';

const OxygenCylinderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderStatus, setOrderStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { orderId, paymentId, orderData } = location.state || {};

  useEffect(() => {
    if (!orderId || !paymentId || !orderData) {
      navigate('/emergency/oxygen-cylinder');
      return;
    }

    // Simulate order status check
    const checkOrderStatus = async () => {
      try {
        const response = await api.get(`/oxygen-cylinder/order-status/${orderId}`);
        setOrderStatus(response.data.data);
      } catch (error) {
        console.error('Error checking order status:', error);
        // Set default status if API fails
        setOrderStatus({
          status: 'confirmed',
          estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkOrderStatus();
  }, [orderId, paymentId, orderData, navigate]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'processing': return '⏳';
      case 'in-transit': return '🚚';
      case 'delivered': return '🎉';
      default: return '📋';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'confirmed': return 'Your order has been confirmed and is being processed';
      case 'processing': return 'Your order is being prepared for delivery';
      case 'in-transit': return 'Your oxygen cylinder is on its way';
      case 'delivered': return 'Your oxygen cylinder has been delivered';
      default: return 'Order status updated';
    }
  };

  const getEstimatedDeliveryTime = () => {
    if (!orderStatus?.estimatedDelivery) return '2-4 hours';
    
    const now = new Date();
    const delivery = new Date(orderStatus.estimatedDelivery);
    const diffMs = delivery - now;
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours <= 1) return 'Within 1 hour';
    if (diffHours <= 2) return 'Within 2 hours';
    return `${diffHours} hours`;
  };

  if (isLoading) {
    return (
      <div className="success-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Processing your order...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">🎉</div>
          <h1>Payment Successful!</h1>
          <p>Your oxygen cylinder subscription order has been placed successfully</p>
        </div>

        {/* Order Details */}
        <div className="order-details">
          <div className="details-card">
            <h2>Order Details</h2>
            
            <div className="detail-row">
              <span className="label">Order ID:</span>
              <span className="value">#{orderId.slice(-8).toUpperCase()}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Payment ID:</span>
              <span className="value">#{paymentId.slice(-8).toUpperCase()}</span>
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
              <span className="label">Delivery Type:</span>
              <span className="value">{orderData.delivery.name}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Total Amount:</span>
              <span className="value amount">৳{orderData.totalAmount.toLocaleString()}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Order Date:</span>
              <span className="value">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Order Status */}
          <div className="status-card">
            <h2>Order Status</h2>
            
            <div className="status-info">
              <div className="status-icon">
                {getStatusIcon(orderStatus?.status || 'confirmed')}
              </div>
              <div className="status-content">
                <h3>{getStatusMessage(orderStatus?.status || 'confirmed')}</h3>
                <p>
                  {orderData.deliveryType === 'urgent' 
                    ? `Estimated delivery: ${getEstimatedDeliveryTime()}`
                    : `Estimated delivery: ${getEstimatedDeliveryTime()}`
                  }
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
              <div className={`step ${orderStatus?.status === 'confirmed' ? 'active' : ''}`}>
                <div className="step-icon">📋</div>
                <div className="step-content">
                  <h4>Order Confirmed</h4>
                  <p>Your order has been received</p>
                </div>
              </div>
              
              <div className={`step ${orderStatus?.status === 'processing' ? 'active' : ''}`}>
                <div className="step-icon">⏳</div>
                <div className="step-content">
                  <h4>Processing</h4>
                  <p>Preparing your oxygen cylinder</p>
                </div>
              </div>
              
              <div className={`step ${orderStatus?.status === 'in-transit' ? 'active' : ''}`}>
                <div className="step-icon">🚚</div>
                <div className="step-content">
                  <h4>In Transit</h4>
                  <p>On the way to your location</p>
                </div>
              </div>
              
              <div className={`step ${orderStatus?.status === 'delivered' ? 'active' : ''}`}>
                <div className="step-icon">🎉</div>
                <div className="step-content">
                  <h4>Delivered</h4>
                  <p>Successfully delivered</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="info-section">
          <div className="info-card">
            <h3>📞 Contact Information</h3>
            <p>If you have any questions about your order, please contact our customer service:</p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-label">Phone:</span>
                <span className="contact-value">+880 1234 567890</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Email:</span>
                <span className="contact-value">support@weheal.com</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>⚠️ Important Notes</h3>
            <ul>
              <li>Please ensure someone is available at the delivery address</li>
              <li>Keep your phone accessible for delivery updates</li>
              <li>Inspect the oxygen cylinder upon delivery</li>
              <li>Contact us immediately if there are any issues</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/emergency/oxygen-cylinder')}
          >
            Order Another
          </button>
          
          <button 
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>

        {/* Emergency Contact */}
        <div className="emergency-contact">
          <h3>🚨 Emergency Contact</h3>
          <p>For immediate medical emergencies, call:</p>
          <div className="emergency-number">999</div>
        </div>
      </div>
    </div>
  );
};

export default OxygenCylinderSuccess;
