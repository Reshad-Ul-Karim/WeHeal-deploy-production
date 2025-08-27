# WeHeal Deployment Guide for Render

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- MongoDB Atlas database (already configured)

## Deployment Steps

### 1. Backend Deployment

1. **Create a new Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `weheal-backend`
     - **Environment**: `Node`
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && npm start`
     - **Plan**: Free

2. **Set Environment Variables:**
   - `MONGO_URI`: `mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/weHeal?retryWrites=true&w=majority&appName=sammam`
   - `PORT`: `10000`
   - `JWT_SECRET`: `mysecretkey`
   - `NODE_ENV`: `production`
   - `MAILTRAP_TOKEN`: `0a4acdad7f9377c2a09edbf17a33bdb2`
   - `MAILTRAP_ENDPOINT`: `https://send.api.mailtrap.io`
   - `CLIENT_URL`: `https://weheal-frontend.onrender.com`
   - `EMAIL_USER`: `reshad.steroid1@gmail.com`
   - `EMAIL_PASS`: `rbnb jfxw hqme tcqk`

3. **Deploy:**
   - Click "Create Web Service"
   - Wait for the build to complete
   - Note the backend URL (e.g., `https://weheal-backend.onrender.com`)

### 2. Frontend Deployment

1. **Create a new Static Site on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `weheal-frontend`
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Publish Directory**: `frontend/build`
     - **Plan**: Free

2. **Set Environment Variables:**
   - `REACT_APP_API_URL`: `https://weheal-backend.onrender.com/api`
   - `REACT_APP_ZEGO_APP_ID`: Your Zego app ID (if using video calls)
   - `REACT_APP_ZEGO_SERVER_SECRET`: Your Zego server secret (if using video calls)

3. **Deploy:**
   - Click "Create Static Site"
   - Wait for the build to complete
   - Note the frontend URL (e.g., `https://weheal-frontend.onrender.com`)

### 3. Update Backend Environment Variables

1. **Go back to your backend service**
2. **Update the CLIENT_URL** to match your frontend URL:
   - `CLIENT_URL`: `https://weheal-frontend.onrender.com`
3. **Redeploy** the backend service

## Important Notes

### Environment Variables
- Never commit `.env` files to Git
- Use Render's environment variable interface
- Keep sensitive data secure

### CORS Configuration
- Backend is configured to accept requests from the frontend domain
- Local development URLs are still included for testing

### Database
- MongoDB Atlas connection is already configured
- Ensure your IP whitelist includes Render's IP ranges

### File Uploads
- Uploads are stored in the `uploads/` directory
- Consider using cloud storage (AWS S3, Cloudinary) for production

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **CORS Errors:**
   - Verify CLIENT_URL is set correctly
   - Check backend CORS configuration
   - Ensure frontend is making requests to the correct backend URL

3. **Database Connection Issues:**
   - Verify MONGO_URI is correct
   - Check MongoDB Atlas network access
   - Ensure database user has correct permissions

4. **Environment Variables:**
   - Double-check all environment variables are set
   - Verify variable names match exactly
   - Check for typos in values

### Monitoring

- Use Render's built-in logging
- Monitor application performance
- Set up alerts for errors

## Post-Deployment

1. **Test all major functionality:**
   - User authentication
   - Database operations
   - File uploads
   - API endpoints

2. **Update DNS/domain (if applicable):**
   - Point your custom domain to Render
   - Update SSL certificates

3. **Set up monitoring:**
   - Health checks
   - Error tracking
   - Performance monitoring

## Support

- Render Documentation: [https://render.com/docs](https://render.com/docs)
- Render Community: [https://community.render.com](https://community.render.com)
- MongoDB Atlas: [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
