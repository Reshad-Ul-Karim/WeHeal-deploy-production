# WeHeal Render Deployment Guide

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- MongoDB Atlas database (already configured)

## Backend Deployment Steps

### 1. Deploy Backend to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `weheal-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

### 2. Set Environment Variables for Backend
In Render dashboard, go to your backend service → Environment tab:

```
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/weHeal?retryWrites=true&w=majority&appName=sammam
JWT_SECRET=mysecretkey
MAILTRAP_TOKEN=0a4acdad7f9377c2a09edbf17a33bdb2
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io
CLIENT_URL=https://weheal-frontend.onrender.com
EMAIL_USER=reshad.steroid1@gmail.com
EMAIL_PASS=rbnb jfxw hqme tcqk
```

### 3. Deploy Backend
- Click "Create Web Service"
- Wait for deployment to complete
- Note your backend URL: `https://weheal-backend.onrender.com`

## Frontend Deployment Steps

### 1. Deploy Frontend to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `weheal-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Root Directory**: `frontend`

### 2. Set Environment Variables for Frontend
In Render dashboard, go to your frontend service → Environment tab:

```
REACT_APP_ZEGO_APP_ID=1347306852
REACT_APP_ZEGO_SERVER_SECRET=f613212fd9bc5b92cd5f4341e58becde
REACT_APP_API_URL=https://weheal-backend.onrender.com/api
```

### 3. Deploy Frontend
- Click "Create Static Site"
- Wait for deployment to complete
- Note your frontend URL: `https://weheal-frontend.onrender.com`

## Important Notes

### Backend Considerations
- Render free tier has limitations (sleeps after 15 minutes of inactivity)
- Consider upgrading to paid plan for production use
- Backend will restart automatically when accessed after sleep

### Frontend Considerations
- Static sites on Render are always available
- Environment variables are baked into the build
- You'll need to redeploy if you change environment variables

### CORS Configuration
Make sure your backend CORS is configured to allow your frontend domain:
```javascript
app.use(cors({
  origin: ['https://weheal-frontend.onrender.com', 'http://localhost:5173'],
  credentials: true
}));
```

### Database Connection
- Your MongoDB Atlas is already configured
- Make sure your IP whitelist includes Render's IP ranges
- Or set `0.0.0.0/0` for all IPs (less secure but easier for development)

## Troubleshooting

### Common Issues
1. **Build Failures**: Check build logs in Render dashboard
2. **Environment Variables**: Ensure all required variables are set
3. **CORS Errors**: Update CORS configuration in backend
4. **Database Connection**: Verify MongoDB connection string and IP whitelist

### Checking Logs
- Backend logs: Render dashboard → Your service → Logs
- Frontend build logs: Render dashboard → Your service → Build logs

## Post-Deployment Checklist
- [ ] Backend is accessible at `https://weheal-backend.onrender.com`
- [ ] Frontend is accessible at `https://weheal-frontend.onrender.com`
- [ ] API calls from frontend to backend work
- [ ] Database connection is working
- [ ] Authentication flow works
- [ ] All features are functional

## Performance Optimization
- Enable gzip compression in backend
- Optimize images and assets
- Consider CDN for static assets
- Monitor performance in Render dashboard
