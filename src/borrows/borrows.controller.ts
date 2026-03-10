import { Controller, Post, Body, Patch, Param, Get, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { BorrowsService } from './borrows.service';
import { CreateBorrowDto } from './dto/create-borrows.input';
import { CreateBorrowByDetailsDto } from './dto/create-borrow-by-details.input';
import { UpdateBorrowDto } from './dto/update-borrows.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';


@Controller('borrows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BorrowsController {
constructor(private readonly borrowsService: BorrowsService) {}

@Get('search')
  search(@Query('q') query: string, @Query('sortOrder') sortOrder?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.borrowsService.search(query, sortOrder, page ? +page : 1, limit ? +limit : 10);
  }

@Get()
  findAll(@Query('sortOrder') sortOrder?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.borrowsService.findAll(sortOrder, page ? +page : 1, limit ? +limit : 10);
  }

@Get(':id')
  findOne(@Param('id') id: string) {
    return this.borrowsService.findOne(id);
  }

@Post()
borrowBook(@Body() dto: CreateBorrowDto, @Request() req: any) {
  return this.borrowsService.borrowBook(dto, req.user.role, req.user.sub);
}

@Post('by-details')
borrowBookByDetails(@Body() dto: CreateBorrowByDetailsDto, @Request() req: any) {
  return this.borrowsService.borrowBookByDetails(dto, req.user.role, req.user.sub);
}

@Patch(':id')
@Roles('ADMIN')
update(
  @Param('id') id: string,
  @Body() dto: UpdateBorrowDto,
) {
  return this.borrowsService.update(id, dto);
}

@Patch(':id/return')
@Roles('ADMIN')
  returnBook(@Param('id') id: string) {
    return this.borrowsService.returnBook(id);
  }

@Delete(':id')
@Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.borrowsService.remove(id);
}
}