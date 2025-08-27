import cron from 'node-cron';
import { processDueSubscriptions } from '../controllers/subscriptionController.js';

// Initialize subscription cron jobs
export const initializeSubscriptionCron = () => {
  console.log('Initializing subscription cron jobs...');

  // Process due subscriptions every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily subscription processing at 9:00 AM');
    try {
      await processDueSubscriptions();
    } catch (error) {
      console.error('Error in daily subscription processing:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Backup processing - run every 6 hours to catch any missed subscriptions
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running backup subscription processing (every 6 hours)');
    try {
      await processDueSubscriptions();
    } catch (error) {
      console.error('Error in backup subscription processing:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('Subscription cron jobs initialized successfully');
  console.log('- Daily processing: Every day at 9:00 AM IST');
  console.log('- Backup processing: Every 6 hours');
};
