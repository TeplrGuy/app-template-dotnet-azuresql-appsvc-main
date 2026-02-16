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

  constructor() {
    const connStr = process.env.SQLSERVER_CONNECTION_STRING;
    // If using AAD managed identity, the connection string won't have user/password
    // and Prisma will be configured with the token at init time
    super(connStr ? { datasources: { db: { url: connStr } } } : {});
  }

  async onModuleInit() {
    const connStr = process.env.SQLSERVER_CONNECTION_STRING;
    if (!connStr) {
      this.logger.warn(
        'SQLSERVER_CONNECTION_STRING not set — skipping DB connection',
      );
      return;
    }

    // If using AAD auth, acquire token and inject into connection string
    if (connStr.includes('authentication=ActiveDirectoryManagedIdentity')) {
      await this.connectWithAadToken(connStr);
      return;
    }

    // Standard connection (SQL auth or other)
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
          this.logger.error(
            'All DB connection attempts exhausted — app will start without DB',
          );
        }
      }
    }
  }

  private async connectWithAadToken(connStr: string) {
    try {
      const { DefaultAzureCredential } = await import('@azure/identity');
      const credential = new DefaultAzureCredential();
      const tokenResponse = await credential.getToken(
        'https://database.windows.net/.default',
      );
      this.logger.log('Acquired AAD token for Azure SQL');

      // Build a new connection string with the token as password
      // Remove the authentication= param and add user/password
      const cleanStr = connStr
        .replace(/;?authentication=[^;]*/i, '')
        .replace(/;?$/, '');
      const tokenConnStr = `${cleanStr};user=token;password=${tokenResponse.token}`;

      // Re-initialize Prisma with the token-injected connection string
      // PrismaClient can't change datasource after construction,
      // so we set the env var and reconnect
      process.env.SQLSERVER_CONNECTION_STRING = tokenConnStr;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          await this.$disconnect().catch(() => {});
          // Reconnect with new env var (Prisma reads it from datasource url)
          await this.$connect();
          this.logger.log('Connected to Azure SQL via AAD managed identity');
          return;
        } catch (err) {
          this.logger.warn(
            `AAD DB connect attempt ${attempt}/${this.maxRetries} failed: ${err}`,
          );
          if (attempt < this.maxRetries) {
            await this.sleep(this.retryDelayMs * Math.pow(2, attempt - 1));
          }
        }
      }
      this.logger.error(
        'All AAD DB connection attempts exhausted — app will start without DB',
      );
    } catch (err) {
      this.logger.warn(
        `AAD token acquisition failed — app will start without DB: ${err}`,
      );
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
