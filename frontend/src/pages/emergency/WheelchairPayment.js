import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { orderAPI } from '../../services/marketplaceAPI';
import PaymentGateway from '../../components/payments/PaymentGateway';
import './WheelchairPayment.css';

const WheelchairPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const { orderData: data, orderId: id } = location.state || {};
    if (!data || !id) {
      navigate('/emergency/wheelchair');
    } else {
      setOrderData(data);
      setOrderId(id);
      setShowPaymentGateway(true);
    }
  }, [location.state, navigate]);

  const handlePaymentSuccess = async (paymentData) => {
    try {
      console.log('Payment successful, creating order (marketplace approach):', paymentData);
      
      // Use the EXACT same approach as marketplace - create order after payment
      const orderPayload = {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentType: 'wheelchair',
        transactionId: paymentData.transactionId,
        items: [{
          type: 'wheelchair',
          productId: orderData.productId || 'wheelchair',
          name: orderData.name || 'Wheelchair',
          description: orderData.description || 'Emergency wheelchair rental',
          quantity: orderData.quantity || 1,
          price: orderData.price || paymentData.amount,
          rentalDuration: orderData.rentalDuration,
          deliveryAddress: orderData.deliveryAddress,
          deliveryTime: orderData.deliveryTime
        }],
        customerInfo: {
          name: orderData.customerName || 'Emergency Patient',
          phone: orderData.customerPhone || 'Emergency Contact',
          email: orderData.customerEmail
        },
        deliveryInfo: {
          address: orderData.deliveryAddress,
          type: 'emergency_delivery'
        }
      };
      
      console.log('Creating order after payment (marketplace approach):', orderPayload);
      const response = await orderAPI.createOrderAfterPayment(orderPayload);
      
      if (response.success) {
        // Navigate to orders page
        navigate('/orders', {
          state: {
            orderCreated: true,
            orderId: response.data.orderId
          }
        });
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      alert('Order creation failed. Please contact support.');
    }
  };

  const handlePaymentClose = () => {
    setShowPaymentGateway(false);
    navigate('/emergency/wheelchair');
  };

  if (!orderData || !orderId) {
    return (
      <div className="payment-page">
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
    <div className="payment-page">
      <div className="container">
        {/* Header */}
        <div className="payment-header">
          <button 
            onClick={() => navigate('/emergency/wheelchair')}
            className="back-button"
          >
            ← Back to Order
          </button>
          <h1>Complete Your Payment</h1>
          <p>Secure payment for your wheelchair subscription</p>
        </div>

        <div className="payment-content">
          {/* Order Summary */}
          <div className="order-summary-section">
            <h2>Order Summary</h2>
            <div className="summary-card">
              <div className="summary-row">
                <span>Plan:</span>
                <span>{orderData.plan.name}</span>
              </div>
              <div className="summary-row">
                <span>Duration:</span>
                <span>{orderData.plan.duration}</span>
              </div>
              <div className="summary-row">
                <span>Delivery:</span>
                <span>{orderData.delivery.name}</span>
              </div>
              <div className="summary-row">
                <span>Base Price:</span>
                <span>৳{(orderData.deliveryType === 'urgent' ? 
                  orderData.plan.urgentPrice : 
                  orderData.plan.price
                ).toLocaleString()}</span>
              </div>
              {orderData.delivery.price > 0 && (
                <div className="summary-row">
                  <span>Delivery Fee:</span>
                  <span>৳{orderData.delivery.price}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>৳{orderData.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Gateway */}
          {showPaymentGateway && (
            <PaymentGateway
              open={showPaymentGateway}
              onClose={handlePaymentClose}
              amount={orderData.totalAmount}
              paymentType="wheelchair"
              orderId={orderId}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WheelchairPayment;