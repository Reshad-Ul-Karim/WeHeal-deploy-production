import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, PhoneIcon, TruckIcon, CheckIcon, XMarkIcon, UserIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { websocketService } from '../../services/websocket';
import '../../styles/EmergencyDashboard.css';

const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  STARTED_JOURNEY: 'started_journey',
  ON_THE_WAY: 'on_the_way',
  ALMOST_THERE: 'almost_there',
  LOOKING_FOR_PATIENT: 'looking_for_patient',
  RECEIVED_PATIENT: 'received_patient',
  DROPPING_OFF: 'dropping_off',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const STATUS_LABELS = {
  [REQUEST_STATUS.PENDING]: 'Pending',
  [REQUEST_STATUS.ACCEPTED]: 'Accepted',
  [REQUEST_STATUS.STARTED_JOURNEY]: 'Started Journey',
  [REQUEST_STATUS.ON_THE_WAY]: 'On the Way',
  [REQUEST_STATUS.ALMOST_THERE]: 'Almost There',
  [REQUEST_STATUS.LOOKING_FOR_PATIENT]: 'Looking for Patient',
  [REQUEST_STATUS.RECEIVED_PATIENT]: 'Patient Received',
  [REQUEST_STATUS.DROPPING_OFF]: 'Dropping Off',
  [REQUEST_STATUS.COMPLETED]: 'Completed',
  [REQUEST_STATUS.CANCELLED]: 'Cancelled'
};

const STATUS_FLOW = [
  { status: REQUEST_STATUS.STARTED_JOURNEY, label: 'Start Journey' },
  { status: REQUEST_STATUS.ON_THE_WAY, label: 'On the Way' },
  { status: REQUEST_STATUS.ALMOST_THERE, label: 'Almost There' },
  { status: REQUEST_STATUS.LOOKING_FOR_PATIENT, label: 'Looking for Patient' },
  { status: REQUEST_STATUS.RECEIVED_PATIENT, label: 'Patient Received' },
  { status: REQUEST_STATUS.DROPPING_OFF, label: 'Dropping Off' },
  { status: REQUEST_STATUS.COMPLETED, label: 'Complete Journey' }
];

const STATUS_DESCRIPTIONS = {
  [REQUEST_STATUS.PENDING]: 'Waiting for driver to accept the request',
  [REQUEST_STATUS.ACCEPTED]: 'You have accepted the request. Please start your journey when ready.',
  [REQUEST_STATUS.STARTED_JOURNEY]: 'You have started your journey to the patient',
  [REQUEST_STATUS.ON_THE_WAY]: 'You are on your way to the patient',
  [REQUEST_STATUS.ALMOST_THERE]: 'You are approaching the patient\'s location',
  [REQUEST_STATUS.LOOKING_FOR_PATIENT]: 'You have arrived at the location and are looking for the patient',
  [REQUEST_STATUS.RECEIVED_PATIENT]: 'You have picked up the patient',
  [REQUEST_STATUS.DROPPING_OFF]: 'You are taking the patient to their destination',
  [REQUEST_STATUS.COMPLETED]: 'The journey has been completed',
  [REQUEST_STATUS.CANCELLED]: 'The request has been cancelled'
};

const EmergencyDriverDashboard = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [requests, setRequests] = useState([]);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [showStatusGuide, setShowStatusGuide] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Connect to WebSocket
    console.log('Connecting to WebSocket from Driver Dashboard...');
    websocketService.connect();

    // Authenticate driver immediately (supports both _id and id)
    const driverId = userData?._id || userData?.id;
    const authAsDriver = () => {
      if (websocketService.socket?.connected && driverId) {
        console.log('Authenticating driver with Socket.IO');
        websocketService.socket.emit('authenticate', {
          userId: driverId,
          userType: 'driver'
        });
      }
    };
    if (websocketService.socket?.connected) {
      authAsDriver();
    } else {
      websocketService.socket?.on('connect', authAsDriver);
    }

    // Subscribe to new requests
    const newRequestSubscription = websocketService.subscribe('new_request', (data) => {
      console.log('Received new request in driver dashboard:', data);
      setRequests(prev => {
        // Check if request already exists
        if (prev.some(req => req.id === data.id)) {
          console.log('Request already exists, skipping:', data.id);
          return prev;
        }
        console.log('Adding new request to state:', data);
        return [...prev, { ...data, status: 'pending' }];
      });
    });

    // Subscribe to request status updates
    const statusUpdateSubscription = websocketService.subscribe('request_status_update', (data) => {
      console.log('Received status update in driver dashboard:', data);
      setRequests(prev => 
        prev.map(req => 
          req.id === data.requestId ? { ...req, status: data.status } : req
        )
      );
      if (currentRequest?.id === data.requestId) {
        setCurrentRequest(prev => ({ ...prev, status: data.status }));
      }
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket subscriptions');
      websocketService.unsubscribe('new_request', newRequestSubscription);
      websocketService.unsubscribe('request_status_update', statusUpdateSubscription);
      websocketService.socket?.off?.('connect', authAsDriver);
    };
  }, []);

  const handleAcceptRequest = async (request) => {
    setIsLoading(true);
    try {
      console.log('Accepting request:', request);
      const driverInfo = {
        id: user?.id || 'test-driver-id',
        name: user?.name || 'Test Driver',
        phone: user?.phone || '1234567890',
        vehicleType: user?.vehicleType || 'standard',
        vehicleNumber: user?.vehicleNumber || 'TEST-123',
        location: user?.location || 'Unknown'
      };

      const acceptData = {
        requestId: request.id,
        driverId: driverInfo.id,
        driver: driverInfo,
        status: 'accepted',
        timestamp: new Date().toISOString()
      };

      console.log('Sending accept request with data:', acceptData);
      await websocketService.send('accept_request', acceptData);

      // Also send a request status update
      const statusUpdate = {
        requestId: request.id,
        status: 'accepted',
        driver: driverInfo,
        timestamp: new Date().toISOString()
      };
      console.log('Sending request status update:', statusUpdate);
      await websocketService.send('request_status_update', statusUpdate);

      setCurrentRequest({ ...request, status: 'accepted', driverInfo });
      setRequests(prev => prev.filter(req => req.id !== request.id));
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = (request) => {
    console.log('Rejecting request:', request);
    try {
      websocketService.send('reject_request', {
        requestId: request.id,
        driverId: user?.id || 'test-driver-id'
      });
      setRequests(prev => prev.filter(req => req.id !== request.id));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const updateRequestStatus = async (newStatus) => {
    if (!currentRequest) return;

    try {
      setIsLoading(true);
      const statusUpdate = {
        requestId: currentRequest.id,
        status: newStatus,
        timestamp: new Date().toISOString(),
        driver: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          vehicleType: user.vehicleType,
          vehicleNumber: user.vehicleNumber,
          location: user.location,
          status: newStatus
        }
      };

      console.log('Sending status update:', statusUpdate);
      await websocketService.send('request_status_update', statusUpdate);

      // Update local state
      setCurrentRequest(prev => {
        const updated = {
          ...prev,
          status: newStatus,
          lastUpdate: new Date().toISOString(),
          driverInfo: {
            ...prev.driverInfo,
            ...statusUpdate.driver
          }
        };
        console.log('Updated current request:', updated);
        return updated;
      });

      // Also update in requests list if it exists there
      setRequests(prev => 
        prev.map(req => 
          req.id === currentRequest.id 
            ? { ...req, status: newStatus }
            : req
        )
      );

      // Update driver status
      await updateDriverStatus(newStatus);
    } catch (error) {
      console.error('Error updating request status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDriverStatus = async (status) => {
    if (!currentRequest) return;

    try {
      const driverStatus = {
        driverId: user.id,
        requestId: currentRequest.id,
        status,
        location: user.location,
        timestamp: new Date().toISOString(),
        driver: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          vehicleType: user.vehicleType,
          vehicleNumber: user.vehicleNumber,
          location: user.location,
          status
        }
      };

      console.log('Sending driver status update:', driverStatus);
      await websocketService.send('driver_status_update', driverStatus);
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = STATUS_FLOW.findIndex(step => step.status === currentStatus);
    return currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;
  };

  const getStatusProgress = (currentStatus) => {
    const currentIndex = STATUS_FLOW.findIndex(step => step.status === currentStatus);
    return ((currentIndex + 1) / STATUS_FLOW.length) * 100;
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  return (
    <div className="emergency-dashboard">
      <div className="dashboard-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-card"
        >
          <div className="dashboard-header">
            <motion.h1 
              className="dashboard-title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Driver Dashboard
            </motion.h1>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={toggleOnlineStatus}
                className={`online-status ${isOnline ? 'online' : 'offline'}`}
              >
                <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </motion.div>
          </div>

          <AnimatePresence>
            {currentRequest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className={`request-card ${isLoading ? 'loading' : ''}`}>
                  <div className="request-header">
                    <h2 className="dashboard-title">Active Emergency</h2>
                    <div className="flex items-center space-x-2">
                      <motion.span
                        key={currentRequest.status}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`status-badge ${currentRequest.status}`}
                      >
                        {STATUS_LABELS[currentRequest.status] || currentRequest.status}
                      </motion.span>
                      <button
                        onClick={() => setShowStatusGuide(!showStatusGuide)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showStatusGuide && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50 p-4 rounded-lg mb-4"
                      >
                        <p className="text-sm text-blue-800">
                          {STATUS_DESCRIPTIONS[currentRequest.status]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar"
                      style={{ width: `${getStatusProgress(currentRequest.status)}%` }}
                    />
                    <div className="progress-steps">
                      {STATUS_FLOW.map((step, index) => (
                        <motion.div
                          key={step.status}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`progress-step ${
                            STATUS_FLOW.findIndex(s => s.status === currentRequest.status) >= index
                              ? 'completed'
                              : ''
                          }`}
                        >
                          <span className="step-dot" />
                          <span className="step-label">{step.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="request-info"
                    >
                      <UserIcon className="request-info-icon" />
                      <div className="request-info-content">
                        <p className="request-info-label">Patient Information</p>
                        <p className="request-info-value">{currentRequest.patientInfo?.name || 'Anonymous'}</p>
                        <p className="request-info-value">{currentRequest.patientInfo?.phone || 'N/A'}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="request-info"
                    >
                      <MapPinIcon className="request-info-icon" />
                      <div className="request-info-content">
                        <p className="request-info-label">Location</p>
                        <p className="request-info-value">{currentRequest.location}</p>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="request-info"
                    >
                      <TruckIcon className="request-info-icon" />
                      <div className="request-info-content">
                        <p className="request-info-label">Emergency Type</p>
                        <p className="request-info-value capitalize">{currentRequest.emergencyType}</p>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="request-info"
                    >
                      <PhoneIcon className="request-info-icon" />
                      <div className="request-info-content">
                        <p className="request-info-label">Description</p>
                        <p className="request-info-value">{currentRequest.description}</p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="dashboard-title mb-4">Update Status</h3>
                    <div className="action-buttons">
                      {currentRequest.status === REQUEST_STATUS.ACCEPTED && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateRequestStatus(REQUEST_STATUS.STARTED_JOURNEY)}
                          className="btn btn-primary"
                          disabled={isLoading}
                        >
                          Start Journey
                        </motion.button>
                      )}
                      {currentRequest.status !== REQUEST_STATUS.ACCEPTED && 
                       currentRequest.status !== REQUEST_STATUS.COMPLETED && 
                       currentRequest.status !== REQUEST_STATUS.CANCELLED && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const nextStatus = getNextStatus(currentRequest.status);
                            if (nextStatus) {
                              updateRequestStatus(nextStatus.status);
                            }
                          }}
                          className="btn btn-primary"
                          disabled={isLoading}
                        >
                          {getNextStatus(currentRequest.status)?.label || 'Complete Journey'}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <h2 className="dashboard-title">Emergency Requests</h2>
            
            {requests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-gray-500">No pending requests</p>
                {!isOnline && (
                  <p className="text-sm text-red-500 mt-2">
                    You are currently offline. Toggle your status to receive requests.
                  </p>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {requests.map((request) => (
                    <motion.div
                      key={`${request.id}-${request.timestamp}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="request-card"
                    >
                      <div className="request-header">
                        <span className="status-badge status-badge-pending">
                          {request.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(request.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="request-info"
                        >
                          <UserIcon className="request-info-icon" />
                          <div className="request-info-content">
                            <p className="request-info-label">Patient</p>
                            <p className="request-info-value">{request.patientInfo?.name || 'Anonymous'}</p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="request-info"
                        >
                          <MapPinIcon className="request-info-icon" />
                          <div className="request-info-content">
                            <p className="request-info-label">Location</p>
                            <p className="request-info-value">{request.location}</p>
                          </div>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="request-info"
                        >
                          <TruckIcon className="request-info-icon" />
                          <div className="request-info-content">
                            <p className="request-info-label">Emergency Type</p>
                            <p className="request-info-value capitalize">{request.emergencyType}</p>
                          </div>
                        </motion.div>
                      </div>
                      
                      <div className="action-buttons">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAcceptRequest(request)}
                          className="btn btn-primary flex-1"
                          disabled={isLoading}
                        >
                          <CheckIcon className="h-5 w-5 mr-2" />
                          Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRejectRequest(request)}
                          className="btn btn-danger flex-1"
                          disabled={isLoading}
                        >
                          <XMarkIcon className="h-5 w-5 mr-2" />
                          Reject
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmergencyDriverDashboard; 