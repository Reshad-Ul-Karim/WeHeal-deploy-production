import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../../services/marketplaceAPI';
import DashboardButton from '../../components/DashboardButton';
import '../../styles/marketplace.css';

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await cartAPI.getCart();
      
      if (response.success) {
        setCart(response.data);
      } else {
        setError('Failed to fetch cart');
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Error loading cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity, labOption = null) => {
    if (newQuantity < 1) return;

    try {
      const itemKey = `${productId}-${labOption ? labOption.labName : 'no-lab'}`;
      setUpdating(prev => ({ ...prev, [itemKey]: true }));
      
      const response = await cartAPI.updateCartItem(productId, newQuantity, labOption);
      
      if (response.success) {
        setCart(response.data);
      } else {
        setError(response.message || 'Failed to update cart');
      }
    } catch (err) {
      console.error('Error updating cart:', err);
      setError('Error updating cart. Please try again.');
    } finally {
      const itemKey = `${productId}-${labOption ? labOption.labName : 'no-lab'}`;
      setUpdating(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const removeItem = async (productId, labOption = null) => {
    try {
      const itemKey = `${productId}-${labOption ? labOption.labName : 'no-lab'}`;
      setUpdating(prev => ({ ...prev, [itemKey]: true }));
      
      const response = await cartAPI.removeFromCart(productId, labOption);
      
      if (response.success) {
        setCart(response.data);
      } else {
        setError(response.message || 'Failed to remove item');
      }
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Error removing item. Please try again.');
    } finally {
      const itemKey = `${productId}-${labOption ? labOption.labName : 'no-lab'}`;
      setUpdating(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;

    try {
      setLoading(true);
      
      const response = await cartAPI.clearCart();
      
      if (response.success) {
        setCart(response.data);
      } else {
        setError(response.message || 'Failed to clear cart');
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Error clearing cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--mk-page-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--mk-page-bg)'
    }}>
      {/* Dashboard Button */}
      <DashboardButton userRole="Patient" />
      {/* Enhanced Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '3rem 0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            marginBottom: '0.5rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            🛒 Shopping Cart
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            opacity: '0.9',
            fontWeight: '400'
          }}>
            Review your items and proceed to checkout
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #f87171',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 15px rgba(248, 113, 113, 0.2)'
          }}>
            <div style={{ color: '#dc2626', fontWeight: '500', fontSize: '1rem' }}>{error}</div>
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '2rem',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>🛒</div>
            <div style={{ 
              color: '#6b7280', 
              fontSize: '1.5rem', 
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Your cart is empty
            </div>
            <p style={{ 
              color: '#9ca3af',
              fontSize: '1.1rem',
              marginBottom: '2.5rem',
              lineHeight: '1.6'
            }}>
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '1rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
              }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Enhanced Cart Items */}
            <div className="lg:col-span-8">
              <div style={{
                background: 'white',
                borderRadius: '1.5rem',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderBottom: '2px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    🛍️ Items ({cart.items.length})
                  </h2>
                  {cart.items.length > 0 && (
                    <button
                      onClick={clearCart}
                      style={{
                        fontSize: '0.9rem',
                        color: '#dc2626',
                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        border: '1px solid #f87171',
                        borderRadius: '0.75rem',
                        padding: '0.5rem 1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#dc2626';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                        e.target.style.color = '#dc2626';
                      }}
                    >
                      Clear Cart
                    </button>
                  )}
                </div>

                <div>
                  {cart.items.map((item, index) => (
                    <div 
                      key={`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`} 
                      style={{
                        padding: '2rem',
                        borderBottom: index < cart.items.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                        {/* Enhanced Product Image */}
                        <div style={{ flexShrink: 0 }}>
                          <img
                            src={item.productId.image ? `http://localhost:5001${item.productId.image}` : '/placeholder-product.png'}
                            alt={item.productId.name}
                            style={{
                              height: '100px',
                              width: '100px',
                              borderRadius: '1rem',
                              objectFit: 'cover',
                              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                              border: '2px solid #e5e7eb'
                            }}
                            onError={(e) => {
                              e.target.src = '/placeholder-product.png';
                            }}
                          />
                        </div>

                        {/* Enhanced Product Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                              <h3 style={{
                                fontSize: '1.3rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '0.5rem',
                                lineHeight: '1.4'
                              }}>
                                {item.productId.name}
                              </h3>
                              <div style={{
                                display: 'inline-block',
                                background: item.productId.category === 'medicine' 
                                  ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                  : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '1rem',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                marginBottom: '0.75rem'
                              }}>
                                {item.productId.category === 'medicine' ? '💊 Medicine' : '🧪 Lab Test'}
                              </div>
                              <p style={{
                                fontSize: '0.95rem',
                                color: '#6b7280',
                                lineHeight: '1.5',
                                marginBottom: '1rem'
                              }}>
                                {item.productId.description}
                              </p>
                              
                              {/* Display selected lab option for lab test products */}
                              {item.productId.category === 'lab-test' && item.labOption && (
                                <div style={{
                                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                  border: '1px solid #93c5fd',
                                  borderRadius: '0.5rem',
                                  padding: '0.75rem',
                                  marginBottom: '1rem'
                                }}>
                                  <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: '#1e40af',
                                    marginBottom: '0.25rem'
                                  }}>
                                    🏥 Selected Lab:
                                  </div>
                                  <div style={{
                                    fontSize: '0.85rem',
                                    color: '#1e3a8a'
                                  }}>
                                    {item.labOption.labName} - ₹{item.labOption.price}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div className="gradient-text-price" style={{
                                fontSize: '1.4rem',
                                fontWeight: '700',
                                marginBottom: '0.25rem'
                              }}>
                                ₹{item.price}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>per item</div>
                            </div>
                          </div>

                          {/* Enhanced Quantity Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <label style={{
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                color: '#374151'
                              }}>
                                Quantity:
                              </label>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                border: '2px solid #e5e7eb',
                                borderRadius: '0.75rem',
                                overflow: 'hidden',
                                background: 'white',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId._id, item.quantity - 1, item.labOption)}
                                  disabled={item.quantity <= 1 || updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`]}
                                  style={{
                                    padding: '0.5rem 0.75rem',
                                    background: item.quantity <= 1 || updating[item.productId._id] 
                                      ? '#f3f4f6' 
                                      : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                                    color: item.quantity <= 1 || updating[item.productId._id] ? '#9ca3af' : 'white',
                                    border: 'none',
                                    cursor: item.quantity <= 1 || updating[item.productId._id] ? 'not-allowed' : 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  -
                                </button>
                                <span style={{
                                  padding: '0.5rem 1rem',
                                  borderLeft: '1px solid #e5e7eb',
                                  borderRight: '1px solid #e5e7eb',
                                  minWidth: '3rem',
                                  textAlign: 'center',
                                  background: '#f8fafc',
                                  fontSize: '0.95rem',
                                  fontWeight: '600',
                                  color: '#374151'
                                }}>
                                  {updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`] ? '...' : item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId._id, item.quantity + 1, item.labOption)}
                                  disabled={item.quantity >= item.productId.stock || updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`]}
                                  style={{
                                    padding: '0.5rem 0.75rem',
                                    background: item.quantity >= item.productId.stock || updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`]
                                      ? '#f3f4f6'
                                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: item.quantity >= item.productId.stock || updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`] ? '#9ca3af' : 'white',
                                    border: 'none',
                                    cursor: item.quantity >= item.productId.stock || updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`] ? 'not-allowed' : 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  +
                                </button>
                              </div>
                              <div className="gradient-text-price" style={{
                                fontSize: '0.9rem',
                                color: '#6b7280',
                                fontWeight: '500'
                              }}>
                                (₹{(item.price * item.quantity).toFixed(2)} total)
                              </div>
                            </div>

                            {/* Enhanced Remove Button */}
                            <button
                              onClick={() => removeItem(item.productId._id, item.labOption)}
                              disabled={updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`]}
                              style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.5rem 1rem',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`] ? 'not-allowed' : 'pointer',
                                opacity: updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`] ? 0.5 : 1,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              onMouseEnter={(e) => {
                                if (!updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`]) {
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                              }}
                            >
                              🗑️ {updating[`${item.productId._id}-${item.labOption ? item.labOption.labName : 'no-lab'}`] ? 'Removing...' : 'Remove'}
                            </button>
                          </div>

                          {/* Enhanced Stock Warning */}
                          {item.quantity >= item.productId.stock && (
                            <div style={{
                              marginTop: '1rem',
                              padding: '0.75rem',
                              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                              color: 'white',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              borderRadius: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              ⚠️ Only {item.productId.stock} items available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Order Summary */}
            <div style={{ gridColumn: 'lg:span-4 / span-4', marginTop: '2rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                padding: '2rem',
                position: 'sticky',
                top: '1rem',
                border: '1px solid #e5e7eb'
              }}>
                <h2 className="gradient-text" style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🛒 Order Summary
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.95rem', color: '#6b7280', fontWeight: '500' }}>Subtotal</span>
                    <span style={{ fontSize: '1.1rem', color: '#374151', fontWeight: '600' }}>₹{cart.totalAmount.toFixed(2)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    borderRadius: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.95rem', color: '#059669', fontWeight: '500' }}>Shipping</span>
                    <span style={{ fontSize: '1.1rem', color: '#059669', fontWeight: '600' }}>🚚 Free</span>
                  </div>
                  <div style={{
                    borderTop: '2px solid #e5e7eb',
                    paddingTop: '1rem',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '0.75rem',
                      color: 'white'
                    }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>Total</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: '800' }}>₹{cart.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    marginTop: '1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  💳 Proceed to Checkout
                </button>

                <button
                  onClick={() => navigate('/marketplace')}
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    color: '#374151',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    border: '2px solid #d1d5db',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  🛍️ Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
