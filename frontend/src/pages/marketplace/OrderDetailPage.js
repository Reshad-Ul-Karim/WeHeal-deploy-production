import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { orderAPI } from '../../services/marketplaceAPI';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Check if order was just created
  const orderCreated = location.state?.orderCreated;

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await orderAPI.getOrder(orderId);
      
      if (response.success) {
        setOrder(response.data);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Error loading order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancelling(true);
      
      const response = await orderAPI.cancelOrder(orderId);
      
      if (response.success) {
        setOrder(response.data);
      } else {
        setError(response.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Error cancelling order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderProgress = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'processing', label: 'Processing' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex && order.status !== 'cancelled',
      current: index === currentIndex && order.status !== 'cancelled'
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-4">{error || 'Order not found'}</div>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {orderCreated && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="text-green-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Order placed successfully!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Your order has been received and is being processed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/orders')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderId}</h1>
              <p className="text-gray-600 mt-1">Placed on {formatDate(order.orderDate)}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Order Progress */}
            {order.status !== 'cancelled' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Order Progress</h2>
                <div className="space-y-4">
                  {getOrderProgress().map((step, index) => (
                    <div key={step.key} className="flex items-center">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-blue-600 text-white' 
                          : step.current 
                          ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${
                          step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src={item.productId?.image ? `http://localhost:5001${item.productId.image}` : '/placeholder-product.png'}
                        alt={item.name}
                        className="h-20 w-20 rounded-md object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.category === 'medicine' ? '💊 Medicine' : '🧪 Lab Test'}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <span>Quantity: {item.quantity}</span>
                          <span>Price: ₹{item.price} each</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium text-gray-900">
                          ₹{item.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 mt-8 lg:mt-0 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-medium">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{order.shippingAddress.street}</div>
                <div>{order.shippingAddress.city}, {order.shippingAddress.state}</div>
                <div>{order.shippingAddress.zipCode}</div>
                <div>{order.shippingAddress.country}</div>
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Tracking Information</h2>
                <div className="text-sm">
                  <div className="text-gray-600">Tracking Number</div>
                  <div className="font-medium text-gray-900">{order.trackingNumber}</div>
                </div>
              </div>
            )}

            {/* Estimated Delivery */}
            {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Estimated Delivery</h2>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {formatDate(order.estimatedDelivery)}
                  </div>
                </div>
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Notes</h2>
                <div className="text-sm text-gray-600">
                  {order.notes}
                </div>
              </div>
            )}

            {/* Actions */}
            {['pending', 'confirmed'].includes(order.status) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
