import { Controller, Post, Body, Patch, Param, Get, Delete } from '@nestjs/common';
import { BorrowsService } from './borrows.service';
import { CreateBorrowDto } from './dto/create-borrows.input';
import { UpdateBorrowDto } from './dto/update-borrows.input';


@Controller('borrows')
export class BorrowsController {
constructor(private readonly borrowsService: BorrowsService) {}


@Get()
  findAll() {
    return this.borrowsService.findAll();
  }


@Get(':id')
  findOne(@Param('id') id: string) {
    return this.borrowsService.findOne(id);
  }

  

@Post()
borrowBook(@Body() dto: CreateBorrowDto) {
return this.borrowsService.borrowBook(dto);
}

@Patch(':id')
update(
  @Param('id') id: string,
  @Body() dto: UpdateBorrowDto,
) {
  return this.borrowsService.update(id, dto);
}


@Patch(':id/return')
  returnBook(@Param('id') id: string) {
    return this.borrowsService.returnBook(id);
  }

@Delete(':id')
  remove(@Param('id') id: string) {
    return this.borrowsService.remove(id);
}

}