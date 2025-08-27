import { useState } from 'react';
import { Link } from 'react-router-dom';
import EmergencyRequest from '../../components/emergency/EmergencyRequest';

const Emergency = () => {
  const [selectedTab, setSelectedTab] = useState('request');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Emergency Medical Services
            </h1>
            <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto">
              Get immediate medical transport and emergency assistance when you need it most
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <div className="inline-flex items-center px-6 py-3 bg-white text-red-600 font-semibold rounded-lg shadow-lg hover:bg-red-50 transition-all duration-200">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                24/7 Emergency Response
              </div>
              <div className="inline-flex items-center px-6 py-3 bg-white text-red-600 font-semibold rounded-lg shadow-lg hover:bg-red-50 transition-all duration-200">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Certified Medical Staff
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Services & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Services Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Our Services</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start p-4 bg-red-50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Emergency Transport</h3>
                    <p className="text-gray-600 text-sm mt-1">Immediate response for medical emergencies with advanced life support</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-blue-50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Patient Transfer</h3>
                    <p className="text-gray-600 text-sm mt-1">Safe transport between medical facilities with medical monitoring</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-green-50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Medical Care</h3>
                    <p className="text-gray-600 text-sm mt-1">On-site emergency medical attention by qualified professionals</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Emergency Contacts Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Emergency Contacts</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">911</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Emergency Services</p>
                    <a href="tel:911" className="text-red-600 hover:text-red-800 font-medium">Call 911</a>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">24/7 Helpline</p>
                    <a href="tel:+1800123456" className="text-blue-600 hover:text-blue-800 font-medium">1-800-123-456</a>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email Support</p>
                    <a href="mailto:emergency@weheal.com" className="text-green-600 hover:text-green-800 font-medium">emergency@weheal.com</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Tips Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Safety Tips</h2>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Stay calm and provide clear information</p>
                <p>• Keep emergency contacts easily accessible</p>
                <p>• Know your exact location and landmarks</p>
                <p>• Follow dispatcher instructions carefully</p>
              </div>
            </div>
          </div>

          {/* Right Column - Request Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {/* Tab Navigation */}
              <div className="bg-gray-50 border-b border-gray-200">
                <nav className="flex">
                  <button
                    className={`flex-1 py-4 px-6 font-semibold text-lg transition-all duration-200 ${
                      selectedTab === 'request'
                        ? 'text-red-600 bg-white border-b-2 border-red-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedTab('request')}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Request Ambulance
                    </div>
                  </button>
                  <button
                    className={`flex-1 py-4 px-6 font-semibold text-lg transition-all duration-200 ${
                      selectedTab === 'track'
                        ? 'text-red-600 bg-white border-b-2 border-red-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedTab('track')}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                      </svg>
                      Track Request
                    </div>
                  </button>
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="p-8">
                {selectedTab === 'request' ? (
                  <EmergencyRequest />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Track Your Emergency Request</h2>
                    <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
                      If you've already submitted an emergency request, you can track its status and get real-time updates.
                      <br />
                      The tracking ID was provided when you submitted your request.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
                      <p className="text-blue-800 mb-4">
                        <strong>Need to check your requests?</strong>
                      </p>
                      <Link 
                        to="/dashboard" 
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Go to Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emergency;