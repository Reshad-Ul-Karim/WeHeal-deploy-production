import React, { useEffect, useMemo, useState } from 'react';
import { websocketService } from '../../services/websocket';
import '../../styles/CustomerCareDashboard.css';

const CustomerCareDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [imageUpload, setImageUpload] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Edit request states
  const [editRequestData, setEditRequestData] = useState({
    userEmail: '',
    requestType: 'profile_update',
    currentData: '',
    requestedChanges: '',
    reason: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [myEditRequests, setMyEditRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const agent = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Raw user data from localStorage:', u);
      console.log('User ID:', u?._id || u?.id);
      console.log('User name:', u?.name);
      return { id: u?._id || u?.id, name: u?.name };
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return {};
    }
  }, []);

  useEffect(() => {
    websocketService.connect();
    const onNew = (data) => {
      setQueue((prev) => {
        const exists = prev.some((q) => q.patientId === data.patientId);
        return exists ? prev : [...prev, data];
      });
    };
    const onAssigned = ({ patientId, agent: assigned }) => {
      // Remove from queue if someone took it
      setQueue((prev) => prev.filter((q) => q.patientId !== patientId));
      // If I took it, initialize chat window
      if (assigned?.id === agent.id) {
        setActivePatient(patientId);
        setMessages([]);
      }
    };
    const onMsg = (msg) => {
      // Only show messages from my active patient
      if (!activePatient) return;
      if (msg.patientId && msg.patientId === activePatient) {
        if (msg.type === 'image') {
          setMessages((prev) => [...prev, { 
            from: 'patient', 
            type: 'image',
            imageUrl: msg.imageUrl,
            fileName: msg.fileName,
            at: msg.at 
          }]);
        } else {
          setMessages((prev) => [...prev, { from: 'patient', text: msg.text, at: msg.at }]);
        }
      }
    };

    const onChatEnded = (data) => {
      // If this chat was ended by the patient or another agent, clear the active chat
      if (data.patientId === activePatient) {
        setActivePatient(null);
        setMessages([]);
        setInputMessage('');
        setImageUpload(null);
        setImagePreview(null);
        setRequestMessage('Chat ended by the other party');
        setTimeout(() => setRequestMessage(''), 3000);
      }
    };

    websocketService.subscribe('chat:new', onNew);
    websocketService.subscribe('chat:assigned', onAssigned);
    websocketService.subscribe('chat:message', onMsg);
    websocketService.subscribe('chat:ended', onChatEnded);
    
    return () => {
      websocketService.unsubscribe('chat:new', onNew);
      websocketService.unsubscribe('chat:assigned', onAssigned);
      websocketService.unsubscribe('chat:message', onMsg);
      websocketService.unsubscribe('chat:ended', onChatEnded);
    };
  }, [activePatient, agent.id]);

  const takeChat = (patientId) => {
    websocketService.send('chat:assign', { patientId, agent });
  };

  const send = () => {
    if (!inputMessage.trim() || !activePatient) return;
    const msg = { from: 'agent', text: inputMessage.trim(), at: new Date().toISOString(), patientId: activePatient };
    setMessages((prev) => [...prev, msg]);
    setInputMessage('');
    websocketService.send('chat:message', { toUserId: activePatient, message: msg });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setImageUpload(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendImage = () => {
    if (!imageUpload || !activePatient) return;
    
    const msg = {
      from: 'agent',
      type: 'image',
      imageUrl: imagePreview,
      fileName: imageUpload.name,
      at: new Date().toISOString(),
      patientId: activePatient
    };
    
    setMessages(prev => [...prev, msg]);
    
    try {
      websocketService.send('chat:message', {
        toUserId: activePatient,
        message: msg
      });
    } catch {}
    
    // Clear image state
    setImageUpload(null);
    setImagePreview(null);
  };

  const removeImage = () => {
    setImageUpload(null);
    setImagePreview(null);
  };

  const endChat = () => {
    if (!activePatient) return;
    
    try {
      websocketService.send('chat:end', { 
        patientId: activePatient, 
        agentId: agent.id 
      });
    } catch {}
    
    // Clear chat state
    setActivePatient(null);
    setMessages([]);
    setInputMessage('');
    setImageUpload(null);
    setImagePreview(null);
    
    // Show success message
    setRequestMessage('Chat ended successfully');
    setTimeout(() => setRequestMessage(''), 3000);
  };

  const handleEditRequestChange = (field, value) => {
    setEditRequestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitEditRequest = async (e) => {
    e.preventDefault();
    if (!editRequestData.userEmail || !editRequestData.requestedChanges || !editRequestData.reason) {
      setRequestMessage("Please fill in all required fields");
      return;
    }
    
    console.log('Agent object:', agent);
    console.log('Agent ID:', agent.id);
    console.log('Agent name:', agent.name);
    
    if (!agent.id) {
      setRequestMessage("Error: Agent ID not found. Please refresh the page.");
      return;
    }
    
    setSubmittingRequest(true);
    setRequestMessage('');
    
    try {
      const requestBody = {
        ...editRequestData,
        customerCareOfficerId: agent.id,
        customerCareOfficerName: agent.name
      };
      
      console.log('Request body being sent:', requestBody);
      console.log('Token from localStorage:', localStorage.getItem('token'));
      
      const response = await fetch('/api/customer-care/edit-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Response from server:', data);
      
      if (data.success) {
        setRequestMessage('Edit request submitted successfully!');
        setEditRequestData({
          userEmail: '',
          requestType: 'profile_update',
          currentData: '',
          requestedChanges: '',
          reason: ''
        });
        // Refresh the list of edit requests
        fetchMyEditRequests();
      } else {
        setRequestMessage(data.message || 'Failed to submit edit request');
      }
    } catch (error) {
      console.error('Error submitting edit request:', error);
      setRequestMessage('Error submitting request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const fetchMyEditRequests = async () => {
    if (!agent.id) return;
    
    setLoadingRequests(true);
    try {
      const response = await fetch(`/api/customer-care/my-requests/${agent.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setMyEditRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching edit requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (agent.id) {
      fetchMyEditRequests();
    }
  }, [agent.id]);

  return (
    <div className="customer-care-dashboard">
      <div className="dashboard-header">
        <h1>Customer Care Dashboard</h1>
        <p>Welcome, {agent.name}</p>
      </div>

      <div className="dashboard-grid">
        {/* Chat Queue Section */}
        <div className="chat-section">
          <div className="section-header">
            <h2>Live Chat Requests</h2>
            <span className="queue-count">{queue.length} waiting</span>
          </div>
          
          <div className="queue-container">
            {queue.length === 0 ? (
              <div className="empty-state">
                <p>No waiting patients</p>
              </div>
            ) : (
              <div className="queue-list">
                {queue.map((q) => (
                  <div key={q.patientId} className="queue-item">
                    <div className="patient-info">
                      <div className="patient-id">Patient #{q.patientId.slice(-6)}</div>
                      <div className="request-time">
                        {new Date(q.timestamp || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                    <button 
                      className="take-chat-btn"
                      onClick={() => takeChat(q.patientId)}
                    >
                      Take Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Chat Section */}
        <div className="chat-section">
          <div className="section-header">
            <h2>Active Chat</h2>
            {activePatient && (
              <span className="active-patient">
                Patient #{activePatient.slice(-6)}
              </span>
            )}
          </div>
          
          {!activePatient ? (
            <div className="empty-state">
              <p>Select a patient from the queue to start chatting</p>
            </div>
          ) : (
            <div className="chat-container">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((m, idx) => (
                      <div key={idx} className={`message ${m.from === 'agent' ? 'agent' : 'patient'}`}>
                        <div className="message-content">
                          {m.type === 'image' ? (
                            <div>
                              <img 
                                src={m.imageUrl} 
                                alt={m.fileName || 'Image'} 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '200px', 
                                  borderRadius: '8px',
                                  marginBottom: '4px'
                                }} 
                              />
                              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                                {m.fileName}
                              </div>
                            </div>
                          ) : (
                            m.text
                          )}
                        </div>
                        <div className="message-time">
                          {new Date(m.at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="chat-input">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && send()}
                />
                <button onClick={send} disabled={!inputMessage.trim()}>
                  Send
                </button>
                <button onClick={endChat} disabled={!activePatient} className="end-chat-btn">
                  End Chat
                </button>
              </div>
              
              {/* Image Upload Section */}
              <div className="image-upload-section">
                <div className="image-upload-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="agent-image-upload"
                  />
                  <label htmlFor="agent-image-upload" className="image-upload-btn">
                    📷 Add Image
                  </label>
                  {imageUpload && (
                    <>
                      <button className="send-image-btn" onClick={sendImage}>
                        Send Image
                      </button>
                      <button className="remove-image-btn" onClick={removeImage}>
                        Remove
                      </button>
                    </>
                  )}
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="image-preview">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="preview-image"
                    />
                    <div className="image-info">
                      <div className="image-name">{imageUpload?.name}</div>
                      <div className="image-size">{(imageUpload?.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Request Section */}
        <div className="edit-request-section">
          <div className="section-header">
            <h2>Submit Edit Request</h2>
            <p>Request changes to user information</p>
          </div>
          
          <form onSubmit={submitEditRequest} className="edit-request-form">
            <div className="form-group">
              <label htmlFor="userEmail">User Email *</label>
              <input
                type="email"
                id="userEmail"
                value={editRequestData.userEmail}
                onChange={(e) => handleEditRequestChange('userEmail', e.target.value)}
                placeholder="Enter user's email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="requestType">Request Type *</label>
              <select
                id="requestType"
                value={editRequestData.requestType}
                onChange={(e) => handleEditRequestChange('requestType', e.target.value)}
                required
              >
                <option value="profile_update">Profile Update</option>
                <option value="password_reset">Password Reset</option>
                <option value="role_change">Role Change</option>
                <option value="verification">Account Verification</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="currentData">Current Data</label>
              <textarea
                id="currentData"
                value={editRequestData.currentData}
                onChange={(e) => handleEditRequestChange('currentData', e.target.value)}
                placeholder="Describe current user data (optional)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="requestedChanges">Requested Changes *</label>
              <textarea
                id="requestedChanges"
                value={editRequestData.requestedChanges}
                onChange={(e) => handleEditRequestChange('requestedChanges', e.target.value)}
                placeholder="Describe the changes you want to make"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Change *</label>
              <textarea
                id="reason"
                value={editRequestData.reason}
                onChange={(e) => handleEditRequestChange('reason', e.target.value)}
                placeholder="Explain why this change is needed"
                rows="3"
                required
              />
            </div>

            {requestMessage && (
              <div className={`message ${requestMessage.includes('successfully') ? 'success' : 'error'}`}>
                {requestMessage}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={submittingRequest}
            >
              {submittingRequest ? 'Submitting...' : 'Submit Edit Request'}
            </button>
          </form>
        </div>
      </div>

      {/* My Edit Requests Section */}
      <div className="my-requests-section">
        <div className="section-header">
          <h2>My Edit Requests</h2>
          <button 
            className="refresh-btn"
            onClick={fetchMyEditRequests}
            disabled={loadingRequests}
          >
            {loadingRequests ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        <div className="requests-container">
          {loadingRequests ? (
            <div className="empty-state">
              <p>Loading requests...</p>
            </div>
          ) : myEditRequests.length === 0 ? (
            <div className="empty-state">
              <p>No edit requests submitted yet</p>
            </div>
          ) : (
            <div className="requests-list">
              {myEditRequests.map((request) => (
                <div key={request._id} className={`request-item ${request.status}`}>
                  <div className="request-header">
                    <div className="request-type">{request.requestType.replace('_', ' ')}</div>
                    <div className={`request-status ${request.status}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </div>
                  </div>
                  
                  <div className="request-details">
                    <div className="detail-row">
                      <span className="label">User:</span>
                      <span className="value">{request.userName} ({request.userId?.email || 'N/A'})</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Requested Changes:</span>
                      <span className="value">{request.requestedChanges}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Reason:</span>
                      <span className="value">{request.reason}</span>
                    </div>
                    {request.adminNotes && (
                      <div className="detail-row">
                        <span className="label">Admin Notes:</span>
                        <span className="value">{request.adminNotes}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="label">Submitted:</span>
                      <span className="value">
                        {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {request.processedAt && (
                      <div className="detail-row">
                        <span className="label">Processed:</span>
                        <span className="value">
                          {new Date(request.processedAt).toLocaleDateString()} at {new Date(request.processedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerCareDashboard;


