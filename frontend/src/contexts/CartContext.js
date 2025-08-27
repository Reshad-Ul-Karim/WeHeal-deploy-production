import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/marketplaceAPI';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch cart data on component mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      if (response.success) {
        setCartItems(response.data.items || []);
        setCartCount(response.data.items ? response.data.items.length : 0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1, labOption = null, flashSaleData = null) => {
    try {
      const response = await cartAPI.addToCart(productId, quantity, labOption, flashSaleData);
      if (response.success) {
        await fetchCart(); // Refresh cart data
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, message: 'Error adding to cart' };
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      const response = await cartAPI.updateCartItem(productId, quantity);
      if (response.success) {
        await fetchCart(); // Refresh cart data
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error updating cart:', error);
      return { success: false, message: 'Error updating cart' };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await cartAPI.removeFromCart(productId);
      if (response.success) {
        await fetchCart(); // Refresh cart data
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, message: 'Error removing from cart' };
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartAPI.clearCart();
      if (response.success) {
        setCartItems([]);
        setCartCount(0);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, message: 'Error clearing cart' };
    }
  };

  const value = {
    cartItems,
    cartCount,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
