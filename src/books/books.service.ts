import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-books.input';
import { UpdateBookDto } from './dto/update-books.input';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  
  create(dto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        title: dto.title,
        author: dto.author,
        publisher: dto.publisher,
        copies: dto.copies || 1,
        isAvailable: true,
      },
    });
  }

  findAll() {
    return this.prisma.book.findMany({
      include: {
        borrows: {
          where: { returnedAt: null },
        },
      },
    });
  }

  
  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        borrows: {
          where: { returnedAt: null },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  
  async update(id: string, dto: UpdateBookDto) {
    
    await this.findOne(id);

    return this.prisma.book.update({
      where: { id },
      data: dto,
    });
  }

  
  async remove(id: string) {
  await this.findOne(id);

  const borrowExists = await this.prisma.borrow.findFirst({
    where: { bookId: id },
  });

  if (borrowExists) {
    throw new BadRequestException(
      'Cannot delete book. It has borrow history.',
    );
  }

  return this.prisma.book.delete({
    where: { id },
  });
}

  async search(query: string) {
    if (!query) {
      return this.findAll();
    }

    return this.prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
          { publisher: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        borrows: {
          where: { returnedAt: null },
        },
      },
    });
  }

}
