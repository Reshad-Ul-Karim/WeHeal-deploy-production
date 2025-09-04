import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      setAddingToCart(true);
      setCartMessage('');
      
      const result = await addToCart(product._id, 1);
      
      if (result.success) {
        setCartMessage('Added to cart!');
        setTimeout(() => setCartMessage(''), 2000);
      } else {
        setCartMessage(result.message || 'Failed to add');
        setTimeout(() => setCartMessage(''), 2000);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setCartMessage('Error occurred');
      setTimeout(() => setCartMessage(''), 2000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/marketplace/product/${product._id}`);
  };

  return (
    <div 
      style={{
        background: 'var(--mk-surface)',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        border: '1px solid var(--mk-border)',
        position: 'relative'
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Product Image */}
      <div style={{
        width: '100%',
        height: '220px',
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <img
          src={product.image ? `https://weheal-backend.onrender.com${product.image}` : '/placeholder-product.png'}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
          onError={(e) => {
            e.target.src = '/placeholder-product.png';
          }}
        />
        
        {/* Category Badge */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: product.category === 'medicine' 
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '2rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
        }}>
          {product.category === 'medicine' ? '💊 Medicine' : '🧪 Lab Test'}
        </div>

        {/* Stock Status Badge */}
        {product.stock === 0 && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}>
            Out of Stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: '1.5rem', paddingBottom: '2.5rem' }}>
        {/* Product Name */}
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          color: 'var(--mk-text)',
          marginBottom: '0.75rem',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.name}
        </h3>

        {/* Product Description */}
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--mk-muted)',
          marginBottom: '1rem',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.description}
        </p>

        {/* Additional Info */}
        {product.category === 'medicine' && product.manufacturer && (
          <p style={{
            fontSize: '0.8rem',
            color: 'var(--mk-muted)',
            marginBottom: '0.75rem',
            fontStyle: 'italic'
          }}>
            by {product.manufacturer}
          </p>
        )}

        {/* Prescription Required Badge */}
        {product.prescriptionRequired && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Prescription Required
            </span>
          </div>
        )}

        {/* Price and Stock */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ₹{product.price}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: product.stock > 0 ? '#059669' : '#dc2626',
            fontWeight: '500'
          }}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>
        </div>

        {/* Lab Options for Lab Tests */}
        {product.category === 'lab-test' && product.labOptions && product.labOptions.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem'
            }}>
              Available at:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {product.labOptions.slice(0, 2).map((option, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {option.labName}
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#059669'
                  }}>
                    ₹{option.price}
                  </span>
                </div>
              ))}
              {product.labOptions.length > 2 && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  textAlign: 'center',
                  padding: '0.25rem'
                }}>
                  +{product.labOptions.length - 2} more options
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock === 0}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: product.stock === 0 ? 'not-allowed' : addingToCart ? 'wait' : 'pointer',
              background: product.stock === 0
                ? '#f3f4f6'
                : addingToCart
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: product.stock === 0 ? '#9ca3af' : 'white',
              boxShadow: product.stock === 0 ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (product.stock > 0 && !addingToCart) {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (product.stock > 0 && !addingToCart) {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {product.stock === 0 
              ? 'Out of Stock' 
              : addingToCart 
              ? 'Adding...' 
              : 'Add to Cart'
            }
          </button>

          {/* Cart Message */}
          {cartMessage && (
            <div 
              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking message
              style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                marginTop: '0.5rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                textAlign: 'center',
                fontWeight: '500',
                background: cartMessage.includes('Added') 
                  ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                  : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                color: cartMessage.includes('Added') ? '#166534' : '#dc2626',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                animation: 'fadeInUp 0.3s ease',
                zIndex: 1000, // Ensure it appears above other elements
                border: '1px solid rgba(0, 0, 0, 0.1)',
                cursor: 'default' // Show it's not clickable
              }}
            >
              {cartMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
