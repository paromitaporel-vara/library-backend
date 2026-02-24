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

  // Helper method to enrich book response with computed fields
  private enrichBookResponse(book: any) {
    const availableCopies = book.copies - (book.borrows?.length || 0);
    return {
      ...book,
      availableCopies,
      isAvailable: availableCopies > 0,
    };
  }

  // Helper method to enrich multiple book responses
  private enrichBooksResponse(books: any[]) {
    return books.map((book) => this.enrichBookResponse(book));
  }

  create(dto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        title: dto.title,
        author: dto.author,
        publisher: dto.publisher,
        copies: dto.copies || 1,
        isAvailable: true,
      },
      include: {
        borrows: {
          where: { returnedAt: null },
        },
      },
    }).then(book => this.enrichBookResponse(book));
  }

  async findAll() {
    const books = await this.prisma.book.findMany({
      include: {
        borrows: {
          where: { returnedAt: null },
        },
      },
    });
    return this.enrichBooksResponse(books);
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

    return this.enrichBookResponse(book);
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.findOne(id);

    const updated = await this.prisma.book.update({
      where: { id },
      data: dto,
      include: {
        borrows: {
          where: { returnedAt: null },
        },
      },
    });

    return this.enrichBookResponse(updated);
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

    const books = await this.prisma.book.findMany({
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

    return this.enrichBooksResponse(books);
  }

  async searchTitles(query: string, author?: string, publisher?: string) {
    let where: any = {};
    
    if (query) {
      where.title = { contains: query, mode: 'insensitive' };
    }
    
    if (author) {
      where.author = author;
    }
    
    if (publisher) {
      where.publisher = publisher;
    }

    const books = await this.prisma.book.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: { title: true },
      distinct: ['title'],
    });

    return books;
  }

  async searchAuthors(query: string, title?: string, publisher?: string) {
    let where: any = {};
    
    if (query) {
      where.author = { contains: query, mode: 'insensitive' };
    }
    
    if (title) {
      where.title = title;
    }
    
    if (publisher) {
      where.publisher = publisher;
    }

    const books = await this.prisma.book.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: { author: true },
      distinct: ['author'],
    });

    return books;
  }

  async searchPublishers(query: string, title?: string, author?: string) {
    let where: any = {};
    
    if (query) {
      where.publisher = { contains: query, mode: 'insensitive' };
    }
    
    if (title) {
      where.title = title;
    }
    
    if (author) {
      where.author = author;
    }

    const books = await this.prisma.book.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: { publisher: true },
      distinct: ['publisher'],
    });

    return books.filter(b => b.publisher);
  }

}
