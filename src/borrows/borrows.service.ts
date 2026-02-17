import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorrowDto } from './dto/create-borrows.input';
import { UpdateBorrowDto } from './dto/update-borrows.input';

@Injectable()
export class BorrowsService {
  constructor(private prisma: PrismaService) { }


  async borrowBook(dto: CreateBorrowDto) {
    return this.prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({
        where: { id: dto.bookId },
      });

      if (!book || !book.isAvailable) {
        throw new BadRequestException('Book not available');
      }

      await tx.book.update({
        where: { id: dto.bookId },
        data: { isAvailable: false },
      });

      return tx.borrow.create({
        data: {
          userId: dto.userId,
          bookId: dto.bookId,
          dueDate: new Date(dto.dueDate),
        },
      });
    });
  }


  async returnBook(borrowId: string) {
    return this.prisma.$transaction(async (tx) => {
      const borrow = await tx.borrow.findUnique({
        where: { id: borrowId },
      });

      if (!borrow) {
        throw new NotFoundException('Borrow record not found');
      }

      if (borrow.returnedAt) {
        throw new BadRequestException('Book already returned');
      }

      await tx.book.update({
        where: { id: borrow.bookId },
        data: { isAvailable: true },
      });

      return tx.borrow.update({
        where: { id: borrowId },
        data: {
          returnedAt: new Date()
        },
      });
    });
  }


  async findAll() {
  const borrows = await this.prisma.borrow.findMany({
    include: {
      user: true,
      book: true,
    },
    orderBy: {
      borrowedAt: 'desc',
    },
  });

  return borrows.map((bor) => ({
    ...bor,
    status: bor.returnedAt
      ? 'RETURNED'
      : new Date(bor.dueDate) < new Date()
      ? 'OVERDUE'
      : 'ACTIVE',
  }));
}



  async findOne(id: string) {
  const bor = await this.prisma.borrow.findUnique({
    where: { id },
    include: {
      user: true,
      book: true,
    },
  });

  if (!bor) {
    throw new NotFoundException('Borrow record not found');
  }

  return {
    ...bor,
    status: bor.returnedAt
      ? 'RETURNED'
      : new Date(bor.dueDate) < new Date()
      ? 'OVERDUE'
      : 'ACTIVE',
  };
}


  async update(id: string, dto: UpdateBorrowDto) {
  const borrow = await this.prisma.borrow.findUnique({
    where: { id },
  });

  if (!borrow) {
    throw new NotFoundException('Borrow record not found');
  }

  if (borrow.returnedAt) {
    throw new BadRequestException('Cannot edit a returned borrow');
  }

  return this.prisma.borrow.update({
    where: { id },
    data: {
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    },
  });
}



  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const borrow = await this.findOne(id);

      if (!borrow.returnedAt) {
        await tx.book.update({
          where: { id: borrow.bookId },
          data: { isAvailable: true },
        });
      }

      return tx.borrow.delete({
        where: { id },
      });
    });
  }
}
