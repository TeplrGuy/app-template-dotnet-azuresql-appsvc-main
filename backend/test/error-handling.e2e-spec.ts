import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

@Controller('test-errors')
class TestErrorController {
  @Get('not-found')
  notFound() {
    throw new HttpException('Not found', HttpStatus.NOT_FOUND);
  }

  @Get('bad-request')
  badRequest() {
    throw new HttpException('Invalid input', HttpStatus.BAD_REQUEST);
  }

  @Get('service-unavailable')
  serviceUnavailable() {
    throw new HttpException('DB offline', HttpStatus.SERVICE_UNAVAILABLE);
  }

  @Get('prisma-not-found')
  prismaNotFound() {
    throw Object.assign(new Error('Prisma P2025'), { code: 'P2025' });
  }

  @Get('prisma-connection')
  prismaConnection() {
    throw Object.assign(new Error('Prisma P1001'), { code: 'P1001' });
  }
}

@Module({ controllers: [TestErrorController] })
class TestErrorModule {}

describe('Error Handling (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [TestErrorModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 404 for HttpException not-found', async () => {
    await request(app.getHttpServer())
      .get('/api/test-errors/not-found')
      .expect(404)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(404);
        expect(body.message).toBe('Not found');
      });
  });

  it('returns 400 for bad request', async () => {
    await request(app.getHttpServer())
      .get('/api/test-errors/bad-request')
      .expect(400);
  });

  it('returns 503 with retryable for service unavailable', async () => {
    await request(app.getHttpServer())
      .get('/api/test-errors/service-unavailable')
      .expect(503)
      .expect(({ body }) => {
        expect(body.retryable).toBe(true);
      });
  });

  it('maps Prisma P2025 to 404', async () => {
    await request(app.getHttpServer())
      .get('/api/test-errors/prisma-not-found')
      .expect(404)
      .expect(({ body }) => {
        expect(body.message).toBe('Record not found');
      });
  });

  it('maps Prisma P1001 to 503 retryable', async () => {
    await request(app.getHttpServer())
      .get('/api/test-errors/prisma-connection')
      .expect(503)
      .expect(({ body }) => {
        expect(body.retryable).toBe(true);
      });
  });
});
