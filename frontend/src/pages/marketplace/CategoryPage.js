import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../../services/marketplaceAPI';
import ProductCard from '../../components/marketplace/ProductCard';
import SearchBar from '../../components/marketplace/SearchBar';
import Pagination from '../../components/marketplace/Pagination';
import DashboardButton from '../../components/DashboardButton';
import '../../styles/marketplace.css';

const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({});

  // Validate category
  const validCategories = ['medicine', 'lab-test'];
  const isValidCategory = validCategories.includes(category);

  useEffect(() => {
    if (!isValidCategory) {
      navigate('/marketplace');
      return;
    }
    fetchProducts();
  }, [category, filters, isValidCategory, navigate]);

  const fetchProducts = async () => {
    if (!isValidCategory) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await marketplaceAPI.getProductsByCategory(category, filters);
      
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

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getCategoryInfo = () => {
    switch (category) {
      case 'medicine':
        return {
          title: 'Medicines',
          description: 'Browse our wide range of medicines and pharmaceutical products',
          icon: '💊'
        };
      case 'lab-test':
        return {
          title: 'Lab Tests',
          description: 'Book laboratory tests and diagnostic services',
          icon: '🧪'
        };
      default:
        return {
          title: 'Products',
          description: 'Browse our products',
          icon: '📦'
        };
    }
  };

  if (!isValidCategory) {
    return null; // Will redirect in useEffect
  }

  const categoryInfo = getCategoryInfo();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mk-page-bg)' }}>
      {/* Dashboard Button */}
      <DashboardButton userRole="Patient" />
      
      {/* Enhanced Category Header */}
      <div style={{ 
        background: category === 'medicine' ? 
          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.4
        }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Back Button */}
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '1rem',
              padding: '0.75rem 1.25rem',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '2rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.25)';
              e.target.style.transform = 'translateX(-5px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>←</span>
            Back to Marketplace
          </button>

          <div className="text-center mb-8">
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              {categoryInfo.icon}
            </div>
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '800', 
              marginBottom: '1rem',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              letterSpacing: '-0.02em'
            }}>
              {categoryInfo.title}
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              opacity: '0.95',
              fontWeight: '300',
              maxWidth: '600px',
              margin: '0 auto 2rem',
              lineHeight: '1.6'
            }}>
              {categoryInfo.description}
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>🔍</span>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  margin: 0,
                  opacity: '0.9'
                }}>
                  Search {categoryInfo.title}
                </h3>
              </div>
              <SearchBar onSearch={handleSearch} />
              
              {/* Category Stats */}
              {pagination.totalProducts > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '1rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  📊 {pagination.totalProducts} {categoryInfo.title.toLowerCase()} available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div style={{
            background: 'var(--mk-surface-2)',
            border: '1px solid var(--mk-border)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              color: 'var(--mk-muted)', 
              fontWeight: '500', 
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>⚠️</span>
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '2rem' 
          }}>
            {[...Array(6)].map((_, index) => (
              <div 
                key={index} 
                className="marketplace-animation"
                style={{
                  background: 'var(--mk-surface)',
                  borderRadius: '1.5rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  overflow: 'hidden',
                  animation: 'pulse 2s infinite'
                }}
              >
                <div style={{ height: '220px', background: 'var(--mk-skeleton)' }}></div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ height: '1.2rem', background: 'var(--mk-skeleton)', borderRadius: '0.375rem', marginBottom: '0.75rem' }}></div>
                  <div style={{ height: '0.875rem', background: 'var(--mk-skeleton)', borderRadius: '0.375rem', marginBottom: '0.75rem', width: '70%' }}></div>
                  <div style={{ height: '1.5rem', background: 'var(--mk-skeleton)', borderRadius: '0.375rem' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--mk-surface)',
            borderRadius: '1.5rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid var(--mk-border)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>{categoryInfo.icon}</div>
            <div style={{ 
              color: 'var(--mk-muted)', 
              fontSize: '1.3rem', 
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              {filters.search ? 
                `No ${categoryInfo.title.toLowerCase()} found matching "${filters.search}"` : 
                `No ${categoryInfo.title.toLowerCase()} available`
              }
            </div>
            <p style={{ 
              color: '#9ca3af', 
              fontSize: '1rem',
              marginBottom: '2rem',
              maxWidth: '400px',
              margin: '0 auto 2rem'
            }}>
              {filters.search ? 
                'Try adjusting your search terms or browse our other categories.' :
                'Please check back later for new products.'
              }
            </p>
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '', page: 1 }))}
                style={{
                  padding: '0.875rem 2rem',
                  background: category === 'medicine' ? 
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Clear Search
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
              padding: '1.5rem 2rem',
              background: 'white',
              borderRadius: '1.5rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                color: '#6b7280', 
                fontSize: '1.1rem', 
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>{categoryInfo.icon}</span>
                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * filters.limit, pagination.totalProducts)} of{' '}
                <span style={{ color: '#374151', fontWeight: '700', marginLeft: '0.25rem' }}>
                  {pagination.totalProducts}
                </span> {categoryInfo.title.toLowerCase()}
              </div>
              <div style={{
                padding: '0.625rem 1.25rem',
                background: category === 'medicine' ? 
                  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            </div>

            {/* Enhanced Products Grid */}
            <div className="marketplace-animation" style={{ 
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
                borderRadius: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
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
  );
};

export default CategoryPage;
