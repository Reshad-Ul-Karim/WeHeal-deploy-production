import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, PhoneIcon, TruckIcon, XMarkIcon, ClockIcon, CurrencyDollarIcon, UserIcon, ExclamationTriangleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { websocketService } from '../services/websocket';
import '../styles/EmergencyDashboard.css';

const AMBULANCE_CATEGORIES = {
  standard: {
    name: 'Standard Ambulance',
    description: 'Basic life support ambulance',
    price: 1000,
    estimatedTime: '15-20 mins'
  },
  vip: {
    name: 'VIP Ambulance',
    description: 'Premium ambulance with advanced care',
    price: 2000,
    estimatedTime: '10-15 mins'
  },
  critical: {
    name: 'Critical Care Ambulance',
    description: 'Fully equipped critical care ambulance',
    price: 3000,
    estimatedTime: '5-10 mins'
  }
};

const REQUEST_STATUS = {
  pending: 'pending',
  accepted: 'accepted',
  started_journey: 'started_journey',
  on_the_way: 'on_the_way',
  almost_there: 'almost_there',
  looking_for_patient: 'looking_for_patient',
  received_patient: 'received_patient',
  dropping_off: 'dropping_off',
  completed: 'completed',
  cancelled: 'cancelled'
};

const STATUS_LABELS = {
  [REQUEST_STATUS.pending]: 'Searching for Driver',
  [REQUEST_STATUS.accepted]: 'Driver Found',
  [REQUEST_STATUS.started_journey]: 'Driver Started Journey',
  [REQUEST_STATUS.on_the_way]: 'Driver on the Way',
  [REQUEST_STATUS.almost_there]: 'Driver Almost There',
  [REQUEST_STATUS.looking_for_patient]: 'Driver Looking for You',
  [REQUEST_STATUS.received_patient]: 'Driver Received You',
  [REQUEST_STATUS.dropping_off]: 'Dropping Off',
  [REQUEST_STATUS.completed]: 'Journey Completed',
  [REQUEST_STATUS.cancelled]: 'Request Cancelled'
};

const STATUS_DESCRIPTIONS = {
  [REQUEST_STATUS.pending]: 'We are searching for a driver to assist you',
  [REQUEST_STATUS.accepted]: 'A driver has accepted your request and is on their way',
  [REQUEST_STATUS.started_journey]: 'Your driver has started their journey to your location',
  [REQUEST_STATUS.on_the_way]: 'Your driver is on their way to your location',
  [REQUEST_STATUS.almost_there]: 'Your driver is approaching your location',
  [REQUEST_STATUS.looking_for_patient]: 'Your driver has arrived and is looking for you',
  [REQUEST_STATUS.received_patient]: 'You have been picked up by the driver',
  [REQUEST_STATUS.dropping_off]: 'You are being taken to your destination',
  [REQUEST_STATUS.completed]: 'Your journey has been completed',
  [REQUEST_STATUS.cancelled]: 'Your request has been cancelled'
};

const STATUS_FLOW = [
  { status: REQUEST_STATUS.pending, label: 'Searching for Driver' },
  { status: REQUEST_STATUS.accepted, label: 'Driver Found' },
  { status: REQUEST_STATUS.started_journey, label: 'Driver Started Journey' },
  { status: REQUEST_STATUS.on_the_way, label: 'Driver on the Way' },
  { status: REQUEST_STATUS.almost_there, label: 'Driver Almost There' },
  { status: REQUEST_STATUS.looking_for_patient, label: 'Driver Looking for You' },
  { status: REQUEST_STATUS.received_patient, label: 'Driver Received You' },
  { status: REQUEST_STATUS.dropping_off, label: 'Dropping Off' },
  { status: REQUEST_STATUS.completed, label: 'Journey Completed' },
  { status: REQUEST_STATUS.cancelled, label: 'Request Cancelled' }
];

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [requestData, setRequestData] = useState({
    location: '',
    description: '',
    emergencyType: 'cardiac',
    ambulanceCategory: 'standard'
  });
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [canRequest, setCanRequest] = useState(true);
  const [cancelTimeout, setCancelTimeout] = useState(null);
  const [user, setUser] = useState(null);
  const [showStatusGuide, setShowStatusGuide] = useState(true);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData || {
      id: 'anonymous',
      name: 'Anonymous',
      phone: 'N/A',
      age: 'N/A'
    });

    websocketService.connect();

    const handleRequestStatusUpdate = (message) => {
      console.log('Received request status update in patient dashboard:', message);
      const data = message.data || message;
      if (data) {
        const { status, driver, timestamp, requestId } = data;
        
        // Only process if this is for our active request
        if (activeRequest && (requestId === activeRequest.id || requestId === activeRequest.data?.id)) {
          console.log('Processing status update for active request:', status);
          
          // Update request status
          setRequestStatus(status);
          
          // Update driver info if available
          if (driver) {
            console.log('Updating driver info:', driver);
            setDriverInfo(driver);
          }

          // Update active request with new status and timestamp
          setActiveRequest(prev => {
            const updated = {
              ...prev,
              status,
              driverInfo: driver || prev.driverInfo,
              lastUpdate: timestamp || new Date().toISOString()
            };
            console.log('Updated active request:', updated);
            return updated;
          });

          // Update estimated arrival time based on status
          switch (status) {
            case REQUEST_STATUS.accepted:
              setEstimatedArrivalTime(new Date(Date.now() + 15 * 60000)); // 15 minutes
              break;
            case REQUEST_STATUS.started_journey:
              setEstimatedArrivalTime(new Date(Date.now() + 12 * 60000)); // 12 minutes
              break;
            case REQUEST_STATUS.on_the_way:
              setEstimatedArrivalTime(new Date(Date.now() + 10 * 60000)); // 10 minutes
              break;
            case REQUEST_STATUS.almost_there:
              setEstimatedArrivalTime(new Date(Date.now() + 5 * 60000)); // 5 minutes
              break;
            case REQUEST_STATUS.looking_for_patient:
              setEstimatedArrivalTime(new Date(Date.now() + 2 * 60000)); // 2 minutes
              break;
            case REQUEST_STATUS.received_patient:
              setEstimatedArrivalTime(null); // Clear ETA as patient is picked up
              break;
            case REQUEST_STATUS.dropping_off:
              setEstimatedArrivalTime(new Date(Date.now() + 10 * 60000)); // 10 minutes to destination
              break;
            case REQUEST_STATUS.completed:
            case REQUEST_STATUS.cancelled:
              console.log('Resetting request state due to completion/cancellation');
              setActiveRequest(null);
              setDriverInfo(null);
              setRequestStatus(null);
              setEstimatedArrivalTime(null);
              break;
          }
        }
      }
    };

    const handleDriverStatusUpdate = (message) => {
      console.log('Received driver status update in patient dashboard:', message);
      const data = message.data || message;
      if (data) {
        const { driver, status, timestamp, requestId } = data;
        
        // Only process if this is for our active request
        if (activeRequest && (requestId === activeRequest.id || requestId === activeRequest.data?.id)) {
          console.log('Processing driver status update for active request:', status);
          
          // Update driver info with new status
          if (driver) {
            console.log('Updating driver info from status update:', driver);
            setDriverInfo(driver);
          }

          // Update active request with new driver status
          setActiveRequest(prev => {
            const updated = {
              ...prev,
              status: status || prev.status,
              driverInfo: driver || prev.driverInfo,
              lastUpdate: timestamp || new Date().toISOString()
            };
            console.log('Updated active request with driver status:', updated);
            return updated;
          });

          // Update request status if provided
          if (status) {
            setRequestStatus(status);
            
            // Update estimated arrival time based on driver status
            switch (status) {
              case REQUEST_STATUS.started_journey:
                setEstimatedArrivalTime(new Date(Date.now() + 12 * 60000));
                break;
              case REQUEST_STATUS.on_the_way:
                setEstimatedArrivalTime(new Date(Date.now() + 10 * 60000));
                break;
              case REQUEST_STATUS.almost_there:
                setEstimatedArrivalTime(new Date(Date.now() + 5 * 60000));
                break;
              case REQUEST_STATUS.looking_for_patient:
                setEstimatedArrivalTime(new Date(Date.now() + 2 * 60000));
                break;
              case REQUEST_STATUS.received_patient:
                setEstimatedArrivalTime(null);
                break;
              case REQUEST_STATUS.dropping_off:
                setEstimatedArrivalTime(new Date(Date.now() + 10 * 60000));
                break;
              case REQUEST_STATUS.completed:
                setEstimatedArrivalTime(null);
                break;
            }
          }
        }
      }
    };

    // Subscribe to WebSocket events
    websocketService.subscribe('request_status_update', handleRequestStatusUpdate);
    websocketService.subscribe('driver_status_update', handleDriverStatusUpdate);
    websocketService.subscribe('accept_request', handleRequestStatusUpdate); // Also handle accept_request messages

    return () => {
      websocketService.unsubscribe('request_status_update', handleRequestStatusUpdate);
      websocketService.unsubscribe('driver_status_update', handleDriverStatusUpdate);
      websocketService.unsubscribe('accept_request', handleRequestStatusUpdate);
    };
  }, [activeRequest?.id]); // Only depend on activeRequest.id

  const resetRequest = () => {
    setIsRequestSent(false);
    setActiveRequest(null);
    setDriverInfo(null);
    setRequestStatus(null);
    setCanRequest(true);
    if (cancelTimeout) {
      clearTimeout(cancelTimeout);
      setCancelTimeout(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canRequest) return;

    setIsRequestSent(true);
    setCanRequest(false);

    const newRequest = {
      id: crypto.randomUUID(),
      ...requestData,
      timestamp: new Date().toISOString(),
      patientId: user?.id || 'anonymous',
      patientInfo: {
        name: user?.name || 'Anonymous',
        phone: user?.phone || 'N/A',
        age: user?.age || 'N/A'
      },
      status: 'pending'
    };

    console.log('Preparing to send new request:', newRequest);
    
    try {
      websocketService.send('new_request', newRequest);
      console.log('Request sent successfully');
      setActiveRequest(newRequest);
    } catch (error) {
      console.error('Error sending request:', error);
      setIsRequestSent(false);
      setCanRequest(true);
    }

    const timeout = setTimeout(() => {
      setCanRequest(true);
    }, 5 * 60 * 1000);
    setCancelTimeout(timeout);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setIsRequestSent(true);
    // TODO: Implement ambulance request logic
    console.log('Requesting ambulance:', requestData);
    
    // Simulate request creation
    setActiveRequest({
      id: '123',
      status: 'pending',
      location: requestData.location,
      description: requestData.description,
      emergencyType: requestData.emergencyType,
      ambulanceCategory: requestData.ambulanceCategory,
      estimatedTime: AMBULANCE_CATEGORIES[requestData.ambulanceCategory].estimatedTime,
      price: AMBULANCE_CATEGORIES[requestData.ambulanceCategory].price,
      timestamp: new Date().toISOString()
    });
    setIsRequestSent(false);
  };

  const cancelRequest = () => {
    if (!activeRequest) return;

    console.log('Cancelling request:', activeRequest.id);
    websocketService.send('cancel_request', {
      requestId: activeRequest.id,
      patientId: user?.id || 'anonymous'
    });

    resetRequest();
  };

  const handlePayment = async () => {
    // TODO: Implement payment logic
    console.log('Processing payment for request:', activeRequest.id);
  };

  const getStatusProgress = (status) => {
    const statusIndex = STATUS_FLOW.findIndex(step => step.status === status);
    if (statusIndex === -1) return 0;
    return ((statusIndex + 1) / STATUS_FLOW.length) * 100;
  };

  const handlePlaceRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newRequest = {
        id: `req_${Date.now()}`,
        patientInfo: {
          name: user?.name || 'Anonymous',
          phone: user?.phone || 'N/A',
          age: user?.age || 'N/A'
        },
        location: requestData.location,
        emergencyType: requestData.emergencyType,
        description: requestData.description,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      console.log('Placing new request:', newRequest);
      await websocketService.send('new_request', newRequest);
      
      setActiveRequest(newRequest);
      setRequestStatus('pending');
      setRequestData({
        location: '',
        description: '',
        emergencyType: 'cardiac',
        ambulanceCategory: 'standard'
      });
    } catch (error) {
      console.error('Error placing request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRequest) return;
    
    setIsLoading(true);
    try {
      const cancelData = {
        requestId: activeRequest.id,
        status: 'cancelled',
        timestamp: new Date().toISOString()
      };
      
      console.log('Cancelling request:', cancelData);
      await websocketService.send('cancel_request', cancelData);
      
      setActiveRequest(null);
      setRequestStatus(null);
      setDriverInfo(null);
      setEstimatedArrivalTime(null);
    } catch (error) {
      console.error('Error cancelling request:', error);
    } finally {
      setIsLoading(false);
    }
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
              Emergency Service
            </motion.h1>
          </div>

          <AnimatePresence>
            {activeRequest ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className={`request-card ${isLoading ? 'loading' : ''}`}>
                  <div className="request-header">
                    <h2 className="dashboard-title">Active Request</h2>
                    <div className="flex items-center space-x-2">
                      <motion.span
                        key={activeRequest.status}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`status-badge ${activeRequest.status}`}
                      >
                        {STATUS_LABELS[activeRequest.status] || activeRequest.status}
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
                          {STATUS_DESCRIPTIONS[activeRequest.status]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar"
                      style={{ width: `${getStatusProgress(activeRequest.status)}%` }}
                    />
                    <div className="progress-steps">
                      {STATUS_FLOW.map((step, index) => (
                        <motion.div
                          key={step.status}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`progress-step ${
                            STATUS_FLOW.findIndex(s => s.status === activeRequest.status) >= index
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
                      <MapPinIcon className="request-info-icon" />
                      <div className="request-info-content">
                        <p className="request-info-label">Location</p>
                        <p className="request-info-value">{activeRequest.location}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="request-info"
                    >
                      <TruckIcon className="request-info-icon" />
                      <div className="request-info-content">
                        <p className="request-info-label">Emergency Type</p>
                        <p className="request-info-value capitalize">{activeRequest.emergencyType}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="request-info"
                    >
                      <PhoneIcon className="request-info-icon" />
                      <div className="request-info-content">
                        <p className="request-info-label">Description</p>
                        <p className="request-info-value">{activeRequest.description}</p>
                      </div>
                    </motion.div>

                    {activeRequest.driverInfo && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="request-info"
                      >
                        <UserIcon className="request-info-icon" />
                        <div className="request-info-content">
                          <p className="request-info-label">Driver Information</p>
                          <p className="request-info-value">{activeRequest.driverInfo.name}</p>
                          <p className="request-info-value">{activeRequest.driverInfo.phone}</p>
                          <p className="request-info-value">
                            Vehicle: {activeRequest.driverInfo.vehicleType} - {activeRequest.driverInfo.vehicleNumber}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {activeRequest.lastUpdate && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="request-info"
                      >
                        <ClockIcon className="request-info-icon" />
                        <div className="request-info-content">
                          <p className="request-info-label">Last Update</p>
                          <p className="request-info-value">
                            {new Date(activeRequest.lastUpdate).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="action-buttons">
                      {activeRequest.status === 'received_patient' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePayment}
                          className="btn btn-primary"
                          disabled={isLoading}
                        >
                          <CreditCardIcon className="h-5 w-5 mr-2" />
                          Make Payment
                        </motion.button>
                      )}
                      {activeRequest.status !== 'completed' && 
                       activeRequest.status !== 'cancelled' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCancelRequest}
                          className="btn btn-danger"
                          disabled={isLoading}
                        >
                          <XMarkIcon className="h-5 w-5 mr-2" />
                          Cancel Request
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handlePlaceRequest}
                className="form-container"
              >
                <div className="form-row">
                  <div className="form-col">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        value={requestData.location}
                        onChange={handleInputChange}
                        name="location"
                        className="form-input"
                        placeholder="Enter your location"
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="form-label">Emergency Type</label>
                      <select
                        value={requestData.emergencyType}
                        onChange={handleInputChange}
                        name="emergencyType"
                        className="form-select"
                        required
                      >
                        <option value="cardiac">Cardiac</option>
                        <option value="trauma">Trauma</option>
                        <option value="stroke">Stroke</option>
                        <option value="other">Other</option>
                      </select>
                    </motion.div>
                  </div>

                  <div className="form-col">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="form-label">Description</label>
                      <textarea
                        value={requestData.description}
                        onChange={handleInputChange}
                        name="description"
                        className="form-textarea"
                        placeholder="Describe your emergency"
                        required
                      />
                    </motion.div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      Request Emergency Service
                    </span>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default PatientDashboard; 