import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthDto } from './create-auth';

export class UpdateUserDto extends PartialType(CreateAuthDto) {}
