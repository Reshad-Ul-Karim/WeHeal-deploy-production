import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../../services/marketplaceAPI';
import { useCart } from '../../contexts/CartContext';
import DashboardButton from '../../components/DashboardButton';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedLabOption, setSelectedLabOption] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await marketplaceAPI.getProduct(id);
      
      if (response.success) {
        setProduct(response.data);
        // Don't auto-select first lab option - let user choose
        setSelectedLabOption(null);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Error loading product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    // Validate lab selection for lab tests
    if (product.category === 'lab-test' && (!selectedLabOption || !product.labOptions || product.labOptions.length === 0)) {
      setCartMessage('Please select a lab option before adding to cart');
      return;
    }

    try {
      setAddingToCart(true);
      setCartMessage('');
      
      // Prepare lab option data for lab tests
      let labOptionData = null;
      if (product.category === 'lab-test' && selectedLabOption) {
        labOptionData = {
          labName: selectedLabOption.labName,
          price: selectedLabOption.price
        };
      }
      
      const result = await addToCart(product._id, quantity, labOptionData);
      
      if (result.success) {
        setCartMessage('Product added to cart successfully!');
        setTimeout(() => setCartMessage(''), 3000);
      } else {
        setCartMessage(result.message || 'Failed to add product to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setCartMessage('Error adding product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 999)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1rem',
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading product details...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{error || 'Product not found'}</div>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Dashboard and Cart Buttons */}
      <DashboardButton userRole="Patient" />

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem 0',
        marginBottom: '2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ← Back
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <span style={{
              background: product.category === 'medicine' 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '2rem',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {product.category === 'medicine' ? '💊 Medicine' : '🧪 Lab Test'}
            </span>
          </div>
          
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {product.name}
          </h1>
          
          <p style={{
            fontSize: '1.1rem',
            opacity: '0.9',
            maxWidth: '600px'
          }}>
            {product.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          alignItems: 'start'
        }}>
          {/* Product Image */}
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            position: 'sticky',
            top: '2rem'
          }}>
            <img
              src={product.image ? `https://weheal-backend.onrender.com${product.image}` : '/placeholder-product.png'}
              alt={product.name}
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover',
                borderRadius: '1rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
              }}
              onError={(e) => {
                e.target.src = '/placeholder-product.png';
              }}
            />
          </div>

          {/* Product Details */}
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Price Section */}
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '1rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#64748b'
                }}>
                  Price
                </span>
                <span style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#059669'
                }}>
                  ₹{selectedLabOption ? selectedLabOption.price : product.price}
                </span>
              </div>
              
              {product.category === 'medicine' && (
                <div style={{
                  fontSize: '0.9rem',
                  color: product.stock > 0 ? '#059669' : '#dc2626',
                  fontWeight: '500'
                }}>
                  {product.stock > 0 ? `${product.stock} items in stock` : 'Out of stock'}
                </div>
              )}
            </div>

            {/* Lab Options Section */}
            {product.category === 'lab-test' && product.labOptions && product.labOptions.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '1rem'
                }}>
                  Select Lab Center
                </h3>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {product.labOptions.map((option, index) => (
                    <label
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        border: selectedLabOption && selectedLabOption.labName === option.labName
                          ? '2px solid #3b82f6'
                          : '2px solid #e2e8f0',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: selectedLabOption && selectedLabOption.labName === option.labName
                          ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                          : 'white'
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedLabOption || selectedLabOption.labName !== option.labName) {
                          e.target.style.borderColor = '#93c5fd';
                          e.target.style.background = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedLabOption || selectedLabOption.labName !== option.labName) {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.background = 'white';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="labOption"
                        value={index}
                        checked={selectedLabOption && selectedLabOption.labName === option.labName}
                        onChange={() => setSelectedLabOption(option)}
                        style={{
                          marginRight: '1rem',
                          width: '1.2rem',
                          height: '1.2rem',
                          accentColor: '#3b82f6'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '0.25rem'
                        }}>
                          {option.labName}
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#64748b'
                        }}>
                          Professional lab testing services
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: '#059669'
                      }}>
                        ₹{option.price}
                      </div>
                    </label>
                  ))}
                </div>

                {selectedLabOption && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    border: '1px solid #a7f3d0',
                    borderRadius: '0.75rem'
                  }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#065f46',
                      marginBottom: '0.25rem'
                    }}>
                      ✅ Selected Lab Center
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#047857'
                    }}>
                      {selectedLabOption.labName} - ₹{selectedLabOption.price}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Product Information
              </h3>
              
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {product.category === 'medicine' && (
                  <>
                    {product.manufacturer && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem'
                      }}>
                        <span style={{ fontWeight: '500', color: '#64748b' }}>Manufacturer</span>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{product.manufacturer}</span>
                      </div>
                    )}
                    {product.dosage && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem'
                      }}>
                        <span style={{ fontWeight: '500', color: '#64748b' }}>Dosage</span>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{product.dosage}</span>
                      </div>
                    )}
                    {product.prescriptionRequired && (
                      <div style={{
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #f59e0b',
                        borderRadius: '0.5rem',
                        color: '#92400e',
                        fontWeight: '600'
                      }}>
                        ⚠️ Prescription Required
                      </div>
                    )}
                  </>
                )}

                {product.category === 'lab-test' && (
                  <>
                    {product.testType && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem'
                      }}>
                        <span style={{ fontWeight: '500', color: '#64748b' }}>Test Type</span>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{product.testType}</span>
                      </div>
                    )}
                    {product.sampleType && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem'
                      }}>
                        <span style={{ fontWeight: '500', color: '#64748b' }}>Sample Type</span>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{product.sampleType}</span>
                      </div>
                    )}
                    {product.reportDeliveryTime && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem'
                      }}>
                        <span style={{ fontWeight: '500', color: '#64748b' }}>Report Delivery</span>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{product.reportDeliveryTime}</span>
                      </div>
                    )}
                    {product.preparationInstructions && (
                      <div style={{
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '1px solid #93c5fd',
                        borderRadius: '0.5rem'
                      }}>
                        <div style={{
                          fontWeight: '600',
                          color: '#1e40af',
                          marginBottom: '0.5rem'
                        }}>
                          📋 Preparation Instructions
                        </div>
                        <div style={{
                          color: '#1e3a8a',
                          lineHeight: '1.5'
                        }}>
                          {product.preparationInstructions}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Add to Cart Section */}
            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '2rem'
            }}>
              {/* Quantity Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Quantity
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  overflow: 'hidden'
                }}>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    style={{
                      padding: '0.75rem 1rem',
                      background: quantity <= 1 ? '#f1f5f9' : '#3b82f6',
                      color: quantity <= 1 ? '#94a3b8' : 'white',
                      border: 'none',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (quantity > 1) {
                        e.target.style.background = '#2563eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (quantity > 1) {
                        e.target.style.background = '#3b82f6';
                      }
                    }}
                  >
                    -
                  </button>
                  <span style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f8fafc',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#374151',
                    minWidth: '3rem',
                    textAlign: 'center'
                  }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.stock || 999)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: quantity >= (product.stock || 999) ? '#f1f5f9' : '#3b82f6',
                      color: quantity >= (product.stock || 999) ? '#94a3b8' : 'white',
                      border: 'none',
                      cursor: quantity >= (product.stock || 999) ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (quantity < (product.stock || 999)) {
                        e.target.style.background = '#2563eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (quantity < (product.stock || 999)) {
                        e.target.style.background = '#3b82f6';
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || (product.category === 'lab-test' && !selectedLabOption)}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: addingToCart || (product.category === 'lab-test' && !selectedLabOption)
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: addingToCart || (product.category === 'lab-test' && !selectedLabOption) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!addingToCart && !(product.category === 'lab-test' && !selectedLabOption)) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!addingToCart && !(product.category === 'lab-test' && !selectedLabOption)) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                {addingToCart ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Adding to Cart...
                  </>
                ) : (
                  <>
                    🛒 Add to Cart
                    {selectedLabOption && (
                      <span style={{
                        fontSize: '0.9rem',
                        opacity: '0.9'
                      }}>
                        - ₹{(selectedLabOption.price * quantity).toFixed(2)}
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Cart Message */}
              {cartMessage && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  background: cartMessage.includes('successfully') 
                    ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                    : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  color: cartMessage.includes('successfully') ? '#065f46' : '#dc2626',
                  border: cartMessage.includes('successfully')
                    ? '1px solid #a7f3d0'
                    : '1px solid #fca5a5'
                }}>
                  {cartMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProductDetailPage;
