import { Controller, Post, Body, Patch, Param, Get, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { BorrowsService } from './borrows.service';
import { CreateBorrowDto } from './dto/create-borrows.input';
import { UpdateBorrowDto } from './dto/update-borrows.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';


@Controller('borrows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BorrowsController {
constructor(private readonly borrowsService: BorrowsService) {}


@Get()
  findAll(@Query('sortOrder') sortOrder?: string) {
    return this.borrowsService.findAll(sortOrder);
  }


@Get(':id')
  findOne(@Param('id') id: string) {
    return this.borrowsService.findOne(id);
  }

  

@Post()
borrowBook(@Body() dto: CreateBorrowDto, @Request() req: any) {
  // If user is not admin, force userId to be their own
  if (req.user.role !== 'ADMIN') {
    dto.userId = req.user.sub;
  }
  return this.borrowsService.borrowBook(dto);
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