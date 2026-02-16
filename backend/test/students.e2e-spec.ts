import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { StudentsService } from '../src/students/students.service';

describe('Students (e2e)', () => {
  let app: INestApplication<App>;

  const studentsService: Partial<StudentsService> = {
    list: jest.fn().mockResolvedValue({
      page: 1,
      pageSize: 20,
      totalCount: 1,
      items: [
        {
          studentId: 1,
          firstName: 'Ada',
          lastName: 'Lovelace',
          enrollmentDate: '2025-01-15T00:00:00.000Z',
        },
      ],
    }),
    get: jest.fn().mockResolvedValue({
      studentId: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      enrollmentDate: '2025-01-15T00:00:00.000Z',
    }),
    create: jest.fn().mockResolvedValue({
      studentId: 2,
      firstName: 'Grace',
      lastName: 'Hopper',
      enrollmentDate: '2025-01-15T00:00:00.000Z',
    }),
    update: jest.fn().mockResolvedValue({
      studentId: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      enrollmentDate: '2025-01-15T00:00:00.000Z',
    }),
    remove: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StudentsService)
      .useValue(studentsService)
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

  it('GET /api/students returns paged list', async () => {
    type PagedStudents = {
      totalCount: number;
      items: Array<{ studentId: number }>;
    };

    await request(app.getHttpServer())
      .get('/api/students?page=1&pageSize=20')
      .expect(200)
      .expect(({ body }: { body: PagedStudents }) => {
        expect(body.totalCount).toBe(1);
        expect(body.items[0].studentId).toBe(1);
      });
  });

  it('POST /api/students validates body', async () => {
    await request(app.getHttpServer())
      .post('/api/students')
      .send({})
      .expect(400);
  });
});
