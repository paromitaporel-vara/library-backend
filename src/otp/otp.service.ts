import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOtp(email: string, type: string): Promise<string> {
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this email and type
    await this.prisma.otp.deleteMany({
      where: { email, type: type as any },
    });

    await this.prisma.otp.create({
      data: {
        email,
        otp,
        type: type as any,
        expiresAt,
      },
    });

    return otp;
  }

  async verifyOtp(email: string, otp: string, type: string): Promise<boolean> {
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        email,
        otp,
        type: type as any,
        expiresAt: { gte: new Date() },
      },
    });

    if (otpRecord) {
      // Delete used OTP
      await this.prisma.otp.delete({
        where: { id: otpRecord.id },
      });
      return true;
    }

    return false;
  }

  async sendOtpEmail(email: string, otp: string, purpose: string): Promise<void> {
    // Send OTP via email
    await this.emailService.sendOtp(email, otp, purpose);
    
    // Also log it for debugging/testing
    console.log(`
      ========================================
      OTP Email for ${purpose}
      To: ${email}
      OTP: ${otp}
      Valid for: 10 minutes
      ========================================
    `);
  }
}
