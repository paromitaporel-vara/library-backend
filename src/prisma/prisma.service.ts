import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../prisma/generated/client';


@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        super({
            log: ['query', 'info', 'warn', 'error'],
        });
    }
} 