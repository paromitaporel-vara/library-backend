import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
    });
  }

  async sendOtp(email: string, otp: string, purpose: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"Library System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your OTP for ${purpose}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your One-Time Password (OTP)</h2>
            <p>You requested an OTP for <strong>${purpose}</strong>.</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center;">
              <p style="font-size: 12px;">Your OTP is:</p>
              <h1 style="font-size: 36px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="font-size: 12px; margin-top: 20px;">
              This OTP is valid for 10 minutes only. Do not share it with anyone.
            </p>
          </div>
        `,
        text: `Your OTP for ${purpose} is: ${otp}. Valid for 10 minutes.`,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP sent successfully via Nodemailer to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw new Error('Failed to send OTP email');
    }
  }
}