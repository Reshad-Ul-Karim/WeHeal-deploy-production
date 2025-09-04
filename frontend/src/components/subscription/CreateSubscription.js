import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Autocomplete,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { subscriptionService } from '../../services/subscriptionService';
import { marketplaceService } from '../../services/marketplaceService';

const steps = ['Select Products', 'Set Frequency', 'Choose Payment', 'Review & Create'];

const frequencyOptions = [
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Every 7 days',
    icon: '📅'
  },
  {
    value: 'biweekly',
    label: 'Bi-weekly',
    description: 'Every 14 days',
    icon: '📆'
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Every 30 days',
    icon: '🗓️'
  },
  {
    value: 'quarterly',
    label: 'Quarterly',
    description: 'Every 90 days',
    icon: '📋'
  }
];

const CreateSubscription = ({ onSuccess, onCancel }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [subscriptionData, setSubscriptionData] = useState({
    title: '',
    name: '',
    items: [],
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    deliveryAddress: '',
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    }
  });
  
  // Product selection states
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // User data
  const [userPaymentMethods, setUserPaymentMethods] = useState([]);
  const [userAddresses, setUserAddresses] = useState([]);
  
  // Address dialog states
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });
  
  // Payment method dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card',
    paymentMethod: 'credit_card',
    last4: '',
    brand: 'Visa',
    upiId: '',
    walletProvider: '',
    label: ''
  });

  useEffect(() => {
    loadProducts();
    loadUserData();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Loading products for subscription...');
      
      // Get all products from marketplace
      const response = await marketplaceService.getProducts();
      console.log('Full products response:', response);
      
      if (response && response.success) {
        // The backend returns data in response.data.products
        const allProducts = response.data?.products || response.products || [];
        console.log('All products found:', allProducts);
        
        // Filter for medicine products
        const medicineProducts = allProducts.filter(
          product => {
            const isMedicine = product.category === 'medicine' || 
                             product.category === 'Medicine' ||
                             (product.name && (
                               product.name.toLowerCase().includes('medicine') ||
                               product.name.toLowerCase().includes('tablet') ||
                               product.name.toLowerCase().includes('capsule') ||
                               product.name.toLowerCase().includes('syrup') ||
                               product.name.toLowerCase().includes('monas') ||
                               product.name.toLowerCase().includes('paracetamol')
                             ));
            console.log(`Product ${product.name}: category=${product.category}, isMedicine=${isMedicine}`);
            return isMedicine && (product.isActive !== false);
          }
        );
        
        setProducts(medicineProducts);
        console.log('Filtered medicine products:', medicineProducts);
        
        if (medicineProducts.length === 0) {
          console.log('No medicine products found. All products:', 
            allProducts.map(p => ({ name: p.name, category: p.category }))
          );
        }
      } else {
        console.error('Products response not successful:', response);
        setError(response?.message || 'Failed to load products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products. Please check console for details.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      // Load user's saved payment methods and addresses
      // This would come from user profile or payment service
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setUserAddresses([
          {
            id: 'address1',
            label: 'Home',
            address: user.address || 'No address saved'
          }
        ]);
        
        // In a real app, you'd load saved payment methods
        setUserPaymentMethods([
          {
            id: 'credit_card_default',
            type: 'card',
            paymentMethod: 'credit_card',
            last4: '1234',
            brand: 'Visa',
            label: 'Default Credit Card (****1234)'
          },
          {
            id: 'upi_default',
            type: 'upi',
            paymentMethod: 'upi',
            upiId: 'user@upi',
            label: 'Default UPI (user@upi)'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAddressSelection = (event) => {
    const value = event.target.value;
    if (value === 'new') {
      setShowAddressDialog(true);
    } else {
      setSubscriptionData(prev => ({
        ...prev,
        deliveryAddress: value
      }));
    }
  };

  const handleAddNewAddress = () => {
    const addressString = `${newAddress.street}, ${newAddress.city}, ${newAddress.state} ${newAddress.zipCode}, ${newAddress.country}`;
    const newAddressObj = {
      id: `addr_${Date.now()}`,
      label: newAddress.label || 'New Address',
      address: addressString
    };
    
    setUserAddresses(prev => [...prev, newAddressObj]);
    setSubscriptionData(prev => ({
      ...prev,
      deliveryAddress: newAddressObj.id,
      shippingAddress: { ...newAddress }
    }));
    
    // Reset form and close dialog
    setNewAddress({
      label: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    });
    setShowAddressDialog(false);
  };

  const handleCloseAddressDialog = () => {
    setShowAddressDialog(false);
    setNewAddress({
      label: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    });
  };

  const handlePaymentMethodSelection = (event) => {
    const value = event.target.value;
    if (value === 'new') {
      setShowPaymentDialog(true);
    } else {
      setSubscriptionData(prev => ({
        ...prev,
        paymentMethod: value
      }));
    }
  };

  const handleAddNewPaymentMethod = () => {
    const newPaymentMethodObj = {
      id: `payment_${Date.now()}`,
      type: newPaymentMethod.type,
      paymentMethod: newPaymentMethod.paymentMethod,
      last4: newPaymentMethod.last4,
      brand: newPaymentMethod.brand,
      upiId: newPaymentMethod.upiId,
      walletProvider: newPaymentMethod.walletProvider,
      label: newPaymentMethod.label || `${newPaymentMethod.type.toUpperCase()} Payment`
    };
    
    setUserPaymentMethods(prev => [...prev, newPaymentMethodObj]);
    setSubscriptionData(prev => ({
      ...prev,
      paymentMethod: newPaymentMethodObj.id
    }));
    
    // Reset form and close dialog
    setNewPaymentMethod({
      type: 'card',
      paymentMethod: 'credit_card',
      last4: '',
      brand: 'Visa',
      upiId: '',
      walletProvider: '',
      label: ''
    });
    setShowPaymentDialog(false);
  };

  const handleClosePaymentDialog = () => {
    setShowPaymentDialog(false);
    setNewPaymentMethod({
      type: 'card',
      paymentMethod: 'credit_card',
      last4: '',
      brand: 'Visa',
      upiId: '',
      walletProvider: '',
      label: ''
    });
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0: // Products selection
        if (!subscriptionData.items || subscriptionData.items.length === 0) {
          setError('Please select at least one product');
          return false;
        }
        if (!subscriptionData.title || !subscriptionData.title.trim()) {
          setError('Please enter a subscription name');
          return false;
        }
        break;
      case 1: // Frequency
        if (!subscriptionData.frequency) {
          setError('Please select a delivery frequency');
          return false;
        }
        break;
      case 2: // Payment
        if (!subscriptionData.paymentMethod) {
          setError('Please select a payment method');
          return false;
        }
        if (!subscriptionData.deliveryAddress && !subscriptionData.shippingAddress.street) {
          setError('Please select a delivery address or add a new one');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const addProductToSubscription = (product) => {
    const existingItem = subscriptionData.items.find(item => item.productId === product._id);
    
    if (existingItem) {
      setSubscriptionData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }));
    } else {
      setSubscriptionData(prev => ({
        ...prev,
        items: [...prev.items, {
          productId: product._id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          image: product.image
        }]
      }));
    }
  };

  const updateItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromSubscription(productId);
      return;
    }
    
    setSubscriptionData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    }));
  };

  const removeItemFromSubscription = (productId) => {
    setSubscriptionData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const calculateTotal = () => {
    return subscriptionData.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleCreateSubscription = async () => {
    try {
      setLoading(true);
      
      // Prepare the subscription data in the format expected by backend
      const selectedPaymentMethod = userPaymentMethods.find(pm => pm.id === subscriptionData.paymentMethod);
      
      const subscriptionPayload = {
        title: subscriptionData.title,
        description: subscriptionData.description || `Subscription for ${subscriptionData.title}`,
        items: subscriptionData.items,
        frequency: subscriptionData.frequency,
        startDate: subscriptionData.startDate,
        paymentMethod: selectedPaymentMethod?.paymentMethod || 'credit_card',
        savedPaymentInfo: selectedPaymentMethod ? {
          type: selectedPaymentMethod.type,
          last4: selectedPaymentMethod.last4,
          brand: selectedPaymentMethod.brand,
          upiId: selectedPaymentMethod.upiId,
          walletProvider: selectedPaymentMethod.walletProvider,
          isDefault: true
        } : {
          type: 'card',
          last4: '1234',
          brand: 'Visa',
          isDefault: true
        },
        shippingAddress: subscriptionData.shippingAddress,
        settings: {
          autoRenewal: true,
          notifications: true
        }
      };
      
      // If user selected an existing address, we need to get the address details
      if (subscriptionData.deliveryAddress && !subscriptionData.shippingAddress.street) {
        const selectedAddress = userAddresses.find(addr => addr.id === subscriptionData.deliveryAddress);
        if (selectedAddress) {
          // Parse the address string to extract components
          const addressParts = selectedAddress.address.split(', ');
          subscriptionPayload.shippingAddress = {
            street: addressParts[0] || '',
            city: addressParts[1] || '',
            state: addressParts[2]?.split(' ')[0] || '',
            zipCode: addressParts[2]?.split(' ')[1] || '',
            country: addressParts[3] || 'India'
          };
        }
      }
      
      console.log('Sending subscription payload:', subscriptionPayload);
      
      const response = await subscriptionService.createSubscription(subscriptionPayload);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError('Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = (products || []).filter(product =>
    product && product.name && 
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            {/* Subscription Name */}
            <TextField
              fullWidth
              label="Subscription Name"
              placeholder="e.g., Monthly Medicine Pack"
              value={subscriptionData.title}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 3 }}
            />

            {/* Product Search */}
            <TextField
              fullWidth
              label="Search Products"
              placeholder="Search for medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ mb: 3 }}
            />

            {/* Selected Items */}
            {subscriptionData.items.length > 0 && (
              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Selected Items ({subscriptionData.items.length})
                </Typography>
                <List>
                  {subscriptionData.items.map((item, index) => (
                    <React.Fragment key={item.productId}>
                      <ListItem>
                        <ListItemText
                          primary={item.productName}
                          secondary={`₹${item.price} each`}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeItemFromSubscription(item.productId)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < subscriptionData.items.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
                <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
                  Total: ₹{calculateTotal().toFixed(2)}
                </Typography>
              </Paper>
            )}

            {/* Available Products */}
            <Typography variant="h6" gutterBottom>
              Available Products
            </Typography>
            
            {/* Loading State */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredProducts.length === 0 ? (
              /* Empty State */
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No medicine products available. Please ensure products are added to the marketplace.
                </Typography>
                <Button 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={loadProducts}
                >
                  Refresh Products
                </Button>
              </Box>
            ) : (
              /* Products Grid */
              <Grid container spacing={2}>
                {filteredProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product._id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                      onClick={() => addProductToSubscription(product)}
                    >
                      {product.image && (
                        <CardMedia
                          component="img"
                          height="140"
                          image={product.image}
                          alt={product.name}
                        />
                      )}
                      <CardContent>
                        <Typography variant="h6" component="div" noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {product.description}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          ₹{product.price}
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddIcon />}
                          sx={{ mt: 1 }}
                          fullWidth
                        >
                          Add to Subscription
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              How often would you like to receive your medicines?
            </Typography>
            <Grid container spacing={3}>
              {frequencyOptions.map((option) => (
                <Grid item xs={12} sm={6} key={option.value}>
                  <Paper
                    elevation={subscriptionData.frequency === option.value ? 4 : 1}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      textAlign: 'center',
                      border: subscriptionData.frequency === option.value ? 2 : 1,
                      borderColor: subscriptionData.frequency === option.value ? 'primary.main' : 'grey.300',
                      bgcolor: subscriptionData.frequency === option.value ? 'primary.50' : 'white',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => setSubscriptionData(prev => ({ ...prev, frequency: option.value }))}
                  >
                    <Typography variant="h2" sx={{ mb: 1 }}>
                      {option.icon}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {option.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Start Date */}
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={subscriptionData.startDate}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mt: 3 }}
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            {/* Payment Method Selection */}
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                value={subscriptionData.paymentMethod}
                onChange={handlePaymentMethodSelection}
              >
                {userPaymentMethods.map((method) => (
                  <FormControlLabel
                    key={method.id}
                    value={method.id}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaymentIcon />
                        <Typography>{method.label}</Typography>
                      </Box>
                    }
                  />
                ))}
                <FormControlLabel
                  value="new"
                  control={<Radio />}
                  label="Add New Payment Method"
                />
              </RadioGroup>
            </FormControl>

            {/* Delivery Address */}
            <Typography variant="h6" gutterBottom>
              Delivery Address
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={subscriptionData.deliveryAddress}
                onChange={handleAddressSelection}
              >
                {userAddresses.map((address) => (
                  <FormControlLabel
                    key={address.id}
                    value={address.id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle2">{address.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {address.address}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
                <FormControlLabel
                  value="new"
                  control={<Radio />}
                  label="Add New Address"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Subscription
            </Typography>
            
            {/* Subscription Summary */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {subscriptionData.name}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Frequency
                    </Typography>
                    <Typography>
                      {frequencyOptions.find(f => f.value === subscriptionData.frequency)?.label}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography>
                      {new Date(subscriptionData.startDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total per Delivery
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₹{calculateTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Items List */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Items ({subscriptionData.items.length})
              </Typography>
              <List>
                {subscriptionData.items.map((item, index) => (
                  <ListItem key={item.productId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.productName}
                      secondary={`Quantity: ${item.quantity}`}
                    />
                    <Typography variant="body2">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Terms and Conditions */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                By creating this subscription, you agree to automatic billing and delivery according to the selected frequency. 
                You can pause, modify, or cancel your subscription at any time from your dashboard.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderStepContent()}

      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 3 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleCreateSubscription}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Subscription'}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
      </Box>

      {/* Add New Address Dialog */}
      <Dialog 
        open={showAddressDialog} 
        onClose={handleCloseAddressDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Address</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Address Label (e.g., Home, Office)"
              value={newAddress.label}
              onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Street Address"
              value={newAddress.street}
              onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
              sx={{ mb: 2 }}
              multiline
              rows={2}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={newAddress.zipCode}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={newAddress.country}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddressDialog}>Cancel</Button>
          <Button 
            onClick={handleAddNewAddress}
            variant="contained"
            disabled={!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode}
          >
            Add Address
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Payment Method Dialog */}
      <Dialog 
        open={showPaymentDialog} 
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Payment Method</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={newPaymentMethod.type}
                onChange={(e) => setNewPaymentMethod(prev => ({ 
                  ...prev, 
                  type: e.target.value,
                  paymentMethod: e.target.value === 'card' ? 'credit_card' : 
                                  e.target.value === 'upi' ? 'upi' : 'wallet'
                }))}
              >
                <MenuItem value="card">Credit/Debit Card</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
                <MenuItem value="wallet">Wallet</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Payment Method Label"
              value={newPaymentMethod.label}
              onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, label: e.target.value }))}
              sx={{ mb: 2 }}
              placeholder="e.g., My Credit Card, Work UPI"
            />

            {newPaymentMethod.type === 'card' && (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last 4 Digits"
                      value={newPaymentMethod.last4}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, last4: e.target.value }))}
                      inputProps={{ maxLength: 4 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Card Brand</InputLabel>
                      <Select
                        value={newPaymentMethod.brand}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, brand: e.target.value }))}
                      >
                        <MenuItem value="Visa">Visa</MenuItem>
                        <MenuItem value="Mastercard">Mastercard</MenuItem>
                        <MenuItem value="RuPay">RuPay</MenuItem>
                        <MenuItem value="American Express">American Express</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Card Type</InputLabel>
                      <Select
                        value={newPaymentMethod.paymentMethod}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      >
                        <MenuItem value="credit_card">Credit Card</MenuItem>
                        <MenuItem value="debit_card">Debit Card</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </>
            )}

            {newPaymentMethod.type === 'upi' && (
              <TextField
                fullWidth
                label="UPI ID"
                value={newPaymentMethod.upiId}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, upiId: e.target.value }))}
                placeholder="user@upi"
              />
            )}

            {newPaymentMethod.type === 'wallet' && (
              <FormControl fullWidth>
                <InputLabel>Wallet Provider</InputLabel>
                <Select
                  value={newPaymentMethod.walletProvider}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, walletProvider: e.target.value }))}
                >
                  <MenuItem value="PayTM">PayTM</MenuItem>
                  <MenuItem value="PhonePe">PhonePe</MenuItem>
                  <MenuItem value="Google Pay">Google Pay</MenuItem>
                  <MenuItem value="Amazon Pay">Amazon Pay</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button 
            onClick={handleAddNewPaymentMethod}
            variant="contained"
            disabled={!newPaymentMethod.label || 
              (newPaymentMethod.type === 'card' && !newPaymentMethod.last4) ||
              (newPaymentMethod.type === 'upi' && !newPaymentMethod.upiId) ||
              (newPaymentMethod.type === 'wallet' && !newPaymentMethod.walletProvider)
            }
          >
            Add Payment Method
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateSubscription;
