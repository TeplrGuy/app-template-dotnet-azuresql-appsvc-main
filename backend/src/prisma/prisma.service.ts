import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // Allow running tests and linting without a configured database.
    if (!process.env.SQLSERVER_CONNECTION_STRING) return;
    await this.$connect();
  }

  async onModuleDestroy() {
    if (!process.env.SQLSERVER_CONNECTION_STRING) return;
    await this.$disconnect();
  }
}
