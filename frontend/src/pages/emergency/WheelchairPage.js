import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './WheelchairPage.css';

const WheelchairPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deliveryType, setDeliveryType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const subscriptionPlans = [
    {
      id: 'daily',
      name: 'Daily Subscription',
      duration: '24 Hours',
      price: 1000,
      urgentPrice: 1500,
      originalPrice: 1000,
      originalUrgentPrice: 1500,
      discount: 0,
      features: [
        '24 hours of uninterrupted usage',
        'Easy delivery and pickup',
        'Perfect for short-term needs',
        'Same-day delivery available',
        'Professional wheelchair maintenance',
        'Emergency replacement service',
        '24/7 customer support'
      ],
      icon: '🦽',
      color: 'blue',
      popular: false
    },
    {
      id: 'weekly',
      name: 'Weekly Subscription',
      duration: '7 Days',
      price: 6160,
      urgentPrice: 9240,
      originalPrice: 7000,
      originalUrgentPrice: 10500,
      discount: 12,
      features: [
        '7 days of uninterrupted service',
        'Budget-friendly option',
        'Easy delivery and pickup',
        'Less hassle - order once for the week',
        'Suitable for sudden accidents or injuries',
        'Priority customer support',
        'Flexible delivery scheduling'
      ],
      icon: '📅',
      color: 'green',
      popular: true
    },
    {
      id: 'monthly',
      name: 'Monthly Subscription',
      duration: '30 Days',
      price: 22500,
      urgentPrice: 33750,
      originalPrice: 30000,
      originalUrgentPrice: 45000,
      discount: 25,
      features: [
        '30 days of uninterrupted service',
        '24/7 customer service for any difficulties',
        'Free delivery and pickup',
        'No hassle for a month',
        'Best value for money',
        'Priority maintenance service',
        'Emergency replacement guarantee',
        'Flexible scheduling options'
      ],
      icon: '📆',
      color: 'purple',
      popular: false
    }
  ];

  const deliveryOptions = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      description: 'Regular delivery within 2-4 hours',
      price: 0,
      icon: '🚚'
    },
    {
      id: 'urgent',
      name: 'Urgent Delivery',
      description: 'Express delivery within 30-60 minutes',
      price: 500,
      icon: '⚡'
    }
  ];

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      const response = await api.get('/wheelchair/orders');
      if (response.data.success) {
        setOrderHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    }
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setDeliveryType(null); // Reset delivery type when plan changes
  };

  const handleDeliverySelect = (deliveryId) => {
    setDeliveryType(deliveryId);
  };

  const calculateTotalPrice = () => {
    if (!selectedPlan || !deliveryType) return 0;
    
    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    const delivery = deliveryOptions.find(d => d.id === deliveryType);
    
    if (!plan || !delivery) return 0;
    
    const basePrice = deliveryType === 'urgent' ? plan.urgentPrice : plan.price;
    return basePrice + delivery.price;
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan || !deliveryType) {
      alert('Please select both a subscription plan and delivery option');
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        planId: selectedPlan,
        deliveryType: deliveryType,
        totalAmount: calculateTotalPrice(),
        plan: subscriptionPlans.find(p => p.id === selectedPlan),
        delivery: deliveryOptions.find(d => d.id === deliveryType)
      };

      console.log('Creating order with data:', orderData);

      // Create order
      const response = await api.post('/wheelchair/create-order', orderData);
      
      console.log('Order creation response:', response.data);
      
      if (response.data.success) {
        // Redirect to payment gateway
        console.log('Redirecting to payment with orderId:', response.data.data._id);
        navigate('/wheelchair/payment', { 
          state: { 
            orderId: response.data.data._id,
            orderData: orderData
          } 
        });
      } else {
        alert('Failed to create order: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to create order. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to continue.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="wheelchair-page">
      {/* Header */}
      <div className="wheelchair-header">
        <div className="container">
          <div className="header-layout">
            <div className="header-content">
              <div className="header-icon">🦽</div>
              <h1>Wheelchair Subscription</h1>
              <p>Reliable wheelchair rental service for your mobility needs</p>
            </div>
            <button 
              onClick={() => navigate('/emergency')}
              className="back-button"
            >
              <span>←</span> Back
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="wheelchair-content">
          {/* Subscription Plans */}
          <div className="plans-section">
            <div className="section-header">
              <h2>Choose Your Subscription Plan</h2>
              <p>Select the plan that best fits your needs</p>
            </div>

            <div className="plans-grid">
              {subscriptionPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`plan-card ${plan.color} ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && <div className="popular-badge">Most Popular</div>}
                  
                  <div className="plan-icon">{plan.icon}</div>
                  <h3>{plan.name}</h3>
                  <div className="plan-duration">{plan.duration}</div>
                  
                  <div className="plan-pricing">
                    <div className="price-label">Standard Delivery</div>
                    <div className="price">৳{plan.price.toLocaleString()}</div>
                    {plan.discount > 0 && (
                      <>
                        <div className="original-price">৳{plan.originalPrice.toLocaleString()}</div>
                        <div className="discount-badge">-{plan.discount}% OFF</div>
                      </>
                    )}
                  </div>

                  <div className="plan-pricing urgent">
                    <div className="price-label">Urgent Delivery</div>
                    <div className="price">৳{plan.urgentPrice.toLocaleString()}</div>
                    {plan.discount > 0 && (
                      <>
                        <div className="original-price">৳{plan.originalUrgentPrice.toLocaleString()}</div>
                        <div className="discount-badge">-{plan.discount}% OFF</div>
                      </>
                    )}
                  </div>

                  <div className="plan-features">
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index}>
                          <span className="feature-icon">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    className={`select-plan-btn ${selectedPlan === plan.id ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelect(plan.id);
                    }}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Options */}
          {selectedPlan && (
            <div className="delivery-section">
              <div className="section-header">
                <h2>Choose Delivery Option</h2>
                <p>Select your preferred delivery method</p>
              </div>

              <div className="delivery-options">
                {deliveryOptions.map((option) => (
                  <div 
                    key={option.id}
                    className={`delivery-card ${deliveryType === option.id ? 'selected' : ''}`}
                    onClick={() => handleDeliverySelect(option.id)}
                  >
                    <div className="delivery-icon">{option.icon}</div>
                    <div className="delivery-content">
                      <h3>{option.name}</h3>
                      <p>{option.description}</p>
                      <div className="delivery-price">
                        {option.price > 0 ? `+৳${option.price}` : 'Free'}
                      </div>
                    </div>
                    <div className="delivery-radio">
                      <input 
                        type="radio" 
                        name="delivery" 
                        value={option.id}
                        checked={deliveryType === option.id}
                        onChange={() => handleDeliverySelect(option.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary & Payment */}
          {selectedPlan && deliveryType && (
            <div className="order-summary-section">
              <div className="section-header">
                <h2>Order Summary</h2>
                <p>Review your order before proceeding to payment</p>
              </div>

              <div className="order-summary-card">
                <div className="summary-row">
                  <span>Plan:</span>
                  <span>{subscriptionPlans.find(p => p.id === selectedPlan)?.name}</span>
                </div>
                <div className="summary-row">
                  <span>Duration:</span>
                  <span>{subscriptionPlans.find(p => p.id === selectedPlan)?.duration}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery:</span>
                  <span>{deliveryOptions.find(d => d.id === deliveryType)?.name}</span>
                </div>
                <div className="summary-row">
                  <span>Base Price:</span>
                  <span>৳{(deliveryType === 'urgent' ? 
                    subscriptionPlans.find(p => p.id === selectedPlan)?.urgentPrice : 
                    subscriptionPlans.find(p => p.id === selectedPlan)?.price
                  ).toLocaleString()}</span>
                </div>
                {deliveryOptions.find(d => d.id === deliveryType)?.price > 0 && (
                  <div className="summary-row">
                    <span>Delivery Fee:</span>
                    <span>৳{deliveryOptions.find(d => d.id === deliveryType)?.price}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>৳{calculateTotalPrice().toLocaleString()}</span>
                </div>
              </div>

              <button 
                className="proceed-payment-btn"
                onClick={handleProceedToPayment}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          )}

          {/* Order History */}
          <div className="history-section">
            <div className="section-header">
              <h2>Order History</h2>
              <button 
                className="toggle-history-btn"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
            </div>

            {showHistory && (
              <div className="history-content">
                {orderHistory.length === 0 ? (
                  <div className="no-orders">
                    <p>No orders found. Create your first wheelchair subscription!</p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orderHistory.map((order) => (
                      <div key={order._id} className="order-item">
                        <div className="order-header">
                          <div className="order-id">Order #{order.orderId}</div>
                          <div className={`order-status ${order.status}`}>
                            {getStatusIcon(order.status)} {order.status}
                          </div>
                        </div>
                        <div className="order-details">
                          <div className="order-info">
                            <span><strong>Plan:</strong> {order.plan.name}</span>
                            <span><strong>Delivery:</strong> {order.delivery.name}</span>
                            <span><strong>Amount:</strong> ৳{order.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="order-date">
                            Ordered: {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelchairPage;
