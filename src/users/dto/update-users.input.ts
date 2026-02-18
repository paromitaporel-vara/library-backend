import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-users.input';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(['USER', 'ADMIN'])
  role?: string;
}