import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const verifyToken = async (req, res, next) => {
	console.log('=== verifyToken middleware called ===');
	console.log('URL:', req.originalUrl);
	console.log('Cookies:', req.cookies);
	console.log('Authorization header:', req.headers.authorization);

	// Check for token in cookies or Authorization header
	let token = req.cookies.token;
	
	// If no token in cookies, check Authorization header
	if (!token && req.headers.authorization) {
		const authHeader = req.headers.authorization;
		if (authHeader.startsWith('Bearer ')) {
			token = authHeader.split(' ')[1];
		}
	}

	console.log('Token found:', !!token);
	console.log('Token value:', token ? token.substring(0, 20) + '...' : 'none');

	if (!token) {
		console.log('No token found in cookies or Authorization header');
		return res.status(401).json({ 
			success: false, 
			message: "Unauthorized - no token provided" 
		});
	}

	try {
		const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
		if (!process.env.JWT_SECRET) {
			console.warn('[Auth] JWT_SECRET not set. Using insecure dev secret to verify token.');
		}
		const decoded = jwt.verify(token, secret);
		console.log('Token decoded successfully:', decoded);

		// Fetch full user details from database
		const user = await User.findById(decoded.userId).select('-password');
		if (!user) {
			console.log('User not found for token');
			return res.status(401).json({ 
				success: false, 
				message: "User not found" 
			});
		}

		console.log('User found:', user._id, user.name, user.role);

		req.userId = decoded.userId;
		req.user = user;
		console.log('=== verifyToken middleware completed successfully ===');
		next();
	} catch (error) {
		console.error('Token verification failed:', error);
		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({ 
				success: false, 
				message: "Token has expired" 
			});
		}
		if (error.name === 'JsonWebTokenError') {
			return res.status(401).json({ 
				success: false, 
				message: "Invalid token" 
			});
		}
		return res.status(401).json({ 
			success: false, 
			message: "Token verification failed" 
		});
	}
};