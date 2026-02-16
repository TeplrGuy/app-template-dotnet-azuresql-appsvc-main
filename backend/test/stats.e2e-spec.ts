import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { StatsService } from '../src/stats/stats.service';

describe('Stats (e2e)', () => {
  let app: INestApplication<App>;

  const statsService: Partial<StatsService> = {
    getStats: jest.fn().mockResolvedValue({
      totalStudents: 156,
      activeCourses: 42,
      facultyMembers: 28,
      totalEnrollments: 1250,
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StatsService)
      .useValue(statsService)
      .compile();

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

  it('GET /api/stats returns 200 with expected shape', async () => {
    await request(app.getHttpServer())
      .get('/api/stats')
      .expect(200)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toHaveProperty('totalStudents');
        expect(body).toHaveProperty('activeCourses');
        expect(body).toHaveProperty('facultyMembers');
        expect(body).toHaveProperty('totalEnrollments');
      });
  });
});
