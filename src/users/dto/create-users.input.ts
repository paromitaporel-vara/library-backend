import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';


export class CreateUserDto {
@IsString()
@IsOptional()
name?: string;


@IsEmail()
email: string;

@IsNotEmpty()
password: string;
}