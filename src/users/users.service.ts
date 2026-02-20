import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-users.input';
import { UpdateUserDto } from './dto/update-users.input';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name || '',
        role: 'USER',
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        borrows: true,
      },
    });

    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        borrows: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.email) updateData.email = dto.email;
    if (dto.role) updateData.role = dto.role;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...result } = user;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check for active borrows (unreturned books)
    const activeBorrows = await this.prisma.borrow.findMany({
      where: { 
        userId: id,
        returnedAt: null,
      },
    });

    if (activeBorrows.length > 0) {
      throw new ConflictException('Cannot delete user with active borrows');
    }

    // Delete returned borrows first
    await this.prisma.borrow.deleteMany({
      where: { userId: id },
    });

    const user = await this.prisma.user.delete({
      where: { id },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async search(query: string) {
    if (!query) {
      return this.findAll();
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        borrows: true,
      },
    });

    return users.map(({ password, ...user }) => user);
  }

  async updatePassword(email: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }

  async updateProfile(id: string, name?: string, profilePhoto?: string) {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...result } = user;
    return result;
  }

  async updateEmail(oldEmail: string, newEmail: string) {
    const user = await this.prisma.user.update({
      where: { email: oldEmail },
      data: { email: newEmail },
    });

    const { password: _, ...result } = user;
    return result;
  }
}
