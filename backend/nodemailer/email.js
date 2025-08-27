import { transporter, sender } from './mailConfig.js';
import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  PAYMENT_CONFIRMATION_TEMPLATE,
} from './emailTemplates.js';

// Utility function to send emails
const sendEmail = async ({ to, subject, html, category }) => {
  try {
    const mailOptions = {
      from: `${sender.name} <${sender.email}>`,
      to,
      subject,
      html,
      headers: {
        'X-Mailer': 'Nodemailer',
        'Category': category,
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`${subject} email sent successfully: ${info.response}`);
  } catch (error) {
    console.error(`Error sending ${subject} email:`, error);
    throw new Error(`Error sending ${subject} email: ${error}`);
  }
};

// Email sending functions
export const sendVerificationEmail = async (email, verificationToken) => {
  const html = VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken);
  await sendEmail({ to: email, subject: "Verify your email", html, category: "Email Verification" });
};

export const sendWelcomeEmail = async (email, name) => {
  const html = VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", name); // Example, use proper template
  await sendEmail({ to: email, subject: "Welcome to WeHeal", html, category: "Welcome" });
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const html = PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL);
  await sendEmail({ to: email, subject: "Reset your password", html, category: "Password Reset" });
};

export const sendResetSuccessEmail = async (email) => {
  await sendEmail({ to: email, subject: "Password Reset Successful", html: PASSWORD_RESET_SUCCESS_TEMPLATE, category: "Password Reset" });
};

export const sendPaymentConfirmationEmail = async (email, orderData) => {
  try {
    // Format the order items list
    const itemsList = orderData.items.map(item => `
      <div style="border-bottom: 1px solid #e9ecef; padding: 10px 0; display: flex; justify-content: space-between;">
        <div>
          <strong>${item.name}</strong><br>
          <span style="color: #666; font-size: 14px;">Category: ${item.category}</span><br>
          <span style="color: #666; font-size: 14px;">Quantity: ${item.quantity}</span>
        </div>
        <div style="text-align: right;">
          <strong>₹${item.total}</strong>
        </div>
      </div>
    `).join('');

    // Format shipping address
    const shippingAddress = `${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}`;

    // Format estimated delivery date
    const estimatedDelivery = new Date(orderData.estimatedDelivery).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format order date
    const orderDate = new Date(orderData.createdAt).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = PAYMENT_CONFIRMATION_TEMPLATE
      .replace('{customerName}', orderData.customerName)
      .replace('{orderId}', orderData.orderId)
      .replace('{orderDate}', orderDate)
      .replace('{totalAmount}', orderData.totalAmount)
      .replace('{paymentMethod}', orderData.paymentMethod)
      .replace('{transactionId}', orderData.transactionId)
      .replace('{itemsList}', itemsList)
      .replace('{shippingAddress}', shippingAddress)
      .replace('{estimatedDelivery}', estimatedDelivery);

    await sendEmail({ 
      to: email, 
      subject: `Payment Confirmation - Order ${orderData.orderId} | WeHeal`, 
      html, 
      category: "Payment Confirmation" 
    });

    console.log(`Payment confirmation email sent successfully to: ${email}`);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
};
