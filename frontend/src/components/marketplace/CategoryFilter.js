import React from 'react';
import { useNavigate } from 'react-router-dom';

const CategoryFilter = ({ selectedCategory, onCategoryChange }) => {
  const navigate = useNavigate();

  const categories = [
    { value: '', label: 'All Products', icon: '📦' },
    { value: 'medicine', label: 'Medicines', icon: '💊' },
    { value: 'lab-test', label: 'Lab Tests', icon: '🧪' }
  ];

  const handleCategoryClick = (category) => {
    if (category === '') {
      navigate('/marketplace');
    } else {
      navigate(`/marketplace/category/${category}`);
    }
    onCategoryChange(category);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
      
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => handleCategoryClick(category.value)}
          className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors ${
            selectedCategory === category.value
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-700 hover:bg-gray-50 border border-transparent'
          }`}
        >
          <span className="text-lg">{category.icon}</span>
          <span className="flex-1 text-sm font-medium">{category.label}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
