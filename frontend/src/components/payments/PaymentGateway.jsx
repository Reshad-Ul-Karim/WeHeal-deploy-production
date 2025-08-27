import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  TextField,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  InputAdornment,
  Alert,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LoyaltyIcon from '@mui/icons-material/Loyalty';

const PaymentMethodCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  }
}));

const SavedMethodCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4]
  }
}));

const PaymentGateway = ({ open, onClose, amount, paymentType, onSuccess, userProfile }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useSavedMethod, setUseSavedMethod] = useState(false);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState('');

  // Card Payment Form State
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvc: ''
  });

  // Bank Details Form State
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    accountHolder: '',
    bankName: '',
    branchName: ''
  });

  const mobilePaymentMethods = [
    { id: 'bKash', name: 'bKash', icon: '💗', color: '#e2136e' },
    { id: 'Nagad', name: 'Nagad', icon: '💰', color: '#009966' },
    { id: 'Qcash', name: 'Q Cash', icon: '💳', color: '#2563eb' }
  ];

  const calculateLoyaltyPoints = (amount) => {
    return Math.floor(amount / 100) * 2;
  };

  const handlePayment = () => {
    console.log('handlePayment called');
    setLoading(true);
    // Generate transaction ID
    const transactionId = `WH-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate loyalty points
    const pointsEarned = calculateLoyaltyPoints(amount);
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      
      // Prepare payment data
      const paymentData = {
        orderId: transactionId,
        transactionId: transactionId, // Add both for compatibility
        status: 'completed',
        amount,
        paymentType,
        paymentMethod: activeTab === 0 ? 'mobile' : activeTab === 1 ? 'card' : 'bank',
        details: activeTab === 0 ? { 
          mobileMethod: selectedMethod,
          mobileNumber,
          pin: '****' // Don't store actual PIN
        } : activeTab === 1 ? cardDetails : bankDetails,
        loyaltyPoints: pointsEarned,
        timestamp: new Date().toISOString()
      };

      console.log('=== Payment Data Being Sent ===');
      console.log('Payment data:', paymentData);
      console.log('Payment method:', paymentData.paymentMethod);
      console.log('Payment type:', paymentData.paymentType);
      console.log('Amount:', paymentData.amount);
      console.log('Transaction ID:', paymentData.transactionId);
      console.log('Payment method validation:', {
        paymentMethod: paymentData.paymentMethod,
        isValidMethod: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'].includes(paymentData.paymentMethod)
      });
      console.log('Payment data types:', {
        orderId: typeof paymentData.orderId,
        amount: typeof paymentData.amount,
        paymentMethod: typeof paymentData.paymentMethod,
        paymentType: typeof paymentData.paymentType,
        transactionId: typeof paymentData.transactionId,
        details: typeof paymentData.details
      });
      console.log('Payment data validation:', {
        hasOrderId: !!paymentData.orderId,
        hasAmount: !!paymentData.amount,
        hasPaymentMethod: !!paymentData.paymentMethod,
        hasPaymentType: !!paymentData.paymentType,
        hasTransactionId: !!paymentData.transactionId,
        hasDetails: !!paymentData.details
      });
      console.log('Payment method enum validation:', {
        paymentMethod: paymentData.paymentMethod,
        validMethods: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'],
        isValid: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'].includes(paymentData.paymentMethod)
      });
      console.log('Payment data structure validation:', {
        orderId: {
          value: paymentData.orderId,
          type: typeof paymentData.orderId,
          hasValue: !!paymentData.orderId
        },
        amount: {
          value: paymentData.amount,
          type: typeof paymentData.amount,
          hasValue: !!paymentData.amount
        },
        paymentMethod: {
          value: paymentData.paymentMethod,
          type: typeof paymentData.paymentMethod,
          hasValue: !!paymentData.paymentMethod
        },
        paymentType: {
          value: paymentData.paymentType,
          type: typeof paymentData.paymentType,
          hasValue: !!paymentData.paymentType
        },
        transactionId: {
          value: paymentData.transactionId,
          type: typeof paymentData.transactionId,
          hasValue: !!paymentData.transactionId
        },
        details: {
          value: paymentData.details,
          type: typeof paymentData.details,
          hasValue: !!paymentData.details
        }
      });
      console.log('Payment data enum validation:', {
        paymentMethod: {
          value: paymentData.paymentMethod,
          validMethods: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'],
          isValid: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'].includes(paymentData.paymentMethod)
        },
        paymentType: {
          value: paymentData.paymentType,
          validTypes: ['marketplace', 'consultation', 'test'],
          isValid: ['marketplace', 'consultation', 'test'].includes(paymentData.paymentType)
        }
      });
      console.log('Payment data final validation:', {
        orderId: {
          value: paymentData.orderId,
          type: typeof paymentData.orderId,
          hasValue: !!paymentData.orderId,
          isValid: typeof paymentData.orderId === 'string' && paymentData.orderId.length > 0
        },
        amount: {
          value: paymentData.amount,
          type: typeof paymentData.amount,
          hasValue: !!paymentData.amount,
          isValid: typeof paymentData.amount === 'number' && paymentData.amount > 0
        },
        paymentMethod: {
          value: paymentData.paymentMethod,
          type: typeof paymentData.paymentMethod,
          hasValue: !!paymentData.paymentMethod,
          isValid: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'].includes(paymentData.paymentMethod)
        },
        paymentType: {
          value: paymentData.paymentType,
          type: typeof paymentData.paymentType,
          hasValue: !!paymentData.paymentType,
          isValid: ['marketplace', 'consultation', 'test'].includes(paymentData.paymentType)
        },
        transactionId: {
          value: paymentData.transactionId,
          type: typeof paymentData.transactionId,
          hasValue: !!paymentData.transactionId,
          isValid: typeof paymentData.transactionId === 'string' && paymentData.transactionId.length > 0
        }
      });
      console.log('Payment data complete validation summary:', {
        orderId: {
          value: paymentData.orderId,
          type: typeof paymentData.orderId,
          hasValue: !!paymentData.orderId,
          isValid: typeof paymentData.orderId === 'string' && paymentData.orderId.length > 0,
          length: paymentData.orderId?.length || 0
        },
        amount: {
          value: paymentData.amount,
          type: typeof paymentData.amount,
          hasValue: !!paymentData.amount,
          isValid: typeof paymentData.amount === 'number' && paymentData.amount > 0,
          isPositive: paymentData.amount > 0
        },
        paymentMethod: {
          value: paymentData.paymentMethod,
          type: typeof paymentData.paymentMethod,
          hasValue: !!paymentData.paymentMethod,
          isValid: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'].includes(paymentData.paymentMethod),
          enumValues: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash']
        },
        paymentType: {
          value: paymentData.paymentType,
          type: typeof paymentData.paymentType,
          hasValue: !!paymentData.paymentType,
          isValid: ['marketplace', 'consultation', 'test'].includes(paymentData.paymentType),
          enumValues: ['marketplace', 'consultation', 'test']
        },
        transactionId: {
          value: paymentData.transactionId,
          type: typeof paymentData.transactionId,
          hasValue: !!paymentData.transactionId,
          isValid: typeof paymentData.transactionId === 'string' && paymentData.transactionId.length > 0,
          length: paymentData.transactionId?.length || 0
        }
      });
      console.log('=== End Payment Data ===');

      // Simulate success message and then call onSuccess
      setTimeout(() => {
        setShowSuccess(false);
        console.log('Payment successful, calling onSuccess with data:', paymentData);
        // Call onSuccess with payment data
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(paymentData);
        } else {
          console.error('onSuccess function is not available or not a function');
        }
        // Close the modal immediately after calling onSuccess
        onClose();
      }, 1500);
    }, 2000);
  };

  const handleCardInput = (e) => {
    let value = e.target.value;
    if (e.target.name === 'cardNumber') {
      value = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    if (e.target.name === 'expiryDate') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
    }
    if (e.target.name === 'cvc') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }
    setCardDetails(prev => ({ ...prev, [e.target.name]: value }));
  };

  const renderSavedMethods = () => {
    if (!userProfile?.paymentMethods) return null;

    const { bankAccounts, cards, mobileWallets } = userProfile.paymentMethods;
    const allMethods = [];

    // Add saved cards
    cards?.forEach((card, index) => {
      allMethods.push({
        id: `card-${index}`,
        type: 'card',
        title: `${card.brand} •••• ${card.last4}`,
        subtitle: card.cardHolder,
        icon: <CreditCardIcon />,
        data: card
      });
    });

    // Add saved bank accounts
    bankAccounts?.forEach((account, index) => {
      allMethods.push({
        id: `bank-${index}`,
        type: 'bank',
        title: `${account.bankName} •••• ${account.accountNumberMasked}`,
        subtitle: account.accountHolder,
        icon: <AccountBalanceIcon />,
        data: account
      });
    });

    // Add saved mobile wallets
    mobileWallets?.forEach((wallet, index) => {
      allMethods.push({
        id: `mobile-${index}`,
        type: 'mobile',
        title: `${wallet.provider} •••• ${wallet.mobileNumber.slice(-4)}`,
        subtitle: wallet.mobileNumber,
        icon: <PhoneAndroidIcon />,
        data: wallet
      });
    });

    if (allMethods.length === 0) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          Saved Payment Methods
        </Typography>
        <RadioGroup
          value={selectedSavedMethod}
          onChange={(e) => setSelectedSavedMethod(e.target.value)}
        >
          {allMethods.map((method) => (
            <SavedMethodCard
              key={method.id}
              selected={selectedSavedMethod === method.id}
              onClick={() => setSelectedSavedMethod(method.id)}
              sx={{ mb: 2 }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box display="flex" alignItems="center">
                  <Radio value={method.id} />
                  <Box display="flex" alignItems="center" sx={{ ml: 1 }}>
                    <Box sx={{ mr: 2, color: 'primary.main' }}>
                      {method.icon}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {method.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {method.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </SavedMethodCard>
          ))}
        </RadioGroup>
        
        <FormControlLabel
          control={
            <Radio
              checked={!useSavedMethod}
              onChange={() => setUseSavedMethod(false)}
            />
          }
          label="Use new payment method"
        />
      </Box>
    );
  };

  const renderMobileBanking = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Select Mobile Banking Method
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {mobilePaymentMethods.map((method) => (
          <Grid item xs={4} key={method.id}>
            <PaymentMethodCard
              onClick={() => setSelectedMethod(method.id)}
              sx={{
                bgcolor: selectedMethod === method.id ? `${method.color}15` : 'background.paper',
                border: selectedMethod === method.id ? `2px solid ${method.color}` : '2px solid transparent'
              }}
            >
              <Typography variant="h4" sx={{ mb: 1 }}>{method.icon}</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: selectedMethod === method.id ? method.color : 'inherit'
                }}
              >
                {method.name}
              </Typography>
            </PaymentMethodCard>
          </Grid>
        ))}
      </Grid>

      {selectedMethod && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`${selectedMethod} Number`}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="01XXXXXXXXX"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneAndroidIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="PIN"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter 4-digit PIN"
              />
            </Grid>
          </Grid>
        </Box>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          You will earn {calculateLoyaltyPoints(amount)} loyalty points for this purchase
          <LoyaltyIcon sx={{ ml: 1, verticalAlign: 'middle' }} />
        </Typography>
      </Alert>
    </Box>
  );

  const renderCardPayment = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Enter Card Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Card Number"
            name="cardNumber"
            value={cardDetails.cardNumber}
            onChange={handleCardInput}
            placeholder="1234 5678 9012 3456"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CreditCardIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Card Holder Name"
            name="cardHolder"
            value={cardDetails.cardHolder}
            onChange={handleCardInput}
            placeholder="JOHN DOE"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Expiry Date"
            name="expiryDate"
            value={cardDetails.expiryDate}
            onChange={handleCardInput}
            placeholder="MM/YY"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="CVC"
            name="cvc"
            value={cardDetails.cvc}
            onChange={handleCardInput}
            placeholder="123"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderBankPayment = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Enter Bank Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Bank Name"
            name="bankName"
            value={bankDetails.bankName}
            onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountBalanceIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Account Number"
            name="accountNumber"
            value={bankDetails.accountNumber}
            onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Account Holder Name"
            name="accountHolder"
            value={bankDetails.accountHolder}
            onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolder: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Branch Name"
            name="branchName"
            value={bankDetails.branchName}
            onChange={(e) => setBankDetails(prev => ({ ...prev, branchName: e.target.value }))}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const isFormValid = () => {
    console.log('Form validation check:', {
      selectedSavedMethod,
      activeTab,
      selectedMethod,
      mobileNumber: mobileNumber.length,
      pin: pin.length,
      cardDetails,
      bankDetails
    });
    
    if (selectedSavedMethod) {
      console.log('Using saved method, form is valid');
      return true;
    }
    
    if (activeTab === 0) {
      const isValid = selectedMethod !== '' && 
             mobileNumber.length === 11 && 
             pin.length === 4;
      console.log('Mobile banking validation:', isValid);
      return isValid;
    }
    if (activeTab === 1) {
      const isValid = cardDetails.cardNumber.replace(/\s/g, '').length === 16 &&
             cardDetails.cardHolder &&
             cardDetails.expiryDate.length === 5 &&
             cardDetails.cvc.length === 3;
      console.log('Card payment validation:', isValid);
      return isValid;
    }
    const isValid = bankDetails.bankName &&
           bankDetails.accountNumber &&
           bankDetails.accountHolder &&
           bankDetails.branchName;
    console.log('Bank payment validation:', isValid);
    return isValid;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        pb: 2
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          WE HEAL Payment
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
            Amount to Pay: ৳{amount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Payment Type: {paymentType}
          </Typography>
        </Box>

        {/* Render saved methods first */}
        {renderSavedMethods()}

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab 
            icon={<PhoneAndroidIcon />} 
            label="Mobile Banking" 
            iconPosition="start"
          />
          <Tab 
            icon={<CreditCardIcon />} 
            label="Card Payment" 
            iconPosition="start"
          />
          <Tab 
            icon={<AccountBalanceIcon />} 
            label="Online Banking" 
            iconPosition="start"
          />
        </Tabs>

        {activeTab === 0 && renderMobileBanking()}
        {activeTab === 1 && renderCardPayment()}
        {activeTab === 2 && renderBankPayment()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          disabled={!isFormValid() || loading}
          variant="contained"
          sx={{ minWidth: 120 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Pay Now'}
        </Button>
      </DialogActions>

      {showSuccess && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'success.main',
            color: 'white',
            px: 3,
            py: 1,
            borderRadius: 1,
            animation: 'fadeInOut 1.5s ease-in-out'
          }}
        >
          Payment Successful!
        </Box>
      )}
    </Dialog>
  );
};

export default PaymentGateway;


