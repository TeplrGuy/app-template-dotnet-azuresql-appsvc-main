import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DefaultAzureCredential } from '@azure/identity';

/**
 * Build a Prisma-compatible connection string using an AAD access token.
 * Input format:  sqlserver://host:port;database=...;encrypt=...;authentication=ActiveDirectory...
 * Output format: sqlserver://host:port;database=...;encrypt=...;user=token;password=<jwt>
 */
async function buildTokenConnectionString(
  original: string,
): Promise<string> {
  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken(
    'https://database.windows.net/.default',
  );

  // Strip the authentication= param and add user/password with the token
  const cleaned = original
    .replace(/;authentication=[^;]*/i, '')
    .replace(/;trustServerCertificate=[^;]*/i, '');

  return `${cleaned};trustServerCertificate=false;user=token;password=${tokenResponse.token}`;
}

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
    const connStr = process.env.SQLSERVER_CONNECTION_STRING;
    if (!connStr) {
      this.logger.warn(
        'SQLSERVER_CONNECTION_STRING not set — skipping DB connection',
      );
      return;
    }

    // If using AAD managed identity, swap the connection string to use a token
    if (connStr.includes('authentication=ActiveDirectory')) {
      try {
        const tokenConnStr = await buildTokenConnectionString(connStr);
        // Prisma reads the URL from the env var; override it for this process
        process.env.SQLSERVER_CONNECTION_STRING = tokenConnStr;
        this.logger.log(
          'Obtained AAD token for database authentication',
        );
      } catch (err) {
        this.logger.error(`Failed to obtain AAD token: ${err}`);
        this.logger.warn('App will start without DB connectivity');
        return;
      }
    }

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
          // Don't throw — let the app start; endpoints will fail gracefully
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
