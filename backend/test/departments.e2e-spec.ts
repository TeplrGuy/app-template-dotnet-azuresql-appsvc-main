import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DepartmentsService } from '../src/departments/departments.service';

describe('Departments (e2e)', () => {
  let app: INestApplication<App>;

  const departmentsService: Partial<DepartmentsService> = {
    list: jest.fn().mockResolvedValue([
      {
        departmentId: 1,
        name: 'Computer Science',
        courseCount: 12,
        instructorCount: 2,
      },
    ]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DepartmentsService)
      .useValue(departmentsService)
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

  it('GET /api/departments returns 200 and array', async () => {
    await request(app.getHttpServer())
      .get('/api/departments')
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(Array.isArray(body)).toBe(true);
      });
  });
});
