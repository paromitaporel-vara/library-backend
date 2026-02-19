import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [OtpService, PrismaService],
  exports: [OtpService],
})
export class OtpModule {}
