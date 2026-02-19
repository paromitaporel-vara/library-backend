import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    // Using Gmail SMTP for demonstration
    // For production, use environment variables for credentials
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
    });
  }

  async sendOtp(email: string, otp: string, purpose: string): Promise<void> {
    try {
      // If no credentials configured, just log OTP and skip email sending
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        this.logger.warn('Email credentials not configured. OTP will be logged to console.');
        console.log(`
          ========================================
          OTP Email for ${purpose}
          To: ${email}
          OTP: ${otp}
          Valid for: 10 minutes
          ========================================
        `);
        return;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Your OTP for ${purpose}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Your One-Time Password (OTP)</h2>
            <p style="color: #666; font-size: 16px;">
              You requested an OTP for <strong>${purpose}</strong>.
            </p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 12px;">Your OTP is:</p>
              <h1 style="margin: 10px 0; color: #007bff; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This OTP is valid for 10 minutes only. Please do not share this OTP with anyone.
            </p>
            <p style="color: #999; font-size: 12px;">
              If you did not request this OTP, please ignore this email.
            </p>
          </div>
        `,
        text: `Your OTP for ${purpose} is: ${otp}. Valid for 10 minutes.`,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
      // Log error but don't throw - allow OTP to be used even if email fails
      console.log(`
        ========================================
        OTP Email FALLBACK (Email Send Failed)
        To: ${email}
        OTP: ${otp}
        Valid for: 10 minutes
        ========================================
      `);
    }
  }
}
