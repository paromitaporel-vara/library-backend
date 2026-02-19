import { IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';


export class CreateBookDto {
@IsNotEmpty()
title: string;


@IsNotEmpty()
author: string;

@IsOptional()
publisher?: string;

@IsOptional()
@IsInt()
@Min(1)
copies?: number;
}