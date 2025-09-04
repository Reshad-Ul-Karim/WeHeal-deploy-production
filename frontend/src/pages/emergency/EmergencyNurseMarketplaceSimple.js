import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { orderAPI } from '../../services/marketplaceAPI';
import { 
  UserIcon, 
  ClockIcon, 
  StarIcon, 
  MapPinIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import PaymentGateway from '../../components/payments/PaymentGateway';

const EmergencyNurseMarketplace = () => {
  const navigate = useNavigate();
  const [nurses, setNurses] = useState([]);
  const [filteredNurses, setFilteredNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('browse'); // browse | requests | completed
  const [patientRequests, setPatientRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('available');
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingData, setBookingData] = useState({
    description: '',
    urgency: 'medium',
    estimatedDuration: '1',
    preferredTime: '',
    location: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [amountToPay, setAmountToPay] = useState(0);

  const specializations = [
    'General', 'ICU', 'Emergency', 'Pediatric', 'Surgical', 
    'Cardiac', 'Oncology', 'Psychiatric', 'Other'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: 'green' },
    { value: 'medium', label: 'Medium Priority', color: 'yellow' },
    { value: 'high', label: 'High Priority', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' }
  ];

  useEffect(() => {
    // initial load
    fetchAvailableNurses();
  }, []);

  useEffect(() => {
    // pause polling when payment gateway is open or when not in browse tab
    if (showGateway || activeTab !== 'browse') return;
    const intervalId = setInterval(() => {
      fetchAvailableNurses();
    }, 30000); // poll every 30s, lighter load
    return () => clearInterval(intervalId);
  }, [showGateway, activeTab]);

  useEffect(() => {
    if (activeTab === 'requests' || activeTab === 'completed') {
      fetchPatientRequests();
      // light polling for requests pages
      const id = setInterval(() => fetchPatientRequests(), 20000);
      return () => clearInterval(id);
    }
  }, [activeTab]);

  useEffect(() => {
    filterNurses();
  }, [nurses, searchTerm, specializationFilter, availabilityFilter]);

  const fetchAvailableNurses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/emergency-nurse/available-nurses');
      if (response.data.success) {
        // Use server-provided stats (rating, totalPatients, avgResponseTime, isOnline)
        const availableNurses = response.data.data.nurses
          .filter(nurse => nurse.nurseDetails?.isAvailable);
        setNurses(availableNurses);
      }
    } catch (err) {
      setError('Failed to fetch available nurses');
      console.error('Error fetching nurses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientRequests = async () => {
    try {
      const resp = await api.get('/emergency-nurse/patient/requests');
      if (resp.data?.success) {
        setPatientRequests(resp.data.data.requests || []);
      }
    } catch (e) {
      // silent
    }
  };

  const filterNurses = () => {
    let filtered = nurses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(nurse =>
        nurse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nurse.nurseDetails?.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Specialization filter
    if (specializationFilter) {
      filtered = filtered.filter(nurse =>
        nurse.nurseDetails?.specialization === specializationFilter
      );
    }

    // Availability filter
    if (availabilityFilter === 'online') {
      filtered = filtered.filter(nurse => nurse.isOnline);
    }

    setFilteredNurses(filtered);
  };

  const handleBookNurse = (nurse) => {
    setSelectedNurse(nurse);
    setShowBookingDialog(true);
  };

  const handleBookingSubmit = async () => {
    try {
      setBookingLoading(true);
      
      // Calculate amount and prepare booking data for payment
      const hours = Math.max(1, parseInt(bookingData.estimatedDuration) || 1);
      const rateMap = { critical: 800, high: 650, medium: 500, low: 380 };
      const rate = rateMap[bookingData.urgency] || rateMap.medium;
      const amount = rate * hours;
      
      // Store booking data for use in payment success handler
      setBookingData(prev => ({ ...prev, amount, nurseId: selectedNurse._id }));
      setAmountToPay(amount);
      setShowBookingDialog(false);
      setShowGateway(true);
    } catch (err) {
      setError('Failed to start checkout. Please try again.');
      console.error('Error starting checkout:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    const level = urgencyLevels.find(u => u.value === urgency);
    return level ? level.color : 'gray';
  };

  const getUrgencyLabel = (urgency) => {
    const level = urgencyLevels.find(u => u.value === urgency);
    return level ? level.label : 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-500 mx-auto"></div>
          <h6 className="mt-4 text-lg font-semibold text-gray-700">Loading available nurses...</h6>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/emergency')}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Emergency Nurse Services
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Find and book qualified nurses for emergency medical assistance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-8 w-8 text-gray-600" />
              <h6 className="text-gray-700 font-semibold">
                Emergency Services
              </h6>
            </div>
          </div>
          {/* Tabs */}
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-md border ${activeTab==='browse'?'bg-gray-800 text-white border-gray-800':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Browse Nurses
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-md border ${activeTab==='requests'?'bg-gray-800 text-white border-gray-800':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              My Requests
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-md border ${activeTab==='completed'?'bg-gray-800 text-white border-gray-800':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Completed
            </button>
            <div className="ml-auto">
              <button
                onClick={() => navigate('/emergency/my-requests')}
                className="px-4 py-2 rounded-md border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Open Full History
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'browse' && (
        <>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search nurses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div>
              <select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="">All Specializations</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="available">All Available</option>
                <option value="online">Online Now</option>
              </select>
            </div>
            <div>
              <button
                onClick={fetchAvailableNurses}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <h6 className="text-lg text-gray-700">
            {filteredNurses.length} nurse{filteredNurses.length !== 1 ? 's' : ''} available
          </h6>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Close
            </button>
          </div>
        )}

        {/* Success Alert */}
        {bookingSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">Nurse booking request sent successfully! The nurse will be notified and respond shortly.</p>
            <button 
              onClick={() => setBookingSuccess(false)}
              className="mt-2 text-green-600 hover:text-green-800"
            >
              Close
            </button>
          </div>
        )}

        {/* Nurse Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNurses.map((nurse) => (
            <div key={nurse._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {nurse.name?.charAt(0) || 'N'}
                    </div>
                    <div>
                      <h6 className="font-semibold text-gray-900">
                        {nurse.name}
                      </h6>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {nurse.nurseDetails?.specialization || 'General'}
                        </span>
                        {nurse.isOnline && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating and Stats */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-4 w-4 ${i < Math.round(nurse.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {(nurse.rating || 0).toFixed(1)} ({nurse.totalPatients || 0} patients served)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {nurse.nurseDetails?.yearsOfExperience || 0} years exp.
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        ~{nurse.avgResponseTime || 0} min response
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shift Info */}
                <div className="mb-4">
                  <span className="text-sm text-gray-500 mb-1">Current Shift</span>
                  <div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">
                      {nurse.nurseDetails?.shift || 'morning'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleBookNurse(nurse)}
                  disabled={!nurse.isOnline}
                  className={`w-full px-4 py-2 rounded-md font-medium ${
                    nurse.isOnline 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {nurse.isOnline ? 'Book Emergency Service' : 'Currently Offline'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredNurses.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow">
            <div className="text-center py-12">
              <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h5 className="text-gray-500 mb-2">No nurses found</h5>
              <p className="text-gray-400">
                Try adjusting your search criteria or check back later for available nurses.
              </p>
            </div>
          </div>
        )}
        </>
        )}

        {activeTab !== 'browse' && (
          <div className="space-y-4">
            {(activeTab === 'requests'
              ? patientRequests.filter(r => r.status==='pending' || r.status==='accepted' || r.status==='in_progress')
              : patientRequests.filter(r => r.status==='completed'))
              .map((request) => (
                <div key={request._id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-gray-900 font-semibold">{request.nurseId?.name || 'Nurse'}</div>
                      <div className="text-sm text-gray-600">{request.nurseId?.nurseDetails?.specialization || 'General'} • {request.urgency}</div>
                      <div className="text-sm text-gray-500 mt-1">Requested: {new Date(request.createdAt).toLocaleString()}</div>
                      {request.status==='completed' && (
                        <div className="text-sm text-gray-500">Completed: {new Date(request.completedAt).toLocaleString()}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                        request.status==='completed'?'bg-green-100 text-green-800':
                        request.status==='pending'?'bg-yellow-100 text-yellow-800':
                        request.status==='accepted'?'bg-gray-100 text-gray-800':'bg-gray-200 text-gray-700'
                      }`}>{request.status.replace('_',' ')}</span>
                    </div>
                  </div>
                </div>
              ))}

            {(activeTab === 'requests' && patientRequests.filter(r => r.status==='pending' || r.status==='accepted' || r.status==='in_progress').length===0) && (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No active requests</div>
            )}

            {(activeTab === 'completed' && patientRequests.filter(r => r.status==='completed').length===0) && (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No completed requests</div>
            )}

          </div>
        )}
      </div>

      {/* Booking Dialog */}
      {showBookingDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {selectedNurse?.name?.charAt(0) || 'N'}
              </div>
              <div>
                <h5 className="text-xl font-semibold">Book {selectedNurse?.name}</h5>
                <p className="text-sm text-gray-600">
                  {selectedNurse?.nurseDetails?.specialization} Nurse
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Description *
                </label>
                <textarea
                  placeholder="Describe the emergency situation..."
                  value={bookingData.description}
                  onChange={(e) => setBookingData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level *
                  </label>
                  <select
                    value={bookingData.urgency}
                    onChange={(e) => setBookingData(prev => ({ ...prev, urgency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {urgencyLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (hours) *
                  </label>
                  <select
                    value={bookingData.estimatedDuration}
                    onChange={(e) => setBookingData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="8">8 hours</option>
                    <option value="12">12 hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingData.preferredTime}
                    onChange={(e) => setBookingData(prev => ({ ...prev, preferredTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Patient location"
                    value={bookingData.location}
                    onChange={(e) => setBookingData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              </div>

              {/* Urgency Indicator */}
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-${getUrgencyColor(bookingData.urgency)}-500`}></div>
                  <span className="text-sm text-gray-600">
                    {getUrgencyLabel(bookingData.urgency)} - {bookingData.urgency === 'critical' ? 'Immediate response required' : 'Standard response time'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBookingDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleBookingSubmit}
                disabled={bookingLoading || !bookingData.description}
                className={`px-4 py-2 rounded-md font-medium ${
                  bookingLoading || !bookingData.description
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {bookingLoading ? 'Sending Request...' : 'Send Emergency Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Payment Gateway */}
      {showGateway && (
        <PaymentGateway
          open={showGateway}
          onClose={() => setShowGateway(false)}
          amount={amountToPay}
          paymentType="emergency_nurse"
          onSuccess={async (paymentData) => {
            try {
              console.log('Payment successful for emergency nurse:', paymentData);
              
              // Use the EXACT same approach as marketplace - create order after payment
              const orderPayload = {
                orderId: paymentData.orderId,
                amount: paymentData.amount,
                paymentMethod: paymentData.paymentMethod,
                paymentType: 'emergency_nurse',
                transactionId: paymentData.transactionId,
                items: [{
                  type: 'emergency_nurse',
                  nurseId: bookingData.nurseId,
                  description: bookingData.description,
                  urgency: bookingData.urgency,
                  estimatedDuration: parseInt(bookingData.estimatedDuration) || 1,
                  preferredTime: bookingData.preferredTime,
                  location: bookingData.location,
                  quantity: 1,
                  price: bookingData.amount
                }],
                customerInfo: {
                  name: 'Emergency Patient',
                  phone: 'Emergency Contact'
                },
                deliveryInfo: {
                  address: bookingData.location,
                  type: 'emergency_service'
                }
              };
              
              console.log('Creating order after payment (marketplace approach):', orderPayload);
              const response = await orderAPI.createOrderAfterPayment(orderPayload);
              
              if (response.success) {
                setShowGateway(false);
                setBookingSuccess(true);
                
                // Navigate to orders page after a short delay
                setTimeout(() => {
                  navigate('/orders');
                }, 2000);
              } else {
                throw new Error(response.message || 'Failed to create order');
              }
            } catch (e) {
              console.error('Error creating order:', e);
              setError(e?.response?.data?.message || 'Failed to create order');
              setShowGateway(false);
            }
          }}
          userProfile={null}
        />
      )}
    </div>
  );
};

export default EmergencyNurseMarketplace;
