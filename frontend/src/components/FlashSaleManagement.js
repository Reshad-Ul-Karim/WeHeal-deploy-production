import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Flash as FlashIcon,
  Add as AddIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as OfferIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { flashSaleService } from '../services/flashSaleService';

const FlashSaleManagement = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await flashSaleService.admin.getAllFlashSales();
      if (response.success) {
        setFlashSales(response.data.flashSales || []);
      } else {
        setError(response.message || 'Failed to fetch flash sales');
      }
    } catch (err) {
      console.error('Error fetching flash sales:', err);
      setError('Error loading flash sales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRandomSale = async () => {
    try {
      setCreateLoading(true);
      const response = await flashSaleService.admin.createRandomFlashSale();
      if (response.success) {
        setSuccess('Flash sale created successfully!');
        fetchFlashSales();
      } else {
        setError(response.message || 'Failed to create flash sale');
      }
    } catch (err) {
      console.error('Error creating flash sale:', err);
      setError('Error creating flash sale');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateMultipleSales = async () => {
    try {
      setCreateLoading(true);
      const response = await flashSaleService.admin.createMultipleFlashSales(3);
      if (response.success) {
        setSuccess(`Created ${response.data.length} flash sales successfully!`);
        fetchFlashSales();
      } else {
        setError(response.message || 'Failed to create flash sales');
      }
    } catch (err) {
      console.error('Error creating flash sales:', err);
      setError('Error creating flash sales');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEndSale = async (saleId) => {
    try {
      const response = await flashSaleService.admin.endFlashSale(saleId);
      if (response.success) {
        setSuccess('Flash sale ended successfully!');
        fetchFlashSales();
      } else {
        setError(response.message || 'Failed to end flash sale');
      }
    } catch (err) {
      console.error('Error ending flash sale:', err);
      setError('Error ending flash sale');
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'EXPIRED';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getSaleStatus = (sale) => {
    const now = new Date();
    const start = new Date(sale.startTime);
    const end = new Date(sale.endTime);

    if (!sale.isActive) return { status: 'ENDED', color: 'error' };
    if (now < start) return { status: 'UPCOMING', color: 'warning' };
    if (now > end) return { status: 'EXPIRED', color: 'error' };
    if (sale.maxQuantity && sale.soldQuantity >= sale.maxQuantity) return { status: 'SOLD OUT', color: 'error' };
    return { status: 'ACTIVE', color: 'success' };
  };

  const activeSales = flashSales.filter(sale => {
    const now = new Date();
    return sale.isActive && new Date(sale.startTime) <= now && new Date(sale.endTime) > now;
  }).length;

  const totalRevenue = flashSales.reduce((sum, sale) => {
    return sum + (sale.soldQuantity * sale.salePrice);
  }, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FlashIcon color="error" />
        Flash Sales Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {activeSales}
                  </Typography>
                  <Typography variant="body2">Active Sales</Typography>
                </Box>
                <FlashIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {flashSales.length}
                  </Typography>
                  <Typography variant="body2">Total Sales</Typography>
                </Box>
                <OfferIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    ৳{totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">Total Revenue</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: '#8B4513' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {flashSales.reduce((sum, sale) => sum + sale.soldQuantity, 0)}
                  </Typography>
                  <Typography variant="body2">Items Sold</Typography>
                </Box>
                <CartIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateRandomSale}
          disabled={createLoading}
          sx={{ 
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff5252 0%, #ff7043 100%)'
            }
          }}
        >
          {createLoading ? 'Creating...' : 'Create Random Flash Sale'}
        </Button>

        <Button
          variant="contained"
          startIcon={<FlashIcon />}
          onClick={handleCreateMultipleSales}
          disabled={createLoading}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
            }
          }}
        >
          {createLoading ? 'Creating...' : 'Create 3 Flash Sales'}
        </Button>

        <Button
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={fetchFlashSales}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Flash Sales Table */}
      {loading ? (
        <Card>
          <CardContent>
            <LinearProgress />
            <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading flash sales...</Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell><strong>Discount</strong></TableCell>
                <TableCell><strong>Price</strong></TableCell>
                <TableCell><strong>Progress</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Time Left</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flashSales.map((sale) => {
                const saleStatus = getSaleStatus(sale);
                const progressPercentage = sale.maxQuantity 
                  ? (sale.soldQuantity / sale.maxQuantity) * 100 
                  : 0;

                return (
                  <TableRow key={sale._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {sale.productId?.name || 'Product Deleted'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sale.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={`${sale.discountPercentage}% OFF`}
                        color="error"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          ৳{sale.salePrice}
                        </Typography>
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                          ৳{sale.originalPrice}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      {sale.maxQuantity ? (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">
                              {sale.soldQuantity}/{sale.maxQuantity}
                            </Typography>
                            <Typography variant="caption">
                              {Math.round(progressPercentage)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progressPercentage}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="caption">Unlimited</Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={saleStatus.status}
                        color={saleStatus.color}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption">
                          {formatTimeRemaining(sale.endTime)}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedSale(sale);
                            setDialogOpen(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {saleStatus.status === 'ACTIVE' && (
                        <Tooltip title="End Sale">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleEndSale(sale._id)}
                          >
                            <StopIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {flashSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No flash sales found. Create your first flash sale!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Sale Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedSale && (
          <>
            <DialogTitle>
              Flash Sale Details: {selectedSale.title}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Product</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedSale.productId?.name || 'Product Deleted'}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedSale.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Sale Period</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Start: {new Date(selectedSale.startTime).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    End: {new Date(selectedSale.endTime).toLocaleString()}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Sales Stats</Typography>
                  <Typography variant="body2">
                    Revenue: ৳{(selectedSale.soldQuantity * selectedSale.salePrice).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FlashSaleManagement;
