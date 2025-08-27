import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../../services/marketplaceAPI';
import { flashSaleService } from '../../services/flashSaleService';
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/marketplace/ProductCard';
import SearchBar from '../../components/marketplace/SearchBar';
import CategoryFilter from '../../components/marketplace/CategoryFilter';
import Pagination from '../../components/marketplace/Pagination';
import FlashSaleSection from '../../components/marketplace/FlashSaleSection';
import DashboardButton from '../../components/DashboardButton';
import '../../styles/marketplace.css';

const MarketplacePage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashSalesLoading, setFlashSalesLoading] = useState(true);
  const [error, setError] = useState('');
  const [flashSalesError, setFlashSalesError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchFlashSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await marketplaceAPI.getProducts(filters);
      
      if (response.success) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error loading products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashSales = async () => {
    try {
      setFlashSalesLoading(true);
      setFlashSalesError('');
      
      const response = await flashSaleService.getActiveFlashSales();
      
      if (response.success) {
        setFlashSales(response.data.flashSales || []);
      } else {
        setFlashSalesError('Failed to fetch flash sales');
      }
    } catch (err) {
      console.error('Error fetching flash sales:', err);
      setFlashSalesError('Error loading flash sales.');
    } finally {
      setFlashSalesLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSearch = (searchTerm) => {
    handleFilterChange({ search: searchTerm });
  };

  const handleCategoryChange = (category) => {
    handleFilterChange({ category });
  };

  const handleAddToCart = (product, flashSale = null) => {
    try {
      // Prepare flash sale data if available
      const flashSaleData = flashSale ? {
        salePrice: flashSale.salePrice,
        flashSaleId: flashSale._id,
        discountPercentage: flashSale.discountPercentage
      } : null;
      
      // Add to cart using the cart context
      addToCart(product._id, 1, null, flashSaleData);
      
      console.log('Added to cart:', {
        productId: product._id,
        flashSaleData
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--mk-page-bg)' }}>
      {/* Dashboard Button */}
      <DashboardButton userRole="Patient" />
      
      {/* Enhanced Modern Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          
          <div className="text-center mb-8">
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '800', 
              marginBottom: '1rem',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              letterSpacing: '-0.02em'
            }}>
              Healthcare Marketplace
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              opacity: '0.95',
              fontWeight: '300',
              maxWidth: '600px',
              margin: '0 auto 2rem',
              lineHeight: '1.6'
            }}>
              Discover quality medicines and comprehensive lab tests from verified suppliers
            </p>
            
            {/* Enhanced Search Section */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              borderRadius: '2rem',
              padding: '2rem',
              maxWidth: '600px',
              margin: '0 auto',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem',
                  opacity: '0.9'
                }}>
                  🔍 Search Products
                </h3>
                <SearchBar onSearch={handleSearch} />
              </div>
              
              {/* Quick Category Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => handleCategoryChange('')}
                  style={{
                    background: filters.category === '' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '1.5rem',
                    padding: '0.5rem 1.25rem',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = filters.category === '' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  🛍️ All Products
                </button>
                <button
                  onClick={() => handleCategoryChange('medicine')}
                  style={{
                    background: filters.category === 'medicine' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '1.5rem',
                    padding: '0.5rem 1.25rem',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = filters.category === 'medicine' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  💊 Medicines
                </button>
                <button
                  onClick={() => handleCategoryChange('lab-test')}
                  style={{
                    background: filters.category === 'lab-test' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '1.5rem',
                    padding: '0.5rem 1.25rem',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = filters.category === 'lab-test' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  🧪 Lab Tests
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div style={{ 
              background: 'var(--mk-surface)',
              borderRadius: '1.5rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              padding: '2rem',
              border: '1px solid var(--mk-border)',
              position: 'sticky',
              top: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid #f3f4f6'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  marginRight: '1rem'
                }}>
                  <span style={{ fontSize: '1.5rem', color: 'white' }}>🔧</span>
                </div>
                <h3 style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  margin: 0
                }}>
                  Filters & Sort
                </h3>
              </div>
              
              <CategoryFilter 
                selectedCategory={filters.category}
                onCategoryChange={handleCategoryChange}
              />
              
              {/* Enhanced Sort Options */}
              <div className="mt-8">
                <h4 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: '600', 
                  color: 'var(--mk-text)', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '0.5rem' }}>📊</span>
                  Sort Products
                </h4>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange({ sortBy, sortOrder });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--mk-border)',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    backgroundColor: 'var(--mk-surface)',
                    color: 'var(--mk-text)',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--mk-border)'}
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>

              {/* Enhanced Clear Filters */}
              {(filters.category || filters.search) && (
                <button
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    category: '', 
                    search: '', 
                    page: 1 
                  }))}
                  style={{
                    marginTop: '1.5rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    e.target.style.color = 'white';
                    e.target.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                    e.target.style.color = '#6b7280';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1">
            {error && (
              <div style={{
                background: 'var(--mk-surface-2)',
                border: '1px solid var(--mk-border)',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{ color: 'var(--mk-muted)', fontWeight: '500', fontSize: '1rem' }}>{error}</div>
              </div>
            )}

            {loading ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '2rem' 
              }}>
                {[...Array(6)].map((_, index) => (
                  <div 
                    key={index} 
                    style={{
                      background: 'var(--mk-surface)',
                      borderRadius: '1rem',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      overflow: 'hidden',
                      animation: 'pulse 2s infinite',
                      border: '1px solid var(--mk-border)'
                    }}
                  >
                    <div style={{ height: '200px', background: 'var(--mk-skeleton)' }}></div>
                    <div style={{ padding: '1.5rem' }}>
                      <div style={{ height: '1rem', background: 'var(--mk-skeleton)', borderRadius: '0.25rem', marginBottom: '0.75rem' }}></div>
                      <div style={{ height: '0.75rem', background: 'var(--mk-skeleton)', borderRadius: '0.25rem', marginBottom: '0.75rem' }}></div>
                      <div style={{ height: '1.5rem', background: 'var(--mk-skeleton)', borderRadius: '0.25rem' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'var(--mk-surface)',
                borderRadius: '1rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--mk-border)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛍️</div>
                <div style={{ 
                  color: 'var(--mk-muted)', 
                  fontSize: '1.2rem', 
                  fontWeight: '500',
                  marginBottom: '1rem'
                }}>
                  {filters.search || filters.category ? 
                    'No products found matching your criteria.' : 
                    'No products available.'
                  }
                </div>
                {(filters.search || filters.category) && (
                  <button
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      category: '', 
                      search: '', 
                      page: 1 
                    }))}
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Enhanced Results Info */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  background: 'var(--mk-surface)',
                  borderRadius: '1rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  border: '1px solid var(--mk-border)'
                }}>
                  <div style={{ color: 'var(--mk-muted)', fontSize: '1rem', fontWeight: '500' }}>
                    Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                    {Math.min(pagination.currentPage * filters.limit, pagination.totalProducts)} of{' '}
                    <span style={{ color: 'var(--mk-text)', fontWeight: '600' }}>{pagination.totalProducts}</span> products
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '2rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                </div>

                {/* Flash Sales Section */}
                <FlashSaleSection 
                  flashSales={flashSales}
                  loading={flashSalesLoading}
                  error={flashSalesError}
                  onAddToCart={handleAddToCart}
                />

                {/* Enhanced Products Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                  gap: '2rem',
                  marginBottom: '3rem'
                }}>
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Enhanced Pagination */}
                {pagination.totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '2rem',
                    background: 'var(--mk-surface)',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    border: '1px solid var(--mk-border)'
                  }}>
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                      hasNextPage={pagination.hasNextPage}
                      hasPrevPage={pagination.hasPrevPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
