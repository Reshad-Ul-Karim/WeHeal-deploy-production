import { api } from '../utils/api';

// Initialize a payment intent with the backend
// params: { orderId: string, amount: number, paymentMethod: 'mobile'|'card'|'bank'|'bKash'|'Rocket'|'Nagad'|'Qcash', paymentType: string, paymentDetails?: object }
export async function initPayment(params) {
	const { orderId, amount, paymentMethod, paymentType = 'marketplace', paymentDetails = {} } = params;
	if (!orderId || !amount || !paymentMethod) {
		throw new Error('orderId, amount, and paymentMethod are required');
	}
	const { data } = await api.post('/payments/init', {
		orderId,
		amount,
		paymentMethod,
		paymentType,
		paymentDetails,
	});
	return data;
}

// Verify/update a payment after gateway returns
// params: { orderId: string, transactionId: string, status: 'completed'|'failed' }
export async function verifyPayment(params) {
	const { orderId, transactionId, status } = params;
	if (!orderId) throw new Error('orderId is required');
	const { data } = await api.post(`/payments/verify/${orderId}`, { transactionId, status });
	return data;
}

// Optional: get current payment status from backend
export async function getPaymentStatus(orderId) {
	if (!orderId) throw new Error('orderId is required');
	const { data } = await api.get(`/payments/status/${orderId}`);
	return data;
}
