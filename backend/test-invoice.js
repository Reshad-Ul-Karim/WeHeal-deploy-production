import fetch from 'node-fetch';
import fs from 'fs';

// Test invoice generation
const testInvoiceGeneration = async () => {
  try {
    console.log('Testing invoice generation...');
    
    // You'll need to replace these with actual values from your database
    const testOrderId = 'ORD-1735165200000-123'; // Replace with actual order ID
    const testToken = 'your-jwt-token-here'; // Replace with actual JWT token
    
    const response = await fetch(`http://localhost:5001/api/orders/${testOrderId}/invoice`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const buffer = await response.buffer();
      fs.writeFileSync('./test-invoice.pdf', buffer);
      console.log('✅ Invoice generated successfully! Check test-invoice.pdf');
    } else {
      const error = await response.text();
      console.error('❌ Error generating invoice:', error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Uncomment the line below to run the test
// testInvoiceGeneration();

console.log('Invoice test script created. Update the test values and uncomment the function call to test.');
