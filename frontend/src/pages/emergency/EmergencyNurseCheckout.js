import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const parseQuery = (search) => Object.fromEntries(new URLSearchParams(search));

const rateMap = {
  critical: 800,
  high: 650,
  medium: 500,
  low: 380,
};

const EmergencyNurseCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const qs = useMemo(() => parseQuery(location.search), [location.search]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentRef, setPaymentRef] = useState(null);

  const urgency = (qs.urgency || 'medium').toLowerCase();
  const hours = Math.max(1, parseInt(qs.hours || qs.estimatedDuration || '1', 10));
  const rate = rateMap[urgency] || rateMap.medium;
  const amount = rate * hours;

  const handlePay = async () => {
    try {
      setLoading(true);
      setError('');

      // 1) Init payment via existing payment route
      const orderId = `ENR-${Date.now()}`;
      const initRes = await api.post('/payments/init', {
        orderId,
        amount,
        paymentMethod: 'mobile',
        paymentType: 'emergency_nurse',
        paymentDetails: {
          nurseId: qs.nurseId,
          urgency,
          hours,
        },
      });

      if (!initRes.data?.success) throw new Error('Payment init failed');
      const payment = initRes.data.data;
      setPaymentRef(payment);

      // 2) Simulate gateway success; confirm + create emergency request
      const confirmRes = await api.post('/emergency-nurse/payment/confirm', {
        paymentId: payment._id,
        nurseId: qs.nurseId,
        description: qs.description || '',
        urgency,
        estimatedDuration: hours,
        preferredTime: qs.preferredTime || '',
        location: qs.location || '',
        transactionId: `TX-${Date.now()}`,
        status: 'completed',
      });

      if (!confirmRes.data?.success) throw new Error('Payment confirm failed');

      navigate('/emergency/my-requests');
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Emergency Nurse Checkout</h1>

          <div className="space-y-2 text-sm text-gray-700 mb-6">
            <div><span className="font-medium">Urgency:</span> {urgency}</div>
            <div><span className="font-medium">Hours:</span> {hours}</div>
            <div><span className="font-medium">Rate/hour:</span> ৳ {rate}</div>
            <div><span className="font-medium">Total:</span> ৳ {amount}</div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Back
            </button>
            <button
              onClick={handlePay}
              className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              disabled={loading}
            >
              {loading ? 'Processing…' : 'Pay & Confirm'}
            </button>
          </div>

          {paymentRef && (
            <div className="mt-6 text-xs text-gray-500">Payment Ref: {paymentRef.orderId}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyNurseCheckout;


