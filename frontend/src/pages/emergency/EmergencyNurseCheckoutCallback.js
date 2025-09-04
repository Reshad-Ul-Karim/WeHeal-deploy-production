import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const EmergencyNurseCheckoutCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const qs = useMemo(() => Object.fromEntries(new URLSearchParams(location.search)), [location.search]);
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        // In a real gateway, you'd verify by reading transactionId/status from the provider.
        // Here we assume success and finalize by creating the request via confirm endpoint.
        const confirmRes = await api.post('/emergency-nurse/payment/confirm', {
          // paymentId is optional if you only use global /checkout; we directly create
          paymentId: undefined,
          nurseId: qs.nurseId,
          description: qs.description || '',
          urgency: qs.urgency,
          estimatedDuration: parseInt(qs.hours || '1', 10),
          preferredTime: qs.preferredTime || '',
          location: qs.location || '',
          transactionId: `TX-${Date.now()}`,
          status: 'completed',
        });

        if (!confirmRes.data?.success) throw new Error('Failed to finalize request');
        setStatus('success');
        setTimeout(() => navigate('/emergency/my-requests'), 1200);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed to finalize');
        setStatus('failed');
      }
    };
    run();
  }, [qs, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white shadow rounded p-6 w-full max-w-md text-center">
        {status === 'processing' && <div>Finalizing your emergency nurse request…</div>}
        {status === 'success' && <div className="text-green-600">Success! Redirecting…</div>}
        {status === 'failed' && (
          <div className="text-red-600">
            {error || 'Something went wrong.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyNurseCheckoutCallback;


