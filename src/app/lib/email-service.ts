
'use server';

import * as nodemailer from 'nodemailer';

/**
 * @fileOverview Clinical email notification service for CuraCare AI.
 * Handles the generation and dispatch of professional pharmaceutical order confirmations.
 */

interface OrderEmailData {
  to: string;
  patientName: string;
  orderId: string;
  medicineName: string;
  dosage: string;
  quantity: number;
  totalPrice: number;
}

/**
 * Sends a professional HTML order confirmation email to the patient.
 * Uses environment variables for production or falls back to Ethereal for prototyping.
 */
export async function sendOrderEmail(data: OrderEmailData) {
  // Configure transporter. 
  // If credentials aren't in .env, we use a public test account pattern for demonstration.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'marianne.bashirian@ethereal.email', // Fallback test account
      pass: process.env.EMAIL_PASS || '6G8X8X1X8X8X8X8X8X', // Fallback test password
    },
  });

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
          .header { background: #4D67F6; color: white; padding: 32px; text-align: center; }
          .content { padding: 32px; background: white; }
          .order-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
          .value { font-weight: 700; color: #1e293b; }
          .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
          .badge { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Order Confirmed</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Clinical Fulfillment Active</p>
          </div>
          <div class="content">
            <p>Hello <strong>${data.patientName}</strong>,</p>
            <p>Your pharmaceutical order has been successfully verified, processed, and dispatched to our warehouse for fulfillment.</p>
            
            <div class="order-details">
              <div class="detail-row">
                <span class="label">Order ID</span>
                <span class="value" style="font-family: monospace;">${data.orderId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Medication</span>
                <span class="value">${data.medicineName} (${data.dosage})</span>
              </div>
              <div class="detail-row">
                <span class="label">Quantity</span>
                <span class="value">${data.quantity} Units</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Price</span>
                <span class="value">$${data.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div style="margin: 32px 0;">
              <h3 style="font-size: 16px; margin-bottom: 8px;">Delivery Timeline</h3>
              <p style="font-size: 14px; color: #475569;">
                Status: <span class="badge">Dispatched</span><br>
                Estimated Delivery: <strong>24-48 Hours</strong>
              </p>
            </div>

            <p style="font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; pt: 16px;">
              Your order was verified by CuraCare AI Clinical Pharmacist. You can track your order live in your dashboard.
            </p>
          </div>
          <div class="footer">
            &copy; 2024 CuraCare AI. Clinical precision in every dose.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"CuraCare AI Pharmacist" <pharmacy@curacare.ai>',
      to: data.to,
      subject: `Order Confirmed: ${data.medicineName} (${data.orderId})`,
      html: htmlTemplate,
    });

    console.log(`--- [CLINICAL EMAIL DISPATCHED] ---`);
    console.log(`Recipient: ${data.to}`);
    console.log(`Message ID: ${info.messageId}`);
    
    // Log preview URL for testing purposes if using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`);
    }
    
    return { success: true, message: 'Email dispatched successfully.', messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Email Dispatch Error:', error);
    return { success: false, message: 'Email dispatch failed.' };
  }
}
