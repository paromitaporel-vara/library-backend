import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-books.input';


export class UpdateBookDto extends PartialType(CreateBookDto) {}