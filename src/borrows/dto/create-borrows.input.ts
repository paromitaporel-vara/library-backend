import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateBorrowDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  bookId: string;
}
