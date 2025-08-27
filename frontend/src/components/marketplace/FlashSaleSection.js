import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Grid,
  LinearProgress,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Bolt as FlashIcon,
  AccessTime as TimeIcon,
  LocalOffer as OfferIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const FlashSaleCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
  color: 'white',
  border: '2px solid #ff4757',
  boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px rgba(255, 107, 107, 0.4)',
  },
  transition: 'all 0.3s ease',
}));

const FlashBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: -8,
  left: -8,
  background: '#ff4757',
  color: 'white',
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  zIndex: 2,
  border: '2px solid white',
}));

const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('EXPIRED');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <TimeIcon sx={{ fontSize: 16 }} />
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        {timeLeft}
      </Typography>
    </Box>
  );
};

const FlashSaleItem = ({ flashSale, onAddToCart }) => {
  const product = flashSale.productId;
  const progressPercentage = flashSale.maxQuantity 
    ? (flashSale.soldQuantity / flashSale.maxQuantity) * 100 
    : 0;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, flashSale);
    }
  };

  return (
    <FlashSaleCard>
      <FlashBadge>
        <FlashIcon sx={{ fontSize: 12 }} />
        FLASH SALE
      </FlashBadge>
      
      <CardMedia
        component="img"
        height="200"
        image={product.image ? `http://localhost:5001/${product.image}` : '/placeholder-medicine.jpg'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 'bold', 
          mb: 1, 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {product.name}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
            ৳{flashSale.salePrice}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              textDecoration: 'line-through', 
              opacity: 0.8 
            }}
          >
            ৳{flashSale.originalPrice}
          </Typography>
          <Chip
            label={`${flashSale.discountPercentage}% OFF`}
            size="small"
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        <CountdownTimer endTime={flashSale.endTime} />

        {flashSale.maxQuantity && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">
                Sold: {flashSale.soldQuantity}/{flashSale.maxQuantity}
              </Typography>
              <Typography variant="caption">
                {Math.round(progressPercentage)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white',
                }
              }}
            />
          </Box>
        )}

        <Button
          fullWidth
          variant="contained"
          startIcon={<CartIcon />}
          onClick={handleAddToCart}
          disabled={flashSale.maxQuantity && flashSale.soldQuantity >= flashSale.maxQuantity}
          sx={{
            mt: 1,
            backgroundColor: 'white',
            color: '#ff4757',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            '&:disabled': {
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              color: 'rgba(255, 71, 87, 0.5)',
            }
          }}
        >
          {flashSale.maxQuantity && flashSale.soldQuantity >= flashSale.maxQuantity 
            ? 'SOLD OUT' 
            : 'Add to Cart'
          }
        </Button>
      </CardContent>
    </FlashSaleCard>
  );
};

const FlashSaleSection = ({ flashSales, loading, error, onAddToCart }) => {
  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlashIcon color="error" />
          Flash Sales
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!flashSales || flashSales.length === 0) {
    return null; // Don't show section if no flash sales
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#ff4757',
          fontWeight: 'bold'
        }}
      >
        <FlashIcon />
        🔥 Flash Sales - Limited Time Offers!
      </Typography>
      
      <Grid container spacing={3}>
        {flashSales.map((flashSale) => (
          <Grid item xs={12} sm={6} md={4} key={flashSale._id}>
            <FlashSaleItem 
              flashSale={flashSale} 
              onAddToCart={onAddToCart}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FlashSaleSection;
