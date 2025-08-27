import Payment from '../models/paymentModel.js';
import Order from '../models/orderModel.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Add debugging for model import
console.log('=== Payment Controller Import Debug ===');
console.log('Payment model imported:', Payment);
console.log('Payment model name:', Payment?.modelName);
console.log('Payment model schema:', Payment?.schema);
console.log('Payment model db:', Payment?.db);
console.log('=== End Import Debug ===');

export const initPayment = async (req, res) => {
	try {
		const userId = req.user._id;
		const { orderId, amount, paymentMethod, paymentType = 'marketplace', paymentDetails = {} } = req.body;

		if (!orderId || !amount || !paymentMethod) {
			return res.status(400).json({ success: false, message: 'orderId, amount, and paymentMethod are required' });
		}

		const payment = await Payment.create({
			orderId,
			userId,
			amount,
			paymentMethod,
			paymentType,
			status: 'pending',
			paymentDetails,
		});

		return res.status(201).json({ success: true, data: payment });
	} catch (error) {
		console.error('initPayment error', error);
		return res.status(500).json({ success: false, message: 'Failed to init payment', error: error.message });
	}
};

export const verifyPayment = async (req, res) => {
	try {
		const userId = req.user._id;
		const { orderId } = req.params;
		const { transactionId, status } = req.body;

		const payment = await Payment.findOne({ orderId, userId });
		if (!payment) {
			return res.status(404).json({ success: false, message: 'Payment not found' });
		}

		payment.status = status;
		payment.transactionId = transactionId || payment.transactionId;
		await payment.save();

		// Update order payment status if completed
		const order = await Order.findOne({ orderId, userId });
		if (order) {
			order.paymentStatus = status === 'completed' ? 'paid' : status === 'failed' ? 'failed' : order.paymentStatus;
			if (status === 'completed' && order.status === 'pending') {
				order.status = 'confirmed';
			}
			await order.save();
		}

		return res.json({ success: true, data: payment });
	} catch (error) {
		console.error('verifyPayment error', error);
		return res.status(500).json({ success: false, message: 'Failed to verify payment', error: error.message });
	}
};

export const getPaymentStatus = async (req, res) => {
	try {
		const userId = req.user._id;
		const { orderId } = req.params;
		const payment = await Payment.findOne({ orderId, userId });
		if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
		return res.json({ success: true, data: payment });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to get payment status', error: error.message });
	}
};

export const getUserPayments = async (req, res) => {
	try {
		const userId = req.user._id;
		console.log('getUserPayments called for user:', userId);
		console.log('User ID type:', typeof userId);
		console.log('User ID value:', userId);
		
		// Check if Payment model is properly imported
		console.log('Payment model:', Payment);
		console.log('Payment model name:', Payment.modelName);
		
		// Check database connection
		console.log('Database connection state:', Payment.db.readyState);
		console.log('Database name:', Payment.db.name);
		console.log('Database host:', Payment.db.host);
		console.log('Database port:', Payment.db.port);
		console.log('Database collections:', Object.keys(Payment.db.collections));
		console.log('Database models:', Object.keys(Payment.db.models));
		console.log('Database connection string:', Payment.db.client.s.url);
		console.log('Database connection options:', Payment.db.client.s.options);
		console.log('Database connection ready state:', Payment.db.client.topology?.isConnected());
		console.log('Database connection server info:', Payment.db.client.topology?.description);
		console.log('Database connection events:', Payment.db.client.topology?.eventNames());
		console.log('Database connection state:', Payment.db.client.topology?.s?.state);
		console.log('Database connection topology:', Payment.db.client.topology?.description?.servers);
		console.log('Database connection max pool size:', Payment.db.client.topology?.s?.options?.maxPoolSize);
		console.log('Database connection current pool size:', Payment.db.client.topology?.s?.pool?.currentSize);
		console.log('Database connection available pool size:', Payment.db.client.topology?.s?.pool?.available);
		console.log('Database connection wait queue size:', Payment.db.client.topology?.s?.pool?.waitQueueSize);
		console.log('Database connection pending pool size:', Payment.db.client.topology?.s?.pool?.pending);
		console.log('Database connection total pool size:', Payment.db.client.topology?.s?.pool?.totalConnectionCount);
		
		// Check if we can perform a simple query
		try {
			const count = await Payment.countDocuments({});
			console.log('Total documents in Payment collection:', count);
		} catch (countError) {
			console.error('Error counting Payment documents:', countError);
			console.error('Count error details:', {
				name: countError.name,
				message: countError.message,
				stack: countError.stack
			});
		}
		
		// Test creating a payment to see if the model works
		try {
			console.log('Testing Payment model by creating a test payment...');
			console.log('Payment model schema:', Payment.schema);
			console.log('Payment model schema paths:', Object.keys(Payment.schema.paths));
			console.log('Payment model schema options:', Payment.schema.options);
			console.log('Payment model indexes:', Payment.schema.indexes());
			console.log('Payment model required fields:', Object.keys(Payment.schema.paths).filter(path => Payment.schema.paths[path].isRequired));
			console.log('Payment model enum values:', {
				paymentMethod: Payment.schema.paths.paymentMethod.enumValues,
				status: Payment.schema.paths.status.enumValues
			});
			
			const testPayment = new Payment({
				orderId: 'TEST-' + Date.now(),
				userId: userId,
				amount: 100,
				paymentMethod: 'mobile',
				paymentType: 'test',
				status: 'completed',
				transactionId: 'TEST-TXN-' + Date.now(),
				paymentDetails: { test: true },
				currency: 'INR'
			});
			
			// Validate the test payment
			const validationError = testPayment.validateSync();
			if (validationError) {
				console.error('Payment model validation error:', validationError);
				console.error('Validation error details:', {
					name: validationError.name,
					message: validationError.message,
					errors: validationError.errors
				});
			} else {
				console.log('Payment model validation passed');
			}
			
			// Don't actually save the test payment, just validate it
		} catch (testError) {
			console.error('Error testing Payment model:', testError);
			console.error('Test error details:', {
				name: testError.name,
				message: testError.message,
				stack: testError.stack
			});
		}
		
		const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
		console.log('Found payments for user:', payments.length);
		console.log('Payments data:', payments);
		
		// Also try to find any payments without userId filter to see if there are any payments at all
		const allPayments = await Payment.find({}).limit(5);
		console.log('Total payments in database:', allPayments.length);
		console.log('Sample payments:', allPayments);
		
		// Check if the userId is being converted to ObjectId properly
		console.log('Query used:', { userId });
		console.log('Query userId type:', typeof userId);
		
		return res.json({ success: true, data: payments });
	} catch (error) {
		console.error('getUserPayments error:', error);
		console.error('Error stack:', error.stack);
		console.error('Error name:', error.name);
		console.error('Error message:', error.message);
		return res.status(500).json({ success: false, message: 'Failed to get payments', error: error.message });
	}
};

export const generateReceipt = async (req, res) => {
	try {
		const userId = req.user._id;
		const { orderId } = req.params;
		const payment = await Payment.findOne({ orderId, userId });
		const order = await Order.findOne({ orderId, userId }).populate('items.productId');
		if (!payment || !order) return res.status(404).json({ success: false, message: 'Not found' });

		const receiptsDir = path.join(process.cwd(), 'uploads', 'receipts');
		if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });
		const fileName = `receipt_${orderId}.pdf`;
		const filePath = path.join(receiptsDir, fileName);

		const doc = new PDFDocument({ margin: 50 });
		const writeStream = fs.createWriteStream(filePath);
		doc.pipe(writeStream);

		// Header
		doc.fontSize(20).text('WeHeal - Payment Receipt', { align: 'center' });
		doc.moveDown();
		doc.fontSize(12).text(`Order ID: ${orderId}`);
		doc.text(`Transaction ID: ${payment.transactionId || '-'}`);
		doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
		doc.text(`Status: ${payment.status}`);
		doc.moveDown();

		// Items table
		doc.fontSize(14).text('Items');
		doc.moveDown(0.5);
		order.items.forEach((item) => {
			doc.fontSize(12).text(`${item.name} x${item.quantity} - ₹${item.total.toFixed(2)}`);
		});
		doc.moveDown();
		doc.fontSize(12).text(`Total Amount: ₹${order.totalAmount.toFixed(2)}`);
		doc.text(`Paid Via: ${payment.paymentMethod}`);

		doc.end();

		writeStream.on('finish', async () => {
			payment.receiptPath = `/uploads/receipts/${fileName}`;
			await payment.save();
			return res.json({ success: true, data: { url: payment.receiptPath } });
		});
	} catch (error) {
		console.error('generateReceipt error', error);
		return res.status(500).json({ success: false, message: 'Failed to generate receipt', error: error.message });
	}
};


