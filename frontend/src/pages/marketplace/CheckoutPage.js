import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, orderAPI } from '../../services/marketplaceAPI';
import PaymentGateway from '../../components/payments/PaymentGateway';
import { Switch, FormControlLabel, TextField, Button, Chip, Alert, Box, Typography, Paper, Grid, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import DiscountIcon from '@mui/icons-material/Discount';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  border: '1px solid rgba(0,0,0,0.05)',
  background: 'var(--mk-surface, #ffffff)',
  color: 'var(--mk-text, #333)',
}));



const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showGateway, setShowGateway] = useState(false);
  const [pendingOrderMeta, setPendingOrderMeta] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    notes: ''
  });
  const [addressModified, setAddressModified] = useState(false);

  // Loyalty points
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const [loyaltyPointsValue, setLoyaltyPointsValue] = useState(0);

  // Coupon system
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Health insurance
  const [insuranceData, setInsuranceData] = useState({
    provider: '',
    policyNumber: '',
    coverage: '',
    validTill: ''
  });
  const [useInsurance, setUseInsurance] = useState(false);
  const [insuranceModified, setInsuranceModified] = useState(false);

  // Available coupons
  const availableCoupons = {
    'Happy20': { discount: 20, type: 'percentage' },
    'Welcome25': { discount: 25, type: 'percentage' }
  };

  // Memoize fetchCart to avoid infinite re-renders
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await cartAPI.getCart();
      
      if (response.success) {
        if (response.data.items.length === 0) {
          navigate('/cart');
          return;
        }
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
  }, [navigate]);

  const fetchUserProfile = useCallback(async () => {
    try {
      console.log('Fetching user profile...');
      
      // Try multiple possible endpoints for user profile
      let response;
      let profileData = null;
      
      // First try the general auth profile endpoint (no role restrictions)
      try {
        response = await fetch('/api/auth/check-auth', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Auth check response:', data);
          if (data.success && data.user) {
            profileData = data.user;
            console.log('Profile loaded from auth check endpoint');
          }
        } else {
          console.log('Auth check endpoint failed with status:', response.status);
        }
      } catch (err) {
        console.log('Auth check endpoint failed with error:', err);
      }
      
      // If auth check failed, try the patient profile endpoint
      if (!profileData) {
        try {
          response = await fetch('/api/patient/profile', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            console.log('Patient profile response:', data);
            if (data.success && data.data) {
              profileData = data.data;
              console.log('Profile loaded from patient profile endpoint');
            }
          } else {
            console.log('Patient profile endpoint failed with status:', response.status);
            if (response.status === 403) {
              console.log('Access denied - user may not have Patient role');
            }
          }
        } catch (err) {
          console.log('Patient profile endpoint failed with error:', err);
        }
      }
      
      // If still no data, try the user details endpoint
      if (!profileData) {
        try {
          response = await fetch('/api/patient/user-details', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            console.log('User details response:', data);
            if (data.success && data.data) {
              profileData = data.data;
              console.log('Profile loaded from user details endpoint');
            }
          } else {
            console.log('User details endpoint failed with status:', response.status);
          }
        } catch (err) {
          console.log('User details endpoint failed with error:', err);
        }
      }
      
      if (profileData) {
        console.log('Final profile data:', profileData);
        console.log('User role:', profileData.role);
        console.log('Billing data:', profileData.billing);
        console.log('Shipping address:', profileData.billing?.shippingAddress);
        console.log('Patient details address:', profileData.patientDetails?.address);
        setUserProfile(profileData);
      } else {
        console.error('Failed to fetch user profile from all endpoints');
        // Set a default profile to prevent errors
        setUserProfile({});
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Set a default profile to prevent errors
      setUserProfile({});
    }
  }, []);

  useEffect(() => {
    // Check if payment was recently completed
    const recentPayment = localStorage.getItem('recentPaymentCompleted');
    if (recentPayment) {
      const paymentTime = JSON.parse(recentPayment);
      const now = Date.now();
      // If payment was completed within last 5 minutes, redirect
      if (now - paymentTime < 5 * 60 * 1000) {
        setRedirecting(true);
        navigate('/dashboard', { replace: true });
        return;
      } else {
        // Clear old payment record
        localStorage.removeItem('recentPaymentCompleted');
      }
    }
    
    fetchCart();
    fetchUserProfile();
  }, [fetchCart, fetchUserProfile, navigate]);

  // Redirect if payment is already completed
  useEffect(() => {
    if (paymentCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [paymentCompleted, navigate]);

  useEffect(() => {
    console.log('UserProfile changed:', userProfile);
    
    if (userProfile) {
      console.log('Checking for billing address in userProfile...');
      console.log('userProfile.billing:', userProfile.billing);
      console.log('userProfile.address:', userProfile.address);
      console.log('userProfile.shippingAddress:', userProfile.shippingAddress);
      
      // Try different possible locations for address data
      let address = null;
      
      // First try billing.shippingAddress
      if (userProfile.billing?.shippingAddress) {
        address = userProfile.billing.shippingAddress;
        console.log('Found address in billing.shippingAddress:', address);
      }
      // Then try billing.address
      else if (userProfile.billing?.address) {
        address = userProfile.billing.address;
        console.log('Found address in billing.address:', address);
      }
      // Then try direct address
      else if (userProfile.address) {
        address = userProfile.address;
        console.log('Found address in userProfile.address:', address);
      }
      // Then try direct shippingAddress
      else if (userProfile.shippingAddress) {
        address = userProfile.shippingAddress;
        console.log('Found address in userProfile.shippingAddress:', address);
      }
      // Then try patientDetails.address
      else if (userProfile.patientDetails?.address) {
        address = userProfile.patientDetails.address;
        console.log('Found address in patientDetails.address:', address);
      }
      
      if (address) {
        console.log('Setting form data with address:', address);
        setFormData({
          street: address.street || address.address || '',
          city: address.city || '',
          state: address.state || '',
          zipCode: address.zipCode || address.postalCode || address.pincode || '',
          country: address.country || 'India',
          notes: ''
        });
        // Reset address modified flag since data is loaded from profile
        setAddressModified(false);
        console.log('Form data set successfully');
      } else {
        console.log('No address found in user profile');
        // Set default values
        setFormData({
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India',
          notes: ''
        });
        // Reset address modified flag
        setAddressModified(false);
      }
      
      // Auto-fill health insurance data if available
      if (userProfile.billing?.insurance) {
        const insurance = userProfile.billing.insurance;
        console.log('Found insurance data in profile:', insurance);
        setInsuranceData({
          provider: insurance.provider || '',
          policyNumber: insurance.policyNumber || '',
          coverage: insurance.coverage || '',
          validTill: insurance.validTill || ''
        });
        // Reset insurance modified flag since data is loaded from profile
        setInsuranceModified(false);
        console.log('Insurance data auto-filled successfully');
      } else {
        console.log('No insurance data found in profile');
        // Keep current insurance data or set defaults
        setInsuranceData({
          provider: '',
          policyNumber: '',
          coverage: '',
          validTill: ''
        });
        // Reset insurance modified flag
        setInsuranceModified(false);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile && useLoyaltyPoints) {
      const maxPoints = Math.min(userProfile.loyaltyPoints || 0, Math.floor(cart?.totalAmount || 0));
      setLoyaltyPointsToUse(maxPoints);
      setLoyaltyPointsValue(maxPoints * 0.1); // 1 point = 0.1 currency
    } else {
      setLoyaltyPointsToUse(0);
      setLoyaltyPointsValue(0);
    }
  }, [useLoyaltyPoints, userProfile, cart]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setAddressModified(true);
  };

  const saveAddressToProfile = async () => {
    try {
      console.log('Saving address to profile:', formData);
      
      const addressData = {
        billing: {
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          }
        }
      };
      
      const response = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(addressData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Address saved to profile successfully');
          // Update the local userProfile state
          setUserProfile(prev => ({
            ...prev,
            billing: {
              ...prev.billing,
              shippingAddress: addressData.billing.shippingAddress
            }
          }));
          // Reset the modified flag
          setAddressModified(false);
          alert('Shipping address saved to your profile for future use!');
        } else {
          console.error('Failed to save address:', data.message);
          alert('Failed to save address: ' + data.message);
        }
      } else {
        console.error('Failed to save address, status:', response.status);
        alert('Failed to save address. Please try again.');
      }
    } catch (err) {
      console.error('Error saving address to profile:', err);
      alert('Error saving address. Please try again.');
    }
  };

  const saveInsuranceToProfile = async () => {
    try {
      console.log('Saving insurance to profile:', insuranceData);
      
      const insuranceUpdateData = {
        billing: {
          insurance: {
            provider: insuranceData.provider,
            policyNumber: insuranceData.policyNumber,
            coverage: insuranceData.coverage,
            validTill: insuranceData.validTill
          }
        }
      };
      
      const response = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(insuranceUpdateData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Insurance saved to profile successfully');
          // Update the local userProfile state
          setUserProfile(prev => ({
            ...prev,
            billing: {
              ...prev.billing,
              insurance: insuranceUpdateData.billing.insurance
            }
          }));
          // Reset the modified flag
          setInsuranceModified(false);
          alert('Health insurance information saved to your profile for future use!');
        } else {
          console.error('Failed to save insurance:', data.message);
          alert('Failed to save insurance: ' + data.message);
        }
      } else {
        console.error('Failed to save insurance, status:', response.status);
        alert('Failed to save insurance. Please try again.');
      }
    } catch (err) {
      console.error('Error saving insurance to profile:', err);
      alert('Error saving insurance. Please try again.');
    }
  };

  const handleInsuranceChange = (e) => {
    const { name, value } = e.target;
    setInsuranceData(prev => ({
      ...prev,
      [name]: value
    }));
    setInsuranceModified(true);
  };

  const applyCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const coupon = availableCoupons[couponCode.trim()];
    if (!coupon) {
      setCouponError('Invalid coupon code');
      return;
    }

    setAppliedCoupon({ code: couponCode.trim(), ...coupon });
    setCouponCode('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const calculateTotal = () => {
    if (!cart) return 0;
    
    let total = cart.totalAmount;
    
    // Apply coupon discount
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        total = total * (1 - appliedCoupon.discount / 100);
      }
    }
    
    // Apply loyalty points
    total = Math.max(0, total - loyaltyPointsValue);
    
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if payment is already completed
    if (paymentCompleted) {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Validate form
    if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
      setError('Please fill in all required address fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Save shipping data locally and open payment gateway
      const shippingAddress = {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        country: formData.country.trim()
      };

      const orderMeta = {
        shippingAddress,
        notes: formData.notes.trim(),
        amount: calculateTotal(),
        originalAmount: cart.totalAmount,
        loyaltyPointsUsed: loyaltyPointsToUse,
        couponApplied: appliedCoupon,
        insuranceData: useInsurance ? insuranceData : null
      };

      setPendingOrderMeta(orderMeta);
      // Only open gateway if payment is not completed
      if (!paymentCompleted) {
        setShowGateway(true);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Error creating order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Prevent payment gateway from opening if payment is completed
  const handleGatewayClose = () => {
    if (paymentCompleted) {
      navigate('/dashboard', { replace: true });
    } else {
      setShowGateway(false);
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      console.log('Payment successful, creating order with data:', paymentData);
      
      // Close the payment gateway immediately
      setShowGateway(false);
      setSubmitting(false);
      
      // Validate required data
      if (!pendingOrderMeta || !pendingOrderMeta.shippingAddress) {
        setError('Missing order information. Please try again.');
        return;
      }
      
      if (!paymentData.transactionId && !paymentData.orderId) {
        setError('Payment transaction ID is missing. Please contact support.');
        return;
      }
      
      const payload = {
        shippingAddress: pendingOrderMeta.shippingAddress,
        notes: pendingOrderMeta.notes,
        loyaltyPointsUsed: pendingOrderMeta.loyaltyPointsUsed,
        couponApplied: pendingOrderMeta.couponApplied,
        insuranceData: pendingOrderMeta.insuranceData,
        payment: {
          transactionId: paymentData.orderId || paymentData.transactionId,
          paymentMethod: paymentData.paymentMethod,
          details: paymentData.details || {},
        },
        amount: pendingOrderMeta.amount,
        originalAmount: pendingOrderMeta.originalAmount
      };
      
      console.log('Creating order with payload:', payload);
      
      // Validate payload
      if (!payload.shippingAddress.street || !payload.shippingAddress.city || 
          !payload.shippingAddress.state || !payload.shippingAddress.zipCode) {
        setError('Shipping address is incomplete. Please try again.');
        return;
      }
      
      if (!payload.payment.transactionId) {
        setError('Payment transaction ID is missing. Please contact support.');
        return;
      }
      
      // Add loading state for order creation
      setSubmitting(true);
      setError('');
      
      // Create order after payment
      try {
        console.log('Creating order with payload:', payload);
        console.log('Payment data being sent:', {
          orderId: payload.orderId,
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          paymentType: payload.paymentType,
          transactionId: payload.transactionId,
          details: payload.details
        });
        console.log('Payment method validation:', {
          paymentMethod: payload.paymentMethod,
          isValidMethod: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'].includes(payload.paymentMethod)
        });
        console.log('Payment data structure:', {
          hasOrderId: !!payload.orderId,
          hasAmount: !!payload.amount,
          hasPaymentMethod: !!payload.paymentMethod,
          hasPaymentType: !!payload.paymentType,
          hasTransactionId: !!payload.transactionId,
          hasDetails: !!payload.details
        });
        console.log('Payment data types:', {
          orderId: typeof payload.orderId,
          amount: typeof payload.amount,
          paymentMethod: typeof payload.paymentMethod,
          paymentType: typeof payload.paymentType,
          transactionId: typeof payload.transactionId,
          details: typeof payload.details
        });
        console.log('Payment data validation:', {
          hasOrderId: !!payload.orderId,
          hasAmount: !!payload.amount,
          hasPaymentMethod: !!payload.paymentMethod,
          hasPaymentType: !!payload.paymentType,
          hasTransactionId: !!payload.transactionId,
          hasDetails: !!payload.details
        });
        console.log('Payment method enum validation:', {
          paymentMethod: payload.paymentMethod,
          validMethods: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'],
          isValid: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'].includes(payload.paymentMethod)
        });
        console.log('Payment data structure validation:', {
          orderId: {
            value: payload.orderId,
            type: typeof payload.orderId,
            hasValue: !!payload.orderId
          },
          amount: {
            value: payload.amount,
            type: typeof payload.amount,
            hasValue: !!payload.amount
          },
          paymentMethod: {
            value: payload.paymentMethod,
            type: typeof payload.paymentMethod,
            hasValue: !!payload.paymentMethod
          },
          paymentType: {
            value: payload.paymentType,
            type: typeof payload.paymentType,
            hasValue: !!payload.paymentType
          },
          transactionId: {
            value: payload.transactionId,
            type: typeof payload.transactionId,
            hasValue: !!payload.transactionId
          },
          details: {
            value: payload.details,
            type: typeof payload.details,
            hasValue: !!payload.details
          }
        });
        console.log('Payment data enum validation:', {
          paymentMethod: {
            value: payload.paymentMethod,
            validMethods: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'],
            isValid: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'].includes(payload.paymentMethod)
          },
          paymentType: {
            value: payload.paymentType,
            validTypes: ['marketplace', 'consultation', 'test'],
            isValid: ['marketplace', 'consultation', 'test'].includes(payload.paymentType)
          }
        });
        console.log('Payment data final validation summary:', {
          allFieldsPresent: !!payload.orderId && !!payload.amount && !!payload.paymentMethod && !!payload.paymentType && !!payload.transactionId,
          allFieldsValid: 
            typeof payload.orderId === 'string' && payload.orderId.length > 0 &&
            typeof payload.amount === 'number' && payload.amount > 0 &&
            ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'].includes(payload.paymentMethod) &&
            ['marketplace', 'consultation', 'test'].includes(payload.paymentType) &&
            typeof payload.transactionId === 'string' && payload.transactionId.length > 0,
          paymentMethodEnum: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'],
          paymentTypeEnum: ['marketplace', 'consultation', 'test']
        });
        
        const response = await orderAPI.createOrderAfterPayment(payload);
        console.log('Order creation response:', response);
        
        if (response.success) {
          setOrderCreated(true);
          setOrderId(response.data.orderId);
          setShowSuccessModal(true);
          
          // Clear cart after successful order
          try {
            await cartAPI.clearCart();
            console.log('Cart cleared successfully');
          } catch (clearError) {
            console.error('Error clearing cart:', clearError);
          }
          
          // Refresh cart data
          fetchCart();
        } else {
          setError(response.message || 'Failed to create order');
        }
      } catch (error) {
        console.error('Post-payment order creation failed', error);
        
        // Provide more detailed error information
        let errorMessage = 'Order creation failed after payment. ';
        
        if (error.response) {
          // Server responded with error
          const serverError = error.response.data;
          errorMessage += `Server error: ${serverError.message || serverError.error || 'Unknown server error'}`;
          console.error('Server error details:', serverError);
        } else if (error.request) {
          // Request was made but no response received
          errorMessage += 'No response from server. Please check your internet connection.';
          console.error('Network error:', error.request);
        } else {
          // Something else happened
          errorMessage += `Error: ${error.message || 'Unknown error occurred'}`;
          console.error('Other error:', error);
        }
        
        setError(errorMessage);
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Post-payment order creation failed', err);
      
      // Provide more detailed error information
      let errorMessage = 'Order creation failed after payment. ';
      
      if (err.response) {
        // Server responded with error
        const serverError = err.response.data;
        errorMessage += `Server error: ${serverError.message || serverError.error || 'Unknown server error'}`;
        console.error('Server error details:', serverError);
      } else if (err.request) {
        // Request was made but no response received
        errorMessage += 'No response from server. Please check your internet connection.';
        console.error('Network error:', err.request);
      } else {
        // Something else happened
        errorMessage += `Error: ${err.message || 'Unknown error occurred'}`;
        console.error('Other error:', err);
      }
      
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">
            {redirecting ? 'Redirecting to dashboard...' : 'Loading...'}
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-4">Your cart is empty</div>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen" style={{ background: 'var(--mk-page-bg, #f8fafc)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--mk-text, #1f2937)' }}>Checkout</h1>
          <p className="text-gray-600 mt-1">Complete your order</p>
        </div>

        {error && (
          <Alert severity="error" className="mb-6">
            {error}
          </Alert>
        )}

        {paymentCompleted && (
          <Alert severity="success" className="mb-6">
            Payment completed successfully! Redirecting to marketplace...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Left Column - Checkout Form */}
            <Grid item xs={12} lg={8}>
              {/* Shipping Address */}
              <StyledPaper className="mb-6">
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center">
                    <LocalShippingIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Shipping Address
                    </Typography>
                  </Box>
                  
                  
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address *"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City *"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="State *"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ZIP Code *"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Order Notes (Optional)"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      variant="outlined"
                    />
                  </Grid>
                  
                  {/* Save Address Button - Only show when there are changes or no auto-fill */}
                  {((!userProfile?.billing?.shippingAddress) || addressModified) && (
                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={saveAddressToProfile}
                          disabled={!formData.street || !formData.city || !formData.state || !formData.zipCode}
                          startIcon={<LocalShippingIcon />}
                        >
                          Save Address to Profile
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </StyledPaper>

              {/* Loyalty Points Section */}
              <StyledPaper className="mb-6">
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center">
                    <LoyaltyIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Loyalty Points
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useLoyaltyPoints}
                        onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                        disabled={!userProfile?.loyaltyPoints || userProfile.loyaltyPoints === 0}
                      />
                    }
                    label=""
                  />
                </Box>
                
                {userProfile?.loyaltyPoints > 0 ? (
                  <Box>
                    <Typography variant="body1" color="text.secondary" mb={2}>
                      You have <strong>{userProfile.loyaltyPoints} loyalty points</strong>. Redeem now!
                    </Typography>
                    
                    {useLoyaltyPoints && (
                      <Box>
                        <Typography variant="body2" color="success.main" mb={1}>
                          Using {loyaltyPointsToUse} points = ₹{loyaltyPointsValue.toFixed(2)} discount
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Points will be deducted from your account after order completion
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Points to be earned from this purchase */}
                    <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="body2" color="primary.main">
                        <strong>Earn {Math.floor((cart?.totalAmount || 0) / 100) * 2} points</strong> from this purchase!
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (2 points per ₹100 spent)
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      No loyalty points available. Make purchases to earn points!
                    </Typography>
                    
                    {/* Points to be earned from this purchase */}
                    <Box p={2} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="body2" color="primary.main">
                        <strong>Earn {Math.floor((cart?.totalAmount || 0) / 100) * 2} points</strong> from this purchase!
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (2 points per ₹100 spent)
                      </Typography>
                    </Box>
                  </Box>
                )}
              </StyledPaper>

              {/* Health Insurance */}
              <StyledPaper className="mb-6">
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center">
                    <LocalHospitalIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Health Insurance
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useInsurance}
                        onChange={(e) => setUseInsurance(e.target.checked)}
                      />
                    }
                    label="Use Insurance"
                  />
                </Box>

                {useInsurance && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Insurance Provider"
                        name="provider"
                        value={insuranceData.provider}
                        onChange={handleInsuranceChange}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Policy Number"
                        name="policyNumber"
                        value={insuranceData.policyNumber}
                        onChange={handleInsuranceChange}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Coverage Amount"
                        name="coverage"
                        value={insuranceData.coverage}
                        onChange={handleInsuranceChange}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Valid Till"
                        name="validTill"
                        type="date"
                        value={insuranceData.validTill}
                        onChange={handleInsuranceChange}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    {/* Save Insurance Button - Only show when there are changes or no auto-fill */}
                    {((!userProfile?.billing?.insurance) || insuranceModified) && (
                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={saveInsuranceToProfile}
                            disabled={!insuranceData.provider || !insuranceData.policyNumber || !insuranceData.coverage || !insuranceData.validTill}
                            startIcon={<LocalHospitalIcon />}
                          >
                            Save Insurance to Profile
                          </Button>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}
              </StyledPaper>
            </Grid>

            {/* Right Column - Order Summary */}
            <Grid item xs={12} lg={4}>
              <StyledPaper style={{ position: 'sticky', top: '20px' }}>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Order Summary
                </Typography>
                
                {/* Order Items */}
                <Box mb={3}>
                  {cart.items.map((item) => (
                    <Box key={item.productId._id} display="flex" alignItems="center" mb={2}>
                      <img
                        src={item.productId.image ? `http://localhost:5001${item.productId.image}` : '/placeholder-product.png'}
                        alt={item.productId.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', marginRight: '12px' }}
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {item.productId.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty: {item.quantity} × ₹{item.price}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Coupon Section */}
                <Box mb={3}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <DiscountIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight={500}>
                      Apply Coupon
                    </Typography>
                  </Box>
                  
                  {appliedCoupon ? (
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Chip 
                        label={`${appliedCoupon.code} (${appliedCoupon.discount}% off)`}
                        color="success"
                        size="small"
                      />
                      <Button size="small" onClick={removeCoupon}>
                        Remove
                      </Button>
                    </Box>
                  ) : (
                    <Box display="flex" gap={1}>
                      <TextField
                        size="small"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        error={!!couponError}
                        helperText={couponError}
                        sx={{ flex: 1 }}
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={applyCoupon}
                        disabled={!couponCode.trim()}
                      >
                        Apply
                      </Button>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Price Breakdown */}
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Subtotal</Typography>
                    <Typography variant="body2">₹{cart.totalAmount.toFixed(2)}</Typography>
                  </Box>
                  
                  {appliedCoupon && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="success.main">
                        Coupon Discount ({appliedCoupon.discount}%)
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        -₹{(cart.totalAmount * appliedCoupon.discount / 100).toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  
                  {useLoyaltyPoints && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="success.main">
                        Loyalty Points
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        -₹{loyaltyPointsValue.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Shipping</Typography>
                    <Typography variant="body2" color="success.main">Free</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={600}>
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      ₹{total.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                {/* Place Order Button */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={submitting || paymentCompleted}
                  sx={{ mb: 2 }}
                >
                  {submitting ? 'Processing...' : paymentCompleted ? 'Payment Completed' : 'Proceed to Payment'}
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/cart')}
                >
                  Back to Cart
                </Button>
              </StyledPaper>
            </Grid>
          </Grid>
        </form>
      </div>
      
      <PaymentGateway 
        open={showGateway}
        onClose={handleGatewayClose}
        amount={total}
        paymentType="marketplace"
        onSuccess={handlePaymentSuccess}
        userProfile={userProfile}
      />
    </div>
  );
};

export default CheckoutPage;
