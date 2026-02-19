import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';
import { BorrowsModule } from './borrows/borrows.module';
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { EmailModule } from './email/email.module';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    BooksModule,
    BorrowsModule,
    AuthModule,
    OtpModule,
    EmailModule,
    MulterModule.register({
      dest: './uploads',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads', 'profiles'),
      serveRoot: "/uploads/profiles/"
    }),

  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
