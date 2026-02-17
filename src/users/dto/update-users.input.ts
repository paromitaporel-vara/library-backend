import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-users.input';


export class UpdateUserDto extends PartialType(CreateUserDto) {}