import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = Number(
    process.env.PRISMA_RETRY_ATTEMPTS ?? '3',
  );
  private readonly retryDelayMs = Number(
    process.env.PRISMA_RETRY_DELAY_MS ?? '500',
  );

  async onModuleInit() {
    // Allow running tests and linting without a configured database.
    if (!process.env.SQLSERVER_CONNECTION_STRING) return;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Connected to database');
        return;
      } catch (err) {
        this.logger.warn(
          `DB connect attempt ${attempt}/${this.maxRetries} failed: ${err}`,
        );
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelayMs * Math.pow(2, attempt - 1));
        } else {
          this.logger.error('All DB connection attempts exhausted');
          throw err;
        }
      }
    }
  }

  async onModuleDestroy() {
    if (!process.env.SQLSERVER_CONNECTION_STRING) return;
    await this.$disconnect();
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
