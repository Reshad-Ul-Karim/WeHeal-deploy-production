import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Prefer specific history; fallback to all-history if needed
      let res = await api.get('/payments/history');
      if (!res.data?.success) {
        res = await api.get('/payments/all-history');
      }
      const list = res.data?.data || res.data || [];
      // Normalize to array
      const rows = Array.isArray(list) ? list : (list.payments || []);
      setPayments(rows);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading payments…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Billing & Payments</h1>
          <p className="text-gray-600">All your payments including emergency nurse bookings.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
        )}

        {payments.length === 0 ? (
          <div className="bg-white rounded shadow p-6 text-center text-gray-500">No payments yet.</div>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="grid grid-cols-6 gap-3 px-4 py-3 text-sm font-medium bg-gray-50 border-b">
              <div>Date</div>
              <div>Type</div>
              <div>Method</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Transaction</div>
            </div>
            {payments.map((p) => (
              <div key={p._id || p.orderId} className="grid grid-cols-6 gap-3 px-4 py-3 text-sm border-b last:border-b-0">
                <div>{new Date(p.createdAt || p.completedAt || Date.now()).toLocaleString()}</div>
                <div className="capitalize">{p.paymentType || p.type || 'marketplace'}</div>
                <div>{p.paymentMethod || '-'}</div>
                <div>৳ {p.amount}</div>
                <div className={`capitalize ${p.status==='completed'?'text-green-700':p.status==='failed'?'text-red-700':'text-gray-700'}`}>{p.status || '-'}</div>
                <div className="truncate" title={p.transactionId || p.orderId}>{p.transactionId || p.orderId || '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;


