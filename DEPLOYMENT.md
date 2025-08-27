# WeHeal Deployment Guide for Render

## Prerequisites
- GitHub repository with your code (✅ Already done)
- Render account (free tier available)
- MongoDB Atlas database (✅ Already configured)
- **IMPORTANT**: All secrets have been removed from the repository for security

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
   
   **⚠️ SECURITY NOTE**: These are your actual production credentials. Keep them secure!

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
   - `REACT_APP_ZEGO_APP_ID`: `1347306852`
   - `REACT_APP_ZEGO_SERVER_SECRET`: `f613212fd9bc5b92cd5f4341e58becde`
   
   **⚠️ SECURITY NOTE**: These are your actual Zego credentials. Keep them secure!

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

### Security Fixes Applied ✅
- **Removed exposed secrets** from git history
- **Deleted all `.env` files** from the repository
- **Added comprehensive `.gitignore`** to prevent future exposure
- **Created environment templates** (`env.template`) for reference
- **Replaced Google API key** with placeholder in Layout.pug

### Environment Variables
- Never commit `.env` files to Git
- Use Render's environment variable interface
- Keep sensitive data secure
- **All secrets are now safely stored in Render environment variables**

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

## Additional Configuration

### Google Maps API Key (if needed)
If you need Google Maps functionality in the live-doc template:
1. Get a new Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Replace `YOUR_GOOGLE_MAPS_API_KEY` in `live-doc-v1.0.0/src/pug/layouts/Layout.pug`
3. **Never commit the actual API key to git**

## Support

- Render Documentation: [https://render.com/docs](https://render.com/docs)
- Render Community: [https://community.render.com](https://community.render.com)
- MongoDB Atlas: [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
