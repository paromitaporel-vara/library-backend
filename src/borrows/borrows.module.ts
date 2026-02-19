import { Module } from '@nestjs/common';
import { BorrowsController } from './borrows.controller';
import { BorrowsService } from './borrows.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [BorrowsController],
  providers: [BorrowsService, PrismaService]
})
export class BorrowsModule {}
