import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './OxygenCylinderPage.css';

const OxygenCylinderPage = () => {
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
      features: [
        '24 hours of uninterrupted usage',
        'Easy delivery and pickup',
        'Emergency support available',
        'Flexible scheduling',
        'No long-term commitment',
        'Perfect for short-term needs'
      ],
      icon: '⏰',
      color: 'blue',
      popular: false
    },
    {
      id: 'weekly',
      name: 'Weekly Subscription',
      duration: '7 Days',
      price: 6160, // 1000 * 7 with 12% off (7000 - 840)
      urgentPrice: 9240, // 1500 * 7 with 12% off (10500 - 1260)
      originalPrice: 7000, // 1000 * 7
      originalUrgentPrice: 10500, // 1500 * 7
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
      price: 22500, // 1000 * 30 with 25% off
      urgentPrice: 33750, // 1500 * 30 with 25% off
      originalPrice: 30000, // 1000 * 30
      originalUrgentPrice: 45000, // 1500 * 30
      discount: 25,
      features: [
        '30 days of uninterrupted service',
        '24/7 customer service for any difficulties',
        'Free delivery and pickup',
        'No hassle for a month',
        'Best value for money',
        'Priority emergency response',
        'Dedicated account manager',
        'Free maintenance and support'
      ],
      icon: '🏆',
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
      const response = await api.get('/oxygen-cylinder/orders');
      setOrderHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedPlan) return 0;
    
    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    const delivery = deliveryOptions.find(d => d.id === deliveryType);
    
    if (!plan || !delivery) return 0;
    
    const basePrice = deliveryType === 'urgent' ? plan.urgentPrice : plan.price;
    return basePrice + delivery.price;
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setDeliveryType(null); // Reset delivery type when plan changes
  };

  const handleDeliverySelect = (deliveryId) => {
    setDeliveryType(deliveryId);
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
      const response = await api.post('/oxygen-cylinder/create-order', orderData);
      
      console.log('Order creation response:', response.data);
      
      if (response.data.success) {
        // Redirect to payment gateway
        console.log('Redirecting to payment with orderId:', response.data.data._id);
        navigate('/oxygen-cylinder/payment', { 
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'in-transit': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return '✅';
      case 'in-transit': return '🚚';
      case 'processing': return '⏳';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="oxygen-cylinder-page">
      {/* Header */}
      <div className="oxygen-header">
        <div className="container">
          <div className="header-layout">
            <div className="header-content">
              <div className="header-icon">🫁</div>
              <h1>Oxygen Cylinder Subscription</h1>
              <p>Reliable oxygen delivery service for your medical needs</p>
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
        <div className="oxygen-content">
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
                    <div className="price-row">
                      <span className="price-label">Standard:</span>
                      <span className="price">
                        ৳{plan.price.toLocaleString()}
                        {plan.discount && (
                          <span className="original-price">৳{plan.originalPrice.toLocaleString()}</span>
                        )}
                      </span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">Urgent:</span>
                      <span className="price">
                        ৳{plan.urgentPrice.toLocaleString()}
                        {plan.discount && (
                          <span className="original-price">৳{plan.originalUrgentPrice.toLocaleString()}</span>
                        )}
                      </span>
                    </div>
                    {plan.discount && (
                      <div className="discount-badge">{plan.discount}% OFF</div>
                    )}
                  </div>

                  <ul className="plan-features">
                    {plan.features.map((feature, index) => (
                      <li key={index}>
                        <span className="feature-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button className="select-plan-btn">
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
                      {option.price > 0 && (
                        <div className="delivery-price">+৳{option.price}</div>
                      )}
                    </div>
                    <div className="delivery-radio">
                      <input 
                        type="radio" 
                        checked={deliveryType === option.id}
                        onChange={() => handleDeliverySelect(option.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          {selectedPlan && deliveryType && (
            <div className="order-summary">
              <div className="section-header">
                <h2>Order Summary</h2>
              </div>

              <div className="summary-card">
                <div className="summary-row">
                  <span>Plan:</span>
                  <span>{subscriptionPlans.find(p => p.id === selectedPlan)?.name}</span>
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
              <div className="history-cards">
                {orderHistory.length === 0 ? (
                  <div className="no-history">
                    <p>No orders found</p>
                  </div>
                ) : (
                  orderHistory.map((order) => (
                    <div key={order._id} className="history-card">
                      <div className="history-header">
                        <div className="history-id">Order #{order.orderId}</div>
                        <div className={`history-status ${getStatusColor(order.status)}`}>
                          <span className="status-icon">{getStatusIcon(order.status)}</span>
                          {order.status}
                        </div>
                      </div>
                      <div className="history-details">
                        <div className="history-row">
                          <span>Plan:</span>
                          <span>{order.plan?.name}</span>
                        </div>
                        <div className="history-row">
                          <span>Delivery:</span>
                          <span>{order.delivery?.name}</span>
                        </div>
                        <div className="history-row">
                          <span>Amount:</span>
                          <span>৳{order.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="history-row">
                          <span>Order Date:</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        {order.deliveredAt && (
                          <div className="history-row">
                            <span>Delivered:</span>
                            <span>{new Date(order.deliveredAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OxygenCylinderPage;
