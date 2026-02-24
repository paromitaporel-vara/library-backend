import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateBorrowByDetailsDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  bookTitle: string;

  @IsString()
  @IsNotEmpty()
  bookAuthor: string;

  @IsString()
  @IsNotEmpty()
  bookPublisher: string;
}
