import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('verify')
  async verifyOtp(@Body() body: { email: string; otp: string; purpose: string }) {
    const { email, otp, purpose } = body;
    const isValid = await this.otpService.verifyOtp(email, otp, purpose);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    return { message: 'OTP verified successfully' };
  }
}
