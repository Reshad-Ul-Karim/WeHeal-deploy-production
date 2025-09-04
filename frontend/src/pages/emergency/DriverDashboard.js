import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, PhoneIcon, TruckIcon, CheckIcon, XMarkIcon, UserIcon, ClockIcon, ExclamationTriangleIcon, CameraIcon, PencilIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { websocketService } from '../../services/emergencyWebsocket';
import { logoutUser, api } from '../../utils/api';
import DriverTrackingMap from '../../components/maps/DriverTrackingMap';
import '../../styles/EmergencyDashboard.css';
import '../../styles/maps.css';

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
  // const [patientLocation, setPatientLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  
  // New state for profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    profileImage: null,
    carRegistrationNumber: '',
    ambulanceType: 'standard',
    chassisNumber: '',
    mobileNumber: ''
  });
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  
  // New state for ride history
  const [rideHistory, setRideHistory] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // New state for ride completion modal
  const [showRideCompletion, setShowRideCompletion] = useState(false);
  const [completedRide, setCompletedRide] = useState(null);

  // New function to fetch ride history
  const fetchRideHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      
      // Get user ID from user object (try both _id and id)
      const userId = user?._id || user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Call the backend API
      const response = await api.get(`/emergency/ride-history?userType=driver&userId=${userId}`);
      
      if (response.data.success) {
        // Transform the API response to match the frontend format
        const transformedRides = response.data.data.rides.map(ride => ({
          id: ride.requestId,
          patientName: ride.patientInfo?.name || 'Unknown Patient',
          pickupLocation: ride.rideDetails?.pickup?.address || 'Unknown Location',
          dropoffLocation: ride.rideDetails?.destination?.address || 'Unknown Location',
          date: new Date(ride.createdAt).toLocaleDateString(),
          time: new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: ride.rideDetails?.metrics?.totalDuration ? `${ride.rideDetails.metrics.totalDuration} mins` : 'N/A',
          distance: ride.rideDetails?.metrics?.totalDistance ? `${ride.rideDetails.metrics.totalDistance} km` : 'N/A',
          fare: ride.rideDetails?.fare?.totalFare || ride.payment?.amount || 0,
          ambulanceType: ride.driverInfo?.vehicleType || 'standard',
          status: ride.status
        }));
        
        setRideHistory(transformedRides);
        
        // Calculate total earnings from the actual data
        const total = transformedRides.reduce((sum, ride) => sum + ride.fare, 0);
        setTotalEarnings(total);
      } else {
        console.error('Failed to fetch ride history:', response.data.message);
        setRideHistory([]);
        setTotalEarnings(0);
      }
      
    } catch (error) {
      console.error('Error fetching ride history:', error);
      // Set empty arrays on error
      setRideHistory([]);
      setTotalEarnings(0);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?._id, user?.id]);

  // Function to fetch driver profile
  const fetchDriverProfile = useCallback(async () => {
    try {
      const response = await api.get('/emergency/driver/profile');
      
      if (response.data.success) {
        const driverProfile = response.data.data;
        console.log('Driver profile fetched:', driverProfile);
        
        // Update user state with driver profile data
        setUser(prevUser => ({
          ...prevUser,
          name: driverProfile.name,
          phone: driverProfile.phone,
          email: driverProfile.email,
          vehicleNumber: driverProfile.vehicleNumber,
          vehicleType: driverProfile.vehicleType,
          chassisNumber: driverProfile.chassisNumber
        }));
        
        // Update profile data with driver profile
        setProfileData({
          profileImage: driverProfile.profileImage || null,
          carRegistrationNumber: driverProfile.carRegistration || driverProfile.vehicleNumber || '',
          ambulanceType: driverProfile.ambulanceType || driverProfile.vehicleType || 'standard',
          chassisNumber: driverProfile.chassisNumber || '',
          mobileNumber: driverProfile.phone || ''
        });
        
        // Update profile image preview
        if (driverProfile.profilePicture) {
          setProfileImagePreview(driverProfile.profilePicture);
        }
      }
    } catch (error) {
      console.error('Error fetching driver profile:', error);
    }
  }, []);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    // Fetch driver profile from backend
    fetchDriverProfile();
    
    // Initialize profile data from user data (will be updated when profile is fetched)
    setProfileData({
      profileImage: userData?.profileImage || null,
      carRegistrationNumber: userData?.vehicleNumber || '',
      ambulanceType: userData?.vehicleType || 'standard',
      chassisNumber: userData?.chassisNumber || '',
      mobileNumber: userData?.phone || ''
    });
    if (userData?.profileImage) {
      setProfileImagePreview(userData.profileImage);
    }

    // Fetch ride history on component mount
    fetchRideHistory();

    // Connect to WebSocket (auto-authentication will happen on connect)
    console.log('Connecting to emergency WebSocket from Driver Dashboard...');
    websocketService.connect();
    
    // Wait for authentication to complete
    const checkAuthentication = () => {
      setTimeout(() => {
        if (websocketService.socket?.connected) {
          console.log('Driver dashboard: Socket connected, waiting for broadcasts...');
        } else {
          console.log('Driver dashboard: Still waiting for socket connection...');
          checkAuthentication();
        }
      }, 1000);
    };
    checkAuthentication();

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

    // Subscribe to location updates from patient
    const locationReceivedSubscription = websocketService.subscribe('location:received', (data) => {
      console.log('Received location update in driver dashboard:', data);
      if (currentRequest?.id === data.requestId && data.userType === 'patient') {
        const locationData = {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          accuracy: data.location.accuracy,
          timestamp: data.timestamp,
          address: data.location.address
        };
        // setPatientLocation(locationData);
        
        // Also update the current request with patient location
        setCurrentRequest(prev => ({
          ...prev,
          patientLocation: locationData
        }));
      }
    });

    // Subscribe to location permission events
    const locationPermissionSubscription = websocketService.subscribe('location:permission-granted', (data) => {
      console.log('Location permission granted:', data);
      if (currentRequest?.id === data.requestId) {
        console.log('Location sharing is now available for this request');
      }
    });

    // Subscribe to tracking active events
    const trackingActiveSubscription = websocketService.subscribe('location:tracking-active', (data) => {
      console.log('Location tracking is now active:', data);
      if (currentRequest?.id === data.requestId) {
        console.log('Real-time tracking is active between driver and patient');
      }
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket subscriptions');
      websocketService.unsubscribe('new_request', newRequestSubscription);
      websocketService.unsubscribe('request_status_update', statusUpdateSubscription);
      websocketService.unsubscribe('location:received', locationReceivedSubscription);
      websocketService.unsubscribe('location:permission-granted', locationPermissionSubscription);
      websocketService.unsubscribe('location:tracking-active', trackingActiveSubscription);
      // No need to remove connect listener for WebSocket
    };
  }, [currentRequest?.id, fetchRideHistory]);

  const handleAcceptRequest = async (request) => {
    setIsLoading(true);
    try {
      console.log('Accepting request:', request);
      const driverInfo = {
        id: user?.id || 'test-driver-id',
        name: user?.name || 'Test Driver',
        phone: profileData.mobileNumber || user?.phone || '1234567890',
        vehicleType: profileData.ambulanceType || 'standard',
        vehicleNumber: profileData.carRegistrationNumber || 'TEST-123',
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

      // Request location sharing permission after accepting
      setTimeout(() => {
        console.log('Requesting location permission for real-time tracking');
        websocketService.send('location:request-permission', { requestId: request.id });
      }, 1000);
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
          phone: profileData.mobileNumber || user.phone,
          vehicleType: profileData.ambulanceType,
          vehicleNumber: profileData.carRegistrationNumber,
          location: user.location,
          status: newStatus
        }
      };

      console.log('Sending status update:', statusUpdate);
      await websocketService.send('request_status_update', statusUpdate);

      // If starting journey, save to backend
      if (newStatus === REQUEST_STATUS.STARTED_JOURNEY) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch(`/api/emergency/ride/${currentRequest.id}/start`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                pickupLocation: {
                  address: currentRequest.location,
                  latitude: currentRequest.location?.latitude || 0,
                  longitude: currentRequest.location?.longitude || 0
                },
                estimatedPickupTime: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
              })
            });
            
            const data = await response.json();
            if (!data.success) {
              console.error('Failed to save ride start:', data.message);
            }
          } catch (error) {
            console.error('Error saving ride start:', error);
          }
        }
      }

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

  // Function to update driver status
  const updateDriverStatus = async (status) => {
    try {
      // Update driver status in WebSocket
      const driverStatusUpdate = {
        driverId: user.id,
        status: status,
        timestamp: new Date().toISOString(),
        location: driverLocation || user.location
      };
      
      await websocketService.send('driver_status_update', driverStatusUpdate);
      console.log('Driver status updated:', driverStatusUpdate);
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  };

  // Function to handle status updates (unused - keeping for future reference)
  // const handleStatusUpdate = async (status) => {
  //   if (!currentRequest) return;

  //   try {
  //     setIsLoading(true);
  //     const statusUpdate = {
  //       requestId: currentRequest.id,
  //       status: status,
  //       timestamp: new Date().toISOString(),
  //       driver: {
  //         id: user.id,
  //         name: user.name,
  //         phone: profileData.mobileNumber || user.phone,
  //         vehicleType: profileData.ambulanceType,
  //         vehicleNumber: profileData.carRegistrationNumber,
  //         location: user.location,
  //         status: status
  //       }
  //     };

  //     console.log('Sending status update:', statusUpdate);
  //     await websocketService.send('request_status_update', statusUpdate);

  //     // Update local state
  //     setCurrentRequest(prev => {
  //       const updated = {
  //         ...prev,
  //         status: status,
  //         lastUpdate: new Date().toISOString(),
  //         driverInfo: {
  //           ...prev.driverInfo,
  //           ...statusUpdate.driver
  //         }
  //       };
  //       console.log('Updated current request:', updated);
  //       return updated;
  //     });

  //     // Also update in requests list if it exists there
  //     setRequests(prev => 
  //       prev.map(req => 
  //         req.id === currentRequest.id 
  //           ? { ...req, status: status }
  //           : req
  //       )
  //     );

  //     // Update driver status
  //     await updateDriverStatus(status);
  //   } catch (error) {
  //     console.error('Error updating status:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

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

  // New profile management functions
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      
      // First, upload profile picture if there's a new one
      let profilePictureUrl = profileImagePreview;
      if (profileData.profileImage && profileData.profileImage instanceof File) {
        const formData = new FormData();
        formData.append('profilePicture', profileData.profileImage);
        
        const uploadResponse = await api.post('/emergency/driver/upload-profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (uploadResponse.data.success) {
          profilePictureUrl = uploadResponse.data.profilePicture;
        } else {
          console.error('Failed to upload profile picture:', uploadResponse.data.message);
        }
      }
      
      // Update driver profile with other data
      const updateData = {
        name: user?.name,
        phone: profileData.mobileNumber,
        vehicleNumber: profileData.carRegistrationNumber,
        vehicleType: profileData.ambulanceType,
        carRegistration: profileData.carRegistrationNumber,
        ambulanceType: profileData.ambulanceType,
        chassisNumber: profileData.chassisNumber
      };
      
      const updateResponse = await api.put('/emergency/driver/profile', updateData);
      
      if (updateResponse.data.success) {
        // Update user data in localStorage
        const updatedUser = {
          ...user,
          profileImage: profilePictureUrl,
          vehicleNumber: profileData.carRegistrationNumber,
          vehicleType: profileData.ambulanceType,
          chassisNumber: profileData.chassisNumber,
          phone: profileData.mobileNumber
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfileImagePreview(profilePictureUrl);
        
        setIsEditingProfile(false);
        alert('Profile updated successfully!');
      } else {
        console.error('Failed to update profile:', updateResponse.data.message);
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelProfileEdit = () => {
    // Reset to original values
    setProfileData({
      profileImage: user?.profileImage || null,
      carRegistrationNumber: user?.vehicleNumber || '',
      ambulanceType: user?.vehicleType || 'standard',
      chassisNumber: user?.chassisNumber || '',
      mobileNumber: user?.phone || ''
    });
    setProfileImagePreview(user?.profileImage || null);
    setIsEditingProfile(false);
  };

  // Function to refresh ride history
  const refreshRideHistory = () => {
    fetchRideHistory();
  };

  // Function to get ambulance type color
  const getAmbulanceTypeColor = (type) => {
    switch (type) {
      case 'vip':
        return 'text-yellow-800 bg-yellow-200';
      case 'critical':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-blue-800 bg-blue-200';
    }
  };

  // Function to format currency (BDT)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      websocketService.disconnect();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear local storage and navigate even if API call fails
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      websocketService.disconnect();
      navigate('/login');
    }
  };

  // Function to handle ride completion
  const handleRideCompletion = async () => {
    if (!currentRequest) return;

    try {
      setIsLoading(true);
      const statusUpdate = {
        requestId: currentRequest.id,
        status: REQUEST_STATUS.COMPLETED,
        timestamp: new Date().toISOString(),
        driver: {
          id: user.id,
          name: user.name,
          phone: profileData.mobileNumber || user.phone,
          vehicleType: profileData.ambulanceType,
          vehicleNumber: profileData.carRegistrationNumber,
          location: user.location,
          status: REQUEST_STATUS.COMPLETED
        }
      };

      console.log('Sending ride completion update:', statusUpdate);
      await websocketService.send('request_status_update', statusUpdate);

      // Create completed ride record
      // Calculate ride metrics
      const rideDuration = calculateRideDuration(currentRequest.startTime);
      const rideDistance = calculateRideDistance(currentRequest.location, driverLocation || user.location);
      const rideFare = calculateRideFare(currentRequest.emergencyType, currentRequest.location, driverLocation || user.location);
      
      // Save ride completion to backend
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`/api/emergency/ride/${currentRequest.id}/complete`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              dropoffLocation: {
                address: driverLocation || user.location,
                latitude: driverLocation?.latitude || 0,
                longitude: driverLocation?.longitude || 0
              },
              totalDistance: parseFloat(rideDistance.replace(' km', '')),
              totalDuration: parseInt(rideDuration.replace(' mins', '')),
              averageSpeed: 35, // Mock average speed
              finalFare: rideFare
            })
          });
          
          const data = await response.json();
          if (!data.success) {
            console.error('Failed to save ride completion:', data.message);
          }
        } catch (error) {
          console.error('Error saving ride completion:', error);
        }
      }

      const newRide = {
        id: currentRequest.id,
        patientName: currentRequest.patientInfo?.name || 'Anonymous',
        pickupLocation: currentRequest.location,
        dropoffLocation: driverLocation || user.location,
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString(),
        duration: rideDuration,
        distance: rideDistance,
        fare: rideFare,
        ambulanceType: profileData.ambulanceType,
        status: 'completed',
        requestId: currentRequest.id
      };

      // Add to ride history
      setRideHistory(prev => [newRide, ...prev]);
      setTotalEarnings(prev => prev + newRide.fare);

      // Show completion modal
      setCompletedRide(newRide);
      setShowRideCompletion(true);

      // Update local state
      setCurrentRequest(prev => {
        const updated = {
          ...prev,
          status: REQUEST_STATUS.COMPLETED,
          lastUpdate: new Date().toISOString(),
          driverInfo: {
            ...prev.driverInfo,
            ...statusUpdate.driver
          }
        };
        console.log('Updated current request to completed:', updated);
        return updated;
      });

      // Also update in requests list if it exists there
      setRequests(prev => 
        prev.map(req => 
          req.id === currentRequest.id 
            ? { ...req, status: REQUEST_STATUS.COMPLETED }
            : req
        )
      );

      // Update driver status to available
      await updateDriverStatus('available');

      // Clear current request
      setCurrentRequest(null);

    } catch (error) {
      console.error('Error completing ride:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to calculate ride duration
  const calculateRideDuration = (startTime) => {
    if (!startTime) return '0 mins';
    const start = new Date(startTime);
    const end = new Date();
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / (1000 * 60));
    return `${diffMins} mins`;
  };

  // Function to calculate ride distance (mock)
  const calculateRideDistance = (start, end) => {
    // Mock distance calculation - replace with actual calculation
    return `${Math.floor(Math.random() * 20 + 5)} km`;
  };

  // Function to calculate ride fare
  const calculateRideFare = (emergencyType, start, end) => {
    // Base fare calculation
    let baseFare = 500; // Base fare in BDT
    
    // Emergency type multiplier
    switch (emergencyType) {
      case 'critical':
        baseFare *= 2.5;
        break;
      case 'vip':
        baseFare *= 2;
        break;
      case 'standard':
      default:
        baseFare *= 1;
        break;
    };

    // Distance multiplier (mock)
    const distance = Math.floor(Math.random() * 20 + 5);
    const distanceMultiplier = 1 + (distance * 0.1);
    
    // Time multiplier (rush hour, night, etc.)
    const hour = new Date().getHours();
    let timeMultiplier = 1;
    if (hour >= 7 && hour <= 9) timeMultiplier = 1.2; // Morning rush
    if (hour >= 17 && hour <= 19) timeMultiplier = 1.2; // Evening rush
    if (hour >= 22 || hour <= 6) timeMultiplier = 1.3; // Night

    const totalFare = Math.round(baseFare * distanceMultiplier * timeMultiplier);
    return totalFare;
  };

  // Function to close ride completion modal
  const closeRideCompletion = () => {
    setShowRideCompletion(false);
    setCompletedRide(null);
  };

  // Function to draw path between driver and patient (unused - keeping for future reference)
  // const drawPathToPatient = () => {
  //   if (!currentRequest || !user.location) return null;

  //   const driverLatLng = user.location;
  //   const patientLatLng = currentRequest.location;

  //   // Create path coordinates (simplified straight line for now)
  //   // In a real implementation, you'd use Google Maps Directions API or similar
  //   const pathCoordinates = [
  //     { lat: driverLatLng.lat, lng: driverLatLng.lng },
  //     { lat: patientLatLng.lat, lng: patientLatLng.lng }
  //   ];

  //   return pathCoordinates;
  // };

  // Function to get patient location marker (unused - keeping for future reference)
  // const getPatientLocationMarker = () => {
  //   if (!currentRequest) return null;

  //   return {
  //     position: currentRequest.location,
  //     title: `Patient: ${currentRequest.patientInfo?.name || 'Anonymous'}`,
  //     icon: {
  //       url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
  //         <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  //           <circle cx="16" cy="16" r="16" fill="#EF4444"/>
  //           <circle cx="16" cy="16" r="8" fill="white"/>
  //           <circle cx="16" cy="16" r="4" fill="#EF4444"/>
  //         </svg>
  //       `),
  //       scaledSize: { width: 32, height: 32 },
  //       anchor: { x: 16, y: 16 }
  //     }
  //   };
  // };

  return (
    <div className="relative md:ml-64 bg-blueGray-100 min-h-screen">
      <div className="px-4 md:px-10 mx-auto w-full -m-24 pt-24">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg"
        >
          <div className="px-6 py-4">
            <div className="flex flex-wrap justify-between items-center">
              <motion.h1 
                className="text-2xl font-bold text-blueGray-700 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full bg-lightBlue-500">
                  <TruckIcon className="w-6 h-6" />
                </div>
                Driver Dashboard
              </motion.h1>
              <motion.div 
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={toggleOnlineStatus}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 ${
                    isOnline 
                      ? 'bg-emerald-500 text-white active:bg-emerald-600 hover:shadow-lg' 
                      : 'bg-blueGray-700 text-white active:bg-blueGray-600 hover:shadow-lg'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-300'}`}></div>
                  {isOnline ? 'Online' : 'Offline'}
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white active:bg-red-600 text-sm font-bold uppercase px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 flex items-center gap-2"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="flex flex-wrap">
          {/* Left Column - Request Status & Info */}
          <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
            <AnimatePresence>
              {currentRequest && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Active Emergency Card */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg ${isLoading ? 'animate-pulse' : ''}`}
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full bg-red-500">
                            <TruckIcon className="w-6 h-6" />
                          </div>
                          <h2 className="text-xl font-semibold leading-normal mb-2 text-blueGray-700">Active Emergency</h2>
                        </div>
                        <div className="flex items-center gap-3">
                          <motion.span
                            key={currentRequest.status}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                              currentRequest.status === 'pending' ? 'text-yellow-800 bg-yellow-200' :
                              currentRequest.status === 'accepted' ? 'text-lightBlue-800 bg-lightBlue-200' :
                              currentRequest.status === 'started_journey' ? 'text-purple-800 bg-purple-200' :
                              currentRequest.status === 'completed' ? 'text-emerald-800 bg-emerald-200' :
                              'text-blueGray-800 bg-blueGray-200'
                            }`}
                          >
                            {STATUS_LABELS[currentRequest.status] || currentRequest.status}
                          </motion.span>
                          <button
                            onClick={() => setShowStatusGuide(!showStatusGuide)}
                            className="text-blueGray-500 hover:text-blueGray-700 p-2 rounded-lg transition-colors"
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
                            className="bg-lightBlue-50 border border-lightBlue-200 rounded-lg p-4 mb-6"
                          >
                            <p className="text-sm text-lightBlue-800">
                              {STATUS_DESCRIPTIONS[currentRequest.status]}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Progress Section */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-blueGray-600">Progress</span>
                          <span className="text-sm text-blueGray-400">
                            {Math.round(getStatusProgress(currentRequest.status))}% Complete
                          </span>
                        </div>
                        <div className="w-full bg-blueGray-200 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-lightBlue-500 to-lightBlue-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${getStatusProgress(currentRequest.status)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        
                        {/* Progress Steps */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
                          {STATUS_FLOW.map((step, index) => (
                            <motion.div
                              key={step.status}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                                STATUS_FLOW.findIndex(s => s.status === currentRequest.status) >= index
                                  ? 'bg-lightBlue-50 border border-lightBlue-200' : 'bg-blueGray-50 border border-blueGray-200'
                              }`}
                            >
                              <div className={`w-3 h-3 rounded-full mb-2 ${
                                STATUS_FLOW.findIndex(s => s.status === currentRequest.status) >= index
                                  ? 'bg-lightBlue-500' : 'bg-blueGray-300'
                              }`} />
                              <span className={`text-xs font-medium leading-tight ${
                                STATUS_FLOW.findIndex(s => s.status === currentRequest.status) >= index
                                  ? 'text-lightBlue-700' : 'text-blueGray-500'
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
                          className="flex items-center gap-3"
                        >
                          <UserIcon className="w-5 h-5 text-blueGray-400" />
                          <div>
                            <p className="text-xs font-semibold text-blueGray-400 uppercase">Patient Information</p>
                            <p className="font-semibold text-blueGray-700">{currentRequest.patientInfo?.name || 'Anonymous'}</p>
                            <p className="text-sm text-blueGray-600">{currentRequest.patientInfo?.phone || 'N/A'}</p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <MapPinIcon className="w-5 h-5 text-blueGray-400" />
                          <div>
                            <p className="text-xs font-semibold text-blueGray-400 uppercase">Location</p>
                            <p className="font-semibold text-blueGray-700">{currentRequest.location}</p>
                          </div>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-3"
                        >
                          <TruckIcon className="w-5 h-5 text-blueGray-400" />
                          <div>
                            <p className="text-xs font-semibold text-blueGray-400 uppercase">Emergency Type</p>
                            <p className="font-semibold text-blueGray-700 capitalize">{currentRequest.emergencyType}</p>
                          </div>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-center gap-3"
                        >
                          <PhoneIcon className="w-5 h-5 text-blueGray-400" />
                          <div>
                            <p className="text-xs font-semibold text-blueGray-400 uppercase">Description</p>
                            <p className="font-semibold text-blueGray-700">{currentRequest.description}</p>
                          </div>
                        </motion.div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-blueGray-200">
                        <h3 className="text-lg font-semibold text-blueGray-700 mb-4">Update Status</h3>
                        <div className="flex gap-3">
                          {currentRequest.status === REQUEST_STATUS.ACCEPTED && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => updateRequestStatus(REQUEST_STATUS.STARTED_JOURNEY)}
                              className="bg-lightBlue-500 text-white active:bg-lightBlue-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
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
                              className="bg-blue-500 text-white active:bg-blue-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                              disabled={isLoading}
                            >
                              {getNextStatus(currentRequest.status)?.label || 'Start Journey'}
                            </motion.button>
                          )}
                          
                          {/* Complete Ride Button - Show when journey is in progress */}
                          {currentRequest.status === 'IN_PROGRESS' && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleRideCompletion}
                              className="bg-green-500 text-white active:bg-green-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                              disabled={isLoading}
                            >
                              Complete Ride
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Real-Time Map Tracking */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg"
                  >
                    <div className="px-6 py-4">
                      <h3 className="text-lg font-semibold text-blueGray-700 mb-4">Live Tracking</h3>
                      <DriverTrackingMap
                        requestId={currentRequest.id}
                        patientLocation={currentRequest.location}
                        onLocationUpdate={(location) => {
                          console.log('Driver location updated:', location);
                          setDriverLocation(location);
                        }}
                        height="500px"
                        className="w-full"
                      />
                      
                      {/* Patient Location Info */}
                      {currentRequest.location && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            Patient Location
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-blue-600 font-medium">Latitude:</span>
                              <span className="ml-2 text-blue-800">{currentRequest.location.lat || currentRequest.location.latitude}</span>
                            </div>
                            <div>
                              <span className="text-blue-600 font-medium">Longitude:</span>
                              <span className="ml-2 text-blue-800">{currentRequest.location.lng || currentRequest.location.longitude}</span>
                            </div>
                            {currentRequest.location.address && (
                              <div className="col-span-2">
                                <span className="text-blue-600 font-medium">Address:</span>
                                <span className="ml-2 text-blue-800">{currentRequest.location.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Available Requests Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg"
            >
              <div className="px-6 py-4">
                <h2 className="text-xl font-semibold text-blueGray-700 mb-6 flex items-center gap-3">
                  <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full bg-yellow-500">
                    <ClockIcon className="w-6 h-6" />
                  </div>
                  Emergency Requests
                </h2>
                
                {requests.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <p className="text-blueGray-400">No pending requests</p>
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
                          className="relative flex flex-col min-w-0 break-words bg-blueGray-50 w-full mb-4 shadow-lg rounded-lg"
                        >
                          <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-800 bg-yellow-200">
                                {request.status}
                              </span>
                              <span className="text-sm text-blueGray-400">
                                {new Date(request.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <div className="space-y-3">
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3"
                              >
                                <UserIcon className="w-5 h-5 text-blueGray-400" />
                                <div>
                                  <p className="text-xs font-semibold text-blueGray-400 uppercase">Patient</p>
                                  <p className="font-semibold text-blueGray-700">{request.patientInfo?.name || 'Anonymous'}</p>
                                </div>
                              </motion.div>

                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center gap-3"
                              >
                                <MapPinIcon className="w-5 h-5 text-blueGray-400" />
                                <div>
                                  <p className="text-xs font-semibold text-blueGray-400 uppercase">Location</p>
                                  <p className="font-semibold text-blueGray-700">{request.location}</p>
                                </div>
                              </motion.div>
                              
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-3"
                              >
                                <TruckIcon className="w-5 h-5 text-blueGray-400" />
                                <div>
                                  <p className="text-xs font-semibold text-blueGray-400 uppercase">Emergency Type</p>
                                  <p className="font-semibold text-blueGray-700 capitalize">{request.emergencyType}</p>
                                </div>
                              </motion.div>
                            </div>
                            
                            <div className="flex gap-3 mt-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAcceptRequest(request)}
                                className="bg-emerald-500 text-white active:bg-emerald-600 text-sm font-bold uppercase px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 flex-1"
                                disabled={isLoading}
                              >
                                <CheckIcon className="h-5 w-5 mr-2 inline" />
                                Accept
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleRejectRequest(request)}
                                className="bg-red-500 text-white active:bg-red-600 text-sm font-bold uppercase px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 flex-1"
                                disabled={isLoading}
                              >
                                <XMarkIcon className="h-5 w-5 mr-2 inline" />
                                Reject
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Ride History Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg"
            >
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-blueGray-700 flex items-center gap-3">
                    <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full bg-emerald-500">
                      <TruckIcon className="w-6 h-6" />
                    </div>
                    Ride History
                  </h2>
                  <button
                    onClick={refreshRideHistory}
                    disabled={isLoadingHistory}
                    className="bg-blue-500 text-white active:bg-blue-600 text-sm font-bold uppercase px-3 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  >
                    {isLoadingHistory ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {/* Earnings Summary */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 uppercase">Total Earnings</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalEarnings)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-emerald-600">Completed Rides</p>
                      <p className="text-lg font-semibold text-emerald-700">{rideHistory.length}</p>
                    </div>
                  </div>
                </div>

                {/* Ride History List */}
                {isLoadingHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lightBlue-500 mx-auto"></div>
                    <p className="text-blueGray-400 mt-4">Loading ride history...</p>
                  </div>
                ) : rideHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-blueGray-400">No completed rides yet</p>
                    <p className="text-sm text-blueGray-500 mt-2">Your completed rides will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rideHistory.map((ride, index) => (
                      <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-blueGray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-blueGray-700">{ride.patientName}</h3>
                              <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${getAmbulanceTypeColor(ride.ambulanceType)}`}>
                                {ride.ambulanceType}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-blueGray-500">Pickup</p>
                                <p className="text-blueGray-700 font-medium">{ride.pickupLocation}</p>
                              </div>
                              <div>
                                <p className="text-blueGray-500">Dropoff</p>
                                <p className="text-blueGray-700 font-medium">{ride.dropoffLocation}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-600">{formatCurrency(ride.fare)}</p>
                            <p className="text-xs text-blueGray-400">{formatDate(ride.date)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-blueGray-100">
                          <div className="flex items-center gap-4 text-sm text-blueGray-600">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {ride.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="w-4 h-4" />
                              {ride.distance}
                            </span>
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {ride.time}
                            </span>
                          </div>
                          <span className="text-xs text-blueGray-500 bg-blueGray-100 px-2 py-1 rounded">
                            {ride.status}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Right Column - Driver Stats and Profile */}
          <div className="w-full xl:w-4/12 px-4">
            {/* Driver Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg"
            >
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blueGray-700">Driver Profile</h3>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-lightBlue-500 hover:text-lightBlue-700 p-2 rounded-lg transition-colors"
                  >
                    {isEditingProfile ? <XMarkIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />}
                  </button>
                </div>

                {!isEditingProfile ? (
                  // Profile Display Mode
                  <div className="space-y-4">
                    {/* Profile Image */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-blueGray-200 flex items-center justify-center">
                          {profileImagePreview ? (
                            <img 
                              src={profileImagePreview} 
                              alt="Driver Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-12 h-12 text-blueGray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <UserIcon className="w-5 h-5 text-blueGray-400" />
                        <div>
                          <p className="text-xs font-semibold text-blueGray-400 uppercase">Name</p>
                          <p className="font-semibold text-blueGray-700">{user?.name || 'Not Set'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <PhoneIcon className="w-5 h-5 text-blueGray-400" />
                        <div>
                          <p className="text-xs font-semibold text-blueGray-400 uppercase">Mobile Number</p>
                          <p className="font-semibold text-blueGray-700">{profileData.mobileNumber || 'Not Set'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <TruckIcon className="w-5 h-5 text-blueGray-400" />
                        <div>
                          <p className="text-xs font-semibold text-blueGray-400 uppercase">Car Registration</p>
                          <p className="font-semibold text-blueGray-700">{profileData.carRegistrationNumber || 'Not Set'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <TruckIcon className="w-5 h-5 text-blueGray-400" />
                        <div>
                          <p className="text-xs font-semibold text-blueGray-400 uppercase">Ambulance Type</p>
                          <p className="font-semibold text-blueGray-700 capitalize">{profileData.ambulanceType || 'Not Set'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <TruckIcon className="w-5 h-5 text-blueGray-400" />
                        <div>
                          <p className="text-xs font-semibold text-blueGray-400 uppercase">Chassis Number</p>
                          <p className="font-semibold text-blueGray-700">{profileData.chassisNumber || 'Not Set'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Profile Edit Mode
                  <div className="space-y-4">
                    {/* Profile Image Upload */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-blueGray-200 flex items-center justify-center">
                          {profileImagePreview ? (
                            <img 
                              src={profileImagePreview} 
                              alt="Driver Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-12 h-12 text-blueGray-400" />
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-lightBlue-500 text-white p-2 rounded-full cursor-pointer hover:bg-lightBlue-600 transition-colors">
                          <CameraIcon className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-blueGray-400 uppercase block mb-2">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          name="mobileNumber"
                          value={profileData.mobileNumber}
                          onChange={handleProfileInputChange}
                          className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          placeholder="Enter mobile number"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-blueGray-400 uppercase block mb-2">
                          Car Registration Number
                        </label>
                        <input
                          type="text"
                          name="carRegistrationNumber"
                          value={profileData.carRegistrationNumber}
                          onChange={handleProfileInputChange}
                          className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          placeholder="Enter car registration number"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-blueGray-400 uppercase block mb-2">
                          Ambulance Type
                        </label>
                        <select
                          name="ambulanceType"
                          value={profileData.ambulanceType}
                          onChange={handleProfileInputChange}
                          className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        >
                          <option value="standard">Standard</option>
                          <option value="vip">VIP</option>
                          <option value="critical">Critical Care</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-blueGray-400 uppercase block mb-2">
                          Chassis Number
                        </label>
                        <input
                          type="text"
                          name="chassisNumber"
                          value={profileData.chassisNumber}
                          onChange={handleProfileInputChange}
                          className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          placeholder="Enter chassis number"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="bg-emerald-500 text-white active:bg-emerald-600 text-sm font-bold uppercase px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 flex-1"
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                                              <button
                          onClick={cancelProfileEdit}
                          className="bg-red-500 text-white active:bg-red-600 text-sm font-bold uppercase px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 flex-1"
                        >
                          Cancel
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Online Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg"
            >
              <div className="px-6 py-4">
                <h3 className="text-lg font-semibold text-blueGray-700 mb-4">Driver Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-blueGray-400'}`}></div>
                    <div>
                      <p className="text-xs font-semibold text-blueGray-400 uppercase">Status</p>
                      <p className="font-semibold text-blueGray-700">{isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TruckIcon className="w-5 h-5 text-lightBlue-500" />
                    <div>
                      <p className="text-xs font-semibold text-blueGray-400 uppercase">Available Requests</p>
                      <p className="font-semibold text-blueGray-700">{requests.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Ride Completion Modal */}
      <AnimatePresence>
        {showRideCompletion && completedRide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeRideCompletion}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Ride Completed!</h3>
                <p className="text-sm text-gray-500">Thank you for your service</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Patient:</span>
                  <span className="text-sm font-medium text-gray-900">{completedRide.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Duration:</span>
                  <span className="text-sm font-medium text-gray-900">{completedRide.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Distance:</span>
                  <span className="text-sm font-medium text-gray-900">{completedRide.distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fare:</span>
                  <span className="text-sm font-medium text-gray-900 text-emerald-600">
                    ৳{completedRide.fare} BDT
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeRideCompletion}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeRideCompletion();
                    // Optionally navigate to ride history
                  }}
                  className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  View History
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmergencyDriverDashboard; 