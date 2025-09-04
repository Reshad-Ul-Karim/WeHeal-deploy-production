import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, PhoneIcon, TruckIcon, XMarkIcon, ClockIcon, UserIcon, ExclamationTriangleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { websocketService } from '../../services/emergencyWebsocket';
import { orderAPI } from '../../services/marketplaceAPI';
import PatientTrackingMap from '../../components/maps/PatientTrackingMap';
// import NewPaymentGateway from '../../components/payments/NewPaymentGateway.jsx';
import '../../styles/EmergencyDashboard.css';
import '../../styles/maps.css';

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

const EmergencyPatientDashboard = () => {
  const navigate = useNavigate();
  const [requestData, setRequestData] = useState({
    location: '',
    description: '',
    emergencyType: 'cardiac',
    ambulanceCategory: 'standard'
  });
  const [activeRequest, setActiveRequest] = useState(null);
  const [canRequest, setCanRequest] = useState(true);
  const [cancelTimeout, setCancelTimeout] = useState(null);
  const [user, setUser] = useState(null);
  const [showStatusGuide, setShowStatusGuide] = useState(true);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [patientLocation, setPatientLocation] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [rideCompleted, setRideCompleted] = useState(false);
  const [rideDetails, setRideDetails] = useState(null);

  useEffect(() => {
    // Load user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData || {
      id: 'anonymous',
      name: 'Anonymous',
      phone: 'N/A',
      age: 'N/A'
    });

    // Load existing emergency payments
    const existingPayments = JSON.parse(localStorage.getItem('emergencyPayments') || '[]');
    const userPayments = existingPayments.filter(payment => 
      payment.patientId === (userData?._id || userData?.id || 'anonymous')
    );
    
    // If there are completed payments, show them
    if (userPayments.length > 0) {
      console.log('Found existing emergency payments:', userPayments);
    }

    websocketService.connect();

    const handleRequestStatusUpdate = (message) => {
      const data = message.data || message;
      if (data) {
        const { status, driver, timestamp, requestId } = data;
        
        // Only process if this is for our active request
        if (activeRequest && (requestId === activeRequest.id || requestId === activeRequest.data?.id)) {
          // Update request status
          setRequestStatus(status);
          
          // Update driver info if available
          if (driver) {
            setDriverInfo(driver);
            
            // Request location sharing permission when driver accepts
            if (status === 'accepted') {
              setTimeout(() => {
                console.log('Requesting location permission for real-time tracking');
                websocketService.send('location:request-permission', { requestId: requestId || activeRequest.id });
              }, 1000);
            }
          }

          // Update active request with new status and timestamp
          setActiveRequest(prev => {
            const updated = {
              ...prev,
              status,
              driverInfo: driver || prev.driverInfo,
              lastUpdate: timestamp || new Date().toISOString()
            };
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
              // Ride completed - prepare for payment
              setRideCompleted(true);
              
              // Calculate ride details for payment
              const rideStartTime = activeRequest?.timestamp || new Date().toISOString();
              const rideEndTime = new Date().toISOString();
              const rideDuration = Math.round((new Date(rideEndTime) - new Date(rideStartTime)) / 60000); // minutes
              
              // Mock distance calculation (in production, this would come from GPS tracking)
              const mockDistance = Math.floor(Math.random() * 20 + 5); // 5-25 km
              
              setRideDetails({
                startTime: rideStartTime,
                endTime: rideEndTime,
                duration: rideDuration,
                distance: mockDistance,
                ambulanceType: requestData.ambulanceCategory,
                emergencyType: requestData.emergencyType
              });
              
              // Calculate initial payment amount
              const categoryPrice = AMBULANCE_CATEGORIES[requestData.ambulanceCategory]?.price || 1000;
              const distanceCharge = Math.floor(mockDistance * 50); // 50 BDT per km
              const timeCharge = rideDuration > 30 ? 200 : 0; // Additional 200 BDT for rides > 30 min
              const initialAmount = categoryPrice + distanceCharge + timeCharge;
              
              setPaymentAmount(initialAmount);
              
              // Don't clear active request yet - wait for payment
              break;
            case REQUEST_STATUS.cancelled:
              setActiveRequest(null);
              setDriverInfo(null);
              setRequestStatus(null);
              setEstimatedArrivalTime(null);
              setRideCompleted(false);
              setRideDetails(null);
              break;
            default:
              break;
          }
        }
      }
    };

    const handleDriverStatusUpdate = (message) => {
      const data = message.data || message;
      if (data) {
        const { driver, status, timestamp, requestId } = data;
        
        // Only process if this is for our active request
        if (activeRequest && (requestId === activeRequest.id || requestId === activeRequest.data?.id)) {
          // Update driver info with new status
          if (driver) {
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
            return updated;
          });

          // Update request status if provided
          if (status) {
            setRequestStatus(status);
          }
        }
      }
    };

    // Subscribe to WebSocket events
    websocketService.subscribe('request_status_update', handleRequestStatusUpdate);
    websocketService.subscribe('driver_status_update', handleDriverStatusUpdate);
    websocketService.subscribe('accept_request', handleRequestStatusUpdate); // Also handle accept_request messages

    // Subscribe to location updates from driver
    const handleLocationReceived = (data) => {
      console.log('Received location update in patient dashboard:', data);
      if (activeRequest?.id === data.requestId && data.userType === 'driver') {
        const locationData = {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          accuracy: data.location.accuracy,
          timestamp: data.timestamp,
          heading: data.location.heading,
          speed: data.location.speed
        };
        setDriverLocation(locationData);
        
        // Also update the active request with driver location
        setActiveRequest(prev => ({
          ...prev,
          driverLocation: locationData
        }));
      }
    };

    // Subscribe to location permission events
    const handleLocationPermissionGranted = (data) => {
      console.log('Location permission granted in patient dashboard:', data);
      if (activeRequest?.id === data.requestId) {
        console.log('Location sharing is now available for this request');
      }
    };

    // Subscribe to tracking active events
    const handleTrackingActive = (data) => {
      console.log('Location tracking is now active in patient dashboard:', data);
      if (activeRequest?.id === data.requestId) {
        console.log('Real-time tracking is active between driver and patient');
      }
    };

    websocketService.subscribe('location:received', handleLocationReceived);
    websocketService.subscribe('location:permission-granted', handleLocationPermissionGranted);
    websocketService.subscribe('location:tracking-active', handleTrackingActive);

    return () => {
      websocketService.unsubscribe('request_status_update', handleRequestStatusUpdate);
      websocketService.unsubscribe('driver_status_update', handleDriverStatusUpdate);
      websocketService.unsubscribe('accept_request', handleRequestStatusUpdate);
      websocketService.unsubscribe('location:received', handleLocationReceived);
      websocketService.unsubscribe('location:permission-granted', handleLocationPermissionGranted);
      websocketService.unsubscribe('location:tracking-active', handleTrackingActive);
    };
  }, [activeRequest?.id, activeRequest, requestData.ambulanceCategory, requestData.emergencyType]); // Include all dependencies

  // const resetRequest = () => {
  //   setIsRequestSent(false);
  //   setActiveRequest(null);
  //   setDriverInfo(null);
  //   setRequestStatus(null);
  //   setCanRequest(true);
  //   if (cancelTimeout) {
  //     clearTimeout(cancelTimeout);
  //     setCancelTimeout(null);
  //   }
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlaceRequest = async (e) => {
    e.preventDefault();
    if (!canRequest) return;

    setIsRequestSent(true);
    setCanRequest(false);

    const newRequest = {
      id: crypto.randomUUID(),
      ...requestData,
      timestamp: new Date().toISOString(),
      patientId: user?._id || user?.id || 'anonymous',
      patientInfo: {
        patientId: user?._id || user?.id || 'anonymous',
        name: user?.name || 'Anonymous',
        phone: user?.phone || 'N/A',
        age: user?.age || 'N/A'
      },
      status: 'pending'
    };

    try {
      // Ensure authenticated before sending the request
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const uId = u?._id || u?.id;
        const uType = (u?.role || 'patient').toString().toLowerCase();
        if (websocketService.socket?.connected && uId) {
          websocketService.authenticate(uId, uType);
        }
      } catch (_) {}
      websocketService.send('new_request', newRequest);
      setActiveRequest(newRequest);
    } catch (error) {
      setIsRequestSent(false);
      setCanRequest(true);
    }

    const timeout = setTimeout(() => {
      setCanRequest(true);
    }, 5 * 60 * 1000);
    setCancelTimeout(timeout);
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
      websocketService.send('cancel_request', cancelData);
      setActiveRequest(null);
      setEstimatedArrivalTime(null);
      
      // Clear the cancel timeout
      if (cancelTimeout) {
        clearTimeout(cancelTimeout);
        setCancelTimeout(null);
      }
    } catch (error) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    console.log('Payment button clicked!');
    console.log('Current rideDetails:', rideDetails);
    console.log('Current requestData:', requestData);
    
    // Calculate payment amount based on ambulance category and ride details
    const categoryPrice = AMBULANCE_CATEGORIES[requestData.ambulanceCategory]?.price || 1000;
    
    // Calculate additional charges based on ride details
    let additionalCharges = 0;
    if (rideDetails) {
      // Add distance-based charges (mock calculation)
      const distance = rideDetails.distance || 5; // Default 5km
      additionalCharges = Math.floor(distance * 50); // 50 BDT per km
      
      // Add time-based charges for long rides
      if (rideDetails.duration > 30) { // More than 30 minutes
        additionalCharges += 200; // Additional 200 BDT
      }
    }
    
    const calculatedAmount = categoryPrice + additionalCharges;
    console.log('Calculated payment amount:', calculatedAmount);
    
    setPaymentAmount(calculatedAmount);
    setShowPaymentModal(true);
    
    console.log('Payment modal state set to:', true);
    console.log('showPaymentModal should now be:', true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      setIsLoading(true);
      
      console.log('Payment successful, creating order (marketplace approach):', paymentData);
      
      // Use the EXACT same approach as marketplace - create order after payment
      const orderPayload = {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentType: 'emergency_ambulance',
        transactionId: paymentData.transactionId,
        items: [{
          type: 'emergency_ambulance',
          serviceId: activeRequest.id,
          name: 'Emergency Ambulance Service',
          description: `Emergency ambulance service - ${requestData.ambulanceCategory}`,
          quantity: 1,
          price: paymentAmount,
          rideDetails: rideDetails,
          ambulanceCategory: requestData.ambulanceCategory,
          patientInfo: {
            name: user?.name || 'Anonymous',
            id: user?._id || user?.id || 'anonymous'
          }
        }],
        customerInfo: {
          name: user?.name || 'Anonymous',
          phone: user?.phone || 'Emergency Contact',
          email: user?.email
        },
        deliveryInfo: {
          address: rideDetails?.pickupLocation || 'Emergency Location',
          type: 'emergency_service'
        }
      };
      
      console.log('Creating order after payment (marketplace approach):', orderPayload);
      const response = await orderAPI.createOrderAfterPayment(orderPayload);
      
      if (response.success) {
        // Update the request status to reflect payment completion
        setActiveRequest(prev => ({
          ...prev,
          paymentStatus: 'completed',
          paymentDetails: paymentData,
          orderId: response.data.orderId
        }));

        // Show success message
        alert('Payment completed successfully! Your emergency service has been paid for.');
        
        // Close payment modal
        setShowPaymentModal(false);
        
        // Clear ride completion state
        setRideCompleted(false);
        setRideDetails(null);
        
        // Navigate to orders page
        setTimeout(() => {
          navigate('/orders', {
            state: {
              orderCreated: true,
              orderId: response.data.orderId
            }
          });
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Payment was processed but order creation failed. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    // Optionally show a message that payment can be made later
    alert('Payment cancelled. You can make the payment later from your dashboard.');
  };

  const getStatusProgress = (status) => {
    const statusIndex = STATUS_FLOW.findIndex(step => step.status === status);
    if (statusIndex === -1) return 0;
    return ((statusIndex + 1) / STATUS_FLOW.length) * 100;
  };

  // If there's an active request, show the tracking dashboard
  if (activeRequest) {
    return (
      <div className="emergency-dashboard bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6"
          >
            <div className="flex items-center justify-between">
              <motion.h1 
                className="text-2xl font-bold text-gray-900 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <TruckIcon className="w-6 h-6 text-red-600" />
                </div>
                Emergency Service
              </motion.h1>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </motion.button>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full max-w-full">
            {/* Left Column - Request Status & Info */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                {/* Active Request Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${isLoading ? 'animate-pulse' : ''}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ClockIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Active Request</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.span
                        key={activeRequest.status}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                          activeRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          activeRequest.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                          activeRequest.status === 'on_the_way' ? 'bg-purple-100 text-purple-800' :
                          activeRequest.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STATUS_LABELS[activeRequest.status] || activeRequest.status}
                      </motion.span>
                      <button
                        onClick={() => setShowStatusGuide(!showStatusGuide)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ExclamationTriangleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showStatusGuide && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
                      >
                        <p className="text-sm text-blue-800 leading-relaxed">
                          {STATUS_DESCRIPTIONS[activeRequest.status]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Progress Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">
                        {Math.round(getStatusProgress(activeRequest.status))}% Complete
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${getStatusProgress(activeRequest.status)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    
                    {/* Progress Steps - Mobile Responsive */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-4">
                      {STATUS_FLOW.slice(0, 5).map((step, index) => (
                        <motion.div
                          key={step.status}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                            STATUS_FLOW.findIndex(s => s.status === activeRequest.status) >= index
                              ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full mb-2 ${
                            STATUS_FLOW.findIndex(s => s.status === activeRequest.status) >= index
                              ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <span className={`text-xs font-medium leading-tight ${
                            STATUS_FLOW.findIndex(s => s.status === activeRequest.status) >= index
                              ? 'text-blue-700' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </span>
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
                          <p className="request-info-value">
                            <strong>Name:</strong> {activeRequest.driverInfo.name}
                          </p>
                          <p className="request-info-value">
                            <strong>Mobile:</strong> {activeRequest.driverInfo.phone}
                          </p>
                          <p className="request-info-value">
                            <strong>Car Registration:</strong> {activeRequest.driverInfo.carRegistration || 'N/A'}
                          </p>
                          <p className="request-info-value">
                            <strong>Ambulance Type:</strong> {activeRequest.driverInfo.ambulanceType || activeRequest.driverInfo.vehicleType || 'N/A'}
                          </p>
                          <p className="request-info-value">
                            <strong>Chassis Number:</strong> {activeRequest.driverInfo.chassisNumber || 'N/A'}
                          </p>
                          <p className="request-info-value">
                            <strong>Vehicle:</strong> {activeRequest.driverInfo.vehicleType} - {activeRequest.driverInfo.vehicleNumber}
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

                    {/* Ride Completion Status */}
                    {rideCompleted && activeRequest.status === 'completed' && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="request-info bg-green-50 border border-green-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <TruckIcon className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-green-800 font-semibold">Ride Completed!</p>
                            <p className="text-green-600 text-sm">
                              Your emergency service has been completed. Please proceed to payment.
                            </p>
                            {rideDetails && (
                              <div className="mt-2 text-xs text-green-700">
                                Duration: {rideDetails.duration} min • Distance: {rideDetails.distance} km
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Payment Status */}
                    {activeRequest.paymentStatus === 'completed' && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="request-info bg-emerald-50 border border-emerald-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CreditCardIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-emerald-800 font-semibold">Payment Completed</p>
                            <p className="text-emerald-600 text-sm">
                              Thank you! Your emergency service payment has been processed successfully.
                            </p>
                            {activeRequest.paymentDetails && (
                              <div className="mt-2 text-xs text-emerald-700">
                                Amount: ৳{activeRequest.paymentDetails.amount} • Method: {activeRequest.paymentDetails.paymentMethod}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="action-buttons">
                      {/* Payment Button - Show when ride is completed */}
                      {rideCompleted && activeRequest.status === 'completed' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePayment}
                          className="btn btn-primary"
                          disabled={isLoading}
                        >
                          <CreditCardIcon className="h-5 w-5 mr-2" />
                          Pay for Service (৳{paymentAmount || 'Calculating...'})
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
              </motion.div>

              {/* Real-Time Map Tracking */}
              {activeRequest.driverInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
                >
                  <PatientTrackingMap
                    requestId={activeRequest.id}
                    driverLocation={driverLocation || activeRequest.driverLocation}
                    driverInfo={activeRequest.driverInfo}
                    onLocationUpdate={(location) => {
                      console.log('Patient location updated:', location);
                      setPatientLocation(location);
                    }}
                    height="500px"
                    className="w-full"
                  />
                </motion.div>
              )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Right Column - Additional Info or Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Emergency Info</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Estimated Time</p>
                      <p className="font-semibold">
                        {estimatedArrivalTime 
                          ? `${Math.round((estimatedArrivalTime - new Date()) / 60000)} min`
                          : 'Calculating...'
                        }
                      </p>
                    </div>
                  </div>
                  {activeRequest.driverInfo && (
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Driver</p>
                        <p className="font-semibold">{activeRequest.driverInfo.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the form for new requests
  return (
    <div className="emergency-dashboard">
      <div className="dashboard-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-card"
        >
          <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <motion.h1 
              className="dashboard-title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Emergency Service
            </motion.h1>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>

          <AnimatePresence>
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
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Custom Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Emergency Service Payment</h2>
                  <button
                    onClick={handlePaymentCancel}
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-blue-100">Amount to Pay: ৳{paymentAmount}</p>
                  <p className="text-blue-100 text-sm">Payment Type: Emergency Service</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Ride Summary */}
                {rideDetails && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Ride Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600 font-medium">Duration</p>
                        <p className="text-blue-900">{rideDetails.duration} minutes</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Distance</p>
                        <p className="text-blue-900">{rideDetails.distance} km</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Ambulance Type</p>
                        <p className="text-blue-900">{rideDetails.ambulanceType}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Emergency Type</p>
                        <p className="text-blue-900">{rideDetails.emergencyType}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Amount */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium">Total Amount</p>
                      <p className="text-3xl font-bold text-green-900">৳{paymentAmount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">Emergency Service Fee</p>
                      <p className="text-sm text-green-600">Includes ambulance, fuel, and service charges</p>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Select Payment Method</h3>
                  
                  {/* Mobile Banking */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <PhoneIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Mobile Banking</h4>
                        <p className="text-sm text-gray-600">bKash, Nagad, Q Cash</p>
                      </div>
                      <div className="text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card Payment */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CreditCardIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Card Payment</h4>
                        <p className="text-sm text-gray-600">Credit/Debit Card</p>
                      </div>
                      <div className="text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Bank Transfer</h4>
                        <p className="text-sm text-gray-600">Online Banking</p>
                      </div>
                      <div className="text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handlePaymentCancel}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Simulate successful payment
                      const mockPaymentData = {
                        orderId: `WH-${Math.random().toString(36).substr(2, 9)}`,
                        status: 'completed',
                        amount: paymentAmount,
                        paymentType: 'emergency_service',
                        paymentMethod: 'mobile_banking',
                        details: {
                          mobileMethod: 'bKash',
                          mobileNumber: '01XXXXXXXXX',
                          pin: '****'
                        },
                        loyaltyPoints: Math.floor(paymentAmount / 100) * 2,
                        timestamp: new Date().toISOString()
                      };
                      handlePaymentSuccess(mockPaymentData);
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Pay Now (৳{paymentAmount})
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmergencyPatientDashboard; 
