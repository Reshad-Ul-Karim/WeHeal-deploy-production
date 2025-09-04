import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import {
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const PatientEmergencyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  useEffect(() => {
    fetchPatientRequests();
    // Auto-refresh to keep active requests up-to-date
    const intervalId = setInterval(() => {
      fetchPatientRequests();
    }, 10000); // every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const fetchPatientRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/emergency-nurse/patient/requests');
      if (response.data.success) {
        setRequests(response.data.data.requests);
      }
    } catch (err) {
      setError('Failed to fetch emergency requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRateService = (request) => {
    setSelectedRequest(request);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    try {
      const response = await api.post('/emergency-nurse/rate-nurse', {
        requestId: selectedRequest._id,
        rating,
        review
      });
      if (response.data.success) {
        // Refresh requests to show updated rating
        await fetchPatientRequests();
        alert('Rating submitted successfully!');
        setShowRatingModal(false);
        setRating(0);
        setReview('');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'accepted': return 'blue';
      case 'in_progress': return 'purple';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-5 w-5" />;
      case 'cancelled': return <ExclamationTriangleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <h6 className="mt-4 text-lg font-semibold text-gray-700">Loading your emergency requests...</h6>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Emergency Requests
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Track and manage your emergency nurse service requests
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/emergency/nurse-marketplace'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Request New Service
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow">
            <div className="text-center py-12">
              <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h5 className="text-gray-500 mb-2">No emergency requests yet</h5>
              <p className="text-gray-400 mb-6">
                You haven't made any emergency nurse service requests yet.
              </p>
              <button
                onClick={() => window.location.href = '/emergency/nurse-marketplace'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Request Emergency Service
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {request.nurseId?.name?.charAt(0) || 'N'}
                      </div>
                      <div>
                        <h6 className="text-lg font-semibold text-gray-900">
                          {request.nurseId?.name || 'Nurse Name'}
                        </h6>
                        <p className="text-sm text-gray-600">
                          {request.nurseId?.nurseDetails?.specialization || 'General'} Nurse
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 bg-${getStatusColor(request.status)}-100 text-${getStatusColor(request.status)}-800 text-xs rounded-full capitalize`}>
                            {request.status}
                          </span>
                          <span className={`px-2 py-1 bg-${getUrgencyColor(request.urgency)}-100 text-${getUrgencyColor(request.urgency)}-800 text-xs rounded-full capitalize`}>
                            {request.urgency}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="mb-4">
                    <h6 className="text-lg font-semibold text-gray-900 mb-2">
                      Service Details
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Description</p>
                        <p className="text-gray-900">
                          {request.description}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Duration: {request.estimatedDuration} hour{request.estimatedDuration > 1 ? 's' : ''}
                          </span>
                        </div>
                        {request.location && (
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Location: {request.location}
                            </span>
                          </div>
                        )}
                        {request.preferredTime && (
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Preferred: {new Date(request.preferredTime).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mb-4">
                    <h6 className="text-lg font-semibold text-gray-900 mb-2">
                      Status Timeline
                    </h6>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">
                          Requested: {new Date(request.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {request.acceptedAt && (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600">
                            Accepted: {new Date(request.acceptedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {request.completedAt && (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                          <span className="text-gray-600">
                            Completed: {new Date(request.completedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="mb-4">
                      <h6 className="text-lg font-semibold text-gray-900 mb-2">
                        Service Notes
                      </h6>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {request.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      {request.status === 'completed' && !request.alreadyRated && (
                        <button
                          onClick={() => handleRateService(request)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex items-center space-x-2"
                        >
                          <StarIcon className="h-4 w-4" />
                          <span>Rate Service</span>
                        </button>
                      )}
                      {request.status === 'pending' && (
                        <button
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Request ID: {request._id.slice(-8)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {selectedRequest?.nurseId?.name?.charAt(0) || 'N'}
              </div>
              <div>
                <h5 className="text-xl font-semibold">Rate Your Experience</h5>
                <p className="text-sm text-gray-600">
                  How was your service with {selectedRequest?.nurseId?.name}?
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Service Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h6 className="text-lg font-semibold text-gray-900 mb-2">
                  Service Details
                </h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nurse:</span>
                    <span className="font-medium">{selectedRequest?.nurseId?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Specialization:</span>
                    <span className="font-medium">{selectedRequest?.nurseId?.nurseDetails?.specialization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Date:</span>
                    <span className="font-medium">
                      {new Date(selectedRequest?.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {selectedRequest?.estimatedDuration} hour{selectedRequest?.estimatedDuration > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Section */}
              <div>
                <h6 className="text-lg font-semibold text-gray-900 mb-3">
                  How would you rate this service? *
                </h6>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setRating(i + 1)}
                        className="focus:outline-none"
                      >
                        <StarIcon 
                          className={`h-8 w-8 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                        />
                      </button>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {rating > 0 && (
                      <span>
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Review Section */}
              <div>
                <h6 className="text-lg font-semibold text-gray-900 mb-3">
                  Share your experience (optional)
                </h6>
                <textarea
                  placeholder="Write a review about your experience..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {review.length}/500 characters
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setReview('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0}
                className={`px-4 py-2 rounded-md font-medium ${
                  rating === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientEmergencyRequests;
