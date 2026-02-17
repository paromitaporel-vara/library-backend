import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-users.input';
import { UpdateUserDto } from './dto/update-users.input';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from 'prisma/generated/client';
import { SafeUser } from './types/user.types';


@Injectable()
export class UsersService {

constructor(private prisma: PrismaService) {}


    async create(dto: CreateUserDto) {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
      },
    });

    const { password: _, ...safeUser } = user;

    return safeUser;
}


async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOne(id: string): Promise<Prisma.UserGetPayload<{select: typeof SafeUser}> | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      select: SafeUser,
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<User> {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}