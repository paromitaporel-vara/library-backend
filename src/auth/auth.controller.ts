import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  
  @Post('login')
  async login(@Body() dto: CreateAuthDto) {
    return this.authService.login(dto);
  }
  
  @Post('register')
  async register(@Body() dto: CreateAuthDto) {
    return this.authService.register(dto);
  }

  @Post('forgot-password/send-otp')
  async sendPasswordResetOtp(@Body() body: { email: string }) {
    return this.authService.sendPasswordResetOtp(body.email);
  }

  @Post('forgot-password/reset')
  async resetPassword(
    @Body() body: { email: string; otp: string; newPassword: string; confirmPassword: string },
  ) {
    if (body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.authService.resetPassword(body.email, body.otp, body.newPassword);
  }

  @Post('change-password/send-otp')
  async sendPasswordChangeOtp(@Body() body: { email: string }) {
    return this.authService.sendPasswordChangeOtp(body.email);
  }

  @Post('change-password')
  async changePassword(
    @Body() body: { email: string; otp: string; oldPassword: string; newPassword: string; confirmPassword: string },
  ) {
    if (body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.authService.changePassword(body.email, body.otp, body.oldPassword, body.newPassword);
  }
}
