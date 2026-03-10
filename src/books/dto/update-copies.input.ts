import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateCopiesDto {
  @IsNotEmpty()
  @IsInt()
  change: number; // positive to increase, negative to decrease
}
