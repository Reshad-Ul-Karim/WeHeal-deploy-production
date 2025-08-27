import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const EmergencyTrack = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Fetch request details
  const fetchRequestDetails = async () => {
    try {
      const response = await api.get(`/emergency/details/${requestId}`);
      if (response.data.success) {
        setRequest(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch request details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Error fetching emergency request:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();

    // Auto refresh every 15 seconds if request is pending or in-progress
    const interval = setInterval(() => {
      if (request && (request.status === 'pending' || request.status === 'in-progress' || request.status === 'accepted')) {
        fetchRequestDetails();
      }
    }, 15000);

    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [requestId, request?.status]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'accepted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'started_journey':
      case 'on_the_way':
      case 'almost_there':
      case 'looking_for_patient':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'received_patient':
      case 'dropping_off':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'accepted':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'started_journey':
      case 'on_the_way':
      case 'almost_there':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'looking_for_patient':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'received_patient':
      case 'dropping_off':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-blue-500 mx-auto mb-4"></div>
          <p className="text-base text-slate-600 font-medium">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex justify-center items-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Request</h2>
          <p className="text-slate-600 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => navigate('/emergency')} 
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Emergency Services
          </button>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex justify-center items-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Request Not Found</h2>
          <p className="text-slate-600 mb-6 text-sm">No request found with the provided ID.</p>
          <button 
            onClick={() => navigate('/emergency')} 
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors duration-200 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Emergency Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Emergency Request Tracking</h1>
              <p className="text-slate-600 text-sm mt-1">Track your emergency service request in real-time</p>
            </div>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="ml-1.5">{request.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Request Overview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{request.requestType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Request</h2>
              <p className="text-slate-500 text-sm">ID: {request._id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Information */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Patient Information</h3>
              </div>
              <div className="space-y-1.5">
                <p className="text-slate-700 text-sm"><span className="font-medium">Name:</span> {request.patientName}</p>
                <p className="text-slate-700 text-sm"><span className="font-medium">Contact:</span> {request.patientContact}</p>
                <p className="text-slate-700 text-sm"><span className="font-medium">Requested:</span> {formatDate(request.createdAt)}</p>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Location Details</h3>
              </div>
              <div className="space-y-1.5">
                <p className="text-slate-700 text-sm"><span className="font-medium">Pickup:</span> {request.pickup}</p>
                <p className="text-slate-700 text-sm"><span className="font-medium">Destination:</span> {request.destination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        {request.driverId && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Driver Information</h2>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {/* Driver Avatar - Appropriately sized */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                    {request.driverId.name ? request.driverId.name.charAt(0).toUpperCase() : 'D'}
                  </div>
                </div>
                
                {/* Driver Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    {request.driverId.name || 'Driver Assigned'}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-slate-600">
                      <svg className="w-3 h-3 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{request.driverId.phone || 'Contact information available'}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600">
                      <svg className="w-3 h-3 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{request.driverId.vehicle?.type || 'Standard Ambulance'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trip Summary */}
        {request.status === 'completed' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Trip Summary</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2 text-sm">Timeline</h3>
                <div className="space-y-1.5">
                  <p className="text-slate-700 text-sm"><span className="font-medium">Started:</span> {formatDate(request.acceptedAt)}</p>
                  <p className="text-slate-700 text-sm"><span className="font-medium">Completed:</span> {formatDate(request.completedAt)}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2 text-sm">Payment</h3>
                <div className="space-y-1.5">
                  <p className="text-slate-700 text-sm"><span className="font-medium">Status:</span> {request.payment?.status || 'Pending'}</p>
                  {request.payment?.amount && (
                    <p className="text-slate-700 text-sm"><span className="font-medium">Amount:</span> ${request.payment.amount}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center">
          <button 
            onClick={() => navigate('/emergency')} 
            className="inline-flex items-center px-6 py-2.5 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors duration-200 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Emergency Services
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyTrack;