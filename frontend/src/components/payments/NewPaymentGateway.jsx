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
  Alert
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

const NewPaymentGateway = ({ open, onClose, amount, paymentType, onSuccess }) => {
	const [activeTab, setActiveTab] = useState(0);
	const [selectedMethod, setSelectedMethod] = useState('');
	const [loading, setLoading] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [mobileNumber, setMobileNumber] = useState('');
	const [pin, setPin] = useState('');
	const [loyaltyPoints, setLoyaltyPoints] = useState(0);

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

	const calculateLoyaltyPoints = (amt) => {
		return Math.floor(amt / 100) * 2;
	};

	const handlePayment = () => {
		setLoading(true);
		// Generate transaction ID
		const transactionId = `WH-${Math.random().toString(36).substr(2, 9)}`;
		const pointsEarned = calculateLoyaltyPoints(amount);
		setTimeout(() => {
			setLoading(false);
			setShowSuccess(true);
			const paymentData = {
				orderId: transactionId,
				status: 'completed',
				amount,
				paymentType,
				paymentMethod: activeTab === 0 ? 'mobile' : activeTab === 1 ? 'card' : 'bank',
				details: activeTab === 0 ? {
					mobileMethod: selectedMethod,
					mobileNumber,
					pin: '****'
				} : activeTab === 1 ? cardDetails : bankDetails,
				loyaltyPoints: pointsEarned,
				timestamp: new Date().toISOString()
			};
			setTimeout(() => {
				setShowSuccess(false);
				onSuccess(paymentData);
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
		if (activeTab === 0) {
			return selectedMethod !== '' && mobileNumber.length === 11 && pin.length === 4;
		}
		if (activeTab === 1) {
			return cardDetails.cardNumber.replace(/\s/g, '').length === 16 &&
				cardDetails.cardHolder &&
				cardDetails.expiryDate.length === 5 &&
				cardDetails.cvc.length === 3;
		}
		return bankDetails.bankName && bankDetails.accountNumber && bankDetails.accountHolder && bankDetails.branchName;
	};

	return (
		<Dialog 
			open={open} 
			onClose={onClose} 
			maxWidth="md" 
			fullWidth
			PaperProps={{
				sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }
			}}
		>
			<DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', pb: 2 }}>
				<Typography variant="h5" sx={{ fontWeight: 600 }}>WE HEAL Payment</Typography>
				<IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
			</DialogTitle>
			<DialogContent sx={{ pt: 3 }}>
				<Box sx={{ mb: 3 }}>
					<Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>Amount to Pay: ৳{amount}</Typography>
					<Typography variant="body2" color="text.secondary">Payment Type: {paymentType}</Typography>
				</Box>
				<Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
					<Tab icon={<PhoneAndroidIcon />} label="Mobile Banking" iconPosition="start" />
					<Tab icon={<CreditCardIcon />} label="Card Payment" iconPosition="start" />
					<Tab icon={<AccountBalanceIcon />} label="Online Banking" iconPosition="start" />
				</Tabs>
				{activeTab === 0 && renderMobileBanking()}
				{activeTab === 1 && renderCardPayment()}
				{activeTab === 2 && renderBankPayment()}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} variant="outlined" sx={{ mr: 1 }}>Cancel</Button>
				<Button onClick={handlePayment} disabled={!isFormValid() || loading} variant="contained" sx={{ minWidth: 120 }}>
					{loading ? <CircularProgress size={24} color="inherit" /> : 'Pay Now'}
				</Button>
			</DialogActions>
			{showSuccess && (
				<Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', bgcolor: 'success.main', color: 'white', px: 3, py: 1, borderRadius: 1, animation: 'fadeInOut 1.5s ease-in-out' }}>
					Payment Successful!
				</Box>
			)}
		</Dialog>
	);
};

export default NewPaymentGateway;


