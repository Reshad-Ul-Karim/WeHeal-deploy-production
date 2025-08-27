import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Box, Typography, Button, Paper, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Payment, CheckCircle, Error } from '@mui/icons-material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  background: 'var(--mk-surface, #ffffff)',
  color: 'var(--mk-text, #333)',
  border: '1px solid var(--mk-border, #e5e7eb)',
}));

const StyledButton = styled(Button)(({ theme, variant }) => ({
  padding: '12px 24px',
  borderRadius: '25px',
  fontWeight: 'bold',
  textTransform: 'none',
  fontSize: '1rem',
  ...(variant === 'primary' && {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
    },
  }),
  ...(variant === 'success' && {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    '&:hover': {
      background: 'linear-gradient(135deg, #0ea371 0%, #047857 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.6)',
    },
  }),
  transition: 'all 0.3s ease',
}));

const ConsultationPayment = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [consultationDetails, setConsultationDetails] = useState(null);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchConsultationDetails();
  }, [appointmentId]);

  const fetchConsultationDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/consultation-payments/status/${appointmentId}`);
      
      if (response.data.success) {
        setConsultationDetails(response.data.data);
        setPaymentStatus(response.data.data.paymentStatus);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching consultation details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessingPayment(true);
      
      // Initialize payment
      const initResponse = await api.post('/api/consultation-payments/init', {
        appointmentId: appointmentId
      });

      if (initResponse.data.success) {
        const { paymentId, amount } = initResponse.data.data;
        
        // Simulate payment completion (in real app, this would integrate with payment gateway)
        const completeResponse = await api.post('/api/consultation-payments/complete', {
          paymentId: paymentId,
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          paymentMethod: 'online'
        });

        if (completeResponse.data.success) {
          setPaymentStatus('completed');
          // Refresh consultation details
          await fetchConsultationDetails();
        } else {
          setError('Payment completion failed');
        }
      } else {
        setError('Payment initialization failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleViewAppointments = () => {
    navigate('/dashboard/patient');
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading consultation details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        gap={3}
      >
        <StyledPaper elevation={3}>
          <Box textAlign="center" p={4}>
            <Error color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" color="error" gutterBottom>
              Error
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error}
            </Typography>
            <StyledButton
              variant="primary"
              onClick={() => navigate(-1)}
              fullWidth
            >
              Go Back
            </StyledButton>
          </Box>
        </StyledPaper>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      p={3}
      sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
    >
      {/* Return to Dashboard Button */}
      <Button
        variant="outlined"
        onClick={() => navigate('/dashboard/patient')}
        sx={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderColor: '#3b82f6',
          color: '#3b82f6',
          '&:hover': {
            background: 'rgba(255, 255, 255, 1)',
            borderColor: '#1d4ed8',
            color: '#1d4ed8'
          }
        }}
      >
        ← Return to Dashboard
      </Button>
      
      <StyledPaper elevation={3} sx={{ maxWidth: 500, width: '100%' }}>
        <Box textAlign="center" p={3}>
          {paymentStatus === 'completed' ? (
            <>
              <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" color="success.main" gutterBottom>
                Payment Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Your consultation payment has been processed successfully.
              </Typography>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Amount Paid:</strong> ₹{consultationDetails?.consultationFee || 0}
                </Typography>
                <Typography variant="body2">
                  <strong>Doctor:</strong> Dr. {consultationDetails?.doctorName || 'Unknown'}
                </Typography>
              </Alert>
              <StyledButton
                variant="success"
                onClick={handleViewAppointments}
                fullWidth
                size="large"
              >
                View My Appointments
              </StyledButton>
            </>
          ) : (
            <>
              <Payment color="primary" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" color="primary.main" gutterBottom>
                Consultation Payment
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Please complete the payment for your consultation.
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Consultation Fee:</strong> ₹{consultationDetails?.consultationFee || 0}
                  </Typography>
                </Alert>
                
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Note:</strong> Payment is required to complete your consultation.
                  </Typography>
                </Alert>
              </Box>

              <StyledButton
                variant="primary"
                onClick={handlePayment}
                disabled={processingPayment}
                fullWidth
                size="large"
                startIcon={processingPayment ? <CircularProgress size={20} color="inherit" /> : <Payment />}
              >
                {processingPayment ? 'Processing Payment...' : 'Pay Now'}
              </StyledButton>
            </>
          )}
        </Box>
      </StyledPaper>
    </Box>
  );
};

export default ConsultationPayment;
