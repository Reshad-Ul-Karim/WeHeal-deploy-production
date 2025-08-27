import React, { useEffect, useMemo, useState } from 'react';
import { websocketService } from '../../services/websocket';

const CustomerCareDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const agent = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return { id: u?._id || u?.id, name: u?.name };
    } catch { return {}; }
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
        setMessages((prev) => [...prev, { from: 'patient', text: msg.text, at: msg.at }]);
      }
    };
    websocketService.subscribe('chat:new', onNew);
    websocketService.subscribe('chat:assigned', onAssigned);
    websocketService.subscribe('chat:message', onMsg);
    return () => {
      websocketService.unsubscribe('chat:new', onNew);
      websocketService.unsubscribe('chat:assigned', onAssigned);
      websocketService.unsubscribe('chat:message', onMsg);
    };
  }, [activePatient, agent.id]);

  const takeChat = (patientId) => {
    websocketService.send('chat:assign', { patientId, agent });
  };

  const send = () => {
    if (!input.trim() || !activePatient) return;
    const msg = { from: 'agent', text: input.trim(), at: new Date().toISOString(), patientId: activePatient };
    setMessages((prev) => [...prev, msg]);
    setInput('');
    websocketService.send('chat:message', { toUserId: activePatient, message: msg });
  };

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1>Customer Care</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-body">
            <h3>Queue</h3>
            {queue.length === 0 ? (
              <div style={{ color: '#6b7280' }}>No waiting patients.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {queue.map((q) => (
                  <li key={q.patientId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <div>
                      <div><strong>Patient</strong>: {q.patientId.slice(-6)}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>Requested at {new Date(q.timestamp || Date.now()).toLocaleTimeString()}</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => takeChat(q.patientId)}>Take</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3>Chat</h3>
            {!activePatient ? (
              <div style={{ color: '#6b7280' }}>Select a patient from the queue to start chatting.</div>
            ) : (
              <>
                <div style={{ color: '#6b7280', marginBottom: 8 }}>Chatting with patient {activePatient.slice(-6)}</div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, height: 360, overflowY: 'auto', padding: 8, marginBottom: 8 }}>
                  {messages.length === 0 ? (
                    <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 24 }}>No messages yet.</div>
                  ) : (
                    messages.map((m, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: m.from === 'agent' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                        <div style={{ background: m.from === 'agent' ? '#2563eb' : '#f3f4f6', color: m.from === 'agent' ? '#fff' : '#111827', padding: '6px 10px', borderRadius: 12, maxWidth: '70%' }}>
                          {m.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1 }} />
                  <button className="btn btn-primary" onClick={send}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCareDashboard;


