import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Courses (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/courses returns array', async () => {
    await request(app.getHttpServer())
      .get('/api/courses')
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(Array.isArray(body)).toBe(true);
        if (Array.isArray(body) && body.length > 0) {
          const first = body[0] as Record<string, unknown>;
          expect(first).toHaveProperty('courseId');
          expect(first).toHaveProperty('title');
          expect(first).toHaveProperty('credits');
        }
      });
  });
});
