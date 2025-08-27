import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { subscriptionService } from '../../services/subscriptionService';
import CreateSubscription from './CreateSubscription';
import EditSubscription from './EditSubscription';
import './SubscriptionManagement.css';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getUserSubscriptions();
      if (response.success) {
        setSubscriptions(response.subscriptions || []);
      } else {
        setError(response.message || 'Failed to load subscriptions');
        setSubscriptions([]); // Ensure it's always an array
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setError('Failed to load subscriptions');
      setSubscriptions([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (subscriptionId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const response = await subscriptionService.updateSubscriptionStatus(subscriptionId, newStatus);
      
      if (response.success) {
        setSuccess(`Subscription ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
        loadSubscriptions();
      } else {
        setError(response.message || 'Failed to update subscription status');
      }
    } catch (error) {
      console.error('Error toggling subscription status:', error);
      setError('Failed to update subscription status');
    }
  };

  const handleDeleteSubscription = async () => {
    if (!subscriptionToDelete) return;

    try {
      const response = await subscriptionService.deleteSubscription(subscriptionToDelete._id);
      
      if (response.success) {
        setSuccess('Subscription deleted successfully');
        loadSubscriptions();
      } else {
        setError(response.message || 'Failed to delete subscription');
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setError('Failed to delete subscription');
    } finally {
      setDeleteConfirmOpen(false);
      setSubscriptionToDelete(null);
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

  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'weekly':
        return 'Every Week';
      case 'biweekly':
        return 'Every 2 Weeks';
      case 'monthly':
        return 'Every Month';
      case 'quarterly':
        return 'Every 3 Months';
      default:
        return frequency;
    }
  };

  const formatNextDelivery = (date) => {
    const nextDate = new Date(date);
    const today = new Date();
    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays > 0) {
      return `In ${diffDays} days`;
    } else {
      return 'Overdue';
    }
  };

  const calculateTotalAmount = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
  };

  if (loading) {
    return (
      <Box className="subscription-management" sx={{ p: 3 }}>
        <Typography>Loading subscriptions...</Typography>
      </Box>
    );
  }

  // Ensure subscriptions is always an array
  const safeSubscriptions = subscriptions || [];

  return (
    <Box className="subscription-management" sx={{ p: 3 }}>
      {/* Header */}
      <Box className="subscription-header" sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom className="subscription-title">
          Medicine Subscriptions
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Manage your recurring medicine orders with automatic delivery and payment
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          className="create-subscription-btn"
          sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
          }}
        >
          Create New Subscription
        </Button>
      </Box>

      {/* Subscriptions Grid */}
      {safeSubscriptions.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Subscriptions Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first subscription to automate your medicine orders
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Subscription
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {safeSubscriptions.map((subscription) => (
            <Grid item xs={12} md={6} lg={4} key={subscription._id}>
              <Card className="subscription-card" elevation={3}>
                <CardContent>
                  {/* Status and Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={(subscription.status || 'unknown').toUpperCase()}
                      color={getStatusColor(subscription.status || 'unknown')}
                      size="small"
                    />
                    <Box>
                      <Tooltip title="Edit Subscription">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={(subscription.status || 'unknown') === 'active' ? 'Pause' : 'Resume'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(subscription._id, subscription.status || 'unknown')}
                          disabled={(subscription.status || 'unknown') === 'cancelled'}
                        >
                          {(subscription.status || 'unknown') === 'active' ? <PauseIcon /> : <PlayIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Subscription">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSubscriptionToDelete(subscription);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Subscription Details */}
                  <Typography variant="h6" gutterBottom>
                    {subscription.title || subscription.name || 'Untitled Subscription'}
                  </Typography>

                  {/* Items List */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Items ({(subscription.items || []).length}):
                    </Typography>
                    <List dense>
                      {(subscription.items || []).slice(0, 2).map((item, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                          <ListItemText
                            primary={item.name || item.productName || 'Product'}
                            secondary={`Qty: ${item.quantity || 1} × ₹${item.price || 0}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                      {(subscription.items || []).length > 2 && (
                        <ListItem sx={{ px: 0, py: 0.5 }}>
                          <ListItemText
                            primary={`+${(subscription.items || []).length - 2} more items`}
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Subscription Info */}
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Frequency
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {getFrequencyText(subscription.frequency || 'monthly')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PaymentIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Total Amount
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          ₹{calculateTotalAmount(subscription.items).toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Next Delivery */}
                  {(subscription.status || 'unknown') === 'active' && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ShippingIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Next Delivery
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {formatNextDelivery(subscription.nextDeliveryDate || subscription.nextOrderDate)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {subscription.nextDeliveryDate ? new Date(subscription.nextDeliveryDate).toLocaleDateString() : 
                         subscription.nextOrderDate ? new Date(subscription.nextOrderDate).toLocaleDateString() : 'Not scheduled'}
                      </Typography>
                    </Box>
                  )}

                  {/* Order History */}
                  {subscription.orderHistory && subscription.orderHistory.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <HistoryIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Last Order
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {new Date(subscription.orderHistory[subscription.orderHistory.length - 1].createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Subscription Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Subscription</DialogTitle>
        <DialogContent>
          <CreateSubscription
            onSuccess={() => {
              setCreateDialogOpen(false);
              loadSubscriptions();
              setSuccess('Subscription created successfully!');
            }}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Subscription</DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <EditSubscription
              subscription={selectedSubscription}
              onSuccess={() => {
                setEditDialogOpen(false);
                setSelectedSubscription(null);
                loadSubscriptions();
                setSuccess('Subscription updated successfully!');
              }}
              onCancel={() => {
                setEditDialogOpen(false);
                setSelectedSubscription(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this subscription? This action cannot be undone.
          </Typography>
          {subscriptionToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {subscriptionToDelete.title || subscriptionToDelete.name || 'Untitled Subscription'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(subscriptionToDelete.items || []).length} items • {getFrequencyText(subscriptionToDelete.frequency || 'monthly')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSubscription} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubscriptionManagement;
