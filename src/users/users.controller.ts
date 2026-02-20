import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-users.input';
import { UpdateUserDto } from './dto/update-users.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OtpService } from '../otp/otp.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.usersService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('profile/send-email-change-otp')
  @UseGuards(JwtAuthGuard)
  async sendEmailChangeOtp(
    @Request() req: any,
    @Body() body: { newEmail: string },
  ) {
    if (!body.newEmail) {
      throw new BadRequestException('New email is required');
    }
    const otp = await this.otpService.createOtp(body.newEmail, 'EMAIL_CHANGE');
    await this.otpService.sendOtpEmail(body.newEmail, otp, 'Email Change');
    return { message: 'OTP sent to new email' };
  }

  @Post('profile/change-email')
  @UseGuards(JwtAuthGuard)
  async changeEmail(
    @Request() req: any,
    @Body() body: { otp: string; newEmail: string },
  ) {
    // Verify OTP against the new email (not the current email)
    const response = await fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:3000'}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.newEmail, otp: body.otp, purpose: 'EMAIL_CHANGE' }),
    });
    if (!response.ok) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    return this.usersService.updateEmail(req.user.email, body.newEmail);
  }

  @Patch('profile/update')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: any,
    @Body() body: { name?: string },
  ) {
    return this.usersService.updateProfile(req.user.sub, body.name);
  }

  @Post('profile/upload-photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadProfilePhoto(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const photoUrl = `/uploads/profiles/${file.filename}`;
    return this.usersService.updateProfile(req.user.sub, undefined, photoUrl);
  }
}
