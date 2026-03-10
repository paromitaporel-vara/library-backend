import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-users.input';
import { UpdateUserDto } from './dto/update-users.input';
import { PaginatedResponse } from '../common/dto/pagination-query.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

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

  private enrichUserWithFine(user: any) {
    const { password, ...rest } = user;
    const totalFine = (rest.borrows || []).reduce(
      (sum: number, borrow: any) => sum + this.calculateFine(borrow),
      0,
    );
    return { ...rest, fine: totalFine };
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          borrows: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((user) => this.enrichUserWithFine(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private calculateFine(borrow: any): number {
    const referenceDate = borrow.returnedAt
      ? new Date(borrow.returnedAt)
      : new Date();

    const dueDate = new Date(borrow.dueDate);

    if (referenceDate <= dueDate) return 0;

    const daysLate = Math.ceil(
      (referenceDate.getTime() - dueDate.getTime()) /
      (1000 * 60 * 60 * 24),
    );

    if (daysLate <= 7) return daysLate * 5;

    return 7 * 5 + (daysLate - 7) * 15;
  }

  private calculateStatus(borrow: any): string {
    if (borrow.returnedAt) {
      return 'RETURNED';
    }
    return new Date(borrow.dueDate) < new Date() ? 'OVERDUE' : 'ACTIVE';
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

    const enrichedBorrows = result.borrows.map((borrow: any) => ({
      ...borrow,
      liveFine: this.calculateFine(borrow),
      status: this.calculateStatus(borrow),
    }));

    const totalFine = enrichedBorrows.reduce(
      (sum: number, b: any) => sum + (b.liveFine || 0),
      0,
    );

    return { ...result, borrows: enrichedBorrows, totalFine };
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

  async search(query: string, page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    if (!query) {
      return this.findAll(page, limit);
    }

    const where = {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          borrows: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.enrichUserWithFine(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchForBorrow(query: string) {
    const where = query
      ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
        ],
      }
      : undefined;

    const users = await this.prisma.user.findMany({
      where,
      include: {
        borrows: true,
      },
    });

    return users.map((user) => this.enrichUserWithFine(user));
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
