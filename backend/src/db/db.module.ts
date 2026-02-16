import { Global, Logger, Module, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { seed } from './seed/seed';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DbModule implements OnModuleInit {
  private readonly logger = new Logger(DbModule.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (!process.env.SQLSERVER_CONNECTION_STRING) return;
    try {
      await seed(this.prisma);
    } catch (err) {
      this.logger.warn(`Database seeding skipped or failed: ${err}`);
    }
  }
}
