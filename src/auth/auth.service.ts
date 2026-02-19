import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateAuthDto } from './dto/create-auth';
import { OtpService } from '../otp/otp.service';



@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) { }


  async validateUser(dto: CreateAuthDto) {
    const { email, password } = dto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }


    const { password: _, ...safeUser } = user;
    return safeUser;
  }


  async login(dto: CreateAuthDto) {
    const user = await this.validateUser(dto); {
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user,
      };
    }
  }


  async register(dto: CreateAuthDto) {
    return this.usersService.create(dto);
  }

  async sendPasswordResetOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = await this.otpService.createOtp(email, 'PASSWORD_RESET');
    await this.otpService.sendOtpEmail(email, otp, 'Password Reset');

    return { message: 'OTP sent to email' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const isValid = await this.otpService.verifyOtp(email, otp, 'PASSWORD_RESET');
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(email, hashedPassword);

    return { message: 'Password reset successful' };
  }

  async sendPasswordChangeOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = await this.otpService.createOtp(email, 'PASSWORD_CHANGE');
    await this.otpService.sendOtpEmail(email, otp, 'Password Change');

    return { message: 'OTP sent to email' };
  }

  async changePassword(email: string, otp: string, oldPassword: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await this.otpService.verifyOtp(email, otp, 'PASSWORD_CHANGE');
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const passwordValid = await bcrypt.compare(oldPassword, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(email, hashedPassword);

    return { message: 'Password changed successfully' };
  }
}
