import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Alert,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { subscriptionService } from '../../services/subscriptionService';

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly', description: 'Every 7 days' },
  { value: 'biweekly', label: 'Bi-weekly', description: 'Every 14 days' },
  { value: 'monthly', label: 'Monthly', description: 'Every 30 days' },
  { value: 'quarterly', label: 'Quarterly', description: 'Every 90 days' }
];

const EditSubscription = ({ subscription, onSuccess, onCancel }) => {
  const [editData, setEditData] = useState({
    name: subscription.name || '',
    items: subscription.items || [],
    frequency: subscription.frequency || '',
    nextDeliveryDate: subscription.nextDeliveryDate ? 
      new Date(subscription.nextDeliveryDate).toISOString().split('T')[0] : '',
    paymentMethod: subscription.paymentMethod || '',
    deliveryAddress: subscription.deliveryAddress || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }
    
    setEditData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      )
    }));
  };

  const removeItem = (index) => {
    setEditData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return editData.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (!editData.name.trim()) {
        setError('Subscription name is required');
        return;
      }

      if (editData.items.length === 0) {
        setError('At least one item is required');
        return;
      }

      if (!editData.frequency) {
        setError('Frequency is required');
        return;
      }

      const response = await subscriptionService.updateSubscription(subscription._id, editData);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Edit Subscription
        </Typography>
        <Chip
          label={subscription.status.toUpperCase()}
          color={getStatusColor(subscription.status)}
          size="small"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Basic Information */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        
        <TextField
          fullWidth
          label="Subscription Name"
          value={editData.name}
          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
          sx={{ mb: 2 }}
        />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Next Delivery Date"
              value={editData.nextDeliveryDate}
              onChange={(e) => setEditData(prev => ({ ...prev, nextDeliveryDate: e.target.value }))}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Frequency</FormLabel>
              <RadioGroup
                row
                value={editData.frequency}
                onChange={(e) => setEditData(prev => ({ ...prev, frequency: e.target.value }))}
              >
                {frequencyOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Items Management */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Items ({editData.items.length})
        </Typography>
        
        {editData.items.length === 0 ? (
          <Alert severity="info">
            No items in this subscription. Add items to continue.
          </Alert>
        ) : (
          <List>
            {editData.items.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={item.productName}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          ₹{item.price} each
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < editData.items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Total */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="h6" align="right">
            Total per Delivery: ₹{calculateTotal().toFixed(2)}
          </Typography>
        </Box>
      </Paper>

      {/* Order History */}
      {subscription.orderHistory && subscription.orderHistory.length > 0 && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Orders
          </Typography>
          <List>
            {subscription.orderHistory.slice(-3).map((order, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`Order #${order.orderId || 'N/A'}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Date: {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {order.status || 'Completed'}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Typography variant="body2" fontWeight="bold">
                    ₹{order.amount || calculateTotal()}
                  </Typography>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Subscription Statistics */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Subscription Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {subscription.orderHistory ? subscription.orderHistory.length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Orders
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {subscription.createdAt ? 
                  Math.floor((new Date() - new Date(subscription.createdAt)) / (1000 * 60 * 60 * 24)) 
                  : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Days Active
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                ₹{subscription.orderHistory ? 
                  (subscription.orderHistory.length * calculateTotal()).toFixed(0) : 
                  '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Spent
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default EditSubscription;
