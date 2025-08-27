// backend/routes/reports.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /reports/:orderId/:productId - View specific report
router.get('/:orderId/:productId', protect, (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const reportPath = path.join(__dirname, '../reports', `report_${orderId}_${productId}.pdf`);
    
    if (fs.existsSync(reportPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=lab-report.pdf');
      fs.createReadStream(reportPath).pipe(res);
    } else {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  } catch (error) {
    console.error('Error serving report:', error);
    res.status(500).json({ success: false, message: 'Error serving report' });
  }
});

// GET /reports/:orderId/:productId/download - Download specific report
router.get('/:orderId/:productId/download', protect, (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const reportPath = path.join(__dirname, '../reports', `report_${orderId}_${productId}.pdf`);
    
    if (fs.existsSync(reportPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=lab-report-${orderId}.pdf`);
      fs.createReadStream(reportPath).pipe(res);
    } else {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ success: false, message: 'Error downloading report' });
  }
});

export default router;
