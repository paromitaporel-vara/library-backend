import { IsUUID, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateBorrowDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  bookId: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}
