import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorrowDto } from './dto/create-borrows.input';
import { CreateBorrowByDetailsDto } from './dto/create-borrow-by-details.input';
import { UpdateBorrowDto } from './dto/update-borrows.input';
import { PaginatedResponse } from '../common/dto/pagination-query.dto';

@Injectable()
export class BorrowsService {
  constructor(private prisma: PrismaService) { }

  private async getAvailableCopies(bookId: string): Promise<number> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        borrows: {
          where: { returnedAt: null },
        },
      },
    });

    if (!book) return 0;
    return book.copies - book.borrows.length;
  }

  private calculateStatus(borrow: any): string {
    if (borrow.returnedAt) {
      return 'RETURNED';
    }
    return new Date(borrow.dueDate) < new Date() ? 'OVERDUE' : 'ACTIVE';
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

  private async enrichBorrowResponse(borrow: any) {
    const availableCopies = await this.getAvailableCopies(borrow.bookId);
    return {
      ...borrow,
      status: this.calculateStatus(borrow),
      liveFine: this.calculateFine(borrow),
      book: borrow.book
        ? {
          ...borrow.book,
          availableCopies,
          isAvailable: availableCopies > 0,
        }
        : undefined,
    };
  }

  private async enrichBorrowsResponse(borrows: any[]) {
    return Promise.all(borrows.map((b) => this.enrichBorrowResponse(b)));
  }

  async borrowBook(dto: CreateBorrowDto, userRole: string, userId: string) {
    if (userRole !== 'ADMIN' && userId !== dto.userId) {
      throw new ForbiddenException('You can only borrow books for yourself');
    }

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

      const borrow = await tx.borrow.create({
        data: {
          userId: dto.userId,
          bookId: dto.bookId,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        include: {
          book: true,
          user: true,
        },
      });

      return this.enrichBorrowResponse(borrow);
    });
  }

  async borrowBookByDetails(dto: CreateBorrowByDetailsDto, userRole: string, userId: string) {
    const targetUserId = userRole !== 'ADMIN' ? userId : (dto.userId || userId);


    if (userRole !== 'ADMIN' && userId !== targetUserId) {
      throw new ForbiddenException('You can only borrow books for yourself');
    }

    return this.prisma.$transaction(async (tx) => {
      const book = await tx.book.findFirst({
        where: {
          title: dto.bookTitle,
          author: dto.bookAuthor,
          publisher: dto.bookPublisher,
        },
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
        throw new BadRequestException('No copies available for this book');
      }

      const isAvailable = activeBorrows + 1 < book.copies;
      await tx.book.update({
        where: { id: book.id },
        data: { isAvailable },
      });

      const borrow = await tx.borrow.create({
        data: {
          userId: targetUserId,
          bookId: book.id,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        include: {
          book: true,
          user: true,
        },
      });

      return this.enrichBorrowResponse(borrow);
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

      const returnedAt = new Date();

      await tx.borrow.update({
        where: { id: borrowId },
        data: { returnedAt },
      });

      // Calculate and persist the fine to the user's record
      const fine = this.calculateFine({ ...borrow, returnedAt });
      if (fine > 0) {
        await tx.user.update({
          where: { id: borrow.userId },
          data: { fine: { increment: fine } },
        });
      }

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

      const updatedBorrow = await tx.borrow.findUnique({
        where: { id: borrowId },
        include: { book: true, user: true },
      });

      return this.enrichBorrowResponse(updatedBorrow);
    });
  }

  async findAll(sortOrder?: string, page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;
    const [borrows, total] = await Promise.all([
      this.prisma.borrow.findMany({
        skip,
        take: limit,
        include: {
          user: true,
          book: true,
        },
        orderBy: {
          borrowedAt: sortOrder === 'asc' ? 'asc' : 'desc',
        },
      }),
      this.prisma.borrow.count(),
    ]);

    return {
      data: await this.enrichBorrowsResponse(borrows),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(query: string, sortOrder?: string, page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    if (!query) {
      return this.findAll(sortOrder, page, limit);
    }

    const where = {
      OR: [
        { book: { title: { contains: query, mode: 'insensitive' as const } } },
        { book: { author: { contains: query, mode: 'insensitive' as const } } },
        { user: { name: { contains: query, mode: 'insensitive' as const } } },
        { user: { email: { contains: query, mode: 'insensitive' as const } } },
      ],
    };

    const skip = (page - 1) * limit;
    const [borrows, total] = await Promise.all([
      this.prisma.borrow.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          book: true,
        },
        orderBy: {
          borrowedAt: sortOrder === 'asc' ? 'asc' : 'desc',
        },
      }),
      this.prisma.borrow.count({ where }),
    ]);

    return {
      data: await this.enrichBorrowsResponse(borrows),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    return this.enrichBorrowResponse(bor);
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

    const updated = await this.prisma.borrow.update({
      where: { id },
      data: {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        book: true,
        user: true,
      },
    });

    return this.enrichBorrowResponse(updated);
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const borrow = await tx.borrow.findUnique({
        where: { id },
        include: {
          book: true,
        },
      });

      if (!borrow) {
        throw new NotFoundException('Borrow record not found');
      }

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
