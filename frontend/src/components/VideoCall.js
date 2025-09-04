import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const VideoCall = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const meetingRef = useRef(null);
  const [callDetails, setCallDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);

  // Get ZegoCloud credentials from environment variables
  const appID = process.env.REACT_APP_ZEGO_APP_ID;
  const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET;

  // Get username from query or fallback to participantName
  const searchParams = new URLSearchParams(location.search);
  const username = searchParams.get('username') || callDetails?.participantName || 'Anonymous';

  // Check camera and microphone permissions
  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setCameraPermission('granted');
      // Stop the stream immediately as we just needed to check permissions
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Permission denied:', err);
      setCameraPermission('denied');
    }
  };

  // Helper function to get user role
  const getUserRole = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const role = userData.role || 'Patient';
    console.log('VideoCall - User role detected:', role, 'User data:', userData);
    return role;
  };

  useEffect(() => {
    console.log('VideoCall mounted');
    
    // Check camera permissions first
    checkPermissions();
    
    const fetchCallDetails = async () => {
      try {
        const response = await api.get(`/video-call/${appointmentId}`);
        setCallDetails(response.data.data);
        setLoading(false);
        console.log('Fetched call details:', response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching call details');
        setLoading(false);
        console.error('Error fetching call details:', err);
      }
    };
    fetchCallDetails();
  }, [appointmentId]);

  useEffect(() => {
    if (!callDetails || !appID || !serverSecret) return;
    console.log('callDetails:', callDetails);
    console.log('meetingRef.current:', meetingRef.current);
    
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      Number(appID),
      serverSecret,
      callDetails.roomId,
      Date.now().toString(),
      username
    );
    
    const zc = ZegoUIKitPrebuilt.create(kitToken);
    console.log('Initializing ZegoCloud UI');
    
    zc.joinRoom({
      container: meetingRef.current,
      sharedLinks: [
        {
          name: 'Copy Link',
          url: `${window.location.origin}/video-call/${callDetails.roomId}?username=${encodeURIComponent(username)}`
        }
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      // Video and Audio Settings
      turnOnMicrophoneWhenJoining: true,
      turnOnCameraWhenJoining: true,
      useFrontFacingCamera: true,
      
      // UI Controls
      showScreenSharingButton: true,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: true,
      showUserListButton: true,
      showChatButton: true,
      showLeaveButton: true,
      
      // Local Video Preview Settings
      showLocalVideoPreview: true,
      showLocalVideoPreviewMirror: true,
      
      // Audio/Video Configuration
      audioVideoConfig: {
        channelCount: { ideal: 1 },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        // Video constraints
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      },
      
      // Event Handlers
      onJoinRoom: () => {
        console.log('Successfully joined room');
      },
      
      onLeaveRoom: () => {
        console.log('Left room');
      },
      
      onUserJoin: (user) => {
        console.log('User joined:', user);
      },
      
      onUserLeave: (user) => {
        console.log('User left:', user);
      },
      
      onLeave: async () => {
        try {
          // Update appointment status to completed
          await api.post(`/video-call/${appointmentId}/end`);
          
          // Check user role and navigate accordingly
          const userRole = getUserRole();
          
          if (userRole === 'Doctor') {
            // Doctor goes back to doctor dashboard
            navigate('/dashboard/doctor');
          } else {
            // Patient goes to consultation payment page
            navigate(`/consultation-payment/${appointmentId}`);
          }
        } catch (error) {
          console.error('Error ending call:', error);
          
          // Check user role for fallback navigation
          const userRole = getUserRole();
          
          if (userRole === 'Doctor') {
            navigate('/dashboard/doctor');
          } else {
            navigate(`/consultation-payment/${appointmentId}`);
          }
        }
      }
    });
  }, [callDetails, appID, serverSecret, username, navigate, appointmentId]);

  if (!appID || !serverSecret) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">
          ZegoCloud credentials are missing. Please set REACT_APP_ZEGO_APP_ID and REACT_APP_ZEGO_SERVER_SECRET in your .env file and restart the frontend server.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (cameraPermission === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Camera Access Required</h2>
          <p className="text-gray-600 mb-6">
            Please allow camera and microphone access to join the video call. 
            You can enable permissions in your browser settings and refresh the page.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mr-3"
            >
              Refresh Page
            </button>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Return to Dashboard Button */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => {
            const userRole = getUserRole();
            if (userRole === 'Doctor') {
              navigate('/dashboard/doctor');
            } else {
              navigate('/dashboard/patient');
            }
          }}
          style={{
            padding: '10px 20px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.9)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.7)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ← Return to {getUserRole() === 'Doctor' ? 'Doctor' : 'Patient'} Dashboard
        </button>
      </div>
      
      <div ref={meetingRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default VideoCall; 