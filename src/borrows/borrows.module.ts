import { Module } from '@nestjs/common';
import { BorrowsController } from './borrows.controller';
import { BorrowsService } from './borrows.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [BorrowsController],
  providers: [BorrowsService, PrismaService]
})
export class BorrowsModule {}
