import React, { useState } from 'react';

const SearchBar = ({ onSearch, placeholder = "Search products..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            paddingLeft: '3rem',
            paddingRight: searchTerm ? '3rem' : '1rem',
            paddingTop: '0.875rem',
            paddingBottom: '0.875rem',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '1.5rem',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            fontSize: '1rem',
            fontWeight: '500',
            color: '#374151',
            outline: 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}
          onFocus={(e) => {
            e.target.style.border = '2px solid rgba(255, 255, 255, 0.6)';
            e.target.style.background = 'rgba(255, 255, 255, 0.95)';
            e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onBlur={(e) => {
            e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
            e.target.style.background = 'rgba(255, 255, 255, 0.9)';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}
        />
        
        {/* Enhanced Search Icon */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '1rem',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#6b7280',
          fontSize: '1.25rem'
        }}>
          🔍
        </div>

        {/* Enhanced Clear Button */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              top: '50%',
              right: '1rem',
              transform: 'translateY(-50%)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.2)';
              e.target.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.1)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Enhanced Submit Button (Hidden but functional) */}
      <button
        type="submit"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
