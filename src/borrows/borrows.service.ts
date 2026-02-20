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
        include: {
          borrows: {
            where: { returnedAt: null },
          },
        },
      });

      if (!book) {
        throw new BadRequestException('Book not found');
      }

      const activeBorrows = book.borrows.length;
      if (activeBorrows >= book.copies) {
        throw new BadRequestException('No copies available');
      }

      const isAvailable = activeBorrows + 1 < book.copies;
      await tx.book.update({
        where: { id: dto.bookId },
        data: { isAvailable },
      });

      return tx.borrow.create({
        data: {
          userId: dto.userId,
          bookId: dto.bookId,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    });
  }


  async returnBook(borrowId: string) {
    return this.prisma.$transaction(async (tx) => {
      const borrow = await tx.borrow.findUnique({
        where: { id: borrowId },
        include: { book: true, user: true },
      });

      if (!borrow) {
        throw new NotFoundException('Borrow record not found');
      }

      if (borrow.returnedAt) {
        throw new BadRequestException('Book already returned');
      }

      // Calculate fine
      const returnDate = new Date();
      const dueDate = new Date(borrow.dueDate);
      let fine = 0;

      if (returnDate > dueDate) {
        const daysLate = Math.ceil(
          (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysLate <= 7) {
          fine = daysLate * 5;
        } else {
          fine = 7 * 5 + (daysLate - 7) * 15;
        }

        // Update user's fine
        await tx.user.update({
          where: { id: borrow.userId },
          data: { fine: { increment: fine } },
        });
      }

      // Check if book should be marked as available
      const book = await tx.book.findUnique({
        where: { id: borrow.bookId },
        include: {
          borrows: {
            where: { returnedAt: null, id: { not: borrowId } },
          },
        },
      });

      if (book) {
        const activeBorrows = book.borrows.length;
        const isAvailable = activeBorrows < book.copies;

        await tx.book.update({
          where: { id: borrow.bookId },
          data: { isAvailable },
        });
      }

      return tx.borrow.update({
        where: { id: borrowId },
        data: {
          returnedAt: new Date(),
        },
      });
    });
  }


  async findAll(sortOrder?: string) {
    const borrows = await this.prisma.borrow.findMany({
      include: {
        user: true,
        book: true,
      },
      orderBy: {
        borrowedAt: sortOrder === 'asc' ? 'asc' : 'desc',
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

  async search(query: string, sortOrder?: string) {
    if (!query) {
      return this.findAll(sortOrder);
    }

    const borrows = await this.prisma.borrow.findMany({
      where: {
        OR: [
          { book: { title: { contains: query, mode: 'insensitive' } } },
          { book: { author: { contains: query, mode: 'insensitive' } } },
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: true,
        book: true,
      },
      orderBy: {
        borrowedAt: sortOrder === 'asc' ? 'asc' : 'desc',
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
